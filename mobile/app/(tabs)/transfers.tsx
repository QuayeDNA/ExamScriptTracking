import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { router } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/store/auth";
import { getTransfers, type BatchTransfer } from "@/api/batchTransfers";

export default function TransfersScreen() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"incoming" | "outgoing">(
    "incoming"
  );
  const [transfers, setTransfers] = useState<BatchTransfer[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTransfers = useCallback(async () => {
    try {
      setLoading(true);
      const { transfers: data } = await getTransfers({
        handlerId: user?.id,
        status: "PENDING",
      });

      if (activeTab === "incoming") {
        setTransfers(
          data.filter((t: BatchTransfer) => t.toHandlerId === user?.id)
        );
      } else {
        setTransfers(
          data.filter((t: BatchTransfer) => t.fromHandlerId === user?.id)
        );
      }
    } catch (error: any) {
      Alert.alert("Error", error.error || "Failed to load transfers");
    } finally {
      setLoading(false);
    }
  }, [activeTab, user?.id]);

  useEffect(() => {
    loadTransfers();
  }, [loadTransfers]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-500";
      case "CONFIRMED":
        return "bg-green-500";
      case "REJECTED":
        return "bg-red-500";
      case "DISCREPANCY_REPORTED":
        return "bg-orange-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 pt-12 pb-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900 mb-4">
          Pending Transfers
        </Text>

        {/* Tabs */}
        <View className="flex-row">
          <TouchableOpacity
            className={`flex-1 py-3 border-b-2 ${
              activeTab === "incoming"
                ? "border-blue-600"
                : "border-transparent"
            }`}
            onPress={() => setActiveTab("incoming")}
          >
            <Text
              className={`text-center font-semibold ${
                activeTab === "incoming" ? "text-blue-600" : "text-gray-500"
              }`}
            >
              Incoming
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 py-3 border-b-2 ${
              activeTab === "outgoing"
                ? "border-blue-600"
                : "border-transparent"
            }`}
            onPress={() => setActiveTab("outgoing")}
          >
            <Text
              className={`text-center font-semibold ${
                activeTab === "outgoing" ? "text-blue-600" : "text-gray-500"
              }`}
            >
              Outgoing
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView className="flex-1 px-4 py-4">
        {loading ? (
          <Text className="text-center text-gray-500 mt-8">Loading...</Text>
        ) : transfers.length === 0 ? (
          <View className="bg-white rounded-lg p-6 mt-4">
            <Text className="text-center text-gray-500">
              No pending {activeTab} transfers
            </Text>
          </View>
        ) : (
          transfers.map((transfer) => (
            <TouchableOpacity
              key={transfer.id}
              className="bg-white rounded-lg p-4 mb-3 shadow-sm"
              onPress={() =>
                router.push({
                  pathname: "/confirm-transfer",
                  params: { transferId: transfer.id },
                })
              }
            >
              <View className="flex-row justify-between items-start mb-2">
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  {transfer.examSession?.courseCode || "N/A"}
                </Text>
                <View
                  className={`px-3 py-1 rounded-full ${getStatusColor(transfer.status)}`}
                >
                  <Text className="text-xs font-semibold text-white">
                    {transfer.status}
                  </Text>
                </View>
              </View>

              <Text className="text-sm text-gray-600 mb-1">
                {transfer.examSession?.courseName || "N/A"}
              </Text>

              <View className="flex-row justify-between mt-2 pt-2 border-t border-gray-100">
                <Text className="text-xs text-gray-500">
                  {activeTab === "incoming" ? "From" : "To"}:{" "}
                  {activeTab === "incoming"
                    ? `${transfer.fromHandler?.firstName} ${transfer.fromHandler?.lastName}`
                    : `${transfer.toHandler?.firstName} ${transfer.toHandler?.lastName}`}
                </Text>
                <Text className="text-xs text-gray-500">
                  Scripts: {transfer.scriptsExpected}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Refresh Button */}
      <View className="px-4 pb-4">
        <TouchableOpacity
          className="bg-blue-600 py-3 rounded-lg"
          onPress={loadTransfers}
        >
          <Text className="text-white text-center font-semibold">Refresh</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
