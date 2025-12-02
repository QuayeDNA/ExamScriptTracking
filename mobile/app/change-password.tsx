import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { authApi } from "@/api/auth";
import { saveAuth, getUser } from "@/utils/storage";
import { useAuthStore } from "@/store/auth";

export default function ChangePasswordScreen() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const setUser = useAuthStore((state) => state.setUser);

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
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

      Alert.alert("Success", "Password changed successfully", [
        { text: "OK", onPress: () => router.replace("/(tabs)") },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.error || "Failed to change password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-gray-50"
    >
      <View className="flex-1 justify-center px-6">
        <View className="bg-white rounded-lg shadow-lg p-8">
          <Text className="text-3xl font-bold text-gray-900 mb-2 text-center">
            Change Your Password
          </Text>
          <Text className="text-sm text-gray-600 mb-8 text-center">
            You must change your temporary password before continuing
          </Text>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              New Password
            </Text>
            <TextInput
              className="w-full px-4 py-3 border border-gray-300 rounded-md bg-white"
              placeholder="Enter new password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              editable={!isLoading}
            />
            <Text className="text-xs text-gray-500 mt-1">
              Must be at least 8 characters long
            </Text>
          </View>

          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </Text>
            <TextInput
              className="w-full px-4 py-3 border border-gray-300 rounded-md bg-white"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              editable={!isLoading}
            />
          </View>

          <TouchableOpacity
            className={`w-full py-4 rounded-md ${
              isLoading ? "bg-blue-400" : "bg-blue-600"
            }`}
            onPress={handleChangePassword}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-center font-semibold text-base">
                Change Password
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
