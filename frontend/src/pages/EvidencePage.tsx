import React, { useEffect, useState } from 'react';
import { useExperience } from '../hooks/useExperience';
import { api } from '../utils/api';
import { getAccessToken } from '../utils/api';

export function EvidencePage() {
  const { t, nav } = useExperience();
  const [evidence, setEvidence] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const load = () => { api('/api/v1/evidence').then((d) => setEvidence(d.evidence)).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(load, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title || file.name);
      formData.append('description', description);
      const apiBase = import.meta.env.VITE_API_URL || '';
      await fetch(`${apiBase}/api/v1/evidence`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getAccessToken()}` },
        body: formData,
      });
      setShowUpload(false);
      setTitle('');
      setDescription('');
      setFile(null);
      load();
    } catch { } finally { setUploading(false); }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">{nav('evidence')}</h1><p className="text-gray-500 text-sm mt-1">Upload and manage {t('evidence').toLowerCase()} documents</p></div>
        <button onClick={() => setShowUpload(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">+ Upload {t('evidence')}</button>
      </div>

      {showUpload && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <form onSubmit={handleUpload} className="space-y-4">
            <input type="text" placeholder="Title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg" />
            <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg" />
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full" />
              {file && <p className="text-sm text-gray-600 mt-2">{file.name} ({formatSize(file.size)})</p>}
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={!file || uploading} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{uploading ? 'Uploading...' : 'Upload'}</button>
              <button type="button" onClick={() => setShowUpload(false)} className="px-4 py-2 text-gray-600 text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {evidence.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center"><p className="text-gray-500">No {t('evidence').toLowerCase()} uploaded yet.</p></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b"><tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Title</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">File</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Size</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Uploaded By</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-100">
              {evidence.map((ev) => (
                <tr key={ev.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{ev.title}</td>
                  <td className="px-4 py-3 text-gray-600">{ev.file_name}</td>
                  <td className="px-4 py-3 text-gray-500">{formatSize(ev.file_size)}</td>
                  <td className="px-4 py-3 text-gray-500">{ev.uploaded_by_name || 'Unknown'}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(ev.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded font-medium ${ev.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{ev.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
