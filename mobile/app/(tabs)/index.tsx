import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "@/store/auth";

export default function HomeScreen() {
  const { user } = useAuthStore();

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-blue-600 px-4 pt-12 pb-6">
        <Text className="text-2xl font-bold text-white mb-2">
          Welcome Back!
        </Text>
        <Text className="text-base text-blue-100">{user?.name}</Text>
        <Text className="text-sm text-blue-200">
          {user?.role.replace("_", " ")} • {user?.department}
        </Text>
      </View>

      {/* Quick Stats */}
      <View className="px-4 py-4">
        <View className="flex-row justify-between mb-4">
          <View className="bg-white rounded-lg shadow-sm p-4 flex-1 mr-2">
            <Text className="text-2xl font-bold text-blue-600 mb-1">0</Text>
            <Text className="text-xs text-gray-600">Active Sessions</Text>
          </View>
          <View className="bg-white rounded-lg shadow-sm p-4 flex-1 ml-2">
            <Text className="text-2xl font-bold text-orange-600 mb-1">0</Text>
            <Text className="text-xs text-gray-600">Pending Transfers</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View className="px-4">
        <Text className="text-lg font-bold text-gray-900 mb-3">
          Quick Actions
        </Text>

        <TouchableOpacity
          className="bg-white rounded-lg p-4 mb-3 flex-row items-center shadow-sm"
          onPress={() => router.push("/scanner")}
        >
          <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mr-4">
            <Text className="text-2xl">📷</Text>
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-gray-900">
              Scan QR Code
            </Text>
            <Text className="text-sm text-gray-500">
              Scan batch or student QR codes
            </Text>
          </View>
          <Text className="text-gray-400">→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-white rounded-lg p-4 mb-3 flex-row items-center shadow-sm"
          onPress={() => router.push("/transfers")}
        >
          <View className="w-12 h-12 bg-orange-100 rounded-full items-center justify-center mr-4">
            <Text className="text-2xl">📦</Text>
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-gray-900">
              View Transfers
            </Text>
            <Text className="text-sm text-gray-500">
              Manage pending transfers
            </Text>
          </View>
          <Text className="text-gray-400">→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-white rounded-lg p-4 mb-3 flex-row items-center shadow-sm"
          onPress={() => router.push("/(tabs)/custody")}
        >
          <View className="w-12 h-12 bg-green-100 rounded-full items-center justify-center mr-4">
            <Text className="text-2xl">📋</Text>
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-gray-900">
              Batch Custody
            </Text>
            <Text className="text-sm text-gray-500">
              View batches in your custody
            </Text>
          </View>
          <Text className="text-gray-400">→</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Activity */}
      <View className="px-4 mt-6 mb-8">
        <Text className="text-lg font-bold text-gray-900 mb-3">
          Recent Activity
        </Text>
        <View className="bg-white rounded-lg p-6">
          <Text className="text-center text-gray-500">No recent activity</Text>
        </View>
      </View>
    </ScrollView>
  );
}
