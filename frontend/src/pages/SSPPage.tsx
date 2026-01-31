import React, { useEffect, useState } from 'react';
import { useExperience } from '../hooks/useExperience';
import { api } from '../utils/api';

export function SSPPage() {
  const { t, nav, isFederal } = useExperience();
  const [documents, setDocuments] = useState<any[]>([]);
  const [frameworks, setFrameworks] = useState<any[]>([]);
  const [systems, setSystems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedSystem, setSelectedSystem] = useState('');
  const [selectedFw, setSelectedFw] = useState('');
  const [generatedOscal, setGeneratedOscal] = useState<any>(null);

  useEffect(() => {
    Promise.all([api('/api/v1/ssp'), api('/api/v1/frameworks/enabled'), api('/api/v1/systems')])
      .then(([d, f, s]) => {
        setDocuments(d.documents);
        setFrameworks(f.frameworks);
        setSystems(s.systems);
        if (s.systems.length > 0) setSelectedSystem(s.systems[0].id);
        if (f.frameworks.length > 0) setSelectedFw(f.frameworks[0].id);
      }).finally(() => setLoading(false));
  }, []);

  const handleGenerate = async () => {
    if (!selectedSystem || !selectedFw) return;
    setGenerating(true);
    try {
      const data = await api('/api/v1/ssp/generate', { method: 'POST', body: JSON.stringify({ system_id: selectedSystem, framework_id: selectedFw }) });
      setGeneratedOscal(data.ssp.oscal);
      // Refresh document list
      const docs = await api('/api/v1/ssp');
      setDocuments(docs.documents);
    } catch { } finally { setGenerating(false); }
  };

  const downloadOscal = () => {
    if (!generatedOscal) return;
    const blob = new Blob([JSON.stringify(generatedOscal, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ssp-oscal-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const title = isFederal ? 'SSP Generator (ComplianceFoundry)' : `${t('document')} Generator`;

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="text-gray-500 text-sm mt-1">Generate OSCAL-native {t('document').toLowerCase()}s</p>
      </div>

      {/* Generator */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Generate New {t('documentShort')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select value={selectedSystem} onChange={(e) => setSelectedSystem(e.target.value)} className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm">
            {systems.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={selectedFw} onChange={(e) => setSelectedFw(e.target.value)} className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm">
            {frameworks.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <button onClick={handleGenerate} disabled={generating || !selectedSystem || !selectedFw}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {generating ? 'Generating...' : `Generate ${t('documentShort')}`}
          </button>
        </div>
      </div>

      {/* Generated OSCAL Preview */}
      {generatedOscal && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">OSCAL Output</h2>
            <button onClick={downloadOscal} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700">Download JSON</button>
          </div>
          <pre className="bg-gray-900 text-green-400 rounded-lg p-4 text-xs overflow-auto max-h-64 font-mono">
            {JSON.stringify(generatedOscal, null, 2)}
          </pre>
        </div>
      )}

      {/* Previous documents */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Generated Documents</h2>
        {documents.length === 0 ? (
          <p className="text-gray-500 text-sm">No documents generated yet.</p>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{doc.title}</p>
                  <p className="text-xs text-gray-500">{doc.framework_name} | {doc.system_name} | v{doc.version}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${doc.status === 'approved' ? 'bg-green-100 text-green-700' : doc.status === 'draft' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>{doc.status}</span>
                  <span className="text-xs text-gray-400">{new Date(doc.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
