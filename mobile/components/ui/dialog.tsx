/**
 * Dialog Component
 * A confirmation dialog with actions
 */

import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { useThemeColors } from "@/constants/design-system";
import { Ionicons } from "@expo/vector-icons";

type DialogVariant = "default" | "success" | "warning" | "error" | "info";

interface DialogProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: React.ReactNode;
  variant?: DialogVariant;
  primaryAction?: {
    label: string;
    onPress: () => void;
  };
  secondaryAction?: {
    label: string;
    onPress: () => void;
  };
  icon?: keyof typeof Ionicons.glyphMap;
}

export function Dialog({
  visible,
  onClose,
  title,
  message,
  variant = "default",
  primaryAction,
  secondaryAction,
  icon,
}: DialogProps) {
  const colors = useThemeColors();

  const variantStyles = {
    default: {
      iconColor: colors.primary,
      iconBackground: colors.primaryMuted,
    },
    success: {
      iconColor: "#059669",
      iconBackground: "rgba(5, 150, 105, 0.1)",
    },
    warning: {
      iconColor: "#d97706",
      iconBackground: "rgba(217, 119, 6, 0.1)",
    },
    error: {
      iconColor: "#dc2626",
      iconBackground: "rgba(220, 38, 38, 0.1)",
    },
    info: {
      iconColor: "#2563eb",
      iconBackground: "rgba(37, 99, 235, 0.1)",
    },
  };

  const variantConfig = variantStyles[variant];

  const iconNames: Record<DialogVariant, keyof typeof Ionicons.glyphMap> = {
    default: "information-circle",
    success: "checkmark-circle",
    warning: "warning",
    error: "close-circle",
    info: "information-circle",
  };

  const displayIcon = icon || iconNames[variant];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View
          style={[
            styles.dialogContainer,
            {
              backgroundColor: colors.background,
              ...Platform.select({
                ios: {
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.25,
                  shadowRadius: 24,
                },
                android: {
                  elevation: 8,
                },
              }),
            },
          ]}
        >
          {/* Icon */}
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: variantConfig.iconBackground },
            ]}
          >
            <Ionicons
              name={displayIcon}
              size={32}
              color={variantConfig.iconColor}
            />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.foreground }]}>
            {title}
          </Text>

          {/* Message */}
          <Text style={[styles.message, { color: colors.foregroundMuted }]}>
            {message}
          </Text>

          {/* Actions */}
          <View style={styles.actions}>
            {secondaryAction && (
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.secondaryButton,
                  { backgroundColor: colors.muted },
                ]}
                onPress={() => {
                  secondaryAction.onPress();
                  onClose();
                }}
              >
                <Text style={[styles.buttonText, { color: colors.foreground }]}>
                  {secondaryAction.label}
                </Text>
              </TouchableOpacity>
            )}
            {primaryAction && (
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.primaryButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={() => {
                  primaryAction.onPress();
                  onClose();
                }}
              >
                <Text style={[styles.buttonText, { color: "#ffffff" }]}>
                  {primaryAction.label}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  dialogContainer: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  button: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButton: {
    // Uses muted background from theme
  },
  primaryButton: {
    // Uses primary background from theme
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
