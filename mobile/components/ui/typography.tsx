/**
 * Typography Components
 * Mobile implementation matching web design system
 */

import { Text as RNText, StyleSheet, TextStyle, StyleProp } from "react-native";
import { useThemeColors, Typography } from "@/constants/design-system";

interface TypographyProps {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
  variant?: "default" | "muted" | "h1" | "h2" | "h3";
  numberOfLines?: number;
}

// Generic Text component with variants
export function Text({
  children,
  style,
  variant = "default",
  numberOfLines,
}: TypographyProps) {
  const colors = useThemeColors();

  const variantStyles = {
    default: [styles.p, { color: colors.foreground }],
    muted: [styles.muted, { color: colors.foregroundMuted }],
    h1: [styles.h1, { color: colors.foreground }],
    h2: [styles.h2, { color: colors.foreground }],
    h3: [styles.h3, { color: colors.foreground }],
  };

  return (
    <RNText
      style={[variantStyles[variant], style]}
      numberOfLines={numberOfLines}
    >
      {children}
    </RNText>
  );
}

export function H1({ children, style }: Omit<TypographyProps, "variant">) {
  const colors = useThemeColors();
  return (
    <RNText style={[styles.h1, { color: colors.foreground }, style]}>
      {children}
    </RNText>
  );
}

export function H2({ children, style }: Omit<TypographyProps, "variant">) {
  const colors = useThemeColors();
  return (
    <RNText style={[styles.h2, { color: colors.foreground }, style]}>
      {children}
    </RNText>
  );
}

export function H3({ children, style }: Omit<TypographyProps, "variant">) {
  const colors = useThemeColors();
  return (
    <RNText style={[styles.h3, { color: colors.foreground }, style]}>
      {children}
    </RNText>
  );
}

export function P({ children, style }: Omit<TypographyProps, "variant">) {
  const colors = useThemeColors();
  return (
    <RNText style={[styles.p, { color: colors.foreground }, style]}>
      {children}
    </RNText>
  );
}

const styles = StyleSheet.create({
  h1: {
    fontSize: Typography.fontSize["4xl"],
    fontWeight: Typography.fontWeight.bold,
    lineHeight: Typography.fontSize["4xl"] * Typography.lineHeight.tight,
  },
  h2: {
    fontSize: Typography.fontSize["3xl"],
    fontWeight: Typography.fontWeight.semibold,
    lineHeight: Typography.fontSize["3xl"] * Typography.lineHeight.tight,
  },
  h3: {
    fontSize: Typography.fontSize["2xl"],
    fontWeight: Typography.fontWeight.semibold,
    lineHeight: Typography.fontSize["2xl"] * Typography.lineHeight.normal,
  },
  p: {
    fontSize: Typography.fontSize.base,
    lineHeight: Typography.fontSize.base * Typography.lineHeight.normal,
  },
  muted: {
    fontSize: Typography.fontSize.sm,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.normal,
  },
});
