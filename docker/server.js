// ============================================================================
// FORGECOMPLY 360 - ON-PREM / DOCKER SERVER
// Wraps the Cloudflare Workers API with Node.js shims for D1, KV, R2, and AI
// Forge Cyber Defense - SDVOSB
// ============================================================================

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import Database from 'better-sqlite3';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT || '8787');
const DATA_DIR = process.env.DATA_DIR || '/data';
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://ollama:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.1:8b';

// ============================================================================
// DATABASE INITIALIZATION
// ============================================================================

const DB_PATH = path.join(DATA_DIR, 'forge.db');
const KV_DIR = path.join(DATA_DIR, 'kv');
const R2_DIR = path.join(DATA_DIR, 'evidence');

// Ensure data directories exist
[DATA_DIR, KV_DIR, R2_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const sqlite = new Database(DB_PATH, { verbose: process.env.DEBUG ? console.log : undefined });
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

// Run migrations on first start
function initDatabase() {
  const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
  const seedPath = path.join(__dirname, '..', 'database', 'seed.sql');
  const expandedSeedPath = path.join(__dirname, '..', 'database', 'seed-controls-expanded.sql');

  if (fs.existsSync(schemaPath)) {
    console.log('[init] Running schema migrations...');
    sqlite.exec(fs.readFileSync(schemaPath, 'utf-8'));
  }
  if (fs.existsSync(seedPath)) {
    console.log('[init] Running seed data...');
    sqlite.exec(fs.readFileSync(seedPath, 'utf-8'));
  }
  if (fs.existsSync(expandedSeedPath)) {
    console.log('[init] Running expanded controls seed...');
    sqlite.exec(fs.readFileSync(expandedSeedPath, 'utf-8'));
  }
  console.log('[init] Database ready.');
}

initDatabase();

// ============================================================================
// D1 SHIM - Wraps better-sqlite3 to match Cloudflare D1 API
// ============================================================================

function createD1Shim(db) {
  return {
    prepare(sql) {
      return {
        _sql: sql,
        _bindings: [],
        bind(...args) {
          this._bindings = args;
          return this;
        },
        first(columnName) {
          try {
            const stmt = db.prepare(this._sql);
            const row = stmt.get(...this._bindings);
            if (columnName && row) return row[columnName];
            return row || null;
          } catch (err) {
            console.error('[D1 Shim] first() error:', err.message, '| SQL:', this._sql);
            throw err;
          }
        },
        all() {
          try {
            const stmt = db.prepare(this._sql);
            const results = stmt.all(...this._bindings);
            return { results };
          } catch (err) {
            console.error('[D1 Shim] all() error:', err.message, '| SQL:', this._sql);
            throw err;
          }
        },
        run() {
          try {
            const stmt = db.prepare(this._sql);
            const info = stmt.run(...this._bindings);
            return { success: true, meta: { changes: info.changes, last_row_id: info.lastInsertRowid } };
          } catch (err) {
            console.error('[D1 Shim] run() error:', err.message, '| SQL:', this._sql);
            throw err;
          }
        },
      };
    },
    exec(sql) {
      return db.exec(sql);
    },
    batch(stmts) {
      const transaction = db.transaction(() => {
        return stmts.map(s => {
          if (typeof s === 'string') {
            return db.exec(s);
          }
          // It's a prepared statement shim
          return s.run();
        });
      });
      return transaction();
    },
  };
}

// ============================================================================
// KV SHIM - File-based key-value store
// ============================================================================

function createKVShim(kvDir) {
  function keyToPath(key) {
    // Sanitize key for filesystem
    const safe = Buffer.from(key).toString('base64url');
    return path.join(kvDir, safe + '.json');
  }

  return {
    async get(key, options) {
      const filePath = keyToPath(key);
      if (!fs.existsSync(filePath)) return null;
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      // Check expiration
      if (data.expiration && data.expiration < Date.now() / 1000) {
        fs.unlinkSync(filePath);
        return null;
      }
      if (options?.type === 'json') return JSON.parse(data.value);
      return data.value;
    },
    async put(key, value, options) {
      const filePath = keyToPath(key);
      const data = {
        value: typeof value === 'object' ? JSON.stringify(value) : String(value),
        expiration: options?.expirationTtl ? Math.floor(Date.now() / 1000) + options.expirationTtl : null,
      };
      fs.writeFileSync(filePath, JSON.stringify(data));
    },
    async delete(key) {
      const filePath = keyToPath(key);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    },
    async list(options) {
      const files = fs.readdirSync(kvDir).filter(f => f.endsWith('.json'));
      const keys = files.map(f => {
        const base = f.replace('.json', '');
        return { name: Buffer.from(base, 'base64url').toString() };
      });
      if (options?.prefix) {
        return { keys: keys.filter(k => k.name.startsWith(options.prefix)) };
      }
      return { keys };
    },
  };
}

// ============================================================================
// R2 SHIM - Local filesystem object storage
// ============================================================================

function createR2Shim(r2Dir) {
  function keyToPath(key) {
    const safePath = path.join(r2Dir, ...key.split('/'));
    return safePath;
  }

  return {
    async put(key, body, options) {
      const filePath = keyToPath(key);
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      let buffer;
      if (body instanceof ArrayBuffer) {
        buffer = Buffer.from(body);
      } else if (Buffer.isBuffer(body)) {
        buffer = body;
      } else if (typeof body === 'string') {
        buffer = Buffer.from(body);
      } else {
        buffer = Buffer.from(body);
      }

      fs.writeFileSync(filePath, buffer);

      // Store metadata
      if (options?.customMetadata) {
        fs.writeFileSync(filePath + '.meta.json', JSON.stringify(options.customMetadata));
      }

      return { key };
    },
    async get(key) {
      const filePath = keyToPath(key);
      if (!fs.existsSync(filePath)) return null;

      const body = fs.readFileSync(filePath);
      const metaPath = filePath + '.meta.json';
      const customMetadata = fs.existsSync(metaPath) ? JSON.parse(fs.readFileSync(metaPath, 'utf-8')) : {};

      return {
        body,
        arrayBuffer: async () => body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength),
        text: async () => body.toString('utf-8'),
        customMetadata,
        size: body.length,
        httpMetadata: { contentType: 'application/octet-stream' },
      };
    },
    async delete(key) {
      const filePath = keyToPath(key);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      const metaPath = filePath + '.meta.json';
      if (fs.existsSync(metaPath)) fs.unlinkSync(metaPath);
    },
    async list(options) {
      // Simple implementation
      const results = [];
      function walk(dir, prefix) {
        if (!fs.existsSync(dir)) return;
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.name.endsWith('.meta.json')) continue;
          const fullPath = path.join(dir, entry.name);
          const key = prefix ? `${prefix}/${entry.name}` : entry.name;
          if (entry.isDirectory()) {
            walk(fullPath, key);
          } else {
            results.push({ key, size: fs.statSync(fullPath).size });
          }
        }
      }
      walk(r2Dir, '');
      const filtered = options?.prefix ? results.filter(r => r.key.startsWith(options.prefix)) : results;
      return { objects: filtered };
    },
  };
}

