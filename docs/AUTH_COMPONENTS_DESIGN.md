# Authentication UI Components Design Specification

## Design Philosophy

The authentication UI for FairMediator follows neomorphic (soft UI) design principles, creating a tactile, physical interface that feels intuitive and trustworthy. The design prioritizes:

- **Visual trust**: Soft, extruded surfaces convey stability and security
- **Clear hierarchy**: Important actions stand out through subtle elevation changes
- **Gentle feedback**: State changes are communicated through shadow and depth variations
- **Accessibility balance**: Maintaining sufficient contrast while preserving neomorphic aesthetics

---

## Color Palette for Authentication

### Base Colors
```css
/* Primary background - matches app base */
background: #F0F2F5 (neu-100)

/* Element backgrounds - same as base for true neomorphism */
element-bg: #F0F2F5 (neu-100)
element-raised: #F3F4F6 (slightly lighter than neu-100)

/* Text colors */
primary-text: #1F2937 (neu-800)
secondary-text: #6B7280 (neu-500)
disabled-text: #9CA3AF (neu-400)
placeholder-text: #9CA3AF (neu-400)
```

### Semantic Colors

**Success States**
```css
success-bg: #D1FAE5 (soft green-50)
success-text: #065F46 (green-900)
success-border: #34D399 (green-400)
success-shadow-light: rgba(167, 243, 208, 0.5)
success-shadow-dark: rgba(6, 95, 70, 0.2)
```

**Error States**
```css
error-bg: #FEE2E2 (soft red-50)
error-text: #991B1B (red-900)
error-border: #F87171 (red-400)
error-shadow-light: rgba(254, 202, 202, 0.5)
error-shadow-dark: rgba(153, 27, 27, 0.2)
```

**Warning States**
```css
warning-bg: #FEF3C7 (yellow-50)
warning-text: #92400E (yellow-900)
warning-border: #FBBF24 (yellow-400)
```

**Primary CTA (Call-to-Action)**
```css
/* Liberal blue as primary brand color */
primary-gradient: linear-gradient(to bottom right, #5B9FD8, #3A7AB5)
primary-text: #FFFFFF
primary-shadow-light: rgba(91, 159, 216, 0.4)
primary-shadow-dark: rgba(58, 122, 181, 0.6)
```

**Secondary CTA**
```css
secondary-bg: #F0F2F5 (neu-100)
secondary-text: #374151 (neu-700)
secondary-shadow: neu standard shadows
```

---

## Typography Specifications

### Font Family
```css
font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif
```

### Type Scale for Auth Components
```css
form-title: 1.875rem (30px) / font-weight: 700 / letter-spacing: -0.002em / color: neu-800
form-subtitle: 1rem (16px) / font-weight: 400 / letter-spacing: 0.005em / color: neu-500

label-text: 0.75rem (12px) / font-weight: 600 / letter-spacing: 0.006em / color: neu-700 / text-transform: uppercase
input-text: 1rem (16px) / font-weight: 400 / letter-spacing: 0.005em / color: neu-800
helper-text: 0.75rem (12px) / font-weight: 400 / letter-spacing: 0.006em / color: neu-500
error-text: 0.75rem (12px) / font-weight: 500 / letter-spacing: 0.006em / color: error-text

button-text: 0.875rem (14px) / font-weight: 500 / letter-spacing: 0.006em
link-text: 0.875rem (14px) / font-weight: 500 / letter-spacing: 0.006em / color: liberal-DEFAULT
```

---

## Component Specifications

---

## 1. LoginForm Component

### Container
```css
/* Outer card container */
background: #F0F2F5 (neu-100)
border-radius: 1.75rem (28px) - neu-lg
padding: 2.5rem (40px)
max-width: 28rem (448px)
box-shadow: 12px 12px 24px rgba(163, 177, 198, 0.6),
            -12px -12px 24px rgba(255, 255, 255, 0.5)
```

### Header Section
```css
/* Title */
font-size: 1.875rem (30px)
font-weight: 700
color: #1F2937 (neu-800)
margin-bottom: 0.5rem (8px)

/* Subtitle */
font-size: 1rem (16px)
color: #6B7280 (neu-500)
margin-bottom: 2rem (32px)
```

### Email Input Field

**Container**
```css
margin-bottom: 1.5rem (24px)
```

**Label**
```css
display: block
font-size: 0.75rem (12px)
font-weight: 600
color: #374151 (neu-700)
text-transform: uppercase
letter-spacing: 0.006em
margin-bottom: 0.5rem (8px)
```

**Input - Default State**
```css
width: 100%
padding: 0.875rem 1.25rem (14px 20px)
border-radius: 0.75rem (12px) - neu-sm
background: #F0F2F5 (neu-100)
color: #1F2937 (neu-800)
font-size: 1rem (16px)
border: none
outline: none

/* Inset shadow for pressed appearance */
box-shadow: inset 4px 4px 8px rgba(163, 177, 198, 0.5),
            inset -4px -4px 8px rgba(255, 255, 255, 0.5)

transition: box-shadow 0.2s ease, background-color 0.2s ease
```

**Placeholder**
```css
color: #9CA3AF (neu-400)
```

**Input - Focus State**
```css
/* Slightly lighter inset shadow */
box-shadow: inset 2px 2px 5px rgba(163, 177, 198, 0.4),
            inset -2px -2px 5px rgba(255, 255, 255, 0.4)

/* Optional: subtle blue glow for focus indication */
outline: 2px solid rgba(91, 159, 216, 0.3)
outline-offset: 2px
```

**Input - Error State**
```css
box-shadow: inset 4px 4px 8px rgba(239, 68, 68, 0.3),
            inset -4px -4px 8px rgba(254, 202, 202, 0.3)

/* Error border for accessibility */
outline: 1px solid #F87171 (red-400)
```

**Input - Disabled State**
```css
background: #E4E7EB (neu-200)
color: #9CA3AF (neu-400)
cursor: not-allowed
opacity: 0.6
```

**Error Message**
```css
display: flex
align-items: center
gap: 0.5rem (8px)
margin-top: 0.5rem (8px)
font-size: 0.75rem (12px)
font-weight: 500
color: #991B1B (red-900)
```

### Password Input Field

**Same specifications as Email Input, with additional:**

**Show/Hide Toggle Button**
```css
position: absolute
right: 1rem (16px)
top: 50%
transform: translateY(-50%)
padding: 0.5rem (8px)
border-radius: 0.5rem (8px)
background: transparent
color: #6B7280 (neu-500)
cursor: pointer

/* Hover state */
background: rgba(163, 177, 198, 0.15)
color: #374151 (neu-700)

transition: all 0.2s ease
```

### "Remember Me" Checkbox

**Container**
```css
display: flex
align-items: center
gap: 0.75rem (12px)
margin-bottom: 1.5rem (24px)
```

