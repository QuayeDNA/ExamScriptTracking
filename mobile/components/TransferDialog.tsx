/**
 * TransferDialog Component
 * Reusable dialog for initiating batch transfers
 */

import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { Modal, Dialog } from "@/components/ui";
import { useAuthStore } from "@/store/auth";
import * as batchTransfersApi from "@/api/batchTransfers";
import * as usersApi from "@/api/users";
import { examSessionsApi } from "@/api/examSessions";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "@/constants/design-system";
import Toast from "react-native-toast-message";

interface TransferDialogProps {
  visible: boolean;
  onClose: () => void;
  examSessionId: string;
  batchQrCode: string;
  courseCode: string;
  courseName: string;
  custodyStatus?: string;
  onSuccess?: () => void;
}

export function TransferDialog({
  visible,
  onClose,
  examSessionId,
  batchQrCode,
  courseCode,
  courseName,
  custodyStatus,
  onSuccess,
}: TransferDialogProps) {
  const user = useAuthStore((state: any) => state.user);
  const colors = useThemeColors();

  const [handlers, setHandlers] = useState<usersApi.Handler[]>([]);
  const [selectedHandlerId, setSelectedHandlerId] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [scriptsCount, setScriptsCount] = useState<number>(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (visible) {
      // Validate custody status
      if (custodyStatus && custodyStatus !== "IN_CUSTODY") {
        setErrorMessage(
          "You can only initiate transfers for batches currently in your custody."
        );
        setShowErrorDialog(true);
        return;
      }
      loadData();
    } else {
      // Reset state when dialog closes
      setSelectedHandlerId("");
      setLocation("");
      setShowConfirmDialog(false);
      setShowErrorDialog(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, custodyStatus]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [handlersData, sessionData] = await Promise.all([
        usersApi.getHandlers(),
        examSessionsApi.getExamSession(examSessionId),
      ]);

      // Filter out current user
      const filteredHandlers = handlersData.handlers.filter(
        (h) => h.id !== user?.id
      );
      setHandlers(filteredHandlers);

      // Get actual attendance count
      const attendanceCount = sessionData.attendances?.length || 0;
      setScriptsCount(attendanceCount);
    } catch (error: any) {
      setErrorMessage(error.error || "Failed to load data");
      setShowErrorDialog(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRequest = () => {
    if (!selectedHandlerId) {
      Toast.show({
        type: "error",
        text1: "Selection Required",
        text2: "Please select a receiving handler",
      });
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleConfirmTransfer = async () => {
    const selectedHandler = handlers.find((h) => h.id === selectedHandlerId);
    if (!selectedHandler) return;

    try {
      setSubmitting(true);
      setShowConfirmDialog(false);

      await batchTransfersApi.createTransfer({
        examSessionId,
        toHandlerId: selectedHandlerId,
        examsExpected: scriptsCount,
        location: location || undefined,
      });

      Toast.show({
        type: "success",
        text1: "Transfer Initiated",
        text2: `Transfer request created successfully`,
      });

      onSuccess?.();
      onClose();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Transfer Failed",
        text2: error.error || "Failed to create transfer request",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const selectedHandler = handlers.find((h) => h.id === selectedHandlerId);

  return (
    <>
      <Modal visible={visible} onClose={onClose} title="Initiate Transfer">
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text
              style={[styles.loadingText, { color: colors.foregroundMuted }]}
            >
              Loading handlers...
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.content}>
            {/* Batch Info Section */}
            <View
              style={[
                styles.section,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={styles.sectionHeader}>
                <Ionicons
                  name="information-circle"
                  size={20}
                  color={colors.primary}
                />
                <Text
                  style={[styles.sectionTitle, { color: colors.foreground }]}
                >
                  Batch Information
                </Text>
              </View>
              <View style={styles.infoGrid}>
                <InfoRow
                  label="Batch QR Code"
                  value={batchQrCode}
                  icon="qr-code"
                />
                <InfoRow
                  label="Course"
                  value={`${courseCode} - ${courseName}`}
                  icon="book"
                />
                <InfoRow
                  label="From"
                  value={user?.name || "Current User"}
                  icon="person-circle"
                />
                <InfoRow
                  label="Scripts Count"
                  value={`${scriptsCount} ${scriptsCount === 1 ? "script" : "scripts"}`}
                  icon="documents"
                  valueStyle={{ fontWeight: "bold", color: colors.primary }}
                />
              </View>
            </View>

            {/* Receiving Handler Section */}
            <View
              style={[
                styles.section,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={styles.sectionHeader}>
                <Ionicons name="person" size={20} color={colors.primary} />
                <Text
                  style={[styles.sectionTitle, { color: colors.foreground }]}
                >
                  Receiving Handler *
                </Text>
              </View>
              <View style={styles.handlersList}>
                {handlers.map((handler) => (
                  <TouchableOpacity
                    key={handler.id}
                    style={[
                      styles.handlerItem,
                      { borderColor: colors.border },
                      selectedHandlerId === handler.id && {
                        borderColor: colors.primary,
                        backgroundColor: `${colors.primary}10`,
                      },
                    ]}
                    onPress={() => setSelectedHandlerId(handler.id)}
                  >
                    <View style={styles.handlerInfo}>
                      <Ionicons
                        name="person-circle"
                        size={40}
                        color={
                          selectedHandlerId === handler.id
                            ? colors.primary
                            : colors.foregroundMuted
                        }
                      />
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.handlerName,
                            { color: colors.foreground },
                            selectedHandlerId === handler.id && {
                              color: colors.primary,
                            },
                          ]}
                        >
                          {handler.firstName} {handler.lastName}
                        </Text>
                        <Text
                          style={[
                            styles.handlerRole,
                            { color: colors.foregroundMuted },
                            selectedHandlerId === handler.id && {
                              color: colors.primary,
                            },
                          ]}
                        >
                          {handler.role}
                        </Text>
                      </View>
                    </View>
                    {selectedHandlerId === handler.id && (
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color={colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Location Section */}
            <View
              style={[
                styles.section,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={styles.sectionHeader}>
                <Ionicons name="location" size={20} color={colors.primary} />
                <Text
                  style={[styles.sectionTitle, { color: colors.foreground }]}
                >
                  Location (Optional)
                </Text>
              </View>
              <View
                style={[styles.inputContainer, { borderColor: colors.border }]}
              >
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="e.g., Main Office, Room 101"
                  placeholderTextColor={colors.foregroundMuted}
                  value={location}
                  onChangeText={setLocation}
                />
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  { backgroundColor: colors.primary },
                  submitting && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmitRequest}
                disabled={submitting || !selectedHandlerId}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons
                      name="arrow-forward-circle"
                      size={20}
                      color="#fff"
                    />
                    <Text style={styles.submitButtonText}>
                      Initiate Transfer
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: colors.border }]}
                onPress={onClose}
                disabled={submitting}
              >
                <Text
                  style={[
                    styles.cancelButtonText,
                    { color: colors.foreground },
                  ]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </Modal>

      {/* Confirmation Dialog */}
      <Dialog
        visible={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        title="Confirm Transfer"
        message={`Initiate transfer of ${scriptsCount} exam ${scriptsCount === 1 ? "script" : "scripts"} to ${selectedHandler?.firstName} ${selectedHandler?.lastName}?`}
        variant="default"
        icon="arrow-forward-circle"
        primaryAction={{
          label: "Confirm",
          onPress: handleConfirmTransfer,
        }}
        secondaryAction={{
          label: "Cancel",
          onPress: () => setShowConfirmDialog(false),
        }}
      />

      {/* Error Dialog */}
      <Dialog
        visible={showErrorDialog}
        onClose={() => {
          setShowErrorDialog(false);
          onClose();
        }}
        title="Cannot Transfer"
        message={errorMessage}
        variant="error"
        icon="alert-circle"
        primaryAction={{
          label: "OK",
          onPress: () => {
            setShowErrorDialog(false);
            onClose();
          },
        }}
      />
    </>
  );
}

// Helper Components
function InfoRow({
  label,
  value,
  icon,
  valueStyle,
}: {
  label: string;
  value: string;
  icon?: keyof typeof Ionicons.glyphMap;
  valueStyle?: any;
}) {
  const colors = useThemeColors();
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoLabelContainer}>
        {icon && (
          <Ionicons
            name={icon}
            size={14}
            color={colors.foregroundMuted}
            style={{ marginRight: 6 }}
          />
        )}
        <Text style={[styles.infoLabel, { color: colors.foregroundMuted }]}>
          {label}:
        </Text>
      </View>
      <Text
        style={[styles.infoValue, { color: colors.foreground }, valueStyle]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 48,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  section: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 16,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  infoGrid: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  infoLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "right",
    flex: 1,
  },
  handlersList: {
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  handlerItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderWidth: 2,
    borderRadius: 12,
  },
  handlerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  handlerName: {
    fontSize: 14,
    fontWeight: "600",
  },
  handlerRole: {
    fontSize: 12,
    marginTop: 2,
  },
  inputContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderRadius: 8,
  },
  input: {
    padding: 12,
    fontSize: 14,
  },
  actions: {
    gap: 12,
    marginBottom: 16,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    borderRadius: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  cancelButton: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
