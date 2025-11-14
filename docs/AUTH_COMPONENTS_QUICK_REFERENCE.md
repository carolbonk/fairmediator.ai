# Authentication Components - Quick Reference

This document provides a quick reference for implementing authentication components in FairMediator. For detailed specifications, see [AUTH_COMPONENTS_DESIGN.md](/docs/AUTH_COMPONENTS_DESIGN.md).

---

## Color Palette Quick Reference

```css
/* Base */
--neu-100: #F0F2F5;        /* Primary background */
--neu-800: #1F2937;        /* Primary text */
--neu-500: #6B7280;        /* Secondary text */
--neu-400: #9CA3AF;        /* Disabled/placeholder */

/* Primary CTA */
--liberal-gradient: linear-gradient(to bottom right, #5B9FD8, #3A7AB5);

/* Semantic Colors */
--success-bg: #D1FAE5;
--success-text: #065F46;
--error-bg: #FEE2E2;
--error-text: #991B1B;
--warning-bg: #FEF3C7;
--warning-text: #78350F;
```

---

## Shadow System Quick Reference

```css
/* Raised elements (buttons, cards) */
--shadow-neu: 8px 8px 16px rgba(163, 177, 198, 0.6),
              -8px -8px 16px rgba(255, 255, 255, 0.5);

/* Enhanced on hover */
--shadow-neu-lg: 12px 12px 24px rgba(163, 177, 198, 0.6),
                 -12px -12px 24px rgba(255, 255, 255, 0.5);

/* Pressed/inset elements (inputs) */
--shadow-neu-inset: inset 4px 4px 8px rgba(163, 177, 198, 0.5),
                    inset -4px -4px 8px rgba(255, 255, 255, 0.5);

/* Floating elements (modals) */
--shadow-neu-xl: 20px 20px 40px rgba(163, 177, 198, 0.6),
                 -20px -20px 40px rgba(255, 255, 255, 0.5);
```

---

## Component Class Reference

### Form Container
```jsx
<form className="bg-neu-100 rounded-neu-lg p-10 max-w-md shadow-neu-lg">
```

### Text Input
```jsx
<input
  type="text"
  className="w-full px-5 py-3.5 rounded-neu-sm bg-neu-100 text-neu-800 shadow-neu-inset focus:shadow-neu-inset-sm focus:outline focus:outline-2 focus:outline-liberal-light focus:outline-offset-2"
/>
```

### Primary Button
```jsx
<button
  type="submit"
  className="w-full px-6 py-3.5 rounded-neu bg-gradient-to-br from-liberal-light to-liberal-dark text-white font-semibold uppercase tracking-wide shadow-neu hover:shadow-neu-lg active:shadow-neu-inset transition-all duration-200"
>
  Sign In
</button>
```

### Secondary Button
```jsx
<button
  type="button"
  className="w-full px-6 py-3 rounded-neu bg-neu-100 text-neu-700 font-medium shadow-neu hover:shadow-neu-lg active:shadow-neu-inset transition-all duration-200"
>
  Cancel
</button>
```

### Checkbox
```jsx
<input
  type="checkbox"
  className="w-5 h-5 rounded-md bg-neu-100 shadow-neu-inset checked:bg-gradient-to-br checked:from-liberal-light checked:to-liberal-dark checked:shadow-neu cursor-pointer"
/>
```

### Error Message
```jsx
<div className="flex items-start gap-3 p-4 rounded-xl bg-error-bg border-l-4 border-red-500 shadow-neu-inset-sm">
  <span className="text-red-600">⚠</span>
  <p className="text-sm text-error-text">Error message here</p>
</div>
```

### Success Message
```jsx
<div className="flex items-center gap-3 p-4 rounded-xl bg-success-bg shadow-neu-inset-sm">
  <span className="text-green-500">✓</span>
  <p className="text-sm text-success-text">Success message here</p>
</div>
```

---

## Component Sizing

