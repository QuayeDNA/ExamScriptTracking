import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { attendanceApi, type ExamAttendance } from "@/api/attendance";
import { useSessionStore } from "@/store/session";

export default function StudentAttendanceScreen() {
  const { studentId, examSessionId } = useLocalSearchParams<{
    studentId: string;
    examSessionId?: string;
  }>();
  const router = useRouter();
  const [attendance, setAttendance] = useState<ExamAttendance | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [discrepancyModalVisible, setDiscrepancyModalVisible] = useState(false);
  const [discrepancyNote, setDiscrepancyNote] = useState("");

  useEffect(() => {
    if (studentId && examSessionId) {
      loadAttendance();
    }
  }, [studentId, examSessionId]);

  const loadAttendance = async () => {
    if (!studentId || !examSessionId) return;

    try {
      setLoading(true);
      const data = await attendanceApi.getAttendance(studentId, examSessionId);
      setAttendance(data);
      setDiscrepancyNote(data.discrepancyNote || "");
    } catch (error: any) {
      // Attendance not found - this is expected for new entries
      if (error.error?.includes("not found")) {
        // Show option to record entry
        Alert.alert(
          "New Student Entry",
          "This student has not entered the exam yet. Would you like to record their entry now?",
          [
            {
              text: "Cancel",
              onPress: () => router.back(),
              style: "cancel",
            },
            {
              text: "Record Entry",
              onPress: handleRecordEntry,
            },
          ]
        );
      } else {
        Alert.alert("Error", error.error || "Failed to load attendance");
        router.back();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRecordEntry = async () => {
    if (!studentId || !examSessionId) return;

    try {
      setActionLoading(true);
      const data = await attendanceApi.recordEntry(studentId, examSessionId);
      setAttendance(data);

      // Set the current session for incident reporting location
      if (data.examSession) {
        useSessionStore.getState().setCurrentSession(data.examSession);
        // Mark that first attendance has been recorded for this session
        useSessionStore.getState().setFirstAttendanceRecorded(true);
      }

      Alert.alert("Success", "Student entry recorded successfully");
    } catch (error: any) {
      Alert.alert("Error", error.error || "Failed to record entry");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordExit = async () => {
    if (!attendance) return;

    Alert.alert(
      "Confirm Exit",
      "Record student exit time? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            try {
              setActionLoading(true);
              const data = await attendanceApi.recordExit(attendance.id);
              setAttendance(data);
              Alert.alert("Success", "Student exit recorded successfully");
            } catch (error: any) {
              Alert.alert("Error", error.error || "Failed to record exit");
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleRecordSubmission = async () => {
    if (!attendance) return;

    Alert.alert(
      "Confirm Submission",
      "Record script submission? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            try {
              setActionLoading(true);
              const data = await attendanceApi.recordSubmission(attendance.id);
              setAttendance(data);
              Alert.alert("Success", "Script submission recorded successfully");
            } catch (error: any) {
              Alert.alert(
                "Error",
                error.error || "Failed to record submission"
              );
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleSaveDiscrepancy = async () => {
    if (!attendance || !discrepancyNote.trim()) {
      Alert.alert("Error", "Please enter a discrepancy note");
      return;
    }

    try {
      setActionLoading(true);
      const data = await attendanceApi.updateDiscrepancy(
        attendance.id,
        discrepancyNote.trim()
      );
      setAttendance(data);
      setDiscrepancyModalVisible(false);
      Alert.alert("Success", "Discrepancy note saved successfully");
    } catch (error: any) {
      Alert.alert("Error", error.error || "Failed to save discrepancy note");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading attendance...</Text>
      </View>
    );
  }

  if (!attendance) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>No attendance record found</Text>
      </View>
    );
  }

  const statusColor =
    attendance.status === "SUBMITTED"
      ? "#10b981"
      : attendance.status === "PRESENT"
        ? "#3b82f6"
        : "#ef4444";

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusText}>{attendance.status}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Student Information</Text>
        <InfoRow label="Index Number" value={attendance.student.indexNumber} />
        <InfoRow
          label="Name"
          value={`${attendance.student.firstName} ${attendance.student.lastName}`}
        />
        <InfoRow label="Program" value={attendance.student.program} />
        <InfoRow label="Level" value={attendance.student.level.toString()} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Exam Information</Text>
        <InfoRow
          label="Course Code"
          value={attendance.examSession.courseCode}
        />
        <InfoRow
          label="Course Name"
          value={attendance.examSession.courseName}
        />
        <InfoRow label="Venue" value={attendance.examSession.venue} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Attendance Times</Text>
        <InfoRow
          label="Entry Time"
          value={new Date(attendance.entryTime).toLocaleString()}
        />
        {attendance.exitTime && (
          <InfoRow
            label="Exit Time"
            value={new Date(attendance.exitTime).toLocaleString()}
          />
        )}
        {attendance.submissionTime && (
          <InfoRow
            label="Submission Time"
            value={new Date(attendance.submissionTime).toLocaleString()}
          />
        )}
      </View>

      {attendance.discrepancyNote && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Discrepancy Note</Text>
          <Text style={styles.discrepancyText}>
            {attendance.discrepancyNote}
          </Text>
        </View>
      )}

      <View style={styles.actionsCard}>
        <Text style={styles.cardTitle}>Actions</Text>

        {!attendance.exitTime && (
          <TouchableOpacity
            style={[styles.actionButton, styles.exitButton]}
            onPress={handleRecordExit}
            disabled={actionLoading}
          >
            <Text style={styles.actionButtonText}>Record Exit</Text>
          </TouchableOpacity>
        )}

        {!attendance.submissionTime && (
          <TouchableOpacity
            style={[styles.actionButton, styles.submitButton]}
            onPress={handleRecordSubmission}
            disabled={actionLoading}
          >
            <Text style={styles.actionButtonText}>Record Submission</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.actionButton, styles.discrepancyButton]}
          onPress={() => setDiscrepancyModalVisible(true)}
          disabled={actionLoading}
        >
          <Text style={styles.actionButtonText}>
            {attendance.discrepancyNote
              ? "Update Discrepancy"
              : "Add Discrepancy Note"}
          </Text>
        </TouchableOpacity>
      </View>

      {actionLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      )}

      <Modal
        visible={discrepancyModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setDiscrepancyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Discrepancy Note</Text>
            <TextInput
              style={styles.textInput}
              multiline
              numberOfLines={4}
              value={discrepancyNote}
              onChangeText={setDiscrepancyNote}
              placeholder="Enter discrepancy details..."
              placeholderTextColor="#9ca3af"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setDiscrepancyModalVisible(false)}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={handleSaveDiscrepancy}
              >
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  actionsCard: {
    backgroundColor: "#fff",
    margin: 16,
    marginBottom: 32,
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
  discrepancyText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
  actionButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  exitButton: {
    backgroundColor: "#f59e0b",
  },
  submitButton: {
    backgroundColor: "#10b981",
  },
  discrepancyButton: {
    backgroundColor: "#6366f1",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
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
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#111827",
    minHeight: 100,
    textAlignVertical: "top",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalButtonCancel: {
    backgroundColor: "#f3f4f6",
  },
  modalButtonSave: {
    backgroundColor: "#3b82f6",
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalButtonTextCancel: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "600",
  },
});
