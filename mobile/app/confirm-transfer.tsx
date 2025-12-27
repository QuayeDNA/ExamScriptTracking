import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as batchTransfersApi from "@/api/batchTransfers";
import type { BatchTransfer } from "@/api/batchTransfers";

export default function ConfirmTransferScreen() {
  const { transferId, quickAccept } = useLocalSearchParams<{
    transferId: string;
    quickAccept?: string;
  }>();
  const router = useRouter();

  const [transfer, setTransfer] = useState<BatchTransfer | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [scriptsReceived, setScriptsReceived] = useState<string>("");
  const [discrepancyNote, setDiscrepancyNote] = useState<string>("");

  useEffect(() => {
    loadTransfer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transferId]);

  // Auto-confirm for quick accept from notification
  useEffect(() => {
    if (quickAccept === "true" && transfer && !loading && !submitting) {
      // Auto-confirm with expected count for quick accept
      handleQuickAccept();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quickAccept, transfer, loading, submitting]);

  const loadTransfer = async () => {
    try {
      setLoading(true);
      const data = await batchTransfersApi.getTransferById(transferId);
      setTransfer(data.transfer);
      // Initialize with expected count
      setScriptsReceived(data.transfer.examsExpected.toString());
    } catch (error: any) {
      Alert.alert("Error", error.error || "Failed to load transfer details");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    const receivedCount = parseInt(scriptsReceived);
    if (isNaN(receivedCount) || receivedCount < 0) {
      Alert.alert("Error", "Please enter a valid number of scripts received");
      return;
    }

    const hasDiscrepancy = receivedCount !== transfer!.examsExpected;
    const confirmMessage = hasDiscrepancy
      ? `Confirm receipt of ${receivedCount} scripts (expected: ${transfer!.examsExpected})? This will create an incident report.`
      : `Confirm that you have received ${receivedCount} exam scripts from ${transfer!.fromHandler.firstName} ${transfer!.fromHandler.lastName}?`;

    Alert.alert(
      "Confirm Transfer",
      confirmMessage,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            try {
              setSubmitting(true);
              await batchTransfersApi.confirmTransfer(transferId, {
                examsReceived: receivedCount,
                discrepancyNote: discrepancyNote.trim() || undefined,
              });

              Alert.alert(
                "✓ Transfer Confirmed",
                "You now have custody of this batch.",
                [
                  {
                    text: "OK",
                    onPress: () => router.back(),
                  },
                ]
              );
            } catch (error: any) {
              Alert.alert("Error", error.error || "Failed to confirm transfer");
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const handleQuickAccept = async () => {
    if (!transfer) return;

    try {
      setSubmitting(true);
      await batchTransfersApi.confirmTransfer(transferId, {
        examsReceived: transfer.examsExpected, // Assume all received for quick accept
      });

      Alert.alert(
        "✓ Transfer Accepted",
        "You now have custody of this batch.",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert("Error", error.error || "Failed to accept transfer");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    Alert.alert(
      "Reject Transfer",
      "Are you sure you want to reject this transfer? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: async () => {
            // Prompt for reason
            Alert.prompt(
              "Rejection Reason",
              "Please provide a reason for rejecting this transfer",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Submit",
                  onPress: async (reason?: string) => {
                    try {
                      setSubmitting(true);
                      await batchTransfersApi.rejectTransfer(
                        transferId,
                        reason
                      );

                      Alert.alert("Success", "Transfer rejected successfully", [
                        {
                          text: "OK",
                          onPress: () => router.back(),
                        },
                      ]);
                    } catch (error: any) {
                      Alert.alert(
                        "Error",
                        error.error || "Failed to reject transfer"
                      );
                    } finally {
                      setSubmitting(false);
                    }
                  },
                },
              ],
              "plain-text"
            );
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading transfer details...</Text>
      </View>
    );
  }

  if (!transfer) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Transfer not found</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          {/* Transfer Status */}
          <View style={[styles.card, styles.statusCard]}>
            <Text style={styles.statusLabel}>Transfer Status</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(transfer.status) },
              ]}
            >
              <Text style={styles.statusText}>
                {transfer.status.replace(/_/g, " ")}
              </Text>
            </View>
          </View>

          {/* Transfer Priority */}
          <View style={[styles.card, styles.priorityCard]}>
            <Text style={styles.priorityLabel}>Transfer Priority</Text>
            <View style={styles.priorityContainer}>
              {getTransferPriority(transfer.toHandler.role)}
            </View>
          </View>

          {/* Batch Information */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Batch Information</Text>
            <InfoRow
              label="Batch QR Code"
              value={transfer.examSession.batchQrCode}
            />
            <InfoRow
              label="Course"
              value={`${transfer.examSession.courseCode} - ${transfer.examSession.courseName}`}
            />
            <InfoRow label="Venue" value={transfer.examSession.venue} />
          </View>

          {/* Transfer Details */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Transfer Details</Text>
            <InfoRow
              label="From"
              value={`${transfer.fromHandler.firstName} ${transfer.fromHandler.lastName} (${transfer.fromHandler.role})`}
            />
            <InfoRow
              label="To"
              value={`${transfer.toHandler.firstName} ${transfer.toHandler.lastName} (${transfer.toHandler.role})`}
            />
            <InfoRow
              label="Scripts Expected"
              value={transfer.examsExpected.toString()}
            />
            <InfoRow
              label="Requested At"
              value={new Date(transfer.requestedAt).toLocaleString()}
            />
            {transfer.location && (
              <InfoRow label="Location" value={transfer.location} />
            )}
          </View>

          {/* Confirmation Message */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Confirm Receipt</Text>
            <Text style={styles.confirmMessage}>
              Please confirm that you have received the exam scripts from{" "}
              <Text style={styles.handlerName}>
                {transfer.fromHandler.firstName} {transfer.fromHandler.lastName}
              </Text>
              .
            </Text>

            {/* Scripts Count Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Scripts Received</Text>
              <TextInput
                style={styles.numberInput}
                value={scriptsReceived}
                onChangeText={setScriptsReceived}
                keyboardType="numeric"
                placeholder="Enter actual count"
                placeholderTextColor="#9ca3af"
              />
              <Text style={styles.expectedText}>
                Expected: {transfer.examsExpected} scripts
              </Text>
            </View>

            {/* Discrepancy Note (shown when count differs) */}
            {parseInt(scriptsReceived) !== transfer.examsExpected && scriptsReceived !== "" && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Discrepancy Note (Required)</Text>
                <TextInput
                  style={[styles.textInput, styles.discrepancyInput]}
                  value={discrepancyNote}
                  onChangeText={setDiscrepancyNote}
                  placeholder="Explain the discrepancy (e.g., '2 scripts missing', 'Extra script found')"
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
                <Text style={styles.warningText}>
                  ⚠️ This will create an incident report for investigation
                </Text>
              </View>
            )}

            <Text style={styles.noteText}>
              ℹ️ By confirming, you acknowledge custody of this batch.
            </Text>
          </View>

          {/* Action Buttons */}
          <TouchableOpacity
            style={[styles.confirmButton, submitting && styles.buttonDisabled]}
            onPress={handleConfirm}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.confirmButtonText}>✓ Confirm Receipt</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.rejectButton, submitting && styles.buttonDisabled]}
            onPress={handleReject}
            disabled={submitting}
          >
            <Text style={styles.rejectButtonText}>Reject Transfer</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
            disabled={submitting}
          >
            <Text style={styles.cancelButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}

// Helper component for info rows
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.label}>{label}:</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

// Helper function for status colors
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

// Helper function for transfer priority
function getTransferPriority(role: string) {
  let priority: "HIGH" | "MEDIUM" | "NORMAL" = "NORMAL";
  let priorityColor = "#6b7280";
  let priorityIcon = "flag-outline";

  switch (role) {
    case "DEPARTMENT_HEAD":
    case "FACULTY_OFFICER":
      priority = "HIGH";
      priorityColor = "#ef4444";
      priorityIcon = "flag";
      break;
    case "LECTURER":
      priority = "MEDIUM";
      priorityColor = "#f59e0b";
      priorityIcon = "flag-outline";
      break;
    default:
      priority = "NORMAL";
      priorityColor = "#6b7280";
      priorityIcon = "flag-outline";
  }

  return (
    <View style={styles.priorityBadge}>
      <Ionicons name={priorityIcon as any} size={16} color={priorityColor} />
      <Text style={[styles.priorityText, { color: priorityColor }]}>
        {priority} PRIORITY
      </Text>
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
  errorText: {
    fontSize: 16,
    color: "#ef4444",
    fontWeight: "600",
  },
  content: {
    padding: 16,
  },
  card: {
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
  statusCard: {
    alignItems: "center",
  },
  statusLabel: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  priorityCard: {
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
  priorityLabel: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "600",
    marginBottom: 8,
  },
  priorityContainer: {
    alignItems: "flex-start",
  },
  priorityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f9fafb",
  },
  priorityText: {
    fontSize: 12,
    fontWeight: "700",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  value: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  numberInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
    textAlign: "center",
    fontWeight: "600",
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: "#fff",
    minHeight: 80,
  },
  discrepancyInput: {
    borderColor: "#f59e0b",
    backgroundColor: "#fefce8",
  },
  expectedText: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 4,
  },
  warningText: {
    fontSize: 12,
    color: "#dc2626",
    fontWeight: "500",
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: "#fff",
  },
  inputDiscrepancy: {
    borderColor: "#ef4444",
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  discrepancyWarning: {
    marginTop: 8,
    padding: 12,
    backgroundColor: "#fef2f2",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  discrepancyWarningText: {
    fontSize: 14,
    color: "#dc2626",
    fontWeight: "500",
  },
  confirmButton: {
    backgroundColor: "#10b981",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  rejectButton: {
    backgroundColor: "#ef4444",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  rejectButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    backgroundColor: "#e5e7eb",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  cancelButtonText: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  confirmMessage: {
    fontSize: 16,
    color: "#374151",
    lineHeight: 24,
    marginBottom: 16,
  },
  handlerName: {
    fontWeight: "700",
    color: "#111827",
  },
  infoHighlight: {
    backgroundColor: "#eff6ff",
    padding: 16,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  infoHighlightLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e40af",
  },
  infoHighlightValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1e40af",
  },
  noteText: {
    fontSize: 14,
    color: "#6b7280",
    fontStyle: "italic",
  },
});
