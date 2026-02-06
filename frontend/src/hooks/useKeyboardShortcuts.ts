import { useEffect } from 'react';

/**
 * Global keyboard shortcuts for ForgeComply 360.
 * - Escape: dispatches 'close-modal' custom event (always works, even in inputs)
 * - Ctrl+K / Cmd+K: dispatches 'open-command-palette' custom event
 */
export function useKeyboardShortcuts() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape — close any open modal, drawer, or expanded card
      if (e.key === 'Escape') {
        window.dispatchEvent(new CustomEvent('close-modal'));
        return;
      }

      // Ctrl+K / Cmd+K — open command palette
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('open-command-palette'));
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
