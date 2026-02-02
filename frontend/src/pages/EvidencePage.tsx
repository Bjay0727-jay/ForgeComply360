import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useExperience } from '../hooks/useExperience';
import { useAuth } from '../hooks/useAuth';
import { api, getAccessToken } from '../utils/api';

export function EvidencePage() {
  const { t, nav } = useExperience();
  const { canEdit } = useAuth();
  const [evidence, setEvidence] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [collectionDate, setCollectionDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

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
      if (collectionDate) formData.append('collection_date', collectionDate);
      if (expiryDate) formData.append('expiry_date', expiryDate);
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
      setCollectionDate('');
      setExpiryDate('');
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
        <div className="flex items-center gap-3">
          <Link to="/evidence/schedules" className="px-3 py-2 text-sm text-purple-600 hover:text-purple-800 border border-purple-300 rounded-lg font-medium flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            Schedules
          </Link>
          {canEdit && <button onClick={() => setShowUpload(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">+ Upload {t('evidence')}</button>}
        </div>
      </div>

      {showUpload && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <form onSubmit={handleUpload} className="space-y-4">
            <input type="text" placeholder="Title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg" />
            <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg" />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Collection Date</label>
                <input type="date" value={collectionDate} onChange={(e) => setCollectionDate(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Expiry Date</label>
                <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm" />
              </div>
            </div>
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
              <th className="text-left px-4 py-3 font-medium text-gray-500">Collected</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Expires</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-100">
              {evidence.map((ev) => (
                <tr key={ev.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{ev.title}</td>
                  <td className="px-4 py-3 text-gray-600">{ev.file_name}</td>
                  <td className="px-4 py-3 text-gray-500">{formatSize(ev.file_size)}</td>
                  <td className="px-4 py-3 text-gray-500">{ev.uploaded_by_name || 'Unknown'}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(ev.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{ev.collection_date ? new Date(ev.collection_date + 'T00:00:00').toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3 text-xs">{ev.expiry_date ? (
                    <span className={new Date(ev.expiry_date) < new Date() ? 'text-red-600 font-semibold' : new Date(ev.expiry_date) < new Date(Date.now() + 14*24*60*60*1000) ? 'text-orange-600 font-medium' : 'text-gray-600'}>
                      {new Date(ev.expiry_date + 'T00:00:00').toLocaleDateString()}
                    </span>
                  ) : '—'}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded font-medium ${ev.status === 'active' ? 'bg-green-100 text-green-700' : ev.status === 'expired' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>{ev.status}</span></td>
                  <td className="px-4 py-3">
                    <button
                      onClick={async () => {
                        try {
                          const apiBase = import.meta.env.VITE_API_URL || '';
                          const res = await fetch(`${apiBase}/api/v1/evidence/${ev.id}/download`, {
                            headers: { Authorization: `Bearer ${getAccessToken()}` },
                          });
                          if (!res.ok) throw new Error('Download failed');
                          const blob = await res.blob();
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = ev.file_name || 'evidence';
                          a.click();
                          URL.revokeObjectURL(url);
                        } catch {}
                      }}
                      className="text-blue-600 hover:text-blue-800 text-xs font-medium flex items-center gap-1"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
