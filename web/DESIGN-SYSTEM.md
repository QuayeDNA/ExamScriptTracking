# Design System Documentation

## Overview

This is a modern, minimalistic design system built for the Exam Script Tracking web application. It features a comprehensive component library with full light/dark theme support, accessibility features, and responsive design.

## 🎨 Design Principles

- **Minimalistic**: Clean, uncluttered interfaces with purpose-driven design
- **Consistent**: Unified visual language across all components
- **Accessible**: WCAG 2.1 AA compliant with proper ARIA labels
- **Responsive**: Mobile-first approach with fluid layouts
- **Themeable**: Seamless light/dark mode with persistent preferences

## 🚀 Quick Start

Visit the design system demo page at `/design-system-demo` to explore all components interactively.

### Running the Demo

```bash
cd web
npm run dev
```

Navigate to `http://localhost:5173/design-system-demo`

## 📦 Component Library

### Core Components

#### Buttons

- **Variants**: Default, Secondary, Outline, Ghost, Destructive, Link
- **Sizes**: Small, Default, Large, Icon
- **States**: Default, Hover, Active, Disabled, Loading
- **Location**: `src/components/ui/button.tsx`

```tsx
import { Button } from "@/components/ui/button";

<Button variant="default" size="lg">Click me</Button>
<Button variant="destructive" disabled>Delete</Button>
<Button variant="outline" size="icon"><Settings /></Button>
```

#### Form Components

**Input**

- Text, Email, Password, Number types
- Focus states with primary color ring
- Disabled and error states
- Location: `src/components/ui/input.tsx`

```tsx
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

<Label htmlFor="email">Email</Label>
<Input id="email" type="email" placeholder="you@example.com" />
```

**Textarea**

- Multi-line text input
- Auto-resize capability
- Consistent styling with Input
- Location: `src/components/ui/textarea.tsx`

**Checkbox**

- Checked, Unchecked, Indeterminate states
- Radix UI primitives for accessibility
- Location: `src/components/ui/checkbox.tsx`

```tsx
import { Checkbox } from "@/components/ui/checkbox";

<Checkbox id="terms" checked={checked} onCheckedChange={setChecked} />
<Label htmlFor="terms">Accept terms</Label>
```

**Radio Group**

- Single selection from multiple options
- Accessible keyboard navigation
- Location: `src/components/ui/radio-group.tsx`

**Switch**

- Toggle between two states
- Smooth animations
- Location: `src/components/ui/switch.tsx`

**Select**

- Dropdown selection menu
- Keyboard navigation support
- Custom styling
- Location: `src/components/ui/select.tsx`

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

<Select value={value} onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue placeholder="Select option..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
  </SelectContent>
</Select>;
```

#### Feedback Components

**Toast Notifications (Sonner)**

- Success, Error, Warning, Info, Loading variants
- Auto-dismiss with configurable duration
- Action buttons support
- Location: `src/components/ui/sonner.tsx`

```tsx
import { toast } from "sonner";

toast.success("Saved successfully!");
toast.error("Something went wrong");
toast.loading("Processing...", { duration: 2000 });
toast("Custom message", {
  description: "Additional details",
  action: {
    label: "Undo",
    onClick: () => console.log("Undo"),
  },
});
```

**Alerts**

- Variants: Default, Info, Success, Warning, Destructive
- Title and description support
- Icon integration
- Location: `src/components/ui/alert.tsx`

```tsx
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>Your session has expired.</AlertDescription>
</Alert>;
```

#### Data Display

**Badge**

- Variants: Default, Secondary, Success, Warning, Destructive, Outline
- Compact status indicators
- Location: `src/components/ui/badge.tsx`

```tsx
import { Badge } from "@/components/ui/badge";

<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="destructive">Error</Badge>
```

**Card**

- Structured content containers
- Header, Title, Description, Content, Footer sections
- Flexible composition
- Location: `src/components/ui/card.tsx`

```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description text</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>;
```

#### Overlays

**Dialog/Modal**

- Backdrop overlay with blur
- Accessible keyboard interactions (Escape to close)
- Animated entrance/exit
- Location: `src/components/ui/dialog.tsx`

```tsx
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirm Action</DialogTitle>
      <DialogDescription>Are you sure?</DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>;
```

**Dropdown Menu**

- Context menus with items, labels, separators
- Icon support
- Keyboard navigation
- Location: `src/components/ui/dropdown-menu.tsx`

#### Layout

**Separator**

- Horizontal and vertical dividers
- Semantic section breaks
- Location: `src/components/ui/separator.tsx`

```tsx
import { Separator } from "@/components/ui/separator";

<Separator className="my-4" />
<Separator orientation="vertical" />
```

## 🎨 Theme System

### Configuration

The theme system uses custom CSS variables defined in `src/styles/design-tokens.css` with 176+ design tokens covering:

- Colors (Primary, Secondary, Success, Error, Warning, Info, Neutral shades)
- Typography (Font families, sizes, weights, line heights)
- Spacing (Consistent scale from 0.5 to 24)
- Shadows (5 elevation levels)
- Motion (Transition durations and easing functions)

### Theme Provider

Location: `src/components/theme-provider.tsx`

```tsx
import { ThemeProvider } from "@/components/theme-provider";