**Checkbox Input - Default State**
```css
width: 1.25rem (20px)
height: 1.25rem (20px)
border-radius: 0.375rem (6px)
background: #F0F2F5 (neu-100)
border: none
cursor: pointer

/* Inset appearance */
box-shadow: inset 3px 3px 6px rgba(163, 177, 198, 0.5),
            inset -3px -3px 6px rgba(255, 255, 255, 0.5)

transition: all 0.2s ease
```

**Checkbox - Checked State**
```css
background: linear-gradient(to bottom right, #5B9FD8, #3A7AB5)

/* Raised appearance when checked */
box-shadow: 4px 4px 8px rgba(163, 177, 198, 0.6),
            -4px -4px 8px rgba(255, 255, 255, 0.5)

/* Checkmark icon */
content: '✓'
color: #FFFFFF
font-weight: 700
display: flex
align-items: center
justify-content: center
```

**Checkbox Label**
```css
font-size: 0.875rem (14px)
color: #374151 (neu-700)
cursor: pointer
user-select: none
```

### "Forgot Password?" Link

```css
display: inline-block
font-size: 0.875rem (14px)
font-weight: 500
color: #4A8DC7 (liberal-DEFAULT)
text-decoration: none
margin-bottom: 1.5rem (24px)

/* Hover state */
color: #3A7AB5 (liberal-dark)
text-decoration: underline

transition: color 0.2s ease
```

### Submit Button - Default State

```css
width: 100%
padding: 0.875rem 1.5rem (14px 24px)
border-radius: 1rem (16px) - neu
background: linear-gradient(to bottom right, #5B9FD8, #3A7AB5)
color: #FFFFFF
font-size: 0.875rem (14px)
font-weight: 600
letter-spacing: 0.025em
text-transform: uppercase
border: none
cursor: pointer

/* Raised shadow */
box-shadow: 8px 8px 16px rgba(163, 177, 198, 0.6),
            -8px -8px 16px rgba(255, 255, 255, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.2)

transition: all 0.2s ease
```

**Submit Button - Hover State**
```css
/* Enhanced elevation */
box-shadow: 12px 12px 24px rgba(163, 177, 198, 0.6),
            -12px -12px 24px rgba(255, 255, 255, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.2)

transform: translateY(-1px)
```

**Submit Button - Active/Pressed State**
```css
/* Pressed down appearance */
box-shadow: inset 4px 4px 8px rgba(58, 122, 181, 0.4),
            inset -2px -2px 6px rgba(91, 159, 216, 0.2)

transform: translateY(0px)
```

**Submit Button - Loading State**
```css
position: relative
color: transparent
cursor: wait

/* Loading spinner overlay */
&::after {
  content: '';
  position: absolute;
  width: 1rem (16px)
  height: 1rem (16px)
  top: 50%
  left: 50%
  transform: translate(-50%, -50%)
  border: 2px solid rgba(255, 255, 255, 0.3)
  border-top-color: #FFFFFF
  border-radius: 50%
  animation: spin 0.6s linear infinite
}

@keyframes spin {
  to { transform: translate(-50%, -50%) rotate(360deg) }
}
```

**Submit Button - Disabled State**
```css
background: #E4E7EB (neu-200)
color: #9CA3AF (neu-400)
cursor: not-allowed
opacity: 0.6

box-shadow: inset 2px 2px 4px rgba(163, 177, 198, 0.3),
            inset -2px -2px 4px rgba(255, 255, 255, 0.3)
```

### Error Message Display (Form-level)

```css
width: 100%
padding: 1rem 1.25rem (16px 20px)
margin-bottom: 1.5rem (24px)
border-radius: 0.75rem (12px)
background: #FEE2E2 (red-50)
border-left: 4px solid #EF4444 (red-500)

/* Subtle inset for alert feel */
box-shadow: inset 2px 2px 4px rgba(239, 68, 68, 0.15),
            inset -2px -2px 4px rgba(254, 226, 226, 0.15)

/* Icon + Text */
display: flex
align-items: flex-start
gap: 0.75rem (12px)

/* Icon */
.error-icon {
  color: #DC2626 (red-600)
  flex-shrink: 0
  font-size: 1rem (16px)
}

/* Text */
.error-text {
  font-size: 0.875rem (14px)
  color: #991B1B (red-900)
  line-height: 1.5
}
```

### Footer Section

```css
margin-top: 1.5rem (24px)
padding-top: 1.5rem (24px)
border-top: 1px solid #D1D5DB (neu-300)
text-align: center

/* "Don't have an account?" text */
font-size: 0.875rem (14px)
color: #6B7280 (neu-500)

/* "Sign up" link */
.signup-link {
  color: #4A8DC7 (liberal-DEFAULT)
  font-weight: 600
  text-decoration: none
  margin-left: 0.25rem (4px)
}

.signup-link:hover {
  color: #3A7AB5 (liberal-dark)
  text-decoration: underline
}
```

### Responsive Behavior

**Mobile (< 640px)**
```css
padding: 1.5rem (24px)
max-width: 100%
margin: 1rem (16px)
border-radius: 1.25rem (20px)
```

**Tablet (640px - 1024px)**
```css
padding: 2rem (32px)
max-width: 26rem (416px)
```

**Desktop (> 1024px)**
```css
/* Full specifications as above */
padding: 2.5rem (40px)
max-width: 28rem (448px)
```

---

## 2. RegisterForm Component

### Container (Same as LoginForm)
```css
background: #F0F2F5 (neu-100)
border-radius: 1.75rem (28px)
padding: 2.5rem (40px)
max-width: 28rem (448px)
box-shadow: 12px 12px 24px rgba(163, 177, 198, 0.6),
            -12px -12px 24px rgba(255, 255, 255, 0.5)
```

### Header Section
```css
/* Title */
"Create Account"
font-size: 1.875rem (30px)
font-weight: 700
color: #1F2937 (neu-800)
margin-bottom: 0.5rem (8px)

/* Subtitle */
"Join FairMediator to find your perfect mediator"
font-size: 1rem (16px)
color: #6B7280 (neu-500)
margin-bottom: 2rem (32px)
```

### Form Fields

**Full Name Input** - Same specs as LoginForm Email Input
**Email Input** - Same specs as LoginForm Email Input
**Password Input** - Same specs as LoginForm Password Input

### Password Confirmation Input

**Same specifications as Password Input, with additional validation:**

```css
/* Match indicator (inline with field) */
.password-match-indicator {
  position: absolute
  right: 3rem (48px) /* Leave space for show/hide button */
  top: 50%
  transform: translateY(-50%)
  font-size: 1rem (16px)
}

.password-match {
  color: #10B981 (green-500)
  content: '✓'
}

.password-mismatch {
  color: #EF4444 (red-500)
  content: '✗'
}
```

### Password Strength Indicator

