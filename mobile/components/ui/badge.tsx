/**
 * Badge Component
 * Mobile implementation matching web design system
 */

import { View, Text, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { getBadgeColors } from "@/constants/design-system";

interface BadgeProps {
  variant?:
    | "default"
    | "secondary"
    | "success"
    | "warning"
    | "error"
    | "info"
    | "outline";
  children: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Badge({
  variant = "default",
  children,
  style,
  textStyle,
}: BadgeProps) {
  const colors = getBadgeColors(variant);

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colors.bg,
          borderColor: colors.border,
          borderWidth: variant === "outline" ? 1 : 0,
        },
        style,
      ]}
    >
      <Text style={[styles.text, { color: colors.text }, textStyle]}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
  },
});
