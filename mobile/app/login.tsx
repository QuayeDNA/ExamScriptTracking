import { useState } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { authApi } from "@/api/auth";
import { saveAuth } from "@/utils/storage";
import { useAuthStore } from "@/store/auth";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Text } from "@/components/ui/typography";
import { useThemeColors } from "@/constants/design-system";
import Toast from "react-native-toast-message";

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email");
  const setUser = useAuthStore((state) => state.setUser);
  const colors = useThemeColors();

  const handleLogin = async () => {
    // Clear previous errors
    setError("");

    // Validation
    if (!identifier || !password) {
      setError("Please enter both identifier and password");
      return;
    }

    if (loginMethod === "email" && !identifier.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    if (loginMethod === "phone" && !/^(\+233|0)[0-9]{9}$/.test(identifier)) {
      setError(
        "Please enter a valid phone number (e.g., 0241234567 or +233241234567)"
      );
      return;
    }

    setIsLoading(true);
    try {
      const response = await authApi.login({ identifier, password });
      await saveAuth(response.token, response.refreshToken, response.user);
      setUser(response.user);

      const isAttendanceUser = response.user.role === "CLASS_REP";

      Toast.show({
        type: "success",
        text1: "Login Successful",
        text2: `Welcome back, ${response.user.name}!`,
      });

      if (!response.user.passwordChanged) {
        router.replace("/change-password");
      } else {
        router.replace(isAttendanceUser ? ("/attendance" as any) : "/(tabs)");
      }
    } catch (error: any) {
      setError(error.error || "Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Exam Script Tracking" subtitle="Handler Login Portal">
      <Card elevation="md">
        <View style={styles.cardContent}>
          {/* Login Method Toggle */}
          <View
            style={[styles.toggleContainer, { borderColor: colors.border }]}
          >
            <TouchableOpacity
              style={[
                styles.toggleButton,
                { backgroundColor: colors.muted },
                loginMethod === "email" && [
                  styles.toggleButtonActive,
                  { backgroundColor: colors.primary },
                ],
              ]}
              onPress={() => setLoginMethod("email")}
              disabled={isLoading}
            >
              <Text
                style={[
                  styles.toggleText,
                  { color: colors.foregroundMuted },
                  loginMethod === "email" && [
                    styles.toggleTextActive,
                    { color: colors.primaryForeground },
                  ],
                ]}
              >
                Email Login
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                { backgroundColor: colors.muted },
                loginMethod === "phone" && [
                  styles.toggleButtonActive,
                  { backgroundColor: colors.primary },
                ],
              ]}
              onPress={() => setLoginMethod("phone")}
              disabled={isLoading}
            >
              <Text
                style={[
                  styles.toggleText,
                  { color: colors.foregroundMuted },
                  loginMethod === "phone" && [
                    styles.toggleTextActive,
                    { color: colors.primaryForeground },
                  ],
                ]}
              >
                Phone Login
              </Text>
            </TouchableOpacity>
          </View>

          {/* Error Alert */}
          {error && (
            <View style={styles.alertContainer}>
              <Alert variant="destructive">{error}</Alert>
            </View>
          )}

          {/* Identifier Input */}
          <View style={styles.inputContainer}>
            <Input
              label={loginMethod === "email" ? "Email Address" : "Phone Number"}
              placeholder={
                loginMethod === "email"
                  ? "your.email@example.com"
                  : "0241234567 or +233241234567"
              }
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
              keyboardType={
                loginMethod === "email" ? "email-address" : "phone-pad"
              }
              editable={!isLoading}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!isLoading}
            />
          </View>

          {/* Login Button */}
          <View style={styles.buttonContainer}>
            <Button
              variant="default"
              size="lg"
              onPress={handleLogin}
              disabled={isLoading}
              style={styles.button}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.primaryForeground} />
              ) : (
                <Text
                  style={[
                    styles.buttonText,
                    { color: colors.primaryForeground },
                  ]}
                >
                  Sign In
                </Text>
              )}
            </Button>
          </View>

          {/* QR Registration Link */}
          <View style={styles.linkContainer}>
            <TouchableOpacity
              onPress={() => router.push("/qr-registration")}
              disabled={isLoading}
            >
              <Text style={[styles.linkText, { color: colors.primary }]}>
                Register with QR Code
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Card>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  cardContent: {
    padding: 24,
  },
  toggleContainer: {
    flexDirection: "row",
    marginBottom: 20,
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  toggleButtonActive: {
    // backgroundColor is now set dynamically
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "500",
  },
  toggleTextActive: {
    // color is now set dynamically
  },
  alertContainer: {
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  buttonContainer: {
    marginTop: 8,
  },
  button: {
    width: "100%",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  linkContainer: {
    marginTop: 16,
    alignItems: "center",
  },
  linkText: {
    fontSize: 16,
    textDecorationLine: "underline",
  },
});
