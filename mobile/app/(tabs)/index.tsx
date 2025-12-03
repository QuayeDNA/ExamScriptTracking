import { View, Text, TouchableOpacity, Alert } from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "@/store/auth";
import { authApi } from "@/api/auth";

export default function HomeScreen() {
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await authApi.logout();
      await logout();
      router.replace("/login");
    } catch (error: any) {
      Alert.alert("Logout Failed", error.error || "An error occurred");
    }
  };

  return (
    <View className="flex-1 bg-gray-50 px-4 py-6">
      <View className="bg-white rounded-lg shadow p-6 mb-4">
        <Text className="text-2xl font-bold text-gray-900 mb-2">
          Welcome, {user?.name}
        </Text>
        <Text className="text-sm text-gray-600">
          Role: {user?.role.replace("_", " ")}
        </Text>
        <Text className="text-sm text-gray-600">
          Department: {user?.department}
        </Text>
      </View>

      <View className="bg-white rounded-lg shadow p-6 mb-4">
        <Text className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </Text>
        <TouchableOpacity
          className="bg-blue-600 py-3 px-4 rounded-md mb-3"
          onPress={() => router.push("/scanner")}
        >
          <Text className="text-white text-center font-semibold">
            Scan QR Code
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="bg-orange-600 py-3 px-4 rounded-md mb-3"
          onPress={() => router.push("/pending-transfers")}
        >
          <Text className="text-white text-center font-semibold">
            Pending Transfers
          </Text>
        </TouchableOpacity>
        <TouchableOpacity className="bg-green-600 py-3 px-4 rounded-md">
          <Text className="text-white text-center font-semibold">
            View Active Sessions
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        className="bg-red-600 py-3 px-4 rounded-md"
        onPress={handleLogout}
      >
        <Text className="text-white text-center font-semibold">Logout</Text>
      </TouchableOpacity>
    </View>
  );
}
