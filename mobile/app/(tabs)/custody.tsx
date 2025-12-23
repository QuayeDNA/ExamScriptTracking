import { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/auth";
import * as batchTransfersApi from "@/api/batchTransfers";
import type { BatchTransfer } from "@/api/batchTransfers";
import { Ionicons } from "@expo/vector-icons";
import { Text, Badge, Dialog } from "@/components/ui";
import { TransferDialog } from "@/components/TransferDialog";
import { useThemeColors } from "@/constants/design-system";
import Toast from "react-native-toast-message";

interface BatchWithCustody {
  id: string;
  batchQrCode: string;
  courseCode: string;
  courseName: string;
  venue: string;
  examDate: string;
  status: string;
  custodyStatus:
    | "IN_CUSTODY"
    | "PENDING_RECEIPT"
    | "TRANSFER_INITIATED"
    | "TRANSFERRED";
  latestTransfer?: BatchTransfer;
  pendingTransferCount?: number;
}

type FilterType = "ALL" | "IN_CUSTODY" | "PENDING" | "TRANSFERRED";

export default function CustodyScreen() {
  const router = useRouter();
  const user = useAuthStore((state: any) => state.user);
  const colors = useThemeColors();

  const [batches, setBatches] = useState<BatchWithCustody[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>("ALL");

  // Transfer dialog state
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<BatchWithCustody | null>(
    null
  );

  // Confirm receipt dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmingBatch, setConfirmingBatch] =
    useState<BatchWithCustody | null>(null);

  const loadBatches = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch all transfers involving this user
      const transfersData = await batchTransfersApi.getTransfers({
        handlerId: user.id,
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

      for (const transfers of transfersBySession.values()) {
        // Sort by date to get latest transfer
        const sortedTransfers = transfers.sort(
          (a, b) =>
            new Date(b.requestedAt).getTime() -
            new Date(a.requestedAt).getTime()
        );
        const latestTransfer = sortedTransfers[0];

        // Determine custody status
        let custodyStatus: BatchWithCustody["custodyStatus"] | null = null;

        // For initial custody (self-transfer)
        const isSelfTransfer =
          latestTransfer.fromHandlerId === latestTransfer.toHandlerId &&
          latestTransfer.fromHandlerId === user.id;

        if (isSelfTransfer && latestTransfer.status === "CONFIRMED") {
          custodyStatus = "IN_CUSTODY";
        } else if (latestTransfer.toHandlerId === user.id) {
          // I'm the receiver
          if (latestTransfer.status === "PENDING") {
            custodyStatus = "PENDING_RECEIPT";
          } else if (latestTransfer.status === "CONFIRMED") {
            custodyStatus = "IN_CUSTODY";
          }
        } else if (latestTransfer.fromHandlerId === user.id) {
          // I'm the sender
          if (latestTransfer.status === "PENDING") {
            custodyStatus = "TRANSFER_INITIATED";
          } else if (latestTransfer.status === "CONFIRMED") {
            custodyStatus = "TRANSFERRED";
          }
        }

        if (!custodyStatus) {
          continue;
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
          examDate: new Date().toISOString(),
          status: latestTransfer.examSession.status || "IN_PROGRESS",
          custodyStatus,
          latestTransfer,
          pendingTransferCount,
        });
      }

      setBatches(batchList);
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Failed to Load",
        text2: error.error || "Failed to load batches",
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadBatches();
  }, [loadBatches]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadBatches();
    setRefreshing(false);
  };

  const handleBatchPress = (batch: BatchWithCustody) => {
    if (!batch.id) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Batch ID is missing",
      });
      return;
    }
    router.push({
      pathname: "/batch-details",
      params: { batchId: batch.id },
    });
  };

  const handleInitiateTransfer = (batch: BatchWithCustody) => {
    if (batch.custodyStatus !== "IN_CUSTODY") {
      Toast.show({
        type: "error",
        text1: "Cannot Transfer",
        text2: "You can only initiate transfers for batches in your custody.",
      });
      return;
    }
    setSelectedBatch(batch);
    setShowTransferDialog(true);
  };

  const handleConfirmReceiptRequest = (batch: BatchWithCustody) => {
    setConfirmingBatch(batch);
    setShowConfirmDialog(true);
  };

  const handleConfirmReceipt = async () => {
    if (!confirmingBatch?.latestTransfer) return;

    try {
      setShowConfirmDialog(false);
      await batchTransfersApi.confirmTransfer(
        confirmingBatch.latestTransfer.id,
        {
          examsReceived: confirmingBatch.latestTransfer.examsExpected,
        }
      );

      Toast.show({
        type: "success",
        text1: "Transfer Confirmed",
        text2: "Batch receipt confirmed successfully",
      });

      await loadBatches();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Confirmation Failed",
        text2: error.error || "Failed to confirm transfer",
      });
    } finally {
      setConfirmingBatch(null);
    }
  };

  const renderBatch = ({ item }: { item: BatchWithCustody }) => {
    const custodyColor = getCustodyColor(item.custodyStatus);
    const custodyLabel = getCustodyLabel(item.custodyStatus);

    return (
      <TouchableOpacity
        style={[styles.batchCard, { backgroundColor: colors.card }]}
        onPress={() => handleBatchPress(item)}
        activeOpacity={0.7}
      >
        {/* Header */}
        <View style={styles.batchHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.courseCode, { color: colors.foreground }]}>
              {item.courseCode}
            </Text>
            <Text
              style={[styles.courseName, { color: colors.foregroundMuted }]}
            >
              {item.courseName}
            </Text>
          </View>
          <Badge variant="default" style={{ backgroundColor: custodyColor }}>
            <Text style={{ color: "#fff", fontSize: 11, fontWeight: "600" }}>
              {custodyLabel}
            </Text>
          </Badge>
        </View>

        {/* Batch Info */}
        <View style={styles.batchInfo}>
          <InfoRow icon="qr-code" label="Batch Code" value={item.batchQrCode} />
          <InfoRow icon="location" label="Venue" value={item.venue} />
          <InfoRow
            icon="pulse"
            label="Status"
            value={item.status.replace(/_/g, " ")}
            valueColor={getStatusColor(item.status)}
          />
          {item.pendingTransferCount! > 0 && (
            <InfoRow
              icon="time"
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
              style={[styles.actionButton, { backgroundColor: "#10b981" }]}
              onPress={() => handleConfirmReceiptRequest(item)}
            >
              <Ionicons name="checkmark-circle" size={18} color="#fff" />
              <Text style={styles.actionButtonText}>Confirm Receipt</Text>
            </TouchableOpacity>
          )}

          {item.custodyStatus === "IN_CUSTODY" && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={() => handleInitiateTransfer(item)}
            >
              <Ionicons name="arrow-forward-circle" size={18} color="#fff" />
              <Text style={styles.actionButtonText}>Transfer</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.detailsButton,
              { borderColor: colors.border },
            ]}
            onPress={() => handleBatchPress(item)}
          >
            <Ionicons name="eye" size={18} color={colors.primary} />
            <Text style={[styles.detailsButtonText, { color: colors.primary }]}>
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
      return (
        batch.custodyStatus === "TRANSFER_INITIATED" ||
        batch.custodyStatus === "TRANSFERRED"
      );
    return true;
  });

  const stats = {
    all: batches.length,
    inCustody: batches.filter((b) => b.custodyStatus === "IN_CUSTODY").length,
    pending: batches.filter((b) => b.custodyStatus === "PENDING_RECEIPT")
      .length,
    transferred: batches.filter(
      (b) =>
        b.custodyStatus === "TRANSFER_INITIATED" ||
        b.custodyStatus === "TRANSFERRED"
    ).length,
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View
          style={[
            styles.header,
            { backgroundColor: colors.card, borderBottomColor: colors.border },
          ]}
        >
          <Text
            variant="h2"
            style={[styles.headerTitle, { color: colors.foreground }]}
          >
            Batch Custody
          </Text>
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.foregroundMuted }]}>
            Loading your batches...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        <View>
          <Text
            variant="h2"
            style={[styles.headerTitle, { color: colors.foreground }]}
          >
            Batch Custody
          </Text>
          <Text
            style={[styles.headerSubtitle, { color: colors.foregroundMuted }]}
          >
            {stats.all} batch{stats.all !== 1 ? "es" : ""}
          </Text>
        </View>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View
        style={[
          styles.filterContainer,
          { backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        <FilterTab
          active={filter === "ALL"}
          label={`All (${stats.all})`}
          onPress={() => setFilter("ALL")}
        />
        <FilterTab
          active={filter === "IN_CUSTODY"}
          label={`In Custody (${stats.inCustody})`}
          onPress={() => setFilter("IN_CUSTODY")}
        />
        <FilterTab
          active={filter === "PENDING"}
          label={`Pending (${stats.pending})`}
          onPress={() => setFilter("PENDING")}
        />
        <FilterTab
          active={filter === "TRANSFERRED"}
          label={`Transferred (${stats.transferred})`}
          onPress={() => setFilter("TRANSFERRED")}
        />
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
          <Ionicons
            name="file-tray-outline"
            size={64}
            color={colors.foregroundMuted}
          />
          <Text style={[styles.emptyText, { color: colors.foreground }]}>
            No batches found
          </Text>
          <Text
            style={[styles.emptySubtext, { color: colors.foregroundMuted }]}
          >
            {filter === "ALL"
              ? "You don't have any batches in your custody yet"
              : `No batches with ${filter.toLowerCase().replace("_", " ")} status`}
          </Text>
        </View>
      )}

      {/* Transfer Dialog */}
      {selectedBatch && (
        <TransferDialog
          visible={showTransferDialog}
          onClose={() => {
            setShowTransferDialog(false);
            setSelectedBatch(null);
          }}
          examSessionId={selectedBatch.id}
          batchQrCode={selectedBatch.batchQrCode}
          courseCode={selectedBatch.courseCode}
          courseName={selectedBatch.courseName}
          custodyStatus={selectedBatch.custodyStatus}
          onSuccess={() => {
            loadBatches();
          }}
        />
      )}

      {/* Confirm Receipt Dialog */}
      <Dialog
        visible={showConfirmDialog}
        onClose={() => {
          setShowConfirmDialog(false);
          setConfirmingBatch(null);
        }}
        title="Confirm Receipt"
        message={`Confirm that you have received the batch "${confirmingBatch?.batchQrCode}" for ${confirmingBatch?.courseCode}?`}
        variant="success"
        icon="checkmark-circle"
        primaryAction={{
          label: "Confirm",
          onPress: handleConfirmReceipt,
        }}
        secondaryAction={{
          label: "Cancel",
          onPress: () => {
            setShowConfirmDialog(false);
            setConfirmingBatch(null);
          },
        }}
      />
    </SafeAreaView>
  );
}

