import { useEffect, useRef, useCallback } from 'react';

interface UseIdleTimeoutOptions {
  timeoutMinutes: number;
  warningSeconds?: number; // default 30
  onWarning: () => void;
  onTimeout: () => void;
  enabled?: boolean;
}

export function useIdleTimeout({ timeoutMinutes, warningSeconds = 30, onWarning, onTimeout, enabled = true }: UseIdleTimeoutOptions) {
  const lastActivityRef = useRef(Date.now());
  const warningShownRef = useRef(false);
  const timedOutRef = useRef(false);

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    warningShownRef.current = false;
    timedOutRef.current = false;
  }, []);

  useEffect(() => {
    if (!enabled || timeoutMinutes <= 0) return;

    const handleActivity = () => {
      lastActivityRef.current = Date.now();
      // Only reset warning if it hasn't timed out
      if (!timedOutRef.current) {
        warningShownRef.current = false;
      }
    };

    const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];
    const opts: AddEventListenerOptions = { passive: true };
    events.forEach(e => window.addEventListener(e, handleActivity, opts));

    const interval = setInterval(() => {
      const idle = Date.now() - lastActivityRef.current;
      const timeoutMs = timeoutMinutes * 60 * 1000;
      const warningMs = timeoutMs - warningSeconds * 1000;

      if (idle >= timeoutMs && !timedOutRef.current) {
        timedOutRef.current = true;
        onTimeout();
      } else if (idle >= warningMs && !warningShownRef.current && !timedOutRef.current) {
        warningShownRef.current = true;
        onWarning();
      }
    }, 5000); // check every 5 seconds

    return () => {
      events.forEach(e => window.removeEventListener(e, handleActivity));
      clearInterval(interval);
    };
  }, [timeoutMinutes, warningSeconds, onWarning, onTimeout, enabled]);

  return { resetTimer };
}
