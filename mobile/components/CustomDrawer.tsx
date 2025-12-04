import {
  useState,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions,
  ScrollView,
  RefreshControl,
  TouchableWithoutFeedback,
  PanResponder,
} from "react-native";
import type { ExamSession } from "@/api/examSessions";
import type { ExamAttendance } from "@/types";
import { examSessionsApi } from "@/api/examSessions";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const DRAWER_HEIGHTS = {
  CLOSED: 0,
  SMALL: SCREEN_HEIGHT * 0.25,
  MEDIUM: SCREEN_HEIGHT * 0.5,
  LARGE: SCREEN_HEIGHT * 0.9,
};

interface CustomDrawerProps {
  session: ExamSession | null;
  onViewDetails: () => void;
  onEndSession: () => void;
}

export interface CustomDrawerRef {
  snapToIndex: (index: number) => void;
  close: () => void;
}

const CustomDrawer = forwardRef<CustomDrawerRef, CustomDrawerProps>(
  ({ session, onViewDetails, onEndSession }, ref) => {
    const [drawerHeight] = useState(new Animated.Value(0));
    const [currentIndex, setCurrentIndex] = useState(-1);
    const [attendances, setAttendances] = useState<ExamAttendance[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const panY = useState(new Animated.Value(0))[0];

    useImperativeHandle(ref, () => ({
      snapToIndex: (index: number) => {
        setCurrentIndex(index);
        let height = 0;
        switch (index) {
          case 0:
            height = DRAWER_HEIGHTS.SMALL;
            break;
          case 1:
            height = DRAWER_HEIGHTS.MEDIUM;
            break;
          case 2:
            height = DRAWER_HEIGHTS.LARGE;
            break;
          default:
            height = 0;
        }
        Animated.spring(drawerHeight, {
          toValue: height,
          useNativeDriver: false,
          tension: 50,
          friction: 8,
        }).start();
      },
      close: () => {
        setCurrentIndex(-1);
        Animated.spring(drawerHeight, {
          toValue: 0,
          useNativeDriver: false,
          tension: 50,
          friction: 8,
        }).start();
      },
    }));

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
      } catch {
        // Silently handle error
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

    const cycleDrawerSize = () => {
      let newIndex: number;
      if (currentIndex === 2) {
        // From large, go to medium
        newIndex = 1;
      } else if (currentIndex === 1) {
        // From medium, go to large
        newIndex = 2;
      } else {
        // From small or closed, go to medium
        newIndex = 1;
      }

      setCurrentIndex(newIndex);
      let height = 0;
      switch (newIndex) {
        case 0:
          height = DRAWER_HEIGHTS.SMALL;
          break;
        case 1:
          height = DRAWER_HEIGHTS.MEDIUM;
          break;
        case 2:
          height = DRAWER_HEIGHTS.LARGE;
          break;
      }
      Animated.spring(drawerHeight, {
        toValue: height,
        useNativeDriver: false,
        tension: 50,
        friction: 8,
      }).start();
    };

    const panResponder = useState(() =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return Math.abs(gestureState.dy) > 5;
        },
        onPanResponderMove: (_, gestureState) => {
          if (gestureState.dy > 0) {
            // Swiping down
            panY.setValue(gestureState.dy);
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          panY.setValue(0);

          if (gestureState.dy > 50) {
            // Swipe down detected - collapse drawer
            if (currentIndex === 2) {
              // From large to medium
              setCurrentIndex(1);
              Animated.spring(drawerHeight, {
                toValue: DRAWER_HEIGHTS.MEDIUM,
                useNativeDriver: false,
                tension: 50,
                friction: 8,
              }).start();
            } else if (currentIndex === 1) {
              // From medium to small
              setCurrentIndex(0);
              Animated.spring(drawerHeight, {
                toValue: DRAWER_HEIGHTS.SMALL,
                useNativeDriver: false,
                tension: 50,
                friction: 8,
              }).start();
            } else if (currentIndex === 0) {
              // From small to closed
              setCurrentIndex(-1);
              Animated.spring(drawerHeight, {
                toValue: 0,
                useNativeDriver: false,
                tension: 50,
                friction: 8,
              }).start();
            }
          } else if (gestureState.dy < -50) {
            // Swipe up detected - expand drawer
            if (currentIndex === 0) {
              setCurrentIndex(1);
              Animated.spring(drawerHeight, {
                toValue: DRAWER_HEIGHTS.MEDIUM,
                useNativeDriver: false,
                tension: 50,
                friction: 8,
              }).start();
            } else if (currentIndex === 1) {
              setCurrentIndex(2);
              Animated.spring(drawerHeight, {
                toValue: DRAWER_HEIGHTS.LARGE,
                useNativeDriver: false,
                tension: 50,
                friction: 8,
              }).start();
            }
          }
        },
      })
    )[0];

    if (!session) return null;

    return (
      <Animated.View style={[styles.drawer, { height: drawerHeight }]}>
        <View {...panResponder.panHandlers}>
          <TouchableWithoutFeedback onPress={cycleDrawerSize}>
            <View style={styles.handle}>
              <View style={styles.handleBar} />
            </View>
          </TouchableWithoutFeedback>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
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
              {stats.attendanceRate !== undefined && (
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
              attendances.map((attendance) => (
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
        </ScrollView>
      </Animated.View>
    );
  }
);

CustomDrawer.displayName = "CustomDrawer";

export default CustomDrawer;

const styles = StyleSheet.create({
  drawer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: "hidden",
  },
  handle: {
    paddingVertical: 12,
    alignItems: "center",
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: "#d1d5db",
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
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
