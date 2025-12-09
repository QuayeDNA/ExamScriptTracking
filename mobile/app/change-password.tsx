import { useState } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import Toast from "react-native-toast-message";
import { authApi } from "@/api/auth";
import { saveAuth, getUser } from "@/utils/storage";
import { useAuthStore } from "@/store/auth";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Text } from "@/components/ui/typography";

export default function ChangePasswordScreen() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const setUser = useAuthStore((state) => state.setUser);

  const validatePassword = (password: string): string => {
    if (password.length < 8) {
      return "Password must be at least 8 characters long";
    }
    if (!/[A-Z]/.test(password)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/[a-z]/.test(password)) {
      return "Password must contain at least one lowercase letter";
    }
    if (!/[0-9]/.test(password)) {
      return "Password must contain at least one number";
    }
    return "";
  };

  const handlePasswordChange = (text: string) => {
    setNewPassword(text);
    setValidationErrors((prev) => ({
      ...prev,
      newPassword: text ? validatePassword(text) : "",
    }));
  };

  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
    setValidationErrors((prev) => ({
      ...prev,
      confirmPassword:
        text && text !== newPassword ? "Passwords do not match" : "",
    }));
  };

  const handleChangePassword = async () => {
    // Clear previous errors
    setError("");

    // Validation
    if (!newPassword || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const response = await authApi.firstTimePasswordChange({ newPassword });
      const user = await getUser();

      if (user) {
        const updatedUser = { ...user, passwordChanged: true };
        await saveAuth(response.token, response.refreshToken, updatedUser);
        setUser(updatedUser);
      }

      Toast.show({
        type: "success",
        text1: "Password Changed",
        text2: "You can now access the system!",
      });

      setTimeout(() => router.replace("/(tabs)"), 500);
    } catch (error: any) {
      setError(error.error || "Failed to change password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Change Your Password"
      subtitle="Set a new secure password to continue"
    >
      <Card elevation="md">
        <View style={styles.cardContent}>
          {/* Info Alert */}
          <View style={styles.alertContainer}>
            <Alert variant="info">
              You must change your temporary password before continuing to use
              the system.
            </Alert>
          </View>

          {/* Error Alert */}
          {error && (
            <View style={styles.alertContainer}>
              <Alert variant="destructive">{error}</Alert>
            </View>
          )}

          {/* New Password Input */}
          <View style={styles.inputContainer}>
            <Input
              label="New Password"
              placeholder="Enter new password"
              value={newPassword}
              onChangeText={handlePasswordChange}
              secureTextEntry
              editable={!isLoading}
              error={validationErrors.newPassword}
            />
            <Text variant="muted" style={styles.helpText}>
              Must be at least 8 characters with uppercase, lowercase, and
              numbers
            </Text>
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputContainer}>
            <Input
              label="Confirm Password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChangeText={handleConfirmPasswordChange}
              secureTextEntry
              editable={!isLoading}
              error={validationErrors.confirmPassword}
            />
          </View>

          {/* Change Password Button */}
          <View style={styles.buttonContainer}>
            <Button
              variant="default"
              size="lg"
              onPress={handleChangePassword}
              disabled={
                isLoading ||
                !newPassword ||
                !confirmPassword ||
                !!validationErrors.newPassword ||
                !!validationErrors.confirmPassword
              }
              style={styles.button}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.buttonText}>Change Password</Text>
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
  helpText: {
    marginTop: 4,
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
