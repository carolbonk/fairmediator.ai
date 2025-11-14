import { useState } from 'react';

/**
 * Reusable TextField Component with Neomorphic Design
 * DRY: Used by LoginForm, RegisterForm, and other forms
 */
export default function TextField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  disabled = false,
  autoComplete,
  required = false,
  showPasswordToggle = false,
}) {
  const [showPassword, setShowPassword] = useState(false);

  const inputType = showPasswordToggle && showPassword ? 'text' : type;

  return (
    <div className="form-field">
      {label && (
        <label htmlFor={name} className="form-label">
          {label}
          {required && <span style={{ color: '#EF4444', marginLeft: '0.25rem' }}>*</span>}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        <input
          id={name}
          name={name}
          type={inputType}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          required={required}
          className={`form-input ${error ? 'form-input-error' : ''}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : undefined}
        />
        {showPasswordToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: 'absolute',
              right: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#6B7280',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        )}
      </div>
      {error && (
        <div id={`${name}-error`} className="form-error" role="alert">
          <span>⚠</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
