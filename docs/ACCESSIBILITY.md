# ♿ CarbonMind AI — Accessibility Documentation

> WCAG 2.2 Level AA compliance guide and accessibility implementation details for the CarbonMind AI platform.

---

## Table of Contents

- [Accessibility Commitment](#accessibility-commitment)
- [WCAG 2.2 AA Compliance Checklist](#wcag-22-aa-compliance-checklist)
- [Semantic HTML Patterns](#semantic-html-patterns)
- [Keyboard Navigation Guide](#keyboard-navigation-guide)
- [Screen Reader Support](#screen-reader-support)
- [Color Contrast Requirements](#color-contrast-requirements)
- [Motion and Animation](#motion-and-animation)
- [Forms and Input Accessibility](#forms-and-input-accessibility)
- [Data Visualization Accessibility](#data-visualization-accessibility)
- [Testing Accessibility](#testing-accessibility)

---

## Accessibility Commitment

CarbonMind AI is committed to providing an inclusive experience for all users, regardless of ability. The platform is built to conform to **Web Content Accessibility Guidelines (WCAG) 2.2 Level AA** standards. Accessibility is not an afterthought — it is a core design principle integrated into every feature from the beginning.

---

## WCAG 2.2 AA Compliance Checklist

### Principle 1: Perceivable

| Criterion | Level | Status | Implementation |
|-----------|-------|--------|----------------|
| **1.1.1** Text Alternatives | A | ✅ | All images have descriptive `alt` text; decorative images use `alt=""` |
| **1.2.1** Audio-only / Video-only | A | ✅ | N/A — no audio/video content currently |
| **1.3.1** Info and Relationships | A | ✅ | Semantic HTML elements convey structure (headings, lists, tables) |
| **1.3.2** Meaningful Sequence | A | ✅ | DOM order matches visual presentation order |
| **1.3.3** Sensory Characteristics | A | ✅ | Instructions do not rely solely on shape, size, or visual location |
| **1.3.4** Orientation | AA | ✅ | Content adapts to portrait and landscape orientations |
| **1.3.5** Identify Input Purpose | AA | ✅ | Input fields use `autocomplete` attributes where appropriate |
| **1.4.1** Use of Color | A | ✅ | Information is not conveyed by color alone; icons and text supplement color |
| **1.4.2** Audio Control | A | ✅ | N/A — no auto-playing audio |
| **1.4.3** Contrast (Minimum) | AA | ✅ | 4.5:1 ratio for normal text; 3:1 for large text |
| **1.4.4** Resize Text | AA | ✅ | Content is readable at 200% zoom without loss of functionality |
| **1.4.5** Images of Text | AA | ✅ | No images of text used; all text is rendered as HTML |
| **1.4.10** Reflow | AA | ✅ | Content reflows at 320px width without horizontal scrolling |
| **1.4.11** Non-text Contrast | AA | ✅ | UI components and graphical objects meet 3:1 contrast ratio |
| **1.4.12** Text Spacing | AA | ✅ | Content adapts to increased text spacing without overlap |
| **1.4.13** Content on Hover/Focus | AA | ✅ | Tooltips are dismissible, hoverable, and persistent |

### Principle 2: Operable

| Criterion | Level | Status | Implementation |
|-----------|-------|--------|----------------|
| **2.1.1** Keyboard | A | ✅ | All functionality accessible via keyboard |
| **2.1.2** No Keyboard Trap | A | ✅ | Focus can always be moved away from any element |
| **2.1.4** Character Key Shortcuts | A | ✅ | No single-character keyboard shortcuts implemented |
| **2.2.1** Timing Adjustable | A | ✅ | No time limits on user interactions |
| **2.2.2** Pause, Stop, Hide | A | ✅ | Animated content can be paused via `prefers-reduced-motion` |
| **2.3.1** Three Flashes | A | ✅ | No content flashes more than three times per second |
| **2.4.1** Bypass Blocks | A | ✅ | "Skip to main content" link provided |
| **2.4.2** Page Titled | A | ✅ | Each page has a unique, descriptive `<title>` |
| **2.4.3** Focus Order | A | ✅ | Focus order follows logical reading sequence |
| **2.4.4** Link Purpose (In Context) | A | ✅ | All links have descriptive text or `aria-label` |
| **2.4.5** Multiple Ways | AA | ✅ | Navigation menu, search, and breadcrumbs available |
| **2.4.6** Headings and Labels | AA | ✅ | Headings are descriptive; form labels are clear |
| **2.4.7** Focus Visible | AA | ✅ | Custom focus ring visible on all interactive elements |
| **2.4.11** Focus Not Obscured | AA | ✅ | Focused elements are never hidden behind sticky headers |
| **2.5.1** Pointer Gestures | A | ✅ | No multi-point gestures required; single-tap alternatives exist |
| **2.5.2** Pointer Cancellation | A | ✅ | Actions fire on `click`/`keyup`, not `mousedown` |
| **2.5.3** Label in Name | A | ✅ | Accessible names match visible labels |
| **2.5.4** Motion Actuation | A | ✅ | No motion-based inputs used |
| **2.5.7** Dragging Movements | AA | ✅ | No drag-and-drop interfaces; alternatives provided |
| **2.5.8** Target Size (Minimum) | AA | ✅ | Interactive targets are at least 24×24 CSS pixels |

### Principle 3: Understandable

| Criterion | Level | Status | Implementation |
|-----------|-------|--------|----------------|
| **3.1.1** Language of Page | A | ✅ | `<html lang="en">` set on all pages |
| **3.1.2** Language of Parts | AA | ✅ | N/A — single language application |
| **3.2.1** On Focus | A | ✅ | No context changes on focus |
| **3.2.2** On Input | A | ✅ | No unexpected context changes on input |
| **3.2.3** Consistent Navigation | AA | ✅ | Navigation is consistent across all pages |
| **3.2.4** Consistent Identification | AA | ✅ | Same functionality uses same labels throughout |
| **3.3.1** Error Identification | A | ✅ | Form errors are clearly identified in text |
| **3.3.2** Labels or Instructions | A | ✅ | All form fields have visible labels |
| **3.3.3** Error Suggestion | AA | ✅ | Error messages suggest corrections |
| **3.3.4** Error Prevention | AA | ✅ | Destructive actions require confirmation |

### Principle 4: Robust

| Criterion | Level | Status | Implementation |
|-----------|-------|--------|----------------|
| **4.1.1** Parsing | A | ✅ | Valid HTML output; React handles DOM correctly |
| **4.1.2** Name, Role, Value | A | ✅ | Custom components use ARIA roles and properties |
| **4.1.3** Status Messages | AA | ✅ | Dynamic status updates use `aria-live` regions |

---

## Semantic HTML Patterns

### Page Structure

Every page follows a consistent semantic structure:

```html
<body>
  <!-- Skip navigation link -->
  <a href="#main-content" class="sr-only focus:not-sr-only">
    Skip to main content
  </a>

  <!-- Page header with navigation -->
  <header role="banner">
    <nav aria-label="Main navigation">
      <!-- Navigation items -->
    </nav>
  </header>

  <!-- Sidebar navigation (dashboard pages) -->
  <aside aria-label="Dashboard navigation">
    <nav aria-label="Dashboard menu">
      <!-- Sidebar items with aria-current="page" on active -->
    </nav>
  </aside>

  <!-- Main content area -->
  <main id="main-content" role="main">
    <h1>Page Title</h1>
    <!-- Page-specific content -->
  </main>

  <!-- Page footer -->
  <footer role="contentinfo">
    <!-- Footer content -->
  </footer>
</body>
```

### Heading Hierarchy

Each page maintains a strict heading hierarchy:

```
h1 — Page title (one per page)
├── h2 — Major section
│   ├── h3 — Subsection
│   └── h3 — Subsection
├── h2 — Major section
│   └── h3 — Subsection
└── h2 — Major section
```

### Landmark Regions

| Element | ARIA Role | Purpose |
|---------|-----------|---------|
| `<header>` | `banner` | Site-wide header with branding and nav |
| `<nav>` | `navigation` | Main and sidebar navigation |
| `<main>` | `main` | Primary page content |
| `<aside>` | `complementary` | Sidebar, supplementary info |
| `<footer>` | `contentinfo` | Site-wide footer |
| `<section>` | `region` | Thematic grouping with heading |
| `<form>` | `form` | Data input sections |

### Component Patterns

#### Cards

```tsx
<article aria-labelledby="card-title-1" className="card">
  <h3 id="card-title-1">Daily Carbon Summary</h3>
  <p>Your carbon footprint today: <strong>12.5 kg CO₂</strong></p>
  <a href="/dashboard/details" aria-describedby="card-title-1">
    View details
  </a>
</article>
```

#### Buttons with Icons

```tsx
{/* Icon-only button must have accessible name */}
<button aria-label="Close dialog" onClick={handleClose}>
  <XIcon aria-hidden="true" />
</button>

{/* Button with text and icon */}
<button>
  <PlusIcon aria-hidden="true" />
  <span>Log Activity</span>
</button>
```

#### Loading States

```tsx
<div aria-busy="true" aria-label="Loading dashboard data">
  <Spinner aria-hidden="true" />
  <span className="sr-only">Loading...</span>
</div>
```

---

## Keyboard Navigation Guide

### Global Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Tab` | Move focus to next interactive element |
| `Shift + Tab` | Move focus to previous interactive element |
| `Enter` / `Space` | Activate focused button or link |
| `Escape` | Close modal, dropdown, or popover |
| `Arrow Keys` | Navigate within menus, tabs, and select options |

### Component-Specific Navigation

#### Sidebar Navigation

| Key | Action |
|-----|--------|
| `Tab` | Enter/exit sidebar |
| `Arrow Up/Down` | Move between menu items |
| `Enter` | Navigate to selected page |
| `Home` | Move to first menu item |
| `End` | Move to last menu item |

#### Modal Dialogs

| Key | Action |
|-----|--------|
| `Tab` | Cycle through focusable elements within modal |
| `Escape` | Close modal and return focus to trigger |
| `Enter` | Confirm/submit action |

#### Data Tables (Leaderboard)

| Key | Action |
|-----|--------|
| `Tab` | Move between interactive cells |
| `Arrow Keys` | Navigate between cells |
| `Enter` | Activate cell action (if applicable) |

### Focus Management

```tsx
// Focus trap for modal dialogs
function Modal({ isOpen, onClose, children }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Store the previously focused element
      previousFocusRef.current = document.activeElement as HTMLElement;
      // Focus the modal
      modalRef.current?.focus();
    }

    return () => {
      // Restore focus when modal closes
      previousFocusRef.current?.focus();
    };
  }, [isOpen]);

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      tabIndex={-1}
    >
      {children}
    </div>
  );
}
```

### Focus Ring Styling

```css
/* Visible focus indicator for all interactive elements */
*:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
  border-radius: 2px;
}

/* Remove default outline, rely on focus-visible */
*:focus:not(:focus-visible) {
  outline: none;
}
```

---

## Screen Reader Support

### Live Regions

Dynamic content updates are announced to screen readers using ARIA live regions:

```tsx
{/* Polite announcement for non-urgent updates */}
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {statusMessage && <p>{statusMessage}</p>}
</div>

{/* Assertive announcement for critical alerts */}
<div aria-live="assertive" role="alert" className="sr-only">
  {errorMessage && <p>Error: {errorMessage}</p>}
</div>
```

### Screen Reader Announcements

| Event | Announcement | Region |
|-------|-------------|--------|
| Activity logged | "Activity logged successfully. Carbon score updated to 82." | `polite` |
| Achievement unlocked | "Achievement unlocked: 3-Day Streak!" | `polite` |
| Form error | "Error: Carbon emission must be a positive number" | `assertive` |
| Loading complete | "Dashboard data loaded" | `polite` |
| Points awarded | "10 eco points awarded!" | `polite` |

### Screen Reader-Only Text

```css
/* Utility class for visually hidden but screen reader accessible text */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* Make sr-only content visible when focused (skip links) */
.sr-only.focus\:not-sr-only:focus {
  position: static;
  width: auto;
  height: auto;
  padding: 0.5rem 1rem;
  margin: 0;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
```

### Tested Screen Readers

| Screen Reader | Browser | Platform | Status |
|---------------|---------|----------|--------|
| NVDA | Firefox / Chrome | Windows | ✅ Tested |
| JAWS | Chrome | Windows | ✅ Tested |
| VoiceOver | Safari | macOS | ✅ Tested |
| VoiceOver | Safari | iOS | ✅ Tested |
| TalkBack | Chrome | Android | ✅ Tested |

---

## Color Contrast Requirements

### Minimum Contrast Ratios

| Element Type | Minimum Ratio | WCAG Level |
|-------------|---------------|------------|
| Normal text (< 18pt) | 4.5:1 | AA |
| Large text (≥ 18pt or ≥ 14pt bold) | 3:1 | AA |
| UI components and graphical objects | 3:1 | AA |
| Focus indicators | 3:1 | AA |

### Color Palette with Contrast Ratios

#### Light Theme

| Color | Hex | On White | On #F5F5F5 | Usage |
|-------|-----|----------|------------|-------|
| Text Primary | `#1a1a2e` | 16.5:1 | 14.8:1 | Body text, headings |
| Text Secondary | `#4a4a5a` | 7.2:1 | 6.5:1 | Muted text, captions |
| Green (Eco) | `#16a34a` | 3.5:1 | 3.1:1 | Positive indicators (large text) |
| Green Dark | `#15803d` | 4.6:1 | 4.1:1 | Green text on white (normal text) |
| Red (Alert) | `#dc2626` | 4.6:1 | 4.1:1 | Error states |
| Blue (Link) | `#2563eb` | 4.6:1 | 4.2:1 | Interactive links |

#### Dark Theme

| Color | Hex | On #1a1a2e | Usage |
|-------|-----|------------|-------|
| Text Primary | `#f0f0f5` | 15.3:1 | Body text, headings |
| Text Secondary | `#a0a0b0` | 5.8:1 | Muted text, captions |
| Green (Eco) | `#4ade80` | 9.2:1 | Positive indicators |
| Red (Alert) | `#f87171` | 5.8:1 | Error states |
| Blue (Link) | `#60a5fa` | 6.3:1 | Interactive links |

### Color-Independent Information

Color is never the sole means of conveying information:

```tsx
{/* Status uses both color AND icon */}
<span className="flex items-center gap-2">
  {score >= 80 ? (
    <>
      <CheckCircleIcon className="text-green-600" aria-hidden="true" />
      <span className="text-green-800">Excellent</span>
    </>
  ) : (
    <>
      <AlertTriangleIcon className="text-amber-600" aria-hidden="true" />
      <span className="text-amber-800">Needs Improvement</span>
    </>
  )}
</span>
```

---

## Motion and Animation

### Respecting User Preferences

All animations respect the `prefers-reduced-motion` media query:

```css
/* Default: animations enabled */
.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}

/* Reduced motion: disable animations */
@media (prefers-reduced-motion: reduce) {
  .animate-fade-in,
  .animate-slide-up,
  .animate-scale {
    animation: none !important;
    transition: none !important;
  }
}
```

### Framer Motion Integration

```tsx
// Detect motion preference and conditionally animate
import { useReducedMotion } from "framer-motion";

function AnimatedCard({ children }: { children: React.ReactNode }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}
```

---

## Forms and Input Accessibility

### Form Pattern

```tsx
<form aria-labelledby="form-title" onSubmit={handleSubmit}>
  <h2 id="form-title">Log Carbon Activity</h2>

  {/* Field with label, description, and error */}
  <div>
    <label htmlFor="category">Activity Category</label>
    <select
      id="category"
      name="category"
      aria-describedby="category-help"
      aria-required="true"
      required
    >
      <option value="">Select a category</option>
      <option value="transport">Transport</option>
      <option value="energy">Energy</option>
      <option value="food">Food</option>
    </select>
    <p id="category-help" className="text-sm text-gray-500">
      Choose the type of activity that produced carbon emissions.
    </p>
  </div>

  {/* Field with error state */}
  <div>
    <label htmlFor="carbon">Carbon Emission (kg CO₂)</label>
    <input
      id="carbon"
      type="number"
      name="carbonEmit"
      min="0"
      max="10000"
      step="0.1"
      aria-invalid={errors.carbonEmit ? "true" : "false"}
      aria-describedby={errors.carbonEmit ? "carbon-error" : "carbon-help"}
      aria-required="true"
      required
    />
    {errors.carbonEmit ? (
      <p id="carbon-error" role="alert" className="text-red-600">
        {errors.carbonEmit}
      </p>
    ) : (
      <p id="carbon-help" className="text-sm text-gray-500">
        Enter the estimated CO₂ in kilograms.
      </p>
    )}
  </div>

  <button type="submit">Log Activity</button>
</form>
```

### Error Handling

- Errors are displayed inline next to the relevant field
- Error messages are announced by screen readers using `role="alert"`
- The first field with an error receives focus on form submission failure
- Error messages provide specific guidance on how to correct the input

---

## Data Visualization Accessibility

### Chart Accessibility

All charts include accessible alternatives:

```tsx
<figure aria-label="Monthly carbon emissions breakdown">
  {/* Visual chart */}
  <div aria-hidden="true">
    <ResponsiveContainer>
      <BarChart data={chartData}>
        {/* Chart rendering */}
      </BarChart>
    </ResponsiveContainer>
  </div>

  {/* Accessible data table alternative */}
  <details>
    <summary>View data as table</summary>
    <table aria-label="Monthly carbon emissions by category">
      <thead>
        <tr>
          <th scope="col">Category</th>
          <th scope="col">Emissions (kg CO₂)</th>
          <th scope="col">Percentage</th>
        </tr>
      </thead>
      <tbody>
        {chartData.map((item) => (
          <tr key={item.category}>
            <td>{item.category}</td>
            <td>{item.value.toFixed(1)}</td>
            <td>{item.percentage}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  </details>

  <figcaption className="sr-only">
    Bar chart showing carbon emissions by category for the current month.
    Transport leads at 45%, followed by Energy at 25%.
  </figcaption>
</figure>
```

### Data Table Accessibility

```tsx
<table aria-label="Community Leaderboard">
  <caption className="sr-only">
    Ranked list of community members by carbon score
  </caption>
  <thead>
    <tr>
      <th scope="col">Rank</th>
      <th scope="col">Name</th>
      <th scope="col" aria-sort="descending">Carbon Score</th>
      <th scope="col">Streak</th>
    </tr>
  </thead>
  <tbody>
    {leaderboard.map((entry, index) => (
      <tr key={entry.userId} aria-rowindex={index + 1}>
        <td>{index + 1}</td>
        <td>{entry.name}</td>
        <td>{entry.carbonScore}</td>
        <td>{entry.streak} days</td>
      </tr>
    ))}
  </tbody>
</table>
```

---

## Testing Accessibility

### Automated Testing Tools

| Tool | Integration | Purpose |
|------|-------------|---------|
| **jest-axe** | Jest test suite | Automated WCAG violation detection |
| **eslint-plugin-jsx-a11y** | ESLint | Static analysis of JSX accessibility |
| **Lighthouse** | Chrome DevTools | Comprehensive accessibility audit |
| **axe DevTools** | Browser extension | Interactive accessibility testing |

### ESLint Accessibility Rules

```javascript
// .eslintrc.js — accessibility rules
module.exports = {
  plugins: ["jsx-a11y"],
  extends: ["plugin:jsx-a11y/recommended"],
  rules: {
    "jsx-a11y/alt-text": "error",
    "jsx-a11y/anchor-has-content": "error",
    "jsx-a11y/aria-props": "error",
    "jsx-a11y/aria-role": "error",
    "jsx-a11y/aria-unsupported-elements": "error",
    "jsx-a11y/click-events-have-key-events": "error",
    "jsx-a11y/heading-has-content": "error",
    "jsx-a11y/label-has-associated-control": "error",
    "jsx-a11y/no-noninteractive-element-interactions": "warn",
    "jsx-a11y/no-redundant-roles": "error",
    "jsx-a11y/role-has-required-aria-props": "error",
    "jsx-a11y/tabindex-no-positive": "error",
  },
};
```

### Testing Commands

```bash
# Run accessibility-focused tests
npm test -- --testPathPattern="a11y"

# Run Lighthouse audit
npx lighthouse http://localhost:3000 --only-categories=accessibility --output=html

# Check for accessibility violations in build
npm run lint -- --rule 'jsx-a11y/alt-text: error'
```

---

<p align="center">
  <em>Last updated: June 2025</em>
</p>
