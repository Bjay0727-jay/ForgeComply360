#!/usr/bin/env node
// import-nist-oscal.js — Parse NIST SP 800-53 Rev 5 OSCAL catalog + baselines,
// and generate SQL migration for security_controls table.
// Uses cached OSCAL files from .oscal-cache/ directory.

const fs = require('fs');
const path = require('path');

const CACHE_DIR = path.join(__dirname, '..', '.oscal-cache');
const OUTPUT_FILE = path.join(__dirname, '..', 'database', 'migrate-035-nist-800-53-full-catalog.sql');
const FRAMEWORK_ID = 'fw_nist_800_53_r5';

// Extract text from OSCAL prose/markup-multiline
function extractText(value) {
  if (!value) return '';
  if (typeof value === 'string') return value.trim();
  if (value.prose) return value.prose.trim();
  if (Array.isArray(value)) return value.map(extractText).filter(Boolean).join(' ');
  return String(value).trim();
}

// Extract description from control parts (statement)
function extractDescription(ctrl) {
  const parts = ctrl.parts || [];
  for (const part of parts) {
    if (part.name === 'statement' || part.name === 'overview') {
      let text = extractText(part.prose);
      if (part.parts) {
        const subTexts = extractSubParts(part.parts);
        if (subTexts) text += ' ' + subTexts;
      }
      return text.trim();
    }
  }
  return extractText(ctrl.prose);
}

function extractSubParts(parts) {
  return parts.map(p => {
    let t = extractText(p.prose);
    if (p.parts) {
      const sub = extractSubParts(p.parts);
      if (sub) t += ' ' + sub;
    }
    return t;
  }).filter(Boolean).join(' ');
}

// Extract guidance from control parts
function extractGuidance(ctrl) {
  const parts = ctrl.parts || [];
  for (const part of parts) {
    if (part.name === 'guidance') {
      return extractText(part.prose);
    }
  }
  return '';
}

// Extract priority from control props
function extractPriority(ctrl) {
  const props = ctrl.props || [];
  for (const prop of props) {
    if (prop.name === 'priority') {
      return (prop.value || 'P0').toUpperCase();
    }
  }
  return 'P0';
}

// Check if control is withdrawn
function isWithdrawn(ctrl) {
  const props = ctrl.props || [];
  return props.some(p => p.name === 'status' && p.value === 'withdrawn');
}

// Convert OSCAL control ID to our format: ac-1 -> AC-1, ac-2.1 -> AC-2(1)
function normalizeControlId(oscalId) {
  let id = oscalId.toUpperCase();
  id = id.replace(/\.(\d+)$/, '($1)');
  return id;
}

// Family name lookup
const FAMILY_NAMES = {
  'AC': 'Access Control', 'AT': 'Awareness and Training',
  'AU': 'Audit and Accountability', 'CA': 'Assessment, Authorization, and Monitoring',
  'CM': 'Configuration Management', 'CP': 'Contingency Planning',
  'IA': 'Identification and Authentication', 'IR': 'Incident Response',
  'MA': 'Maintenance', 'MP': 'Media Protection',
  'PE': 'Physical and Environmental Protection', 'PL': 'Planning',
  'PM': 'Program Management', 'PS': 'Personnel Security',
  'PT': 'PII Processing and Transparency', 'RA': 'Risk Assessment',
  'SA': 'System and Services Acquisition', 'SC': 'System and Communications Protection',
  'SI': 'System and Information Integrity', 'SR': 'Supply Chain Risk Management',
};

// Parse OSCAL baseline profile to get set of control IDs
function parseBaselineProfile(profileJson) {
  const controlIds = new Set();
  const profile = profileJson.profile || profileJson;
  const imports = profile.imports || [];
  for (const imp of imports) {
    const includeControls = imp['include-controls'] || [];
    for (const inc of includeControls) {
      const withIds = inc['with-ids'] || [];
      for (const id of withIds) {
        controlIds.add(normalizeControlId(id));
      }
    }
  }
  return controlIds;
}

