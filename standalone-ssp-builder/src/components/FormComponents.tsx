/**
 * ForgeComply 360 Reporter - Form Components (Light Theme)
 * Updated with validation error display support, AI assistance, and Section 508 accessibility
 */
import React, { useState, useId } from 'react';
import { C } from '../config/colors';
import { generateSectionContent, type SystemContext } from '../services/ai';

// Input base styles
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  fontSize: 13.5,
  fontFamily: "'DM Sans', sans-serif",
  background: C.bg,
  border: `1px solid ${C.border}`,
  borderRadius: 8,
  color: C.text,
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
  boxSizing: 'border-box',
};

// Error styles
const errorBorderStyle: React.CSSProperties = {
  borderColor: C.error,
};

const errorMessageStyle: React.CSSProperties = {
  fontSize: 11,
  color: C.error,
  marginTop: 4,
  display: 'flex',
  alignItems: 'center',
  gap: 4,
};

// Label component with htmlFor support
interface LblProps {
  children: React.ReactNode;
  req?: boolean;
  htmlFor?: string;
}

export const Lbl: React.FC<LblProps> = ({ children, req, htmlFor }) => (
  <label
    htmlFor={htmlFor}
    style={{
      display: 'block',
      fontSize: 11.5,
      fontWeight: 600,
      color: C.textSecondary,
      marginBottom: 5,
      letterSpacing: '.04em',
      textTransform: 'uppercase',
    }}
  >
    {children}
    {req && <span style={{ color: C.error, marginLeft: 3 }} aria-hidden="true">*</span>}
    {req && <span className="sr-only">(required)</span>}
  </label>
);

// Form Field wrapper with error support and accessibility
interface FFProps {
  label: string;
  req?: boolean;
  hint?: string;
  span?: number;
  error?: string;
  children: React.ReactNode;
  id?: string;
}

export const FF: React.FC<FFProps> = ({ label, req, hint, span, error, children, id }) => {
  const generatedId = useId();
  const fieldId = id || generatedId;
  const errorId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;

  return (
    <div
      style={{
        gridColumn: span === 2 ? '1/-1' : undefined,
        marginBottom: 4,
      }}
    >
      <Lbl req={req} htmlFor={fieldId}>{label}</Lbl>
      {React.isValidElement(children)
        ? React.cloneElement(children as React.ReactElement<{
            id?: string;
            'aria-describedby'?: string;
            'aria-invalid'?: boolean;
            'aria-required'?: boolean;
          }>, {
            id: fieldId,
            'aria-describedby': error ? errorId : hint ? hintId : undefined,
            'aria-invalid': !!error,
            'aria-required': req,
          })
        : children}
      {error && (
        <div id={errorId} role="alert" style={errorMessageStyle}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.error} strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}
      {hint && !error && (
        <div
          id={hintId}
          style={{
            fontSize: 11,
            color: C.textMuted,
            marginTop: 4,
            lineHeight: 1.4,
          }}
        >
          {hint}
        </div>
      )}
    </div>
  );
};

// Text Input with accessibility support
interface TIProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  mono?: boolean;
  error?: boolean;
  id?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  'aria-required'?: boolean;
  'aria-label'?: string;
}

export const TI: React.FC<TIProps> = ({
  value,
  onChange,
  placeholder,
  mono,
  error,
  id,
  'aria-describedby': ariaDescribedby,
  'aria-invalid': ariaInvalid,
  'aria-required': ariaRequired,
  'aria-label': ariaLabel,
}) => (
  <input
    type="text"
    id={id}
    value={value || ''}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    aria-describedby={ariaDescribedby}
    aria-invalid={ariaInvalid || !!error}
    aria-required={ariaRequired}
    aria-label={ariaLabel}
    style={{
      ...inputStyle,
      fontFamily: mono ? "'Fira Code', monospace" : inputStyle.fontFamily,
      ...(error ? errorBorderStyle : {}),
    }}
    onFocus={(e) => {
      if (!error) {
        e.target.style.borderColor = C.primary;
        e.target.style.boxShadow = `0 0 0 3px ${C.primary}15`;
      }
    }}
    onBlur={(e) => {
      e.target.style.borderColor = error ? C.error : C.border;
      e.target.style.boxShadow = 'none';
    }}
  />
);

// Text Area with accessibility support
interface TAProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  error?: boolean;
  id?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  'aria-required'?: boolean;
  'aria-label'?: string;
}

