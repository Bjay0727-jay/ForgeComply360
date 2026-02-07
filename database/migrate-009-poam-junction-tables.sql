-- ============================================================================
-- MIGRATION 009: POA&M FedRAMP Junction Tables
-- Adds affected assets, multi-control mappings, and evidence linkage for POA&Ms
-- Required for FedRAMP 3PAO compliance
-- ============================================================================

-- POA&M Affected Assets (FedRAMP requires listing affected components)
CREATE TABLE IF NOT EXISTS poam_affected_assets (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  poam_id TEXT NOT NULL REFERENCES poams(id) ON DELETE CASCADE,
  asset_id TEXT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  link_reason TEXT DEFAULT 'affected' CHECK (link_reason IN ('vulnerable', 'impacted', 'affected', 'at_risk', 'remediated')),
  notes TEXT,
  linked_by TEXT NOT NULL REFERENCES users(id),
  linked_at TEXT DEFAULT (datetime('now')),
  UNIQUE(poam_id, asset_id)
);

CREATE INDEX IF NOT EXISTS idx_poam_assets_poam ON poam_affected_assets(poam_id);
CREATE INDEX IF NOT EXISTS idx_poam_assets_asset ON poam_affected_assets(asset_id);

-- POA&M Control Mappings (multi-framework, many-to-many)
-- Replaces single control_id field to support SI-2, RA-5, CM-3 simultaneously
CREATE TABLE IF NOT EXISTS poam_control_mappings (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  poam_id TEXT NOT NULL REFERENCES poams(id) ON DELETE CASCADE,
  framework_id TEXT NOT NULL REFERENCES compliance_frameworks(id),
  control_id TEXT NOT NULL,
  mapping_type TEXT DEFAULT 'primary' CHECK (mapping_type IN ('primary', 'related', 'inherited')),
  confidence TEXT DEFAULT 'high' CHECK (confidence IN ('high', 'medium', 'low')),
  notes TEXT,
  mapped_by TEXT NOT NULL REFERENCES users(id),
  mapped_at TEXT DEFAULT (datetime('now')),
  UNIQUE(poam_id, framework_id, control_id)
);

CREATE INDEX IF NOT EXISTS idx_poam_controls_poam ON poam_control_mappings(poam_id);
CREATE INDEX IF NOT EXISTS idx_poam_controls_framework ON poam_control_mappings(framework_id);
CREATE INDEX IF NOT EXISTS idx_poam_controls_control ON poam_control_mappings(control_id);

-- POA&M Evidence (identification, remediation, closure, verification)
-- Required for FedRAMP monthly reporting on closed POA&Ms
CREATE TABLE IF NOT EXISTS poam_evidence (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  poam_id TEXT NOT NULL REFERENCES poams(id) ON DELETE CASCADE,
  evidence_id TEXT NOT NULL REFERENCES evidence(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL CHECK (purpose IN ('identification', 'remediation', 'closure', 'verification', 'deviation')),
  description TEXT,
  linked_by TEXT NOT NULL REFERENCES users(id),
  linked_at TEXT DEFAULT (datetime('now')),
  verified_by TEXT REFERENCES users(id),
  verified_at TEXT,
  UNIQUE(poam_id, evidence_id, purpose)
);

CREATE INDEX IF NOT EXISTS idx_poam_evidence_poam ON poam_evidence(poam_id);
CREATE INDEX IF NOT EXISTS idx_poam_evidence_evidence ON poam_evidence(evidence_id);
CREATE INDEX IF NOT EXISTS idx_poam_evidence_purpose ON poam_evidence(purpose);

-- Migrate existing control_id values to junction table (backward compatibility)
INSERT OR IGNORE INTO poam_control_mappings (id, poam_id, framework_id, control_id, mapping_type, mapped_by)
SELECT
  lower(hex(randomblob(16))),
  p.id,
  COALESCE(p.framework_id, 'nist-800-53-r5'),
  p.control_id,
  'primary',
  COALESCE(p.created_by, (SELECT id FROM users WHERE org_id = p.org_id LIMIT 1))
FROM poams p
WHERE p.control_id IS NOT NULL AND p.control_id != '';