<ThemeProvider defaultTheme="system" storageKey="app-theme">
  {children}
</ThemeProvider>;
```

### Using Theme Hook

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

### Color System

Colors use RGB format for Tailwind opacity modifiers:

```css
/* Design tokens */
--primary-500: 59 130 246;

/* Usage in Tailwind */
bg-primary-500          /* rgb(59 130 246) */
bg-primary-500/50       /* rgb(59 130 246 / 0.5) */
text-primary-600        /* rgb(37 99 235) */
```

### Dark Mode

All components support dark mode using the `.dark` class applied to the root element:

```tsx
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
  Content adapts to theme
</div>
```

## 📐 Typography Scale

```tsx
// Headings
<h1 className="text-4xl font-bold">Heading 1</h1>
<h2 className="text-3xl font-semibold">Heading 2</h2>
<h3 className="text-2xl font-semibold">Heading 3</h3>
<h4 className="text-xl font-medium">Heading 4</h4>

// Body text
<p className="text-base">Regular text</p>
<p className="text-sm">Small text</p>
<p className="text-xs">Extra small text</p>
```

## 🎯 Spacing System

Consistent spacing scale based on 4px (0.25rem) increments:

```tsx
space - 1; // 0.25rem (4px)
space - 2; // 0.5rem (8px)
space - 4; // 1rem (16px)
space - 6; // 1.5rem (24px)
space - 8; // 2rem (32px)
space - 12; // 3rem (48px)
```

## ♿ Accessibility

All components follow WCAG 2.1 AA guidelines:

- **Keyboard Navigation**: Full support for keyboard-only users
- **Screen Readers**: Proper ARIA labels and roles
- **Focus States**: Visible focus indicators with 2px rings
- **Color Contrast**: Minimum 4.5:1 for text, 3:1 for UI components
- **Semantic HTML**: Using correct HTML elements for meaning

## 📱 Responsive Design

Mobile-first approach with breakpoints:

```css
sm:  640px  /* Small devices */
md:  768px  /* Medium devices */
lg:  1024px /* Large devices */
xl:  1280px /* Extra large devices */
2xl: 1536px /* 2X large devices */
```

Example usage:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Responsive grid */}
</div>
```

## 🛠️ Customization

### Adding New Components

1. Create component in `src/components/ui/[component-name].tsx`
2. Follow the shadcn/ui pattern with Radix UI primitives
3. Use design tokens from `design-tokens.css`
4. Add explicit dark mode classes: `bg-white dark:bg-gray-900`
5. Add to demo page for showcase

### Modifying Design Tokens

Edit `src/styles/design-tokens.css`:

```css
:root {
  /* Add or modify tokens */
  --custom-color: 255 0 128;
}

.dark {
  /* Dark mode overrides */
  --custom-color: 255 128 200;
}
```

## 📚 Tech Stack

- **React 18**: Component library
- **TypeScript**: Type safety
- **Tailwind CSS 4.1**: Utility-first styling with CSS @theme
- **Radix UI**: Accessible component primitives
- **Sonner**: Toast notifications
- **Lucide React**: Icon library
- **class-variance-authority**: Component variants
- **clsx + tailwind-merge**: Conditional className handling

## 🔧 Utilities

### cn() Helper

Merges Tailwind classes efficiently:

```tsx
import { cn } from "@/lib/utils";

<div
  className={cn("base-classes", condition && "conditional-classes", className)}
/>;
```

## 📝 Best Practices

1. **Consistent Spacing**: Use the spacing scale (4, 8, 12, 16, 24, 32, 48px)
2. **Color Usage**: Use semantic color variables, not arbitrary values
3. **Dark Mode**: Always include dark mode variants for custom styles
4. **Accessibility**: Add ARIA labels, keyboard navigation, focus states
5. **Component Composition**: Build complex UIs from simple, reusable components
6. **Type Safety**: Use TypeScript interfaces for component props

## 🐛 Known Issues

- Select component lint warnings for Tailwind 4.1 class syntax (cosmetic only)
- Some Radix UI data attributes use bracket notation (standard pattern)

## 📖 Resources

- [Shadcn UI Documentation](https://ui.shadcn.com)
- [Radix UI Primitives](https://www.radix-ui.com)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

## 🎯 Next Steps

1. **Phase 3**: Layout system (Sidebar, Top bar, Dashboard grid)
2. **Phase 4**: Authentication flow redesign
3. **Phase 5**: Data visualization components (Charts, tables)
4. **Phase 6**: Advanced interactions (Drag & drop, animations)

## 📞 Support

For questions or issues, refer to:

- Demo page: `/design-system-demo`
- Component source: `web/src/components/ui/`
- Design tokens: `web/src/styles/design-tokens.css`
