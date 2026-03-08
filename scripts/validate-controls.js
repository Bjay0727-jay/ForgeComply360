#!/usr/bin/env node
// validate-controls.js — Validate generated SQL migration files
// Checks control counts, framework_ids, baseline flags, and crosswalk integrity

const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, '..', 'database');

const CANONICAL_FRAMEWORKS = new Set([
  'nist-800-53-r5', 'fedramp-low', 'fedramp-moderate', 'fedramp-high',
  'nist-800-171-r3', 'cmmc-l2', 'cmmc-l3', 'hipaa', 'soc2-type2', 'stateramp'
]);

let passed = 0;
let failed = 0;

function check(name, condition, detail) {
  if (condition) {
    console.log(`  ✓ ${name}`);
    passed++;
  } else {
    console.log(`  ✗ ${name} — ${detail || 'FAILED'}`);
    failed++;
  }
}

function countInsertLines(filePath) {
  const sql = fs.readFileSync(filePath, 'utf8');
  return sql.split('\n').filter(l => l.startsWith('INSERT OR REPLACE INTO security_controls') || l.startsWith('INSERT OR IGNORE INTO security_controls')).length;
}

function extractFrameworkIds(filePath) {
  const sql = fs.readFileSync(filePath, 'utf8');
  // Match framework_id values in INSERT statements (e.g. 'nist-800-53-r5', 'fedramp-low')
  const matches = sql.match(/INTO security_controls[^;]*?'([a-z0-9][\w-]+)'/g) || [];
  const ids = new Set();
  for (const m of matches) {
    const idMatch = m.match(/'([a-z0-9][\w-]+)'/);
    if (idMatch) ids.add(idMatch[1]);
  }
  return ids;
}

function countCrosswalks(filePath) {
  const sql = fs.readFileSync(filePath, 'utf8');
  return (sql.match(/INSERT OR IGNORE INTO control_crosswalks/g) || []).length;
}

function countByFamily(filePath) {
  const sql = fs.readFileSync(filePath, 'utf8');
  const families = {};
  const matches = sql.matchAll(/control_id = '([A-Z]{2})-/g);
  for (const m of matches) {
    families[m[1]] = (families[m[1]] || 0) + 1;
  }
  return families;
}

console.log('=== ForgeComply360 Control Migration Validation ===\n');

// --- NIST 800-53 (migrate-035) ---
console.log('NIST SP 800-53 Rev 5 (migrate-035):');
const nistFile = path.join(DB_DIR, 'migrate-035-nist-800-53-full-catalog.sql');
if (fs.existsSync(nistFile)) {
  const nistCount = countInsertLines(nistFile);
  check('Total controls = 1196 (full OSCAL catalog)', nistCount === 1196, `got ${nistCount}`);
  check('Uses canonical framework_id', extractFrameworkIds(nistFile).has('nist-800-53-r5'));

  // Count baseline flags - join multi-line INSERTs first
  const sql = fs.readFileSync(nistFile, 'utf8');
  // Split by INSERT boundaries to handle multi-line statements
  const statements = sql.split(/(?=INSERT OR REPLACE INTO security_controls)/).filter(s => s.startsWith('INSERT'));

  let bLow = 0, bMod = 0, bHigh = 0;
  for (const stmt of statements) {
    // Match the tail: ..., baseline_low, baseline_mod, baseline_high, is_enh, 'parent', sort, 'metadata');
    const match = stmt.match(/, (\d), (\d), (\d), (\d), '[^']*', \d+, '\{[^}]*\}'\);/);
    if (match) {
      if (match[1] === '1') bLow++;
      if (match[2] === '1') bMod++;
      if (match[3] === '1') bHigh++;
    }
  }
  check(`Baseline Low count = 149 (OSCAL SP 800-53B)`, bLow === 149, `got ${bLow}`);
  check(`Baseline Moderate count = 287`, bMod === 287, `got ${bMod}`);
  check(`Baseline High count = 370`, bHigh === 370, `got ${bHigh}`);

  // 20 families
  const families = new Set();
  const famMatches = sql.matchAll(/'(nist-800-53-r5)', '([A-Z]{2}(?:-\d+)?(?:\(\d+\))?)', '([^']+)'/g);
  for (const m of famMatches) {
    const fam = m[3]; // family name
    families.add(fam);
  }
  check('20 control families present', families.size === 20, `got ${families.size}: ${[...families].join(', ')}`);
} else {
  check('File exists', false, 'migrate-035 not found');
}