// Helper Components
function InfoRow({
  icon,
  label,
  value,
  valueColor,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  valueColor?: string;
}) {
  const colors = useThemeColors();
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoLabelContainer}>
        <Ionicons name={icon} size={14} color={colors.foregroundMuted} />
        <Text style={[styles.infoLabel, { color: colors.foregroundMuted }]}>
          {label}:
        </Text>
      </View>
      <Text
        style={[
          styles.infoValue,
          { color: colors.foreground },
          valueColor && { color: valueColor },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

function FilterTab({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  const colors = useThemeColors();
  return (
    <TouchableOpacity
      style={[
        styles.filterButton,
        { borderColor: colors.border },
        active && {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
        },
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.filterText,
          { color: colors.foreground },
          active && { color: "#fff" },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function getCustodyColor(status: string): string {
  switch (status) {
    case "IN_CUSTODY":
      return "#10b981";
    case "PENDING_RECEIPT":
      return "#f59e0b";
    case "TRANSFER_INITIATED":
      return "#8b5cf6";
    case "TRANSFERRED":
      return "#6b7280";
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
    case "TRANSFERRED":
      return "TRANSFERRED";
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
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  refreshButton: {
    padding: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 8,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 11,
    fontWeight: "600",
  },
  listContent: {
    padding: 16,
  },
  batchCard: {
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
    fontSize: 17,
    fontWeight: "600",
  },
  courseName: {
    fontSize: 13,
    marginTop: 2,
  },
  batchInfo: {
    gap: 6,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  infoLabel: {
    fontSize: 13,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "500",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
  },
  detailsButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
  },
  detailsButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 13,
    textAlign: "center",
  },
});