export const TA: React.FC<TAProps> = ({
  value,
  onChange,
  placeholder,
  rows = 4,
  error,
  id,
  'aria-describedby': ariaDescribedby,
  'aria-invalid': ariaInvalid,
  'aria-required': ariaRequired,
  'aria-label': ariaLabel,
}) => (
  <textarea
    id={id}
    value={value || ''}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    rows={rows}
    aria-describedby={ariaDescribedby}
    aria-invalid={ariaInvalid || !!error}
    aria-required={ariaRequired}
    aria-label={ariaLabel}
    style={{
      ...inputStyle,
      resize: 'vertical',
      lineHeight: 1.6,
      ...(error ? errorBorderStyle : {}),
    }}
    onFocus={(e) => {
      if (!error) {
        e.target.style.borderColor = C.primary;
        e.target.style.boxShadow = `0 0 0 3px ${C.primary}15`;
      }
    }}
    onBlur={(e) => {
      e.target.style.borderColor = error ? C.error : C.border;
      e.target.style.boxShadow = 'none';
    }}
  />
);

// Text Area with AI Assistance and accessibility
interface TAAIProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  error?: boolean;
  sectionKey: string;
  sectionLabel: string;
  systemContext: SystemContext;
  id?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  'aria-required'?: boolean;
}

