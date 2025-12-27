import { useState, useEffect, useCallback } from "react";
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
import { useAuthStore } from "@/store/auth";
import * as batchTransfersApi from "@/api/batchTransfers";
import * as usersApi from "@/api/users";
import { examSessionsApi } from "@/api/examSessions";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";

export default function InitiateTransferScreen() {
  const { examSessionId, batchQrCode, courseCode, courseName, custodyStatus } =
    useLocalSearchParams<{
      examSessionId: string;
      batchQrCode: string;
      courseCode: string;
      courseName: string;
      custodyStatus?: string;
    }>();
  const router = useRouter();
  const user = useAuthStore((state: any) => state.user);

  const [handlers, setHandlers] = useState<usersApi.Handler[]>([]);
  const [selectedHandlerId, setSelectedHandlerId] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [scriptsCount, setScriptsCount] = useState<number>(0);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [searchText, setSearchText] = useState<string>("");
  const [showDropdown, setShowDropdown] = useState<boolean>(false);

  // Filter handlers based on search text
  const filteredHandlers = handlers.filter((handler) => {
    if (!searchText.trim()) return false;
    const searchLower = searchText.toLowerCase();
    const fullName = `${handler.firstName} ${handler.lastName}`.toLowerCase();
    const role = handler.role.toLowerCase();
    const email = handler.email?.toLowerCase() || "";
    return fullName.includes(searchLower) || role.includes(searchLower) || email.includes(searchLower);
  });

  // Get selected handler details
  const selectedHandler = handlers.find((h) => h.id === selectedHandlerId);

  // Handle search input change
  const handleSearchChange = (text: string) => {
    setSearchText(text);
    setShowDropdown(text.trim().length > 0);
  };

  // Handle handler selection
  const handleHandlerSelect = (handler: usersApi.Handler) => {
    setSelectedHandlerId(handler.id);
    setSearchText(`${handler.firstName} ${handler.lastName}`);
    setShowDropdown(false);
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedHandlerId("");
    setSearchText("");
    setShowDropdown(false);
  };

  useEffect(() => {
    // Validate custody status
    if (custodyStatus && custodyStatus !== "IN_CUSTODY") {
      Alert.alert(
        "Cannot Transfer",
        "You can only initiate transfers for batches currently in your custody.",
        [{ text: "OK", onPress: () => router.back() }]
      );
      return;
    }

    loadHandlers();
  }, [custodyStatus]);

  const loadHandlers = useCallback(async () => {
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
      console.error("[INITIATE_TRANSFER] Error loading handlers:", error);
      if (
        error.message?.includes("Network") ||
        error.message?.includes("fetch")
      ) {
        setIsOffline(true);
        Alert.alert(
          "Network Error",
          "Unable to load data. Please check your connection and try again."
        );
      } else {
        Alert.alert("Error", error.error || "Failed to load data");
      }
    } finally {
      setLoading(false);
    }
  }, [examSessionId, user?.id]);

  const getCurrentLocation = async () => {
    try {
      setFetchingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permission is required to get your current location."
        );
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
    } catch {
      Alert.alert("Error", "Failed to get current location");
    } finally {
      setFetchingLocation(false);
    }
  };

  const handleSubmit = async () => {
    if (handlers.length === 0) {
      Alert.alert(
        "No Handlers Available",
        "There are no users with handler roles available to receive this transfer. Please contact your administrator.",
        [{ text: "OK" }]
      );
      return;
    }

    if (isOffline) {
      Alert.alert(
        "Offline",
        "Transfer cannot be initiated while offline. Please check your connection and try again.",
        [{ text: "OK" }]
      );
      return;
    }

    if (!selectedHandlerId) {
      Alert.alert("Error", "Please select a receiving handler");
      return;
    }

    const selectedHandler = handlers.find((h) => h.id === selectedHandlerId);
    if (!selectedHandler) return;

    Alert.alert(
      "Confirm Transfer",
      `Initiate transfer of exam scripts to ${selectedHandler.firstName} ${selectedHandler.lastName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            try {
              setSubmitting(true);
              await batchTransfersApi.createTransfer({
                examSessionId,
                toHandlerId: selectedHandlerId,
                examsExpected: scriptsCount,
                location: location || undefined,
              });

              Alert.alert("Success", "Transfer request created successfully", [
                { text: "OK", onPress: () => router.back() },
              ]);
            } catch (error: any) {
              Alert.alert(
                "Error",
                error.error || "Failed to create transfer request"
              );
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading handlers...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.content}>
        {/* Offline Indicator */}
        {isOffline && (
          <View style={styles.offlineBanner}>
            <Ionicons name="cloud-offline" size={20} color="#ef4444" />
            <Text style={styles.offlineText}>
              You&apos;re currently offline. Some features may not be available.
            </Text>
          </View>
        )}

        {/* Batch Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Batch Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Batch QR Code:</Text>
            <Text style={styles.value}>{batchQrCode}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Course:</Text>
            <Text style={styles.value}>
              {courseCode} - {courseName}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>From:</Text>
            <Text style={styles.value}>{user?.name || "Current User"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Scripts Count:</Text>
            <Text
              style={[styles.value, { fontWeight: "bold", color: "#3b82f6" }]}
            >
              {scriptsCount} {scriptsCount === 1 ? "script" : "scripts"}
            </Text>
          </View>
        </View>

        {/* Transfer Form */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Transfer Details</Text>

          {/* Receiving Handler with Search */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Receiving Handler *</Text>
            {handlers.length === 0 ? (
              <View style={styles.emptyHandlersContainer}>
                <Text style={styles.emptyHandlersText}>
                  No handlers available for transfer
                </Text>
                <Text style={styles.emptyHandlersSubtext}>
                  Please contact your administrator to add users with handler
                  roles (Invigilator, Lecturer, Department Head, or Faculty
                  Officer).
                </Text>
              </View>
            ) : (
              <View style={styles.searchContainer}>
                {/* Search Input */}
                <View style={styles.searchInputContainer}>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search handlers by name or role..."
                    value={searchText}
                    onChangeText={handleSearchChange}
                    onFocus={() => {
                      if (searchText.trim().length > 0) {
                        setShowDropdown(true);
                      }
                    }}
                  />
                  {selectedHandlerId ? (
                    <TouchableOpacity
                      style={styles.clearButton}
                      onPress={clearSelection}
                    >
                      <Ionicons
                        name="close-circle"
                        size={20}
                        color="#6b7280"
                      />
                    </TouchableOpacity>
                  ) : (
                    <Ionicons
                      name="search"
                      size={20}
                      color="#6b7280"
                      style={styles.searchIcon}
                    />
                  )}
                </View>

                {/* Selected Handler Display */}
                {selectedHandler && (
                  <View style={styles.selectedHandlerContainer}>
                    <View style={styles.selectedHandlerInfo}>
                      <Text style={styles.selectedHandlerName}>
                        {selectedHandler.firstName} {selectedHandler.lastName}
                      </Text>
                      <Text style={styles.selectedHandlerRole}>
                        {selectedHandler.role.replace(/_/g, " ")}
                      </Text>
                      {selectedHandler.email && (
                        <Text style={styles.selectedHandlerEmail}>
                          {selectedHandler.email}
                        </Text>
                      )}
                    </View>
                    <View style={styles.selectedBadge}>
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color="#10b981"
                      />
                    </View>
                  </View>
                )}

                {/* Dropdown Results */}
                {showDropdown && filteredHandlers.length > 0 && (
                  <View style={styles.dropdownContainer}>
                    <ScrollView
                      style={styles.dropdownList}
                      nestedScrollEnabled
                      keyboardShouldPersistTaps="handled"
                    >
                      {filteredHandlers.slice(0, 5).map((handler) => (
                        <TouchableOpacity
                          key={handler.id}
                          style={styles.dropdownItem}
                          onPress={() => handleHandlerSelect(handler)}
                        >
                          <View style={styles.handlerInfo}>
                            <Text style={styles.dropdownHandlerName}>
                              {handler.firstName} {handler.lastName}
                            </Text>
                            <Text style={styles.dropdownHandlerRole}>
                              {handler.role.replace(/_/g, " ")}
                            </Text>
                            {handler.email && (
                              <Text style={styles.handlerEmail}>
                                {handler.email}
                              </Text>
                            )}
                          </View>
                          {selectedHandlerId === handler.id && (
                            <Ionicons
                              name="checkmark"
                              size={20}
                              color="#3b82f6"
                            />
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                    {filteredHandlers.length > 5 && (
                      <View style={styles.moreResultsHint}>
                        <Text style={styles.moreResultsText}>
                          + {filteredHandlers.length - 5} more results. Keep
                          typing to refine...
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* No results message */}
                {showDropdown &&
                  searchText.trim().length > 0 &&
                  filteredHandlers.length === 0 && (
                    <View style={styles.noResultsContainer}>
                      <Ionicons name="search" size={24} color="#9ca3af" />
                      <Text style={styles.noResultsText}>
                        No handlers found matching &quot;{searchText}&quot;
                      </Text>
                    </View>
                  )}

                {/* Helper text */}
                {!selectedHandlerId && !showDropdown && (
                  <Text style={styles.helperText}>
                    Start typing to search for a handler by name, role, or
                    email
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* Location (Optional) */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Location (Optional)</Text>
            <View style={styles.locationContainer}>
              <TextInput
                style={styles.locationInput}
                placeholder="e.g., Main Office, Room 101"
                value={location}
                onChangeText={setLocation}
              />
              <TouchableOpacity
                style={styles.locationButton}
                onPress={getCurrentLocation}
                disabled={fetchingLocation}
              >
                {fetchingLocation ? (
                  <ActivityIndicator size="small" color="#3b82f6" />
                ) : (
                  <Ionicons name="location" size={20} color="#3b82f6" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (submitting ||
              isOffline ||
              handlers.length === 0 ||
              !selectedHandlerId) &&
              styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={
            submitting ||
            isOffline ||
            handlers.length === 0 ||
            !selectedHandlerId
          }
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>
              {handlers.length === 0
                ? "No Handlers Available"
                : isOffline
                  ? "Offline - Cannot Initiate"
                  : !selectedHandlerId
                    ? "Select a Handler First"
                    : "Initiate Transfer"}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
          disabled={submitting}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  content: {
    padding: 16,
  },
  offlineBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  offlineText: {
    flex: 1,
    fontSize: 14,
    color: "#dc2626",
    fontWeight: "500",
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
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  locationInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: "#fff",
  },
  locationButton: {
    padding: 12,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
  },
  searchContainer: {
    position: "relative",
    zIndex: 1000,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    backgroundColor: "#fff",
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    padding: 12,
    fontSize: 14,
    color: "#111827",
  },
  searchIcon: {
    marginRight: 12,
  },
  clearButton: {
    padding: 8,
    marginRight: 8,
  },
  selectedHandlerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#eff6ff",
    borderColor: "#3b82f6",
    borderWidth: 2,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  selectedHandlerInfo: {
    flex: 1,
  },
  selectedHandlerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e40af",
    marginBottom: 2,
  },
  selectedHandlerRole: {
    fontSize: 13,
    color: "#3b82f6",
    textTransform: "capitalize",
    marginBottom: 2,
  },
  selectedHandlerEmail: {
    fontSize: 12,
    color: "#60a5fa",
  },
  selectedBadge: {
    marginLeft: 8,
  },
  dropdownContainer: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    maxHeight: 240,
  },
  dropdownList: {
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  handlerInfo: {
    flex: 1,
  },
  dropdownHandlerName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 3,
  },
  dropdownHandlerRole: {
    fontSize: 13,
    color: "#6b7280",
    textTransform: "capitalize",
    marginBottom: 2,
  },
  handlerEmail: {
    fontSize: 12,
    color: "#9ca3af",
  },
  moreResultsHint: {
    padding: 8,
    backgroundColor: "#f9fafb",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  moreResultsText: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
    fontStyle: "italic",
  },
  noResultsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    gap: 8,
  },
  noResultsText: {
    fontSize: 14,
    color: "#6b7280",
  },
  helperText: {
    fontSize: 12,
    color: "#9ca3af",
    fontStyle: "italic",
    marginTop: 4,
  },
  emptyHandlersContainer: {
    padding: 16,
    backgroundColor: "#fef2f2",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fecaca",
    alignItems: "center",
  },
  emptyHandlersText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#dc2626",
    marginBottom: 8,
  },
  emptyHandlersSubtext: {
    fontSize: 14,
    color: "#7f1d1d",
    textAlign: "center",
    lineHeight: 20,
  },
  submitButton: {
    backgroundColor: "#3b82f6",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
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
});