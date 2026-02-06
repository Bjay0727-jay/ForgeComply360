import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useExperience } from '../hooks/useExperience';
import { useAuth } from '../hooks/useAuth';
import { api, getAccessToken } from '../utils/api';
import { PageHeader } from '../components/PageHeader';
import { SkeletonTable } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { Pagination } from '../components/Pagination';
import { useToast } from '../components/Toast';
import { exportEvidenceCSV } from '../utils/exportHelpers';
import { TYPOGRAPHY, BADGES, STATUS_BADGE_COLORS, BUTTONS, CARDS, FORMS } from '../utils/typography';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getExpiryBadge(expiryDate: string | null): { class: string; label: string } | null {
  if (!expiryDate) return null;
  const expiry = new Date(expiryDate);
  const now = new Date();
  const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilExpiry < 0) {
    return { class: BADGES.error, label: 'Expired' };
  } else if (daysUntilExpiry <= 7) {
    return { class: BADGES.error, label: `${daysUntilExpiry}d left` };
  } else if (daysUntilExpiry <= 30) {
    return { class: BADGES.warning, label: `${daysUntilExpiry}d left` };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function EvidencePage() {
  const { t, nav } = useExperience();
  const { canEdit } = useAuth();
  const { addToast } = useToast();

  const [evidence, setEvidence] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [collectionDate, setCollectionDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const load = useCallback(() => {
    api(`/api/v1/evidence?page=${page}&limit=${limit}`)
      .then((d) => {
        setEvidence(d.evidence);
        setTotal(d.total || d.evidence.length);
      })
      .catch(() => {
        addToast({ type: 'error', title: 'Failed to load evidence' });
      })
      .finally(() => setLoading(false));
  }, [page, limit, addToast]);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setFile(null);
    setCollectionDate('');
    setExpiryDate('');
    setShowUpload(false);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    // Validate file size (max 50MB)
    const MAX_FILE_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      addToast({ type: 'error', title: 'File too large', message: 'Maximum file size is 50MB' });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title || file.name);
      formData.append('description', description);
      if (collectionDate) formData.append('collection_date', collectionDate);
      if (expiryDate) formData.append('expiry_date', expiryDate);

      const apiBase = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${apiBase}/api/v1/evidence`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getAccessToken()}` },
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');

      resetForm();
      load();
      addToast({ type: 'success', title: 'Evidence uploaded', message: file.name });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Upload failed',
        message: err.message || 'Unable to upload file. Please try again.',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (ev: any) => {
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
    } catch {
      addToast({ type: 'error', title: 'Download failed' });
    }
  };

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      if (!title) setTitle(droppedFile.name.replace(/\.[^/.]+$/, ''));
    }
  }, [title]);

  if (loading) return <SkeletonTable />;

  return (
    <div>
      <PageHeader title={nav('evidence')} subtitle={`Upload and manage ${t('evidence').toLowerCase()} documents`}>
        <Link to="/evidence/schedules" className="px-4 py-2 bg-white text-gray-900 rounded-lg text-sm font-medium hover:bg-white/90 flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Schedules
        </Link>
        <button onClick={() => exportEvidenceCSV(evidence)} className="px-4 py-2 bg-white text-gray-900 rounded-lg text-sm font-medium hover:bg-white/90 flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          CSV
        </button>
        {canEdit && (
          <button onClick={() => setShowUpload(true)} className="px-4 py-2 bg-white text-gray-900 rounded-lg text-sm font-medium hover:bg-white/90">
            + Upload {t('evidence')}
          </button>
        )}
      </PageHeader>

      {/* Upload Form */}
      {showUpload && (
        <div className={`${CARDS.elevated} p-6 mb-6`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={TYPOGRAPHY.sectionTitle}>Upload {t('evidence')}</h3>
            <button onClick={resetForm} className={BUTTONS.ghost} aria-label="Close upload form">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleUpload} className="space-y-4">
            {/* Drag and Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                isDragging
                  ? 'border-forge-navy-500 bg-forge-navy-50'
                  : file
                  ? 'border-green-300 bg-green-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className={TYPOGRAPHY.body}>{file.name}</p>
                    <p className={TYPOGRAPHY.bodySmallMuted}>{formatSize(file.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="ml-4 p-1 text-gray-400 hover:text-gray-600"
                    aria-label="Remove file"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <>
                  <div className="p-3 bg-gray-100 rounded-full w-fit mx-auto mb-3">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <p className={TYPOGRAPHY.body}>
                    <span className="font-medium text-forge-navy-600">Click to upload</span> or drag and drop
                  </p>
                  <p className={TYPOGRAPHY.bodySmallMuted}>PDF, DOCX, XLSX, Images, or ZIP (max 50MB)</p>
                  <input
                    type="file"
                    onChange={(e) => {
                      const selectedFile = e.target.files?.[0] || null;
                      setFile(selectedFile);
                      if (selectedFile && !title) {
                        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    aria-label="Select file"
                  />
                </>
              )}
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={FORMS.label}>Title</label>
                <input
                  type="text"
                  placeholder="Evidence title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={FORMS.input}
                />
              </div>
              <div>
                <label className={FORMS.label}>Description</label>
                <input
                  type="text"
                  placeholder="Brief description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={FORMS.input}
                />
              </div>
              <div>
                <label className={FORMS.label}>Collection Date</label>
                <input
                  type="date"
                  value={collectionDate}
                  onChange={(e) => setCollectionDate(e.target.value)}
                  className={FORMS.input}
                />
                <p className={FORMS.helpText}>When the evidence was collected</p>
              </div>
              <div>
                <label className={FORMS.label}>Expiry Date</label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className={FORMS.input}
                />
                <p className={FORMS.helpText}>When evidence needs to be refreshed</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={!file || uploading}
                className={BUTTONS.primary}
              >
                {uploading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Uploading...
                  </>
                ) : (
                  'Upload Evidence'
                )}
              </button>
              <button type="button" onClick={resetForm} className={BUTTONS.ghost}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Evidence List */}
      {evidence.length === 0 ? (
        <EmptyState
          title="No evidence uploaded yet"
          subtitle="Upload artifacts to track compliance evidence"
          icon="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
        />
      ) : (
        <div className={`${CARDS.base} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className={`text-left px-4 py-3 ${TYPOGRAPHY.tableHeader}`}>Title</th>
                  <th className={`text-left px-4 py-3 ${TYPOGRAPHY.tableHeader}`}>File</th>
                  <th className={`text-left px-4 py-3 ${TYPOGRAPHY.tableHeader}`}>Size</th>
                  <th className={`text-left px-4 py-3 ${TYPOGRAPHY.tableHeader}`}>Uploaded By</th>
                  <th className={`text-left px-4 py-3 ${TYPOGRAPHY.tableHeader}`}>Date</th>
                  <th className={`text-left px-4 py-3 ${TYPOGRAPHY.tableHeader}`}>Collected</th>
                  <th className={`text-left px-4 py-3 ${TYPOGRAPHY.tableHeader}`}>Expires</th>
                  <th className={`text-left px-4 py-3 ${TYPOGRAPHY.tableHeader}`}>Status</th>
                  <th className={`text-left px-4 py-3 ${TYPOGRAPHY.tableHeader}`}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {evidence.map((ev) => {
                  const expiryBadge = getExpiryBadge(ev.expiry_date);
                  return (
                    <tr key={ev.id} className="hover:bg-gray-50">
                      <td className={`px-4 py-3 ${TYPOGRAPHY.tableCell} font-medium`}>{ev.title}</td>
                      <td className={`px-4 py-3 ${TYPOGRAPHY.tableCellMuted}`}>{ev.file_name}</td>
                      <td className={`px-4 py-3 ${TYPOGRAPHY.tableCellMuted}`}>{formatSize(ev.file_size)}</td>
                      <td className={`px-4 py-3 ${TYPOGRAPHY.tableCellMuted}`}>{ev.uploaded_by_name || 'Unknown'}</td>
                      <td className={`px-4 py-3 ${TYPOGRAPHY.tableCellMuted}`}>
                        {new Date(ev.created_at).toLocaleDateString()}
                      </td>
                      <td className={`px-4 py-3 ${TYPOGRAPHY.tableCellSmall}`}>
                        {ev.collection_date ? new Date(ev.collection_date + 'T00:00:00').toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {ev.expiry_date ? (
                          <div className="flex items-center gap-2">
                            <span className={TYPOGRAPHY.tableCellSmall}>
                              {new Date(ev.expiry_date + 'T00:00:00').toLocaleDateString()}
                            </span>
                            {expiryBadge && (
                              <span className={`${BADGES.base} ${expiryBadge.class}`}>{expiryBadge.label}</span>
                            )}
                          </div>
                        ) : (
                          <span className={TYPOGRAPHY.tableCellMuted}>—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`${BADGES.base} ${
                            ev.status === 'active'
                              ? STATUS_BADGE_COLORS.active
                              : ev.status === 'expired'
                              ? STATUS_BADGE_COLORS.expired
                              : BADGES.neutral
                          }`}
                        >
                          {ev.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDownload(ev)}
                          className={`${BUTTONS.link} flex items-center gap-1`}
                          aria-label={`Download ${ev.title}`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Pagination
        page={page}
        totalPages={Math.ceil(total / limit)}
        total={total}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={setLimit}
        showLimitSelector
      />
    </div>
  );
}
