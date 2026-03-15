import React, { useState, useEffect, useCallback } from 'react';
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

const FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
};

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface ReportSchedule {
  id: string;
  name: string;
  report_type: string;
  format: string;
  frequency: string;
  day_of_week: number | null;
  day_of_month: number | null;
  time_utc: string;
  recipients: string;
  is_active: number;
  last_run_at: string | null;
  last_status: string | null;
  run_count: number;
  created_by_name: string;
  created_at: string;
}

interface ReportHistoryEntry {
  id: string;
  report_type: string;
  format: string;
  triggered_by: string;
  status: string;
  email_sent: number;
  recipients: string;
  schedule_name: string | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function ReportsPage() {
  const { org, canManage } = useAuth();
  const { addToast } = useToast();
  const [generating, setGenerating] = useState<string | null>(null);
  const [lastGenerated, setLastGenerated] = useState<string | null>(null);
  const [formatPref, setFormatPref] = useState<Record<string, 'docx' | 'pdf'>>({});

  // Scheduling state
  const [schedules, setSchedules] = useState<ReportSchedule[]>([]);
  const [history, setHistory] = useState<ReportHistoryEntry[]>([]);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    report_type: 'executive-summary',
    format: 'pdf' as 'pdf' | 'docx',
    frequency: 'weekly',
    day_of_week: 1,
    day_of_month: 1,
    time_utc: '08:00',
    recipients: '',
  });

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

  // Load schedules
  const loadSchedules = useCallback(async () => {
    try {
      const res = await api<{ schedules: ReportSchedule[] }>('/api/v1/report-schedules');
      setSchedules(res.schedules || []);
    } catch {
      // Table may not exist yet
    }
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const res = await api<{ history: ReportHistoryEntry[] }>('/api/v1/report-history?limit=20');
      setHistory(res.history || []);
    } catch {
      // Table may not exist yet
    }
  }, []);

  useEffect(() => {
    if (canManage) {
      loadSchedules();
    }
  }, [canManage, loadSchedules]);

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

  const handleCreateSchedule = async () => {
    const recipientList = formData.recipients.split(',').map(e => e.trim()).filter(Boolean);
    if (!formData.name || recipientList.length === 0) {
      addToast({ type: 'error', title: 'Validation error', message: 'Name and at least one recipient email are required.' });
      return;
    }
    setScheduleLoading(true);
    try {
      await api('/api/v1/report-schedules', {
        method: 'POST',
        body: JSON.stringify({
          name: formData.name,
          report_type: formData.report_type,
          format: formData.format,
          frequency: formData.frequency,
          day_of_week: formData.frequency === 'weekly' ? formData.day_of_week : null,
          day_of_month: formData.frequency === 'monthly' ? formData.day_of_month : null,
          time_utc: formData.time_utc,
          recipients: recipientList,
        }),
      });
      addToast({ type: 'success', title: 'Schedule created', message: `"${formData.name}" scheduled successfully.` });
      setShowScheduleForm(false);
      setFormData({ name: '', report_type: 'executive-summary', format: 'pdf', frequency: 'weekly', day_of_week: 1, day_of_month: 1, time_utc: '08:00', recipients: '' });
      loadSchedules();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Failed to create schedule', message: err.message });
    } finally {
      setScheduleLoading(false);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    try {
      await api(`/api/v1/report-schedules/${id}`, { method: 'DELETE' });
      addToast({ type: 'success', title: 'Schedule deleted' });
      loadSchedules();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Delete failed', message: err.message });
    }
  };

  const handleToggleSchedule = async (schedule: ReportSchedule) => {
    try {
      await api(`/api/v1/report-schedules/${schedule.id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: schedule.is_active ? 0 : 1 }),
      });
      loadSchedules();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Update failed', message: err.message });
    }
  };

  const handleRunNow = async (id: string) => {
    try {
      const res = await api<{ emails_sent: number }>(`/api/v1/report-schedules/${id}/run`, { method: 'POST' });
      addToast({ type: 'success', title: 'Report sent', message: `Email delivered to ${res.emails_sent} recipient(s).` });
      loadSchedules();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Run failed', message: err.message });
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

      {/* ================================================================== */}
      {/* Scheduled Reports Section                                          */}
      {/* ================================================================== */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className={TYPOGRAPHY.sectionTitle}>Scheduled Reports</h3>
            <p className={`${TYPOGRAPHY.bodyMuted} mt-1`}>Automate report generation and email delivery on a recurring schedule.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setShowHistory(!showHistory); if (!showHistory) loadHistory(); }}
              className={BUTTONS.secondary}
            >
              {showHistory ? 'Hide History' : 'View History'}
            </button>
            <button
              onClick={() => setShowScheduleForm(!showScheduleForm)}
              className={BUTTONS.primary}
            >
              {showScheduleForm ? 'Cancel' : 'New Schedule'}
            </button>
          </div>
        </div>

        {/* New Schedule Form */}
        {showScheduleForm && (
          <div className={`${CARDS.elevated} p-6 mb-6`}>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Create Report Schedule</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Schedule Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Weekly Leadership Briefing"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Report Type</label>
                <select
                  value={formData.report_type}
                  onChange={e => setFormData(p => ({ ...p, report_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {REPORT_TYPES.map(r => (
                    <option key={r.key} value={r.key}>{r.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Format</label>
                <select
                  value={formData.format}
                  onChange={e => setFormData(p => ({ ...p, format: e.target.value as 'pdf' | 'docx' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="pdf">PDF</option>
                  <option value="docx">DOCX</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Frequency</label>
                <select
                  value={formData.frequency}
                  onChange={e => setFormData(p => ({ ...p, frequency: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                </select>
              </div>
              {formData.frequency === 'weekly' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Day of Week</label>
                  <select
                    value={formData.day_of_week}
                    onChange={e => setFormData(p => ({ ...p, day_of_week: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {DAY_LABELS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                  </select>
                </div>
              )}
              {formData.frequency === 'monthly' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Day of Month</label>
                  <select
                    value={formData.day_of_month}
                    onChange={e => setFormData(p => ({ ...p, day_of_month: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {Array.from({ length: 28 }, (_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Time (UTC)</label>
                <select
                  value={formData.time_utc}
                  onChange={e => setFormData(p => ({ ...p, time_utc: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {Array.from({ length: 24 }, (_, i) => {
                    const h = i.toString().padStart(2, '0');
                    return <option key={h} value={`${h}:00`}>{h}:00 UTC</option>;
                  })}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Recipients (comma-separated emails)</label>
                <input
                  type="text"
                  value={formData.recipients}
                  onChange={e => setFormData(p => ({ ...p, recipients: e.target.value }))}
                  placeholder="ciso@example.com, compliance@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleCreateSchedule}
                disabled={scheduleLoading}
                className={`${BUTTONS.primary} flex items-center gap-2`}
              >
                {scheduleLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Create Schedule
              </button>
            </div>
          </div>
        )}

        {/* Existing Schedules */}
        {schedules.length > 0 ? (
          <div className="space-y-3">
            {schedules.map(schedule => {
              const reportType = REPORT_TYPES.find(r => r.key === schedule.report_type);
              const recipients = JSON.parse(schedule.recipients || '[]');
              return (
                <div key={schedule.id} className={`${CARDS.elevated} p-4 flex items-center gap-4`}>
                  <div className={`w-10 h-10 rounded-lg ${reportType?.iconBgColor || 'bg-gray-100 text-gray-600'} flex items-center justify-center shrink-0`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={reportType?.icon || 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2'} />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900 truncate">{schedule.name}</span>
                      <span className={`${BADGES.pill} ${schedule.is_active ? BADGES.success : BADGES.neutral} text-[10px]`}>
                        {schedule.is_active ? 'Active' : 'Paused'}
                      </span>
                      {schedule.last_status && (
                        <span className={`${BADGES.pill} ${schedule.last_status === 'success' ? BADGES.success : BADGES.error} text-[10px]`}>
                          Last: {schedule.last_status}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {reportType?.title} ({schedule.format.toUpperCase()}) &middot; {FREQUENCY_LABELS[schedule.frequency] || schedule.frequency} at {schedule.time_utc} UTC
                      {schedule.frequency === 'weekly' && schedule.day_of_week != null && ` on ${DAY_LABELS[schedule.day_of_week]}`}
                      {schedule.frequency === 'monthly' && schedule.day_of_month != null && ` on day ${schedule.day_of_month}`}
                      &nbsp;&middot; {recipients.length} recipient{recipients.length !== 1 ? 's' : ''}
                      {schedule.run_count > 0 && ` &middot; ${schedule.run_count} runs`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => handleRunNow(schedule.id)} className={`${BUTTONS.secondary} text-xs px-2.5 py-1.5`} title="Run now">
                      Run Now
                    </button>
                    <button onClick={() => handleToggleSchedule(schedule)} className={`${BUTTONS.secondary} text-xs px-2.5 py-1.5`}>
                      {schedule.is_active ? 'Pause' : 'Resume'}
                    </button>
                    <button onClick={() => handleDeleteSchedule(schedule.id)} className="text-xs text-red-600 hover:text-red-800 px-2 py-1.5">
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : !showScheduleForm ? (
          <div className={`${CARDS.elevated} p-8 text-center`}>
            <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className={TYPOGRAPHY.bodyMuted}>No scheduled reports yet. Create one to automate report delivery via email.</p>
          </div>
        ) : null}

        {/* History Section */}
        {showHistory && (
          <div className="mt-6">
            <h4 className={`${TYPOGRAPHY.sectionTitle} mb-3`}>Report Delivery History</h4>
            {history.length > 0 ? (
              <div className={`${CARDS.elevated} overflow-hidden`}>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Report</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Trigger</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Status</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Emails</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {history.map(h => (
                      <tr key={h.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 text-gray-900">
                          {REPORT_TYPES.find(r => r.key === h.report_type)?.title || h.report_type}
                          <span className="ml-1 text-gray-400 text-xs">{h.format.toUpperCase()}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`${BADGES.pill} ${h.triggered_by === 'schedule' ? BADGES.info : BADGES.neutral} text-[10px]`}>
                            {h.triggered_by}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`${BADGES.pill} ${
                            h.status === 'completed' ? BADGES.success :
                            h.status === 'failed' ? BADGES.error : BADGES.warning
                          } text-[10px]`}>
                            {h.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-gray-600">{h.email_sent}</td>
                        <td className="px-4 py-2.5 text-gray-500 text-xs">
                          {new Date(h.created_at + 'Z').toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className={`${TYPOGRAPHY.bodyMuted} text-center py-4`}>No report history yet.</p>
            )}
          </div>
        )}
      </div>

      {/* CSV Data Exports Section */}
      <div className="mt-8">
        <h3 className={`${TYPOGRAPHY.sectionTitle} mb-4`}>Data Exports (CSV)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { type: 'implementations', title: 'Control Implementations', description: 'All control statuses across systems and frameworks', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
            { type: 'snapshots', title: 'Compliance Snapshots', description: 'Historical compliance scores and percentages (90 days)', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
            { type: 'risks', title: 'Risk Register', description: 'Complete risk inventory with scores and treatment status', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
          ].map(exp => (
            <div key={exp.type} className={`${CARDS.elevated} p-4`}>
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={exp.icon} />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">{exp.title}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">{exp.description}</p>
                </div>
              </div>
              <button
                onClick={async () => {
                  try {
                    const res = await fetch(`/api/v1/analytics/export-csv?type=${exp.type}`, {
                      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                    });
                    if (!res.ok) throw new Error('Export failed');
                    const blob = await res.blob();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = res.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || `${exp.type}.csv`;
                    a.click();
                    URL.revokeObjectURL(url);
                    addToast({ type: 'success', title: 'CSV exported', message: `${exp.title} downloaded` });
                  } catch (err: any) {
                    addToast({ type: 'error', title: 'Export failed', message: err.message });
                  }
                }}
                className={`w-full ${BUTTONS.secondary} text-xs flex items-center justify-center gap-1.5`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download CSV
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Footer info */}
      <p className={`mt-8 text-center ${TYPOGRAPHY.timestamp}`}>
        Reports aggregate data from across Forge Cyber Defense including compliance controls, risk register, vendor assessments, and monitoring checks.
      </p>
    </div>
  );
}