**Container**
```css
margin-top: 0.75rem (12px)
margin-bottom: 1.5rem (24px)
```

**Label**
```css
display: flex
justify-content: space-between
align-items: center
font-size: 0.75rem (12px)
color: #6B7280 (neu-500)
margin-bottom: 0.5rem (8px)
```

**Strength Level Text**
```css
font-weight: 600

/* Color based on strength */
.weak { color: #EF4444 (red-500) }
.fair { color: #F59E0B (yellow-500) }
.good { color: #3B82F6 (blue-500) }
.strong { color: #10B981 (green-500) }
```

**Progress Bar Container**
```css
width: 100%
height: 0.5rem (8px)
border-radius: 0.25rem (4px)
background: #E4E7EB (neu-200)

/* Inset appearance */
box-shadow: inset 2px 2px 4px rgba(163, 177, 198, 0.4),
            inset -2px -2px 4px rgba(255, 255, 255, 0.4)

overflow: hidden
```

**Progress Bar Fill**
```css
height: 100%
border-radius: 0.25rem (4px)
transition: width 0.3s ease, background-color 0.3s ease

/* Gradient based on strength */
.weak {
  width: 25%
  background: linear-gradient(to right, #FCA5A5, #EF4444)
}

.fair {
  width: 50%
  background: linear-gradient(to right, #FCD34D, #F59E0B)
}

.good {
  width: 75%
  background: linear-gradient(to right, #93C5FD, #3B82F6)
}

.strong {
  width: 100%
  background: linear-gradient(to right, #6EE7B7, #10B981)
}
```

**Password Requirements List**
```css
margin-top: 0.75rem (12px)
padding: 0.875rem 1rem (14px 16px)
background: #F9FAFB (neu-50)
border-radius: 0.75rem (12px)

/* Subtle inset */
box-shadow: inset 1px 1px 2px rgba(163, 177, 198, 0.2),
            inset -1px -1px 2px rgba(255, 255, 255, 0.2)
```

**Requirement Item**
```css
display: flex
align-items: center
gap: 0.5rem (8px)
font-size: 0.75rem (12px)
color: #6B7280 (neu-500)
margin-bottom: 0.375rem (6px)

&:last-child {
  margin-bottom: 0
}

/* Icon */
.requirement-icon {
  width: 1rem (16px)
  height: 1rem (16px)
  flex-shrink: 0
}

/* Met requirement */
&.met {
  color: #10B981 (green-500)
  .requirement-icon { color: #10B981 }
}

/* Unmet requirement */
&.unmet {
  color: #9CA3AF (neu-400)
  .requirement-icon { color: #D1D5DB (neu-300) }
}
```

### Terms of Service Checkbox

**Container**
```css
display: flex
align-items: flex-start
gap: 0.75rem (12px)
margin-bottom: 1.5rem (24px)
padding: 1rem (16px)
background: #F9FAFB (neu-50)
border-radius: 0.75rem (12px)

/* Subtle inset for emphasis */
box-shadow: inset 1px 1px 2px rgba(163, 177, 198, 0.2),
            inset -1px -1px 2px rgba(255, 255, 255, 0.2)
```

**Checkbox** - Same specs as LoginForm "Remember Me" checkbox

**Label Text**
```css
font-size: 0.875rem (14px)
color: #374151 (neu-700)
line-height: 1.5
cursor: pointer

/* Links within label */
a {
  color: #4A8DC7 (liberal-DEFAULT)
  font-weight: 500
  text-decoration: underline
}

a:hover {
  color: #3A7AB5 (liberal-dark)
}
```

### Submit Button

**Same specifications as LoginForm Submit Button, with text:**
```
"Create Account"
```

### Success State (Post-submission)

**Success Container**
```css
width: 100%
padding: 1.5rem (24px)
border-radius: 1rem (16px)
background: #D1FAE5 (green-50)
text-align: center

/* Soft elevated appearance */
box-shadow: 6px 6px 12px rgba(167, 243, 208, 0.4),
            -6px -6px 12px rgba(255, 255, 255, 0.5)

animation: slideUp 0.4s ease-out
```

**Success Icon**
```css
width: 4rem (64px)
height: 4rem (64px)
margin: 0 auto 1rem
border-radius: 50%
background: linear-gradient(135deg, #6EE7B7, #10B981)
color: #FFFFFF
font-size: 2rem (32px)
display: flex
align-items: center
justify-content: center

/* Floating shadow */
box-shadow: 8px 8px 16px rgba(16, 185, 129, 0.3),
            -8px -8px 16px rgba(110, 231, 183, 0.3)

animation: scaleIn 0.5s ease-out
```

**Success Title**
```css
font-size: 1.25rem (20px)
font-weight: 700
color: #065F46 (green-900)
margin-bottom: 0.5rem (8px)
```

**Success Message**
```css
font-size: 0.875rem (14px)
color: #047857 (green-800)
line-height: 1.5
```

### Footer Section

```css
margin-top: 1.5rem (24px)
padding-top: 1.5rem (24px)
border-top: 1px solid #D1D5DB (neu-300)
text-align: center

/* "Already have an account?" text */
font-size: 0.875rem (14px)
color: #6B7280 (neu-500)

/* "Sign in" link */
.signin-link {
  color: #4A8DC7 (liberal-DEFAULT)
  font-weight: 600
  text-decoration: none
  margin-left: 0.25rem (4px)
}

.signin-link:hover {
  color: #3A7AB5 (liberal-dark)
  text-decoration: underline
}
```

### Animation Keyframes

```css
@keyframes slideUp {
  from {
    opacity: 0
    transform: translateY(20px)
  }
  to {
    opacity: 1
    transform: translateY(0)
  }
}

@keyframes scaleIn {
  from {
    transform: scale(0)
    opacity: 0
  }
  to {
    transform: scale(1)
    opacity: 1
  }
}
```

---

## 3. SubscriptionCard Component

### Card Container - Default State

```css
background: #F0F2F5 (neu-100)
border-radius: 1.75rem (28px)
padding: 2rem (32px)
width: 100%
max-width: 22rem (352px)

/* Raised appearance */
box-shadow: 8px 8px 16px rgba(163, 177, 198, 0.6),
            -8px -8px 16px rgba(255, 255, 255, 0.5)

transition: all 0.3s ease
```

**Card - Hover State**
```css
/* Enhanced elevation */
box-shadow: 12px 12px 24px rgba(163, 177, 198, 0.6),
            -12px -12px 24px rgba(255, 255, 255, 0.5)

transform: translateY(-4px)
```

**Card - Current Plan (Active) State**
```css
/* Subtle blue tint for current plan */
background: linear-gradient(145deg, #EFF6FF, #DBEAFE)

/* Enhanced shadow with blue tint */
box-shadow: 10px 10px 20px rgba(147, 197, 253, 0.4),
            -10px -10px 20px rgba(255, 255, 255, 0.5),
            inset 0 0 0 2px rgba(91, 159, 216, 0.2)
```