| Element | Padding | Border Radius | Font Size |
|---------|---------|---------------|-----------|
| Form Container | 2.5rem (40px) | 1.75rem (28px) | - |
| Text Input | 0.875rem 1.25rem (14px 20px) | 0.75rem (12px) | 1rem (16px) |
| Button Primary | 0.875rem 1.5rem (14px 24px) | 1rem (16px) | 0.875rem (14px) |
| Button Secondary | 0.75rem 1.5rem (12px 24px) | 1rem (16px) | 0.875rem (14px) |
| Label | - | - | 0.75rem (12px) |
| Error Text | - | - | 0.75rem (12px) |
| Helper Text | - | - | 0.75rem (12px) |

---

## State Variations

### Input States
```css
/* Default */
.input-default {
  box-shadow: inset 4px 4px 8px rgba(163, 177, 198, 0.5),
              inset -4px -4px 8px rgba(255, 255, 255, 0.5);
}

/* Focus */
.input-focus {
  box-shadow: inset 2px 2px 5px rgba(163, 177, 198, 0.4),
              inset -2px -2px 5px rgba(255, 255, 255, 0.4);
  outline: 2px solid rgba(91, 159, 216, 0.3);
  outline-offset: 2px;
}

/* Error */
.input-error {
  box-shadow: inset 4px 4px 8px rgba(239, 68, 68, 0.3),
              inset -4px -4px 8px rgba(254, 202, 202, 0.3);
  outline: 1px solid #F87171;
}

/* Disabled */
.input-disabled {
  background: #E4E7EB;
  color: #9CA3AF;
  opacity: 0.6;
  cursor: not-allowed;
}
```

### Button States
```css
/* Default */
.button-default {
  box-shadow: 8px 8px 16px rgba(163, 177, 198, 0.6),
              -8px -8px 16px rgba(255, 255, 255, 0.5);
}

/* Hover */
.button-hover {
  box-shadow: 12px 12px 24px rgba(163, 177, 198, 0.6),
              -12px -12px 24px rgba(255, 255, 255, 0.5);
  transform: translateY(-1px);
}

/* Active */
.button-active {
  box-shadow: inset 4px 4px 8px rgba(58, 122, 181, 0.4),
              inset -2px -2px 6px rgba(91, 159, 216, 0.2);
  transform: translateY(0px);
}

/* Disabled */
.button-disabled {
  background: #E4E7EB;
  color: #9CA3AF;
  opacity: 0.6;
  cursor: not-allowed;
  box-shadow: inset 2px 2px 4px rgba(163, 177, 198, 0.3),
              inset -2px -2px 4px rgba(255, 255, 255, 0.3);
}

/* Loading */
.button-loading {
  color: transparent;
  cursor: wait;
  position: relative;
}

.button-loading::after {
  content: '';
  position: absolute;
  width: 1rem;
  height: 1rem;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #FFFFFF;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: translate(-50%, -50%) rotate(360deg); }
}
```

---

## Responsive Breakpoints

```css
/* Mobile: Default (320px - 639px) */
.auth-form {
  padding: 1.5rem;
  max-width: 100%;
  margin: 1rem;
}

/* Tablet: 640px - 1023px */
@media (min-width: 640px) {
  .auth-form {
    padding: 2rem;
    max-width: 26rem;
  }
}

/* Desktop: 1024px+ */
@media (min-width: 1024px) {
  .auth-form {
    padding: 2.5rem;
    max-width: 28rem;
  }
}
```

---

## Accessibility Checklist

- [ ] All text meets WCAG AA contrast (4.5:1 minimum)
- [ ] Focus states visible for keyboard navigation
- [ ] All inputs have associated labels
- [ ] Error messages use `role="alert"` and `aria-live="polite"`
- [ ] Required fields marked with `aria-required="true"`
- [ ] Invalid fields marked with `aria-invalid="true"`
- [ ] Loading states use `aria-busy="true"`
- [ ] All buttons have descriptive text or `aria-label`
- [ ] Form can be completed with keyboard only (Tab, Enter, Space)
- [ ] Modal focus is trapped within dialog
- [ ] Modal close button is first focusable element
- [ ] Touch targets are minimum 44x44px
- [ ] Component works in high contrast mode
- [ ] Animations respect `prefers-reduced-motion`

---

## Common Patterns

