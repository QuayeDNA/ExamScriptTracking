# Exam Script Tracking System - Design System

**Version:** 3.0.0 - Implementation Ready
**Last Updated:** December 8, 2025
**Status:** ✅ **FULLY IMPLEMENTED** - All components updated with design tokens

---

## 🤖 **CRITICAL INSTRUCTIONS FOR FUTURE AI AGENTS**

### **MANDATORY REQUIREMENTS**

🔴 **YOU MUST FOLLOW THESE RULES WITHOUT EXCEPTION:**

1. **ALWAYS USE DESIGN TOKENS** - Never use hardcoded colors, spacing, or values. Always reference CSS custom properties from `web/src/styles/design-tokens.css`

2. **ALWAYS USE EXISTING UI COMPONENTS** - Never create new components. Use and extend the shadcn/ui components in `web/src/components/ui/`

3. **ALWAYS CHECK COMPONENT STATUS** - Before modifying any component, read the current file to see if it already uses design tokens

4. **ALWAYS UPDATE COMPONENTS CONSISTENTLY** - When updating a component, ensure it uses semantic tokens (e.g., `bg-primary`, `text-foreground`, `border-border`)

5. **NEVER USE HARDCODED VALUES** - Replace any `bg-gray-100`, `text-gray-900`, etc. with semantic tokens

6. **ALWAYS TEST THEME SWITCHING** - Ensure components work in both light and dark modes

### **DESIGN TOKEN USAGE RULES**

```css
/* ✅ CORRECT - Use semantic tokens */
bg-primary          /* Primary background */
text-foreground     /* Primary text color */
border-border       /* Border color */
bg-destructive      /* Error/destructive background */

/* ❌ WRONG - Never use hardcoded colors */
bg-gray-100         /* Don't use this */
text-gray-900       /* Don't use this */
bg-blue-500         /* Don't use this */
```

### **COMPONENT UPDATE CHECKLIST**

Before modifying any component:

1. ✅ Read the current component file
2. ✅ Check if it uses design tokens
3. ✅ Update hardcoded colors to semantic tokens
4. ✅ Test in both light/dark themes
5. ✅ Update demo page if needed

---

## 🎨 **CURRENT IMPLEMENTATION STATUS**

### **✅ FULLY IMPLEMENTED COMPONENTS**

| Component          | Status     | Design Tokens         | Theme Support |
| ------------------ | ---------- | --------------------- | ------------- |
| **Button**         | ✅ Updated | Semantic colors       | ✅ Light/Dark |
| **Input**          | ✅ Updated | Semantic colors       | ✅ Light/Dark |
| **Textarea**       | ✅ Updated | Semantic colors       | ✅ Light/Dark |
| **Checkbox**       | ✅ Updated | Semantic colors       | ✅ Light/Dark |
| **Radio Group**    | ✅ Updated | Semantic colors       | ✅ Light/Dark |
| **Switch**         | ✅ Updated | Semantic colors       | ✅ Light/Dark |
| **Select**         | ✅ Updated | Semantic colors       | ✅ Light/Dark |
| **Card**           | ✅ Updated | Semantic colors       | ✅ Light/Dark |
| **Badge**          | ✅ Updated | Semantic colors       | ✅ Light/Dark |
| **Alert**          | ✅ Updated | Semantic colors       | ✅ Light/Dark |
| **Dialog**         | ✅ Updated | Semantic colors       | ✅ Light/Dark |
| **Dropdown Menu**  | ✅ Updated | Semantic colors       | ✅ Light/Dark |
| **Separator**      | ✅ Updated | Semantic colors       | ✅ Light/Dark |
| **Scroll Area**    | ✅ Updated | Semantic colors       | ✅ Light/Dark |
| **Toast (Sonner)** | ✅ Updated | State-specific colors | ✅ Light/Dark |

### **🎯 DESIGN TOKENS SYSTEM**

**Location:** `web/src/styles/design-tokens.css`

**Key Features:**