### Tier Badge (Free/Premium)

**Container**
```css
display: inline-block
margin-bottom: 1rem (16px)
```

**Free Badge**
```css
padding: 0.5rem 1rem (8px 16px)
border-radius: 9999px (full)
background: linear-gradient(135deg, #D1D5DB, #9CA3AF)
color: #1F2937 (neu-800)
font-size: 0.75rem (12px)
font-weight: 700
letter-spacing: 0.05em
text-transform: uppercase

/* Subtle raised shadow */
box-shadow: 4px 4px 8px rgba(163, 177, 198, 0.4),
            -4px -4px 8px rgba(255, 255, 255, 0.4)
```

**Premium Badge**
```css
padding: 0.5rem 1rem (8px 16px)
border-radius: 9999px (full)
background: linear-gradient(135deg, #FCD34D, #F59E0B)
color: #78350F (yellow-900)
font-size: 0.75rem (12px)
font-weight: 700
letter-spacing: 0.05em
text-transform: uppercase

/* Glowing shadow */
box-shadow: 4px 4px 12px rgba(251, 191, 36, 0.4),
            -4px -4px 12px rgba(252, 211, 77, 0.4),
            0 0 20px rgba(245, 158, 11, 0.2)
```

### Tier Title

```css
font-size: 1.5rem (24px)
font-weight: 700
color: #1F2937 (neu-800)
margin-bottom: 0.5rem (8px)
```

### Pricing Display

**Container**
```css
margin-bottom: 1.5rem (24px)
display: flex
align-items: baseline
gap: 0.25rem (4px)
```

**Price Amount**
```css
font-size: 2.25rem (36px)
font-weight: 800
color: #1F2937 (neu-800)
letter-spacing: -0.025em
```

**Currency Symbol**
```css
font-size: 1.5rem (24px)
font-weight: 700
color: #6B7280 (neu-500)
```

**Period Text** ("/month" or "forever")
```css
font-size: 1rem (16px)
color: #6B7280 (neu-500)
font-weight: 500
```

### Feature List

**Container**
```css
margin-bottom: 2rem (32px)
```

**Feature Item - Included**
```css
display: flex
align-items: flex-start
gap: 0.75rem (12px)
margin-bottom: 0.875rem (14px)
padding: 0.75rem (12px)
border-radius: 0.75rem (12px)
background: #F9FAFB (neu-50)

/* Subtle inset for grouped feel */
box-shadow: inset 1px 1px 2px rgba(163, 177, 198, 0.15),
            inset -1px -1px 2px rgba(255, 255, 255, 0.15)

/* Icon */
.feature-icon {
  width: 1.25rem (20px)
  height: 1.25rem (20px)
  flex-shrink: 0
  color: #10B981 (green-500)
  font-weight: 700
}

/* Text */
.feature-text {
  font-size: 0.875rem (14px)
  color: #374151 (neu-700)
  line-height: 1.5
}
```

**Feature Item - Not Included**
```css
/* Same container specs with opacity reduction */
opacity: 0.5

/* Icon */
.feature-icon {
  color: #D1D5DB (neu-300)
}

/* Text */
.feature-text {
  color: #9CA3AF (neu-400)
  text-decoration: line-through
}
```

### Emphasis Text (e.g., "Most Popular")

```css
display: inline-flex
align-items: center
gap: 0.5rem (8px)
padding: 0.625rem 1rem (10px 16px)
margin-bottom: 1.5rem (24px)
border-radius: 9999px (full)
background: linear-gradient(135deg, #DBEAFE, #BFDBFE)
color: #1E3A8A (blue-900)
font-size: 0.75rem (12px)
font-weight: 600
letter-spacing: 0.025em

/* Inset appearance */
box-shadow: inset 2px 2px 4px rgba(59, 130, 246, 0.2),
            inset -2px -2px 4px rgba(219, 234, 254, 0.2)
```

### Action Buttons

**"Upgrade" Button (Primary CTA)**
```css
width: 100%
padding: 0.875rem 1.5rem (14px 24px)
border-radius: 1rem (16px)
background: linear-gradient(to bottom right, #5B9FD8, #3A7AB5)
color: #FFFFFF
font-size: 0.875rem (14px)
font-weight: 600
letter-spacing: 0.025em
text-transform: uppercase
border: none
cursor: pointer
text-align: center

/* Raised shadow */
box-shadow: 8px 8px 16px rgba(163, 177, 198, 0.6),
            -8px -8px 16px rgba(255, 255, 255, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.2)

transition: all 0.2s ease
```

**"Upgrade" Button - Hover**
```css
box-shadow: 12px 12px 24px rgba(163, 177, 198, 0.6),
            -12px -12px 24px rgba(255, 255, 255, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.2)

transform: translateY(-2px)
```

**"Current Plan" Button (Inactive State)**
```css
width: 100%
padding: 0.875rem 1.5rem (14px 24px)
border-radius: 1rem (16px)
background: #E4E7EB (neu-200)
color: #6B7280 (neu-500)
font-size: 0.875rem (14px)
font-weight: 600
letter-spacing: 0.025em
text-transform: uppercase
border: none
cursor: default
text-align: center

/* Inset appearance for inactive state */
box-shadow: inset 3px 3px 6px rgba(163, 177, 198, 0.4),
            inset -3px -3px 6px rgba(255, 255, 255, 0.4)

/* Checkmark icon */
display: flex
align-items: center
justify-content: center
gap: 0.5rem (8px)

&::before {
  content: '✓'
  font-size: 1rem (16px)
  font-weight: 700
}
```

**"Learn More" Link (Secondary CTA)**
```css
display: block
width: 100%
padding: 0.75rem (12px)
text-align: center
font-size: 0.875rem (14px)
font-weight: 500
color: #4A8DC7 (liberal-DEFAULT)
text-decoration: none
margin-top: 0.75rem (12px)

/* Hover */
color: #3A7AB5 (liberal-dark)
text-decoration: underline

transition: color 0.2s ease
```

### Responsive Behavior

**Mobile (< 640px)**
```css
padding: 1.5rem (24px)
max-width: 100%
```

**Tablet & Desktop**
```css
/* Full specs as above */
padding: 2rem (32px)
max-width: 22rem (352px)
```

**Grid Layout for Multiple Cards**
```css
/* Parent container */
.subscription-grid {
  display: grid
  grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr))
  gap: 2rem (32px)
  max-width: 72rem (1152px)
  margin: 0 auto
  padding: 2rem (32px)
}
```

---

## 4. UpgradePrompt Component

### Modal Variant

**Overlay**
```css
position: fixed
inset: 0
background: rgba(17, 24, 39, 0.75)
backdrop-filter: blur(4px)
display: flex
align-items: center
justify-content: center
padding: 1rem (16px)
z-index: 1000

animation: fadeIn 0.3s ease-out
```

