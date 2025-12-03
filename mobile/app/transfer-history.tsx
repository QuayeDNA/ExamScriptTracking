import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as batchTransfersApi from "@/api/batchTransfers";
import type { BatchTransfer } from "@/api/batchTransfers";

export default function TransferHistoryScreen() {
  const { examSessionId } = useLocalSearchParams<{ examSessionId: string }>();
  const router = useRouter();

  const [examSession, setExamSession] = useState<{
    courseCode: string;
    courseName: string;
    venue: string;
    examDate: string;
    status: string;
  } | null>(null);
  const [transfers, setTransfers] = useState<BatchTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examSessionId]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await batchTransfersApi.getTransferHistory(examSessionId);
      setExamSession(data.examSession);
      setTransfers(data.transfers);
    } catch (error: any) {
      Alert.alert("Error", error.error || "Failed to load transfer history");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const renderTransfer = ({
    item,
    index,
  }: {
    item: BatchTransfer;
    index: number;
  }) => {
    const hasDiscrepancy = item.scriptsExpected !== item.scriptsReceived;
    const isPending = item.status === "PENDING";

    return (
      <View style={styles.transferCard}>
        <View style={styles.transferHeader}>
          <Text style={styles.transferNumber}>Transfer #{index + 1}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          >
            <Text style={styles.statusText}>
              {item.status.replace(/_/g, " ")}
            </Text>
          </View>
        </View>

        <View style={styles.transferFlow}>
          <View style={styles.handlerBox}>
            <Text style={styles.handlerLabel}>From</Text>
            <Text style={styles.handlerName}>
              {item.fromHandler.firstName} {item.fromHandler.lastName}
            </Text>
            <Text style={styles.handlerRole}>{item.fromHandler.role}</Text>
          </View>

          <View style={styles.arrowContainer}>
            <Text style={styles.arrow}>→</Text>
          </View>

          <View style={styles.handlerBox}>
            <Text style={styles.handlerLabel}>To</Text>
            <Text style={styles.handlerName}>
              {item.toHandler.firstName} {item.toHandler.lastName}
            </Text>
            <Text style={styles.handlerRole}>{item.toHandler.role}</Text>
          </View>
        </View>

        <View style={styles.transferDetails}>
          <DetailRow
            label="Scripts Expected"
            value={item.scriptsExpected.toString()}
          />
          {item.scriptsReceived !== null && (
            <DetailRow
              label="Scripts Received"
              value={item.scriptsReceived.toString()}
              highlight={hasDiscrepancy}
            />
          )}
          {item.location && (
            <DetailRow label="Location" value={item.location} />
          )}
          <DetailRow
            label="Requested"
            value={new Date(item.requestedAt).toLocaleString()}
          />
          {item.confirmedAt && (
            <DetailRow
              label="Confirmed"
              value={new Date(item.confirmedAt).toLocaleString()}
            />
          )}
          {item.discrepancyNote && (
            <View style={styles.discrepancyNote}>
              <Text style={styles.discrepancyLabel}>⚠️ Discrepancy Note:</Text>
              <Text style={styles.discrepancyText}>{item.discrepancyNote}</Text>
            </View>
          )}
        </View>

        {isPending && (
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() =>
              router.push({
                pathname: "/confirm-transfer",
                params: { transferId: item.id },
              })
            }
          >
            <Text style={styles.viewButtonText}>View & Confirm</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading transfer history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Exam Session Info Header */}
      {examSession && (
        <View style={styles.headerCard}>
          <Text style={styles.headerTitle}>
            {examSession.courseCode} - {examSession.courseName}
          </Text>
          <Text style={styles.headerSubtitle}>Venue: {examSession.venue}</Text>
          <Text style={styles.headerSubtitle}>
            Date: {new Date(examSession.examDate).toLocaleDateString()}
          </Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getBatchStatusColor(examSession.status) },
              { marginTop: 8 },
            ]}
          >
            <Text style={styles.statusText}>
              {examSession.status.replace(/_/g, " ")}
            </Text>
          </View>
        </View>
      )}

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
          ListHeaderComponent={
            <Text style={styles.listHeader}>
              Chain of Custody ({transfers.length} transfer
              {transfers.length !== 1 ? "s" : ""})
            </Text>
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No transfers recorded yet</Text>
          <Text style={styles.emptySubtext}>
            Transfer history will appear here once batch transfers begin
          </Text>
        </View>
      )}
    </View>
  );
}

// Helper component for detail rows
function DetailRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}:</Text>
      <Text
        style={[styles.detailValue, highlight && styles.detailValueHighlight]}
      >
        {value}
      </Text>
    </View>
  );
}

// Helper function for transfer status colors
function getStatusColor(status: string): string {
  switch (status) {
    case "PENDING":
      return "#f59e0b";
    case "CONFIRMED":
      return "#10b981";
    case "DISCREPANCY_REPORTED":
      return "#ef4444";
    case "RESOLVED":
      return "#6366f1";
    default:
      return "#6b7280";
  }
}

// Helper function for batch status colors
function getBatchStatusColor(status: string): string {
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
  headerCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 2,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
  },
  listContent: {
    padding: 16,
  },
  listHeader: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
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
    alignItems: "center",
    marginBottom: 12,
  },
  transferNumber: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  transferFlow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
  },
  handlerBox: {
    flex: 1,
    alignItems: "center",
  },
  handlerLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
  },
  handlerName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    textAlign: "center",
  },
  handlerRole: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  arrowContainer: {
    paddingHorizontal: 8,
  },
  arrow: {
    fontSize: 24,
    color: "#3b82f6",
    fontWeight: "bold",
  },
  transferDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  detailValue: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
  },
  detailValueHighlight: {
    color: "#ef4444",
    fontWeight: "600",
  },
  discrepancyNote: {
    marginTop: 8,
    padding: 12,
    backgroundColor: "#fef2f2",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  discrepancyLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#dc2626",
    marginBottom: 4,
  },
  discrepancyText: {
    fontSize: 14,
    color: "#991b1b",
  },
  viewButton: {
    marginTop: 12,
    backgroundColor: "#3b82f6",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  viewButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
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