// Parse the full OSCAL catalog
function parseCatalog(catalogJson) {
  const catalog = catalogJson.catalog || catalogJson;
  const controls = [];
  let sortOrder = 1;

  const groups = catalog.groups || [];
  for (const group of groups) {
    const familyCode = (group.id || '').toUpperCase();
    const familyName = FAMILY_NAMES[familyCode] || group.title || familyCode;

    for (const ctrl of (group.controls || [])) {
      const controlId = normalizeControlId(ctrl.id || '');
      if (!controlId) continue;

      const withdrawn = isWithdrawn(ctrl);
      controls.push({
        control_id: controlId,
        family: familyName,
        family_code: familyCode,
        title: ctrl.title || '',
        description: withdrawn ? '[Withdrawn]' : extractDescription(ctrl),
        guidance: withdrawn ? '' : extractGuidance(ctrl),
        priority: withdrawn ? 'P0' : extractPriority(ctrl),
        parent_control_id: '',
        is_enhancement: 0,
        is_withdrawn: withdrawn,
        sort_order: sortOrder++,
      });

      for (const enh of (ctrl.controls || [])) {
        const enhId = normalizeControlId(enh.id || '');
        if (!enhId) continue;

        const enhWithdrawn = isWithdrawn(enh);
        controls.push({
          control_id: enhId,
          family: familyName,
          family_code: familyCode,
          title: enh.title || '',
          description: enhWithdrawn ? '[Withdrawn]' : extractDescription(enh),
          guidance: enhWithdrawn ? '' : extractGuidance(enh),
          priority: enhWithdrawn ? 'P0' : extractPriority(enh),
          parent_control_id: controlId,
          is_enhancement: 1,
          is_withdrawn: enhWithdrawn,
          sort_order: sortOrder++,
        });
      }
    }
  }
  return controls;
}

