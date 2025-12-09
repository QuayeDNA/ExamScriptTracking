/**
 * Separator Component
 * Mobile implementation matching web design system
 */

import { View, StyleSheet, ViewStyle } from "react-native";
import { useThemeColors } from "@/constants/design-system";

interface SeparatorProps {
  orientation?: "horizontal" | "vertical";
  style?: ViewStyle;
}

export function Separator({
  orientation = "horizontal",
  style,
}: SeparatorProps) {
  const colors = useThemeColors();

  return (
    <View
      style={[
        styles.separator,
        orientation === "horizontal" ? styles.horizontal : styles.vertical,
        { backgroundColor: colors.border },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  separator: {},
  horizontal: {
    height: 1,
    width: "100%",
  },
  vertical: {
    width: 1,
    height: "100%",
  },
});
