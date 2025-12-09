/**
 * Auth Layout Component
 * Provides consistent layout for authentication screens
 */

import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { useThemeColors } from "@/constants/design-system";
import { StatusBar } from "expo-status-bar";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  const colors = useThemeColors();

  return (
    <>
      <StatusBar style="auto" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          style={{ backgroundColor: colors.background }}
        >
          <View style={styles.content}>
            {/* Logo/Brand Section */}
            <View style={styles.header}>
              <View
                style={[
                  styles.logoContainer,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Text style={styles.logoText}>ES</Text>
              </View>
              <Text style={[styles.title, { color: colors.foreground }]}>
                {title}
              </Text>
              <Text
                style={[styles.subtitle, { color: colors.foregroundMuted }]}
              >
                {subtitle}
              </Text>
            </View>

            {/* Auth Form Content */}
            <View style={styles.formContainer}>{children}</View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text
                style={[styles.footerText, { color: colors.foregroundMuted }]}
              >
                © {new Date().getFullYear()} Exam Script Tracking System
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  logoText: {
    color: "#ffffff",
    fontSize: 32,
    fontWeight: "bold",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
  },
  formContainer: {
    width: "100%",
    maxWidth: 448,
    alignSelf: "center",
  },
  footer: {
    marginTop: 48,
  },
  footerText: {
    fontSize: 12,
    textAlign: "center",
  },
});
