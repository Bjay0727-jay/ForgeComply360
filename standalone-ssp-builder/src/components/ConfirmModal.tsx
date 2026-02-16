/**
 * Confirmation Modal Component
 * Replaces browser confirm() with a styled, accessible modal
 * Section 508 / WCAG 2.1 AA compliant with focus trap
 */
import { useEffect, useRef, useState, useCallback, createContext, useContext, type ReactNode } from 'react';
import { C } from '../config/colors';
import { useFocusTrap } from '../utils/useFocusTrap';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger';
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
}

interface ModalState extends ConfirmOptions {
  isOpen: boolean;
  resolve: ((value: boolean) => void) | null;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'default',
    resolve: null,
  });

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setModal({
        isOpen: true,
        title: options.title,
        message: options.message,
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        variant: options.variant || 'default',
        resolve,
      });
    });
  }, []);

  const handleClose = useCallback((result: boolean) => {
    if (modal.resolve) {
      modal.resolve(result);
    }
    setModal((prev) => ({ ...prev, isOpen: false, resolve: null }));
  }, [modal.resolve]);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {modal.isOpen && (
        <ConfirmModal
          title={modal.title}
          message={modal.message}
          confirmText={modal.confirmText!}
          cancelText={modal.cancelText!}
          variant={modal.variant!}
          onConfirm={() => handleClose(true)}
          onCancel={() => handleClose(false)}
        />
      )}
    </ConfirmContext.Provider>
  );
}

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  variant: 'default' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmModal({
  title,
  message,
  confirmText,
  cancelText,
  variant,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Use focus trap for accessibility - danger dialogs focus cancel, others focus confirm
  const initialFocusRef = variant === 'danger' ? cancelRef : confirmRef;
  useFocusTrap(modalRef, true, initialFocusRef);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      } else if (e.key === 'Enter') {
        // Only confirm on Enter if not a danger variant (safety)
        if (variant !== 'danger') {
          onConfirm();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onConfirm, onCancel, variant]);

  // Prevent body scroll
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const isDanger = variant === 'danger';
  const confirmBg = isDanger
    ? `linear-gradient(135deg, ${C.error}, #dc2626)`
    : `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onCancel}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.5)',
          backdropFilter: 'blur(2px)',
          zIndex: 9998,
          animation: 'fadeIn 0.15s ease-out',
        }}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: C.bg,
          borderRadius: 12,
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15), 0 8px 16px rgba(0, 0, 0, 0.1)',
          maxWidth: 420,
          width: 'calc(100% - 40px)',
          padding: '24px',
          zIndex: 9999,
          animation: 'modalSlideIn 0.2s ease-out',
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: isDanger ? C.errorLight : C.warningLight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}
        >
          <span style={{ fontSize: 24 }}>{isDanger ? '⚠️' : '❓'}</span>
        </div>

        {/* Title */}
        <h2
          id="confirm-title"
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: C.text,
            margin: '0 0 8px 0',
          }}
        >
          {title}
        </h2>

        {/* Message */}
        <p
          id="confirm-message"
          style={{
            fontSize: 14,
            color: C.textSecondary,
            lineHeight: 1.5,
            margin: '0 0 24px 0',
            whiteSpace: 'pre-line',
          }}
        >
          {message}
        </p>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button
            ref={cancelRef}
            onClick={onCancel}
            style={{
              padding: '10px 20px',
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              color: C.textSecondary,
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = C.surfaceAlt;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = C.surface;
            }}
          >
            {cancelText}
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            style={{
              padding: '10px 20px',
              background: confirmBg,
              border: 'none',
              borderRadius: 8,
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translate(-50%, -48%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }
      `}</style>
    </>
  );
}
