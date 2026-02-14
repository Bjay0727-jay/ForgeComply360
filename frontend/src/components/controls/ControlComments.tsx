/**
 * ForgeComply 360 - Control Comments Component
 * Shows and manages comments on control implementations
 */
import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../utils/api';
import type { ControlComment, Implementation } from '../../types/api';

interface ControlCommentsProps {
  controlId: string;
  systemId: string;
  implementation?: Implementation;
  canEdit: boolean;
}

export function ControlComments({
  controlId,
  systemId,
  implementation,
  canEdit,
}: ControlCommentsProps) {
  const [comments, setComments] = useState<ControlComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  const loadComments = useCallback(async () => {
    if (!systemId) return;
    setLoading(true);
    try {
      const d = await api(`/api/v1/controls/${controlId}/comments?system_id=${systemId}`);
      setComments(d.comments || []);
    } catch {
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [controlId, systemId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const addComment = async () => {
    if (!newComment.trim() || !systemId) return;
    try {
      await api(`/api/v1/controls/${controlId}/comments`, {
        method: 'POST',
        body: JSON.stringify({
          content: newComment,
          system_id: systemId,
          implementation_id: implementation?.id || '',
        }),
      });
      setNewComment('');
      loadComments();
    } catch {
      // Silent fail
    }
  };

  const relativeTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  if (loading) {
    return (
      <div className="mt-4">
        <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Comments
        </h4>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <div className="w-3 h-3 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
        <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        Comments ({comments.length})
      </h4>

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {comments.length === 0 && (
          <p className="text-xs text-gray-400">No comments yet.</p>
        )}
        {comments.map((c) => (
          <div
            key={c.id}
            className="py-2 px-3 bg-white dark:bg-gray-700 rounded border border-gray-100 dark:border-gray-600"
          >
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
                {c.author_name || 'Unknown'}
              </span>
              <span className="text-[10px] text-gray-400">
                {relativeTime(c.created_at)}
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300">{c.content}</p>
          </div>
        ))}
      </div>

      {canEdit && (
        <div className="flex items-center gap-2 mt-2">
          <input
            type="text"
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addComment()}
            className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-xs bg-white dark:bg-gray-700 dark:text-gray-200"
          />
          <button
            onClick={addComment}
            disabled={!newComment.trim()}
            className="px-3 py-1.5 bg-forge-navy-900 text-white rounded-lg text-xs font-medium hover:bg-forge-navy-800 disabled:opacity-50"
          >
            Post
          </button>
        </div>
      )}
    </div>
  );
}
