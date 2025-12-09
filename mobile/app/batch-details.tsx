import { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { examSessionsApi } from "@/api/examSessions";
import type { ExamSession, BatchStatus } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { Text, Card, Badge, Dialog, Button } from "@/components/ui";
import Toast from "react-native-toast-message";
import { useThemeColors } from "@/constants/design-system";

const STATUS_OPTIONS: { value: BatchStatus; label: string; color: string }[] = [
  { value: "NOT_STARTED", label: "Not Started", color: "#9ca3af" },
  { value: "IN_PROGRESS", label: "In Progress", color: "#3b82f6" },
  { value: "SUBMITTED", label: "Submitted", color: "#10b981" },
  { value: "IN_TRANSIT", label: "In Transit", color: "#f59e0b" },
  { value: "WITH_LECTURER", label: "With Lecturer", color: "#8b5cf6" },
  { value: "UNDER_GRADING", label: "Under Grading", color: "#6366f1" },
  { value: "GRADED", label: "Graded", color: "#14b8a6" },
  { value: "RETURNED", label: "Returned", color: "#f97316" },
  { value: "COMPLETED", label: "Completed", color: "#6b7280" },
];

type FilterType = "ALL" | "PRESENT" | "SUBMITTED" | "NOT_YET";

export default function BatchDetailsScreen() {
  const params = useLocalSearchParams<{ batchId: string }>();
  const batchId = Array.isArray(params.batchId)
    ? params.batchId[0]
    : params.batchId;
  const router = useRouter();
  const colors = useThemeColors();

  const [session, setSession] = useState<ExamSession | null>(null);
  const [expectedStudents, setExpectedStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [filter, setFilter] = useState<FilterType>("ALL");

  // Dialog states
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<BatchStatus | null>(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const loadSession = useCallback(async () => {
    if (!batchId) {
      setErrorMessage("No batch ID provided");
      setShowErrorDialog(true);
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
      setErrorMessage(error.error || "Failed to load batch details");
      setShowErrorDialog(true);
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSession();
    setRefreshing(false);
  }, [loadSession]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const handleStatusChangeRequest = (newStatus: BatchStatus) => {
    setPendingStatus(newStatus);
    setShowStatusDialog(true);
  };

  const handleStatusConfirm = async () => {
    if (!session || !pendingStatus) return;

    try {
      setUpdating(true);
      setShowStatusDialog(false);
      const updated = await examSessionsApi.updateStatus(
        session.id,
        pendingStatus
      );
      setSession(updated);
      Toast.show({
        type: "success",
        text1: "Status Updated",
        text2: `Batch status changed to ${STATUS_OPTIONS.find((s) => s.value === pendingStatus)?.label}`,
      });
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Update Failed",
        text2: error.error || "Failed to update status",
      });
    } finally {
      setUpdating(false);
      setPendingStatus(null);
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.foregroundMuted }]}>
            Loading batch details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.centerContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={64}
            color={colors.foregroundMuted}
          />
          <Text style={[styles.errorText, { color: colors.foregroundMuted }]}>
            Batch not found
          </Text>
          <Button
            variant="outline"
            size="default"
            onPress={() => router.back()}
            style={{ marginTop: 16 }}
          >
            <Text style={{ color: colors.primary, fontWeight: "600" }}>
              Go Back
            </Text>
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const currentStatus = STATUS_OPTIONS.find((s) => s.value === session.status);

  // Filter students
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
    attended: expectedStudents.filter((s) => s.attendance).length,
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Batch Information Card */}
        <Card elevation="md" style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="document-text" size={20} color={colors.primary} />
            <Text
              variant="h3"
              style={[styles.cardTitle, { color: colors.foreground }]}
            >
              Batch Information
            </Text>
            <TouchableOpacity
              style={styles.statusBadge}
              onPress={() => setShowStatusDropdown(!showStatusDropdown)}
              disabled={updating}
            >
              <Badge
                variant="default"
                style={{
                  backgroundColor: currentStatus?.color,
                }}
              >
                <Text
                  style={{ color: "#fff", fontWeight: "600", fontSize: 12 }}
                >
                  {currentStatus?.label || session.status}
                </Text>
              </Badge>
              <Ionicons
                name={showStatusDropdown ? "chevron-up" : "chevron-down"}
                size={16}
                color={colors.foregroundMuted}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.cardContent}>
            <InfoRow
              label="Batch QR Code"
              value={session.batchQrCode}
              icon="qr-code"
            />
            <InfoRow
              label="Course Code"
              value={session.courseCode}
              icon="book"
            />
            <InfoRow
              label="Course Name"
              value={session.courseName}
              icon="school"
            />
            <InfoRow
              label="Exam Date"
              value={new Date(session.examDate).toLocaleString()}
              icon="calendar"
            />
            <InfoRow label="Venue" value={session.venue} icon="location" />
          </View>
        </Card>

        {/* Status Dropdown Options */}
        {showStatusDropdown && (
          <View
            style={[
              styles.dropdownContainer,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            {STATUS_OPTIONS.map((status) => {
              const isCurrent = status.value === session.status;
              return (
                <TouchableOpacity
                  key={status.value}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setShowStatusDropdown(false);
                    handleStatusChangeRequest(status.value);
                  }}
                  disabled={updating || isCurrent}
                >
                  <View style={styles.dropdownItemContent}>
                    <View
                      style={[
                        styles.statusIndicator,
                        { backgroundColor: status.color },
                      ]}
                    />
                    <Text
                      style={[
                        styles.dropdownItemText,
                        { color: colors.foreground },
                        isCurrent && { fontWeight: "600" },
                      ]}
                    >
                      {status.label}
                    </Text>
                    {isCurrent && (
                      <Ionicons
                        name="checkmark"
                        size={16}
                        color={colors.primary}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Attendance Stats */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.primary }]}>
            <Ionicons name="people" size={32} color="#fff" />
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Expected</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: "#10b981" }]}>
            <Ionicons name="checkmark-circle" size={32} color="#fff" />
            <Text style={styles.statNumber}>{stats.attended}</Text>
            <Text style={styles.statLabel}>Attended</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: "#ef4444" }]}>
            <Ionicons name="close-circle" size={32} color="#fff" />
            <Text style={styles.statNumber}>{stats.notYet}</Text>
            <Text style={styles.statLabel}>Absent</Text>
          </View>
        </View>

        {/* Summary Card */}
        <Card elevation="md" style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="stats-chart" size={20} color={colors.primary} />
            <Text
              variant="h3"
              style={[styles.cardTitle, { color: colors.foreground }]}
            >
              Batch Summary
            </Text>
          </View>
          <View style={styles.cardContent}>
            <InfoRow
              label="Scripts to Transfer"
              value={`${stats.attended} of ${stats.total}`}
              valueStyle={{ fontWeight: "bold", color: colors.primary }}
            />
            <InfoRow
              label="Attendance Rate"
              value={`${stats.total > 0 ? ((stats.attended / stats.total) * 100).toFixed(1) : "0"}%`}
            />
            <InfoRow
              label="Absentees"
              value={`${stats.notYet} student${stats.notYet !== 1 ? "s" : ""}`}
              valueStyle={{ color: stats.notYet > 0 ? "#ef4444" : "#10b981" }}
            />
          </View>
        </Card>

        {/* Attendance Filter */}
        <View style={styles.filterContainer}>
          <FilterButton
            active={filter === "ALL"}
            label={`All (${stats.total})`}
            onPress={() => setFilter("ALL")}
          />
          <FilterButton
            active={filter === "PRESENT"}
            label={`Present (${stats.present})`}
            onPress={() => setFilter("PRESENT")}
          />
          <FilterButton
            active={filter === "SUBMITTED"}
            label={`Submitted (${stats.submitted})`}
            onPress={() => setFilter("SUBMITTED")}
          />
          <FilterButton
            active={filter === "NOT_YET"}
            label={`Not Yet (${stats.notYet})`}
            onPress={() => setFilter("NOT_YET")}
          />
        </View>

        {/* Student List */}
        <Card elevation="md" style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="list" size={20} color={colors.primary} />
            <Text
              variant="h3"
              style={[styles.cardTitle, { color: colors.foreground }]}
            >
              Student Attendance ({filteredStudents.length})
            </Text>
          </View>
          <View style={styles.cardContent}>
            {filteredStudents.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons
                  name="search-outline"
                  size={48}
                  color={colors.foregroundMuted}
                />
                <Text
                  style={[styles.emptyText, { color: colors.foregroundMuted }]}
                >
                  No students match this filter
                </Text>
              </View>
            ) : (
              filteredStudents.map((student) => (
                <StudentItem key={student.id} student={student} />
              ))
            )}
          </View>
        </Card>

        {/* Lecturer Information */}
        <Card elevation="md" style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="person" size={20} color={colors.primary} />
            <Text
              variant="h3"
              style={[styles.cardTitle, { color: colors.foreground }]}
            >
              Lecturer Information
            </Text>
          </View>
          <View style={styles.cardContent}>
            <InfoRow
              label="Lecturer Name"
              value={session.lecturerName}
              icon="person-circle"
            />
            <InfoRow
              label="Department"
              value={session.department}
              icon="business"
            />
            <InfoRow label="Faculty" value={session.faculty} icon="school" />
          </View>
        </Card>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Status Change Confirmation Dialog */}
      <Dialog
        visible={showStatusDialog}
        onClose={() => setShowStatusDialog(false)}
        title="Confirm Status Update"
        message={`Change status to "${STATUS_OPTIONS.find((s) => s.value === pendingStatus)?.label}"?`}
        variant="default"
        icon="sync"
        primaryAction={{
          label: "Confirm",
          onPress: handleStatusConfirm,
        }}
        secondaryAction={{
          label: "Cancel",
          onPress: () => {
            setShowStatusDialog(false);
            setPendingStatus(null);
          },
        }}
      />

      {/* Error Dialog */}
      <Dialog
        visible={showErrorDialog}
        onClose={() => {
          setShowErrorDialog(false);
          router.back();
        }}
        title="Error Loading Batch"
        message={errorMessage}
        variant="error"
        icon="alert-circle"
        primaryAction={{
          label: "Retry",
          onPress: () => {
            setShowErrorDialog(false);
            loadSession();
          },
        }}
        secondaryAction={{
          label: "Go Back",
          onPress: () => {
            setShowErrorDialog(false);
            router.back();
          },
        }}
      />

      {/* Loading Overlay */}
      {updating && (
        <View style={styles.updatingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.updatingText}>Updating status...</Text>
        </View>
      )}
    </SafeAreaView>
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
            size={16}
            color={colors.foregroundMuted}
            style={{ marginRight: 8 }}
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

