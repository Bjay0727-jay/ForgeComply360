-- Migration: 0004_seed_forge_production.sql
-- Forge Cyber Defense production organization, team, and systems
-- This is the provider organization (eating our own dog food)

-- ============================================================
-- ORGANIZATION
-- ============================================================

INSERT OR IGNORE INTO organizations (id, name, slug, domain, subscription_tier, is_active)
VALUES ('org_001', 'Forge Cyber Defense', 'forge-cyber-defense', 'forgecyberdefense.com', 'enterprise', 1);

-- ============================================================
-- USERS (passwords must be set via the application)
-- ============================================================

INSERT OR IGNORE INTO users (id, organization_id, email, role, auth_provider, is_active)
VALUES
  ('user_001', 'org_001', 'stanley.riley@forgecyberdefense.com', 'owner', 'local', 1),
  ('user-001', 'org_001', 'admin@forgecyberdefense.com', 'admin', 'local', 1),
  ('user-002', 'org_001', 'analyst@forgecyberdefense.com', 'analyst', 'local', 1),
  ('user-003', 'org_001', 'auditor@forgecyberdefense.com', 'analyst', 'local', 1);

-- ============================================================
-- SYSTEMS
-- ============================================================

-- ForgeComply 360 Platform - FedRAMP Moderate target
INSERT OR IGNORE INTO systems (id, organization_id, name, acronym, description, system_type, impact_level, confidentiality_impact, integrity_impact, availability_impact, authorization_status, hosting_environment, is_active)
VALUES ('sys-001', 'org_001', 'ForgeComply 360 Platform', 'FC360',
  'Enterprise compliance automation platform hosted on Cloudflare edge infrastructure. Processes federal compliance data including CUI.',
  'major_application', 'moderate', 'moderate', 'moderate', 'moderate',
  'authorized', 'cloud', 1);

-- ForgeSOC Security Operations - FedRAMP Moderate
INSERT OR IGNORE INTO systems (id, organization_id, name, acronym, description, system_type, impact_level, confidentiality_impact, integrity_impact, availability_impact, authorization_status, hosting_environment, is_active)
VALUES ('sys-002', 'org_001', 'ForgeSOC Security Operations', 'FSOC',
  '24/7 security operations center platform providing threat monitoring, incident response, and alert management.',
  'major_application', 'moderate', 'moderate', 'moderate', 'moderate',
  'authorized', 'cloud', 1);

-- ForgeRedOps Offensive Security - High Impact
INSERT OR IGNORE INTO systems (id, organization_id, name, acronym, description, system_type, impact_level, confidentiality_impact, integrity_impact, availability_impact, authorization_status, hosting_environment, is_active)
VALUES ('sys-003', 'org_001', 'ForgeRedOps Offensive Security', 'FROS',
  'AI-powered penetration testing platform with 24 autonomous security agents. Handles sensitive vulnerability data.',
  'major_application', 'high', 'high', 'high', 'moderate',
  'in_progress', 'cloud', 1);