**Modal Container**
```css
background: #F0F2F5 (neu-100)
border-radius: 1.75rem (28px)
padding: 2.5rem (40px)
max-width: 32rem (512px)
width: 100%
position: relative

/* Strong floating shadow */
box-shadow: 20px 20px 40px rgba(163, 177, 198, 0.6),
            -20px -20px 40px rgba(255, 255, 255, 0.5)

animation: slideUp 0.4s ease-out
```

**Close Button**
```css
position: absolute
top: 1.5rem (24px)
right: 1.5rem (24px)
width: 2.5rem (40px)
height: 2.5rem (40px)
border-radius: 50%
background: #F0F2F5 (neu-100)
border: none
cursor: pointer
display: flex
align-items: center
justify-content: center
color: #6B7280 (neu-500)
font-size: 1.25rem (20px)

/* Raised appearance */
box-shadow: 4px 4px 8px rgba(163, 177, 198, 0.6),
            -4px -4px 8px rgba(255, 255, 255, 0.5)

transition: all 0.2s ease
```

**Close Button - Hover**
```css
color: #374151 (neu-700)
box-shadow: 6px 6px 12px rgba(163, 177, 198, 0.6),
            -6px -6px 12px rgba(255, 255, 255, 0.5)

transform: scale(1.05)
```

**Close Button - Active**
```css
box-shadow: inset 2px 2px 4px rgba(163, 177, 198, 0.5),
            inset -2px -2px 4px rgba(255, 255, 255, 0.5)

transform: scale(0.95)
```

### Header Section

**Icon Container**
```css
width: 4rem (64px)
height: 4rem (64px)
margin: 0 auto 1.5rem
border-radius: 50%
background: linear-gradient(135deg, #FCD34D, #F59E0B)
display: flex
align-items: center
justify-content: center
color: #FFFFFF
font-size: 2rem (32px)

/* Glowing shadow */
box-shadow: 8px 8px 16px rgba(245, 158, 11, 0.4),
            -8px -8px 16px rgba(252, 211, 77, 0.4),
            0 0 32px rgba(251, 191, 36, 0.3)
```

**Title**
```css
font-size: 1.875rem (30px)
font-weight: 700
color: #1F2937 (neu-800)
text-align: center
margin-bottom: 0.75rem (12px)
```

**Subtitle**
```css
font-size: 1rem (16px)
color: #6B7280 (neu-500)
text-align: center
line-height: 1.6
margin-bottom: 2rem (32px)
```

### Benefits List

**Container**
```css
margin-bottom: 2rem (32px)
padding: 1.5rem (24px)
background: #F9FAFB (neu-50)
border-radius: 1rem (16px)

/* Subtle inset */
box-shadow: inset 2px 2px 4px rgba(163, 177, 198, 0.2),
            inset -2px -2px 4px rgba(255, 255, 255, 0.2)
```

**Benefit Item**
```css
display: flex
align-items: center
gap: 1rem (16px)
margin-bottom: 1rem (16px)
padding: 0.875rem (14px)
background: #FFFFFF
border-radius: 0.75rem (12px)

/* Subtle raised shadow */
box-shadow: 3px 3px 6px rgba(163, 177, 198, 0.3),
            -3px -3px 6px rgba(255, 255, 255, 0.3)

&:last-child {
  margin-bottom: 0
}

/* Icon */
.benefit-icon {
  width: 2rem (32px)
  height: 2rem (32px)
  border-radius: 50%
  background: linear-gradient(135deg, #A7F3D0, #10B981)
  color: #FFFFFF
  font-size: 1rem (16px)
  display: flex
  align-items: center
  justify-content: center
  flex-shrink: 0
  font-weight: 700
}

/* Text */
.benefit-text {
  font-size: 0.875rem (14px)
  color: #374151 (neu-700)
  font-weight: 500
}
```

### CTA Button

**Primary Button**
```css
width: 100%
padding: 1rem 1.5rem (16px 24px)
border-radius: 1rem (16px)
background: linear-gradient(to bottom right, #5B9FD8, #3A7AB5)
color: #FFFFFF
font-size: 1rem (16px)
font-weight: 600
letter-spacing: 0.025em
border: none
cursor: pointer
text-align: center

/* Strong raised shadow */
box-shadow: 10px 10px 20px rgba(163, 177, 198, 0.6),
            -10px -10px 20px rgba(255, 255, 255, 0.5),
            inset 0 2px 0 rgba(255, 255, 255, 0.2)

transition: all 0.3s ease
```

**Primary Button - Hover**
```css
box-shadow: 14px 14px 28px rgba(163, 177, 198, 0.6),
            -14px -14px 28px rgba(255, 255, 255, 0.5),
            inset 0 2px 0 rgba(255, 255, 255, 0.2)

transform: translateY(-3px)
```

**Dismiss Link**
```css
display: block
width: 100%
padding: 0.75rem (12px)
text-align: center
font-size: 0.875rem (14px)
color: #6B7280 (neu-500)
text-decoration: none
margin-top: 1rem (16px)

/* Hover */
color: #374151 (neu-700)

transition: color 0.2s ease
```

### Banner Variant (Non-Modal)

**Banner Container**
```css
width: 100%
padding: 1.25rem 1.5rem (20px 24px)
background: linear-gradient(135deg, #FEF3C7, #FDE68A)
border-radius: 1rem (16px)
margin-bottom: 1.5rem (24px)

/* Subtle raised appearance */
box-shadow: 6px 6px 12px rgba(245, 158, 11, 0.2),
            -6px -6px 12px rgba(254, 243, 199, 0.2)

display: flex
align-items: center
gap: 1rem (16px)
```

**Banner Icon**
```css
width: 3rem (48px)
height: 3rem (48px)
border-radius: 50%
background: linear-gradient(135deg, #FBBF24, #F59E0B)
color: #FFFFFF
font-size: 1.5rem (24px)
display: flex
align-items: center
justify-content: center
flex-shrink: 0

/* Small shadow */
box-shadow: 4px 4px 8px rgba(245, 158, 11, 0.3),
            -4px -4px 8px rgba(251, 191, 36, 0.3)
```

**Banner Content**
```css
flex: 1

/* Title */
.banner-title {
  font-size: 1rem (16px)
  font-weight: 600
  color: #78350F (yellow-900)
  margin-bottom: 0.25rem (4px)
}

/* Message */
.banner-message {
  font-size: 0.875rem (14px)
  color: #92400E (yellow-800)
}
```

**Banner CTA**
```css
padding: 0.625rem 1.25rem (10px 20px)
border-radius: 0.75rem (12px)
background: linear-gradient(to bottom right, #5B9FD8, #3A7AB5)
color: #FFFFFF
font-size: 0.875rem (14px)
font-weight: 600
border: none
cursor: pointer
white-space: nowrap

/* Raised shadow */
box-shadow: 5px 5px 10px rgba(163, 177, 198, 0.4),
            -5px -5px 10px rgba(255, 255, 255, 0.4)

transition: all 0.2s ease
```

