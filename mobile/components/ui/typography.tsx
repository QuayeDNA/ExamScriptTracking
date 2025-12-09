/**
 * Typography Components
 * Mobile implementation matching web design system
 */

import { Text, StyleSheet, TextStyle } from "react-native";
import { useThemeColors, Typography } from "@/constants/design-system";

interface TypographyProps {
  children: React.ReactNode;
  style?: TextStyle;
}

export function H1({ children, style }: TypographyProps) {
  const colors = useThemeColors();
  return (
    <Text style={[styles.h1, { color: colors.foreground }, style]}>
      {children}
    </Text>
  );
}

export function H2({ children, style }: TypographyProps) {
  const colors = useThemeColors();
  return (
    <Text style={[styles.h2, { color: colors.foreground }, style]}>
      {children}
    </Text>
  );
}

export function H3({ children, style }: TypographyProps) {
  const colors = useThemeColors();
  return (
    <Text style={[styles.h3, { color: colors.foreground }, style]}>
      {children}
    </Text>
  );
}

export function P({ children, style }: TypographyProps) {
  const colors = useThemeColors();
  return (
    <Text style={[styles.p, { color: colors.foreground }, style]}>
      {children}
    </Text>
  );
}

export function Muted({ children, style }: TypographyProps) {
  const colors = useThemeColors();
  return (
    <Text style={[styles.muted, { color: colors.foregroundMuted }, style]}>
      {children}
    </Text>
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
