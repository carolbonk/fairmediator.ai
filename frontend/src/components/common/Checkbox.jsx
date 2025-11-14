/**
 * Reusable Checkbox Component with Neomorphic Design
 * DRY: Used by forms for checkboxes
 */
export default function Checkbox({ label, name, checked, onChange, required = false }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <input
        type="checkbox"
        id={name}
        name={name}
        checked={checked}
        onChange={onChange}
        required={required}
        className="form-checkbox"
      />
      <label
        htmlFor={name}
        style={{
          fontSize: '0.875rem',
          color: '#374151',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        {label}
        {required && <span style={{ color: '#EF4444', marginLeft: '0.25rem' }}>*</span>}
      </label>
    </div>
  );
}