export const TAAI: React.FC<TAAIProps> = ({
  value,
  onChange,
  placeholder,
  rows = 4,
  error,
  sectionKey,
  sectionLabel,
  systemContext,
  id,
  'aria-describedby': ariaDescribedby,
  'aria-invalid': ariaInvalid,
  'aria-required': ariaRequired,
}) => {
  const [status, setStatus] = useState<'idle' | 'generating'>('idle');
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const hasContent = !!value && value.trim().length > 0;
  const menuId = useId();

  const handleGenerate = async (mode: 'generate' | 'refine' | 'expand') => {
    setShowMenu(false);
    setStatus('generating');
    try {
      const response = await generateSectionContent({
        sectionKey,
        sectionLabel,
        currentContent: value,
        systemContext,
        mode,
      });
      setPreviewContent(response.content);
      setShowPreview(true);
    } catch (e) {
      console.error('AI generation failed:', e);
    } finally {
      setStatus('idle');
    }
  };

  const handleAccept = () => {
    onChange(previewContent);
    setShowPreview(false);
    setPreviewContent('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && showMenu) {
      setShowMenu(false);
    }
  };

  return (
    <div style={{ position: 'relative' }} onKeyDown={handleKeyDown}>
      {/* AI Button */}
      <div style={{
        position: 'absolute',
        top: -28,
        right: 0,
        zIndex: 10,
      }}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          disabled={status === 'generating'}
          aria-expanded={showMenu}
          aria-haspopup="menu"
          aria-controls={showMenu ? menuId : undefined}
          aria-label={status === 'generating' ? 'AI generating content' : 'AI Writing Assistant'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 8px',
            background: status === 'generating' ? C.surface : `linear-gradient(135deg, #8b5cf6, #6366f1)`,
            border: 'none',
            borderRadius: 4,
            color: '#fff',
            fontSize: 10,
            fontWeight: 600,
            cursor: status === 'generating' ? 'wait' : 'pointer',
          }}
        >
          {status === 'generating' ? (
            <><span style={{ animation: 'spin 1s linear infinite' }} aria-hidden="true">⟳</span> Generating...</>
          ) : (
            <><span aria-hidden="true">✨</span> ForgeML</>
          )}
        </button>

        {/* Dropdown Menu */}
        {showMenu && status !== 'generating' && (
          <>
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 99,
              }}
              onClick={() => setShowMenu(false)}
              aria-hidden="true"
            />
            <div
              id={menuId}
              role="menu"
              aria-label="AI writing options"
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: 4,
                background: C.bg,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                minWidth: 160,
                zIndex: 100,
                overflow: 'hidden',
              }}
            >
              <button
                role="menuitem"
                onClick={() => handleGenerate('generate')}
                aria-label={hasContent ? 'Regenerate content with AI' : 'Generate content with AI'}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: 'none',
                  border: 'none',
                  borderBottom: `1px solid ${C.border}`,
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 14 }} aria-hidden="true">✨</span>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.text }}>
                    {hasContent ? 'Regenerate' : 'Generate'}
                  </div>
                  <div style={{ fontSize: 9, color: C.textMuted }}>AI-write this section</div>
                </div>
              </button>

              {hasContent && (
                <>
                  <button
                    role="menuitem"
                    onClick={() => handleGenerate('refine')}
                    aria-label="Refine content for clarity"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'none',
                      border: 'none',
                      borderBottom: `1px solid ${C.border}`,
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <span style={{ fontSize: 14 }} aria-hidden="true">🔄</span>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: C.text }}>Refine</div>
                      <div style={{ fontSize: 9, color: C.textMuted }}>Improve clarity</div>
                    </div>
                  </button>

                  <button
                    role="menuitem"
                    onClick={() => handleGenerate('expand')}
                    aria-label="Expand content with more detail"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'none',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <span style={{ fontSize: 14 }} aria-hidden="true">📝</span>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: C.text }}>Expand</div>
                      <div style={{ fontSize: 9, color: C.textMuted }}>Add more detail</div>
                    </div>
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Textarea */}
      <textarea
        id={id}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        aria-describedby={ariaDescribedby}
        aria-invalid={ariaInvalid || !!error}
        aria-required={ariaRequired}
        style={{
          ...inputStyle,
          resize: 'vertical',
          lineHeight: 1.6,
          ...(error ? errorBorderStyle : {}),
        }}
        onFocus={(e) => {
          if (!error) {
            e.target.style.borderColor = C.primary;
            e.target.style.boxShadow = `0 0 0 3px ${C.primary}15`;
          }
        }}
        onBlur={(e) => {
          e.target.style.borderColor = error ? C.error : C.border;
          e.target.style.boxShadow = 'none';
        }}
      />

      {/* AI Preview Modal */}
      {showPreview && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="ai-preview-title"
          aria-describedby="ai-preview-desc"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setShowPreview(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setShowPreview(false);
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: C.bg,
              borderRadius: 12,
              width: '90%',
              maxWidth: 700,
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 24px 64px rgba(0, 0, 0, 0.2)',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: `1px solid ${C.border}`,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span style={{ fontSize: 20 }} aria-hidden="true">✨</span>
              <div>
                <div id="ai-preview-title" style={{ fontSize: 15, fontWeight: 700, color: C.text }}>
                  AI-Generated Content
                </div>
                <div id="ai-preview-desc" style={{ fontSize: 11, color: C.textMuted }}>
                  Review and accept or dismiss
                </div>
              </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
              <div
                style={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  padding: 20,
                  fontSize: 13,
                  lineHeight: 1.7,
                  color: C.text,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {previewContent}
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                padding: '14px 20px',
                borderTop: `1px solid ${C.border}`,
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 10,
              }}
            >
              <button
                onClick={() => setShowPreview(false)}
                style={{
                  padding: '8px 16px',
                  background: 'none',
                  border: `1px solid ${C.border}`,
                  borderRadius: 6,
                  color: C.textSecondary,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Dismiss
              </button>
              <button
                onClick={handleAccept}
                style={{
                  padding: '8px 16px',
                  background: `linear-gradient(135deg, #8b5cf6, #6366f1)`,
                  border: 'none',
                  borderRadius: 6,
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span aria-hidden="true">✓</span>
                Accept & Use
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Select with accessibility support
interface SelectOption {
  v: string;
  l: string;
}

interface SelProps {
  value?: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  ph?: string;
  error?: boolean;
  id?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  'aria-required'?: boolean;
  'aria-label'?: string;
}

export const Sel: React.FC<SelProps> = ({
  value,
  onChange,
  options,
  ph,
  error,
  id,
  'aria-describedby': ariaDescribedby,
  'aria-invalid': ariaInvalid,
  'aria-required': ariaRequired,
  'aria-label': ariaLabel,
}) => (
  <select
    id={id}
    value={value || ''}
    onChange={(e) => onChange(e.target.value)}
    aria-describedby={ariaDescribedby}
    aria-invalid={ariaInvalid || !!error}
    aria-required={ariaRequired}
    aria-label={ariaLabel}
    style={{
      ...inputStyle,
      color: value ? C.text : C.textMuted,
      cursor: 'pointer',
      appearance: 'none',
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'right 12px center',
      paddingRight: 36,
      ...(error ? errorBorderStyle : {}),
    }}
  >
    {ph && <option value="">{ph}</option>}
    {options.map((o) => (
      <option key={o.v} value={o.v}>{o.l}</option>
    ))}
  </select>
);

// Checkbox using native input for accessibility
interface ChkProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  id?: string;
}

export const Chk: React.FC<ChkProps> = ({ checked, onChange, label, id }) => (
  <label
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      cursor: 'pointer',
      fontSize: 13,
      color: C.text,
    }}
  >
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      style={{
        width: 18,
        height: 18,
        cursor: 'pointer',
        accentColor: C.primary,
        margin: 0,
      }}
    />
    {label}
  </label>
);

// Grid layouts
export const G2: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: 16,
};

export const G3: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: 16,
};

