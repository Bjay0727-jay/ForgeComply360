import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import {
  exportExecutiveSummaryReport,
  exportCompliancePostureReport,
  exportRiskSummaryReport,
  exportAuditReadyPackage,
} from '../utils/exportHelpers';
import {
  exportExecutiveSummaryReportPdf,
  exportCompliancePostureReportPdf,
  exportRiskSummaryReportPdf,
  exportAuditReadyPackagePdf,
} from '../utils/pdfExportHelpers';
import { PageHeader } from '../components/PageHeader';
import { useToast } from '../components/Toast';
import { BUTTONS, CARDS, BADGES, TYPOGRAPHY } from '../utils/typography';

// ---------------------------------------------------------------------------
// Report Type Configuration
// ---------------------------------------------------------------------------

interface ReportType {
  key: string;
  title: string;
  description: string;
  icon: string;
  badgeColor: string;
  iconBgColor: string;
}

const REPORT_TYPES: ReportType[] = [
  {
    key: 'executive-summary',
    title: 'Executive Summary',
    description: 'High-level overview of compliance posture, risk landscape, and key metrics. Ideal for leadership briefings and board presentations.',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
    badgeColor: 'info',
    iconBgColor: 'bg-blue-100 text-blue-600',
  },
  {
    key: 'compliance-posture',
    title: 'Compliance Posture Report',
    description: 'Detailed breakdown of control implementation status across all frameworks, gap analysis by control family, and compliance trend data.',
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    badgeColor: 'success',
    iconBgColor: 'bg-green-100 text-green-600',
  },
  {
    key: 'risk-summary',
    title: 'Risk Summary Report',
    description: 'Comprehensive risk register summary with breakdowns by level, category, and treatment status. Includes vendor risk overview and tier analysis.',
    icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    badgeColor: 'warning',
    iconBgColor: 'bg-orange-100 text-orange-600',
  },
  {
    key: 'audit-ready',
    title: 'Audit-Ready Package',
    description: 'Bundled download containing Executive Summary, Compliance Posture, and Risk Summary reports. Ready for auditor delivery.',
    icon: 'M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    badgeColor: 'purple',
    iconBgColor: 'bg-purple-100 text-purple-600',
  },
];

