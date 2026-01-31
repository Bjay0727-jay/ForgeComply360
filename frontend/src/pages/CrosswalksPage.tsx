import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';

export function CrosswalksPage() {
  const [frameworks, setFrameworks] = useState<any[]>([]);
  const [sourceFw, setSourceFw] = useState('');
  const [targetFw, setTargetFw] = useState('');
  const [crosswalks, setCrosswalks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    api('/api/v1/frameworks').then((d) => {
      setFrameworks(d.frameworks);
      if (d.frameworks.length >= 2) { setSourceFw(d.frameworks[0].id); setTargetFw(d.frameworks[1].id); }
    }).finally(() => setLoading(false));
  }, []);

  const search = async () => {
    if (!sourceFw || !targetFw) return;
    setSearching(true);
    try {
      const d = await api(`/api/v1/crosswalks?source_framework=${sourceFw}&target_framework=${targetFw}`);
      setCrosswalks(d.crosswalks);
    } catch { } finally { setSearching(false); }
  };

  useEffect(() => { if (sourceFw && targetFw) search(); }, [sourceFw, targetFw]);

  const typeColor = (t: string) => t === 'equivalent' ? 'bg-green-100 text-green-700' : t === 'partial' ? 'bg-yellow-100 text-yellow-700' : t === 'superset' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600';
  const confLabel = (c: number) => c >= 0.9 ? 'High' : c >= 0.7 ? 'Medium' : 'Low';

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Crosswalk Engine</h1>
        <p className="text-gray-500 text-sm mt-1">Map controls across compliance frameworks to reduce duplicate work</p>
      </div>

      {/* Framework selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Source Framework</label>
            <select value={sourceFw} onChange={(e) => setSourceFw(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm">
              {frameworks.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <div className="flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Framework</label>
            <select value={targetFw} onChange={(e) => setTargetFw(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm">
              {frameworks.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      {searching ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : crosswalks.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No crosswalk mappings found between these frameworks. Mappings are added as frameworks expand.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b">
            <p className="text-sm text-gray-600">{crosswalks.length} mapping{crosswalks.length !== 1 ? 's' : ''} found</p>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b"><tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Source Control</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Target Control</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Mapping Type</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Confidence</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-100">
              {crosswalks.map((cw) => (
                <tr key={cw.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-blue-700 font-medium">{cw.source_control_id}</td>
                  <td className="px-4 py-3 font-mono text-blue-700 font-medium">{cw.target_control_id}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded font-medium capitalize ${typeColor(cw.mapping_type)}`}>{cw.mapping_type}</span></td>
                  <td className="px-4 py-3 text-gray-600">{Math.round(cw.confidence * 100)}% ({confLabel(cw.confidence)})</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
