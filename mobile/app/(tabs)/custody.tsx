import { useState, useEffect, useCallback } from "react";
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
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/auth";
import * as batchTransfersApi from "@/api/batchTransfers";
import type { BatchTransfer } from "@/api/batchTransfers";

interface BatchWithCustody {
  id: string;
  batchQrCode: string;
  courseCode: string;
  courseName: string;
  venue: string;
  examDate: string;
  status: string;
  custodyStatus: "IN_CUSTODY" | "PENDING_RECEIPT" | "TRANSFER_INITIATED";
  latestTransfer?: BatchTransfer;
  pendingTransferCount?: number;
}

export default function CustodyScreen() {
  const router = useRouter();
  const user = useAuthStore((state: any) => state.user);

  const [batches, setBatches] = useState<BatchWithCustody[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<
    "ALL" | "IN_CUSTODY" | "PENDING" | "TRANSFERRED"
  >("ALL");

  const loadBatches = useCallback(async () => {
    if (!user?.userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch all transfers involving this user
      const transfersData = await batchTransfersApi.getTransfers({
        handlerId: user.userId,
      });

      // Group transfers by exam session
      const transfersBySession = new Map<string, BatchTransfer[]>();
      transfersData.transfers.forEach((transfer) => {
        const sessionId = transfer.examSessionId;
        if (!transfersBySession.has(sessionId)) {
          transfersBySession.set(sessionId, []);
        }
        transfersBySession.get(sessionId)!.push(transfer);
      });

      // Build batch list with custody status
      const batchList: BatchWithCustody[] = [];

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for (const [_sessionId, transfers] of transfersBySession) {
        // Sort by date to get latest transfer
        const sortedTransfers = transfers.sort(
          (a, b) =>
            new Date(b.requestedAt).getTime() -
            new Date(a.requestedAt).getTime()
        );
        const latestTransfer = sortedTransfers[0];

        // Determine custody status
        let custodyStatus: BatchWithCustody["custodyStatus"] = "IN_CUSTODY";

        if (latestTransfer.toHandlerId === user.userId) {
          // I'm the receiver
          if (latestTransfer.status === "PENDING") {
            custodyStatus = "PENDING_RECEIPT";
          } else if (latestTransfer.status === "CONFIRMED") {
            custodyStatus = "IN_CUSTODY";
          }
        } else if (latestTransfer.fromHandlerId === user.userId) {
          // I'm the sender
          if (latestTransfer.status === "PENDING") {
            custodyStatus = "TRANSFER_INITIATED";
          }
        }

        // Count pending transfers
        const pendingTransferCount = sortedTransfers.filter(
          (t) => t.status === "PENDING"
        ).length;

        batchList.push({
          id: latestTransfer.examSession.id,
          batchQrCode: latestTransfer.examSession.batchQrCode,
          courseCode: latestTransfer.examSession.courseCode,
          courseName: latestTransfer.examSession.courseName,
          venue: latestTransfer.examSession.venue,
          examDate: new Date().toISOString(), // Placeholder
          status: latestTransfer.examSession.status || "IN_PROGRESS",
          custodyStatus,
          latestTransfer,
          pendingTransferCount,
        });
      }

      setBatches(batchList);
    } catch (error: any) {
      Alert.alert("Error", error.error || "Failed to load batches");
    } finally {
      setLoading(false);
    }
  }, [user?.userId]);

  useEffect(() => {
    loadBatches();
  }, [loadBatches]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadBatches();
    setRefreshing(false);
  };

  const handleBatchPress = (batch: BatchWithCustody) => {
    router.push({
      pathname: "/batch-details",
      params: { batchId: batch.id },
    });
  };

  const handleQuickTransfer = (batch: BatchWithCustody) => {
    // Only allow transfer if user has custody
    if (batch.custodyStatus !== "IN_CUSTODY") {
      Alert.alert(
        "Cannot Transfer",
        "You can only initiate transfers for batches in your custody."
      );
      return;
    }

    router.push({
      pathname: "/initiate-transfer",
      params: {
        examSessionId: batch.id,
        batchQrCode: batch.batchQrCode,
        courseCode: batch.courseCode,
        courseName: batch.courseName,
      },
    });
  };

  const handleConfirmTransfer = (batch: BatchWithCustody) => {
    if (!batch.latestTransfer) return;

    router.push({
      pathname: "/confirm-transfer",
      params: { transferId: batch.latestTransfer.id },
    });
  };

  const renderBatch = ({ item }: { item: BatchWithCustody }) => {
    const custodyColor = getCustodyColor(item.custodyStatus);
    const custodyLabel = getCustodyLabel(item.custodyStatus);

    return (
      <TouchableOpacity
        style={styles.batchCard}
        onPress={() => handleBatchPress(item)}
      >
        {/* Header */}
        <View style={styles.batchHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.courseCode}>{item.courseCode}</Text>
            <Text style={styles.courseName}>{item.courseName}</Text>
          </View>
          <View
            style={[styles.custodyBadge, { backgroundColor: custodyColor }]}
          >
            <Text style={styles.custodyBadgeText}>{custodyLabel}</Text>
          </View>
        </View>

        {/* Batch Info */}
        <View style={styles.batchInfo}>
          <InfoRow label="Batch Code" value={item.batchQrCode} />
          <InfoRow label="Venue" value={item.venue} />
          <InfoRow
            label="Status"
            value={item.status.replace(/_/g, " ")}
            valueColor={getStatusColor(item.status)}
          />
          {item.pendingTransferCount! > 0 && (
            <InfoRow
              label="Pending Transfers"
              value={item.pendingTransferCount!.toString()}
              valueColor="#f59e0b"
            />
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          {item.custodyStatus === "PENDING_RECEIPT" && (
            <TouchableOpacity
              style={[styles.actionButton, styles.confirmButton]}
              onPress={() => handleConfirmTransfer(item)}
            >
              <Text style={styles.actionButtonText}>Confirm Receipt →</Text>
            </TouchableOpacity>
          )}

          {item.custodyStatus === "IN_CUSTODY" && (
            <TouchableOpacity
              style={[styles.actionButton, styles.transferButton]}
              onPress={() => handleQuickTransfer(item)}
            >
              <Text style={styles.actionButtonText}>Transfer →</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, styles.detailsButton]}
            onPress={() => handleBatchPress(item)}
          >
            <Text style={[styles.actionButtonText, { color: "#3b82f6" }]}>
              View Details
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const filteredBatches = batches.filter((batch) => {
    if (filter === "ALL") return true;
    if (filter === "IN_CUSTODY") return batch.custodyStatus === "IN_CUSTODY";
    if (filter === "PENDING") return batch.custodyStatus === "PENDING_RECEIPT";
    if (filter === "TRANSFERRED")
      return batch.custodyStatus === "TRANSFER_INITIATED";
    return true;
  });

  const stats = {
    all: batches.length,
    inCustody: batches.filter((b) => b.custodyStatus === "IN_CUSTODY").length,
    pending: batches.filter((b) => b.custodyStatus === "PENDING_RECEIPT")
      .length,
    transferred: batches.filter((b) => b.custodyStatus === "TRANSFER_INITIATED")
      .length,
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Batch Custody</Text>
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading your batches...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Batch Custody</Text>
        <Text style={styles.headerSubtitle}>
          {stats.all} batch{stats.all !== 1 ? "es" : ""}
        </Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === "ALL" && styles.filterActive]}
          onPress={() => setFilter("ALL")}
        >
          <Text
            style={[
              styles.filterText,
              filter === "ALL" && styles.filterTextActive,
            ]}
          >
            All ({stats.all})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === "IN_CUSTODY" && styles.filterActive,
          ]}
          onPress={() => setFilter("IN_CUSTODY")}
        >
          <Text
            style={[
              styles.filterText,
              filter === "IN_CUSTODY" && styles.filterTextActive,
            ]}
          >
            In Custody ({stats.inCustody})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === "PENDING" && styles.filterActive,
          ]}
          onPress={() => setFilter("PENDING")}
        >
          <Text
            style={[
              styles.filterText,
              filter === "PENDING" && styles.filterTextActive,
            ]}
          >
            Pending ({stats.pending})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === "TRANSFERRED" && styles.filterActive,
          ]}
          onPress={() => setFilter("TRANSFERRED")}
        >
          <Text
            style={[
              styles.filterText,
              filter === "TRANSFERRED" && styles.filterTextActive,
            ]}
          >
            Transferred ({stats.transferred})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Batch List */}
      {filteredBatches.length > 0 ? (
        <FlatList
          data={filteredBatches}
          renderItem={renderBatch}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No batches found</Text>
          <Text style={styles.emptySubtext}>
            {filter === "ALL"
              ? "You don't have any batches in your custody yet"
              : `No batches with ${filter.toLowerCase().replace("_", " ")} status`}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

// Helper components and functions
function InfoRow({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}:</Text>
      <Text style={[styles.infoValue, valueColor && { color: valueColor }]}>
        {value}
      </Text>
    </View>
  );
}

function getCustodyColor(status: string): string {
  switch (status) {
    case "IN_CUSTODY":
      return "#10b981";
    case "CREATED":
      return "#3b82f6";
    case "PENDING_RECEIPT":
      return "#f59e0b";
    case "TRANSFER_INITIATED":
      return "#8b5cf6";
    default:
      return "#6b7280";
  }
}

function getCustodyLabel(status: string): string {
  switch (status) {
    case "IN_CUSTODY":
      return "IN CUSTODY";
    case "PENDING_RECEIPT":
      return "PENDING RECEIPT";
    case "TRANSFER_INITIATED":
      return "TRANSFER INITIATED";
    default:
      return status;
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case "IN_PROGRESS":
      return "#3b82f6";
    case "SUBMITTED":
      return "#10b981";
    case "IN_TRANSIT":
      return "#f59e0b";
    case "WITH_LECTURER":
      return "#8b5cf6";
    case "UNDER_GRADING":
      return "#6366f1";
    case "GRADED":
      return "#14b8a6";
    case "RETURNED":
      return "#f97316";
    case "COMPLETED":
      return "#6b7280";
    default:
      return "#6b7280";
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  header: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6b7280",
  },
  filterContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    gap: 8,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  filterActive: {
    backgroundColor: "#3b82f6",
    borderColor: "#3b82f6",
  },
  filterText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
  },
  filterTextActive: {
    color: "#fff",
  },
  listContent: {
    padding: 16,
  },
  batchCard: {
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
  batchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  courseCode: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  courseName: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
  },
  custodyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  custodyBadgeText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 11,
  },
  batchInfo: {
    gap: 6,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  infoValue: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  confirmButton: {
    backgroundColor: "#10b981",
  },
  transferButton: {
    backgroundColor: "#3b82f6",
  },
  detailsButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#3b82f6",
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
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
