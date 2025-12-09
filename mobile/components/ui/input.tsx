/**
 * Input Component
 * Mobile implementation matching web design system
 */

import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from "react-native";
import { useThemeColors } from "@/constants/design-system";
import { forwardRef } from "react";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, containerStyle, style, ...props }, ref) => {
    const colors = useThemeColors();

    return (
      <View style={containerStyle}>
        {label && (
          <Text style={[styles.label, { color: colors.foreground }]}>
            {label}
          </Text>
        )}
        <TextInput
          ref={ref}
          style={[
            styles.input,
            {
              backgroundColor: colors.surface,
              borderColor: error ? colors.error : colors.border,
              color: colors.foreground,
            },
            style,
          ]}
          placeholderTextColor={colors.foregroundMuted}
          {...props}
        />
        {error && (
          <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
        )}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 6,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  error: {
    fontSize: 12,
    marginTop: 4,
  },
});

Input.displayName = "Input";
