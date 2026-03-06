-- Migration: 0002_seed_frameworks.sql
-- Seed compliance frameworks supported by ForgeComply 360
-- These are reference data required before control_definitions can be seeded

INSERT OR IGNORE INTO compliance_frameworks (id, name, short_name, version, description, authority, is_active)
VALUES
  ('fw_nist_800_53_r5', 'NIST Special Publication 800-53 Revision 5', 'NIST 800-53', 'Rev 5', 'Security and Privacy Controls for Information Systems and Organizations', 'National Institute of Standards and Technology', 1),
  ('fw_fedramp_low', 'FedRAMP Low Baseline', 'FedRAMP Low', '5.0', 'Federal Risk and Authorization Management Program - Low Impact Level', 'FedRAMP PMO / GSA', 1),
  ('fw_fedramp_mod', 'FedRAMP Moderate Baseline', 'FedRAMP Moderate', '5.0', 'Federal Risk and Authorization Management Program - Moderate Impact Level', 'FedRAMP PMO / GSA', 1),
  ('fw_fedramp_high', 'FedRAMP High Baseline', 'FedRAMP High', '5.0', 'Federal Risk and Authorization Management Program - High Impact Level', 'FedRAMP PMO / GSA', 1),
  ('fw_nist_800_171', 'NIST Special Publication 800-171', 'NIST 800-171', 'Rev 3', 'Protecting Controlled Unclassified Information in Nonfederal Systems', 'National Institute of Standards and Technology', 1),
  ('fw_cmmc_l2', 'Cybersecurity Maturity Model Certification Level 2', 'CMMC L2', '2.0', 'Advanced cybersecurity practices for protecting CUI', 'Department of Defense', 1),
  ('fw_cmmc_l3', 'Cybersecurity Maturity Model Certification Level 3', 'CMMC L3', '2.0', 'Expert cybersecurity practices for protecting CUI against APTs', 'Department of Defense', 1),
  ('fw_hipaa', 'HIPAA Security Rule', 'HIPAA', '2013', 'Health Insurance Portability and Accountability Act Security Standards', 'HHS / OCR', 1),
  ('fw_soc2', 'SOC 2 Trust Services Criteria', 'SOC 2', '2017', 'Trust Services Criteria for Security, Availability, Processing Integrity, Confidentiality, and Privacy', 'AICPA', 1),
  ('fw_stateramp', 'StateRAMP Security Framework', 'StateRAMP', '2.0', 'Security verification for state and local government cloud services', 'StateRAMP', 1);
