# FairMediator Design System

## Apple-Inspired Design Principles

FairMediator follows Apple's design philosophy with emphasis on:
- **Generous whitespace** for breathing room
- **Subtle, refined color palette** using neutrals
- **Clean typography** with SF Pro system fonts
- **Smooth animations** with natural easing
- **Minimal shadows** with soft, layered depth
- **Rounded corners** (Apple's signature 12px radius)

---

## Color Palette

### Neutrals (Apple Gray Scale)

```css
apple-gray-50:  #FAFAFA  /* Lightest backgrounds */
apple-gray-100: #F5F5F7  /* Light background (Apple's favorite) */
apple-gray-200: #E8E8ED  /* Subtle borders */
apple-gray-300: #D2D2D7  /* Borders */
apple-gray-400: #AEAEB2  /* Disabled text */
apple-gray-500: #86868B  /* Secondary text */
apple-gray-600: #6E6E73  /* Tertiary text */
apple-gray-700: #515154  /* Dark text */
apple-gray-800: #1D1D1F  /* Primary text (nearly black) */
apple-gray-900: #000000  /* Pure black */
```

### Semantic Colors

**Liberal (Blue)**
```css
liberal-light:   #007AFF  /* Apple's signature blue */
liberal-DEFAULT: #0071E3  /* Deeper blue */
liberal-dark:    #0051A8
```

**Conservative (Red)**
```css
conservative-light:   #FF3B30  /* Apple's red */
conservative-DEFAULT: #D70015
conservative-dark:    #A00012
```

**Neutral**
```css
neutral-light:   #86868B
neutral-DEFAULT: #6E6E73
neutral-dark:    #515154
```

**Accents**
```css
accent-green:  #34C759  /* Success/verified */
accent-orange: #FF9500  /* Warning */
accent-yellow: #FFCC00  /* Caution */
```

---

## Typography

### Font Family
Primary: `-apple-system, BlinkMacSystemFont, SF Pro Display, SF Pro Text`

This ensures native system fonts on all Apple devices.

### Type Scale
```css
xs:   0.75rem  (12px) - Captions, small labels
sm:   0.875rem (14px) - Secondary text
base: 1rem     (16px) - Body text
lg:   1.125rem (18px) - Subheadings
xl:   1.25rem  (20px) - Card titles
2xl:  1.5rem   (24px) - Section headers
3xl:  1.875rem (30px) - Page titles
4xl:  2.25rem  (36px) - Hero text
5xl:  3rem     (48px) - Display
```

### Letter Spacing
Apple uses tight letter spacing for a clean look:
- Large text: Negative spacing (-0.004em to -0.002em)
- Body text: Minimal positive (0.004em to 0.006em)

---

## Spacing

### Apple's Generous Whitespace
```css
Base scale: 4px increments (0.25rem)

px:   1px    /* Borders */
0.5:  2px
1:    4px
2:    8px    /* Tight spacing */
3:    12px
4:    16px   /* Comfortable spacing */
5:    20px
6:    24px   /* Section spacing */
8:    32px   /* Large spacing */
10:   40px
12:   48px   /* Very large spacing */
```

**Component Padding:**
- Cards: `p-5` to `p-6` (20-24px)
- Buttons: `px-5 py-2.5` (20px × 10px)
- Inputs: `px-4 py-2.5` (16px × 10px)
- Sections: `px-6 py-6` (24px)

---

## Border Radius

Apple's signature rounded corners:

```css
apple-sm: 0.375rem  (6px)  - Small elements
apple:    0.75rem   (12px) - Standard (most common)
apple-lg: 1.125rem  (18px) - Large cards
apple-xl: 1.5rem    (24px) - Hero sections
```

**Usage:**
- Buttons: `rounded-apple` (12px)
- Cards: `rounded-apple-lg` or `rounded-apple-xl` (18-24px)
- Inputs: `rounded-apple` (12px)
- Badges: `rounded-full`

---

## Shadows

Apple uses subtle, layered shadows:

```css
apple-sm: Minimal depth for subtle elevation
apple:    Standard card elevation
apple-md: Prominent cards
apple-lg: Modals and overlays
apple-xl: Major floating elements
```

**Shadow Values:**
```css
shadow-apple-sm: 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)
shadow-apple:    0 4px 6px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.03)
shadow-apple-md: 0 10px 15px rgba(0,0,0,0.08), 0 4px 6px rgba(0,0,0,0.04)
```

---

## Components

### Buttons

**Primary (btn-apple)**
- Background: `liberal-light` (#007AFF)
- Text: White
- Padding: `px-5 py-2.5`
- Radius: `rounded-apple`
- Hover: Slightly darker
- Active: Scale down to 98% (tactile feedback)

**Secondary (btn-apple-secondary)**
- Background: `apple-gray-100`
- Text: `apple-gray-800`
- Same padding and radius
- Hover: `apple-gray-200`

### Cards

**Standard Card (card-apple)**
- Background: White
- Border: `border-apple-gray-200/50` (subtle)
- Radius: `rounded-apple-lg`
- Padding: `p-6`
- Shadow: `shadow-apple`
- Hover: `shadow-apple-md`

### Inputs

**Text Input (input-apple)**
- Background: White
- Border: `border-apple-gray-300`
- Radius: `rounded-apple`
- Padding: `px-4 py-2.5`
- Focus ring: 2px `liberal-light`
- Placeholder: `apple-gray-400`

### Badges

Small, pill-shaped labels:
- Padding: `px-2.5 py-1`
- Size: `text-xs`
- Radius: `rounded-full`
- Border: 1px with matching color at 30% opacity

---

## Animation

### Timing Functions
Apple uses **cubic-bezier(0.4, 0, 0.2, 1)** for natural easing.

### Durations
- Quick transitions: 200ms
- Standard: 300ms
- Smooth: 400ms

### Keyframes

**Slide In:**
```css
from: opacity 0, translateY(8px)
to:   opacity 1, translateY(0)
duration: 400ms
```

**Fade In:**
```css
from: opacity 0
to:   opacity 1
duration: 300ms
```

**Button Press:**
```css
active: scale(0.98)
```

---

## Layout Guidelines

### Container Widths
- Max width: `1400px` (Apple's typical content width)
- Padding: `px-6 lg:px-8` (24-32px)

### Grid Spacing
- Gap between cards: `gap-6 lg:gap-8` (24-32px)
- Section spacing: `py-8 lg:py-10` (32-40px)

### Responsive Breakpoints
```css
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

---

## Accessibility

### Focus States
- Outline: 2px solid `#007AFF`
- Offset: 2px
- All interactive elements have visible focus

### Color Contrast
- Primary text on white: 14.5:1 (WCAG AAA)
- Secondary text: Minimum 4.5:1 (WCAG AA)
- Disabled text: 3:1 minimum

### Font Smoothing
```css
-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;
```

---

## Usage Examples

### Primary Button
```jsx
<button className="btn-apple">
  Submit
</button>
```

### Card
```jsx
<div className="card-apple">
  <h3>Card Title</h3>
  <p>Card content...</p>
</div>
```

### Input
```jsx
<input 
  type="text" 
  placeholder="Search..."
  className="input-apple"
/>
```

### Badge
```jsx
<span className="badge-apple badge-liberal">
  Liberal
</span>
```

---

## Design Principles Summary

1. **Whitespace is your friend** - Don't crowd elements
2. **Use neutral grays** - Let content stand out
3. **Subtle shadows** - Depth without drama
4. **Rounded corners** - 12px is the standard
5. **Smooth animations** - Natural, quick, delightful
6. **System fonts** - Native feel on Apple devices
7. **Clear hierarchy** - Typography does the work
8. **Accessibility first** - High contrast, clear focus states

---

## Authentication Components

FairMediator includes a comprehensive set of authentication UI components following neomorphic design principles. See detailed specifications in:

**[AUTH_COMPONENTS_DESIGN.md](/docs/AUTH_COMPONENTS_DESIGN.md)**

Components include:
- **LoginForm** - Email/password authentication with Remember Me
- **RegisterForm** - Account creation with password strength indicator
- **SubscriptionCard** - Tier comparison cards (Free vs Premium)
- **UpgradePrompt** - Modal and banner variants for upgrade CTAs
- **UsageIndicator** - Daily usage tracking with progress visualization

All components maintain:
- Neomorphic visual language (soft shadows, subtle depth)
- WCAG AA accessibility standards
- Keyboard navigation support
- Responsive design (mobile-first)
- Loading and error states
- High contrast mode support

---

## References

This design system is inspired by:
- Apple Human Interface Guidelines
- apple.com design patterns
- macOS Big Sur+ visual language
- iOS 14+ design system

**Key Apple Design Resources:**
- [Apple HIG](https://developer.apple.com/design/human-interface-guidelines/)
- [SF Pro Font](https://developer.apple.com/fonts/)
- [Apple Design Resources](https://developer.apple.com/design/resources/)

**FairMediator Design Documentation:**
- [Neumorphism & Free Stack Guide](/docs/NEUMORPHISM_FREE_DESIGN.md)
- [Authentication Components Specification](/docs/AUTH_COMPONENTS_DESIGN.md)
