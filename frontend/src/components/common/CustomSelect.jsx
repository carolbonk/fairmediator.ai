import { useState, useRef, useEffect } from 'react';

/**
 * CustomSelect — replaces native <select> with the same panel-dropdown pattern
 * used by the MediatorList State filter.
 *
 * Props:
 *   id          — links to a <label htmlFor>
 *   value       — currently selected value string
 *   onChange    — (value: string) => void  (just the value, not an event)
 *   options     — string[] | { value: string; label: string }[]
 *   placeholder — text shown when nothing is selected
 *   disabled    — boolean
 *   error       — boolean (shows red border on neu variant)
 *   variant     — 'neu' (default) | 'gray'  controls trigger background style
 */
const CustomSelect = ({
  id,
  value,
  onChange,
  options = [],
  placeholder = 'Select...',
  disabled = false,
  error = false,
  variant = 'neu',
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  // Normalize options to { value, label }
  const normalizedOptions = options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  const selectedLabel =
    normalizedOptions.find((o) => o.value === value)?.label ?? null;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const triggerBase =
    'w-full flex items-center justify-between text-left text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500';

  const triggerVariant =
    variant === 'gray'
      ? 'px-4 py-3 bg-gray-100 rounded-xl shadow-neumorphic-inset text-gray-800'
      : `px-4 py-3 bg-neu-100 rounded-xl shadow-neu-inset min-h-[44px] text-neu-800 border ${
          error ? 'border-red-500' : 'border-neu-300'
        }`;

  const triggerDisabled = disabled ? ' opacity-50 cursor-not-allowed' : ' cursor-pointer';

  const placeholderColor = variant === 'gray' ? 'text-gray-400' : 'text-neu-500';
  const chevronColor = variant === 'gray' ? 'text-gray-500' : 'text-neu-500';

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        id={id}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        className={`${triggerBase} ${triggerVariant}${triggerDisabled}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-invalid={error ? 'true' : 'false'}
        disabled={disabled}
      >
        <span className={selectedLabel === null ? placeholderColor : ''}>
          {selectedLabel ?? placeholder}
        </span>
        <svg
          className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${chevronColor} ${
            open ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />

          {/* Dropdown panel */}
          <div
            className="absolute top-full mt-1 left-0 w-full max-h-64 overflow-y-auto bg-neu-100 rounded-xl shadow-neu-lg border border-neu-200 z-20 animate-fade-in"
            role="listbox"
          >
            {normalizedOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={opt.value === value}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-all ${
                  opt.value === value
                    ? 'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-800 shadow-neu-inset'
                    : 'text-neu-700 hover:bg-neu-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default CustomSelect;