// Section Header with proper heading semantics
interface SHProps {
  title: string;
  sub?: string;
}

export const SH: React.FC<SHProps> = ({ title, sub }) => (
  <div style={{ marginBottom: 22 }}>
    <h3 style={{
      margin: 0,
      fontSize: 18,
      fontWeight: 700,
      color: C.text,
      fontFamily: "'Playfair Display', serif",
    }}>
      {title}
    </h3>
    {sub && (
      <p style={{
        margin: '5px 0 0',
        fontSize: 12.5,
        color: C.textMuted,
        lineHeight: 1.5,
      }}>
        {sub}
      </p>
    )}
  </div>
);

// Divider with accessibility
export const Div: React.FC = () => (
  <hr
    style={{
      borderTop: `1px solid ${C.border}`,
      borderBottom: 'none',
      borderLeft: 'none',
      borderRight: 'none',
      margin: '22px 0',
    }}
    aria-hidden="true"
  />
);

// Sub Header with proper heading semantics
interface SubHProps {
  children: React.ReactNode;
}

export const SubH: React.FC<SubHProps> = ({ children }) => (
  <h4 style={{
    margin: '0 0 10px',
    fontSize: 14,
    fontWeight: 700,
    color: C.primary,
  }}>
    {children}
  </h4>
);

// Upload Zone with accessibility
interface UploadZoneProps {
  icon: string;
  title: string;
  sub: string;
  onUpload?: (file: File) => void;
  previewUrl?: string;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ icon, title, sub, onUpload, previewUrl }) => {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const inputId = useId();
  const descId = useId();

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpload) {
      onUpload(file);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div style={{
      background: C.surface,
      borderRadius: 10,
      padding: 22,
      margin: '18px 0',
      border: `1px dashed ${C.borderDark}`,
      textAlign: 'center',
      minHeight: 120,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {previewUrl ? (
        <img
          src={previewUrl}
          alt="Uploaded file preview"
          style={{
            maxWidth: '100%',
            maxHeight: 200,
            borderRadius: 6,
            marginBottom: 10,
          }}
        />
      ) : (
        <>
          <div style={{ fontSize: 28, marginBottom: 6 }} aria-hidden="true">{icon}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.textSecondary }}>{title}</div>
          <div id={descId} style={{ fontSize: 11, color: C.textMuted, marginTop: 4, maxWidth: 400 }}>{sub}</div>
        </>
      )}
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/*"
        onChange={handleChange}
        aria-describedby={descId}
        className="sr-only"
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      />
      <button
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        aria-describedby={descId}
        style={{
          marginTop: 14,
          padding: '7px 18px',
          background: C.primary,
          color: '#fff',
          border: 'none',
          borderRadius: 7,
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        {previewUrl ? 'Replace File' : 'Upload File'}
      </button>
    </div>
  );
};

// Validation Error Summary Banner with accessibility
interface ValidationBannerProps {
  errorCount: number;
  onShowErrors: () => void;
}

export const ValidationBanner: React.FC<ValidationBannerProps> = ({ errorCount, onShowErrors }) => {
  if (errorCount === 0) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        background: `${C.error}10`,
        border: `1px solid ${C.error}30`,
        borderRadius: 8,
        padding: '12px 16px',
        marginBottom: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.error} strokeWidth="2" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span style={{ fontSize: 13, color: C.error, fontWeight: 500 }}>
          {errorCount} required field{errorCount > 1 ? 's' : ''} missing
        </span>
      </div>
      <button
        onClick={onShowErrors}
        aria-label={`View ${errorCount} validation error${errorCount > 1 ? 's' : ''}`}
        style={{
          background: 'none',
          border: `1px solid ${C.error}40`,
          borderRadius: 6,
          padding: '5px 12px',
          fontSize: 11,
          color: C.error,
          cursor: 'pointer',
          fontWeight: 600,
        }}
      >
        View All
      </button>
    </div>
  );
};