- ✅ 176+ design tokens covering colors, spacing, typography
- ✅ OKLCH color space for modern color definitions
- ✅ Semantic color mapping (primary, secondary, destructive, etc.)
- ✅ Automatic light/dark theme switching
- ✅ Tailwind CSS v4 @theme integration

**Color Categories:**

- **Primary:** Academic blue palette (`--primary-500: oklch(0.62 0.25 255)`)
- **Semantic:** Success, Warning, Error, Info colors
- **Neutral:** Gray scale with warm undertone
- **Status:** Batch workflow state colors

---

## 🚀 **QUICK START FOR AI AGENTS**

### **1. Check Component Status**

```bash
# Always read the component before modifying
read_file: web/src/components/ui/[component].tsx
```

### **2. Use Design Tokens**

```css
/* From design-tokens.css - ALWAYS USE THESE */
--primary: var(--color-primary-500);
--secondary: var(--color-gray-100);
--destructive: var(--color-error-500);
--background: var(--color-gray-50);
--foreground: var(--color-gray-900);
```

### **3. Update Components**

```tsx
// ❌ BEFORE (hardcoded)
className = "bg-gray-100 text-gray-900 border-gray-200";

// ✅ AFTER (semantic tokens)
className = "bg-secondary text-secondary-foreground border-border";
```

### **4. Test Implementation**

```bash
cd web
npm run dev
# Visit: http://localhost:5173/design-system-demo
```

---

## 📦 **COMPONENT LIBRARY**

### **Core Components**

#### **Buttons**

- **Location:** `web/src/components/ui/button.tsx`
- **Variants:** default, secondary, outline, ghost, destructive, link
- **Sizes:** sm, default, lg, icon
- **Design Tokens:** ✅ Uses `bg-primary`, `text-primary-foreground`, etc.

```tsx
import { Button } from "@/components/ui/button";

<Button variant="default">Primary Action</Button>
<Button variant="destructive">Delete Item</Button>
<Button variant="outline" size="icon"><Settings /></Button>
```

#### **Form Components**

**Input**

- **Location:** `web/src/components/ui/input.tsx`
- **Features:** Focus states, disabled states, validation
- **Design Tokens:** ✅ Uses `border-input`, `focus:ring-ring`

**Textarea**

- **Location:** `web/src/components/ui/textarea.tsx`
- **Features:** Auto-resize, consistent styling
- **Design Tokens:** ✅ Uses semantic tokens

**Checkbox**

- **Location:** `web/src/components/ui/checkbox.tsx`
- **Features:** Radix UI primitives, accessibility
- **Design Tokens:** ✅ Uses semantic colors

**Radio Group**

- **Location:** `web/src/components/ui/radio-group.tsx`
- **Features:** Keyboard navigation, single selection
- **Design Tokens:** ✅ Uses semantic tokens

**Switch**

- **Location:** `web/src/components/ui/switch.tsx`
- **Features:** Toggle states, smooth animations
- **Design Tokens:** ✅ Uses semantic tokens

**Select**

- **Location:** `web/src/components/ui/select.tsx`
- **Features:** Dropdown menu, keyboard navigation
- **Design Tokens:** ✅ Uses semantic tokens

#### **Feedback Components**

**Toast Notifications (Sonner)**

- **Location:** `web/src/components/ui/sonner.tsx`
- **Features:** Success, Error, Warning, Info variants with state-specific colors
- **Design Tokens:** ✅ Uses `bg-success-50`, `text-success-700`, etc.

```tsx
import { toast } from "sonner";

toast.success("Operation completed!");
toast.error("Something went wrong");
toast.warning("Please check your input");
toast.info("New update available");
```

**Alerts**

- **Location:** `web/src/components/ui/alert.tsx`
- **Variants:** default, destructive, success, warning, info
- **Design Tokens:** ✅ Uses semantic tokens

#### **Data Display**

**Badge**

- **Location:** `web/src/components/ui/badge.tsx`
- **Variants:** default, secondary, success, warning, destructive, outline
- **Design Tokens:** ✅ Uses `bg-primary`, `text-primary-foreground`, etc.

