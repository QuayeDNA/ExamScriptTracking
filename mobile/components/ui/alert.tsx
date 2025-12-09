/**
 * Alert Component
 * Mobile implementation matching web design system
 */

import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { useThemeColors } from "@/constants/design-system";

interface AlertProps {
  variant?: "default" | "info" | "success" | "warning" | "destructive";
  title?: string;
  children: React.ReactNode;
  style?: ViewStyle;
  icon?: React.ReactNode;
}

export function Alert({
  variant = "default",
  title,
  children,
  style,
  icon,
}: AlertProps) {
  const colors = useThemeColors();

  const variantColors = {
    default: {
      bg: colors.surface,
      border: colors.border,
      text: colors.foreground,
    },
    info: {
      bg: `${colors.info}15`,
      border: colors.info,
      text: colors.info,
    },
    success: {
      bg: `${colors.success}15`,
      border: colors.success,
      text: colors.success,
    },
    warning: {
      bg: `${colors.warning}15`,
      border: colors.warning,
      text: colors.warning,
    },
    destructive: {
      bg: `${colors.error}15`,
      border: colors.error,
      text: colors.error,
    },
  };

  const variantStyle = variantColors[variant];

  return (
    <View
      style={[
        styles.alert,
        {
          backgroundColor: variantStyle.bg,
          borderColor: variantStyle.border,
        },
        style,
      ]}
    >
      {icon && <View style={styles.icon}>{icon}</View>}
      <View style={styles.content}>
        {title && (
          <Text style={[styles.title, { color: variantStyle.text }]}>
            {title}
          </Text>
        )}
        <Text style={[styles.description, { color: colors.foreground }]}>
          {children}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  alert: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  icon: {
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
});