// LocalStorage key for format preferences
const FORMAT_PREF_KEY = 'forgecomply_report_format_prefs';

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function ReportsPage() {
  const { org, canManage } = useAuth();
  const { addToast } = useToast();
  const [generating, setGenerating] = useState<string | null>(null);
  const [lastGenerated, setLastGenerated] = useState<string | null>(null);
  const [formatPref, setFormatPref] = useState<Record<string, 'docx' | 'pdf'>>({});

  // Load format preferences from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(FORMAT_PREF_KEY);
      if (saved) {
        setFormatPref(JSON.parse(saved));
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Save format preferences to localStorage
  const updateFormatPref = (reportKey: string, format: 'docx' | 'pdf') => {
    setFormatPref(prev => {
      const updated = { ...prev, [reportKey]: format };
      try {
        localStorage.setItem(FORMAT_PREF_KEY, JSON.stringify(updated));
      } catch {
        // Ignore storage errors
      }
      return updated;
    });
  };

  if (!canManage) {
    return (
      <div className={`${CARDS.elevated} p-12 text-center max-w-md mx-auto mt-12`}>
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className={TYPOGRAPHY.sectionTitle}>Access Restricted</h2>
        <p className={`${TYPOGRAPHY.bodyMuted} mt-2`}>Reports are available to managers, admins, and owners only.</p>
      </div>
    );
  }

  const handleGenerate = async (reportKey: string) => {
    setGenerating(reportKey);
    try {
      const orgName = org?.name || 'Organization';

      const [dashRes, frameworkRes, riskRes, vendorRes, monitoringRes, trendsRes] = await Promise.all([
        api<any>('/api/v1/dashboard/stats'),
        api<any>('/api/v1/dashboard/framework-stats'),
        api<any>('/api/v1/risks/stats'),
        api<any>('/api/v1/vendors/stats'),
        api<any>('/api/v1/monitoring/dashboard').catch(() => null),
        api<any>('/api/v1/compliance/trends?days=90').catch(() => ({ trends: [] })),
      ]);

      const data = {
        dashboard: dashRes.stats || { systems: 0, controls: { implemented: 0, partially_implemented: 0, planned: 0, not_implemented: 0, not_applicable: 0, total: 0 }, compliance_percentage: 0, poams: { open: 0, in_progress: 0, completed: 0, total: 0 }, evidence_count: 0, risks: { low: 0, moderate: 0, high: 0, critical: 0 } },
        frameworks: frameworkRes.framework_stats || frameworkRes.frameworks || [],
        gapAnalysis: frameworkRes.gap_analysis || [],
        risks: riskRes.stats || { total: 0, open_count: 0, avg_score: 0, with_treatment: 0, by_level: {}, by_treatment: {}, by_category: {} },
        vendors: vendorRes.stats || { total: 0, avg_score: 0, overdue_assessments: 0, expiring_contracts: 0, critical_high: 0, by_criticality: {}, by_status: {}, by_tier: {} },
        monitoring: monitoringRes,
        trends: trendsRes?.trends || [],
      };

      const format = formatPref[reportKey] || 'docx';
      const reportTitle = REPORT_TYPES.find(r => r.key === reportKey)?.title || 'Report';

      if (format === 'pdf') {
        switch (reportKey) {
          case 'executive-summary':
            await exportExecutiveSummaryReportPdf(data, orgName);
            break;
          case 'compliance-posture':
            await exportCompliancePostureReportPdf(data, orgName);
            break;
          case 'risk-summary':
            await exportRiskSummaryReportPdf(data, orgName);
            break;
          case 'audit-ready':
            await exportAuditReadyPackagePdf(data, orgName);
            break;
        }
      } else {
        switch (reportKey) {
          case 'executive-summary':
            await exportExecutiveSummaryReport(data, orgName);
            break;
          case 'compliance-posture':
            await exportCompliancePostureReport(data, orgName);
            break;
          case 'risk-summary':
            await exportRiskSummaryReport(data, orgName);
            break;
          case 'audit-ready':
            await exportAuditReadyPackage(data, orgName);
            break;
        }
      }

      setLastGenerated(reportKey);
      addToast({
        type: 'success',
        title: 'Report generated',
        message: `${reportTitle} (${format.toUpperCase()}) downloaded successfully`,
      });

      // Clear the "Downloaded" state after 3 seconds
      setTimeout(() => setLastGenerated(null), 3000);
    } catch (err: any) {
      console.error('Report generation failed:', err);
      addToast({
        type: 'error',
        title: 'Report generation failed',
        message: err.message || 'Unable to generate report. Please try again.',
      });
    } finally {
      setGenerating(null);
    }
  };

  const getBadgeClasses = (color: string) => {
    switch (color) {
      case 'info': return BADGES.info;
      case 'success': return BADGES.success;
      case 'warning': return BADGES.warning;
      case 'purple': return BADGES.purple;
      default: return BADGES.neutral;
    }
  };

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Generate professional compliance reports for leadership, auditors, and stakeholders"
      />

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {REPORT_TYPES.map((report) => {
          const isGenerating = generating === report.key;
          const isAnyGenerating = generating !== null;
          const justGenerated = lastGenerated === report.key && !isAnyGenerating;
          const currentFormat = formatPref[report.key] || 'docx';

          return (
            <div
              key={report.key}
              className={`${CARDS.elevated} p-6 transition-all duration-200 ${isAnyGenerating && !isGenerating ? 'opacity-60' : ''}`}
            >
              {/* Icon + Title */}
              <div className="flex items-start gap-4 mb-4">
                <div className={`w-12 h-12 rounded-lg ${report.iconBgColor} flex items-center justify-center shrink-0`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={report.icon} />
                  </svg>
                </div>
                <div>
                  <h3 className={TYPOGRAPHY.sectionTitle}>{report.title}</h3>
                  {report.key === 'audit-ready' && (
                    <span className={`inline-block mt-1 ${BADGES.pill} ${BADGES.purple}`}>
                      {currentFormat === 'pdf' ? '1 Combined PDF' : '3 Reports'}
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              <p className={`${TYPOGRAPHY.bodyMuted} mb-6 leading-relaxed`}>{report.description}</p>

              {/* Format Toggle */}
              <div className="flex items-center gap-2 mb-4">
                <span className={TYPOGRAPHY.metaLabel}>Format:</span>
                <div className="flex" role="group" aria-label="Export format">
                  <button
                    onClick={() => updateFormatPref(report.key, 'docx')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-l-lg border transition-colors ${
                      currentFormat === 'docx'
                        ? 'bg-forge-navy-900 text-white border-forge-navy-900'
                        : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                    }`}
                    aria-pressed={currentFormat === 'docx'}
                  >
                    DOCX
                  </button>
                  <button
                    onClick={() => updateFormatPref(report.key, 'pdf')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-r-lg border border-l-0 transition-colors ${
                      currentFormat === 'pdf'
                        ? 'bg-forge-navy-900 text-white border-forge-navy-900'
                        : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                    }`}
                    aria-pressed={currentFormat === 'pdf'}
                  >
                    PDF
                  </button>
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={() => handleGenerate(report.key)}
                disabled={isAnyGenerating}
                className={`w-full ${BUTTONS.primary} flex items-center justify-center gap-2`}
                aria-busy={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                    <span>Generating...</span>
                  </>
                ) : justGenerated ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Downloaded</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Generate Report</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Footer info */}
      <p className={`mt-8 text-center ${TYPOGRAPHY.timestamp}`}>
        Reports aggregate data from across Forge Cyber Defense including compliance controls, risk register, vendor assessments, and monitoring checks.
      </p>
    </div>
  );
}