**Card**

- **Location:** `web/src/components/ui/card.tsx`
- **Features:** Header, Content, Footer sections
- **Design Tokens:** ✅ Uses semantic tokens

#### **Overlays**

**Dialog/Modal**

- **Location:** `web/src/components/ui/dialog.tsx`
- **Features:** Backdrop blur, keyboard navigation
- **Design Tokens:** ✅ Uses semantic tokens

**Dropdown Menu**

- **Location:** `web/src/components/ui/dropdown-menu.tsx`
- **Features:** Context menus, keyboard navigation
- **Design Tokens:** ✅ Uses `bg-popover`, `text-popover-foreground`

#### **Layout**

**Separator**

- **Location:** `web/src/components/ui/separator.tsx`
- **Features:** Horizontal/vertical dividers
- **Design Tokens:** ✅ Uses `bg-muted`

**Scroll Area**

- **Location:** `web/src/components/ui/scroll-area.tsx`
- **Features:** Custom scrollbars, smooth scrolling
- **Design Tokens:** ✅ Uses semantic tokens

---

## 🎨 **THEME SYSTEM**

### **Theme Provider**

- **Location:** `web/src/components/theme-provider.tsx`
- **Features:** Light/dark/system theme detection, localStorage persistence

### **Theme Hook**

```tsx
import { useTheme } from "@/components/theme-provider";

function MyComponent() {
  const { theme, setTheme, actualTheme } = useTheme();

  return (
    <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
      Toggle Theme
    </button>
  );
}
```

### **Design Tokens Integration**

```css
/* Light Mode */
:root {
  --background: var(--color-gray-50);
  --foreground: var(--color-gray-900);
  --primary: var(--color-primary-500);
  /* ... etc */
}

/* Dark Mode */
.dark {
  --background: oklch(0.15 0.01 240);
  --foreground: oklch(0.98 0 240);
  --primary: var(--color-primary-600);
  /* ... etc */
}
```

---

## 🎯 **IMPLEMENTATION RULES FOR AI**

### **MANDATORY WORKFLOW**

1. **🔍 INVESTIGATE FIRST**

   ```bash
   # Check current component implementation
   read_file: web/src/components/ui/[component].tsx
   ```

2. **🎨 USE DESIGN TOKENS**

   ```tsx
   // Replace hardcoded colors with semantic tokens
   className = "bg-card text-card-foreground border-border";
   ```

3. **🧪 TEST THEME SWITCHING**

   - Ensure component works in light mode
   - Ensure component works in dark mode
   - Check focus states and interactions

4. **📝 UPDATE DEMO PAGE**

   - Add new components to `web/src/pages/DesignSystemDemo.tsx`
   - Use semantic colors in demo examples

5. **✅ VALIDATE CONSISTENCY**
   - All components use same token patterns
   - Theme switching works seamlessly
   - Accessibility standards maintained

### **PROHIBITED ACTIONS**

❌ **NEVER:**

- Create new components without checking existing ones
- Use hardcoded colors like `bg-gray-100`, `text-blue-500`
- Modify design tokens without updating all dependent components
- Skip theme testing for new components
- Use arbitrary Tailwind classes instead of design tokens

---

## 📚 **RESOURCES**

- **Demo Page:** `http://localhost:5173/design-system-demo`
- **Design Tokens:** `web/src/styles/design-tokens.css`
- **UI Components:** `web/src/components/ui/`
- **Theme Provider:** `web/src/components/theme-provider.tsx`

---

## 🔧 **CURRENT TECH STACK**

- **React 18** with TypeScript
- **Tailwind CSS v4** with @theme directive
- **shadcn/ui** component library
- **Radix UI** primitives for accessibility
- **Sonner** for toast notifications
- **Lucide React** for icons
- **176+ Design Tokens** for consistency

---

## 🎯 **NEXT STEPS FOR AI AGENTS**

