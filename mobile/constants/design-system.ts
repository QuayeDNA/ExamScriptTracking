/**
 * Mobile Design System
 * Based on DESIGN_SYSTEM.md v2.0.0
 *
 * This file provides the design tokens for the mobile app,
 * matching the web design system while working with NativeWind.
 */

import { useColorScheme } from "@/hooks/use-color-scheme";

/**
 * Design System Colors
 * These match the web design system OKLCH color palette
 */
export const DesignColors = {
  // Primary Colors (Blue/Purple)
  primary: {
    50: "oklch(0.98 0.01 240)",
    100: "oklch(0.95 0.02 240)",
    200: "oklch(0.9 0.04 240)",
    300: "oklch(0.82 0.08 240)",
    400: "oklch(0.72 0.15 240)",
    500: "oklch(0.62 0.25 255)",
    600: "oklch(0.55 0.27 260)",
    700: "oklch(0.48 0.26 265)",
    800: "oklch(0.4 0.22 265)",
    900: "oklch(0.33 0.18 265)",
    950: "oklch(0.21 0.12 265)",
  },

  // Success Colors (Green)
  success: {
    50: "oklch(0.98 0.02 150)",
    100: "oklch(0.95 0.04 150)",
    500: "oklch(0.65 0.22 145)",
    600: "oklch(0.55 0.22 145)",
    700: "oklch(0.48 0.2 145)",
    900: "oklch(0.35 0.15 145)",
  },

  // Warning Colors (Orange/Yellow)
  warning: {
    50: "oklch(0.98 0.02 85)",
    100: "oklch(0.95 0.05 85)",
    500: "oklch(0.72 0.18 70)",
    600: "oklch(0.62 0.18 60)",
    700: "oklch(0.52 0.16 55)",
    900: "oklch(0.38 0.12 50)",
  },

  // Error Colors (Red)
  error: {
    50: "oklch(0.98 0.02 25)",
    100: "oklch(0.96 0.04 25)",
    500: "oklch(0.62 0.25 25)",
    600: "oklch(0.55 0.25 25)",
    700: "oklch(0.48 0.22 25)",
    900: "oklch(0.35 0.16 25)",
  },

  // Info Colors (Cyan)
  info: {
    50: "oklch(0.98 0.02 195)",
    100: "oklch(0.95 0.04 195)",
    500: "oklch(0.65 0.15 195)",
    600: "oklch(0.55 0.15 195)",
    700: "oklch(0.48 0.13 195)",
    900: "oklch(0.35 0.1 195)",
  },

  // Gray Neutral Palette
  gray: {
    50: "oklch(0.99 0 240)",
    100: "oklch(0.97 0 240)",
    200: "oklch(0.93 0 240)",
    300: "oklch(0.87 0 240)",
    400: "oklch(0.68 0 240)",
    500: "oklch(0.52 0 240)",
    600: "oklch(0.42 0.01 240)",
    700: "oklch(0.35 0.01 240)",
    800: "oklch(0.26 0.01 240)",
    900: "oklch(0.18 0.01 240)",
    950: "oklch(0.1 0.01 240)",
  },
};

/**
 * Status Colors
 * Used for exam session statuses and batch transfers
 */
export const StatusColors = {
  notStarted: "oklch(0.52 0 240)", // gray-500
  inProgress: "oklch(0.62 0.25 255)", // primary-500
  submitted: "oklch(0.65 0.22 145)", // success-500
  inTransit: "oklch(0.72 0.18 70)", // warning-500
  withLecturer: "oklch(0.65 0.25 295)", // purple
  underGrading: "oklch(0.65 0.25 270)", // violet
  graded: "oklch(0.55 0.18 180)", // teal
  returned: "oklch(0.65 0.2 40)", // orange
  completed: "oklch(0.55 0.22 160)", // green
  archived: "oklch(0.55 0.02 240)", // gray
};

/**
 * Border Radius Tokens
 */
export const BorderRadius = {
  sm: 4,
  DEFAULT: 6,
  md: 8,
  lg: 12,
  xl: 16,
  "2xl": 24,
  "3xl": 32,
  full: 9999,
};

/**
 * Spacing Scale
 * Following 4px base unit
 */
export const Spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
};

/**
 * Typography Scale
 */
export const Typography = {
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 30,
    "4xl": 36,
    "5xl": 48,
  },
  fontWeight: {
    normal: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

/**
 * Shadow Elevations
 * iOS-style shadows for cards and modals
 */
export const Shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  DEFAULT: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
};

/**
 * Theme Hook
 * Returns theme-aware colors that automatically switch between light/dark
 */
