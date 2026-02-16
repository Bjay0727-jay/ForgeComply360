-- Migration 020: FISMA SSP Builder Tables
-- Adds 10 new supporting tables for 23-section FISMA RMF SSP Builder
-- Run against both production and demo databases

-- Add ssp_type column to existing ssp_documents table
ALTER TABLE ssp_documents ADD COLUMN ssp_type TEXT DEFAULT 'standard' CHECK (ssp_type IN ('standard', 'fisma'));
ALTER TABLE ssp_documents ADD COLUMN rmf_step TEXT;
ALTER TABLE ssp_documents ADD COLUMN target_ato_date TEXT;

-- 1. Information Types (NIST SP 800-60 Vol II)
CREATE TABLE IF NOT EXISTS ssp_information_types (
  id TEXT PRIMARY KEY,
  ssp_id TEXT NOT NULL,
  nist_id TEXT NOT NULL,                    -- e.g., 'D.1.1', 'C.2.8.12'
  name TEXT NOT NULL,
  confidentiality TEXT CHECK (confidentiality IN ('Low', 'Moderate', 'High')),
  integrity TEXT CHECK (integrity IN ('Low', 'Moderate', 'High')),
  availability TEXT CHECK (availability IN ('Low', 'Moderate', 'High')),
  justification TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (ssp_id) REFERENCES ssp_documents(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ssp_info_types_ssp ON ssp_information_types(ssp_id);

-- 2. RMF Lifecycle Tracking (NIST SP 800-37 Rev 2)
CREATE TABLE IF NOT EXISTS ssp_rmf_tracking (
  id TEXT PRIMARY KEY,
  ssp_id TEXT NOT NULL UNIQUE,
  current_step TEXT NOT NULL DEFAULT 'prepare' CHECK (current_step IN ('prepare', 'categorize', 'select', 'implement', 'assess', 'authorize', 'monitor')),
  target_ato_date TEXT,
  -- JSON for task checkboxes per step: {"t0": true, "t1": false, ...}
  prepare_tasks TEXT DEFAULT '{}',
  categorize_tasks TEXT DEFAULT '{}',
  select_tasks TEXT DEFAULT '{}',
  implement_tasks TEXT DEFAULT '{}',
  assess_tasks TEXT DEFAULT '{}',
  authorize_tasks TEXT DEFAULT '{}',
  monitor_tasks TEXT DEFAULT '{}',
  -- JSON array of completed artifacts: ["SSP", "SAR", "POA&M", ...]
  artifacts_completed TEXT DEFAULT '[]',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (ssp_id) REFERENCES ssp_documents(id) ON DELETE CASCADE
);

-- 3. Ports, Protocols & Services (Appendix Q - FedRAMP SSP)
CREATE TABLE IF NOT EXISTS ssp_ports_protocols (
  id TEXT PRIMARY KEY,
  ssp_id TEXT NOT NULL,
  port TEXT NOT NULL,
  protocol TEXT,                            -- TCP, UDP, ICMP, etc.
  service TEXT,                             -- HTTP, HTTPS, SSH, etc.
  purpose TEXT,
  direction TEXT CHECK (direction IN ('Inbound', 'Outbound', 'Internal', 'Bidirectional')),
  dit_ref TEXT,                             -- DIT reference number for Appendix Q
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (ssp_id) REFERENCES ssp_documents(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ssp_pps_ssp ON ssp_ports_protocols(ssp_id);

-- 4. Cryptographic Modules (FIPS 140-2/3 Inventory)
CREATE TABLE IF NOT EXISTS ssp_crypto_modules (
  id TEXT PRIMARY KEY,
  ssp_id TEXT NOT NULL,
  module_name TEXT NOT NULL,
  vendor TEXT,
  fips_cert_number TEXT,
  validation_level TEXT,                    -- Level 1, 2, 3, 4
  usage TEXT,                               -- DAR (Data at Rest), DIT (Data in Transit), DIU (Data in Use)
  where_used TEXT,                          -- Component/system where module is deployed
  expiration_date TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (ssp_id) REFERENCES ssp_documents(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ssp_crypto_ssp ON ssp_crypto_modules(ssp_id);

-- 5. Digital Identity Levels (NIST SP 800-63-3)
CREATE TABLE IF NOT EXISTS ssp_digital_identity (
  id TEXT PRIMARY KEY,
  ssp_id TEXT NOT NULL UNIQUE,
  ial TEXT CHECK (ial IN ('IAL1', 'IAL2', 'IAL3')),
  aal TEXT CHECK (aal IN ('AAL1', 'AAL2', 'AAL3')),
  fal TEXT CHECK (fal IN ('FAL1', 'FAL2', 'N/A')),
  mfa_methods TEXT,                         -- JSON array: ["PIV", "TOTP", "SMS", ...]
  identity_proofing_description TEXT,
  authenticator_description TEXT,
  federation_description TEXT,
  narrative TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (ssp_id) REFERENCES ssp_documents(id) ON DELETE CASCADE
);

-- 6. Separation of Duties Matrix (AC-5)
CREATE TABLE IF NOT EXISTS ssp_separation_duties (
  id TEXT PRIMARY KEY,
  ssp_id TEXT NOT NULL,
  role TEXT NOT NULL,
  access_level TEXT,                        -- Admin, User, Operator, Auditor, etc.
  prohibited_roles TEXT,                    -- JSON array of roles this cannot also hold
  justification TEXT,
  dual_control_required INTEGER DEFAULT 0,  -- 1 = yes
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (ssp_id) REFERENCES ssp_documents(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ssp_sepduty_ssp ON ssp_separation_duties(ssp_id);

-- 7. Security Policy Mappings (Per Control Family)
CREATE TABLE IF NOT EXISTS ssp_policy_mappings (
  id TEXT PRIMARY KEY,
  ssp_id TEXT NOT NULL,
  policy_id TEXT,                           -- Optional link to existing policies table
  control_family TEXT NOT NULL,             -- AC, AT, AU, CA, CM, CP, IA, IR, MA, MP, PE, PL, PM, PS, PT, RA, SA, SC, SI, SR
  policy_title TEXT NOT NULL,
  version TEXT,
  owner TEXT,
  last_reviewed TEXT,
  next_review TEXT,
  status TEXT CHECK (status IN ('Current', 'Draft', 'Under Review', 'Expired')),
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (ssp_id) REFERENCES ssp_documents(id) ON DELETE CASCADE,
  FOREIGN KEY (policy_id) REFERENCES policies(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_ssp_policy_ssp ON ssp_policy_mappings(ssp_id);
CREATE INDEX IF NOT EXISTS idx_ssp_policy_family ON ssp_policy_mappings(control_family);

-- 8. Supply Chain Risk Management (NIST SP 800-161 Rev 1)
CREATE TABLE IF NOT EXISTS ssp_scrm (
  id TEXT PRIMARY KEY,
  ssp_id TEXT NOT NULL,
  supplier_name TEXT NOT NULL,
  component_type TEXT,                      -- CSP, SaaS, PaaS, Open Source, COTS, Custom
  criticality TEXT CHECK (criticality IN ('Critical', 'High', 'Medium', 'Low')),
  sbom_status TEXT CHECK (sbom_status IN ('Complete', 'Partial', 'Pending', 'N/A')),
  sbom_format TEXT,                         -- SPDX, CycloneDX, SWID
  risk_level TEXT CHECK (risk_level IN ('Critical', 'High', 'Medium', 'Low', 'Unknown')),
  provenance_verified INTEGER DEFAULT 0,    -- 1 = yes
  last_assessment_date TEXT,
  vendor_id TEXT,                           -- Optional link to vendors table
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (ssp_id) REFERENCES ssp_documents(id) ON DELETE CASCADE,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_ssp_scrm_ssp ON ssp_scrm(ssp_id);

-- SCRM Plan metadata (one per SSP)
CREATE TABLE IF NOT EXISTS ssp_scrm_plan (
  id TEXT PRIMARY KEY,
  ssp_id TEXT NOT NULL UNIQUE,
  plan_summary TEXT,
  scrm_policy_reference TEXT,
  acquisition_process TEXT,
  software_integrity_verification TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (ssp_id) REFERENCES ssp_documents(id) ON DELETE CASCADE
);

-- 9. Privacy Analysis (PTA/PIA - E-Government Act Section 208)
CREATE TABLE IF NOT EXISTS ssp_privacy_analysis (
  id TEXT PRIMARY KEY,
  ssp_id TEXT NOT NULL UNIQUE,
  -- Privacy Threshold Analysis (PTA)
  collects_pii TEXT CHECK (collects_pii IN ('yes', 'no', 'metadata')),
  pii_types TEXT,                           -- JSON array: ["name", "SSN", "address", ...]
  record_count TEXT,                        -- Approximate number of records
  pia_required TEXT CHECK (pia_required IN ('yes', 'no', 'tbd')),
  -- Privacy Impact Assessment (PIA)
  authority_to_collect TEXT,                -- Legal authority citation
  purpose_of_collection TEXT,
  data_minimization TEXT,
  retention_disposal TEXT,                  -- Retention schedule and disposal method
  third_party_sharing TEXT,                 -- Description of any third-party sharing
  consent_redress TEXT,                     -- Consent mechanisms and redress procedures
  -- SORN (System of Records Notice)
  sorn_status TEXT CHECK (sorn_status IN ('Published', 'Draft', 'Not Required', 'N/A')),
  sorn_number TEXT,
  sorn_url TEXT,
  -- Privacy Controls
  privacy_controls_implemented TEXT,        -- JSON array of PT family controls
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (ssp_id) REFERENCES ssp_documents(id) ON DELETE CASCADE
);

-- 10. Configuration Management Plan (Appendix H)
CREATE TABLE IF NOT EXISTS ssp_config_management (
  id TEXT PRIMARY KEY,
  ssp_id TEXT NOT NULL UNIQUE,
  purpose TEXT,
  scope TEXT,
  cm_roles TEXT,                            -- JSON: roles responsible for CM
  change_control_process TEXT,              -- Description of change control
  configuration_items TEXT,                 -- Description of what's under CM control
  baseline_management TEXT,                 -- How baselines are managed
  cm_audit_process TEXT,                    -- How CM is audited
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (ssp_id) REFERENCES ssp_documents(id) ON DELETE CASCADE
);

-- CM Baselines (multiple per SSP)
CREATE TABLE IF NOT EXISTS ssp_cm_baselines (
  id TEXT PRIMARY KEY,
  ssp_id TEXT NOT NULL,
  component TEXT NOT NULL,                  -- Component name
  benchmark TEXT,                           -- CIS, DISA STIG, vendor hardening guide
  version TEXT,
  compliance_pct TEXT,                      -- Percentage compliant
  last_scan TEXT,                           -- Date of last compliance scan
  tool_used TEXT,                           -- Scanning tool used
  deviations TEXT,                          -- Description of any deviations
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (ssp_id) REFERENCES ssp_documents(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ssp_cm_baselines_ssp ON ssp_cm_baselines(ssp_id);

-- Track migration
INSERT OR IGNORE INTO schema_migrations (version, name, description) VALUES
  ('migrate-020-fisma-ssp-tables', 'fisma-ssp-tables', 'FISMA SSP Builder supporting tables');

-- 11. Enhanced POA&M for FISMA SSP (links to existing poams table)
CREATE TABLE IF NOT EXISTS ssp_poam_summary (
  id TEXT PRIMARY KEY,
  ssp_id TEXT NOT NULL UNIQUE,
  total_open INTEGER DEFAULT 0,
  total_closed INTEGER DEFAULT 0,
  critical_count INTEGER DEFAULT 0,
  high_count INTEGER DEFAULT 0,
  moderate_count INTEGER DEFAULT 0,
  low_count INTEGER DEFAULT 0,
  overdue_count INTEGER DEFAULT 0,
  review_frequency TEXT,                    -- Monthly, Quarterly, etc.
  remediation_workflow TEXT,                -- Description of remediation process
  last_updated TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (ssp_id) REFERENCES ssp_documents(id) ON DELETE CASCADE
);
