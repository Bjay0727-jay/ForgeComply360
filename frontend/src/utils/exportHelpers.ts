// exportHelpers.ts — Pure browser-based export utilities (no external libraries)

/**
 * Trigger a file download in the browser via an invisible anchor element.
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Escape HTML special characters for safe embedding inside Word-HTML documents.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Escape a value for safe embedding in a CSV cell.
 */
function csvCell(value: string | number | undefined | null): string {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// ---------------------------------------------------------------------------
// 1. Export as DOCX (HTML-based Word document)
// ---------------------------------------------------------------------------

/**
 * Creates an HTML document with Microsoft Office XML namespace declarations
 * so that Word opens it natively with proper formatting.
 * Saved with a .doc extension (Word opens these seamlessly).
 */
export async function exportAsDocx(title: string, content: string): Promise<void> {
  const now = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const html = `
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page {
      size: 8.5in 11in;
      margin: 1in;
    }
    body {
      font-family: 'Calibri', 'Segoe UI', Arial, sans-serif;
      font-size: 11pt;
      color: #1a1a1a;
      line-height: 1.5;
    }
    h1 {
      font-size: 22pt;
      color: #1e3a5f;
      border-bottom: 2px solid #1e3a5f;
      padding-bottom: 6pt;
      margin-bottom: 12pt;
    }
    h2 {
      font-size: 16pt;
      color: #2a5a8a;
      margin-top: 18pt;
      margin-bottom: 8pt;
    }
    h3 {
      font-size: 13pt;
      color: #3a6a9a;
      margin-top: 12pt;
      margin-bottom: 6pt;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 10pt 0;
    }
    th, td {
      border: 1px solid #b0b0b0;
      padding: 6pt 8pt;
      text-align: left;
      vertical-align: top;
      font-size: 10pt;
    }
    th {
      background-color: #1e3a5f;
      color: #ffffff;
      font-weight: bold;
    }
    tr:nth-child(even) td {
      background-color: #f4f7fb;
    }
    .meta {
      color: #666;
      font-size: 10pt;
      margin-bottom: 16pt;
    }
    .page-break {
      page-break-before: always;
    }
    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 72pt;
      color: rgba(200, 200, 200, 0.15);
      font-weight: bold;
      z-index: -1;
      pointer-events: none;
      white-space: nowrap;
    }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p class="meta">Generated on ${escapeHtml(now)} by ForgeComply 360</p>
  ${content}
</body>
</html>`.trim();

  const blob = new Blob([html], { type: 'application/msword' });
  const safeName = title.replace(/[^a-zA-Z0-9_\- ]/g, '').replace(/\s+/g, '_');
  downloadBlob(blob, `${safeName}.doc`);
}

// ---------------------------------------------------------------------------
// 2. Export SSP Package as a formatted Word-compatible document
// ---------------------------------------------------------------------------

export async function exportSSPPackageDoc(
  systemName: string,
  frameworkName: string,
  implementations: any[],
  orgName: string,
): Promise<void> {
  const now = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // --- Title Page ---
  let content = `
  <div style="text-align:center; padding-top:120pt; padding-bottom:120pt;">
    <h1 style="font-size:28pt; border:none; text-align:center;">${escapeHtml(frameworkName)}</h1>
    <h2 style="font-size:20pt; color:#333; text-align:center;">System Security Plan</h2>
    <p style="font-size:14pt; color:#555; margin-top:24pt;">${escapeHtml(systemName)}</p>
    <p style="font-size:12pt; color:#777; margin-top:12pt;">${escapeHtml(orgName)}</p>
    <p style="font-size:11pt; color:#999; margin-top:24pt;">${escapeHtml(now)}</p>
    <p style="font-size:9pt; color:#aaa; margin-top:36pt;">Generated by ForgeComply 360</p>
  </div>
  <div class="page-break"></div>
  `;

  // --- Table of Contents ---
  content += `
  <h2>Table of Contents</h2>
  <ol>
    <li>Introduction</li>
    <li>System Overview</li>
    <li>Control Implementation Summary</li>
    <li>Control Implementation Details</li>
  </ol>
  <div class="page-break"></div>
  `;

  // --- Section 1: Introduction ---
  content += `
  <h2>1. Introduction</h2>
  <p>This System Security Plan (SSP) documents the security controls implemented for
  <strong>${escapeHtml(systemName)}</strong> in accordance with the
  <strong>${escapeHtml(frameworkName)}</strong> framework. It provides a comprehensive
  record of the security posture, control implementation status, and responsible parties
  for the organization <strong>${escapeHtml(orgName)}</strong>.</p>
  `;

  // --- Section 2: System Overview ---
  const totalControls = implementations.length;
  const statusCounts: Record<string, number> = {};
  for (const impl of implementations) {
    const st = impl.status || 'not_implemented';
    statusCounts[st] = (statusCounts[st] || 0) + 1;
  }

  content += `
  <h2>2. System Overview</h2>
  <table>
    <tr><th>Attribute</th><th>Value</th></tr>
    <tr><td>System Name</td><td>${escapeHtml(systemName)}</td></tr>
    <tr><td>Framework</td><td>${escapeHtml(frameworkName)}</td></tr>
    <tr><td>Organization</td><td>${escapeHtml(orgName)}</td></tr>
    <tr><td>Total Controls</td><td>${totalControls}</td></tr>
    <tr><td>Date Generated</td><td>${escapeHtml(now)}</td></tr>
  </table>
  `;

  // --- Section 3: Summary ---
  content += `
  <h2>3. Control Implementation Summary</h2>
  <table>
    <tr><th>Status</th><th>Count</th><th>Percentage</th></tr>
  `;
  const statusLabels: Record<string, string> = {
    implemented: 'Implemented',
    partially_implemented: 'Partially Implemented',
    planned: 'Planned',
    not_implemented: 'Not Implemented',
    not_applicable: 'Not Applicable',
  };
  for (const [key, label] of Object.entries(statusLabels)) {
    const count = statusCounts[key] || 0;
    const pct = totalControls > 0 ? ((count / totalControls) * 100).toFixed(1) : '0.0';
    content += `<tr><td>${label}</td><td>${count}</td><td>${pct}%</td></tr>`;
  }
  content += `</table><div class="page-break"></div>`;

  // --- Section 4: Control Details ---
  content += `<h2>4. Control Implementation Details</h2>`;

  for (const impl of implementations) {
    const controlId = impl.control_id || impl.controlId || 'N/A';
    const title = impl.title || impl.control_title || '';
    const status = statusLabels[impl.status] || impl.status || 'Not Implemented';
    const role = impl.responsible_role || impl.responsibleRole || 'Unassigned';
    const narrative = impl.narrative || impl.implementation_narrative || '';

    content += `
    <h3>${escapeHtml(controlId)}${title ? ' — ' + escapeHtml(title) : ''}</h3>
    <table>
      <tr><th style="width:160px;">Control ID</th><td>${escapeHtml(controlId)}</td></tr>
      ${title ? `<tr><th>Title</th><td>${escapeHtml(title)}</td></tr>` : ''}
      <tr><th>Status</th><td>${escapeHtml(status)}</td></tr>
      <tr><th>Responsible Role</th><td>${escapeHtml(role)}</td></tr>
      <tr><th>Implementation Narrative</th><td>${narrative ? escapeHtml(narrative) : '<em>No narrative provided</em>'}</td></tr>
    </table>
    `;
  }

  const docTitle = `SSP - ${systemName} - ${frameworkName}`;
  await exportAsDocx(docTitle, content);
}

// ---------------------------------------------------------------------------
// 2b. Export full SSP with authored sections as a formatted Word doc
// ---------------------------------------------------------------------------

const SSP_SECTION_LABELS_EXPORT: Record<string, string> = {
  system_info: 'System Information', authorization_boundary: 'Authorization Boundary',
  data_flow: 'Data Flow', network_architecture: 'Network Architecture',
  system_interconnections: 'System Interconnections', personnel: 'Personnel & Roles',
  control_implementations: 'Control Implementations', contingency_plan: 'Contingency Plan Summary',
  incident_response: 'Incident Response Summary', continuous_monitoring: 'Continuous Monitoring Strategy',
};

const SSP_SECTION_ORDER = ['system_info','authorization_boundary','data_flow','network_architecture','system_interconnections','personnel','control_implementations','contingency_plan','incident_response','continuous_monitoring'];

export async function exportFullSSPDoc(
  systemName: string,
  frameworkName: string,
  orgName: string,
  sections: Record<string, { content: string; status: string }>,
  implementations?: any[],
): Promise<void> {
  const now = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  let content = `
  <div style="text-align:center; padding-top:120pt; padding-bottom:120pt;">
    <h1 style="font-size:28pt; border:none; text-align:center;">${escapeHtml(frameworkName)}</h1>
    <h2 style="font-size:20pt; color:#333; text-align:center;">System Security Plan</h2>
    <p style="font-size:14pt; color:#555; margin-top:24pt;">${escapeHtml(systemName)}</p>
    <p style="font-size:12pt; color:#777; margin-top:12pt;">${escapeHtml(orgName)}</p>
    <p style="font-size:11pt; color:#999; margin-top:24pt;">${escapeHtml(now)}</p>
    <p style="font-size:9pt; color:#aaa; margin-top:36pt;">Generated by ForgeComply 360</p>
  </div>
  <div class="page-break"></div>
  `;

  // Table of Contents
  content += `<h2>Table of Contents</h2><ol>`;
  SSP_SECTION_ORDER.forEach((key, i) => {
    content += `<li>${SSP_SECTION_LABELS_EXPORT[key] || key}</li>`;
  });
  if (implementations?.length) content += `<li>Detailed Control Implementations</li>`;
  content += `</ol><div class="page-break"></div>`;

  // Sections
  SSP_SECTION_ORDER.forEach((key, i) => {
    const label = SSP_SECTION_LABELS_EXPORT[key] || key;
    const sec = sections[key];
    const text = sec?.content?.trim() || '(Section not yet completed)';
    content += `<h2>${i + 1}. ${escapeHtml(label)}</h2>`;
    // Convert newlines to paragraphs
    text.split(/\n\n+/).forEach(para => {
      content += `<p>${escapeHtml(para.trim()).replace(/\n/g, '<br/>')}</p>`;
    });
    content += `<div class="page-break"></div>`;
  });

  // Detailed control implementations table (if provided)
  if (implementations?.length) {
    const statusLabels: Record<string, string> = {
      implemented: 'Implemented', partially_implemented: 'Partially Implemented',
      planned: 'Planned', not_implemented: 'Not Implemented', not_applicable: 'Not Applicable',
    };
    content += `<h2>${SSP_SECTION_ORDER.length + 1}. Detailed Control Implementations</h2>`;
    for (const impl of implementations) {
      const controlId = impl.control_id || 'N/A';
      const title = impl.title || impl.control_title || '';
      const status = statusLabels[impl.status] || impl.status || 'Not Implemented';
      const narrative = impl.narrative || impl.implementation_narrative || '';
      content += `
      <h3>${escapeHtml(controlId)}${title ? ' — ' + escapeHtml(title) : ''}</h3>
      <table>
        <tr><th style="width:160px;">Status</th><td>${escapeHtml(status)}</td></tr>
        <tr><th>Responsible Role</th><td>${escapeHtml(impl.responsible_role || 'Unassigned')}</td></tr>
        <tr><th>Narrative</th><td>${narrative ? escapeHtml(narrative) : '<em>Pending</em>'}</td></tr>
      </table>`;
    }
  }

  await exportAsDocx(`SSP - ${systemName} - ${frameworkName}`, content);
}

export async function exportSSPSectionDoc(
  sectionLabel: string,
  sectionContent: string,
  systemName: string,
  frameworkName: string,
  orgName: string,
): Promise<void> {
  const now = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  let content = `
  <h1>System Security Plan — ${escapeHtml(sectionLabel)}</h1>
  <table>
    <tr><th>System</th><td>${escapeHtml(systemName)}</td></tr>
    <tr><th>Framework</th><td>${escapeHtml(frameworkName)}</td></tr>
    <tr><th>Organization</th><td>${escapeHtml(orgName)}</td></tr>
    <tr><th>Date</th><td>${escapeHtml(now)}</td></tr>
  </table>
  <h2>${escapeHtml(sectionLabel)}</h2>`;
  sectionContent.split(/\n\n+/).forEach(para => {
    content += `<p>${escapeHtml(para.trim()).replace(/\n/g, '<br/>')}</p>`;
  });
  await exportAsDocx(`SSP Section - ${sectionLabel} - ${systemName}`, content);
}

// ---------------------------------------------------------------------------
// 3. Export controls as CSV
// ---------------------------------------------------------------------------

export function exportControlsCSV(
  controls: any[],
  implementations: Record<string, any>,
  frameworkName: string,
): void {
  const headers = [
    'Control ID',
    'Title',
    'Family',
    'Status',
    'Responsible Role',
    'Implementation Description',
    'ForgeML Writer',
  ];

  const rows: string[] = [headers.map(csvCell).join(',')];

  for (const ctrl of controls) {
    const id = ctrl.control_id || ctrl.controlId || ctrl.id || '';
    const impl = implementations[id] || {};
    const row = [
      csvCell(id),
      csvCell(ctrl.title || ''),
      csvCell(ctrl.family || ''),
      csvCell(impl.status || 'not_implemented'),
      csvCell(impl.responsible_role || impl.responsibleRole || ''),
      csvCell(impl.description || impl.implementation_description || ''),
      csvCell(impl.ai_narrative || impl.narrative || ''),
    ];
    rows.push(row.join(','));
  }

  const csv = rows.join('\r\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const safeName = frameworkName.replace(/[^a-zA-Z0-9_\- ]/g, '').replace(/\s+/g, '_');
  downloadBlob(blob, `${safeName}_Controls_Export.csv`);
}

// ---------------------------------------------------------------------------
// 4. Export audit logs as CSV
// ---------------------------------------------------------------------------

export function exportAuditLogCSV(logs: any[]): void {
  const headers = [
    'Timestamp',
    'User',
    'Email',
    'Action',
    'Resource Type',
    'Resource ID',
    'Details',
    'IP Address',
  ];

  const rows: string[] = [headers.map(csvCell).join(',')];

  for (const log of logs) {
    let details = '';
    try {
      const obj = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
      details = JSON.stringify(obj);
    } catch {
      details = log.details || '';
    }
    const row = [
      csvCell(log.created_at || ''),
      csvCell(log.user_name || 'System'),
      csvCell(log.user_email || ''),
      csvCell(log.action || ''),
      csvCell(log.resource_type || ''),
      csvCell(log.resource_id || ''),
      csvCell(details),
      csvCell(log.ip_address || ''),
    ];
    rows.push(row.join(','));
  }

  const csv = rows.join('\r\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const date = new Date().toISOString().split('T')[0];
  downloadBlob(blob, `Activity_Log_Export_${date}.csv`);
}

/**
 * Export POA&Ms to CSV.
 */
export function exportPoamsCSV(poams: any[]): void {
  const headers = [
    'POA&M ID', 'Weakness Name', 'Description', 'System', 'Risk Level', 'Status', 'Days Open', 'Due Date', 'Overdue',
    'Assigned To', 'Responsible Party', 'Cost Estimate', 'Milestones', 'Affected Assets', 'Mapped Controls', 'Evidence Count',
    'FedRAMP Ready', 'Data Classification', 'CUI Category', 'Impact C/I/A',
    'Deviation Type', 'Deviation Approved', 'Deviation Expires', 'Review Frequency', 'Created'
  ];
  const rows: string[] = [headers.map(csvCell).join(',')];

  for (const p of poams) {
    const impactCIA = [p.impact_confidentiality, p.impact_integrity, p.impact_availability].filter(Boolean).join('/');
    const row = [
      csvCell(p.poam_id),
      csvCell(p.weakness_name),
      csvCell(p.weakness_description),
      csvCell(p.system_name || ''),
      csvCell(p.risk_level),
      csvCell(p.status),
      csvCell(p.days_open),
      csvCell(p.scheduled_completion),
      csvCell(p.is_overdue ? 'Yes' : 'No'),
      csvCell(p.assigned_to_name || ''),
      csvCell(p.responsible_party || ''),
      csvCell(p.cost_estimate || ''),
      csvCell(p.milestone_total > 0 ? `${p.milestone_completed}/${p.milestone_total}` : ''),
      csvCell(p.asset_count || 0),
      csvCell(p.control_count || 0),
      csvCell(p.evidence_count || 0),
      csvCell((p.asset_count > 0 && p.control_count > 0) ? 'Yes' : 'No'),
      csvCell(p.data_classification || 'internal'),
      csvCell(p.cui_category || ''),
      csvCell(impactCIA || ''),
      csvCell(p.deviation_type || ''),
      csvCell(p.deviation_approved_by ? 'Yes' : 'No'),
      csvCell(p.deviation_expires_at || ''),
      csvCell(p.deviation_review_frequency || ''),
      csvCell(p.created_at),
    ];
    rows.push(row.join(','));
  }

  const csv = rows.join('\r\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const date = new Date().toISOString().split('T')[0];
  downloadBlob(blob, `POAMs_Export_${date}.csv`);
}

// ---------------------------------------------------------------------------
// 7. Markdown to HTML converter for Word export
// ---------------------------------------------------------------------------

function markdownToHtml(md: string): string {
  let html = '';
  const lines = md.split('\n');
  let inTable = false;
  let inList = false;
  let tableHeaderDone = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines (close lists)
    if (!trimmed) {
      if (inList) { html += '</ul>'; inList = false; }
      if (inTable) { html += '</table>'; inTable = false; tableHeaderDone = false; }
      continue;
    }

    // Horizontal rule
    if (/^---+$/.test(trimmed) || /^\*\*\*+$/.test(trimmed)) {
      if (inList) { html += '</ul>'; inList = false; }
      if (inTable) { html += '</table>'; inTable = false; tableHeaderDone = false; }
      html += '<hr style="border:1px solid #cbd5e0; margin:16pt 0;"/>';
      continue;
    }

    // Headings
    if (/^###\s+/.test(trimmed)) {
      if (inList) { html += '</ul>'; inList = false; }
      if (inTable) { html += '</table>'; inTable = false; tableHeaderDone = false; }
      html += `<h3>${inlineFormat(escapeHtml(trimmed.replace(/^###\s+/, '')))}</h3>`;
      continue;
    }
    if (/^##\s+/.test(trimmed)) {
      if (inList) { html += '</ul>'; inList = false; }
      if (inTable) { html += '</table>'; inTable = false; tableHeaderDone = false; }
      html += `<h2>${inlineFormat(escapeHtml(trimmed.replace(/^##\s+/, '')))}</h2>`;
      continue;
    }
    if (/^#\s+/.test(trimmed)) {
      if (inList) { html += '</ul>'; inList = false; }
      if (inTable) { html += '</table>'; inTable = false; tableHeaderDone = false; }
      html += `<h1 style="border:none;">${inlineFormat(escapeHtml(trimmed.replace(/^#\s+/, '')))}</h1>`;
      continue;
    }

    // Table separator row (|---|---|)
    if (/^\|[\s\-:|]+\|$/.test(trimmed)) {
      tableHeaderDone = true;
      continue;
    }

    // Table row
    if (/^\|.*\|$/.test(trimmed)) {
      if (!inTable) {
        if (inList) { html += '</ul>'; inList = false; }
        html += '<table border="1" cellpadding="5" cellspacing="0" style="border-collapse:collapse;border-color:#cbd5e0;width:100%;font-size:9pt;margin:8pt 0;">';
        inTable = true;
        tableHeaderDone = false;
      }
      const cells = trimmed.split('|').filter((c, idx, arr) => idx > 0 && idx < arr.length - 1).map(c => c.trim());
      if (!tableHeaderDone) {
        html += '<tr style="background:#1e3a5f;color:white;">';
        cells.forEach(c => { html += `<th style="padding:6pt 8pt;font-weight:bold;">${inlineFormat(escapeHtml(c))}</th>`; });
        html += '</tr>';
      } else {
        html += '<tr>';
        cells.forEach(c => { html += `<td style="padding:6pt 8pt;">${inlineFormat(escapeHtml(c))}</td>`; });
        html += '</tr>';
      }
      continue;
    }

    // Bullet list
    if (/^[-*]\s+/.test(trimmed)) {
      if (inTable) { html += '</table>'; inTable = false; tableHeaderDone = false; }
      if (!inList) { html += '<ul style="margin-left:20pt;margin-bottom:8pt;">'; inList = true; }
      html += `<li style="margin-bottom:3pt;">${inlineFormat(escapeHtml(trimmed.replace(/^[-*]\s+/, '')))}</li>`;
      continue;
    }

    // Numbered list
    if (/^\d+\.\s+/.test(trimmed)) {
      if (inTable) { html += '</table>'; inTable = false; tableHeaderDone = false; }
      if (inList) { html += '</ul>'; inList = false; }
      // Detect numbered section headings (starts with capital letter after number)
      if (/^\d+\.\s+[A-Z]/.test(trimmed) && trimmed.length < 100) {
        html += `<h2>${inlineFormat(escapeHtml(trimmed))}</h2>`;
      } else {
        html += `<p style="margin-left:20pt;text-indent:-20pt;">${inlineFormat(escapeHtml(trimmed))}</p>`;
      }
      continue;
    }

    // Regular paragraph
    if (inList) { html += '</ul>'; inList = false; }
    if (inTable) { html += '</table>'; inTable = false; tableHeaderDone = false; }
    html += `<p>${inlineFormat(escapeHtml(trimmed))}</p>`;
  }

  if (inList) html += '</ul>';
  if (inTable) html += '</table>';
  return html;
}

function inlineFormat(text: string): string {
  // Bold: **text** or __text__
  let result = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  result = result.replace(/__(.+?)__/g, '<strong>$1</strong>');
  // Italic: *text* or _text_
  result = result.replace(/\*(.+?)\*/g, '<em>$1</em>');
  result = result.replace(/_(.+?)_/g, '<em>$1</em>');
  // Code: `text`
  result = result.replace(/`(.+?)`/g, '<code style="background:#f0f0f0;padding:1pt 3pt;font-size:9pt;">$1</code>');
  return result;
}

// ---------------------------------------------------------------------------
// 8. Export compliance documents (ATO package) as formatted Word docs
// ---------------------------------------------------------------------------

export async function exportComplianceDoc(
  docType: string,
  title: string,
  content: string,
  metadata: Record<string, string> = {},
): Promise<void> {
  const now = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const systemName = metadata.systemName || metadata.system_name || 'System';
  const orgName = metadata.orgName || metadata.org_name || 'Organization';
  const impactLevel = metadata.impactLevel || metadata.impact_level || '';

  // Title page
  let html = `
  <div style="text-align:center; padding-top:100pt; padding-bottom:100pt;">
    <h1 style="font-size:26pt; border:none; text-align:center;">${escapeHtml(docType)}</h1>
    <p style="font-size:16pt; color:#333; margin-top:20pt;">${escapeHtml(systemName)}</p>
    ${impactLevel ? `<p style="font-size:12pt; color:#555; margin-top:8pt;">Impact Level: ${escapeHtml(impactLevel)}</p>` : ''}
    <p style="font-size:12pt; color:#777; margin-top:16pt;">${escapeHtml(orgName)}</p>
    <p style="font-size:11pt; color:#999; margin-top:20pt;">${escapeHtml(now)}</p>
    <p style="font-size:9pt; color:#aaa; margin-top:32pt;">Generated by ForgeComply 360</p>
  </div>
  <div class="page-break"></div>
  `;

  // Metadata table
  const metaEntries = Object.entries(metadata).filter(([k]) => !['systemName','system_name','orgName','org_name','impactLevel','impact_level'].includes(k));
  if (metaEntries.length > 0) {
    html += `<h2>Document Information</h2><table>`;
    html += `<tr><th>System</th><td>${escapeHtml(systemName)}</td></tr>`;
    html += `<tr><th>Organization</th><td>${escapeHtml(orgName)}</td></tr>`;
    if (impactLevel) html += `<tr><th>Impact Level</th><td>${escapeHtml(impactLevel)}</td></tr>`;
    html += `<tr><th>Date</th><td>${escapeHtml(now)}</td></tr>`;
    for (const [key, val] of metaEntries) {
      if (val) html += `<tr><th>${escapeHtml(key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()))}</th><td>${escapeHtml(val)}</td></tr>`;
    }
    html += `</table><div class="page-break"></div>`;
  }

  // Content body — convert Markdown to HTML for professional formatting
  html += markdownToHtml(content);

  await exportAsDocx(title || docType, html);
}

// Compliance document type exporters (thin wrappers)
export const COMPLIANCE_DOC_TYPES: Record<string, string> = {
  'tpl-sar': 'Security Assessment Report (SAR)',
  'tpl-isra': 'Information System Risk Assessment (ISRA)',
  'tpl-pia': 'Privacy Impact Assessment (PIA)',
  'tpl-iscp': 'Information System Contingency Plan (ISCP)',
  'tpl-cmp': 'Configuration Management Plan (CMP)',
  'tpl-isa': 'Interconnection Security Agreement (ISA/MOU)',
  'tpl-ato-letter': 'Authorization to Operate (ATO) Letter',
  'tpl-fips199': 'FIPS 199 Security Categorization',
  'tpl-cptt': 'Contingency Plan Tabletop Exercise Report',
};

export function exportComplianceDocByTemplate(
  templateId: string,
  title: string,
  content: string,
  metadata: Record<string, string> = {},
): Promise<void> {
  const docType = COMPLIANCE_DOC_TYPES[templateId] || title;
  return exportComplianceDoc(docType, title, content, metadata);
}

// ============================================================================
// RISK REGISTER EXPORTS
// ============================================================================

export function exportRisksCSV(risks: any[]): void {
  const headers = ['Risk ID', 'Title', 'Description', 'System', 'Category', 'Likelihood', 'Impact', 'Risk Score', 'Risk Level', 'Treatment', 'Treatment Plan', 'Treatment Due Date', 'Owner', 'Status', 'Related Controls', 'Created', 'Updated'];
  const rows: string[] = [headers.map(csvCell).join(',')];

  for (const r of risks) {
    let controls = '';
    try { controls = JSON.parse(r.related_controls || '[]').join('; '); } catch { controls = ''; }
    const row = [
      csvCell(r.risk_id),
      csvCell(r.title),
      csvCell(r.description || ''),
      csvCell(r.system_name || ''),
      csvCell(r.category || ''),
      csvCell(r.likelihood),
      csvCell(r.impact),
      csvCell(r.risk_score),
      csvCell(r.risk_level),
      csvCell(r.treatment),
      csvCell(r.treatment_plan || ''),
      csvCell(r.treatment_due_date || ''),
      csvCell(r.owner || ''),
      csvCell(r.status),
      csvCell(controls),
      csvCell(r.created_at),
      csvCell(r.updated_at),
    ];
    rows.push(row.join(','));
  }

  const csv = rows.join('\r\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const date = new Date().toISOString().split('T')[0];
  downloadBlob(blob, `Risk_Register_${date}.csv`);
}

export async function exportRiskRegisterDoc(risks: any[], orgName: string): Promise<void> {
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const levelCounts: Record<string, number> = { critical: 0, high: 0, moderate: 0, low: 0 };
  const openRisks = risks.filter(r => r.status !== 'closed');
  for (const r of openRisks) { if (r.risk_level && levelCounts[r.risk_level] !== undefined) levelCounts[r.risk_level]++; }

  let html = `<div style="text-align:center;margin:80px 0 60px 0;">
    <p style="font-size:28pt;font-weight:bold;color:#1e3a5f;">Risk Register Report</p>
    <p style="font-size:14pt;color:#4a5568;margin-top:20px;">${escapeHtml(orgName)}</p>
    <p style="font-size:11pt;color:#718096;margin-top:10px;">Generated: ${date}</p>
  </div>
  <hr style="border:1px solid #cbd5e0;"/>
  <h2 style="color:#1e3a5f;margin-top:30px;">Executive Summary</h2>
  <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;border-color:#cbd5e0;width:100%;margin:10px 0 20px 0;">
    <tr style="background:#f7fafc;"><th>Metric</th><th>Value</th></tr>
    <tr><td>Total Open Risks</td><td style="font-weight:bold;">${openRisks.length}</td></tr>
    <tr><td>Critical</td><td style="color:#dc2626;font-weight:bold;">${levelCounts.critical}</td></tr>
    <tr><td>High</td><td style="color:#ea580c;font-weight:bold;">${levelCounts.high}</td></tr>
    <tr><td>Moderate</td><td style="color:#ca8a04;">${levelCounts.moderate}</td></tr>
    <tr><td>Low</td><td style="color:#16a34a;">${levelCounts.low}</td></tr>
  </table>
  <h2 style="color:#1e3a5f;">Risk Details</h2>
  <table border="1" cellpadding="5" cellspacing="0" style="border-collapse:collapse;border-color:#cbd5e0;width:100%;font-size:9pt;">
    <tr style="background:#1e3a5f;color:white;">
      <th>Risk ID</th><th>Title</th><th>Category</th><th>L</th><th>I</th><th>Score</th><th>Level</th><th>Treatment</th><th>Owner</th><th>Status</th>
    </tr>`;

  for (const r of risks) {
    const levelColor = r.risk_level === 'critical' ? '#fee2e2' : r.risk_level === 'high' ? '#ffedd5' : r.risk_level === 'moderate' ? '#fef9c3' : '#dcfce7';
    html += `<tr>
      <td>${escapeHtml(r.risk_id)}</td>
      <td>${escapeHtml(r.title)}</td>
      <td>${escapeHtml(r.category || '')}</td>
      <td style="text-align:center;">${r.likelihood}</td>
      <td style="text-align:center;">${r.impact}</td>
      <td style="text-align:center;font-weight:bold;background:${levelColor};">${r.risk_score}</td>
      <td style="background:${levelColor};">${escapeHtml(r.risk_level || '')}</td>
      <td>${escapeHtml(r.treatment || '')}</td>
      <td>${escapeHtml(r.owner || '')}</td>
      <td>${escapeHtml(r.status)}</td>
    </tr>`;
  }
  html += '</table>';
  html += '<p style="font-size:8pt;color:#a0aec0;margin-top:40px;text-align:center;">Generated by ForgeComply 360 &mdash; RiskForge ERM</p>';

  await exportAsDocx('Risk Register Report', html);
}

// ============================================================================
// VENDOR EXPORTS (VendorGuard TPRM)
// ============================================================================

export function exportVendorsCSV(vendors: any[]): void {
  const headers = ['Name', 'Category', 'Criticality', 'Risk Tier', 'Status', 'Overall Risk Score', 'Contact Name', 'Contact Email', 'Contract Start', 'Contract End', 'Last Assessment', 'Next Assessment', 'Data Classification', 'BAA', 'Created', 'Updated'];
  const rows: string[] = [headers.map(csvCell).join(',')];
  for (const v of vendors) {
    rows.push([
      csvCell(v.name), csvCell(v.category), csvCell(v.criticality), csvCell(v.risk_tier),
      csvCell(v.status), csvCell(v.overall_risk_score), csvCell(v.contact_name), csvCell(v.contact_email),
      csvCell(v.contract_start), csvCell(v.contract_end), csvCell(v.last_assessment_date),
      csvCell(v.next_assessment_date), csvCell(v.data_classification), csvCell(v.has_baa ? 'Yes' : 'No'),
      csvCell(v.created_at), csvCell(v.updated_at),
    ].join(','));
  }
  const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Vendor_Registry_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportVendorAssessmentDoc(vendor: any, orgName: string): Promise<void> {
  let meta: any = {};
  try { meta = JSON.parse(vendor.metadata || '{}'); } catch {}
  const assessments = (meta.assessments || []).slice(-5);

  const tierLabel = (t: number) => t === 1 ? 'Tier 1 — Critical (Quarterly)' : t === 2 ? 'Tier 2 — High (Semi-Annual)' : t === 3 ? 'Tier 3 — Moderate (Annual)' : 'Tier 4 — Low (Biennial)';
  const scoreColor = (s: number) => s >= 21 ? '#dcfce7' : s >= 16 ? '#fef9c3' : s >= 11 ? '#ffedd5' : '#fee2e2';

  let html = `<div style="text-align:center;margin-bottom:40px;">
    <h1 style="font-size:22pt;color:#1e3a5f;">Vendor Risk Assessment Report</h1>
    <p style="font-size:12pt;color:#4a5568;">${escapeHtml(orgName)} &mdash; VendorGuard TPRM</p>
    <p style="font-size:10pt;color:#a0aec0;">Generated: ${new Date().toLocaleDateString()}</p>
  </div>`;

  html += `<h2 style="color:#1e3a5f;border-bottom:2px solid #3182ce;padding-bottom:4px;">Vendor Information</h2>`;
  html += `<table style="width:100%;border-collapse:collapse;margin-bottom:20px;">`;
  const infoRows: [string, string][] = [
    ['Vendor Name', vendor.name || ''],
    ['Category', vendor.category || 'N/A'],
    ['Criticality', (vendor.criticality || 'medium').toUpperCase()],
    ['Status', (vendor.status || 'active').replace('_', ' ').toUpperCase()],
    ['Risk Tier', vendor.risk_tier ? tierLabel(vendor.risk_tier) : 'Not assessed'],
    ['Overall Risk Score', vendor.overall_risk_score ? `${vendor.overall_risk_score}/25` : 'Not assessed'],
    ['Contact', `${vendor.contact_name || ''} ${vendor.contact_email ? '(' + vendor.contact_email + ')' : ''}`],
    ['Contract Period', `${vendor.contract_start || 'N/A'} to ${vendor.contract_end || 'N/A'}`],
    ['Data Classification', (vendor.data_classification || 'N/A').toUpperCase()],
    ['BAA in Place', vendor.has_baa ? 'Yes' : 'No'],
    ['Last Assessment', vendor.last_assessment_date ? new Date(vendor.last_assessment_date).toLocaleDateString() : 'Never'],
    ['Next Assessment', vendor.next_assessment_date ? new Date(vendor.next_assessment_date).toLocaleDateString() : 'N/A'],
  ];
  for (const [label, value] of infoRows) {
    html += `<tr><td style="padding:6px 12px;border:1px solid #e2e8f0;font-weight:bold;width:200px;background:#f7fafc;">${label}</td><td style="padding:6px 12px;border:1px solid #e2e8f0;">${escapeHtml(value)}</td></tr>`;
  }
  html += '</table>';

  if (assessments.length > 0) {
    html += `<h2 style="color:#1e3a5f;border-bottom:2px solid #3182ce;padding-bottom:4px;">Assessment History</h2>`;
    html += `<table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:9pt;">
      <tr style="background:#edf2f7;"><th style="padding:6px;border:1px solid #e2e8f0;">Date</th><th style="padding:6px;border:1px solid #e2e8f0;">Assessor</th><th style="padding:6px;border:1px solid #e2e8f0;">Security</th><th style="padding:6px;border:1px solid #e2e8f0;">Data</th><th style="padding:6px;border:1px solid #e2e8f0;">Compliance</th><th style="padding:6px;border:1px solid #e2e8f0;">Incidents</th><th style="padding:6px;border:1px solid #e2e8f0;">Financial</th><th style="padding:6px;border:1px solid #e2e8f0;font-weight:bold;">Overall</th><th style="padding:6px;border:1px solid #e2e8f0;">Tier</th></tr>`;
    for (const a of assessments) {
      const sc = a.scores || {};
      html += `<tr>
        <td style="padding:4px 6px;border:1px solid #e2e8f0;">${new Date(a.date).toLocaleDateString()}</td>
        <td style="padding:4px 6px;border:1px solid #e2e8f0;">${escapeHtml(a.assessor || '')}</td>
        <td style="padding:4px 6px;border:1px solid #e2e8f0;text-align:center;">${sc.security_posture || '-'}</td>
        <td style="padding:4px 6px;border:1px solid #e2e8f0;text-align:center;">${sc.data_handling || '-'}</td>
        <td style="padding:4px 6px;border:1px solid #e2e8f0;text-align:center;">${sc.compliance_status || '-'}</td>
        <td style="padding:4px 6px;border:1px solid #e2e8f0;text-align:center;">${sc.incident_history || '-'}</td>
        <td style="padding:4px 6px;border:1px solid #e2e8f0;text-align:center;">${sc.financial_stability || '-'}</td>
        <td style="padding:4px 6px;border:1px solid #e2e8f0;text-align:center;font-weight:bold;background:${scoreColor(a.overall_score || 0)};">${a.overall_score || '-'}/25</td>
        <td style="padding:4px 6px;border:1px solid #e2e8f0;text-align:center;">${a.risk_tier || '-'}</td>
      </tr>`;
    }
    html += '</table>';
  }

  html += `<h2 style="color:#1e3a5f;border-bottom:2px solid #3182ce;padding-bottom:4px;">Risk Tier Definitions</h2>`;
  html += `<table style="width:100%;border-collapse:collapse;font-size:9pt;">
    <tr><td style="padding:4px 8px;border:1px solid #e2e8f0;font-weight:bold;background:#fee2e2;">Tier 4 (5-10)</td><td style="padding:4px 8px;border:1px solid #e2e8f0;">Critical risk — biennial reassessment minimum, immediate remediation required</td></tr>
    <tr><td style="padding:4px 8px;border:1px solid #e2e8f0;font-weight:bold;background:#ffedd5;">Tier 3 (11-15)</td><td style="padding:4px 8px;border:1px solid #e2e8f0;">Moderate risk — annual reassessment, active monitoring required</td></tr>
    <tr><td style="padding:4px 8px;border:1px solid #e2e8f0;font-weight:bold;background:#fef9c3;">Tier 2 (16-20)</td><td style="padding:4px 8px;border:1px solid #e2e8f0;">Low-moderate risk — semi-annual reassessment</td></tr>
    <tr><td style="padding:4px 8px;border:1px solid #e2e8f0;font-weight:bold;background:#dcfce7;">Tier 1 (21-25)</td><td style="padding:4px 8px;border:1px solid #e2e8f0;">Low risk — quarterly reassessment, standard monitoring</td></tr>
  </table>`;
  html += '<p style="font-size:8pt;color:#a0aec0;margin-top:40px;text-align:center;">Generated by ForgeComply 360 &mdash; VendorGuard TPRM</p>';

  await exportAsDocx('Vendor Risk Assessment - ' + (vendor.name || 'Report'), html);
}

// ============================================================================
// COMPLIANCE REPORTS (Reporting & Export Engine)
// ============================================================================

export interface ReportData {
  dashboard: {
    systems: number;
    controls: { implemented: number; partially_implemented: number; planned: number; not_implemented: number; not_applicable: number; total: number };
    compliance_percentage: number;
    poams: { open: number; in_progress: number; completed: number; total: number };
    evidence_count: number;
    risks: { low: number; moderate: number; high: number; critical: number };
  };
  frameworks: any[];
  gapAnalysis: any[];
  risks: {
    total: number; open_count: number; avg_score: number; with_treatment: number;
    by_level: Record<string, number>;
    by_treatment: Record<string, number>;
    by_category: Record<string, number>;
  };
  vendors: {
    total: number; avg_score: number; overdue_assessments: number; expiring_contracts: number;
    critical_high: number;
    by_criticality: Record<string, number>;
    by_status: Record<string, number>;
    by_tier: Record<string, number>;
  };
  monitoring: { health_score: number; total_checks: number; pass_count: number; fail_count: number; warning_count: number; not_run_count: number } | null;
  trends: any[];
}

function reportCoverPage(title: string, subtitle: string, orgName: string, classification?: string): string {
  const now = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  return `
  <div style="text-align:center; padding-top:120pt; padding-bottom:120pt;">
    ${classification ? `<p style="font-size:14pt; color:#c0392b; font-weight:bold; text-transform:uppercase; letter-spacing:3pt; margin-bottom:24pt; border:2px solid #c0392b; display:inline-block; padding:4pt 16pt;">${escapeHtml(classification)}</p>` : ''}
    <h1 style="font-size:28pt; border:none; text-align:center;">${escapeHtml(title)}</h1>
    <h2 style="font-size:16pt; color:#333; text-align:center; border:none;">${escapeHtml(subtitle)}</h2>
    <p style="font-size:12pt; color:#777; margin-top:24pt;">${escapeHtml(orgName)}</p>
    <p style="font-size:11pt; color:#999; margin-top:16pt;">${escapeHtml(now)}</p>
    <p style="font-size:9pt; color:#aaa; margin-top:36pt;">Generated by ForgeComply 360</p>
    ${classification ? `<p style="font-size:9pt; color:#c0392b; margin-top:48pt; font-weight:bold;">${escapeHtml(classification)} — ${escapeHtml(orgName)}</p>` : ''}
  </div>
  <div class="page-break"></div>`;
}

export function aggregateFrameworkStats(rawStats: any[]): { name: string; implemented: number; partially_implemented: number; planned: number; not_implemented: number; not_applicable: number; total: number }[] {
  if (!rawStats || rawStats.length === 0) return [];
  // If already aggregated (has 'implemented' key), return as-is
  if (rawStats[0]?.implemented !== undefined) return rawStats;
  // Otherwise aggregate from raw per-status rows
  const map: Record<string, any> = {};
  for (const row of rawStats) {
    const fid = row.framework_id || row.id;
    if (!map[fid]) {
      map[fid] = { name: row.framework_name || row.name || fid, implemented: 0, partially_implemented: 0, planned: 0, not_implemented: 0, not_applicable: 0, total: 0 };
    }
    const status = row.status || '';
    if (status in map[fid]) map[fid][status] = (map[fid][status] || 0) + (row.count || 0);
    map[fid].total += (row.count || 0);
  }
  return Object.values(map);
}

function reportRecommendations(data: ReportData): string {
  const recs: string[] = [];
  if (data.dashboard.compliance_percentage < 80) recs.push(`Increase control implementation coverage — currently at ${data.dashboard.compliance_percentage}% (target: 80%+).`);
  const critRisks = data.risks.by_level?.critical || 0;
  if (critRisks > 0) recs.push(`Address ${critRisks} critical risk${critRisks > 1 ? 's' : ''} immediately with treatment plans.`);
  const highRisks = data.risks.by_level?.high || 0;
  if (highRisks > 3) recs.push(`Review ${highRisks} high-level risks and prioritize treatment.`);
  if (data.vendors.overdue_assessments > 0) recs.push(`Complete ${data.vendors.overdue_assessments} overdue vendor assessment${data.vendors.overdue_assessments > 1 ? 's' : ''}.`);
  if (data.vendors.expiring_contracts > 0) recs.push(`Review ${data.vendors.expiring_contracts} vendor contract${data.vendors.expiring_contracts > 1 ? 's' : ''} expiring within 30 days.`);
  if (data.monitoring) {
    const healthPct = Math.round((data.monitoring.health_score || 0) * 100);
    if (healthPct < 70) recs.push(`Investigate monitoring health — currently at ${healthPct}% (target: 70%+).`);
    if (data.monitoring.fail_count > 0) recs.push(`Remediate ${data.monitoring.fail_count} failing monitoring check${data.monitoring.fail_count > 1 ? 's' : ''}.`);
  }
  const openPoams = data.dashboard.poams.open || 0;
  if (openPoams > 5) recs.push(`Prioritize remediation of ${openPoams} open POA&M items.`);
  if (recs.length === 0) recs.push('No critical recommendations — compliance posture is strong.');
  return recs.map(r => `<li style="margin-bottom:4pt;">${escapeHtml(r)}</li>`).join('');
}

export async function exportExecutiveSummaryReport(data: ReportData, orgName: string): Promise<void> {
  let html = reportCoverPage('Executive Summary Report', 'Compliance & Risk Overview', orgName, 'CONFIDENTIAL');

  // Table of Contents
  html += `<h2>Table of Contents</h2>
  <ol>
    <li>Compliance Overview</li>
    <li>Risk Landscape</li>
    <li>Third-Party Risk</li>
    <li>Monitoring Health</li>
    <li>Key Recommendations</li>
  </ol>
  <div class="page-break"></div>`;

  // Section 1: Compliance Overview
  const d = data.dashboard;
  const c = d.controls;
  html += `<h2>1. Compliance Overview</h2>`;
  html += `<p style="font-size:18pt; font-weight:bold; color:${d.compliance_percentage >= 80 ? '#16a34a' : d.compliance_percentage >= 60 ? '#ca8a04' : '#dc2626'}; margin-bottom:12pt;">Overall Compliance: ${d.compliance_percentage}%</p>`;
  html += `<table>
    <tr><th>Metric</th><th>Value</th></tr>
    <tr><td>Total Systems</td><td>${d.systems}</td></tr>
    <tr><td>Total Controls</td><td>${c.total}</td></tr>
    <tr><td>Implemented</td><td style="color:#16a34a;font-weight:bold;">${c.implemented}</td></tr>
    <tr><td>Partially Implemented</td><td>${c.partially_implemented}</td></tr>
    <tr><td>Planned</td><td>${c.planned}</td></tr>
    <tr><td>Not Implemented</td><td style="color:#dc2626;">${c.not_implemented}</td></tr>
    <tr><td>Not Applicable</td><td>${c.not_applicable}</td></tr>
    <tr><td>Evidence Artifacts</td><td>${d.evidence_count}</td></tr>
  </table>`;

  html += `<h3>POA&M Summary</h3>
  <table>
    <tr><th>Status</th><th>Count</th></tr>
    <tr><td>Open</td><td style="color:#dc2626;">${d.poams.open}</td></tr>
    <tr><td>In Progress</td><td style="color:#ca8a04;">${d.poams.in_progress}</td></tr>
    <tr><td>Completed</td><td style="color:#16a34a;">${d.poams.completed}</td></tr>
    <tr><td style="font-weight:bold;">Total</td><td style="font-weight:bold;">${d.poams.total}</td></tr>
  </table>
  <div class="page-break"></div>`;

  // Section 2: Risk Landscape
  const r = data.risks;
  html += `<h2>2. Risk Landscape</h2>
  <table>
    <tr><th>Metric</th><th>Value</th></tr>
    <tr><td>Total Risks</td><td>${r.total}</td></tr>
    <tr><td>Open Risks</td><td style="font-weight:bold;">${r.open_count}</td></tr>
    <tr><td>Average Risk Score</td><td>${r.avg_score}</td></tr>
    <tr><td>With Treatment Plans</td><td>${r.with_treatment}</td></tr>
  </table>`;

  html += `<h3>Risk Distribution</h3>
  <table>
    <tr><th>Level</th><th>Count</th></tr>
    <tr><td style="background:#fee2e2;font-weight:bold;">Critical</td><td>${r.by_level?.critical || 0}</td></tr>
    <tr><td style="background:#ffedd5;font-weight:bold;">High</td><td>${r.by_level?.high || 0}</td></tr>
    <tr><td style="background:#fef9c3;">Moderate</td><td>${r.by_level?.moderate || 0}</td></tr>
    <tr><td style="background:#dcfce7;">Low</td><td>${r.by_level?.low || 0}</td></tr>
  </table>
  <div class="page-break"></div>`;

  // Section 3: Third-Party Risk
  const v = data.vendors;
  html += `<h2>3. Third-Party Risk</h2>
  <table>
    <tr><th>Metric</th><th>Value</th></tr>
    <tr><td>Total Vendors</td><td>${v.total}</td></tr>
    <tr><td>Critical/High Criticality</td><td style="color:#dc2626;font-weight:bold;">${v.critical_high}</td></tr>
    <tr><td>Average Risk Score</td><td>${v.avg_score}/25</td></tr>
    <tr><td>Overdue Assessments</td><td style="color:${v.overdue_assessments > 0 ? '#dc2626' : '#16a34a'};">${v.overdue_assessments}</td></tr>
    <tr><td>Expiring Contracts (30d)</td><td style="color:${v.expiring_contracts > 0 ? '#ca8a04' : '#16a34a'};">${v.expiring_contracts}</td></tr>
  </table>`;

  if (Object.keys(v.by_criticality || {}).length > 0) {
    html += `<h3>Vendors by Criticality</h3><table><tr><th>Criticality</th><th>Count</th></tr>`;
    for (const [k, val] of Object.entries(v.by_criticality)) {
      html += `<tr><td>${escapeHtml(String(k).toUpperCase())}</td><td>${val}</td></tr>`;
    }
    html += `</table>`;
  }
  html += `<div class="page-break"></div>`;

  // Section 4: Monitoring Health
  html += `<h2>4. Monitoring Health</h2>`;
  if (data.monitoring) {
    const m = data.monitoring;
    const healthPct = Math.round((m.health_score || 0) * 100);
    html += `<p style="font-size:16pt; font-weight:bold; color:${healthPct >= 80 ? '#16a34a' : healthPct >= 60 ? '#ca8a04' : '#dc2626'};">Health Score: ${healthPct}%</p>`;
    html += `<table>
      <tr><th>Result</th><th>Count</th></tr>
      <tr><td style="color:#16a34a;">Pass</td><td>${m.pass_count || 0}</td></tr>
      <tr><td style="color:#dc2626;">Fail</td><td>${m.fail_count || 0}</td></tr>
      <tr><td style="color:#ca8a04;">Warning</td><td>${m.warning_count || 0}</td></tr>
      <tr><td>Not Run</td><td>${m.not_run_count || 0}</td></tr>
      <tr><td style="font-weight:bold;">Total Checks</td><td style="font-weight:bold;">${m.total_checks || 0}</td></tr>
    </table>`;
  } else {
    html += `<p style="color:#718096;"><em>Continuous monitoring has not been configured for this organization.</em></p>`;
  }
  html += `<div class="page-break"></div>`;

  // Section 5: Key Recommendations
  html += `<h2>5. Key Recommendations</h2>
  <ul>${reportRecommendations(data)}</ul>`;
  html += `<p style="font-size:8pt;color:#a0aec0;margin-top:40pt;text-align:center;">Generated by ForgeComply 360 &mdash; Reporting &amp; Export Engine</p>`;

  const metadataFooter1 = `
<div style="margin-top:48pt; padding-top:12pt; border-top:1px solid #ccc; font-size:8pt; color:#999;">
  <table style="width:100%; border:none;">
    <tr style="border:none; background:none;">
      <td style="border:none; padding:2pt;">Generated by ForgeComply 360</td>
      <td style="border:none; padding:2pt; text-align:right;">Generated: ${new Date().toLocaleString()}</td>
    </tr>
    <tr style="border:none; background:none;">
      <td style="border:none; padding:2pt;">Organization: ${escapeHtml(orgName)}</td>
      <td style="border:none; padding:2pt; text-align:right;">Classification: CONFIDENTIAL</td>
    </tr>
  </table>
</div>`;
  html += metadataFooter1;

  const date = new Date().toISOString().split('T')[0];
  await exportAsDocx(`Executive Summary Report - ${date}`, html);
}

export async function exportCompliancePostureReport(data: ReportData, orgName: string): Promise<void> {
  let html = reportCoverPage('Compliance Posture Report', 'Framework Analysis & Gap Assessment', orgName, 'CONFIDENTIAL');

  // Table of Contents
  html += `<h2>Table of Contents</h2>
  <ol>
    <li>Overall Compliance Status</li>
    <li>Framework-by-Framework Breakdown</li>
    <li>Gap Analysis</li>
    <li>Compliance Trends</li>
    <li>Monitoring Health</li>
  </ol>
  <div class="page-break"></div>`;

  // Section 1: Overall Compliance Status
  const d = data.dashboard;
  const c = d.controls;
  html += `<h2>1. Overall Compliance Status</h2>`;
  html += `<p style="font-size:18pt; font-weight:bold; color:${d.compliance_percentage >= 80 ? '#16a34a' : d.compliance_percentage >= 60 ? '#ca8a04' : '#dc2626'};">Compliance: ${d.compliance_percentage}%</p>`;
  html += `<table>
    <tr><th>Status</th><th>Count</th><th>Percentage</th></tr>
    <tr><td>Implemented</td><td>${c.implemented}</td><td>${c.total > 0 ? ((c.implemented / c.total) * 100).toFixed(1) : '0.0'}%</td></tr>
    <tr><td>Partially Implemented</td><td>${c.partially_implemented}</td><td>${c.total > 0 ? ((c.partially_implemented / c.total) * 100).toFixed(1) : '0.0'}%</td></tr>
    <tr><td>Planned</td><td>${c.planned}</td><td>${c.total > 0 ? ((c.planned / c.total) * 100).toFixed(1) : '0.0'}%</td></tr>
    <tr><td>Not Implemented</td><td>${c.not_implemented}</td><td>${c.total > 0 ? ((c.not_implemented / c.total) * 100).toFixed(1) : '0.0'}%</td></tr>
    <tr><td>Not Applicable</td><td>${c.not_applicable}</td><td>${c.total > 0 ? ((c.not_applicable / c.total) * 100).toFixed(1) : '0.0'}%</td></tr>
    <tr style="font-weight:bold;"><td>Total</td><td>${c.total}</td><td>100%</td></tr>
  </table>`;

  html += `<h3>POA&M Distribution</h3>
  <table>
    <tr><th>Status</th><th>Count</th></tr>
    <tr><td>Open</td><td>${d.poams.open}</td></tr>
    <tr><td>In Progress</td><td>${d.poams.in_progress}</td></tr>
    <tr><td>Completed</td><td>${d.poams.completed}</td></tr>
    <tr style="font-weight:bold;"><td>Total</td><td>${d.poams.total}</td></tr>
  </table>
  <div class="page-break"></div>`;

  // Section 2: Framework-by-Framework Breakdown
  html += `<h2>2. Framework-by-Framework Breakdown</h2>`;
  const frameworks = aggregateFrameworkStats(data.frameworks);
  if (frameworks.length > 0) {
    html += `<table>
      <tr><th>Framework</th><th>Implemented</th><th>Partial</th><th>Planned</th><th>Not Impl.</th><th>N/A</th><th>Total</th><th>Compliance %</th></tr>`;
    for (const f of frameworks) {
      const pct = f.total > 0 ? Math.round(((f.implemented + f.not_applicable) / f.total) * 100) : 0;
      const color = pct >= 80 ? '#16a34a' : pct >= 60 ? '#ca8a04' : '#dc2626';
      html += `<tr>
        <td style="font-weight:bold;">${escapeHtml(f.name)}</td>
        <td>${f.implemented}</td><td>${f.partially_implemented}</td><td>${f.planned}</td>
        <td>${f.not_implemented}</td><td>${f.not_applicable}</td><td>${f.total}</td>
        <td style="color:${color};font-weight:bold;">${pct}%</td>
      </tr>`;
    }
    html += `</table>`;
  } else {
    html += `<p><em>No framework implementation data available.</em></p>`;
  }
  html += `<div class="page-break"></div>`;

  // Section 3: Gap Analysis
  html += `<h2>3. Gap Analysis</h2>`;
  if (data.gapAnalysis && data.gapAnalysis.length > 0) {
    html += `<p>Controls with "Not Implemented" status, grouped by framework and control family:</p>`;
    html += `<table><tr><th>Framework</th><th>Control Family</th><th>Gap Count</th></tr>`;
    for (const g of data.gapAnalysis.slice(0, 30)) {
      html += `<tr><td>${escapeHtml(g.framework_name || g.framework_id || '')}</td><td>${escapeHtml(g.family || '')}</td><td style="font-weight:bold;color:#dc2626;">${g.gap_count}</td></tr>`;
    }
    html += `</table>`;
  } else {
    html += `<p style="color:#16a34a;"><em>No implementation gaps found — all controls are implemented or planned.</em></p>`;
  }
  html += `<div class="page-break"></div>`;

  // Section 4: Compliance Trends
  html += `<h2>4. Compliance Trends</h2>`;
  if (data.trends && data.trends.length > 0) {
    html += `<p>Recent compliance snapshots (last 90 days):</p>`;
    html += `<table><tr><th>Date</th><th>System</th><th>Framework</th><th>Compliance %</th></tr>`;
    for (const t of data.trends.slice(-20)) {
      const pct = t.compliance_percentage || 0;
      const color = pct >= 80 ? '#16a34a' : pct >= 60 ? '#ca8a04' : '#dc2626';
      html += `<tr><td>${escapeHtml(t.snapshot_date || '')}</td><td>${escapeHtml(t.system_name || '')}</td><td>${escapeHtml(t.framework_name || '')}</td><td style="color:${color};font-weight:bold;">${pct}%</td></tr>`;
    }
    html += `</table>`;
  } else {
    html += `<p style="color:#718096;"><em>No compliance snapshots available. Use the Dashboard to create compliance snapshots for trend tracking.</em></p>`;
  }
  html += `<div class="page-break"></div>`;

  // Section 5: Monitoring Health
  html += `<h2>5. Monitoring Health</h2>`;
  if (data.monitoring) {
    const m = data.monitoring;
    const healthPct = Math.round((m.health_score || 0) * 100);
    html += `<p style="font-size:16pt; font-weight:bold; color:${healthPct >= 80 ? '#16a34a' : healthPct >= 60 ? '#ca8a04' : '#dc2626'};">Health Score: ${healthPct}%</p>`;
    html += `<table>
      <tr><th>Result</th><th>Count</th></tr>
      <tr><td style="color:#16a34a;">Pass</td><td>${m.pass_count || 0}</td></tr>
      <tr><td style="color:#dc2626;">Fail</td><td>${m.fail_count || 0}</td></tr>
      <tr><td style="color:#ca8a04;">Warning</td><td>${m.warning_count || 0}</td></tr>
      <tr><td>Not Run</td><td>${m.not_run_count || 0}</td></tr>
    </table>`;
  } else {
    html += `<p style="color:#718096;"><em>Continuous monitoring has not been configured.</em></p>`;
  }
  html += `<p style="font-size:8pt;color:#a0aec0;margin-top:40pt;text-align:center;">Generated by ForgeComply 360 &mdash; Reporting &amp; Export Engine</p>`;

  const metadataFooter2 = `
<div style="margin-top:48pt; padding-top:12pt; border-top:1px solid #ccc; font-size:8pt; color:#999;">
  <table style="width:100%; border:none;">
    <tr style="border:none; background:none;">
      <td style="border:none; padding:2pt;">Generated by ForgeComply 360</td>
      <td style="border:none; padding:2pt; text-align:right;">Generated: ${new Date().toLocaleString()}</td>
    </tr>
    <tr style="border:none; background:none;">
      <td style="border:none; padding:2pt;">Organization: ${escapeHtml(orgName)}</td>
      <td style="border:none; padding:2pt; text-align:right;">Classification: CONFIDENTIAL</td>
    </tr>
  </table>
</div>`;
  html += metadataFooter2;

  const date = new Date().toISOString().split('T')[0];
  await exportAsDocx(`Compliance Posture Report - ${date}`, html);
}

export async function exportRiskSummaryReport(data: ReportData, orgName: string): Promise<void> {
  let html = reportCoverPage('Risk Summary Report', 'Enterprise Risk & Vendor Risk Overview', orgName, 'CONFIDENTIAL');

  // Table of Contents
  html += `<h2>Table of Contents</h2>
  <ol>
    <li>Risk Overview</li>
    <li>Risk Distribution by Level</li>
    <li>Risk Distribution by Category</li>
    <li>Risk Treatment Status</li>
    <li>Vendor Risk Overview</li>
    <li>Recommendations</li>
  </ol>
  <div class="page-break"></div>`;

  // Section 1: Risk Overview
  const r = data.risks;
  html += `<h2>1. Risk Overview</h2>
  <table>
    <tr><th>Metric</th><th>Value</th></tr>
    <tr><td>Total Risks</td><td>${r.total}</td></tr>
    <tr><td>Open Risks</td><td style="font-weight:bold;">${r.open_count}</td></tr>
    <tr><td>Average Risk Score</td><td>${r.avg_score}</td></tr>
    <tr><td>With Treatment Plans</td><td>${r.with_treatment}</td></tr>
    <tr><td>Without Treatment Plans</td><td style="color:${(r.open_count - r.with_treatment) > 0 ? '#dc2626' : '#16a34a'};">${r.open_count - r.with_treatment}</td></tr>
  </table>
  <div class="page-break"></div>`;

  // Section 2: Risk Distribution by Level
  html += `<h2>2. Risk Distribution by Level</h2>
  <table>
    <tr><th>Level</th><th>Count</th></tr>
    <tr><td style="background:#fee2e2;font-weight:bold;">Critical</td><td>${r.by_level?.critical || 0}</td></tr>
    <tr><td style="background:#ffedd5;font-weight:bold;">High</td><td>${r.by_level?.high || 0}</td></tr>
    <tr><td style="background:#fef9c3;">Moderate</td><td>${r.by_level?.moderate || 0}</td></tr>
    <tr><td style="background:#dcfce7;">Low</td><td>${r.by_level?.low || 0}</td></tr>
  </table>
  <div class="page-break"></div>`;

  // Section 3: Risk Distribution by Category
  html += `<h2>3. Risk Distribution by Category</h2>`;
  const categories = Object.entries(r.by_category || {});
  if (categories.length > 0) {
    html += `<table><tr><th>Category</th><th>Count</th></tr>`;
    for (const [cat, count] of categories.sort((a, b) => (b[1] as number) - (a[1] as number))) {
      html += `<tr><td>${escapeHtml(String(cat).replace(/_/g, ' ').replace(/\b\w/g, ch => ch.toUpperCase()))}</td><td>${count}</td></tr>`;
    }
    html += `</table>`;
  } else {
    html += `<p><em>No risk categories recorded.</em></p>`;
  }
  html += `<div class="page-break"></div>`;

  // Section 4: Risk Treatment Status
  html += `<h2>4. Risk Treatment Status</h2>`;
  const treatments = Object.entries(r.by_treatment || {});
  if (treatments.length > 0) {
    html += `<table><tr><th>Treatment</th><th>Count</th></tr>`;
    for (const [t, count] of treatments.sort((a, b) => (b[1] as number) - (a[1] as number))) {
      html += `<tr><td>${escapeHtml(String(t).replace(/_/g, ' ').replace(/\b\w/g, ch => ch.toUpperCase()))}</td><td>${count}</td></tr>`;
    }
    html += `</table>`;
  } else {
    html += `<p><em>No treatment data available.</em></p>`;
  }
  html += `<div class="page-break"></div>`;

  // Section 5: Vendor Risk Overview
  const v = data.vendors;
  html += `<h2>5. Vendor Risk Overview</h2>
  <table>
    <tr><th>Metric</th><th>Value</th></tr>
    <tr><td>Total Vendors</td><td>${v.total}</td></tr>
    <tr><td>Critical/High Criticality</td><td style="color:#dc2626;font-weight:bold;">${v.critical_high}</td></tr>
    <tr><td>Average Risk Score</td><td>${v.avg_score}/25</td></tr>
    <tr><td>Overdue Assessments</td><td style="color:${v.overdue_assessments > 0 ? '#dc2626' : '#16a34a'};">${v.overdue_assessments}</td></tr>
    <tr><td>Expiring Contracts (30d)</td><td style="color:${v.expiring_contracts > 0 ? '#ca8a04' : '#16a34a'};">${v.expiring_contracts}</td></tr>
  </table>`;

  if (Object.keys(v.by_criticality || {}).length > 0) {
    html += `<h3>Vendors by Criticality</h3><table><tr><th>Criticality</th><th>Count</th></tr>`;
    for (const [k, val] of Object.entries(v.by_criticality)) html += `<tr><td>${escapeHtml(String(k).toUpperCase())}</td><td>${val}</td></tr>`;
    html += `</table>`;
  }
  if (Object.keys(v.by_tier || {}).length > 0) {
    const tierLabels: Record<string, string> = { '1': 'Tier 1 (Low Risk)', '2': 'Tier 2 (Low-Moderate)', '3': 'Tier 3 (Moderate)', '4': 'Tier 4 (Critical)' };
    html += `<h3>Vendors by Risk Tier</h3><table><tr><th>Risk Tier</th><th>Count</th></tr>`;
    for (const [k, val] of Object.entries(v.by_tier)) html += `<tr><td>${escapeHtml(tierLabels[k] || `Tier ${k}`)}</td><td>${val}</td></tr>`;
    html += `</table>`;
  }
  html += `<div class="page-break"></div>`;

  // Section 6: Recommendations
  html += `<h2>6. Recommendations</h2>
  <ul>${reportRecommendations(data)}</ul>`;
  html += `<p style="font-size:8pt;color:#a0aec0;margin-top:40pt;text-align:center;">Generated by ForgeComply 360 &mdash; Reporting &amp; Export Engine</p>`;

  const metadataFooter3 = `
<div style="margin-top:48pt; padding-top:12pt; border-top:1px solid #ccc; font-size:8pt; color:#999;">
  <table style="width:100%; border:none;">
    <tr style="border:none; background:none;">
      <td style="border:none; padding:2pt;">Generated by ForgeComply 360</td>
      <td style="border:none; padding:2pt; text-align:right;">Generated: ${new Date().toLocaleString()}</td>
    </tr>
    <tr style="border:none; background:none;">
      <td style="border:none; padding:2pt;">Organization: ${escapeHtml(orgName)}</td>
      <td style="border:none; padding:2pt; text-align:right;">Classification: CONFIDENTIAL</td>
    </tr>
  </table>
</div>`;
  html += metadataFooter3;

  const date = new Date().toISOString().split('T')[0];
  await exportAsDocx(`Risk Summary Report - ${date}`, html);
}

export async function exportAuditReadyPackage(data: ReportData, orgName: string): Promise<void> {
  await exportExecutiveSummaryReport(data, orgName);
  await exportCompliancePostureReport(data, orgName);
  await exportRiskSummaryReport(data, orgName);
}

// ---------------------------------------------------------------------------
// Evidence CSV Export
// ---------------------------------------------------------------------------

export function exportEvidenceCSV(evidence: any[]): void {
  const headers = ['Title', 'File Name', 'File Size', 'Uploaded By', 'Date', 'Status', 'Collection Date', 'Expiry Date'];
  const formatSize = (bytes: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  const rows = evidence.map(ev => [
    csvCell(ev.title || ''),
    csvCell(ev.file_name || ''),
    csvCell(formatSize(ev.file_size || 0)),
    csvCell(ev.uploaded_by_name || 'Unknown'),
    csvCell(ev.created_at ? new Date(ev.created_at).toLocaleDateString() : ''),
    csvCell(ev.status || ''),
    csvCell(ev.collection_date || ''),
    csvCell(ev.expiry_date || ''),
  ].join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  downloadBlob(new Blob([csv], { type: 'text/csv' }), `evidence-export-${new Date().toISOString().split('T')[0]}.csv`);
}

// ---------------------------------------------------------------------------
// Policies CSV Export
// ---------------------------------------------------------------------------

export function exportPoliciesCSV(policies: any[]): void {
  const headers = ['Title', 'Category', 'Status', 'Version', 'Owner', 'Review Date', 'Created'];
  const rows = policies.map(p => [
    csvCell(p.title || ''),
    csvCell(p.category || ''),
    csvCell(p.status || ''),
    csvCell(p.version || ''),
    csvCell(p.owner || ''),
    csvCell(p.review_date || ''),
    csvCell(p.created_at ? new Date(p.created_at).toLocaleDateString() : ''),
  ].join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  downloadBlob(new Blob([csv], { type: 'text/csv' }), `policies-export-${new Date().toISOString().split('T')[0]}.csv`);
}

// ---------------------------------------------------------------------------
// Systems CSV Export
// ---------------------------------------------------------------------------

export function exportSystemsCSV(systems: any[]): void {
  const headers = ['Name', 'Acronym', 'ATO Status', 'ATO Date', 'Description', 'Owner', 'Created'];
  const rows = systems.map(s => [
    csvCell(s.name || ''),
    csvCell(s.acronym || ''),
    csvCell(s.ato_status || ''),
    csvCell(s.ato_date || ''),
    csvCell(s.description || ''),
    csvCell(s.owner || ''),
    csvCell(s.created_at ? new Date(s.created_at).toLocaleDateString() : ''),
  ].join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  downloadBlob(new Blob([csv], { type: 'text/csv' }), `systems-export-${new Date().toISOString().split('T')[0]}.csv`);
}