// --- FedRAMP (migrate-036) ---
console.log('\nFedRAMP Baselines (migrate-036):');
const fedrampFile = path.join(DB_DIR, 'migrate-036-fedramp-controls.sql');
if (fs.existsSync(fedrampFile)) {
  const sql = fs.readFileSync(fedrampFile, 'utf8');
  const lowControls = (sql.match(/INTO security_controls.*'fedramp-low'/g) || []).length;
  const modControls = (sql.match(/INTO security_controls.*'fedramp-moderate'/g) || []).length;
  const highControls = (sql.match(/INTO security_controls.*'fedramp-high'/g) || []).length;
  const crosswalks = countCrosswalks(fedrampFile);

  check(`FedRAMP Low controls = 149`, lowControls === 149, `got ${lowControls}`);
  check(`FedRAMP Moderate controls = 287`, modControls === 287, `got ${modControls}`);
  check(`FedRAMP High controls = 370`, highControls === 370, `got ${highControls}`);
  check(`Crosswalk entries present`, crosswalks > 0, `got ${crosswalks}`);
  check('Uses canonical framework_ids', extractFrameworkIds(fedrampFile).has('fedramp-low'));
} else {
  check('File exists', false, 'migrate-036 not found');
}

// --- NIST 800-171 (migrate-037) ---
console.log('\nNIST 800-171 Rev 3 (migrate-037):');
const n171File = path.join(DB_DIR, 'migrate-037-nist-800-171-controls.sql');
if (fs.existsSync(n171File)) {
  const crosswalks = countCrosswalks(n171File);
  const sql = fs.readFileSync(n171File, 'utf8');
  const controls = (sql.match(/INTO security_controls/g) || []).length;

  check(`Controls = 110`, controls === 110, `got ${controls}`);
  check(`Crosswalk entries present`, crosswalks > 0, `got ${crosswalks}`);
  check('Uses canonical framework_id', extractFrameworkIds(n171File).has('nist-800-171-r3'));
} else {
  check('File exists', false, 'migrate-037 not found');
}

// --- CMMC (migrate-038) ---
console.log('\nCMMC L2/L3 (migrate-038):');
const cmmcFile = path.join(DB_DIR, 'migrate-038-cmmc-controls.sql');
if (fs.existsSync(cmmcFile)) {
  const sql = fs.readFileSync(cmmcFile, 'utf8');
  const l2Controls = (sql.match(/INTO security_controls.*'cmmc-l2'/g) || []).length;
  const l3Controls = (sql.match(/INTO security_controls.*'cmmc-l3'/g) || []).length;
  const crosswalks = countCrosswalks(cmmcFile);

  check(`CMMC L2 = 110 practices`, l2Controls === 110, `got ${l2Controls}`);
  check(`CMMC L3 = 134 practices`, l3Controls === 134, `got ${l3Controls}`);
  check(`Crosswalk entries present`, crosswalks > 0, `got ${crosswalks}`);
  check('Uses canonical framework_ids', extractFrameworkIds(cmmcFile).has('cmmc-l2'));
} else {
  check('File exists', false, 'migrate-038 not found');
}

