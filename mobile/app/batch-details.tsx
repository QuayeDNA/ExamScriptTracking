import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  examSessionsApi,
  type ExamSession,
  type BatchStatus,
} from "@/api/examSessions";
import type { ExamAttendance } from "@/types";

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
  const [expectedStudents, setExpectedStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [filter, setFilter] = useState<
    "ALL" | "PRESENT" | "SUBMITTED" | "NOT_YET"
  >("ALL");

  const loadSession = useCallback(async () => {
    if (!batchId) {
      Alert.alert("Error", "No batch ID provided");
      router.back();
      return;
    }

    try {
      setLoading(true);
      const [sessionData, studentsData] = await Promise.all([
        examSessionsApi.getExamSession(batchId),
        examSessionsApi.getExpectedStudents(batchId),
      ]);
      setSession(sessionData);
      setExpectedStudents(studentsData.expectedStudents);
    } catch (error: any) {
      Alert.alert(
        "Error Loading Batch",
        error.error || "Failed to load batch details",
        [
          { text: "Retry", onPress: () => loadSession() },
          { text: "Go Back", style: "cancel", onPress: () => router.back() },
        ]
      );
    } finally {
      setLoading(false);
    }
  }, [batchId, router]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSession();
    setRefreshing(false);
  }, [loadSession]);

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

  // Filter students based on selected filter
  const filteredStudents = expectedStudents.filter((student) => {
    if (filter === "ALL") return true;
    if (filter === "PRESENT")
      return student.attendance && !student.attendance.submissionTime;
    if (filter === "SUBMITTED") return student.attendance?.submissionTime;
    if (filter === "NOT_YET") return !student.attendance;
    return true;
  });

  // Calculate stats
  const stats = {
    total: expectedStudents.length,
    present: expectedStudents.filter(
      (s) => s.attendance && !s.attendance.submissionTime
    ).length,
    submitted: expectedStudents.filter((s) => s.attendance?.submissionTime)
      .length,
    notYet: expectedStudents.filter((s) => !s.attendance).length,
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
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

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.transferButton}
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
          <Text style={styles.transferButtonText}>📦 Initiate Transfer</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() =>
            router.push({
              pathname: "/transfer-history",
              params: { examSessionId: session.id },
            })
          }
        >
          <Text style={styles.historyButtonText}>View Transfer History</Text>
        </TouchableOpacity>
      </View>

      {/* Attendance Stats */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: "#3b82f6" }]}>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>Expected</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: "#f59e0b" }]}>
          <Text style={styles.statNumber}>{stats.present}</Text>
          <Text style={styles.statLabel}>Present</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: "#10b981" }]}>
          <Text style={styles.statNumber}>{stats.submitted}</Text>
          <Text style={styles.statLabel}>Submitted</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: "#6b7280" }]}>
          <Text style={styles.statNumber}>{stats.notYet}</Text>
          <Text style={styles.statLabel}>Not Yet</Text>
        </View>
      </View>

      {/* Attendance Filter */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === "ALL" && styles.filterButtonActive,
          ]}
          onPress={() => setFilter("ALL")}
        >
          <Text
            style={[
              styles.filterText,
              filter === "ALL" && styles.filterTextActive,
            ]}
          >
            All ({stats.total})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === "PRESENT" && styles.filterButtonActive,
          ]}
          onPress={() => setFilter("PRESENT")}
        >
          <Text
            style={[
              styles.filterText,
              filter === "PRESENT" && styles.filterTextActive,
            ]}
          >
            Present ({stats.present})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === "SUBMITTED" && styles.filterButtonActive,
          ]}
          onPress={() => setFilter("SUBMITTED")}
        >
          <Text
            style={[
              styles.filterText,
              filter === "SUBMITTED" && styles.filterTextActive,
            ]}
          >
            Submitted ({stats.submitted})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === "NOT_YET" && styles.filterButtonActive,
          ]}
          onPress={() => setFilter("NOT_YET")}
        >
          <Text
            style={[
              styles.filterText,
              filter === "NOT_YET" && styles.filterTextActive,
            ]}
          >
            Not Yet ({stats.notYet})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Attendance List */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          Student Attendance ({filteredStudents.length})
        </Text>
        {filteredStudents.length === 0 ? (
          <Text style={styles.emptyText}>No students match this filter</Text>
        ) : (
          filteredStudents.map((student, index) => (
            <View key={student.id} style={styles.studentItem}>
              <View style={styles.studentHeader}>
                <Text style={styles.studentName}>
                  {student.firstName || "Unknown"} {student.lastName || ""}
                </Text>
                {student.attendance?.submissionTime && (
                  <View
                    style={[
                      styles.statusBadgeSmall,
                      { backgroundColor: "#10b981" },
                    ]}
                  >
                    <Text style={styles.statusBadgeText}>✓ Submitted</Text>
                  </View>
                )}
                {student.attendance && !student.attendance.submissionTime && (
                  <View
                    style={[
                      styles.statusBadgeSmall,
                      { backgroundColor: "#f59e0b" },
                    ]}
                  >
                    <Text style={styles.statusBadgeText}>Present</Text>
                  </View>
                )}
                {!student.attendance && (
                  <View
                    style={[
                      styles.statusBadgeSmall,
                      { backgroundColor: "#6b7280" },
                    ]}
                  >
                    <Text style={styles.statusBadgeText}>Not Yet</Text>
                  </View>
                )}
              </View>
              <Text style={styles.studentIndex}>{student.indexNumber}</Text>
              {student.program && (
                <Text style={styles.studentInfo}>
                  {student.program} • Level {student.level || "N/A"}
                </Text>
              )}
              {student.attendance && (
                <View style={styles.timeInfo}>
                  <Text style={styles.timeText}>
                    ⏰ Entry:{" "}
                    {new Date(
                      student.attendance.entryTime
                    ).toLocaleTimeString()}
                  </Text>
                  {student.attendance.exitTime && (
                    <Text style={styles.timeText}>
                      🚪 Exit:{" "}
                      {new Date(
                        student.attendance.exitTime
                      ).toLocaleTimeString()}
                    </Text>
                  )}
                  {student.attendance.submissionTime && (
                    <Text style={styles.timeText}>
                      ✅ Submitted:{" "}
                      {new Date(
                        student.attendance.submissionTime
                      ).toLocaleTimeString()}
                    </Text>
                  )}
                </View>
              )}
            </View>
          ))
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Lecturer Information</Text>
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
  statsContainer: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
  },
  statLabel: {
    fontSize: 12,
    color: "#fff",
    marginTop: 4,
    fontWeight: "600",
  },
  filterContainer: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    alignItems: "center",
  },
  filterButtonActive: {
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
  studentItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  studentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  studentName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
  },
  studentIndex: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
  studentInfo: {
    fontSize: 13,
    color: "#9ca3af",
    marginBottom: 8,
  },
  timeInfo: {
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    color: "#6b7280",
  },
  statusBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#fff",
  },
  emptyText: {
    textAlign: "center",
    color: "#9ca3af",
    fontSize: 14,
    paddingVertical: 32,
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  transferButton: {
    flex: 1,
    backgroundColor: "#3b82f6",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  transferButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  historyButton: {
    flex: 1,
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#3b82f6",
  },
  historyButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3b82f6",
  },
});
