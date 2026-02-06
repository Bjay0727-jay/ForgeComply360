import React, { useState } from 'react';

interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'date' | 'textarea' | 'select';
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  validate?: (value: string) => string | null;
  helpText?: string;
  placeholder?: string;
  showValidation?: boolean;
  children?: React.ReactNode;
  min?: number;
  max?: number;
  rows?: number;
  className?: string;
}

export function FormField({
  label, name, type = 'text', value, onChange, required, validate,
  helpText, placeholder, showValidation, children, min, max, rows = 3, className,
}: FormFieldProps) {
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shouldValidate = showValidation || touched;

  const runValidation = (val: string) => {
    if (required && !val.trim()) {
      setError(`${label} is required`);
      return;
    }
    if (validate) {
      setError(validate(val));
      return;
    }
    setError(null);
  };

  const handleBlur = () => {
    setTouched(true);
    runValidation(value);
  };

  const handleChange = (val: string) => {
    onChange(val);
    if (touched) runValidation(val);
  };

  const isValid = shouldValidate && !error && value.trim() !== '';
  const isInvalid = shouldValidate && error !== null;

  const borderClass = isInvalid
    ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
    : isValid
    ? 'border-green-500 focus:ring-green-500 focus:border-green-500'
    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500';

  const inputClass = `w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 min-h-[44px] ${borderClass} ${type !== 'select' && shouldValidate ? 'pr-10' : ''}`;

  return (
    <div className={className || 'mb-3'}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <div className="relative">
        {type === 'textarea' ? (
          <textarea
            id={name}
            name={name}
            value={value}
            onChange={e => handleChange(e.target.value)}
            onBlur={handleBlur}
            placeholder={placeholder}
            rows={rows}
            className={inputClass}
            aria-invalid={isInvalid || undefined}
            aria-required={required || undefined}
            aria-describedby={isInvalid && error ? `${name}-error` : undefined}
          />
        ) : type === 'select' ? (
          <select
            id={name}
            name={name}
            value={value}
            onChange={e => handleChange(e.target.value)}
            onBlur={handleBlur}
            className={inputClass}
            aria-invalid={isInvalid || undefined}
            aria-required={required || undefined}
            aria-describedby={isInvalid && error ? `${name}-error` : undefined}
          >
            {children}
          </select>
        ) : (
          <input
            id={name}
            name={name}
            type={type}
            value={value}
            onChange={e => handleChange(e.target.value)}
            onBlur={handleBlur}
            placeholder={placeholder}
            min={min}
            max={max}
            className={inputClass}
            aria-invalid={isInvalid || undefined}
            aria-required={required || undefined}
            aria-describedby={isInvalid && error ? `${name}-error` : undefined}
          />
        )}

        {/* Validation icon */}
        {shouldValidate && type !== 'select' && type !== 'textarea' && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isValid && (
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            {isInvalid && (
              <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
        )}
      </div>

      {helpText && !isInvalid && (
        <p className="text-xs text-gray-500 mt-1">{helpText}</p>
      )}
      {isInvalid && error && (
        <p className="text-xs text-red-600 mt-1" id={`${name}-error`}>{error}</p>
      )}
    </div>
  );
}
