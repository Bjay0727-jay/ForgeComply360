// oscalParser.ts — Parse OSCAL JSON files (SSP + Catalog) for bulk import

// ============================================================================
// TYPES
// ============================================================================

export interface OscalSystemInfo {
  name: string;
  acronym: string;
  description: string;
  impact_level: string;
  deployment_model: string;
  service_model: string;
  status: string;
}

export interface OscalImplementation {
  control_id: string;
  status: string;
  implementation_description: string;
  responsible_role: string;
}

export interface OscalSSPResult {
  system: OscalSystemInfo;
  implementations: OscalImplementation[];
  metadata: { title: string; version: string; oscal_version: string };
  errors: string[];
}

export interface OscalControl {
  control_id: string;
  family: string;
  title: string;
  description: string;
  priority: string;
  baseline_low: number;
  baseline_moderate: number;
  baseline_high: number;
  parent_control_id: string;
  is_enhancement: number;
  sort_order: number;
}

export interface OscalCatalogResult {
  framework: { name: string; version: string };
  controls: OscalControl[];
  errors: string[];
}

// ============================================================================
// STATUS MAPPING: OSCAL hyphenated → app underscore format
// ============================================================================

const OSCAL_STATUS_MAP: Record<string, string> = {
  'implemented': 'implemented',
  'partially-implemented': 'partially_implemented',
  'partial': 'partially_implemented',
  'planned': 'planned',
  'alternative': 'alternative',
  'not-applicable': 'not_applicable',
  'not-implemented': 'not_implemented',
  'under-development': 'planned',
};

function mapOscalStatus(oscalStatus: string): string {
  const normalized = (oscalStatus || '').toLowerCase().trim();
  return OSCAL_STATUS_MAP[normalized] || 'not_implemented';
}

// ============================================================================
// OSCAL SSP PARSER
// ============================================================================

export function parseOscalSSP(json: any): OscalSSPResult {
  const errors: string[] = [];
  const ssp = json?.['system-security-plan'] || json;

  if (!ssp) {
    return { system: emptySystem(), implementations: [], metadata: { title: '', version: '', oscal_version: '' }, errors: ['Invalid OSCAL SSP: missing root element'] };
  }

  // Extract metadata
  const meta = ssp.metadata || {};
  const metadata = {
    title: meta.title || '',
    version: meta.version || meta['last-modified'] || '',
    oscal_version: meta['oscal-version'] || json?.['oscal-version'] || '',
  };

  // Extract system characteristics
  const chars = ssp['system-characteristics'] || {};
  const secLevel = chars['security-sensitivity-level'] || '';
  const impactMap: Record<string, string> = {
    'fips-199-low': 'low', 'low': 'low',
    'fips-199-moderate': 'moderate', 'moderate': 'moderate',
    'fips-199-high': 'high', 'high': 'high',
  };

  const system: OscalSystemInfo = {
    name: chars['system-name'] || '',
    acronym: chars['system-name-short'] || '',
    description: extractText(chars.description),
    impact_level: impactMap[secLevel.toLowerCase()] || 'moderate',
    deployment_model: extractDeploymentModel(chars),
    service_model: extractServiceModel(chars),
    status: extractSystemStatus(chars),
  };

  if (!system.name) {
    errors.push('SSP missing system-name in system-characteristics');
  }

  // Extract control implementations
  const implementations: OscalImplementation[] = [];
  const ctrlImpl = ssp['control-implementation'] || {};
  const implReqs = ctrlImpl['implemented-requirements'] || [];

  for (const req of implReqs) {
    const controlId = req['control-id'] || '';
    if (!controlId) {
      errors.push('Skipping implemented-requirement with no control-id');
      continue;
    }

    // Extract implementation description from by-components or statements
    let description = '';
    let role = '';

    if (req['by-components'] && req['by-components'].length > 0) {
      const comp = req['by-components'][0];
      description = extractText(comp.description);
      if (comp['implementation-status']?.state) {
        // Per-component status overrides
      }
      // Extract responsible role from set-parameters or props
      if (comp['responsible-roles'] && comp['responsible-roles'].length > 0) {
        role = comp['responsible-roles'][0]['role-id'] || '';
      }
    }

    if (!description && req.statements) {
      // Concatenate statement descriptions
      const stmts = Object.values(req.statements) as any[];
      description = stmts
        .map((s: any) => {
          if (s['by-components'] && s['by-components'].length > 0) {
            return extractText(s['by-components'][0].description);
          }
          return extractText(s.description);
        })
        .filter(Boolean)
        .join(' ');
    }

    if (!description) {
      description = extractText(req.description);
    }

    if (!role && req['responsible-roles'] && req['responsible-roles'].length > 0) {
      role = req['responsible-roles'][0]['role-id'] || '';
    }

    // Determine status
    let status = 'not_implemented';
    if (req['implementation-status']?.state) {
      status = mapOscalStatus(req['implementation-status'].state);
    } else if (req['by-components']?.[0]?.['implementation-status']?.state) {
      status = mapOscalStatus(req['by-components'][0]['implementation-status'].state);
    } else if (description) {
      status = 'implemented'; // Has description = assume implemented
    }

    implementations.push({
      control_id: controlId.toUpperCase(),
      status,
      implementation_description: description,
      responsible_role: role,
    });
  }

  if (implementations.length === 0) {
    errors.push('No implemented-requirements found in control-implementation section');
  }

  return { system, implementations, metadata, errors };
}

