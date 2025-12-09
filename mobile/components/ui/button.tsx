/**
 * Button Component
 * Mobile implementation matching web design system
 */

import {
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";
import { forwardRef } from "react";
import { getButtonColors } from "@/constants/design-system";

interface ButtonProps {
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg";
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button = forwardRef<React.ElementRef<typeof TouchableOpacity>, ButtonProps>(
  (
    {
      variant = "default",
      size = "default",
      children,
      onPress,
      disabled,
      loading,
      style,
      textStyle,
      ...props
    },
    ref
  ) => {
    const colors = getButtonColors(variant);

    const sizeStyles = {
      sm: { paddingVertical: 8, paddingHorizontal: 12, minHeight: 36 },
      default: { paddingVertical: 12, paddingHorizontal: 16, minHeight: 44 },
      lg: { paddingVertical: 16, paddingHorizontal: 24, minHeight: 52 },
    };

    const textSizes = {
      sm: { fontSize: 14 },
      default: { fontSize: 16 },
      lg: { fontSize: 18 },
    };

    return (
      <TouchableOpacity
        ref={ref}
        onPress={onPress}
        disabled={disabled || loading}
        style={[
          styles.button,
          sizeStyles[size],
          {
            backgroundColor: colors.bg,
            borderColor: colors.border,
            borderWidth: variant === "outline" ? 1 : 0,
            opacity: disabled ? 0.5 : 1,
          },
          style,
        ]}
        activeOpacity={0.7}
        {...props}
      >
        {loading ? (
          <ActivityIndicator size="small" color={colors.text} />
        ) : (
          <Text
            style={[
              styles.text,
              textSizes[size],
              { color: colors.text },
              textStyle,
            ]}
          >
            {children}
          </Text>
        )}
      </TouchableOpacity>
    );
  }
);

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  text: {
    fontWeight: "600",
  },
});

Button.displayName = "Button";
