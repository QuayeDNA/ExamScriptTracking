/**
 * TransferDialog Component
 * Unified, reusable dialog for initiating batch transfers with search functionality
 */
import { useState, useEffect, useCallback, useMemo } from "react";
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
import * as Location from "expo-location";

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
  const [searchText, setSearchText] = useState<string>("");
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);

  // Memoized filtered handlers for better performance
  const filteredHandlers = useMemo(() => {
    if (!searchText.trim()) return handlers;
    const searchLower = searchText.toLowerCase();
    return handlers.filter((handler) => {
      const fullName = `${handler.firstName} ${handler.lastName}`.toLowerCase();
      const role = handler.role.toLowerCase();
      const email = handler.email?.toLowerCase() || "";
      return (
        fullName.includes(searchLower) ||
        role.includes(searchLower) ||
        email.includes(searchLower)
      );
    });
  }, [handlers, searchText]);

  // Get selected handler details
  const selectedHandler = useMemo(
    () => handlers.find((h) => h.id === selectedHandlerId),
    [handlers, selectedHandlerId]
  );

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (visible) {
      if (custodyStatus && custodyStatus !== "IN_CUSTODY") {
        setErrorMessage(
          "You can only initiate transfers for batches currently in your custody."
        );
        setShowErrorDialog(true);
        return;
      }
      loadData();
    } else {
      resetState();
    }
  }, [visible, custodyStatus]);

  const resetState = () => {
    setSelectedHandlerId("");
    setLocation("");
    setSearchText("");
    setShowDropdown(false);
    setShowConfirmDialog(false);
    setShowErrorDialog(false);
    setErrorMessage("");
  };

  const loadData = useCallback(async () => {
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
  }, [examSessionId, user?.id]);

  const getCurrentLocation = async () => {
    try {
      setFetchingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Toast.show({
          type: "error",
          text1: "Permission Denied",
          text2: "Location permission is required",
        });
        return;
      }

      const locationData = await Location.getCurrentPositionAsync({});
      const address = await Location.reverseGeocodeAsync({
        latitude: locationData.coords.latitude,
        longitude: locationData.coords.longitude,
      });

      if (address[0]) {
        const { name, street, city, region } = address[0];
        const locationStr = [name, street, city, region]
          .filter(Boolean)
          .join(", ");
        setLocation(locationStr);
      } else {
        setLocation(
          `${locationData.coords.latitude.toFixed(6)}, ${locationData.coords.longitude.toFixed(6)}`
        );
      }
      Toast.show({
        type: "success",
        text1: "Location Updated",
      });
    } catch {
      Toast.show({
        type: "error",
        text1: "Location Error",
        text2: "Failed to get current location",
      });
    } finally {
      setFetchingLocation(false);
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchText(text);
    setShowDropdown(text.trim().length > 0);
  };

  const handleHandlerSelect = (handler: usersApi.Handler) => {
    setSelectedHandlerId(handler.id);
    setSearchText(`${handler.firstName} ${handler.lastName}`);
    setShowDropdown(false);
  };

  const clearSelection = () => {
    setSelectedHandlerId("");
    setSearchText("");
    setShowDropdown(false);
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
          <ScrollView
            style={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
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

            {/* Receiving Handler Section with Search */}
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

              <View style={styles.searchSection}>
                {handlers.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons
                      name="people-outline"
                      size={48}
                      color={colors.foregroundMuted}
                    />
                    <Text
                      style={[
                        styles.emptyStateText,
                        { color: colors.foreground },
                      ]}
                    >
                      No handlers available
                    </Text>
                    <Text
                      style={[
                        styles.emptyStateSubtext,
                        { color: colors.foregroundMuted },
                      ]}
                    >
                      Contact your administrator to add handler roles
                    </Text>
                  </View>
                ) : (
                  <>
                    {/* Search Input */}
                    <View
                      style={[
                        styles.searchInputContainer,
                        { borderColor: colors.border },
                      ]}
                    >
                      <Ionicons
                        name="search"
                        size={20}
                        color={colors.foregroundMuted}
                        style={styles.searchIcon}
                      />
                      <TextInput
                        style={[
                          styles.searchInput,
                          { color: colors.foreground },
                        ]}
                        placeholder="Search by name, role, or email..."
                        placeholderTextColor={colors.foregroundMuted}
                        value={searchText}
                        onChangeText={handleSearchChange}
                        onFocus={() => {
                          if (searchText.trim().length > 0) {
                            setShowDropdown(true);
                          }
                        }}
                      />
                      {selectedHandlerId && (
                        <TouchableOpacity
                          style={styles.clearButton}
                          onPress={clearSelection}
                        >
                          <Ionicons
                            name="close-circle"
                            size={20}
                            color={colors.foregroundMuted}
                          />
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Selected Handler Display */}
                    {selectedHandler && !showDropdown && (
                      <View
                        style={[
                          styles.selectedHandlerCard,
                          {
                            backgroundColor: `${colors.primary}10`,
                            borderColor: colors.primary,
                          },
                        ]}
                      >
                        <View style={styles.selectedHandlerInfo}>
                          <Ionicons
                            name="person-circle"
                            size={40}
                            color={colors.primary}
                          />
                          <View style={styles.selectedHandlerText}>
                            <Text
                              style={[
                                styles.selectedHandlerName,
                                { color: colors.primary },
                              ]}
                            >
                              {selectedHandler.firstName}{" "}
                              {selectedHandler.lastName}
                            </Text>
                            <Text
                              style={[
                                styles.selectedHandlerRole,
                                { color: colors.primary },
                              ]}
                            >
                              {selectedHandler.role.replace(/_/g, " ")}
                            </Text>
                            {selectedHandler.email && (
                              <Text
                                style={[
                                  styles.selectedHandlerEmail,
                                  { color: colors.foregroundMuted },
                                ]}
                              >
                                {selectedHandler.email}
                              </Text>
                            )}
                          </View>
                        </View>
                        <Ionicons
                          name="checkmark-circle"
                          size={28}
                          color={colors.primary}
                        />
                      </View>
                    )}

                    {/* Dropdown Results */}
                    {showDropdown && filteredHandlers.length > 0 && (
                      <View
                        style={[
                          styles.dropdownContainer,
                          { backgroundColor: colors.card, borderColor: colors.border },
                        ]}
                      >
                        <ScrollView
                          style={styles.dropdownScroll}
                          nestedScrollEnabled
                          keyboardShouldPersistTaps="handled"
                        >
                          {filteredHandlers.slice(0, 5).map((handler) => (
                            <TouchableOpacity
                              key={handler.id}
                              style={[
                                styles.dropdownItem,
                                { borderBottomColor: colors.border },
                              ]}
                              onPress={() => handleHandlerSelect(handler)}
                            >
                              <View style={styles.dropdownItemContent}>
                                <Ionicons
                                  name="person-circle-outline"
                                  size={36}
                                  color={colors.foregroundMuted}
                                />
                                <View style={styles.dropdownItemText}>
                                  <Text
                                    style={[
                                      styles.dropdownHandlerName,
                                      { color: colors.foreground },
                                    ]}
                                  >
                                    {handler.firstName} {handler.lastName}
                                  </Text>
                                  <Text
                                    style={[
                                      styles.dropdownHandlerRole,
                                      { color: colors.foregroundMuted },
                                    ]}
                                  >
                                    {handler.role.replace(/_/g, " ")}
                                  </Text>
                                  {handler.email && (
                                    <Text
                                      style={[
                                        styles.dropdownHandlerEmail,
                                        { color: colors.foregroundMuted },
                                      ]}
                                    >
                                      {handler.email}
                                    </Text>
                                  )}
                                </View>
                              </View>
                              {selectedHandlerId === handler.id && (
                                <Ionicons
                                  name="checkmark"
                                  size={20}
                                  color={colors.primary}
                                />
                              )}
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                        {filteredHandlers.length > 5 && (
                          <View
                            style={[
                              styles.moreResultsHint,
                              { backgroundColor: colors.muted },
                            ]}
                          >
                            <Text
                              style={[
                                styles.moreResultsText,
                                { color: colors.foregroundMuted },
                              ]}
                            >
                              +{filteredHandlers.length - 5} more results...
                            </Text>
                          </View>
                        )}
                      </View>
                    )}

                    {/* No Results */}
                    {showDropdown &&
                      searchText.trim().length > 0 &&
                      filteredHandlers.length === 0 && (
                        <View
                          style={[
                            styles.noResults,
                            { backgroundColor: colors.muted },
                          ]}
                        >
                          <Ionicons
                            name="search"
                            size={32}
                            color={colors.foregroundMuted}
                          />
                          <Text
                            style={[
                              styles.noResultsText,
                              { color: colors.foregroundMuted },
                            ]}
                          >
                            No handlers found matching &quot;{searchText}&quot;
                          </Text>
                        </View>
                      )}

                    {/* Helper Text */}
                    {!selectedHandlerId && !showDropdown && (
                      <Text
                        style={[
                          styles.helperText,
                          { color: colors.foregroundMuted },
                        ]}
                      >
                        💡 Start typing to search for a handler
                      </Text>
                    )}
                  </>
                )}
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
              <View style={styles.locationContainer}>
                <View
                  style={[
                    styles.locationInputContainer,
                    { borderColor: colors.border },
                  ]}
                >
                  <TextInput
                    style={[styles.locationInput, { color: colors.foreground }]}
                    placeholder="e.g., Main Office, Room 101"
                    placeholderTextColor={colors.foregroundMuted}
                    value={location}
                    onChangeText={setLocation}
                  />
                </View>
                <TouchableOpacity
                  style={[
                    styles.locationButton,
                    {
                      backgroundColor: colors.muted,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={getCurrentLocation}
                  disabled={fetchingLocation}
                >
                  {fetchingLocation ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Ionicons
                      name="navigate"
                      size={20}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  { backgroundColor: colors.primary },
                  (submitting || !selectedHandlerId || handlers.length === 0) &&
                    styles.submitButtonDisabled,
                ]}
                onPress={handleSubmitRequest}
                disabled={submitting || !selectedHandlerId || handlers.length === 0}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons
                      name="arrow-forward-circle"
                      size={20}
                      color="#fff"
                    />
                    <Text style={styles.submitButtonText}>
                      {!selectedHandlerId
                        ? "Select Handler First"
                        : "Initiate Transfer"}
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

// Helper Component
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
            style={styles.infoIcon}
          />
        )}
        <Text style={[styles.infoLabel, { color: colors.foregroundMuted }]}>
          {label}:
        </Text>
      </View>
      <Text
        style={[styles.infoValue, { color: colors.foreground }, valueStyle]}
        numberOfLines={2}
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
    gap: 4,
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
  infoIcon: {
    marginRight: 6,
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
  searchSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
  },
  clearButton: {
    padding: 4,
  },
  selectedHandlerCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 8,
  },
  selectedHandlerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  selectedHandlerText: {
    flex: 1,
  },
  selectedHandlerName: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  selectedHandlerRole: {
    fontSize: 13,
    textTransform: "capitalize",
    marginBottom: 2,
  },
  selectedHandlerEmail: {
    fontSize: 12,
  },
  dropdownContainer: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
    maxHeight: 240,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderBottomWidth: 1,
  },
  dropdownItemContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  dropdownItemText: {
    flex: 1,
  },
  dropdownHandlerName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  dropdownHandlerRole: {
    fontSize: 12,
    textTransform: "capitalize",
    marginBottom: 2,
  },
  dropdownHandlerEmail: {
    fontSize: 11,
  },
  moreResultsHint: {
    padding: 8,
    alignItems: "center",
  },
  moreResultsText: {
    fontSize: 11,
    fontStyle: "italic",
  },
  noResults: {
    padding: 24,
    borderRadius: 8,
    alignItems: "center",
    gap: 8,
  },
  noResultsText: {
    fontSize: 14,
    textAlign: "center",
  },
  helperText: {
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 4,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 8,
  },
  emptyStateText: {
    fontSize: 15,
    fontWeight: "600",
  },
  emptyStateSubtext: {
    fontSize: 13,
    textAlign: "center",
  },
  locationContainer: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  locationInputContainer: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
  },
  locationInput: {
    padding: 12,
    fontSize: 14,
  },
  locationButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
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