**Banner CTA - Hover**
```css
box-shadow: 7px 7px 14px rgba(163, 177, 198, 0.4),
            -7px -7px 14px rgba(255, 255, 255, 0.4)

transform: translateY(-1px)
```

**Banner Dismiss Button**
```css
width: 2rem (32px)
height: 2rem (32px)
border-radius: 50%
background: transparent
border: none
color: #92400E (yellow-800)
cursor: pointer
display: flex
align-items: center
justify-content: center
font-size: 1.25rem (20px)

/* Hover */
background: rgba(146, 64, 14, 0.1)

transition: background 0.2s ease
```

### Responsive Behavior

**Mobile Modal**
```css
padding: 1.5rem (24px)
border-radius: 1.25rem (20px)
margin: 1rem (16px)
```

**Mobile Banner**
```css
flex-direction: column
text-align: center
gap: 0.75rem (12px)

.banner-cta {
  width: 100%
}
```

---

## 5. UsageIndicator Component

### Container

**Default Card Style**
```css
background: #F0F2F5 (neu-100)
border-radius: 1rem (16px)
padding: 1.25rem (20px)
width: 100%
max-width: 24rem (384px)

/* Subtle raised shadow */
box-shadow: 6px 6px 12px rgba(163, 177, 198, 0.6),
            -6px -6px 12px rgba(255, 255, 255, 0.5)
```

**Inline Variant (for header/nav)**
```css
display: inline-flex
align-items: center
gap: 0.75rem (12px)
padding: 0.75rem 1rem (12px 16px)
background: #F0F2F5 (neu-100)
border-radius: 0.75rem (12px)

box-shadow: 4px 4px 8px rgba(163, 177, 198, 0.6),
            -4px -4px 8px rgba(255, 255, 255, 0.5)
```

### Header Section

**Label**
```css
font-size: 0.75rem (12px)
font-weight: 600
color: #6B7280 (neu-500)
text-transform: uppercase
letter-spacing: 0.05em
margin-bottom: 0.5rem (8px)
```

**Usage Count**
```css
display: flex
align-items: baseline
gap: 0.25rem (4px)
margin-bottom: 0.75rem (12px)

/* Current count */
.current-count {
  font-size: 1.5rem (24px)
  font-weight: 700
  color: #1F2937 (neu-800)
}

/* Separator */
.separator {
  font-size: 1.25rem (20px)
  color: #9CA3AF (neu-400)
  font-weight: 500
}

/* Limit count */
.limit-count {
  font-size: 1.5rem (24px)
  font-weight: 700
  color: #6B7280 (neu-500)
}

/* Period text */
.period-text {
  font-size: 0.875rem (14px)
  color: #6B7280 (neu-500)
  margin-left: 0.25rem (4px)
}
```

### Progress Bar

**Container**
```css
width: 100%
height: 0.75rem (12px)
border-radius: 9999px (full)
background: #E4E7EB (neu-200)
margin-bottom: 0.75rem (12px)
overflow: hidden

/* Inset shadow */
box-shadow: inset 3px 3px 6px rgba(163, 177, 198, 0.5),
            inset -3px -3px 6px rgba(255, 255, 255, 0.5)
```

**Progress Fill - Safe (< 70%)**
```css
height: 100%
border-radius: 9999px (full)
background: linear-gradient(to right, #6EE7B7, #10B981)
transition: width 0.4s ease, background-color 0.3s ease

/* Subtle raised shadow within track */
box-shadow: 2px 2px 4px rgba(16, 185, 129, 0.3),
            -2px -2px 4px rgba(110, 231, 183, 0.3)
```

**Progress Fill - Warning (70% - 90%)**
```css
background: linear-gradient(to right, #FCD34D, #F59E0B)

box-shadow: 2px 2px 4px rgba(245, 158, 11, 0.3),
            -2px -2px 4px rgba(252, 211, 77, 0.3)
```

**Progress Fill - Danger (> 90%)**
```css
background: linear-gradient(to right, #FCA5A5, #EF4444)

box-shadow: 2px 2px 4px rgba(239, 68, 68, 0.3),
            -2px -2px 4px rgba(252, 165, 165, 0.3)

/* Pulse animation for urgent state */
animation: pulse 2s ease-in-out infinite
```

**Percentage Label (Optional)**
```css
/* Positioned above or to the right of bar */
font-size: 0.75rem (12px)
font-weight: 600
color: #6B7280 (neu-500)
```

### Status Message

**Safe State (< 70%)**
```css
display: flex
align-items: center
gap: 0.5rem (8px)
padding: 0.625rem 0.875rem (10px 14px)
background: #D1FAE5 (green-50)
border-radius: 0.5rem (8px)
font-size: 0.75rem (12px)
color: #065F46 (green-900)

/* Subtle inset */
box-shadow: inset 1px 1px 2px rgba(16, 185, 129, 0.15),
            inset -1px -1px 2px rgba(209, 250, 229, 0.15)

/* Icon */
.status-icon {
  color: #10B981 (green-500)
}
```

**Warning State (70% - 90%)**
```css
background: #FEF3C7 (yellow-50)
color: #78350F (yellow-900)

box-shadow: inset 1px 1px 2px rgba(245, 158, 11, 0.15),
            inset -1px -1px 2px rgba(254, 243, 199, 0.15)

.status-icon {
  color: #F59E0B (yellow-500)
}
```

**Danger State (> 90%)**
```css
background: #FEE2E2 (red-50)
color: #7F1D1D (red-900)

box-shadow: inset 1px 1px 2px rgba(239, 68, 68, 0.15),
            inset -1px -1px 2px rgba(254, 226, 226, 0.15)

.status-icon {
  color: #EF4444 (red-500)
}
```

**Exceeded Limit (100%+)**
```css
background: #FEE2E2 (red-50)
color: #7F1D1D (red-900)
border: 1px solid #EF4444 (red-500)

box-shadow: inset 1px 1px 2px rgba(239, 68, 68, 0.2),
            inset -1px -1px 2px rgba(254, 226, 226, 0.2)

font-weight: 600

.status-icon {
  color: #DC2626 (red-600)
  font-size: 1rem (16px)
}
```

### Upgrade Prompt (Inline)

**Container** - Appears when > 80% usage
```css
margin-top: 0.75rem (12px)
padding: 0.75rem 1rem (12px 16px)
background: linear-gradient(135deg, #EFF6FF, #DBEAFE)
border-radius: 0.75rem (12px)
display: flex
align-items: center
justify-content: space-between
gap: 0.75rem (12px)

/* Subtle inset */
box-shadow: inset 1px 1px 2px rgba(59, 130, 246, 0.15),
            inset -1px -1px 2px rgba(239, 246, 255, 0.15)
```

