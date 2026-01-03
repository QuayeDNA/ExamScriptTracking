/**
 * Toast Utility
 * Cross-platform toast notifications for mobile
 */

import { Platform, ToastAndroid, Alert } from "react-native";

type ToastType = "success" | "error" | "info" | "warning";

interface ToastOptions {
  duration?: "short" | "long";
  position?: "top" | "bottom" | "center";
}

/**
 * Show a toast notification
 * Uses ToastAndroid on Android, fallback to Alert on iOS
 */
const showToast = (message: string, type: ToastType = "info", options: ToastOptions = {}) => {
  const duration = options.duration === "long" 
    ? ToastAndroid.LONG 
    : ToastAndroid.SHORT;

  if (Platform.OS === "android") {
    ToastAndroid.show(message, duration);
  } else {
    // iOS fallback - simple alert without buttons
    // In a production app, you might want to use a third-party library like react-native-toast-message
    Alert.alert("", message, [{ text: "OK", style: "cancel" }], { cancelable: true });
  }
};

export const toast = {
  success: (message: string, options?: ToastOptions) => {
    showToast(message, "success", options);
  },
  error: (message: string, options?: ToastOptions) => {
    showToast(message, "error", options);
  },
  info: (message: string, options?: ToastOptions) => {
    showToast(message, "info", options);
  },
  warning: (message: string, options?: ToastOptions) => {
    showToast(message, "warning", options);
  },
};
