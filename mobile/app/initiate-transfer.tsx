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
import { useAuthStore } from "@/store/auth";
import * as batchTransfersApi from "@/api/batchTransfers";

export default function InitiateTransferScreen() {
  const { examSessionId, batchQrCode, courseCode, courseName } =
    useLocalSearchParams<{
      examSessionId: string;
      batchQrCode: string;
      courseCode: string;
      courseName: string;
    }>();
  const router = useRouter();
  const user = useAuthStore((state: any) => state.user);

  const [handlers, setHandlers] = useState<
    { id: string; name: string; role: string }[]
  >([]);
  const [selectedHandlerId, setSelectedHandlerId] = useState<string>("");
  const [scriptsExpected, setScriptsExpected] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadHandlers();
  }, []);

  const loadHandlers = async () => {
    try {
      setLoading(true);
      // In a real app, you'd fetch available handlers from the API
      // For now, we'll use mock data
      // TODO: Add endpoint to fetch users with ADMIN, INVIGILATOR, LECTURER roles
      setHandlers([
        { id: "handler-1", name: "John Doe", role: "LECTURER" },
        { id: "handler-2", name: "Jane Smith", role: "INVIGILATOR" },
        { id: "handler-3", name: "Admin User", role: "ADMIN" },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.error || "Failed to load handlers");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedHandlerId) {
      Alert.alert("Error", "Please select a receiving handler");
      return;
    }

    if (!scriptsExpected || parseInt(scriptsExpected) <= 0) {
      Alert.alert("Error", "Please enter a valid number of scripts");
      return;
    }

    Alert.alert(
      "Confirm Transfer",
      `Initiate transfer of ${scriptsExpected} scripts to ${
        handlers.find((h) => h.id === selectedHandlerId)?.name
      }?`,
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
                scriptsExpected: parseInt(scriptsExpected),
                location: location || undefined,
              });

              Alert.alert("Success", "Transfer request created successfully", [
                {
                  text: "OK",
                  onPress: () => router.back(),
                },
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
    <ScrollView style={styles.container}>
      <View style={styles.content}>
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
        </View>

        {/* Transfer Form */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Transfer Details</Text>

          {/* Receiving Handler */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Receiving Handler *</Text>
            <View style={styles.handlersList}>
              {handlers.map((handler) => (
                <TouchableOpacity
                  key={handler.id}
                  style={[
                    styles.handlerItem,
                    selectedHandlerId === handler.id &&
                      styles.handlerItemSelected,
                  ]}
                  onPress={() => setSelectedHandlerId(handler.id)}
                >
                  <View>
                    <Text
                      style={[
                        styles.handlerName,
                        selectedHandlerId === handler.id &&
                          styles.handlerNameSelected,
                      ]}
                    >
                      {handler.name}
                    </Text>
                    <Text
                      style={[
                        styles.handlerRole,
                        selectedHandlerId === handler.id &&
                          styles.handlerRoleSelected,
                      ]}
                    >
                      {handler.role}
                    </Text>
                  </View>
                  {selectedHandlerId === handler.id && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Scripts Expected */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Number of Scripts *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter number of scripts"
              keyboardType="numeric"
              value={scriptsExpected}
              onChangeText={setScriptsExpected}
            />
          </View>

          {/* Location (Optional) */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Location (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Main Office, Room 101"
              value={location}
              onChangeText={setLocation}
            />
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            submitting && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Initiate Transfer</Text>
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
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: "#fff",
  },
  handlersList: {
    gap: 8,
  },
  handlerItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  handlerItemSelected: {
    borderColor: "#3b82f6",
    backgroundColor: "#eff6ff",
  },
  handlerName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  handlerNameSelected: {
    color: "#3b82f6",
  },
  handlerRole: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  handlerRoleSelected: {
    color: "#3b82f6",
  },
  checkmark: {
    fontSize: 20,
    color: "#3b82f6",
    fontWeight: "bold",
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