function FilterButton({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  const colors = useThemeColors();
  return (
    <TouchableOpacity
      style={[
        styles.filterButton,
        { borderColor: colors.border },
        active && {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
        },
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.filterText,
          { color: colors.foreground },
          active && { color: "#fff" },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function StudentItem({ student }: { student: any }) {
  const colors = useThemeColors();
  const isSubmitted = student.attendance?.submissionTime;
  const isPresent = student.attendance && !student.attendance.submissionTime;
  const isAbsent = !student.attendance;

  return (
    <View style={[styles.studentItem, { borderBottomColor: colors.border }]}>
      <View style={styles.studentHeader}>
        <Text style={[styles.studentName, { color: colors.foreground }]}>
          {student.firstName || "Unknown"} {student.lastName || ""}
        </Text>
        {isSubmitted && (
          <Badge variant="success">
            <Text style={{ color: "#fff", fontSize: 11, fontWeight: "600" }}>
              Submitted
            </Text>
          </Badge>
        )}
        {isPresent && (
          <Badge variant="warning">
            <Text style={{ color: "#fff", fontSize: 11, fontWeight: "600" }}>
              Present
            </Text>
          </Badge>
        )}
        {isAbsent && (
          <Badge variant="error">
            <Text style={{ color: "#fff", fontSize: 11, fontWeight: "600" }}>
              Absent
            </Text>
          </Badge>
        )}
      </View>
      <Text style={[styles.studentIndex, { color: colors.foregroundMuted }]}>
        {student.indexNumber}
      </Text>
      {student.program && (
        <Text style={[styles.studentInfo, { color: colors.foregroundMuted }]}>
          {student.program} • Level {student.level || "N/A"}
        </Text>
      )}
      {student.attendance && (
        <View style={styles.timeInfo}>
          <View style={styles.timeRow}>
            <Ionicons name="log-in" size={14} color={colors.foregroundMuted} />
            <Text style={[styles.timeText, { color: colors.foregroundMuted }]}>
              Entry:{" "}
              {new Date(student.attendance.entryTime).toLocaleTimeString()}
            </Text>
          </View>
          {student.attendance.exitTime && (
            <View style={styles.timeRow}>
              <Ionicons
                name="log-out"
                size={14}
                color={colors.foregroundMuted}
              />
              <Text
                style={[styles.timeText, { color: colors.foregroundMuted }]}
              >
                Exit:{" "}
                {new Date(student.attendance.exitTime).toLocaleTimeString()}
              </Text>
            </View>
          )}
          {student.attendance.submissionTime && (
            <View style={styles.timeRow}>
              <Ionicons name="checkmark-done" size={14} color="#10b981" />
              <Text style={[styles.timeText, { color: "#10b981" }]}>
                Submitted:{" "}
                {new Date(
                  student.attendance.submissionTime
                ).toLocaleTimeString()}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  scrollView: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    textAlign: "center",
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  cardContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  infoLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "right",
    flex: 1,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    gap: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
  },
  statLabel: {
    fontSize: 12,
    color: "#fff",
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
    alignItems: "center",
  },
  filterText: {
    fontSize: 11,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 12,
  },
  studentItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  studentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  studentName: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },
  studentIndex: {
    fontSize: 13,
    marginBottom: 4,
  },
  studentInfo: {
    fontSize: 12,
    marginBottom: 8,
  },
  timeInfo: {
    gap: 4,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timeText: {
    fontSize: 12,
  },
  statusDropdown: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "transparent",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: "auto",
  },
  dropdownContainer: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownItemContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dropdownItemText: {
    fontSize: 14,
    flex: 1,
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
