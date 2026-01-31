#!/bin/sh
# ============================================================================
# ForgeComply 360 - Docker Entrypoint
# Initializes database and pulls AI model on first run
# ============================================================================

set -e

DATA_DIR="${DATA_DIR:-/data}"
OLLAMA_URL="${OLLAMA_URL:-http://ollama:11434}"
OLLAMA_MODEL="${OLLAMA_MODEL:-llama3.1:8b}"

echo "╔══════════════════════════════════════════════════════════╗"
echo "║   ForgeComply 360 - Starting API Server                  ║"
echo "║   Forge Cyber Defense - SDVOSB                           ║"
echo "╚══════════════════════════════════════════════════════════╝"

# Ensure data directories exist
mkdir -p "$DATA_DIR" "$DATA_DIR/kv" "$DATA_DIR/evidence"

# Pull Ollama model (non-blocking, in background)
echo "[init] Checking Ollama model availability..."
(
  # Wait for Ollama to be ready
  for i in $(seq 1 30); do
    if wget -qO- "$OLLAMA_URL/api/tags" >/dev/null 2>&1; then
      echo "[init] Ollama is ready, pulling model '$OLLAMA_MODEL'..."
      wget -qO- --post-data="{\"name\":\"$OLLAMA_MODEL\"}" \
        --header="Content-Type: application/json" \
        "$OLLAMA_URL/api/pull" >/dev/null 2>&1 || true
      echo "[init] Model '$OLLAMA_MODEL' ready."
      break
    fi
    echo "[init] Waiting for Ollama... ($i/30)"
    sleep 2
  done
) &

# Start the Node.js server (database init happens in server.js)
echo "[init] Starting API server..."
exec "$@"
