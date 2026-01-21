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
import { Ionicons } from "@expo/vector-icons";

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const setUser = useAuthStore((state) => state.setUser);
  const colors = useThemeColors();

  const handleLogin = async () => {
    // Clear previous errors
    setError("");

    // Validation
    if (!identifier.trim()) {
      setError("Please enter your email or phone number");
      return;
    }
    if (!password.trim()) {
      setError("Please enter your password");
      return;
    }

    const isEmail = identifier.includes("@");
    const isPhone = /^(\+233|0)[0-9]{9}$/.test(identifier.trim());

    if (!isEmail && !isPhone) {
      setError("Please enter a valid email address or phone number");
      return;
    }

    setIsLoading(true);
    try {
      const response = await authApi.login({ identifier: identifier.trim(), password });
      console.log("Login successful, saving auth data");
      await saveAuth(response.token, response.refreshToken, response.user);
      setUser(response.user);

      Toast.show({
        type: "success",
        text1: "Login Successful",
        text2: `Welcome back, ${response.user.name}!`,
      });

      if (!response.user.passwordChanged) {
        router.replace("/change-password");
      } else {
        router.replace("/app-selector");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      let errorMessage = "An unexpected error occurred. Please try again.";

      if (error?.response?.status === 401) {
        errorMessage = "Invalid credentials. Please check your email/phone and password.";
      } else if (error?.response?.status === 429) {
        errorMessage = "Too many login attempts. Please try again later.";
      } else if (error?.response?.status >= 500) {
        errorMessage = "Server error. Please try again later.";
      } else if (error?.error) {
        errorMessage = error.error;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Exam Logistics System" subtitle="Handler Login Portal">
      <Card elevation="md">
        <View style={styles.cardContent}>
          {/* Error Alert */}
          {error && (
            <View style={styles.alertContainer}>
              <Alert variant="destructive">{error}</Alert>
            </View>
          )}

          {/* Identifier Input */}
          <View style={styles.inputContainer}>
            <Input
              label="Email or Phone Number"
              placeholder="Enter email or phone number"
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!isLoading}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <View style={styles.passwordContainer}>
              <Input
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!isLoading}
                style={styles.passwordInput}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
                disabled={isLoading}
              >
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={20}
                  color="#9CA3AF"  // Grayish color
                />
              </TouchableOpacity>
            </View>
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
  alertContainer: {
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  passwordContainer: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: 40,  // Space for the eye button
  },
  eyeButton: {
    position: "absolute",
    right: 10,
    top: "60%",
    transform: [{ translateY: -10 }],
    padding: 4,
    justifyContent: "center",
    alignItems: "center",
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