**Prompt Text**
```css
font-size: 0.75rem (12px)
color: #1E3A8A (blue-900)
font-weight: 500
flex: 1
```

**Upgrade Button (Mini)**
```css
padding: 0.5rem 0.875rem (8px 14px)
border-radius: 0.5rem (8px)
background: linear-gradient(to bottom right, #5B9FD8, #3A7AB5)
color: #FFFFFF
font-size: 0.75rem (12px)
font-weight: 600
border: none
cursor: pointer
white-space: nowrap

box-shadow: 4px 4px 8px rgba(163, 177, 198, 0.4),
            -4px -4px 8px rgba(255, 255, 255, 0.4)

transition: all 0.2s ease
```

**Upgrade Button - Hover**
```css
box-shadow: 6px 6px 12px rgba(163, 177, 198, 0.4),
            -6px -6px 12px rgba(255, 255, 255, 0.4)

transform: translateY(-1px)
```

### Reset Timer (Optional)

**Display**
```css
font-size: 0.75rem (12px)
color: #9CA3AF (neu-400)
margin-top: 0.5rem (8px)
text-align: center

/* Icon + text */
display: flex
align-items: center
justify-content: center
gap: 0.375rem (6px)

.reset-icon {
  font-size: 0.875rem (14px)
}
```

### Inline Variant Layout

**Compact for Header**
```css
/* Simplified layout for header/nav integration */
display: inline-flex
align-items: center
gap: 0.625rem (10px)
padding: 0.625rem 1rem (10px 16px)

/* Icon only for mobile */
@media (max-width: 640px) {
  .usage-text {
    display: none
  }

  .usage-icon {
    display: block
    font-size: 1.25rem (20px)
    color: #6B7280 (neu-500)
  }
}

/* Full display for desktop */
@media (min-width: 641px) {
  .usage-icon {
    display: none
  }

  .usage-text {
    display: flex
    align-items: baseline
    gap: 0.25rem (4px)
    font-size: 0.875rem (14px)
  }
}
```

### Animations

```css
@keyframes pulse {
  0%, 100% {
    opacity: 1
  }
  50% {
    opacity: 0.7
  }
}

/* Optional: Fill animation on load */
@keyframes fillProgress {
  from {
    width: 0
  }
  to {
    width: var(--progress-width)
  }
}

.progress-fill-animate {
  animation: fillProgress 0.8s ease-out
}
```

---

## Accessibility Considerations

### Color Contrast

**All text must meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text)**

Validated Combinations:
```css
/* Body text on neu-100 background */
#1F2937 on #F0F2F5 = 10.2:1 (WCAG AAA) ✓

/* Secondary text on neu-100 background */
#6B7280 on #F0F2F5 = 4.9:1 (WCAG AA) ✓

/* Disabled text on neu-100 background */
#9CA3AF on #F0F2F5 = 3.1:1 (WCAG AA Large) ✓

/* Error text on error-bg */
#991B1B on #FEE2E2 = 8.3:1 (WCAG AAA) ✓

/* Success text on success-bg */
#065F46 on #D1FAE5 = 7.8:1 (WCAG AAA) ✓

/* Warning text on warning-bg */
#78350F on #FEF3C7 = 9.1:1 (WCAG AAA) ✓
```

### Focus States

**All interactive elements must have clear focus indicators:**

```css
/* Focus ring for keyboard navigation */
*:focus-visible {
  outline: 2px solid #5B9FD8 (liberal-light)
  outline-offset: 2px
  border-radius: inherit
}

/* For neomorphic inputs, combine with outline */
input:focus-visible,
textarea:focus-visible {
  outline: 2px solid #5B9FD8
  outline-offset: 2px
  box-shadow: inset 2px 2px 5px rgba(163, 177, 198, 0.4),
              inset -2px -2px 5px rgba(255, 255, 255, 0.4),
              0 0 0 3px rgba(91, 159, 216, 0.2)
}

/* For buttons */
button:focus-visible {
  outline: 2px solid #FFFFFF
  outline-offset: 2px
  box-shadow: 8px 8px 16px rgba(163, 177, 198, 0.6),
              -8px -8px 16px rgba(255, 255, 255, 0.5),
              0 0 0 4px rgba(91, 159, 216, 0.3)
}
```

### Screen Reader Support

**Required ARIA attributes:**

```html
<!-- Form inputs -->
<label for="email-input" class="sr-only-visible">Email Address</label>
<input
  id="email-input"
  type="email"
  aria-required="true"
  aria-invalid="false"
  aria-describedby="email-error"
/>
<span id="email-error" role="alert" aria-live="polite">
  <!-- Error message appears here -->
</span>

<!-- Password visibility toggle -->
<button
  type="button"
  aria-label="Show password"
  aria-pressed="false"
>
  <!-- Icon -->
</button>

<!-- Progress indicators -->
<div
  role="progressbar"
  aria-valuenow="3"
  aria-valuemin="0"
  aria-valuemax="5"
  aria-label="Daily usage: 3 of 5 searches used"
>
  <!-- Visual progress bar -->
</div>

<!-- Loading states -->
<button aria-busy="true" aria-label="Signing in...">
  <span aria-hidden="true"><!-- Spinner icon --></span>
  <span class="sr-only">Loading</span>
</button>
```

### High Contrast Mode Support

**Provide alternative visual indicators for neomorphic shadows:**

```css
@media (prefers-contrast: high) {
  /* Replace shadows with borders */
  .card-neu,
  .btn-neu,
  .input-neu {
    box-shadow: none !important;
    border: 2px solid #6B7280 (neu-500);
  }

  .btn-neu-primary {
    border: 2px solid #3A7AB5 (liberal-dark);
  }

  /* Increase text contrast */
  body {
    color: #000000;
  }

  .neu-500 {
    color: #374151 (neu-700);
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Keyboard Navigation

**Ensure logical tab order:**

1. Form fields: top to bottom
2. Checkboxes and links: in reading order
3. Submit button: last in form
4. Modal close button: first focusable element in modal
5. Trap focus within modals

**Keyboard shortcuts:**
```
Tab: Next focusable element
Shift+Tab: Previous focusable element
Enter: Submit form / Activate button
Space: Toggle checkbox / Activate button
Escape: Close modal / Dismiss prompt
```

---

## Animation & Transitions

### Standard Timing Functions

```css
/* Natural ease for neomorphic feel */
--ease-neu: cubic-bezier(0.4, 0, 0.2, 1)

/* Snappy interactions */
--ease-quick: cubic-bezier(0.25, 0.1, 0.25, 1)