// ============================================================================
// OSCAL CATALOG PARSER
// ============================================================================

export function parseOscalCatalog(json: any): OscalCatalogResult {
  const errors: string[] = [];
  const catalog = json?.catalog || json;

  if (!catalog) {
    return { framework: { name: '', version: '' }, controls: [], errors: ['Invalid OSCAL Catalog: missing root element'] };
  }

  const meta = catalog.metadata || {};
  const framework = {
    name: meta.title || 'Imported Catalog',
    version: meta.version || '1.0',
  };

  const controls: OscalControl[] = [];
  let sortOrder = 1;

  const groups = catalog.groups || [];
  if (groups.length === 0) {
    errors.push('No control groups found in catalog');
  }

  for (const group of groups) {
    const familyId = (group.id || '').toUpperCase();
    const familyTitle = group.title || familyId;

    const groupControls = group.controls || [];
    for (const ctrl of groupControls) {
      const controlId = (ctrl.id || '').toUpperCase();
      if (!controlId) {
        errors.push(`Skipping control with no id in group ${familyId}`);
        continue;
      }

      controls.push({
        control_id: controlId,
        family: familyId || controlId.replace(/-\d+.*$/, ''),
        title: ctrl.title || '',
        description: extractControlDescription(ctrl),
        priority: extractPriority(ctrl),
        baseline_low: 0,
        baseline_moderate: 0,
        baseline_high: 0,
        parent_control_id: '',
        is_enhancement: 0,
        sort_order: sortOrder++,
      });

      // Parse enhancements (nested controls)
      const enhancements = ctrl.controls || [];
      for (const enh of enhancements) {
        const enhId = (enh.id || '').toUpperCase();
        if (!enhId) continue;

        controls.push({
          control_id: enhId,
          family: familyId || controlId.replace(/-\d+.*$/, ''),
          title: enh.title || '',
          description: extractControlDescription(enh),
          priority: extractPriority(enh),
          baseline_low: 0,
          baseline_moderate: 0,
          baseline_high: 0,
          parent_control_id: controlId,
          is_enhancement: 1,
          sort_order: sortOrder++,
        });
      }
    }
  }

  if (controls.length === 0) {
    errors.push('No controls parsed from catalog');
  }

  return { framework, controls, errors };
}

// ============================================================================
// HELPERS
// ============================================================================

function emptySystem(): OscalSystemInfo {
  return { name: '', acronym: '', description: '', impact_level: 'moderate', deployment_model: 'cloud', service_model: 'saas', status: 'operational' };
}

function extractText(value: any): string {
  if (!value) return '';
  if (typeof value === 'string') return value.trim();
  // OSCAL markup-multiline can be an object with prose
  if (value.prose) return value.prose.trim();
  // Could also be an array of paragraphs
  if (Array.isArray(value)) return value.map(v => extractText(v)).join(' ');
  return String(value).trim();
}

function extractControlDescription(ctrl: any): string {
  // Look for the "statement" part
  const parts = ctrl.parts || [];
  for (const part of parts) {
    if (part.name === 'statement' || part.name === 'overview') {
      let text = extractText(part.prose);
      // Concatenate sub-parts
      if (part.parts) {
        text += ' ' + part.parts.map((p: any) => extractText(p.prose)).filter(Boolean).join(' ');
      }
      return text.trim();
    }
  }
  // Fallback: try prose directly
  return extractText(ctrl.prose);
}

function extractPriority(ctrl: any): string {
  const props = ctrl.props || [];
  for (const prop of props) {
    if (prop.name === 'priority') {
      return (prop.value || 'P1').toUpperCase();
    }
  }
  return 'P1';
}

function extractDeploymentModel(chars: any): string {
  const props = chars.props || chars['system-information']?.props || [];
  for (const prop of Array.isArray(props) ? props : []) {
    if (prop.name === 'deployment-model' || prop.name === 'cloud-deployment-model') {
      const val = (prop.value || '').toLowerCase();
      if (['cloud', 'on_premises', 'hybrid', 'government_cloud'].includes(val)) return val;
      if (val.includes('government')) return 'government_cloud';
      if (val.includes('hybrid')) return 'hybrid';
      if (val.includes('private') || val.includes('on-prem')) return 'on_premises';
      return 'cloud';
    }
  }
  return 'cloud';
}

function extractServiceModel(chars: any): string {
  const props = chars.props || chars['system-information']?.props || [];
  for (const prop of Array.isArray(props) ? props : []) {
    if (prop.name === 'service-model' || prop.name === 'cloud-service-model') {
      const val = (prop.value || '').toLowerCase();
      if (['iaas', 'paas', 'saas', 'other'].includes(val)) return val;
      return 'other';
    }
  }
  return 'saas';
}

function extractSystemStatus(chars: any): string {
  const status = chars.status?.state || '';
  const map: Record<string, string> = {
    'operational': 'operational',
    'under-development': 'under_development',
    'under-major-modification': 'under_development',
    'disposition': 'disposition',
    'other': 'operational',
  };
  return map[status.toLowerCase()] || 'operational';
}