### Form Field Group
```jsx
<div className="mb-6">
  <label
    htmlFor="email"
    className="block text-xs font-semibold text-neu-700 uppercase tracking-wide mb-2"
  >
    Email Address
  </label>
  <input
    id="email"
    type="email"
    className="input-neu"
    aria-required="true"
    aria-invalid={hasError}
    aria-describedby="email-error"
  />
  {error && (
    <span
      id="email-error"
      className="flex items-center gap-2 mt-2 text-xs font-medium text-error-text"
      role="alert"
    >
      <span>⚠</span>
      {error}
    </span>
  )}
</div>
```

### Password with Toggle
```jsx
<div className="relative mb-6">
  <label htmlFor="password" className="block text-xs font-semibold text-neu-700 uppercase tracking-wide mb-2">
    Password
  </label>
  <input
    id="password"
    type={showPassword ? 'text' : 'password'}
    className="input-neu pr-12"
    aria-required="true"
  />
  <button
    type="button"
    onClick={() => setShowPassword(!showPassword)}
    className="absolute right-4 top-[2.75rem] transform -translate-y-1/2 p-2 rounded-lg hover:bg-neu-200 transition-colors"
    aria-label={showPassword ? 'Hide password' : 'Show password'}
    aria-pressed={showPassword}
  >
    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
  </button>
</div>
```

### Progress Indicator
```jsx
<div className="mb-6">
  <div className="flex justify-between items-center text-xs text-neu-500 mb-2">
    <span>Password Strength</span>
    <span className={`font-semibold ${strengthColor}`}>{strengthLabel}</span>
  </div>
  <div className="w-full h-2 rounded-full bg-neu-200 shadow-neu-inset overflow-hidden">
    <div
      className={`h-full rounded-full transition-all duration-300 ${strengthGradient}`}
      style={{ width: `${strengthPercent}%` }}
    />
  </div>
</div>
```

### Loading Button
```jsx
<button
  type="submit"
  disabled={loading}
  className="btn-neu-primary"
  aria-busy={loading}
>
  {loading ? (
    <>
      <span className="opacity-0">Sign In</span>
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="spinner" />
      </span>
    </>
  ) : (
    'Sign In'
  )}
</button>
```

### Modal with Focus Trap
```jsx
<div
  className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50"
  onClick={handleOverlayClick}
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
>
  <div
    className="bg-neu-100 rounded-neu-lg p-10 max-w-lg w-full shadow-neu-xl relative"
    onClick={(e) => e.stopPropagation()}
  >
    <button
      type="button"
      onClick={onClose}
      className="absolute top-6 right-6 w-10 h-10 rounded-full bg-neu-100 shadow-neu hover:shadow-neu-lg active:shadow-neu-inset transition-all flex items-center justify-center text-neu-500 hover:text-neu-700"
      aria-label="Close modal"
    >
      ×
    </button>

    <h2 id="modal-title" className="text-3xl font-bold text-neu-800 mb-4">
      Modal Title
    </h2>

    {/* Modal content */}
  </div>
</div>
```

---

## Typography Scale

```css
/* Form titles */
--text-form-title: 1.875rem (30px) / 700 / -0.002em / neu-800

/* Form subtitles */
--text-form-subtitle: 1rem (16px) / 400 / 0.005em / neu-500

/* Input labels */
--text-label: 0.75rem (12px) / 600 / 0.006em / neu-700 / uppercase

/* Input text */
--text-input: 1rem (16px) / 400 / 0.005em / neu-800

/* Button text */
--text-button: 0.875rem (14px) / 600 / 0.006em / uppercase

/* Helper text */
--text-helper: 0.75rem (12px) / 400 / 0.006em / neu-500

/* Error text */
--text-error: 0.75rem (12px) / 500 / 0.006em / error-text

/* Link text */
--text-link: 0.875rem (14px) / 500 / 0.006em / liberal-DEFAULT
```

---

## Icon Sizes

```css
/* Form field icons (inside inputs) */
--icon-input: 1rem (16px)

/* Status icons (checkmarks, warnings) */
--icon-status: 1.25rem (20px)

/* Modal/card icons (decorative) */
--icon-decorative: 2rem (32px)

/* Large feature icons */
--icon-feature: 4rem (64px)
```

---

## Animation Timing

