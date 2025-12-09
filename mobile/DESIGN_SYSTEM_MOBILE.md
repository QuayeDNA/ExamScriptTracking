# Mobile Design System Documentation

## Overview

This design system provides a comprehensive set of design tokens, components, and guidelines for the ExamScriptTracking mobile application. It mirrors the web design system while being optimized for React Native and NativeWind.

## Design Tokens

### Colors

All colors use the OKLCH color space for consistent, perceptually uniform colors across light and dark themes.

#### Primary Colors (Blue/Purple)

- `primary.50` to `primary.950` - Main brand colors
- Used for: Primary actions, links, active states

#### Semantic Colors

- **Success** (Green): `success.50` to `success.900` - Positive feedback, completed states
- **Warning** (Orange): `warning.50` to `warning.900` - Caution, pending states
- **Error** (Red): `error.50` to `error.900` - Errors, destructive actions
- **Info** (Cyan): `info.50` to `info.900` - Informational messages

#### Status Colors

Special colors for exam session and batch transfer statuses:

- `notStarted` - Gray (#94a3b8)
- `inProgress` - Blue (#3b82f6)
- `submitted` - Green (#22c55e)
- `inTransit` - Orange (#f59e0b)
- `withLecturer` - Purple (#a855f7)
- `underGrading` - Violet (#8b5cf6)
- `graded` - Teal (#14b8a6)
- `returned` - Orange (#f97316)
- `completed` - Green (#10b981)
- `archived` - Gray (#64748b)

### Typography

#### Font Sizes

- `xs`: 12px
- `sm`: 14px
- `base`: 16px
- `lg`: 18px
- `xl`: 20px
- `2xl`: 24px
- `3xl`: 30px
- `4xl`: 36px
- `5xl`: 48px

#### Font Weights

- `normal`: 400
- `medium`: 500
- `semibold`: 600
- `bold`: 700

#### Line Heights

- `tight`: 1.25
- `normal`: 1.5
- `relaxed`: 1.75

### Spacing

Following a 4px base unit:

- `1`: 4px
- `2`: 8px
- `3`: 12px
- `4`: 16px
- `5`: 20px
- `6`: 24px
- `8`: 32px
- `12`: 48px
- `16`: 64px

### Border Radius

- `sm`: 4px
- `DEFAULT`: 6px
- `md`: 8px
- `lg`: 12px
- `xl`: 16px
- `2xl`: 24px
- `3xl`: 32px
- `full`: 9999px

### Shadows

iOS-style elevations for cards and modals:

- `sm` - Subtle elevation (cards on surface)
- `DEFAULT` - Standard cards
- `md` - Raised cards
- `lg` - Modals, dialogs
- `xl` - Max elevation (dropdowns)

## Components

### Button

Primary interactive element for actions.

**Variants:**

- `default` - Primary purple button
- `destructive` - Red button for dangerous actions
- `outline` - Bordered transparent button
- `secondary` - Gray secondary button
- `ghost` - Transparent button with hover
- `link` - Text-only button

**Sizes:**

- `sm` - Small (36px height)
- `default` - Standard (44px height)
- `lg` - Large (52px height)

**Props:**

```typescript
interface ButtonProps {
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg";
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
}
```

**Usage:**

```tsx
import { Button } from '@/components/ui';

<Button variant="default" onPress={handlePress}>
  Submit
</Button>

<Button variant="destructive" loading={isLoading}>
  Delete
</Button>
```

### Card

Container component with elevation and borders.

**Props:**

```typescript
interface CardProps {
  elevation?: "sm" | "default" | "md" | "lg" | "xl";
}
```

**Usage:**

```tsx
import { Card } from "@/components/ui";

<Card elevation="md">
  <View style={{ padding: 16 }}>
    <Text>Card content</Text>
  </View>
</Card>;
```

### Badge

Small labeled component for status indicators.

**Variants:**

- `default` - Purple badge
- `secondary` - Gray badge
- `success` - Green badge
- `warning` - Orange badge
- `error` - Red badge
- `info` - Blue badge
- `outline` - Bordered badge

**Usage:**

```tsx
import { Badge } from '@/components/ui';

<Badge variant="success">Active</Badge>
<Badge variant="error">Failed</Badge>
```

### Input

Text input field with label and error support.

**Props:**

```typescript
interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}
```

**Usage:**

```tsx
import { Input } from "@/components/ui";

<Input
  label="Email"
  placeholder="Enter your email"
  value={email}
  onChangeText={setEmail}
  error={errors.email}
/>;
```

### Alert

Contextual feedback message.

**Variants:**

- `default` - Neutral message
- `info` - Informational message
- `success` - Success message
- `warning` - Warning message
- `destructive` - Error message

**Usage:**

```tsx
import { Alert } from "@/components/ui";

<Alert variant="success" title="Success">
  Your changes have been saved!
</Alert>;
```

### Typography

Pre-styled text components.

**Components:**

- `H1` - Page heading (36px, bold)
- `H2` - Section heading (30px, semibold)
- `H3` - Subsection heading (24px, semibold)
- `P` - Body text (16px, normal)
- `Muted` - Secondary text (14px, muted color)

**Usage:**

```tsx
import { H1, H2, P, Muted } from '@/components/ui';

<H1>Page Title</H1>
<H2>Section Title</H2>
<P>Body paragraph text goes here.</P>
<Muted>Secondary information</Muted>
```

## Theme System

### useThemeColors Hook

Returns theme-aware colors that automatically switch between light and dark modes.

**Usage:**

```tsx
import { useThemeColors } from "@/constants/design-system";

function MyComponent() {
  const colors = useThemeColors();

  return (
    <View style={{ backgroundColor: colors.background }}>
      <Text style={{ color: colors.foreground }}>Hello World</Text>
    </View>
  );
}
```

**Available Colors:**

- `background`, `surface`, `card`
- `foreground`, `foregroundMuted`, `foregroundSubtle`
- `border`, `borderFocus`
- `primary`, `primaryForeground`, `primaryMuted`
- `success`, `warning`, `error`, `info` (with foreground/muted variants)
- `status.*` - All status colors

### NativeWind Integration

The design system works seamlessly with NativeWind classes:

```tsx
// Using Tailwind classes (recommended for layout)
<View className="flex-1 bg-background p-4">
  <Text className="text-foreground text-lg font-semibold">
    Title
  </Text>
</View>

// Using design system components (recommended for UI elements)
<Button variant="default" onPress={handlePress}>
  Submit
</Button>
```

## Best Practices

### 1. Use Design System Components

Always prefer design system components over custom styled components for consistency:

✅ **Good:**

```tsx
<Button variant="default" onPress={handlePress}>
  Submit
</Button>
```

❌ **Bad:**

```tsx
<TouchableOpacity style={{ backgroundColor: '#7c3aed', ... }}>
  <Text>Submit</Text>
</TouchableOpacity>
```

### 2. Use Theme Colors

Always use `useThemeColors()` for custom styling to support dark mode:

✅ **Good:**

```tsx
const colors = useThemeColors();
<View style={{ backgroundColor: colors.card }} />;
```

❌ **Bad:**

```tsx
<View style={{ backgroundColor: "#ffffff" }} />
```

### 3. Use Semantic Colors

Use semantic colors (success, warning, error) instead of raw color values:

✅ **Good:**

```tsx
<Badge variant="success">Active</Badge>
```

❌ **Bad:**

```tsx
<Badge style={{ backgroundColor: "#22c55e" }}>Active</Badge>
```

### 4. Use Status Colors

For exam sessions and batch transfers, use the predefined status colors:

```tsx
const colors = useThemeColors();
<View style={{ backgroundColor: colors.status.inProgress }} />;
```

### 5. Consistent Spacing

Use the spacing scale for margins and paddings:

```tsx
import { Spacing } from "@/constants/design-system";

<View style={{ padding: Spacing[4], marginBottom: Spacing[6] }} />;
```

### 6. Consistent Typography

Use typography components for all text:

```tsx
<H1>Main Heading</H1>
<P>Body text</P>
<Muted>Secondary text</Muted>
```

## Migration Guide

### From Old Theme to New Design System

**Before:**

```tsx
import { Colors } from "@/constants/theme";

<View style={{ backgroundColor: Colors.light.background }}>
  <Text style={{ color: Colors.light.text }}>Hello</Text>
</View>;
```

**After:**

```tsx
import { useThemeColors } from "@/constants/design-system";

function Component() {
  const colors = useThemeColors();

  return (
    <View style={{ backgroundColor: colors.background }}>
      <Text style={{ color: colors.foreground }}>Hello</Text>
    </View>
  );
}
```

**Or with NativeWind:**

```tsx
<View className="bg-background">
  <Text className="text-foreground">Hello</Text>
</View>
```

## Dark Mode Support

All components automatically support dark mode through the `useColorScheme` hook. The theme switches based on system preferences.

To manually test dark mode:

1. Change system settings (iOS Settings > Display & Brightness)
2. Components will automatically re-render with dark theme colors

## Performance Considerations

1. **Memoization**: Theme color hooks are memoized, safe to call multiple times
2. **Shadow Performance**: Use appropriate shadow elevations - higher elevations cost more performance
3. **Color Calculations**: All colors are pre-calculated, no runtime color manipulation

## Accessibility

1. **Touch Targets**: All buttons meet minimum 44x44pt touch target size
2. **Contrast Ratios**: All color combinations meet WCAG AA standards
3. **Font Sizes**: Minimum 14px for body text, 12px for secondary text
4. **Focus States**: All interactive elements have clear focus states

## Examples

See existing screens for implementation examples:

- `app/login.tsx` - Forms with Input, Button
- `app/(tabs)/index.tsx` - Cards, Badges, Typography
- `app/(tabs)/custody.tsx` - Status badges, Cards
- `app/batch-details.tsx` - Complex layouts with design system

## Support

For questions or issues with the design system, refer to:

- Web design system: `web/src/styles/design-tokens.css`
- Component library: `mobile/components/ui/`
- Design constants: `mobile/constants/design-system.ts`