// --- HIPAA/SOC2/StateRAMP (migrate-039) ---
console.log('\nHIPAA/SOC 2/StateRAMP (migrate-039):');
const hsFile = path.join(DB_DIR, 'migrate-039-hipaa-soc2-stateramp-controls.sql');
if (fs.existsSync(hsFile)) {
  const sql = fs.readFileSync(hsFile, 'utf8');
  const hipaaControls = (sql.match(/INTO security_controls.*'hipaa'/g) || []).length;
  const soc2Controls = (sql.match(/INTO security_controls.*'soc2-type2'/g) || []).length;
  const staterampControls = (sql.match(/INTO security_controls.*'stateramp'/g) || []).length;
  const crosswalks = countCrosswalks(hsFile);

  check(`HIPAA controls = 53`, hipaaControls === 53, `got ${hipaaControls}`);
  check(`SOC 2 criteria = 61`, soc2Controls === 61, `got ${soc2Controls}`);
  check(`StateRAMP controls = 287`, staterampControls === 287, `got ${staterampControls}`);
  check(`Crosswalk entries present`, crosswalks > 0, `got ${crosswalks}`);

  const fwIds = extractFrameworkIds(hsFile);
  check('Uses canonical framework_ids', fwIds.has('hipaa') && fwIds.has('soc2-type2') && fwIds.has('stateramp'));
} else {
  check('File exists', false, 'migrate-039 not found');
}

// --- Framework ID Consistency ---
console.log('\nFramework ID Consistency:');
const allFiles = [nistFile, fedrampFile, n171File, cmmcFile, hsFile].filter(f => fs.existsSync(f));
const allFwIds = new Set();
for (const f of allFiles) {
  for (const id of extractFrameworkIds(f)) allFwIds.add(id);
}
const nonCanonical = [...allFwIds].filter(id => !CANONICAL_FRAMEWORKS.has(id));
check('All framework_ids are canonical', nonCanonical.length === 0, `non-canonical: ${nonCanonical.join(', ')}`);

// --- Control Implementations (migrate-040) ---
console.log('\nControl Implementations (migrate-040):');
const implFile = path.join(DB_DIR, 'migrate-040-control-implementations.sql');
if (fs.existsSync(implFile)) {
  const implSql = fs.readFileSync(implFile, 'utf8');
  const implCount = (implSql.match(/INSERT OR REPLACE INTO control_implementations/g) || []).length;
  check(`Total implementations = 574 (287 x 2 systems)`, implCount === 574, `got ${implCount}`);

  const mfehrCount = (implSql.match(/INTO control_implementations.*'sys-phs-001'/g) || []).length;
  const fc360Count = (implSql.match(/INTO control_implementations.*'sys-001'/g) || []).length;
  check(`MFEHR (sys-phs-001) = 287`, mfehrCount === 287, `got ${mfehrCount}`);
  check(`FC360 (sys-001) = 287`, fc360Count === 287, `got ${fc360Count}`);

  check(`Framework = fedramp-moderate`, (implSql.match(/'fedramp-moderate'/g) || []).length >= 574, `fewer than expected`);

  // Status distribution
  const implLines = implSql.split('\n').filter(l => l.startsWith('INSERT OR REPLACE INTO control_implementations'));
  const statusCounts = {};
  for (const line of implLines) {
    const m = line.match(/, '(implemented|partially_implemented|planned|alternative|not_applicable|not_implemented)',/);
    if (m) statusCounts[m[1]] = (statusCounts[m[1]] || 0) + 1;
  }
  const total = implLines.length;
  const implPct = ((statusCounts['implemented'] || 0) / total * 100);
  const partPct = ((statusCounts['partially_implemented'] || 0) / total * 100);
  const planPct = ((statusCounts['planned'] || 0) / total * 100);
  check(`Status: implemented ~60%`, implPct >= 55 && implPct <= 65, `got ${implPct.toFixed(1)}%`);
  check(`Status: partially_implemented ~20%`, partPct >= 15 && partPct <= 25, `got ${partPct.toFixed(1)}%`);
  check(`Status: planned ~12%`, planPct >= 7 && planPct <= 17, `got ${planPct.toFixed(1)}%`);

  // Check for org/system prerequisites
  check(`Includes org_001 prerequisite`, implSql.includes("INSERT OR IGNORE INTO organizations"));
  check(`Includes system prerequisites`, implSql.includes("INSERT OR IGNORE INTO systems"));
} else {
  check('File exists', false, 'migrate-040 not found');
}

// --- Summary ---
console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
if (failed === 0) {
  console.log('All validations passed!');
} else {
  console.log('Some validations failed. Review output above.');
  process.exit(1);
}
