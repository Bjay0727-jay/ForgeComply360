import React, { useEffect, useState } from 'react';
import { useExperience } from '../hooks/useExperience';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SystemData {
  id: string;
  name: string;
  acronym: string | null;
  impact_level: string;
  status: string;
  authorization_expiry: string | null;
  deployment_model: string | null;
  controls: {
    implemented: number;
    partially_implemented: number;
    planned: number;
    not_implemented: number;
    not_applicable: number;
    total: number;
  };
  compliance_percentage: number;
  poams: { open: number; in_progress: number; completed: number; overdue: number; total: number };
  risks: { low: number; moderate: number; high: number; critical: number; total: number };
  evidence_count: number;
  monitoring: { pass: number; fail: number; warning: number; total: number; health_score: number | null };
}

interface SystemScoreInfo {
  score: number;
  grade: string;
  previous_score: number | null;
}

type SortField = 'name' | 'compliance_percentage' | 'score' | 'poams' | 'risks' | 'evidence_count' | 'monitoring';

const GRADE_COLORS: Record<string, { text: string; bg: string }> = {
  A: { text: 'text-green-700', bg: 'bg-green-100' },
  B: { text: 'text-blue-700', bg: 'bg-blue-100' },
  C: { text: 'text-yellow-700', bg: 'bg-yellow-100' },
  D: { text: 'text-orange-700', bg: 'bg-orange-100' },
  F: { text: 'text-red-700', bg: 'bg-red-100' },
};

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export function SystemComparisonPage() {
  const { t, nav, isFederal } = useExperience();
  const { canEdit } = useAuth();
  const [systems, setSystems] = useState<SystemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>('compliance_percentage');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [scoreMap, setScoreMap] = useState<Record<string, SystemScoreInfo>>({});

  useEffect(() => {
    api<{ systems: SystemData[] }>('/api/v1/dashboard/system-comparison')
      .then((d) => setSystems(d.systems || []))
      .catch(() => {})
      .finally(() => setLoading(false));

    // Fetch compliance scores for grade column
    api<{ scores: { system_id: string; score: number; grade: string; previous_score: number | null }[] }>('/api/v1/compliance/scores')
      .then((d) => {
        const map: Record<string, SystemScoreInfo> = {};
        for (const s of d.scores || []) {
          // Aggregate per system (average across frameworks)
          if (!map[s.system_id]) {
            map[s.system_id] = { score: s.score, grade: s.grade, previous_score: s.previous_score };
          } else {
            const existing = map[s.system_id];
            const avg = Math.round((existing.score + s.score) / 2);
            existing.score = avg;
            existing.grade = avg >= 90 ? 'A' : avg >= 80 ? 'B' : avg >= 70 ? 'C' : avg >= 60 ? 'D' : 'F';
          }
        }
        setScoreMap(map);
      })
      .catch(() => {});
  }, []);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir(field === 'name' ? 'asc' : 'desc');
    }
  };

  const sorted = [...systems].sort((a, b) => {
    let av: number | string = 0;
    let bv: number | string = 0;
    switch (sortField) {
      case 'name': av = a.name.toLowerCase(); bv = b.name.toLowerCase(); break;
      case 'compliance_percentage': av = a.compliance_percentage; bv = b.compliance_percentage; break;
      case 'score': av = scoreMap[a.id]?.score ?? -1; bv = scoreMap[b.id]?.score ?? -1; break;
      case 'poams': av = a.poams.open; bv = b.poams.open; break;
      case 'risks': av = a.risks.total; bv = b.risks.total; break;
      case 'evidence_count': av = a.evidence_count; bv = b.evidence_count; break;
      case 'monitoring': av = a.monitoring.health_score ?? -1; bv = b.monitoring.health_score ?? -1; break;
    }
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  // Aggregate stats
  const totalSystems = systems.length;
  const avgCompliance = totalSystems > 0 ? Math.round(systems.reduce((s, sys) => s + sys.compliance_percentage, 0) / totalSystems) : 0;
  const totalOpenRisks = systems.reduce((s, sys) => s + sys.risks.total, 0);
  const totalOverduePoams = systems.reduce((s, sys) => s + sys.poams.overdue, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Empty / single system state
  if (systems.length <= 1) {
    return (
      <div className="p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h4v12H4V6zm6 0h4v12h-4V6zm6 0h4v12h-4V6z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Multiple Systems Required</h2>
        <p className="text-gray-500 mb-4">Add multiple {t('system').toLowerCase()}s to compare compliance posture across your organization.</p>
        <a href="/systems" className="text-blue-600 hover:text-blue-800 font-medium text-sm">
          Manage {t('system')}s &rarr;
        </a>
      </div>
    );
  }

  const compColor = (pct: number) => pct >= 80 ? 'text-green-600' : pct >= 50 ? 'text-yellow-600' : 'text-red-600';
  const compBg = (pct: number) => pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500';

  const impactBadge = (level: string) => {
    const colors: Record<string, string> = { high: 'bg-red-100 text-red-700', moderate: 'bg-yellow-100 text-yellow-700', low: 'bg-green-100 text-green-700' };
    return colors[level] || 'bg-gray-100 text-gray-600';
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = { authorized: 'bg-green-100 text-green-700', active: 'bg-blue-100 text-blue-700', under_review: 'bg-yellow-100 text-yellow-700', denied: 'bg-red-100 text-red-700', decommissioned: 'bg-gray-100 text-gray-500' };
    return colors[status] || 'bg-gray-100 text-gray-600';
  };

  const riskHeatColor = (count: number, level: string) => {
    if (count === 0) return 'bg-gray-50 text-gray-300';
    const intensity = count >= 10 ? '200' : count >= 5 ? '100' : '50';
    const textIntensity = count >= 5 ? '800' : '600';
    const colorMap: Record<string, string> = {
      critical: `bg-red-${intensity} text-red-${textIntensity}`,
      high: `bg-orange-${intensity} text-orange-${textIntensity}`,
      moderate: `bg-yellow-${intensity} text-yellow-${textIntensity}`,
      low: `bg-green-${intensity} text-green-${textIntensity}`,
    };
    return colorMap[level] || 'bg-gray-50 text-gray-400';
  };

  const SortIcon = ({ field }: { field: SortField }) => (
    <svg className={`w-3 h-3 inline ml-1 ${sortField === field ? 'text-blue-600' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sortField === field && sortDir === 'desc' ? 'M19 9l-7 7-7-7' : 'M5 15l7-7 7 7'} />
    </svg>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('system')} Comparison</h1>
        <p className="text-gray-500 text-sm mt-1">
          Cross-system {t('compliance').toLowerCase()} posture, risk landscape, and readiness metrics
        </p>
      </div>

      {/* Aggregate Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm font-medium text-gray-500 mb-1">Total {t('system')}s</p>
          <p className="text-3xl font-bold text-blue-600">{totalSystems}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm font-medium text-gray-500 mb-1">Avg {t('compliance')}</p>
          <p className={`text-3xl font-bold ${compColor(avgCompliance)}`}>{avgCompliance}%</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm font-medium text-gray-500 mb-1">Open Risks</p>
          <p className={`text-3xl font-bold ${totalOpenRisks > 0 ? 'text-red-600' : 'text-green-600'}`}>{totalOpenRisks}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm font-medium text-gray-500 mb-1">Overdue {isFederal ? 'POA&Ms' : t('milestone') + 's'}</p>
          <p className={`text-3xl font-bold ${totalOverduePoams > 0 ? 'text-red-600' : 'text-green-600'}`}>{totalOverduePoams}</p>
        </div>
      </div>

      {/* Compliance Bar Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">{t('compliance')} by {t('system')}</h2>
        <div className="space-y-3">
          {[...systems].sort((a, b) => a.compliance_percentage - b.compliance_percentage).map((sys) => (
            <div key={sys.id} className="flex items-center gap-3">
              <div className="w-40 shrink-0 text-sm truncate">
                <span className="font-medium text-gray-900">{sys.name}</span>
                {sys.acronym && <span className="text-gray-400 ml-1">({sys.acronym})</span>}
              </div>
              <div className="flex-1 bg-gray-100 rounded-full h-4 relative">
                <div
                  className={`h-4 rounded-full transition-all duration-500 ${compBg(sys.compliance_percentage)}`}
                  style={{ width: `${Math.max(sys.compliance_percentage, 2)}%` }}
                />
              </div>
              <span className={`w-12 text-right text-sm font-bold ${compColor(sys.compliance_percentage)}`}>
                {sys.compliance_percentage}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Comparison Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500 cursor-pointer select-none" onClick={() => toggleSort('name')}>
                  {t('system')} <SortIcon field="name" />
                </th>
                <th className="text-center px-3 py-3 font-medium text-gray-500 cursor-pointer select-none" onClick={() => toggleSort('score')}>
                  Grade <SortIcon field="score" />
                </th>
                <th className="text-center px-3 py-3 font-medium text-gray-500 cursor-pointer select-none" onClick={() => toggleSort('compliance_percentage')}>
                  {t('compliance')} <SortIcon field="compliance_percentage" />
                </th>
                <th className="text-center px-3 py-3 font-medium text-gray-500">{t('control')}s</th>
                <th className="text-center px-3 py-3 font-medium text-gray-500 cursor-pointer select-none" onClick={() => toggleSort('poams')}>
                  {isFederal ? 'POA&Ms' : t('milestone') + 's'} <SortIcon field="poams" />
                </th>
                <th className="text-center px-3 py-3 font-medium text-gray-500 cursor-pointer select-none" onClick={() => toggleSort('risks')}>
                  Risks <SortIcon field="risks" />
                </th>
                <th className="text-center px-3 py-3 font-medium text-gray-500 cursor-pointer select-none" onClick={() => toggleSort('evidence_count')}>
                  Evidence <SortIcon field="evidence_count" />
                </th>
                <th className="text-center px-3 py-3 font-medium text-gray-500 cursor-pointer select-none" onClick={() => toggleSort('monitoring')}>
                  Monitoring <SortIcon field="monitoring" />
                </th>
                <th className="text-center px-3 py-3 font-medium text-gray-500">Status</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sorted.map((sys) => (
                <tr key={sys.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{sys.name}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {sys.acronym && <span className="text-xs text-gray-400">{sys.acronym}</span>}
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${impactBadge(sys.impact_level)}`}>
                        {sys.impact_level}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    {scoreMap[sys.id] ? (
                      <div className="flex flex-col items-center gap-0.5">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-black ${GRADE_COLORS[scoreMap[sys.id].grade]?.bg || 'bg-gray-100'} ${GRADE_COLORS[scoreMap[sys.id].grade]?.text || 'text-gray-600'}`}>
                          {scoreMap[sys.id].grade}
                        </span>
                        <span className="text-xs text-gray-400">{scoreMap[sys.id].score}/100</span>
                      </div>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={`text-lg font-bold ${compColor(sys.compliance_percentage)}`}>
                      {sys.compliance_percentage}%
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className="text-green-600 font-semibold">{sys.controls.implemented}</span>
                    <span className="text-gray-400">/{sys.controls.total}</span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className="font-semibold text-gray-700">{sys.poams.open}</span>
                    {sys.poams.overdue > 0 && (
                      <span className="ml-1 text-xs text-red-600 font-semibold">({sys.poams.overdue} overdue)</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className="font-semibold text-gray-700">{sys.risks.total}</span>
                    {sys.risks.critical > 0 && (
                      <span className="ml-1 text-xs text-red-600 font-semibold">({sys.risks.critical} crit)</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center text-gray-600">{sys.evidence_count}</td>
                  <td className="px-3 py-3 text-center">
                    {sys.monitoring.health_score !== null ? (
                      <span className={`font-semibold ${sys.monitoring.health_score >= 80 ? 'text-green-600' : sys.monitoring.health_score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {sys.monitoring.health_score}%
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusBadge(sys.status)}`}>
                      {sys.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <a href={`/controls?system_id=${sys.id}`} className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                      View &rarr;
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Risk Heatmap */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Risk Heatmap by {t('system')}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left px-3 py-2 font-medium text-gray-500">{t('system')}</th>
                <th className="text-center px-3 py-2 font-medium text-red-600">Critical</th>
                <th className="text-center px-3 py-2 font-medium text-orange-600">High</th>
                <th className="text-center px-3 py-2 font-medium text-yellow-600">Moderate</th>
                <th className="text-center px-3 py-2 font-medium text-green-600">Low</th>
                <th className="text-center px-3 py-2 font-medium text-gray-500">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {systems.map((sys) => (
                <tr key={sys.id}>
                  <td className="px-3 py-2 font-medium text-gray-700">{sys.name}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={`inline-block w-10 py-1 rounded text-xs font-bold ${riskHeatColor(sys.risks.critical, 'critical')}`}>
                      {sys.risks.critical}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className={`inline-block w-10 py-1 rounded text-xs font-bold ${riskHeatColor(sys.risks.high, 'high')}`}>
                      {sys.risks.high}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className={`inline-block w-10 py-1 rounded text-xs font-bold ${riskHeatColor(sys.risks.moderate, 'moderate')}`}>
                      {sys.risks.moderate}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className={`inline-block w-10 py-1 rounded text-xs font-bold ${riskHeatColor(sys.risks.low, 'low')}`}>
                      {sys.risks.low}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center font-bold text-gray-700">{sys.risks.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
