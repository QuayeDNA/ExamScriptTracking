/**
 * Card Component
 * Mobile implementation matching web design system
 */

import { View, StyleSheet, ViewStyle } from "react-native";
import { useThemeColors, Shadows } from "@/constants/design-system";

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