// ============================================================================
// AI SHIM - Ollama integration for air-gapped environments
// ============================================================================

function createAIShim(ollamaUrl, model) {
  return {
    async run(modelName, options) {
      try {
        const messages = options.messages || [];
        const response = await fetch(`${ollamaUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: model,
            messages: messages.map(m => ({ role: m.role, content: m.content })),
            stream: false,
            options: {
              temperature: options.temperature || 0.3,
              num_predict: options.max_tokens || 2048,
            },
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error('[AI Shim] Ollama error:', response.status, errText);
          return { response: `[AI unavailable] Ollama returned ${response.status}. Ensure Ollama is running with model '${model}'.` };
        }

        const data = await response.json();
        return { response: data.message?.content || data.response || '' };
      } catch (err) {
        console.error('[AI Shim] Ollama connection error:', err.message);
        return { response: `[AI unavailable] Cannot connect to Ollama at ${ollamaUrl}. Ensure Ollama is running.` };
      }
    },
  };
}

// ============================================================================
// CRYPTO SHIM - Node.js crypto.subtle compatibility
// ============================================================================

// Workers API uses crypto.subtle which is available in Node 20+ via globalThis.crypto
// Make sure globalThis.crypto is available (Node 20+ has this natively)
if (!globalThis.crypto?.subtle) {
  globalThis.crypto = crypto.webcrypto;
}

// Workers use btoa/atob which are available in Node 20+
if (typeof globalThis.btoa === 'undefined') {
  globalThis.btoa = (str) => Buffer.from(str, 'binary').toString('base64');
  globalThis.atob = (str) => Buffer.from(str, 'base64').toString('binary');
}

// ============================================================================
// IMPORT AND WRAP WORKERS HANDLER
// ============================================================================

// Dynamic import of the Workers entry point
const workerModule = await import('../workers/index.js');
const workerHandler = workerModule.default;

// Build the env object with all shims
const env = {
  DB: createD1Shim(sqlite),
  KV: createKVShim(KV_DIR),
  EVIDENCE_VAULT: createR2Shim(R2_DIR),
  AI: createAIShim(OLLAMA_URL, OLLAMA_MODEL),
  JWT_SECRET: process.env.JWT_SECRET || 'change-this-in-production-please',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  ENVIRONMENT: process.env.ENVIRONMENT || 'on-prem',
};

// ============================================================================
// HTTP SERVER
// ============================================================================

const server = http.createServer(async (req, res) => {
  try {
    // Read request body
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const body = Buffer.concat(chunks);

    // Build a Web API Request object (Workers-compatible)
    const protocol = process.env.HTTPS === 'true' ? 'https' : 'http';
    const host = req.headers.host || `localhost:${PORT}`;
    const url = new URL(req.url, `${protocol}://${host}`);

    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value) headers.set(key, Array.isArray(value) ? value.join(', ') : value);
    }

    const requestInit = {
      method: req.method,
      headers,
    };

    // Only add body for methods that support it
    if (req.method !== 'GET' && req.method !== 'HEAD' && body.length > 0) {
      requestInit.body = body;
    }

    const request = new Request(url.toString(), requestInit);

    // Call the Workers handler
    const response = await workerHandler.fetch(request, env);

    // Write response
    res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
    const responseBody = await response.arrayBuffer();
    res.end(Buffer.from(responseBody));
  } catch (err) {
    console.error('[Server] Unhandled error:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║   ForgeComply 360 - On-Prem API Server                      ║
║   Forge Cyber Defense - SDVOSB                               ║
║                                                              ║
║   Listening on: http://0.0.0.0:${String(PORT).padEnd(29)}║
║   Database:     ${DB_PATH.padEnd(42)}║
║   Ollama:       ${OLLAMA_URL.padEnd(42)}║
║   Environment:  ${(process.env.ENVIRONMENT || 'on-prem').padEnd(42)}║
╚══════════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received, shutting down...');
  sqlite.close();
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('[Server] SIGINT received, shutting down...');
  sqlite.close();
  server.close(() => process.exit(0));
});
