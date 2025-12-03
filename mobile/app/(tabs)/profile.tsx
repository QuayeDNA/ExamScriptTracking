import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "@/store/auth";
import { authApi } from "@/api/auth";

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await authApi.logout();
            await logout();
            router.replace("/login");
          } catch (error: any) {
            Alert.alert("Logout Failed", error.error || "An error occurred");
          }
        },
      },
    ]);
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-blue-600 px-4 pt-12 pb-8">
        <View className="items-center">
          <View className="w-24 h-24 bg-white rounded-full items-center justify-center mb-4">
            <Text className="text-4xl font-bold text-blue-600">
              {user?.name?.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text className="text-2xl font-bold text-white mb-1">
            {user?.name}
          </Text>
          <Text className="text-sm text-blue-100">{user?.email}</Text>
        </View>
      </View>

      {/* User Info */}
      <View className="bg-white mx-4 mt-4 rounded-lg shadow-sm">
        <View className="p-4 border-b border-gray-100">
          <Text className="text-xs text-gray-500 mb-1">Role</Text>
          <Text className="text-base font-semibold text-gray-900">
            {user?.role.replace("_", " ")}
          </Text>
        </View>

        <View className="p-4 border-b border-gray-100">
          <Text className="text-xs text-gray-500 mb-1">Department</Text>
          <Text className="text-base font-semibold text-gray-900">
            {user?.department || "N/A"}
          </Text>
        </View>

        <View className="p-4">
          <Text className="text-xs text-gray-500 mb-1">User ID</Text>
          <Text className="text-base font-semibold text-gray-900">
            {user?.id}
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View className="mx-4 mt-4">
        <TouchableOpacity
          className="bg-white rounded-lg p-4 mb-3 flex-row justify-between items-center"
          onPress={() => router.push("/change-password")}
        >
          <Text className="text-base font-semibold text-gray-900">
            Change Password
          </Text>
          <Text className="text-gray-400">→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-white rounded-lg p-4 mb-3 flex-row justify-between items-center"
          onPress={() => Alert.alert("Settings", "Settings screen coming soon")}
        >
          <Text className="text-base font-semibold text-gray-900">
            Settings
          </Text>
          <Text className="text-gray-400">→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-white rounded-lg p-4 mb-3 flex-row justify-between items-center"
          onPress={() =>
            Alert.alert("About", "Exam Script Tracking System v1.0")
          }
        >
          <Text className="text-base font-semibold text-gray-900">About</Text>
          <Text className="text-gray-400">→</Text>
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <View className="mx-4 mt-4 mb-8">
        <TouchableOpacity
          className="bg-red-600 rounded-lg py-4"
          onPress={handleLogout}
        >
          <Text className="text-white text-center font-semibold text-base">
            Logout
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
