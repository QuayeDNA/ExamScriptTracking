import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/auth";
import * as batchTransfersApi from "@/api/batchTransfers";
import type { BatchTransfer } from "@/api/batchTransfers";

export default function PendingTransfersScreen() {
  const router = useRouter();
  const user = useAuthStore((state: any) => state.user);

  const [outgoingTransfers, setOutgoingTransfers] = useState<BatchTransfer[]>(
    []
  );
  const [incomingTransfers, setIncomingTransfers] = useState<BatchTransfer[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"incoming" | "outgoing">(
    "incoming"
  );

  useEffect(() => {
    loadTransfers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTransfers = async () => {
    if (!user?.userId) return;

    try {
      setLoading(true);

      // Fetch incoming transfers (where user is receiver)
      const incomingData = await batchTransfersApi.getTransfers({
        toHandlerId: user.userId,
        status: "PENDING",
      });
      setIncomingTransfers(incomingData.transfers);

      // Fetch outgoing transfers (where user is sender)
      const outgoingData = await batchTransfersApi.getTransfers({
        fromHandlerId: user.userId,
        status: "PENDING",
      });
      setOutgoingTransfers(outgoingData.transfers);
    } catch (error: any) {
      Alert.alert("Error", error.error || "Failed to load transfers");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTransfers();
    setRefreshing(false);
  };

  const renderTransfer = ({ item }: { item: BatchTransfer }) => {
    const isIncoming = activeTab === "incoming";
    const otherHandler = isIncoming ? item.fromHandler : item.toHandler;

    return (
      <TouchableOpacity
        style={styles.transferCard}
        onPress={() => {
          if (isIncoming) {
            router.push({
              pathname: "/confirm-transfer",
              params: { transferId: item.id },
            });
          } else {
            router.push({
              pathname: "/transfer-history",
              params: { examSessionId: item.examSessionId },
            });
          }
        }}
      >
        <View style={styles.transferHeader}>
          <View>
            <Text style={styles.courseCode}>{item.examSession.courseCode}</Text>
            <Text style={styles.courseName}>{item.examSession.courseName}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: "#f59e0b" }, // PENDING = orange
            ]}
          >
            <Text style={styles.statusText}>PENDING</Text>
          </View>
        </View>

        <View style={styles.transferInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{isIncoming ? "From:" : "To:"}</Text>
            <Text style={styles.infoValue}>
              {otherHandler.firstName} {otherHandler.lastName} (
              {otherHandler.role})
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Scripts:</Text>
            <Text style={styles.infoValue}>{item.scriptsExpected}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Requested:</Text>
            <Text style={styles.infoValue}>
              {new Date(item.requestedAt).toLocaleString()}
            </Text>
          </View>

          {item.location && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Location:</Text>
              <Text style={styles.infoValue}>{item.location}</Text>
            </View>
          )}
        </View>

        {isIncoming && (
          <View style={styles.actionHint}>
            <Text style={styles.actionHintText}>
              Tap to confirm or reject →
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const transfers =
    activeTab === "incoming" ? incomingTransfers : outgoingTransfers;

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading transfers...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "incoming" && styles.tabActive]}
          onPress={() => setActiveTab("incoming")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "incoming" && styles.tabTextActive,
            ]}
          >
            Incoming ({incomingTransfers.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "outgoing" && styles.tabActive]}
          onPress={() => setActiveTab("outgoing")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "outgoing" && styles.tabTextActive,
            ]}
          >
            Outgoing ({outgoingTransfers.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Transfers List */}
      {transfers.length > 0 ? (
        <FlatList
          data={transfers}
          renderItem={renderTransfer}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No {activeTab} transfers pending</Text>
          <Text style={styles.emptySubtext}>
            {activeTab === "incoming"
              ? "You don't have any pending transfers to confirm"
              : "You don't have any pending outgoing transfers"}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6b7280",
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: "#3b82f6",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
  },
  tabTextActive: {
    color: "#3b82f6",
  },
  listContent: {
    padding: 16,
  },
  transferCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  transferHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  courseCode: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  courseName: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
  },
  transferInfo: {
    gap: 8,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoLabel: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  actionHint: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  actionHintText: {
    fontSize: 13,
    color: "#3b82f6",
    fontWeight: "600",
    textAlign: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
  },
});
