#!/usr/bin/env node
// generate-fedramp-migration.js — Generate FedRAMP controls migration from OSCAL data

const fs = require('fs');
const path = require('path');

const CACHE_DIR = path.join(__dirname, '..', '.oscal-cache');
const OUTPUT = path.join(__dirname, '..', 'database', 'migrate-036-fedramp-controls.sql');

function normalizeId(id) { return id.toUpperCase().replace(/\.(\d+)$/, '($1)'); }
function sqlEscape(s) { return (s || '').replace(/'/g, "''"); }

function extractProfileIds(profile) {
  const ids = new Set();
  for (const imp of (profile.profile || profile).imports || []) {
    for (const inc of imp['include-controls'] || []) {
      for (const id of inc['with-ids'] || []) ids.add(normalizeId(id));
    }
  }
  return ids;
}

function extractText(value) {
  if (!value) return '';
  if (typeof value === 'string') return value.trim();
  if (value.prose) return value.prose.trim();
  if (Array.isArray(value)) return value.map(extractText).filter(Boolean).join(' ');
  return String(value).trim();
}

function extractDescription(ctrl) {
  for (const part of (ctrl.parts || [])) {
    if (part.name === 'statement' || part.name === 'overview') {
      let text = extractText(part.prose);
      if (part.parts) text += ' ' + part.parts.map(p => extractText(p.prose)).filter(Boolean).join(' ');
      return text.trim();
    }
  }
  return extractText(ctrl.prose);
}

function extractGuidance(ctrl) {
  for (const part of (ctrl.parts || [])) {
    if (part.name === 'guidance') return extractText(part.prose);
  }
  return '';
}

function extractPriority(ctrl) {
  for (const prop of (ctrl.props || [])) {
    if (prop.name === 'priority') return (prop.value || 'P0').toUpperCase();
  }
  return 'P0';
}

function isWithdrawn(ctrl) {
  return (ctrl.props || []).some(p => p.name === 'status' && p.value === 'withdrawn');
}

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

function main() {
  const cat = JSON.parse(fs.readFileSync(path.join(CACHE_DIR, 'catalog.json'), 'utf8'));
  const lowProfile = JSON.parse(fs.readFileSync(path.join(CACHE_DIR, 'baseline-low.json'), 'utf8'));
  const modProfile = JSON.parse(fs.readFileSync(path.join(CACHE_DIR, 'baseline-moderate.json'), 'utf8'));
  const highProfile = JSON.parse(fs.readFileSync(path.join(CACHE_DIR, 'baseline-high.json'), 'utf8'));

  const lowIds = extractProfileIds(lowProfile);
  const modIds = extractProfileIds(modProfile);
  const highIds = extractProfileIds(highProfile);

  // Build active control map from catalog
  const controlMap = {};
  for (const g of cat.catalog.groups) {
    const famCode = g.id.toUpperCase();
    for (const c of (g.controls || [])) {
      if (isWithdrawn(c)) continue;
      const id = normalizeId(c.id);
      controlMap[id] = {
        control_id: id, family: FAMILY_NAMES[famCode] || g.title,
        title: c.title, description: extractDescription(c),
        guidance: extractGuidance(c), priority: extractPriority(c),
        is_enhancement: 0, parent_control_id: '',
      };
      for (const e of (c.controls || [])) {
        if (isWithdrawn(e)) continue;
        const eid = normalizeId(e.id);
        controlMap[eid] = {
          control_id: eid, family: FAMILY_NAMES[famCode] || g.title,
          title: e.title, description: extractDescription(e),
          guidance: extractGuidance(e), priority: extractPriority(e),
          is_enhancement: 1, parent_control_id: id,
        };
      }
    }
  }

  const baselines = [
    { name: 'FedRAMP Low', framework_id: 'fw_fedramp_low', ids: lowIds },
    { name: 'FedRAMP Moderate', framework_id: 'fw_fedramp_mod', ids: modIds },
    { name: 'FedRAMP High', framework_id: 'fw_fedramp_high', ids: highIds },
  ];

  const lines = [];
  lines.push('-- ============================================================================');
  lines.push('-- Migration: migrate-036-fedramp-controls.sql');
  lines.push('-- FedRAMP Low, Moderate, and High baseline controls');
  lines.push('-- Derived from NIST SP 800-53B baselines via OSCAL profiles');
  lines.push(`-- Generated: ${new Date().toISOString()}`);
  lines.push('-- ============================================================================');

  for (const baseline of baselines) {
    lines.push('');
    lines.push(`-- ============================================================================`);
    lines.push(`-- ${baseline.name} (${baseline.ids.size} controls) -> framework_id = '${baseline.framework_id}'`);
    lines.push(`-- ============================================================================`);

    let sortOrder = 1;
    const sortedIds = [...baseline.ids].sort();
    for (const id of sortedIds) {
      const ctrl = controlMap[id];
      if (!ctrl) continue; // Skip withdrawn controls not in catalog

      lines.push(
        `INSERT OR REPLACE INTO security_controls (id, framework_id, control_id, family, title, description, guidance, priority, baseline_low, baseline_moderate, baseline_high, is_enhancement, parent_control_id, sort_order) ` +
        `VALUES ((SELECT COALESCE((SELECT id FROM security_controls WHERE framework_id = '${baseline.framework_id}' AND control_id = '${sqlEscape(ctrl.control_id)}'), lower(hex(randomblob(16))))), ` +
        `'${baseline.framework_id}', '${sqlEscape(ctrl.control_id)}', '${sqlEscape(ctrl.family)}', '${sqlEscape(ctrl.title)}', '${sqlEscape(ctrl.description)}', '${sqlEscape(ctrl.guidance)}', '${ctrl.priority}', ` +
        `${lowIds.has(id) ? 1 : 0}, ${modIds.has(id) ? 1 : 0}, ${highIds.has(id) ? 1 : 0}, ${ctrl.is_enhancement}, '${sqlEscape(ctrl.parent_control_id)}', ${sortOrder++});`
      );
    }

    // Add crosswalk entries
    lines.push('');
    lines.push(`-- Crosswalks: ${baseline.name} -> NIST 800-53`);
    for (const id of sortedIds) {
      if (!controlMap[id]) continue;
      lines.push(
        `INSERT OR IGNORE INTO control_crosswalks (id, source_framework_id, source_control_id, target_framework_id, target_control_id, mapping_type, confidence) ` +
        `VALUES (lower(hex(randomblob(16))), '${baseline.framework_id}', '${sqlEscape(id)}', 'fw_nist_800_53_r5', '${sqlEscape(id)}', 'equivalent', 1.0);`
      );
    }

    console.log(`${baseline.name}: ${sortOrder - 1} controls`);
  }

  fs.writeFileSync(OUTPUT, lines.join('\n'));
  console.log(`Written to: ${OUTPUT} (${(fs.statSync(OUTPUT).size / 1024).toFixed(1)} KB)`);
}

main();
