import { useMemo, useEffect, useState, useCallback, forwardRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import type { ExamSession } from "@/api/examSessions";
import type { ExamAttendance } from "@/types";
import { examSessionsApi } from "@/api/examSessions";

interface AttendanceDrawerProps {
  session: ExamSession | null;
  onViewDetails: () => void;
  onEndSession: () => void;
}

const AttendanceDrawer = forwardRef<BottomSheet, AttendanceDrawerProps>(
  ({ session, onViewDetails, onEndSession }, ref) => {
    const snapPoints = useMemo(() => ["25%", "50%", "90%"], []);
    const [attendances, setAttendances] = useState<ExamAttendance[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const loadAttendanceData = useCallback(async () => {
      if (!session) return;

      try {
        setLoading(true);
        const data = await examSessionsApi.getExamSession(session.id);

        if (data.attendances) {
          setAttendances(data.attendances);
        }

        if (data.stats) {
          setStats(data.stats);
        }
      } catch (error) {
        console.error("Failed to load attendance:", error);
      } finally {
        setLoading(false);
      }
    }, [session]);

    const onRefresh = useCallback(async () => {
      setRefreshing(true);
      await loadAttendanceData();
      setRefreshing(false);
    }, [loadAttendanceData]);

    useEffect(() => {
      if (session) {
        loadAttendanceData();
        // Set up polling for real-time updates every 10 seconds
        const interval = setInterval(loadAttendanceData, 10000);
        return () => clearInterval(interval);
      }
    }, [session, loadAttendanceData]);

    const getStatusColor = (status: string) => {
      switch (status) {
        case "SUBMITTED":
          return styles.statusSubmitted;
        case "PRESENT":
          return styles.statusPresent;
        case "LEFT_WITHOUT_SUBMITTING":
          return styles.statusLeft;
        default:
          return styles.statusAbsent;
      }
    };

    const getStatusText = (status: string) => {
      switch (status) {
        case "SUBMITTED":
          return "Submitted";
        case "PRESENT":
          return "Present";
        case "LEFT_WITHOUT_SUBMITTING":
          return "Left";
        default:
          return "Absent";
      }
    };

    const formatTime = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    if (!session) return null;

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose={false}
        handleIndicatorStyle={styles.handleIndicator}
        backgroundStyle={styles.background}
      >
        <BottomSheetScrollView
          style={styles.container}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Batch Header */}
          <View style={styles.header}>
            <Text style={styles.courseCode}>📚 {session.courseCode}</Text>
            <Text style={styles.courseName}>{session.courseName}</Text>
            <Text style={styles.venue}>📍 {session.venue}</Text>
            <Text style={styles.batchCode}>Batch: {session.batchQrCode}</Text>
          </View>

          {/* Stats Section */}
          {stats && (
            <View style={styles.statsCard}>
              <View style={styles.statRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {stats.totalAttended || 0}/{stats.expectedStudents || 0}
                  </Text>
                  <Text style={styles.statLabel}>Students Present</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: "#10b981" }]}>
                    {stats.submitted || 0}
                  </Text>
                  <Text style={styles.statLabel}>Submitted</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: "#3b82f6" }]}>
                    {stats.present || 0}
                  </Text>
                  <Text style={styles.statLabel}>In Progress</Text>
                </View>
              </View>
              {stats.attendanceRate && (
                <Text style={styles.attendanceRate}>
                  Attendance: {stats.attendanceRate}%
                </Text>
              )}
            </View>
          )}

          {/* Recent Attendees */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Attendees</Text>

            {loading && attendances.length === 0 ? (
              <ActivityIndicator
                size="small"
                color="#3b82f6"
                style={{ marginTop: 20 }}
              />
            ) : attendances.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No students scanned yet</Text>
                <Text style={styles.emptySubtext}>
                  Scan student QR codes to record attendance
                </Text>
              </View>
            ) : (
              attendances.map((attendance, index) => (
                <View key={attendance.id} style={styles.attendanceItem}>
                  <View style={styles.attendanceHeader}>
                    <Text style={styles.studentName}>
                      {attendance.student.firstName}{" "}
                      {attendance.student.lastName}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        getStatusColor(attendance.status),
                      ]}
                    >
                      <Text style={styles.statusText}>
                        {getStatusText(attendance.status)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.indexNumber}>
                    {attendance.student.indexNumber}
                  </Text>
                  <View style={styles.timeRow}>
                    {attendance.entryTime && (
                      <Text style={styles.timeText}>
                        ⏰ Entry: {formatTime(attendance.entryTime)}
                      </Text>
                    )}
                    {attendance.exitTime && (
                      <Text style={styles.timeText}>
                        🚪 Exit: {formatTime(attendance.exitTime)}
                      </Text>
                    )}
                    {attendance.submissionTime && (
                      <Text style={styles.timeText}>
                        ✅ Submitted: {formatTime(attendance.submissionTime)}
                      </Text>
                    )}
                  </View>
                  {attendance.discrepancyNote && (
                    <Text style={styles.discrepancyNote}>
                      ⚠️ {attendance.discrepancyNote}
                    </Text>
                  )}
                </View>
              ))
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={onViewDetails}
            >
              <Text style={styles.primaryButtonText}>View Full Details →</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onEndSession}
            >
              <Text style={styles.secondaryButtonText}>End Session</Text>
            </TouchableOpacity>
          </View>
        </BottomSheetScrollView>
      </BottomSheet>
    );
  }
);

AttendanceDrawer.displayName = "AttendanceDrawer";

export default AttendanceDrawer;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  handleIndicator: {
    backgroundColor: "#d1d5db",
    width: 40,
  },
  background: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  courseCode: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  courseName: {
    fontSize: 16,
    color: "#6b7280",
    marginBottom: 8,
  },
  venue: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
  batchCode: {
    fontSize: 12,
    color: "#9ca3af",
  },
  statsCard: {
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#3b82f6",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
  },
  attendanceRate: {
    textAlign: "center",
    fontSize: 14,
    color: "#059669",
    fontWeight: "600",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: "#6b7280",
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9ca3af",
  },
  attendanceItem: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  attendanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  studentName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusSubmitted: {
    backgroundColor: "#d1fae5",
  },
  statusPresent: {
    backgroundColor: "#dbeafe",
  },
  statusLeft: {
    backgroundColor: "#fee2e2",
  },
  statusAbsent: {
    backgroundColor: "#f3f4f6",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#111827",
  },
  indexNumber: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 8,
  },
  timeRow: {
    gap: 8,
  },
  timeText: {
    fontSize: 12,
    color: "#6b7280",
  },
  discrepancyNote: {
    fontSize: 12,
    color: "#dc2626",
    marginTop: 8,
    fontStyle: "italic",
  },
  actions: {
    gap: 12,
    marginBottom: 32,
  },
  primaryButton: {
    backgroundColor: "#3b82f6",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "#f3f4f6",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  secondaryButtonText: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "600",
  },
});