// Escape SQL string
function sqlEscape(str) {
  if (!str) return '';
  // Escape quotes, collapse newlines, and strip semicolons (wrangler d1 execute
  // splits SQL on ';' without respecting string literals — known bug #2366)
  return str.replace(/'/g, "''").replace(/[\r\n]+/g, ' ').replace(/;/g, ',');
}

// Generate SQL migration
function generateSQL(controls, baselineLow, baselineMod, baselineHigh) {
  const lines = [];
  lines.push('-- ============================================================================');
  lines.push('-- Migration: migrate-035-nist-800-53-full-catalog.sql');
  lines.push(`-- NIST SP 800-53 Rev 5 — Full catalog (${controls.length} controls + enhancements)`);
  lines.push('-- Source: OSCAL catalog from usnistgov/oscal-content');
  lines.push(`-- Generated: ${new Date().toISOString()}`);
  lines.push('-- ============================================================================');
  lines.push('');

  let currentFamily = '';
  for (const ctrl of controls) {
    if (ctrl.family_code !== currentFamily) {
      currentFamily = ctrl.family_code;
      lines.push('');
      lines.push(`-- --------------------------------------------------------------------------`);
      lines.push(`-- ${ctrl.family_code}: ${ctrl.family}`);
      lines.push(`-- --------------------------------------------------------------------------`);
    }

    const isLow = baselineLow.has(ctrl.control_id) ? 1 : 0;
    const isMod = baselineMod.has(ctrl.control_id) ? 1 : 0;
    const isHigh = baselineHigh.has(ctrl.control_id) ? 1 : 0;

    lines.push(
      `INSERT OR REPLACE INTO security_controls (id, framework_id, control_id, family, title, description, guidance, priority, baseline_low, baseline_moderate, baseline_high, is_enhancement, parent_control_id, sort_order, metadata) ` +
      `VALUES ((SELECT COALESCE((SELECT id FROM security_controls WHERE framework_id = '${FRAMEWORK_ID}' AND control_id = '${sqlEscape(ctrl.control_id)}'), lower(hex(randomblob(16))))), ` +
      `'${FRAMEWORK_ID}', '${sqlEscape(ctrl.control_id)}', '${sqlEscape(ctrl.family)}', '${sqlEscape(ctrl.title)}', '${sqlEscape(ctrl.description)}', '${sqlEscape(ctrl.guidance)}', '${ctrl.priority}', ${isLow}, ${isMod}, ${isHigh}, ${ctrl.is_enhancement}, '${sqlEscape(ctrl.parent_control_id)}', ${ctrl.sort_order}, '${ctrl.is_withdrawn ? '{"status":"withdrawn"}' : '{}'}');`
    );
  }

  lines.push('');
  lines.push('-- ============================================================================');
  lines.push('-- Validation queries');
  lines.push('-- ============================================================================');
  lines.push(`-- SELECT COUNT(*) as total FROM security_controls WHERE framework_id = '${FRAMEWORK_ID}';`);
  lines.push(`-- SELECT family, COUNT(*) as cnt FROM security_controls WHERE framework_id = '${FRAMEWORK_ID}' GROUP BY family ORDER BY family;`);
  lines.push(`-- SELECT COUNT(*) as baseline_low FROM security_controls WHERE framework_id = '${FRAMEWORK_ID}' AND baseline_low = 1;`);
  lines.push(`-- SELECT COUNT(*) as baseline_mod FROM security_controls WHERE framework_id = '${FRAMEWORK_ID}' AND baseline_moderate = 1;`);
  lines.push(`-- SELECT COUNT(*) as baseline_high FROM security_controls WHERE framework_id = '${FRAMEWORK_ID}' AND baseline_high = 1;`);
  lines.push('');

  return lines.join('\n');
}

// Main
function main() {
  console.log('=== NIST SP 800-53 Rev 5 OSCAL Import ===\n');

  // Load cached OSCAL files
  console.log('Step 1: Loading OSCAL content from cache...');
  const catalogJson = JSON.parse(fs.readFileSync(path.join(CACHE_DIR, 'catalog.json'), 'utf8'));
  const lowJson = JSON.parse(fs.readFileSync(path.join(CACHE_DIR, 'baseline-low.json'), 'utf8'));
  const modJson = JSON.parse(fs.readFileSync(path.join(CACHE_DIR, 'baseline-moderate.json'), 'utf8'));
  const highJson = JSON.parse(fs.readFileSync(path.join(CACHE_DIR, 'baseline-high.json'), 'utf8'));

  // Parse baselines
  console.log('\nStep 2: Parsing baselines...');
  const baselineLow = parseBaselineProfile(lowJson);
  const baselineMod = parseBaselineProfile(modJson);
  const baselineHigh = parseBaselineProfile(highJson);
  console.log(`  Low baseline: ${baselineLow.size} controls`);
  console.log(`  Moderate baseline: ${baselineMod.size} controls`);
  console.log(`  High baseline: ${baselineHigh.size} controls`);

  // Parse catalog
  console.log('\nStep 3: Parsing catalog...');
  const controls = parseCatalog(catalogJson);
  const activeControls = controls.filter(c => !c.is_withdrawn);
  const withdrawnControls = controls.filter(c => c.is_withdrawn);
  console.log(`  Total entries: ${controls.length}`);
  console.log(`  Active controls: ${activeControls.length}`);
  console.log(`  Withdrawn controls: ${withdrawnControls.length}`);

  // Family breakdown
  const familyCounts = {};
  for (const c of controls) {
    if (!familyCounts[c.family_code]) familyCounts[c.family_code] = { active: 0, withdrawn: 0 };
    if (c.is_withdrawn) familyCounts[c.family_code].withdrawn++;
    else familyCounts[c.family_code].active++;
  }
  console.log('\n  Family breakdown (active / withdrawn / total):');
  for (const [fam, counts] of Object.entries(familyCounts).sort()) {
    console.log(`    ${fam}: ${counts.active} / ${counts.withdrawn} / ${counts.active + counts.withdrawn}`);
  }

  // Generate SQL
  console.log('\nStep 4: Generating SQL migration...');
  const sql = generateSQL(controls, baselineLow, baselineMod, baselineHigh);
  fs.writeFileSync(OUTPUT_FILE, sql);
  console.log(`  Written to: ${OUTPUT_FILE}`);
  console.log(`  File size: ${(fs.statSync(OUTPUT_FILE).size / 1024).toFixed(1)} KB`);

  // Summary
  console.log('\n=== Summary ===');
  console.log(`Total catalog entries: ${controls.length}`);
  console.log(`Active controls: ${activeControls.length}`);
  console.log(`Baseline Low: ${baselineLow.size}`);
  console.log(`Baseline Moderate: ${baselineMod.size}`);
  console.log(`Baseline High: ${baselineHigh.size}`);
  console.log('\nDone!');
}

main();
