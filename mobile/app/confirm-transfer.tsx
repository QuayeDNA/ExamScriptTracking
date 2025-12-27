import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as batchTransfersApi from "@/api/batchTransfers";
import type { BatchTransfer } from "@/api/batchTransfers";
import { Dialog, Button, Card, Alert } from "@/components/ui";
import { useThemeColors } from "@/constants/design-system";
import Toast from "react-native-toast-message";

export default function ConfirmTransferScreen() {
  const { transferId, quickAccept } = useLocalSearchParams<{
    transferId: string;
    quickAccept?: string;
  }>();
  const router = useRouter();
  const colors = useThemeColors();

  const [transfer, setTransfer] = useState<BatchTransfer | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [scriptsReceived, setScriptsReceived] = useState<string>("");
  const [discrepancyNote, setDiscrepancyNote] = useState<string>("");

  // Dialog states
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showRejectionReasonDialog, setShowRejectionReasonDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState<string>("");

  // Helper function for status colors
  const getStatusColor = (status: string): string => {
    switch (status) {
      case "PENDING":
        return colors.warning;
      case "CONFIRMED":
        return colors.success;
      case "DISCREPANCY_REPORTED":
        return colors.error;
      case "RESOLVED":
        return colors.info;
      default:
        return colors.foregroundMuted;
    }
  };

  // Helper function for transfer priority
  const getTransferPriority = (role: string) => {
    let priority: "HIGH" | "MEDIUM" | "NORMAL" = "NORMAL";
    let priorityColor = colors.foregroundMuted;
    let priorityIcon = "flag-outline";

    switch (role) {
      case "DEPARTMENT_HEAD":
      case "FACULTY_OFFICER":
        priority = "HIGH";
        priorityColor = colors.error;
        priorityIcon = "flag";
        break;
      case "LECTURER":
        priority = "MEDIUM";
        priorityColor = colors.warning;
        priorityIcon = "flag-outline";
        break;
      default:
        priority = "NORMAL";
        priorityColor = colors.foregroundMuted;
        priorityIcon = "flag-outline";
    }

    return (
      <View style={[styles.priorityBadge, { backgroundColor: priorityColor + "20" }]}>
        <Ionicons name={priorityIcon as any} size={16} color={priorityColor} />
        <Text style={[styles.priorityText, { color: priorityColor }]}>
          {priority} PRIORITY
        </Text>
      </View>
    );
  };

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
      Toast.show({
        type: "error",
        text1: "Load Failed",
        text2: error.error || "Failed to load transfer details",
      });
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    const receivedCount = parseInt(scriptsReceived);
    if (isNaN(receivedCount) || receivedCount < 0) {
      Toast.show({
        type: "error",
        text1: "Invalid Input",
        text2: "Please enter a valid number of scripts received",
      });
      return;
    }

    setShowConfirmDialog(true);
  };

  const handleConfirmTransfer = async () => {
    const receivedCount = parseInt(scriptsReceived);

    try {
      setSubmitting(true);
      setShowConfirmDialog(false);

      await batchTransfersApi.confirmTransfer(transferId, {
        examsReceived: receivedCount,
        discrepancyNote: discrepancyNote.trim() || undefined,
      });

      Toast.show({
        type: "success",
        text1: "Transfer Confirmed",
        text2: "You now have custody of this batch",
      });

      router.back();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Confirmation Failed",
        text2: error.error || "Failed to confirm transfer",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickAccept = async () => {
    if (!transfer) return;

    try {
      setSubmitting(true);
      await batchTransfersApi.confirmTransfer(transferId, {
        examsReceived: transfer.examsExpected, // Assume all received for quick accept
      });

      Toast.show({
        type: "success",
        text1: "Transfer Accepted",
        text2: "You now have custody of this batch",
      });

      router.back();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Quick Accept Failed",
        text2: error.error || "Failed to accept transfer",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    setShowRejectDialog(true);
  };

  const handleConfirmReject = async () => {
    setShowRejectDialog(false);
    setShowRejectionReasonDialog(true);
  };

  const handleSubmitRejection = async () => {
    try {
      setSubmitting(true);
      setShowRejectionReasonDialog(false);

      await batchTransfersApi.rejectTransfer(transferId, rejectionReason.trim() || undefined);

      Toast.show({
        type: "success",
        text1: "Transfer Rejected",
        text2: "Transfer has been rejected successfully",
      });

      router.back();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Rejection Failed",
        text2: error.error || "Failed to reject transfer",
      });
    } finally {
      setSubmitting(false);
      setRejectionReason("");
    }
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.foregroundMuted }]}>
          Loading transfer details...
        </Text>
      </View>
    );
  }

  if (!transfer) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle" size={48} color={colors.error} />
        <Text style={[styles.errorText, { color: colors.foreground }]}>
          Transfer not found
        </Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          {/* Transfer Status */}
          <Card style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Ionicons name="information-circle" size={20} color={colors.primary} />
              <Text style={[styles.statusLabel, { color: colors.foreground }]}>
                Transfer Status
              </Text>
            </View>
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
          </Card>

          {/* Transfer Priority */}
          <Card style={styles.priorityCard}>
            <View style={styles.priorityHeader}>
              <Ionicons name="flag" size={20} color={colors.warning} />
              <Text style={[styles.priorityLabel, { color: colors.foreground }]}>
                Transfer Priority
              </Text>
            </View>
            <View style={styles.priorityContainer}>
              {getTransferPriority(transfer.toHandler.role)}
            </View>
          </Card>

          {/* Batch Information */}
          <Card>
            <View style={styles.cardHeader}>
              <Ionicons name="document-text" size={20} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                Batch Information
              </Text>
            </View>
            <InfoRow
              label="Batch QR Code"
              value={transfer.examSession.batchQrCode}
              icon="qr-code"
            />
            <InfoRow
              label="Course"
              value={`${transfer.examSession.courseCode} - ${transfer.examSession.courseName}`}
              icon="book"
            />
            <InfoRow label="Venue" value={transfer.examSession.venue} icon="location" />
          </Card>

          {/* Transfer Details */}
          <Card>
            <View style={styles.cardHeader}>
              <Ionicons name="swap-horizontal" size={20} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                Transfer Details
              </Text>
            </View>
            <InfoRow
              label="From"
              value={`${transfer.fromHandler.firstName} ${transfer.fromHandler.lastName} (${transfer.fromHandler.role})`}
              icon="person-circle"
            />
            <InfoRow
              label="To"
              value={`${transfer.toHandler.firstName} ${transfer.toHandler.lastName} (${transfer.toHandler.role})`}
              icon="person-circle-outline"
            />
            <InfoRow
              label="Scripts Expected"
              value={transfer.examsExpected.toString()}
              icon="document"
            />
            <InfoRow
              label="Requested At"
              value={new Date(transfer.requestedAt).toLocaleString()}
              icon="time"
            />
            {transfer.location && (
              <InfoRow label="Location" value={transfer.location} icon="location" />
            )}
          </Card>

          {/* Confirmation Message */}
          <Card>
            <View style={styles.cardHeader}>
              <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                Confirm Receipt
              </Text>
            </View>
            <Text style={[styles.confirmMessage, { color: colors.foregroundMuted }]}>
              Please confirm that you have received the exam scripts from{" "}
              <Text style={[styles.handlerName, { color: colors.foreground }]}>
                {transfer.fromHandler.firstName} {transfer.fromHandler.lastName}
              </Text>
              .
            </Text>

            {/* Scripts Count Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.foreground }]}>
                Scripts Received
              </Text>
              <TextInput
                style={[
                  styles.numberInput,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.foreground,
                  },
                ]}
                value={scriptsReceived}
                onChangeText={setScriptsReceived}
                keyboardType="numeric"
                placeholder="Enter actual count"
                placeholderTextColor={colors.foregroundMuted}
              />
              <Text style={[styles.expectedText, { color: colors.foregroundMuted }]}>
                Expected: {transfer.examsExpected} scripts
              </Text>
            </View>

            {/* Discrepancy Note (shown when count differs) */}
            {parseInt(scriptsReceived) !== transfer.examsExpected && scriptsReceived !== "" && (
              <View style={styles.discrepancyContainer}>
                <Alert variant="warning" title="Discrepancy Detected">
                  <Text style={{ color: colors.foregroundMuted }}>
                    The received count differs from expected. This will create an incident report for investigation.
                  </Text>
                </Alert>
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.foreground }]}>
                    Discrepancy Note (Required)
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                        color: colors.foreground,
                      },
                    ]}
                    value={discrepancyNote}
                    onChangeText={setDiscrepancyNote}
                    placeholder="Explain the discrepancy (e.g., '2 scripts missing', 'Extra script found')"
                    placeholderTextColor={colors.foregroundMuted}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>
              </View>
            )}

            <Text style={[styles.noteText, { color: colors.foregroundMuted }]}>
              ℹ️ By confirming, you acknowledge custody of this batch.
            </Text>
          </Card>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <Button
              variant="default"
              size="lg"
              onPress={handleConfirm}
              disabled={submitting}
              loading={submitting}
              style={{ flex: 1, marginRight: 8 }}
            >
              ✓ Confirm Receipt
            </Button>

            <Button
              variant="destructive"
              size="lg"
              onPress={handleReject}
              disabled={submitting}
              style={{ flex: 1, marginLeft: 8 }}
            >
              Reject Transfer
            </Button>
          </View>

          <Button
            variant="outline"
            size="lg"
            onPress={() => router.back()}
            disabled={submitting}
            style={{ marginTop: 12 }}
          >
            Back
          </Button>
        </View>
      </ScrollView>

      {/* Confirmation Dialog */}
      <Dialog
        visible={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        title="Confirm Transfer"
        message={
          parseInt(scriptsReceived) !== transfer.examsExpected
            ? `Confirm receipt of ${scriptsReceived} scripts (expected: ${transfer.examsExpected})? This will create an incident report.`
            : `Confirm that you have received ${scriptsReceived} exam scripts from ${transfer.fromHandler.firstName} ${transfer.fromHandler.lastName}?`
        }
        variant="default"
        primaryAction={{
          label: "Confirm",
          onPress: handleConfirmTransfer,
        }}
        secondaryAction={{
          label: "Cancel",
          onPress: () => setShowConfirmDialog(false),
        }}
      />

      {/* Rejection Confirmation Dialog */}
      <Dialog
        visible={showRejectDialog}
        onClose={() => setShowRejectDialog(false)}
        title="Reject Transfer"
        message="Are you sure you want to reject this transfer? This action cannot be undone."
        variant="warning"
        primaryAction={{
          label: "Reject",
          onPress: handleConfirmReject,
        }}
        secondaryAction={{
          label: "Cancel",
          onPress: () => setShowRejectDialog(false),
        }}
      />

      {/* Rejection Reason Dialog */}
      <Dialog
        visible={showRejectionReasonDialog}
        onClose={() => setShowRejectionReasonDialog(false)}
        title="Rejection Reason"
        message={
          <View>
            <Text style={{ marginBottom: 12, color: colors.foregroundMuted }}>
              Please provide a reason for rejecting this transfer
            </Text>
            <TextInput
              style={[
                styles.reasonInput,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
              value={rejectionReason}
              onChangeText={setRejectionReason}
              placeholder="Enter rejection reason..."
              placeholderTextColor={colors.foregroundMuted}
              multiline
              numberOfLines={3}
            />
          </View>
        }
        variant="default"
        primaryAction={{
          label: "Submit",
          onPress: handleSubmitRejection,
        }}
        secondaryAction={{
          label: "Cancel",
          onPress: () => setShowRejectionReasonDialog(false),
        }}
      />

      <Toast />
    </>
  );
}

// Helper component for info rows
function InfoRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const colors = useThemeColors();

  return (
    <View style={styles.infoRow}>
      <View style={styles.infoLabelContainer}>
        {icon && (
          <Ionicons
            name={icon}
            size={16}
            color={colors.foregroundMuted}
            style={styles.infoIcon}
          />
        )}
        <Text style={[styles.label, { color: colors.foregroundMuted }]}>
          {label}:
        </Text>
      </View>
      <Text style={[styles.value, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6b7280",
  },
  errorText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 12,
    textAlign: "center",
    color: "#ef4444",
  },
  content: {
    padding: 16,
  },
  statusCard: {
    marginBottom: 12,
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0a0a0a",
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#2563eb",
  },
  statusText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  priorityCard: {
    marginBottom: 16,
  },
  priorityHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  priorityLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0a0a0a",
  },
  priorityContainer: {
    alignItems: "center",
  },
  priorityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#ef4444",
  },
  priorityText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0a0a0a",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingVertical: 4,
  },
  infoLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  infoIcon: {
    marginRight: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#71717a",
  },
  value: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
    color: "#0a0a0a",
  },
  confirmMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
    color: "#0a0a0a",
  },
  handlerName: {
    fontWeight: "600",
    color: "#2563eb",
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: "#0a0a0a",
  },
  numberInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 4,
    textAlign: "center",
    fontWeight: "600",
    borderColor: "#e4e4e7",
    backgroundColor: "#ffffff",
    color: "#0a0a0a",
  },
  expectedText: {
    fontSize: 12,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 4,
    color: "#71717a",
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: "top",
    borderColor: "#e4e4e7",
    backgroundColor: "#ffffff",
    color: "#0a0a0a",
  },
  discrepancyContainer: {
    marginTop: 12,
    marginBottom: 16,
  },
  noteText: {
    fontSize: 12,
    fontStyle: "italic",
    textAlign: "center",
    color: "#71717a",
  },
  buttonContainer: {
    flexDirection: "row",
    marginBottom: 12,
  },
  reasonInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: "top",
    marginTop: 8,
    borderColor: "#e4e4e7",
    backgroundColor: "#ffffff",
    color: "#0a0a0a",
  },
});