import { useState, useEffect, useCallback, useRef } from 'react';
import { api, getAccessToken } from '../utils/api';

/**
 * Enhanced notification count hook with 15-second polling.
 * Uses ETag-style caching for efficiency when no changes.
 */
export function useNotificationCount() {
  const [count, setCount] = useState(0);
  const [hasUrgent, setHasUrgent] = useState(false);
  const versionRef = useRef(0);
  const etagRef = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;

    try {
      const params = new URLSearchParams();
      params.set('since_version', String(versionRef.current));
      if (etagRef.current) params.set('etag', etagRef.current);

      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(
        `${apiUrl}/api/v1/notifications/poll?${params}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      // 304 = no changes since last poll
      if (response.status === 304) return;

      if (!response.ok) {
        // Fallback to simple count endpoint
        const fallback = await api('/api/v1/notifications/unread-count');
        setCount(fallback.count || 0);
        return;
      }

      const result = await response.json();
      const newEtag = response.headers.get('ETag');
      if (newEtag) etagRef.current = newEtag;
      versionRef.current = result.version || 0;
      setCount(result.count || 0);
      setHasUrgent(result.has_urgent || false);
    } catch {
      // Fallback to simple count
      api('/api/v1/notifications/unread-count')
        .then((d) => setCount(d.count || 0))
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    refresh();
    // Enhanced polling: 15 seconds instead of 60
    const interval = setInterval(refresh, 15000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { count, hasUrgent, refresh };
}