1. **Phase 3:** Layout system (Sidebar, Dashboard grid)
2. **Phase 4:** Authentication flow components
3. **Phase 5:** Data visualization (Charts, tables)
4. **Phase 6:** Advanced interactions (Drag & drop)

**REMEMBER:** Always prioritize design token usage and component consistency. The system is designed for maintainability and theme flexibility.

---

**🎨 DESIGN SYSTEM STATUS: FULLY IMPLEMENTED AND READY FOR PRODUCTION USE**

### Semantic Colors

**Success** - Fresh green for positive outcomes and confirmations

```css
--success-50: #f0fdf4;
--success-100: #dcfce7;
--success-500: #22c55e; /* Main success color */
--success-600: #16a34a; /* Hover state */
--success-700: #15803d; /* Active state */
--success-900: #14532d; /* Dark mode */
```

**Warning** - Warm amber for caution and attention

```css
--warning-50: #fffbeb;
--warning-100: #fef3c7;
--warning-500: #f59e0b; /* Main warning color */
--warning-600: #d97706; /* Hover state */
--warning-700: #b45309; /* Active state */
--warning-900: #78350f; /* Dark mode */
```

**Error** - Bold red for errors and destructive actions

```css
--error-50: #fef2f2;
--error-100: #fee2e2;
--error-500: #ef4444; /* Main error color */
--error-600: #dc2626; /* Hover state */
--error-700: #b91c1c; /* Active state */
--error-900: #7f1d1d; /* Dark mode */
```

**Info** - Cool cyan for informational content

```css
--info-50: #ecfeff;
--info-100: #cffafe;
--info-500: #06b6d4; /* Main info color */
--info-600: #0891b2; /* Hover state */
--info-700: #0e7490; /* Active state */
--info-900: #164e63; /* Dark mode */
```

### Neutral Palette

**Gray Scale** - Sophisticated gray with subtle warm undertone

```css
/* Light Mode Grays */
--gray-50: #f9fafb; /* Lightest background */
--gray-100: #f3f4f6; /* Secondary background */
--gray-200: #e5e7eb; /* Borders and dividers */
--gray-300: #d1d5db; /* Disabled text */
--gray-400: #9ca3af; /* Placeholder text */
--gray-500: #6b7280; /* Secondary text */
--gray-600: #4b5563; /* Primary text (light mode) */
--gray-700: #374151; /* Headings (light mode) */
--gray-800: #1f2937; /* Dark headings */
--gray-900: #111827; /* Darkest text */
--gray-950: #030712; /* Ultra-dark for depth */

/* Dark Mode Specific */
--dark-bg-primary: #0f1419; /* Main background */
--dark-bg-secondary: #1a1f2e; /* Elevated surfaces */
--dark-bg-tertiary: #242b3d; /* Cards and modals */
--dark-border: #2d3748; /* Borders */
--dark-text-primary: #f9fafb; /* Primary text */
--dark-text-secondary: #9ca3af; /* Secondary text */
```

### Status Colors

**Batch Status Colors** - Mapped to exam workflow stages

```css
--status-not-started: #6b7280; /* Gray - Not yet begun */
--status-in-progress: #3b82f6; /* Blue - Active work */
--status-submitted: #22c55e; /* Green - Completed step */
--status-in-transit: #f59e0b; /* Amber - Movement */
--status-with-lecturer: #8b5cf6; /* Purple - With owner */
--status-under-grading: #6366f1; /* Indigo - Processing */
--status-graded: #14b8a6; /* Teal - Nearly complete */
--status-returned: #f97316; /* Orange - Final step */
--status-completed: #10b981; /* Emerald - Success */
--status-archived: #64748b; /* Slate - Archived */
```

---

## 📝 Typography

### Font Family

```css
/* Primary Font - Inter (sans-serif) */
--font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue",
  Arial, sans-serif;

/* Monospace Font - JetBrains Mono */
--font-mono: "JetBrains Mono", "Fira Code", "SF Mono", Monaco, "Cascadia Code",
  "Courier New", monospace;

/* Headings Font - Cal Sans (optional display font) */
--font-display: "Cal Sans", "Inter", sans-serif;
```

