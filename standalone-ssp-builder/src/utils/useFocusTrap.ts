/**
 * Focus Trap Hook for Modal Accessibility
 * Traps focus within a modal to prevent tabbing outside
 * Section 508 / WCAG 2.1 AA compliant
 */
import { useEffect, type RefObject } from 'react';

const FOCUSABLE_SELECTORS = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Hook to trap focus within a container element
 * @param ref - RefObject pointing to the container element
 * @param isOpen - Whether the modal is open (trap is active)
 * @param initialFocusRef - Optional ref for the element to receive initial focus
 */
export function useFocusTrap(
  ref: RefObject<HTMLElement | null>,
  isOpen: boolean,
  initialFocusRef?: RefObject<HTMLElement | null>
) {
  useEffect(() => {
    if (!isOpen || !ref.current) return;

    const container = ref.current;
    const previousActiveElement = document.activeElement as HTMLElement;

    // Get all focusable elements within the container
    const getFocusableElements = () => {
      const elements = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS);
      return Array.from(elements).filter(
        (el) => el.offsetParent !== null // Filter out hidden elements
      );
    };

    // Set initial focus
    const setInitialFocus = () => {
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus();
      } else {
        const focusable = getFocusableElements();
        if (focusable.length > 0) {
          focusable[0].focus();
        }
      }
    };

    // Handle Tab key to trap focus
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const focusable = getFocusableElements();
      if (focusable.length === 0) return;

      const firstElement = focusable[0];
      const lastElement = focusable[focusable.length - 1];

      // Shift+Tab from first element -> wrap to last
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
      // Tab from last element -> wrap to first
      else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    // Focus the first element after a small delay (to ensure DOM is ready)
    const focusTimer = setTimeout(setInitialFocus, 10);

    // Add event listener
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKeyDown);

      // Restore focus to the previously focused element
      if (previousActiveElement && previousActiveElement.focus) {
        previousActiveElement.focus();
      }
    };
  }, [isOpen, ref, initialFocusRef]);
}

export default useFocusTrap;
