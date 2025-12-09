import { useState } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
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
import Toast from "react-native-toast-message";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const setUser = useAuthStore((state) => state.setUser);

  const handleLogin = async () => {
    // Clear previous errors
    setError("");

    // Validation
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    try {
      const response = await authApi.login({ email, password });
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
          {/* Error Alert */}
          {error && (
            <View style={styles.alertContainer}>
              <Alert variant="destructive">{error}</Alert>
            </View>
          )}

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Input
              label="Email Address"
              placeholder="your.email@example.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
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
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </Button>
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
  buttonContainer: {
    marginTop: 8,
  },
  button: {
    width: "100%",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