### Font Sizes

**Scale:** 1.125 (Major Third) - Harmonious and readable

```css
/* Font Size Scale */
--text-xs: 0.75rem; /* 12px - Captions, labels */
--text-sm: 0.875rem; /* 14px - Small body, metadata */
--text-base: 1rem; /* 16px - Base body text */
--text-lg: 1.125rem; /* 18px - Lead paragraph */
--text-xl: 1.25rem; /* 20px - Small heading */
--text-2xl: 1.5rem; /* 24px - Section heading */
--text-3xl: 1.875rem; /* 30px - Page heading */
--text-4xl: 2.25rem; /* 36px - Hero heading */
--text-5xl: 3rem; /* 48px - Display heading */
--text-6xl: 3.75rem; /* 60px - Large display */
```

### Font Weights

```css
--font-light: 300; /* Light text (avoid in body) */
--font-normal: 400; /* Body text */
--font-medium: 500; /* Emphasized text, labels */
--font-semibold: 600; /* Subheadings, buttons */
--font-bold: 700; /* Headings */
--font-extrabold: 800; /* Display text (use sparingly) */
```

### Line Heights

```css
--leading-none: 1; /* Tight (headings) */
--leading-tight: 1.25; /* Tight (large headings) */
--leading-snug: 1.375; /* Snug (small headings) */
--leading-normal: 1.5; /* Normal (body text) */
--leading-relaxed: 1.625; /* Relaxed (long form) */
--leading-loose: 2; /* Loose (extra space) */
```

### Letter Spacing

```css
--tracking-tighter: -0.05em; /* Very tight (large display) */
--tracking-tight: -0.025em; /* Tight (headings) */
--tracking-normal: 0; /* Normal (body) */
--tracking-wide: 0.025em; /* Wide (small caps, labels) */
--tracking-wider: 0.05em; /* Wider (buttons, badges) */
--tracking-widest: 0.1em; /* Widest (emphasis) */
```

### Typography Classes

```css
/* Display Text */
.display-2xl {
  font-size: var(--text-6xl);
  font-weight: var(--font-bold);
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tighter);
}

.display-xl {
  font-size: var(--text-5xl);
  font-weight: var(--font-bold);
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tight);
}

/* Headings */
.heading-1 {
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tight);
}

.heading-2 {
  font-size: var(--text-3xl);
  font-weight: var(--font-semibold);
  line-height: var(--leading-snug);
  letter-spacing: var(--tracking-tight);
}

.heading-3 {
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  line-height: var(--leading-snug);
}

.heading-4 {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  line-height: var(--leading-snug);
}

/* Body Text */
.body-lg {
  font-size: var(--text-lg);
  font-weight: var(--font-normal);
  line-height: var(--leading-relaxed);
}

.body-base {
  font-size: var(--text-base);
  font-weight: var(--font-normal);
  line-height: var(--leading-normal);
}

.body-sm {
  font-size: var(--text-sm);
  font-weight: var(--font-normal);
  line-height: var(--leading-normal);
}

/* Labels & Captions */
.label-lg {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  line-height: var(--leading-normal);
  letter-spacing: var(--tracking-wide);
}

.label-base {
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  line-height: var(--leading-normal);
  letter-spacing: var(--tracking-wider);
  text-transform: uppercase;
}

.caption {
  font-size: var(--text-xs);
  font-weight: var(--font-normal);
  line-height: var(--leading-normal);
  color: var(--gray-500);
}

/* Code & Monospace */
.code {
  font-family: var(--font-mono);
  font-size: 0.875em;
  padding: 0.125rem 0.25rem;
  background: var(--gray-100);
  border-radius: 0.25rem;
}
```

---

## 📏 Spacing System

### Base Unit: 4px

**Scale:** 4px base unit with consistent multipliers