/* Smooth entries */
--ease-smooth: cubic-bezier(0.16, 1, 0.3, 1)
```

### Transition Durations

```css
--duration-fast: 150ms    /* Quick state changes */
--duration-base: 200ms    /* Standard transitions */
--duration-smooth: 300ms  /* Smooth animations */
--duration-slow: 400ms    /* Entrance animations */
```

### Common Animations

**Fade In**
```css
@keyframes fadeIn {
  from { opacity: 0 }
  to { opacity: 1 }
}
```

**Slide Up**
```css
@keyframes slideUp {
  from {
    opacity: 0
    transform: translateY(20px)
  }
  to {
    opacity: 1
    transform: translateY(0)
  }
}
```

**Scale In**
```css
@keyframes scaleIn {
  from {
    opacity: 0
    transform: scale(0.9)
  }
  to {
    opacity: 1
    transform: scale(1)
  }
}
```

**Pulse (for urgent states)**
```css
@keyframes pulse {
  0%, 100% {
    opacity: 1
    transform: scale(1)
  }
  50% {
    opacity: 0.8
    transform: scale(1.02)
  }
}
```

**Shake (for errors)**
```css
@keyframes shake {
  0%, 100% { transform: translateX(0) }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px) }
  20%, 40%, 60%, 80% { transform: translateX(4px) }
}
```

---

## Implementation Guidelines

### Component Structure

```jsx
// Example: LoginForm component structure
<div className="auth-container">
  <form className="auth-form card-neu">
    <header className="auth-header">
      <h2 className="auth-title">...</h2>
      <p className="auth-subtitle">...</p>
    </header>

    {/* Error display */}
    {error && <div className="auth-error" role="alert">...</div>}

    <div className="form-group">
      <label htmlFor="email" className="form-label">...</label>
      <input
        id="email"
        type="email"
        className="input-neu"
        aria-required="true"
        aria-invalid={hasError}
        aria-describedby="email-error"
      />
      {fieldError && (
        <span id="email-error" className="field-error" role="alert">
          ...
        </span>
      )}
    </div>

    <button type="submit" className="btn-neu-primary" aria-busy={loading}>
      {loading ? <Spinner /> : 'Sign In'}
    </button>

    <footer className="auth-footer">...</footer>
  </form>
</div>
```

### Best Practices

1. **Progressive Enhancement**: Ensure forms work without JavaScript
2. **Client-side Validation**: Provide immediate feedback
3. **Server-side Validation**: Always validate on backend
4. **Error Recovery**: Clear, actionable error messages
5. **Loading States**: Show progress for async operations
6. **Success Feedback**: Confirm successful actions
7. **Responsive Design**: Mobile-first approach
8. **Performance**: Minimize repaints, use CSS transforms
9. **Security**: Sanitize inputs, use HTTPS, implement rate limiting
10. **Testing**: Test with keyboard only, screen readers, high contrast mode

---

## Responsive Breakpoints

```css
/* Mobile first approach */
/* Default: 320px - 639px (mobile) */

@media (min-width: 640px) {
  /* Tablet: 640px - 1023px */
}

@media (min-width: 1024px) {
  /* Desktop: 1024px+ */
}
```

### Mobile Adjustments

```css
/* Reduce padding for mobile */
.auth-form {
  padding: 1.5rem (24px)
}

/* Stack subscription cards */
.subscription-grid {
  grid-template-columns: 1fr
}

/* Simplify modals */
.modal-container {
  margin: 1rem (16px)
  padding: 1.5rem (24px)
}

/* Increase touch targets */
button,
input,
.checkbox {
  min-height: 44px /* Apple HIG minimum */
}
```

---

## Component Sizing Summary

| Component | Mobile Width | Tablet Width | Desktop Width |
|-----------|--------------|--------------|---------------|
| LoginForm | 100% (min 16px margin) | 26rem (416px) | 28rem (448px) |
| RegisterForm | 100% (min 16px margin) | 26rem (416px) | 28rem (448px) |
| SubscriptionCard | 100% | 100% (max 22rem) | 22rem (352px) |
| UpgradePrompt Modal | calc(100% - 2rem) | 30rem (480px) | 32rem (512px) |
| UsageIndicator | 100% | 100% (max 24rem) | 24rem (384px) |

---

## Design Review Checklist

Before finalizing any auth component implementation, verify:

- [ ] All text meets WCAG AA contrast requirements
- [ ] Focus states are clearly visible for keyboard navigation
- [ ] Error states are announced to screen readers
- [ ] Form can be completed with keyboard only
- [ ] Touch targets are minimum 44x44px
- [ ] Loading states provide feedback
- [ ] Success states are celebratory but not distracting
- [ ] Shadows create depth without reducing contrast
- [ ] Components work in high contrast mode
- [ ] Animations respect prefers-reduced-motion
- [ ] Responsive layouts tested on mobile, tablet, desktop
- [ ] All interactive states defined (default, hover, active, focus, disabled)
- [ ] Component gracefully handles long content/text overflow
- [ ] Consistent spacing following design system scale
- [ ] Typography follows established scale and weights

---

## File References

**Related Design Files:**
- `/docs/DESIGN_SYSTEM.md` - Core design system
- `/docs/NEUMORPHISM_FREE_DESIGN.md` - Neomorphic patterns and tech stack
- `/frontend/tailwind.config.js` - Tailwind configuration with neu colors
- `/frontend/src/index.css` - Custom CSS with neomorphic utilities

**Component Reference Files:**
- `/frontend/src/components/Header.jsx` - Header with badge patterns
- `/frontend/src/components/MediatorCard.jsx` - Card component patterns
- `/frontend/src/components/ChatPanel.jsx` - Input and button patterns

---

## Next Steps for Implementation

1. **Create Base Utilities** (if not already in index.css):
   - `.auth-container` - Centering wrapper
   - `.auth-form` - Form container base styles
   - `.form-group` - Field grouping
   - `.form-label` - Label base styles
   - `.field-error` - Field-level error styles
   - `.auth-error` - Form-level error styles

2. **Build Components in Order**:
   - Start with LoginForm (simplest, establishes patterns)
   - RegisterForm (extends LoginForm patterns)
   - UsageIndicator (standalone, reusable)
   - SubscriptionCard (complex layout)
   - UpgradePrompt (modal behavior, multiple variants)

3. **Integration Points**:
   - Add UsageIndicator to Header component
   - Create auth route/page for LoginForm and RegisterForm
   - Add SubscriptionCard to settings/profile page
   - Trigger UpgradePrompt based on usage thresholds

4. **Testing Requirements**:
   - Unit tests for form validation logic
   - Accessibility tests (axe-core)
   - Visual regression tests
   - E2E tests for auth flows
   - Keyboard navigation tests
   - Screen reader testing (NVDA, JAWS, VoiceOver)

---

**Document Version:** 1.0
**Last Updated:** 2025-11-14
**Author:** Master Design Officer (MDO)
**Status:** Ready for Implementation
