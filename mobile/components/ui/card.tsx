/**
 * Card Component
 * Mobile implementation matching web design system
 */

import { View, StyleSheet, ViewStyle } from "react-native";
import { useThemeColors, Shadows } from "@/constants/design-system";
import { Text, H3 } from "./typography";

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  elevation?: "sm" | "default" | "md" | "lg" | "xl";
}

export function Card({ children, style, elevation = "default" }: CardProps) {
  const colors = useThemeColors();
  const shadow = elevation === "default" ? Shadows.DEFAULT : Shadows[elevation];

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          ...shadow,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
});

export function CardHeader({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View
      style={[
        { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  const colors = useThemeColors();
  return (
    <H3 style={{ color: colors.foreground, marginBottom: 4 }}>{children}</H3>
  );
}

export function CardDescription({ children }: { children: React.ReactNode }) {
  const colors = useThemeColors();
  return (
    <Text style={{ fontSize: 14, color: colors.foregroundMuted }}>
      {children}
    </Text>
  );
}

export function CardContent({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[{ padding: 16 }, style]}>{children}</View>;
}