```css
--space-0: 0; /* 0px */
--space-px: 1px; /* 1px - borders */
--space-0-5: 0.125rem; /* 2px */
--space-1: 0.25rem; /* 4px */
--space-1-5: 0.375rem; /* 6px */
--space-2: 0.5rem; /* 8px */
--space-2-5: 0.625rem; /* 10px */
--space-3: 0.75rem; /* 12px */
--space-3-5: 0.875rem; /* 14px */
--space-4: 1rem; /* 16px */
--space-5: 1.25rem; /* 20px */
--space-6: 1.5rem; /* 24px */
--space-7: 1.75rem; /* 28px */
--space-8: 2rem; /* 32px */
--space-10: 2.5rem; /* 40px */
--space-12: 3rem; /* 48px */
--space-14: 3.5rem; /* 56px */
--space-16: 4rem; /* 64px */
--space-20: 5rem; /* 80px */
--space-24: 6rem; /* 96px */
--space-32: 8rem; /* 128px */
```

### Semantic Spacing

```css
/* Component Spacing */
--space-component-xs: var(--space-2); /* 8px - tight */
--space-component-sm: var(--space-3); /* 12px - compact */
--space-component-md: var(--space-4); /* 16px - comfortable */
--space-component-lg: var(--space-6); /* 24px - spacious */
--space-component-xl: var(--space-8); /* 32px - generous */

/* Layout Spacing */
--space-section-sm: var(--space-12); /* 48px */
--space-section-md: var(--space-16); /* 64px */
--space-section-lg: var(--space-24); /* 96px */

/* Container Padding */
--space-container-xs: var(--space-4); /* 16px - mobile */
--space-container-sm: var(--space-6); /* 24px - tablet */
--space-container-md: var(--space-8); /* 32px - desktop */
--space-container-lg: var(--space-12); /* 48px - wide */
```

---

## 🔲 Border Radius

### Radius Scale

```css
--radius-none: 0;
--radius-sm: 0.25rem; /* 4px - tight radius */
--radius-base: 0.375rem; /* 6px - standard radius */
--radius-md: 0.5rem; /* 8px - comfortable radius */
--radius-lg: 0.75rem; /* 12px - card radius */
--radius-xl: 1rem; /* 16px - large cards */
--radius-2xl: 1.5rem; /* 24px - modals */
--radius-3xl: 2rem; /* 32px - hero elements */
--radius-full: 9999px; /* Fully rounded (pills, avatars) */
```

### Component Radius

```css
--radius-button: var(--radius-md); /* 8px */
--radius-input: var(--radius-base); /* 6px */
--radius-card: var(--radius-lg); /* 12px */
--radius-modal: var(--radius-xl); /* 16px */
--radius-badge: var(--radius-full); /* Pill shape */
--radius-avatar: var(--radius-full); /* Circle */
```

---

## 🎭 Shadows & Elevation

### Shadow Scale

```css
/* Subtle shadows for light mode */
--shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.05);

--shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);

--shadow-base: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);

--shadow-md: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);

--shadow-lg: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);

--shadow-xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);

--shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.35);

/* Inner shadows */
--shadow-inner: inset 0 2px 4px 0 rgb(0 0 0 / 0.05);

/* Colored shadows for emphasis */
--shadow-primary: 0 10px 15px -3px rgb(59 130 246 / 0.3), 0 4px 6px -4px rgb(59
        130 246 / 0.2);

--shadow-success: 0 10px 15px -3px rgb(34 197 94 / 0.3), 0 4px 6px -4px rgb(34
        197 94 / 0.2);

--shadow-error: 0 10px 15px -3px rgb(239 68 68 / 0.3), 0 4px 6px -4px rgb(239 68
        68 / 0.2);
```

### Elevation Tokens

```css
/* Semantic elevation for components */
--elevation-0: none; /* Flat surface */
--elevation-1: var(--shadow-sm); /* Subtle lift */
--elevation-2: var(--shadow-base); /* Cards */
--elevation-3: var(--shadow-md); /* Dropdowns */
--elevation-4: var(--shadow-lg); /* Modals */
--elevation-5: var(--shadow-xl); /* Overlays */
```

