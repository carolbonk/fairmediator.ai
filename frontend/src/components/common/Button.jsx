/**
 * Reusable Button Component with Neomorphic Design
 * DRY: Used by all forms
 */
export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  onClick,
  disabled = false,
  loading = false,
  fullWidth = true,
}) {
  const variantClass = variant === 'primary' ? 'form-button-primary' : 'form-button-secondary';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`form-button ${variantClass}`}
      style={{ width: fullWidth ? '100%' : 'auto' }}
    >
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <div className="spinner" />
          <span>Loading...</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
}
