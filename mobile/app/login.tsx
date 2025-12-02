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
import { saveAuth } from "@/utils/storage";
import { useAuthStore } from "@/store/auth";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const setUser = useAuthStore((state) => state.setUser);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    setIsLoading(true);
    try {
      const response = await authApi.login({ email, password });
      await saveAuth(response.token, response.refreshToken, response.user);
      setUser(response.user);

      if (!response.user.passwordChanged) {
        router.replace("/change-password");
      } else {
        router.replace("/(tabs)");
      }
    } catch (error: any) {
      Alert.alert("Login Failed", error.error || "Invalid credentials");
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
            Exam Script Tracking
          </Text>
          <Text className="text-sm text-gray-600 mb-8 text-center">
            Handler Login
          </Text>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Email
            </Text>
            <TextInput
              className="w-full px-4 py-3 border border-gray-300 rounded-md bg-white"
              placeholder="your.email@example.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!isLoading}
            />
          </View>

          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Password
            </Text>
            <TextInput
              className="w-full px-4 py-3 border border-gray-300 rounded-md bg-white"
              placeholder="Enter password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!isLoading}
            />
          </View>

          <TouchableOpacity
            className={`w-full py-4 rounded-md ${
              isLoading ? "bg-blue-400" : "bg-blue-600"
            }`}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-center font-semibold text-base">
                Sign In
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