---

## 🎬 Motion & Animation

### Duration

```css
--duration-instant: 0ms; /* Instant (no animation) */
--duration-fast: 150ms; /* Quick interactions */
--duration-base: 200ms; /* Standard transitions */
--duration-moderate: 300ms; /* Comfortable animations */
--duration-slow: 500ms; /* Emphasis animations */
--duration-slowest: 700ms; /* Hero animations */
```

### Easing Functions

```css
/* Natural motion curves */
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);

/* Smooth and snappy */
--ease-smooth: cubic-bezier(0.4, 0, 0.6, 1);
--ease-snappy: cubic-bezier(0.4, 0.14, 0.3, 1);

/* Spring-like motion */
--ease-spring: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

### Transition Tokens

```css
--transition-fast: all var(--duration-fast) var(--ease-out);

--transition-base: all var(--duration-base) var(--ease-out);

--transition-moderate: all var(--duration-moderate) var(--ease-smooth);

/* Specific property transitions */
--transition-colors: background-color var(--duration-base) var(--ease-out), border-color
    var(--duration-base) var(--ease-out),
  color var(--duration-base) var(--ease-out);

--transition-transform: transform var(--duration-base) var(--ease-spring);

--transition-opacity: opacity var(--duration-fast) var(--ease-out);
```

---

## 📱 Breakpoints

### Responsive Breakpoints

```css
--breakpoint-xs: 320px; /* Mobile small */
--breakpoint-sm: 640px; /* Mobile large */
--breakpoint-md: 768px; /* Tablet */
--breakpoint-lg: 1024px; /* Desktop */
--breakpoint-xl: 1280px; /* Desktop large */
--breakpoint-2xl: 1536px; /* Desktop extra large */
```

### Container Widths

```css
--container-sm: 640px; /* Small container */
--container-md: 768px; /* Medium container */
--container-lg: 1024px; /* Large container */
--container-xl: 1280px; /* Extra large container */
--container-2xl: 1536px; /* Full width container */
```

---

## 🧩 Component Patterns

### Buttons

**Primary Button**

```css
.btn-primary {
  background: var(--primary-600);
  color: white;
  padding: var(--space-2-5) var(--space-4);
  border-radius: var(--radius-button);
  font-weight: var(--font-medium);
  font-size: var(--text-sm);
  transition: var(--transition-colors);
  box-shadow: var(--shadow-sm);
}

.btn-primary:hover {
  background: var(--primary-700);
  box-shadow: var(--shadow-base);
}

.btn-primary:active {
  background: var(--primary-800);
  transform: translateY(1px);
}
```

**Secondary Button**

```css
.btn-secondary {
  background: white;
  color: var(--gray-700);
  border: 1px solid var(--gray-300);
  padding: var(--space-2-5) var(--space-4);
  border-radius: var(--radius-button);
  font-weight: var(--font-medium);
  font-size: var(--text-sm);
  transition: var(--transition-colors);
}

.btn-secondary:hover {
  background: var(--gray-50);
  border-color: var(--gray-400);
}
```

**Ghost Button**

```css
.btn-ghost {
  background: transparent;
  color: var(--gray-700);
  padding: var(--space-2-5) var(--space-4);
  border-radius: var(--radius-button);
  font-weight: var(--font-medium);
  font-size: var(--text-sm);
  transition: var(--transition-colors);
}

.btn-ghost:hover {
  background: var(--gray-100);
}
```

### Cards

**Base Card**

```css
.card {
  background: white;
  border-radius: var(--radius-card);
  padding: var(--space-6);
  box-shadow: var(--elevation-2);
  transition: var(--transition-base);
}

.card:hover {
  box-shadow: var(--elevation-3);
  transform: translateY(-2px);
}
```

**Interactive Card**

```css
.card-interactive {
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.card-interactive::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, transparent 0%, var(--primary-50) 100%);
  opacity: 0;
  transition: opacity var(--duration-moderate);
}

