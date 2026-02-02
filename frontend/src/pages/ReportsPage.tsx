import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import {
  exportExecutiveSummaryReport,
  exportCompliancePostureReport,
  exportRiskSummaryReport,
  exportAuditReadyPackage,
} from '../utils/exportHelpers';

const REPORT_TYPES = [
  {
    key: 'executive-summary',
    title: 'Executive Summary',
    description: 'High-level overview of compliance posture, risk landscape, and key metrics. Ideal for leadership briefings and board presentations.',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
    color: 'blue',
    bg: 'bg-blue-50',
    iconBg: 'bg-blue-100 text-blue-600',
    border: 'border-blue-200 hover:border-blue-400',
    btn: 'bg-blue-600 hover:bg-blue-700',
  },
  {
    key: 'compliance-posture',
    title: 'Compliance Posture Report',
    description: 'Detailed breakdown of control implementation status across all frameworks, gap analysis by control family, and compliance trend data.',
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    color: 'green',
    bg: 'bg-green-50',
    iconBg: 'bg-green-100 text-green-600',
    border: 'border-green-200 hover:border-green-400',
    btn: 'bg-green-600 hover:bg-green-700',
  },
  {
    key: 'risk-summary',
    title: 'Risk Summary Report',
    description: 'Comprehensive risk register summary with breakdowns by level, category, and treatment status. Includes vendor risk overview and tier analysis.',
    icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    color: 'orange',
    bg: 'bg-orange-50',
    iconBg: 'bg-orange-100 text-orange-600',
    border: 'border-orange-200 hover:border-orange-400',
    btn: 'bg-orange-600 hover:bg-orange-700',
  },
  {
    key: 'audit-ready',
    title: 'Audit-Ready Package',
    description: 'Bundled download containing Executive Summary, Compliance Posture, and Risk Summary reports. Ready for auditor delivery.',
    icon: 'M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    color: 'purple',
    bg: 'bg-purple-50',
    iconBg: 'bg-purple-100 text-purple-600',
    border: 'border-purple-200 hover:border-purple-400',
    btn: 'bg-purple-600 hover:bg-purple-700',
  },
];

export function ReportsPage() {
  const { org, canManage } = useAuth();
  const [generating, setGenerating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastGenerated, setLastGenerated] = useState<string | null>(null);

  if (!canManage) {
    return (
      <div className="p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Access Restricted</h2>
        <p className="text-gray-500">Reports are available to managers, admins, and owners only.</p>
      </div>
    );
  }

  const handleGenerate = async (reportKey: string) => {
    setGenerating(reportKey);
    setError(null);
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
      setLastGenerated(reportKey);
    } catch (err: any) {
      console.error('Report generation failed:', err);
      setError(err.message || 'Report generation failed. Please try again.');
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Reports</h1>
        <p className="text-gray-500">Generate professional compliance reports for leadership, auditors, and stakeholders. Reports are exported as Word documents (.doc).</p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-red-800">Report generation failed</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {REPORT_TYPES.map((report) => {
          const isGenerating = generating === report.key;
          const isAnyGenerating = generating !== null;
          const justGenerated = lastGenerated === report.key && !isAnyGenerating;

          return (
            <div
              key={report.key}
              className={`bg-white rounded-xl border-2 ${report.border} p-6 transition-all duration-200 ${isAnyGenerating && !isGenerating ? 'opacity-60' : ''}`}
            >
              {/* Icon + Title */}
              <div className="flex items-start gap-4 mb-4">
                <div className={`w-12 h-12 rounded-lg ${report.iconBg} flex items-center justify-center shrink-0`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={report.icon} />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{report.title}</h3>
                  {report.key === 'audit-ready' && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">3 Reports</span>
                  )}
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">{report.description}</p>

              {/* Generate Button */}
              <button
                onClick={() => handleGenerate(report.key)}
                disabled={isAnyGenerating}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 ${report.btn} text-white rounded-lg font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generating...
                  </>
                ) : justGenerated ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Downloaded
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Generate Report
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Footer info */}
      <div className="mt-8 text-center text-xs text-gray-400">
        Reports aggregate data from across ForgeComply 360 including compliance controls, risk register, vendor assessments, and monitoring checks.
      </div>
    </div>
  );
}
