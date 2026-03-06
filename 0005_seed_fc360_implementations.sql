-- Migration: 0005_seed_fc360_implementations.sql
-- ForgeComply 360 (sys-001) control implementations
-- Full FedRAMP Moderate baseline: 336 controls
-- Responsibility assignments reflect Cloudflare-hosted SaaS model:
--   - Physical/Environmental/Media: inherited from Cloudflare
--   - Audit/Config/Contingency/IR/Maintenance/SC/SI: shared responsibility
--   - All others: provider (Forge) responsibility
-- Requires: 0003 (control_definitions), 0004 (sys-001)

INSERT OR IGNORE INTO control_implementations
  (id, system_id, control_definition_id, implementation_status, responsibility,
   implementation_narrative, assessment_status, created_at, updated_at)
SELECT
  lower(hex(randomblob(16))),
  'sys-001',
  cd.id,
  -- Implementation status
  CASE
    WHEN cd.control_id IN ('CA-8','CA-8(1)','RA-5(3)','SI-2(2)','CM-3(2)')
      THEN 'partially_implemented'
    WHEN cd.control_id IN ('PE-18','MA-3','MA-3(1)','MA-3(2)','MP-3','MP-4','MP-5')
      THEN 'not_applicable'
    ELSE 'implemented'
  END,
  -- Responsibility assignment
  CASE
    WHEN cd.control_id IN (
      'PE-1','PE-2','PE-3','PE-4','PE-5','PE-6','PE-8','PE-9','PE-10',
      'PE-11','PE-12','PE-13','PE-14','PE-15','PE-16','PE-17','PE-18',
      'PE-2(3)','PE-3(1)','PE-6(1)','PE-6(4)','PE-8(1)','PE-11(1)',
      'PE-13(1)','PE-13(2)','PE-13(3)','PE-14(2)',
      'SC-8','SC-8(1)',
      'MP-1','MP-2','MP-3','MP-4','MP-5','MP-6','MP-6(2)','MP-7'
    ) THEN 'inherited'
    WHEN cd.family = 'Physical and Environmental Protection' THEN 'inherited'
    WHEN cd.family = 'Media Protection' THEN 'inherited'
    WHEN cd.family IN (
      'Audit and Accountability',
      'Configuration Management',
      'Contingency Planning',
      'Incident Response',
      'Maintenance',
      'System and Communications Protection',
      'System and Information Integrity'
    ) THEN 'shared'
    ELSE 'provider'
  END,
  -- Narrative (placeholder - to be enriched per control)
  'ForgeComply 360 implements this control as part of its FedRAMP Moderate authorization. Implementation details documented in SSP Section 13.',
  -- Assessment status
  CASE
    WHEN cd.control_id IN ('CA-8','CA-8(1)','RA-5(3)','SI-2(2)','CM-3(2)')
      THEN 'in_progress'
    ELSE 'satisfied'
  END,
  datetime('now'),
  datetime('now')
FROM control_definitions cd
WHERE cd.framework_id = 'fw_nist_800_53_r5'
  AND cd.baseline_moderate = 1;