export function useThemeColors() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return {
    // Backgrounds
    background: isDark ? "#0a0a0a" : "#ffffff",
    surface: isDark ? "#1a1a1a" : "#f9fafb",
    card: isDark ? "#1a1a1a" : "#ffffff",
    muted: isDark ? "#27272a" : "#f4f4f5",

    // Foregrounds
    foreground: isDark ? "#fafafa" : "#0a0a0a",
    foregroundMuted: isDark ? "#a1a1aa" : "#71717a",
    foregroundSubtle: isDark ? "#71717a" : "#a1a1aa",

    // Borders
    border: isDark ? "#27272a" : "#e4e4e7",
    borderFocus: isDark ? "#52525b" : "#d4d4d8",

    // Primary (Blue to match web - oklch(0.62 0.25 255))
    primary: isDark ? "#3b82f6" : "#2563eb",
    primaryForeground: "#ffffff",
    primaryMuted: isDark ? "#2563eb" : "#60a5fa",

    // Success
    success: "#22c55e",
    successForeground: "#ffffff",
    successMuted: isDark ? "#16a34a" : "#4ade80",

    // Warning
    warning: "#f59e0b",
    warningForeground: "#ffffff",
    warningMuted: isDark ? "#d97706" : "#fbbf24",

    // Error/Destructive
    error: "#ef4444",
    errorForeground: "#ffffff",
    errorMuted: isDark ? "#dc2626" : "#f87171",

    // Info
    info: "#3b82f6",
    infoForeground: "#ffffff",
    infoMuted: isDark ? "#2563eb" : "#60a5fa",

    // Status colors
    status: {
      notStarted: "#94a3b8",
      inProgress: "#3b82f6",
      submitted: "#22c55e",
      inTransit: "#f59e0b",
      withLecturer: "#a855f7",
      underGrading: "#8b5cf6",
      graded: "#14b8a6",
      returned: "#f97316",
      completed: "#10b981",
      archived: "#64748b",
    },
  };
}

/**
 * Badge Variant Colors
 * For consistent badge styling across the app
 */
export function getBadgeColors(
  variant:
    | "default"
    | "secondary"
    | "success"
    | "warning"
    | "error"
    | "info"
    | "outline"
) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const variants = {
    default: {
      bg: isDark ? "#7c3aed" : "#8b5cf6",
      text: "#ffffff",
      border: "transparent",
    },
    secondary: {
      bg: isDark ? "#27272a" : "#f4f4f5",
      text: isDark ? "#fafafa" : "#18181b",
      border: "transparent",
    },
    success: {
      bg: isDark ? "#166534" : "#dcfce7",
      text: isDark ? "#bbf7d0" : "#166534",
      border: "transparent",
    },
    warning: {
      bg: isDark ? "#92400e" : "#fef3c7",
      text: isDark ? "#fde68a" : "#92400e",
      border: "transparent",
    },
    error: {
      bg: isDark ? "#991b1b" : "#fee2e2",
      text: isDark ? "#fca5a5" : "#991b1b",
      border: "transparent",
    },
    info: {
      bg: isDark ? "#1e40af" : "#dbeafe",
      text: isDark ? "#93c5fd" : "#1e40af",
      border: "transparent",
    },
    outline: {
      bg: "transparent",
      text: isDark ? "#fafafa" : "#18181b",
      border: isDark ? "#3f3f46" : "#e4e4e7",
    },
  };

  return variants[variant];
}

/**
 * Button Variant Styles
 * For consistent button styling across the app
 */
export function getButtonColors(
  variant:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const variants = {
    default: {
      bg: isDark ? "#7c3aed" : "#8b5cf6",
      text: "#ffffff",
      border: "transparent",
    },
    destructive: {
      bg: isDark ? "#dc2626" : "#ef4444",
      text: "#ffffff",
      border: "transparent",
    },
    outline: {
      bg: "transparent",
      text: isDark ? "#fafafa" : "#18181b",
      border: isDark ? "#3f3f46" : "#e4e4e7",
    },
    secondary: {
      bg: isDark ? "#27272a" : "#f4f4f5",
      text: isDark ? "#fafafa" : "#18181b",
      border: "transparent",
    },
    ghost: {
      bg: "transparent",
      text: isDark ? "#fafafa" : "#18181b",
      border: "transparent",
    },
    link: {
      bg: "transparent",
      text: isDark ? "#a78bfa" : "#7c3aed",
      border: "transparent",
    },
  };

  return variants[variant];
}

/**
 * Export theme for use in components
 */
export const Theme = {
  colors: DesignColors,
  status: StatusColors,
  radius: BorderRadius,
  spacing: Spacing,
  typography: Typography,
  shadows: Shadows,
};