```css
/* Quick state changes */
--duration-fast: 150ms

/* Standard transitions */
--duration-base: 200ms

/* Smooth animations */
--duration-smooth: 300ms

/* Entrance animations */
--duration-slow: 400ms

/* Timing function */
--ease-neu: cubic-bezier(0.4, 0, 0.2, 1)
```

---

## Usage Examples

### Complete LoginForm Structure
```jsx
<div className="min-h-screen flex items-center justify-center bg-neu-100 p-4">
  <form className="w-full max-w-md bg-neu-100 rounded-neu-lg p-10 shadow-neu-lg">
    <header className="mb-8">
      <h2 className="text-3xl font-bold text-neu-800 mb-2">Welcome Back</h2>
      <p className="text-base text-neu-500">Sign in to your account</p>
    </header>

    {/* Form fields */}
    <div className="space-y-6">
      {/* Email field */}
      {/* Password field */}
      {/* Remember me checkbox */}
      {/* Forgot password link */}
    </div>

    <button type="submit" className="w-full mt-6 btn-neu-primary">
      Sign In
    </button>

    <footer className="mt-6 pt-6 border-t border-neu-300 text-center">
      <p className="text-sm text-neu-500">
        Don't have an account?{' '}
        <a href="/register" className="text-liberal-DEFAULT font-semibold hover:text-liberal-dark hover:underline">
          Sign up
        </a>
      </p>
    </footer>
  </form>
</div>
```

### Complete SubscriptionCard Structure
```jsx
<div className="w-full max-w-sm bg-neu-100 rounded-neu-lg p-8 shadow-neu hover:shadow-neu-lg transition-all">
  {/* Badge */}
  <div className="inline-block px-4 py-2 rounded-full bg-gradient-to-br from-neu-300 to-neu-400 text-neu-800 text-xs font-bold uppercase tracking-wider shadow-neu-sm mb-4">
    Free
  </div>

  {/* Title */}
  <h3 className="text-2xl font-bold text-neu-800 mb-2">Basic Plan</h3>

  {/* Pricing */}
  <div className="flex items-baseline gap-1 mb-6">
    <span className="text-xl font-bold text-neu-500">$</span>
    <span className="text-4xl font-extrabold text-neu-800">0</span>
    <span className="text-base text-neu-500 font-medium">/month</span>
  </div>

  {/* Features */}
  <ul className="space-y-3 mb-8">
    <li className="flex items-start gap-3 p-3 rounded-xl bg-neu-50 shadow-neu-inset-sm">
      <span className="text-green-500 font-bold">✓</span>
      <span className="text-sm text-neu-700">5 searches per day</span>
    </li>
    {/* More features */}
  </ul>

  {/* CTA */}
  <button className="w-full btn-neu-primary">
    Upgrade Now
  </button>
</div>
```

---

## Common Mistakes to Avoid

1. **Insufficient contrast**: Always test with WCAG tools
2. **Missing focus states**: Every interactive element needs visible focus
3. **Inconsistent spacing**: Stick to the design system scale
4. **Over-nesting shadows**: Keep shadow layers to 2-3 maximum
5. **Forgetting disabled states**: All buttons/inputs need disabled styling
6. **Skipping loading states**: Users need feedback on async operations
7. **Missing error recovery**: Provide clear actions when errors occur
8. **Ignoring mobile**: Test on real devices, not just browser devtools
9. **Hard-coding sizes**: Use relative units (rem) for scalability
10. **Neglecting keyboard nav**: Tab order and focus trap are critical

---

## Resources

- **Full Specification**: [AUTH_COMPONENTS_DESIGN.md](/docs/AUTH_COMPONENTS_DESIGN.md)
- **Design System**: [DESIGN_SYSTEM.md](/docs/DESIGN_SYSTEM.md)
- **Neomorphism Guide**: [NEUMORPHISM_FREE_DESIGN.md](/docs/NEUMORPHISM_FREE_DESIGN.md)
- **Tailwind Config**: `/frontend/tailwind.config.js`
- **Custom CSS**: `/frontend/src/index.css`
- **Component Examples**: `/frontend/src/components/`

---

**Last Updated:** 2025-11-14
**Version:** 1.0