.card-interactive:hover::before {
  opacity: 1;
}
```

### Form Inputs

**Text Input**

```css
.input {
  width: 100%;
  padding: var(--space-2-5) var(--space-3-5);
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-input);
  font-size: var(--text-sm);
  color: var(--gray-900);
  background: white;
  transition: var(--transition-colors);
}

.input:focus {
  outline: none;
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px var(--primary-100);
}

.input:disabled {
  background: var(--gray-100);
  color: var(--gray-500);
  cursor: not-allowed;
}
```

### Badges

**Status Badge**

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1-5);
  padding: var(--space-1) var(--space-2-5);
  border-radius: var(--radius-badge);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  letter-spacing: var(--tracking-wider);
}

.badge-success {
  background: var(--success-100);
  color: var(--success-700);
}

.badge-warning {
  background: var(--warning-100);
  color: var(--warning-700);
}

.badge-error {
  background: var(--error-100);
  color: var(--error-700);
}
```

---

## 🌓 Dark Mode

### Dark Mode Colors

```css
[data-theme="dark"] {
  /* Background */
  --bg-primary: var(--dark-bg-primary);
  --bg-secondary: var(--dark-bg-secondary);
  --bg-tertiary: var(--dark-bg-tertiary);

  /* Text */
  --text-primary: var(--dark-text-primary);
  --text-secondary: var(--dark-text-secondary);

  /* Borders */
  --border-color: var(--dark-border);

  /* Shadows are subtler in dark mode */
  --shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.3);
  --shadow-base: 0 4px 6px -1px rgb(0 0 0 / 0.4);
  --shadow-md: 0 10px 15px -3px rgb(0 0 0 / 0.5);
  --shadow-lg: 0 20px 25px -5px rgb(0 0 0 / 0.6);
}
```

---

## 🎯 Layout Patterns

### Sidebar Navigation Layout

```
┌─────────────────────────────────────────┐
│ [Logo]    [Search]    [User]  [Notify] │ ← Top Bar (64px)
├──────┬──────────────────────────────────┤
│      │                                  │
│ Nav  │      Main Content Area           │
│ 256px│                                  │
│      │                                  │
│      │                                  │
└──────┴──────────────────────────────────┘
```

### Dashboard Grid

```
┌─────────────┬─────────────┬─────────────┐
│   Stat Card │   Stat Card │   Stat Card │
│   (1/3)     │   (1/3)     │   (1/3)     │
├─────────────┴─────────────┴─────────────┤
│                                          │
│     Chart Area (Full Width)              │
│                                          │
├──────────────────────┬───────────────────┤
│  Table/List (2/3)    │  Side Panel (1/3) │
│                      │                   │
└──────────────────────┴───────────────────┘
```

---

## ✅ Implementation Checklist

### Phase 1: Foundation (Week 1)

- [ ] Install and configure Tailwind CSS
- [ ] Install shadcn/ui components
- [ ] Install Lucide React icons
- [ ] Create design tokens file (CSS variables)
- [ ] Set up theme provider (light/dark mode)
- [ ] Configure Tailwind with custom design tokens

### Phase 2: Core Components (Week 2)

- [ ] Button variants (primary, secondary, ghost, destructive)
- [ ] Form inputs (text, select, checkbox, radio)
- [ ] Card components
- [ ] Badge components
- [ ] Modal/Dialog components
- [ ] Toast notification system

### Phase 3: Layout (Week 3)

- [ ] Sidebar navigation component
- [ ] Top bar with search and notifications
- [ ] Dashboard layout wrapper
- [ ] Responsive breakpoints implementation
- [ ] Container components

### Phase 4: Auth Flow (Week 4)

- [ ] Login page redesign
- [ ] Forgot password page
- [ ] Password reset page
- [ ] Change password page
- [ ] Authentication error states
- [ ] Loading states

---

**Next Steps:** Begin with Phase 1 implementation starting with the design tokens setup.
