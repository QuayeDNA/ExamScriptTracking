import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  examSessionsApi,
  type ExamSession,
  type BatchStatus,
} from "@/api/examSessions";

const STATUS_OPTIONS: { value: BatchStatus; label: string; color: string }[] = [
  { value: "IN_PROGRESS", label: "In Progress", color: "#3b82f6" },
  { value: "SUBMITTED", label: "Submitted", color: "#10b981" },
  { value: "IN_TRANSIT", label: "In Transit", color: "#f59e0b" },
  { value: "WITH_LECTURER", label: "With Lecturer", color: "#8b5cf6" },
  { value: "UNDER_GRADING", label: "Under Grading", color: "#6366f1" },
  { value: "GRADED", label: "Graded", color: "#14b8a6" },
  { value: "RETURNED", label: "Returned", color: "#f97316" },
  { value: "COMPLETED", label: "Completed", color: "#6b7280" },
];

export default function BatchDetailsScreen() {
  const { batchId } = useLocalSearchParams<{ batchId: string }>();
  const router = useRouter();
  const [session, setSession] = useState<ExamSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const loadSession = useCallback(async () => {
    if (!batchId) {
      console.error("No batchId provided");
      Alert.alert("Error", "No batch ID provided");
      router.back();
      return;
    }

    try {
      console.log("Loading batch details for ID:", batchId);
      setLoading(true);
      const data = await examSessionsApi.getExamSession(batchId);
      console.log("Batch details loaded successfully:", data);
      setSession(data);
    } catch (error: any) {
      console.error("Failed to load batch details:", error);
      Alert.alert(
        "Error Loading Batch",
        error.error ||
          error.message ||
          "Failed to load batch details. Please check your connection and try again.",
        [
          {
            text: "Retry",
            onPress: () => loadSession(),
          },
          {
            text: "Go Back",
            style: "cancel",
            onPress: () => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/(tabs)");
              }
            },
          },
        ]
      );
    } finally {
      setLoading(false);
    }
  }, [batchId, router]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const handleStatusChange = async (newStatus: BatchStatus) => {
    if (!session) return;

    Alert.alert(
      "Confirm Status Update",
      `Change status to "${STATUS_OPTIONS.find((s) => s.value === newStatus)?.label}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            try {
              setUpdating(true);
              const updated = await examSessionsApi.updateStatus(
                session.id,
                newStatus
              );
              setSession(updated);
              Alert.alert("Success", "Batch status updated successfully");
            } catch (error: any) {
              Alert.alert("Error", error.error || "Failed to update status");
            } finally {
              setUpdating(false);
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
        <Text style={styles.loadingText}>Loading batch details...</Text>
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Batch not found</Text>
      </View>
    );
  }

  const currentStatus = STATUS_OPTIONS.find((s) => s.value === session.status);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: currentStatus?.color || "#6b7280" },
          ]}
        >
          <Text style={styles.statusText}>
            {currentStatus?.label || session.status}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Batch Information</Text>
        <InfoRow label="Batch QR Code" value={session.batchQrCode} />
        <InfoRow label="Course Code" value={session.courseCode} />
        <InfoRow label="Course Name" value={session.courseName} />
        <InfoRow
          label="Exam Date"
          value={new Date(session.examDate).toLocaleString()}
        />
        <InfoRow label="Venue" value={session.venue} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Lecturer Information</Text>
        <InfoRow label="Lecturer ID" value={session.lecturerId} />
        <InfoRow label="Lecturer Name" value={session.lecturerName} />
        <InfoRow label="Department" value={session.department} />
        <InfoRow label="Faculty" value={session.faculty} />
      </View>

      {/* Transfer Actions */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Transfer Actions</Text>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() =>
            router.push({
              pathname: "/initiate-transfer",
              params: {
                examSessionId: session.id,
                batchQrCode: session.batchQrCode,
                courseCode: session.courseCode,
                courseName: session.courseName,
              },
            })
          }
        >
          <Text style={styles.actionButtonText}>📤 Initiate Transfer</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonSecondary]}
          onPress={() =>
            router.push({
              pathname: "/transfer-history",
              params: { examSessionId: session.id },
            })
          }
        >
          <Text style={styles.actionButtonTextSecondary}>
            📋 View Transfer History
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Update Status</Text>
        <Text style={styles.instructionText}>
          Select the new status for this batch:
        </Text>
        <View style={styles.statusGrid}>
          {STATUS_OPTIONS.map((status) => {
            const isCurrent = status.value === session.status;
            return (
              <TouchableOpacity
                key={status.value}
                style={[
                  styles.statusButton,
                  isCurrent && styles.statusButtonActive,
                  { borderColor: status.color },
                  isCurrent && { backgroundColor: status.color },
                ]}
                onPress={() => handleStatusChange(status.value)}
                disabled={updating || isCurrent}
              >
                <Text
                  style={[
                    styles.statusButtonText,
                    isCurrent && styles.statusButtonTextActive,
                  ]}
                >
                  {status.label}
                </Text>
                {isCurrent && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {updating && (
        <View style={styles.updatingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.updatingText}>Updating status...</Text>
        </View>
      )}
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}:</Text>
      <Text style={styles.infoValue}>{value}</Text>
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
  header: {
    backgroundColor: "#fff",
    padding: 16,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  card: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  infoLabel: {
    flex: 1,
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "600",
  },
  infoValue: {
    flex: 2,
    fontSize: 14,
    color: "#111827",
  },
  instructionText: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 12,
  },
  actionButton: {
    backgroundColor: "#3b82f6",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  actionButtonSecondary: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#3b82f6",
  },
  actionButtonTextSecondary: {
    color: "#3b82f6",
    fontSize: 15,
    fontWeight: "600",
  },
  statusGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statusButton: {
    flex: 1,
    minWidth: "45%",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  statusButtonActive: {
    borderWidth: 0,
  },
  statusButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  statusButtonTextActive: {
    color: "#fff",
  },
  checkmark: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 4,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6b7280",
  },
  errorText: {
    fontSize: 16,
    color: "#ef4444",
  },
  updatingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  updatingText: {
    color: "#fff",
    fontSize: 16,
    marginTop: 16,
  },
});
