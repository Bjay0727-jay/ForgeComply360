import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import { PageHeader } from '../components/PageHeader';
import { TrendAreaChart } from '../components/charts/TrendAreaChart';
import { HorizontalBarList } from '../components/charts/HorizontalBarList';
import { ScoreRadialChart } from '../components/charts/ScoreRadialChart';
import { useToast } from '../components/Toast';
import { TYPOGRAPHY, CARDS, BUTTONS, BADGES } from '../utils/typography';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GapFamily {
  family: string;
  total: number;
  implemented: number;
  not_implemented: number;
  planned: number;
  partially_implemented: number;
  not_applicable: number;
  gap_percentage: number;
  compliance_percentage: number;
}

interface FrameworkGap {
  framework_id: string;
  framework_name: string;
  category: string;
  total_controls: number;
  compliance_percentage: number;
  families: GapFamily[];
  top_gaps: GapFamily[];
}

interface ForecastData {
  history: { date: string; compliance: number }[];
  forecast: { date: string; compliance: number; is_forecast: boolean }[];
  velocity: { weekly: number; monthly: number };
  current_compliance: number;
  targets: { to_70: number | null; to_80: number | null; to_90: number | null; to_100: number | null };
}

interface HeatmapCell {
  system_id: string;
  system_name: string;
  framework_id: string;
  framework_name: string;
  compliance_percentage: number;
  total_controls: number;
  implemented: number;
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

const pctColor = (pct: number) =>
  pct >= 90 ? 'text-green-700 bg-green-100' :
  pct >= 70 ? 'text-blue-700 bg-blue-100' :
  pct >= 50 ? 'text-yellow-700 bg-yellow-100' :
  'text-red-700 bg-red-100';

const heatColor = (pct: number) =>
  pct >= 90 ? 'bg-green-500' :
  pct >= 80 ? 'bg-green-400' :
  pct >= 70 ? 'bg-blue-400' :
  pct >= 50 ? 'bg-yellow-400' :
  pct >= 25 ? 'bg-orange-400' :
  'bg-red-400';

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function AnalyticsPage() {
  const { canEdit } = useAuth();
  const { addToast } = useToast();

  const [gapData, setGapData] = useState<FrameworkGap[]>([]);
  const [forecastData, setForecastData] = useState<ForecastData | null>(null);
  const [heatmapData, setHeatmapData] = useState<HeatmapCell[]>([]);
  const [heatmapSystems, setHeatmapSystems] = useState<{ id: string; name: string }[]>([]);
  const [heatmapFrameworks, setHeatmapFrameworks] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'gap' | 'forecast' | 'heatmap'>('gap');
  const [expandedFramework, setExpandedFramework] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    Promise.all([
      api<{ gap_analysis: FrameworkGap[] }>('/api/v1/analytics/gap-analysis').catch(() => ({ gap_analysis: [] })),
      api<ForecastData>('/api/v1/analytics/forecast?days=90&forecast_days=30').catch(() => null),
      api<{ heatmap: HeatmapCell[]; systems: { id: string; name: string }[]; frameworks: { id: string; name: string }[] }>(
        '/api/v1/analytics/framework-heatmap'
      ).catch(() => ({ heatmap: [], systems: [], frameworks: [] })),
    ]).then(([gapRes, forecastRes, heatmapRes]) => {
      setGapData(gapRes.gap_analysis || []);
      setForecastData(forecastRes);
      setHeatmapData(heatmapRes?.heatmap || []);
      setHeatmapSystems(heatmapRes?.systems || []);
      setHeatmapFrameworks(heatmapRes?.frameworks || []);
    }).finally(() => setLoading(false));
  }, []);

  // Build forecast chart data combining history + forecast
  const forecastChartData = useMemo(() => {
    if (!forecastData) return [];
    const historyPoints = forecastData.history.map(h => ({ date: h.date, value: h.compliance, label: `${h.compliance}%` }));
    const forecastPoints = forecastData.forecast.map(f => ({ date: f.date, value: f.compliance, label: `${f.compliance}% (forecast)` }));
    return [...historyPoints, ...forecastPoints];
  }, [forecastData]);

  const handleExportCSV = async (type: string) => {
    setExporting(true);
    try {
      const res = await fetch(`/api/v1/analytics/export-csv?type=${type}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || `${type}-export.csv`;
      a.click();
      URL.revokeObjectURL(url);
      addToast({ type: 'success', title: 'Export complete', message: `${type} CSV downloaded` });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Export failed', message: err.message });
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Analytics" subtitle="Cross-framework gap analysis, compliance forecasting, and data exports" />
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-48 bg-gray-200 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Analytics"
        subtitle="Cross-framework gap analysis, compliance forecasting, and data exports"
      />

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        {[
          { key: 'gap' as const, label: 'Gap Analysis', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
          { key: 'forecast' as const, label: 'Forecasting', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
          { key: 'heatmap' as const, label: 'Framework Heatmap', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
            </svg>
            {tab.label}
          </button>
        ))}
      </div>

      {/* CSV Export Bar */}
      <div className={`${CARDS.elevated} p-4 mb-6 flex items-center justify-between`}>
        <div>
          <span className={TYPOGRAPHY.label}>Data Exports</span>
          <span className="text-xs text-gray-500 ml-2">Download compliance data as CSV</span>
        </div>
        <div className="flex gap-2">
          {[
            { type: 'implementations', label: 'Implementations' },
            { type: 'snapshots', label: 'Snapshots' },
            { type: 'risks', label: 'Risk Register' },
          ].map(exp => (
            <button
              key={exp.type}
              onClick={() => handleExportCSV(exp.type)}
              disabled={exporting}
              className={`${BUTTONS.secondary} text-xs flex items-center gap-1`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {exp.label}
            </button>
          ))}
        </div>
      </div>

      {/* ============================================================ */}
      {/* TAB: GAP ANALYSIS */}
      {/* ============================================================ */}
      {activeTab === 'gap' && (
        <div className="space-y-4">
          {gapData.length === 0 ? (
            <div className={`${CARDS.elevated} p-12 text-center`}>
              <p className={TYPOGRAPHY.bodyMuted}>No framework data available. Enable frameworks and create control implementations to see gap analysis.</p>
            </div>
          ) : (
            <>
              {/* Framework Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {gapData.map(fw => (
                  <button
                    key={fw.framework_id}
                    onClick={() => setExpandedFramework(expandedFramework === fw.framework_id ? null : fw.framework_id)}
                    className={`${CARDS.elevated} p-4 text-left transition-all hover:shadow-md ${
                      expandedFramework === fw.framework_id ? 'ring-2 ring-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">{fw.framework_name}</h3>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${BADGES.neutral}`}>{fw.category}</span>
                      </div>
                      <ScoreRadialChart score={fw.compliance_percentage} maxScore={100} size={48} thickness={6} showLabel={false} />
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                      <span>{fw.total_controls} controls</span>
                      <span className={`font-medium px-1.5 py-0.5 rounded ${pctColor(fw.compliance_percentage)}`}>
                        {fw.compliance_percentage}% compliant
                      </span>
                    </div>
                    {fw.top_gaps.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <span className="text-xs text-gray-400">Top gaps:</span>
                        {fw.top_gaps.slice(0, 2).map(g => (
                          <div key={g.family} className="flex justify-between text-xs mt-1">
                            <span className="text-gray-600 truncate mr-2">{g.family}</span>
                            <span className="text-red-600 font-medium shrink-0">{g.gap_percentage}% gap</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Expanded Framework Detail */}
              {expandedFramework && (() => {
                const fw = gapData.find(f => f.framework_id === expandedFramework);
                if (!fw) return null;
                return (
                  <div className={`${CARDS.elevated} p-6`}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className={TYPOGRAPHY.sectionTitle}>{fw.framework_name} — Family Gap Analysis</h3>
                      <button onClick={() => setExpandedFramework(null)} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <HorizontalBarList
                      data={fw.families.map(f => ({
                        name: f.family,
                        value: f.compliance_percentage,
                        sublabel: `${f.implemented + f.not_applicable}/${f.total} controls`,
                        suffix: '%',
                      }))}
                      height={Math.max(200, fw.families.length * 36)}
                      maxValue={100}
                      colorByScore
                      showValues
                    />
                    {/* Detail Table */}
                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-gray-200 text-gray-500">
                            <th className="text-left py-2 font-medium">Family</th>
                            <th className="text-center py-2 font-medium">Implemented</th>
                            <th className="text-center py-2 font-medium">Partial</th>
                            <th className="text-center py-2 font-medium">Planned</th>
                            <th className="text-center py-2 font-medium">N/A</th>
                            <th className="text-center py-2 font-medium">Not Impl.</th>
                            <th className="text-center py-2 font-medium">Gap %</th>
                          </tr>
                        </thead>
                        <tbody>
                          {fw.families.map(f => (
                            <tr key={f.family} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-2 text-gray-900 font-medium">{f.family}</td>
                              <td className="py-2 text-center text-green-600">{f.implemented}</td>
                              <td className="py-2 text-center text-blue-600">{f.partially_implemented}</td>
                              <td className="py-2 text-center text-yellow-600">{f.planned}</td>
                              <td className="py-2 text-center text-gray-400">{f.not_applicable}</td>
                              <td className="py-2 text-center text-red-600 font-medium">{f.not_implemented}</td>
                              <td className="py-2 text-center">
                                <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                  f.gap_percentage > 50 ? 'bg-red-100 text-red-700' :
                                  f.gap_percentage > 25 ? 'bg-yellow-100 text-yellow-700' :
                                  f.gap_percentage > 0 ? 'bg-blue-100 text-blue-700' :
                                  'bg-green-100 text-green-700'
                                }`}>{f.gap_percentage}%</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB: FORECASTING */}
      {/* ============================================================ */}
      {activeTab === 'forecast' && (
        <div className="space-y-6">
          {!forecastData || forecastData.history.length < 3 ? (
            <div className={`${CARDS.elevated} p-12 text-center`}>
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <p className={TYPOGRAPHY.bodyMuted}>Need at least 3 daily snapshots to generate forecasts. Take snapshots from the Dashboard or wait for the automated daily snapshot.</p>
            </div>
          ) : (
            <>
              {/* Velocity Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={`${CARDS.elevated} p-4`}>
                  <p className="text-xs text-gray-500 mb-1">Current Compliance</p>
                  <p className="text-2xl font-bold text-gray-900">{forecastData.current_compliance}%</p>
                </div>
                <div className={`${CARDS.elevated} p-4`}>
                  <p className="text-xs text-gray-500 mb-1">7-Day Velocity</p>
                  <p className={`text-2xl font-bold ${forecastData.velocity.weekly >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {forecastData.velocity.weekly >= 0 ? '+' : ''}{forecastData.velocity.weekly}%
                  </p>
                </div>
                <div className={`${CARDS.elevated} p-4`}>
                  <p className="text-xs text-gray-500 mb-1">30-Day Velocity</p>
                  <p className={`text-2xl font-bold ${forecastData.velocity.monthly >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {forecastData.velocity.monthly >= 0 ? '+' : ''}{forecastData.velocity.monthly}%
                  </p>
                </div>
                <div className={`${CARDS.elevated} p-4`}>
                  <p className="text-xs text-gray-500 mb-1">Est. Days to 90%</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {forecastData.targets.to_90 === 0 ? 'Achieved' :
                     forecastData.targets.to_90 === null ? 'N/A' :
                     `${forecastData.targets.to_90}d`}
                  </p>
                </div>
              </div>

              {/* Forecast Chart */}
              <div className={`${CARDS.elevated} p-6`}>
                <h3 className={`${TYPOGRAPHY.sectionTitle} mb-4`}>Compliance Trend + 30-Day Forecast</h3>
                <TrendAreaChart
                  data={forecastChartData}
                  height={300}
                  valueLabel="Compliance"
                  valueSuffix="%"
                  showGrid
                  minY={0}
                  maxY={100}
                />
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-0.5 bg-blue-500 rounded" />
                    <span>Historical</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-0.5 bg-blue-300 rounded border border-dashed border-blue-400" />
                    <span>Forecast (linear projection)</span>
                  </div>
                </div>
              </div>

              {/* Target Milestones */}
              <div className={`${CARDS.elevated} p-6`}>
                <h3 className={`${TYPOGRAPHY.sectionTitle} mb-4`}>Compliance Milestones</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { target: 70, label: 'Minimum Threshold', value: forecastData.targets.to_70, color: 'yellow' },
                    { target: 80, label: 'Good Standing', value: forecastData.targets.to_80, color: 'blue' },
                    { target: 90, label: 'Strong Compliance', value: forecastData.targets.to_90, color: 'green' },
                    { target: 100, label: 'Full Compliance', value: forecastData.targets.to_100, color: 'emerald' },
                  ].map(m => (
                    <div key={m.target} className={`border rounded-lg p-3 ${
                      forecastData.current_compliance >= m.target ? 'border-green-200 bg-green-50' : 'border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-900">{m.target}%</span>
                        {forecastData.current_compliance >= m.target && (
                          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{m.label}</p>
                      <p className="text-sm font-semibold text-gray-900 mt-1">
                        {m.value === 0 ? 'Achieved' : m.value === null ? 'No trend' : `~${m.value} days`}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB: FRAMEWORK HEATMAP */}
      {/* ============================================================ */}
      {activeTab === 'heatmap' && (
        <div>
          {heatmapData.length === 0 ? (
            <div className={`${CARDS.elevated} p-12 text-center`}>
              <p className={TYPOGRAPHY.bodyMuted}>No system-framework data available. Create systems with enabled frameworks to see the compliance heatmap.</p>
            </div>
          ) : (
            <div className={`${CARDS.elevated} p-6 overflow-x-auto`}>
              <h3 className={`${TYPOGRAPHY.sectionTitle} mb-4`}>System x Framework Compliance Heatmap</h3>
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className="text-left py-2 px-2 font-medium text-gray-500 sticky left-0 bg-white z-10">System</th>
                    {heatmapFrameworks.map(fw => (
                      <th key={fw.id} className="text-center py-2 px-2 font-medium text-gray-500 min-w-[80px]">
                        <span className="block truncate max-w-[100px]" title={fw.name}>{fw.name}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {heatmapSystems.map(sys => (
                    <tr key={sys.id} className="border-t border-gray-100">
                      <td className="py-2 px-2 font-medium text-gray-900 sticky left-0 bg-white z-10">{sys.name}</td>
                      {heatmapFrameworks.map(fw => {
                        const cell = heatmapData.find(c => c.system_id === sys.id && c.framework_id === fw.id);
                        if (!cell) return <td key={fw.id} className="py-2 px-2 text-center text-gray-300">-</td>;
                        return (
                          <td key={fw.id} className="py-2 px-2 text-center">
                            <span className={`inline-block w-full py-1 rounded text-xs font-semibold text-white ${heatColor(cell.compliance_percentage)}`}
                                  title={`${cell.implemented}/${cell.total_controls} controls implemented`}>
                              {cell.compliance_percentage}%
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Legend */}
              <div className="flex items-center gap-2 mt-4 text-xs text-gray-500">
                <span>Legend:</span>
                {[
                  { label: '90%+', color: 'bg-green-500' },
                  { label: '80-89%', color: 'bg-green-400' },
                  { label: '70-79%', color: 'bg-blue-400' },
                  { label: '50-69%', color: 'bg-yellow-400' },
                  { label: '25-49%', color: 'bg-orange-400' },
                  { label: '<25%', color: 'bg-red-400' },
                ].map(l => (
                  <div key={l.label} className="flex items-center gap-1">
                    <div className={`w-3 h-3 rounded ${l.color}`} />
                    <span>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
