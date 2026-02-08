import { useState, useEffect, useCallback, useRef } from 'react';
import { getAccessToken } from '../utils/api';

interface RecentNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: string;
  created_at: string;
}

interface NotificationPollResult {
  count: number;
  version: number;
  recent: RecentNotification[];
  has_urgent: boolean;
}

/**
 * Enhanced polling hook for notifications with 15-second interval.
 * Uses ETag-style caching to minimize bandwidth when no changes.
 * Supports browser notifications for urgent items.
 */
export function useNotificationPoll(intervalMs = 15000) {
  const [data, setData] = useState<NotificationPollResult | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);
  const versionRef = useRef(0);
  const etagRef = useRef<string | null>(null);
  const lastUrgentIdRef = useRef<string | null>(null);

  const poll = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;

    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('since_version', String(versionRef.current));
      if (etagRef.current) params.set('etag', etagRef.current);

      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(
        `${apiUrl}/api/v1/notifications/poll?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      // 304 = no changes since last poll
      if (response.status === 304) {
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error('Poll failed');
      }

      const result: NotificationPollResult = await response.json();
      const newEtag = response.headers.get('ETag');
      if (newEtag) etagRef.current = newEtag;
      versionRef.current = result.version;
      setData(result);
      setError(null);

      // Show browser notification for urgent items (only for new ones)
      if (result.has_urgent && result.recent.length > 0) {
        const urgent = result.recent.find(n => n.priority === 'urgent');
        if (urgent && urgent.id !== lastUrgentIdRef.current) {
          lastUrgentIdRef.current = urgent.id;
          showBrowserNotification(urgent.title, urgent.message);
        }
      }
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Request browser notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Start polling
  useEffect(() => {
    poll(); // Initial poll
    const interval = setInterval(poll, intervalMs);
    return () => clearInterval(interval);
  }, [poll, intervalMs]);

  return {
    data,
    error,
    loading,
    count: data?.count || 0,
    hasUrgent: data?.has_urgent || false,
    recent: data?.recent || [],
    refresh: poll
  };
}

/**
 * Show a browser notification for urgent items
 */
function showBrowserNotification(title: string, body: string) {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    new Notification('ForgeComply 360', {
      body: `${title}: ${body}`,
      icon: '/favicon.ico',
      tag: 'forge-urgent', // Prevents duplicate notifications
      requireInteraction: true // Keep notification visible until dismissed
    });
  } catch (e) {
    // Notification API not supported in this context (e.g., some mobile browsers)
    console.warn('Browser notification failed:', e);
  }
}
