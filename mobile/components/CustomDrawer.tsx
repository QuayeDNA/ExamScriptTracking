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
  PanResponder,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import type { ExamSession } from "@/api/examSessions";
import type { ExamAttendance } from "@/types";
import { examSessionsApi } from "@/api/examSessions";
import { mobileSocketService } from "@/lib/socket";
import { useThemeColors } from "@/constants/design-system";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const DRAWER_HEIGHTS = {
  CLOSED: 0,
  PEEK: SCREEN_HEIGHT * 0.15,
  HALF: SCREEN_HEIGHT * 0.5,
  FULL: SCREEN_HEIGHT * 0.9,
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
    const colors = useThemeColors();
    const [drawerHeight] = useState(new Animated.Value(0));
    const [currentIndex, setCurrentIndex] = useState(-1);
    const [attendances, setAttendances] = useState<ExamAttendance[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useImperativeHandle(ref, () => ({
      snapToIndex: (index: number) => {
        setCurrentIndex(index);
        let height = 0;
        switch (index) {
          case 0:
            height = DRAWER_HEIGHTS.PEEK;
            break;
          case 1:
            height = DRAWER_HEIGHTS.HALF;
            break;
          case 2:
            height = DRAWER_HEIGHTS.FULL;
            break;
          default:
            height = 0;
        }
        Animated.spring(drawerHeight, {
          toValue: height,
          useNativeDriver: false,
          damping: 20,
          stiffness: 90,
        }).start();
      },
      close: () => {
        setCurrentIndex(-1);
        Animated.spring(drawerHeight, {
          toValue: 0,
          useNativeDriver: false,
          damping: 20,
          stiffness: 90,
        }).start();
      },
    }));

    const loadAttendanceData = useCallback(async () => {
      if (!session) return;

      try {
        setLoading(true);
        const data = await examSessionsApi.getExamSession(session.id);

        if (data.attendances) {
          setAttendances(data.attendances.slice(0, 5)); // Show only recent 5
        }

        if (data.stats) {
          setStats(data.stats);
        }
      } catch (error: any) {
        Toast.show({
          type: "error",
          text1: "Load Error",
          text2: error.error || "Failed to load attendance data",
        });
      } finally {
        setLoading(false);
      }
    }, [session]);

    // Socket real-time updates
    useEffect(() => {
      if (!session) return;

      const handleAttendanceUpdate = () => {
        loadAttendanceData();
      };

      const handleBatchUpdate = (data: any) => {
        if (data.id === session.id) {
          loadAttendanceData();
        }
      };

      // Connect to socket events
      mobileSocketService.emit("join", { examSessionId: session.id });

      const socket = (mobileSocketService as any).socket;
      if (socket) {
        socket.on("attendance:recorded", handleAttendanceUpdate);
        socket.on("batch:status_updated", handleBatchUpdate);
      }

      // Initial load
      loadAttendanceData();

      return () => {
        if (socket) {
          socket.off("attendance:recorded", handleAttendanceUpdate);
          socket.off("batch:status_updated", handleBatchUpdate);
        }
        mobileSocketService.emit("leave", { examSessionId: session.id });
      };
    }, [session, loadAttendanceData]);

    const getStatusColor = (status: string) => {
      switch (status) {
        case "SUBMITTED":
          return "#10b981";
        case "PRESENT":
          return "#3b82f6";
        case "LEFT_WITHOUT_SUBMITTING":
          return "#f59e0b";
        default:
          return "#6b7280";
      }
    };

    const getBatchStatusColor = (status: string) => {
      switch (status) {
        case "NOT_STARTED":
          return "#6b7280";
        case "IN_PROGRESS":
          return "#3b82f6";
        case "SUBMITTED":
          return "#10b981";
        case "IN_TRANSIT":
          return "#f59e0b";
        case "WITH_LECTURER":
          return "#8b5cf6";
        default:
          return "#6b7280";
      }
    };

    const getBatchStatusText = (status: string) => {
      switch (status) {
        case "NOT_STARTED":
          return "Not Started";
        case "IN_PROGRESS":
          return "In Progress";
        case "SUBMITTED":
          return "Submitted";
        case "IN_TRANSIT":
          return "In Transit";
        case "WITH_LECTURER":
          return "With Lecturer";
        case "UNDER_GRADING":
          return "Under Grading";
        case "GRADING_COMPLETED":
          return "Graded";
        case "ARCHIVED":
          return "Archived";
        default:
          return status;
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

    const handleSwipeGesture = (direction: "up" | "down") => {
      if (direction === "down") {
        if (currentIndex === 2) {
          setCurrentIndex(1);
          Animated.spring(drawerHeight, {
            toValue: DRAWER_HEIGHTS.HALF,
            useNativeDriver: false,
            damping: 20,
            stiffness: 90,
          }).start();
        } else if (currentIndex === 1) {
          setCurrentIndex(0);
          Animated.spring(drawerHeight, {
            toValue: DRAWER_HEIGHTS.PEEK,
            useNativeDriver: false,
            damping: 20,
            stiffness: 90,
          }).start();
        } else if (currentIndex === 0) {
          setCurrentIndex(-1);
          Animated.spring(drawerHeight, {
            toValue: 0,
            useNativeDriver: false,
            damping: 20,
            stiffness: 90,
          }).start();
        }
      } else {
        if (currentIndex === 0) {
          setCurrentIndex(1);
          Animated.spring(drawerHeight, {
            toValue: DRAWER_HEIGHTS.HALF,
            useNativeDriver: false,
            damping: 20,
            stiffness: 90,
          }).start();
        } else if (currentIndex === 1) {
          setCurrentIndex(2);
          Animated.spring(drawerHeight, {
            toValue: DRAWER_HEIGHTS.FULL,
            useNativeDriver: false,
            damping: 20,
            stiffness: 90,
          }).start();
        }
      }
    };

    const panResponder = useState(() =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return Math.abs(gestureState.dy) > 10;
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dy > 80) {
            handleSwipeGesture("down");
          } else if (gestureState.dy < -80) {
            handleSwipeGesture("up");
          }
        },
      })
    )[0];

    if (!session) return null;

    return (
      <Animated.View
        style={[
          styles.drawer,
          { height: drawerHeight, backgroundColor: colors.background },
        ]}
      >
        <View {...panResponder.panHandlers}>
          <View style={styles.handle}>
            <View
              style={[styles.handleBar, { backgroundColor: colors.border }]}
            />
          </View>
        </View>

        {/* Drawer Header */}
        <View
          style={[
            styles.drawerHeader,
            { borderBottomColor: colors.border, backgroundColor: colors.card },
          ]}
        >
          <View style={styles.headerLeft}>
            <View>
              <Text
                style={[styles.courseName, { color: colors.foreground }]}
                numberOfLines={1}
              >
                {session.courseName}
              </Text>
              <Text
                style={[styles.courseCode, { color: colors.foregroundMuted }]}
              >
                {session.courseCode}
              </Text>
              <Text style={[styles.sessionId, { color: colors.border }]}>
                ID: {session.id.slice(0, 8)}
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getBatchStatusColor(session.status) },
              ]}
            >
              <Text style={styles.statusBadgeText}>
                {getBatchStatusText(session.status)}
              </Text>
            </View>
            <Text
              style={[styles.venueText, { color: colors.foregroundMuted }]}
              numberOfLines={1}
            >
              <Ionicons
                name="location"
                size={12}
                color={colors.foregroundMuted}
              />{" "}
              {session.venue}
            </Text>
          </View>
        </View>

        {/* Action Bar */}
        <View
          style={[
            styles.actionBar,
            { backgroundColor: colors.card, borderBottomColor: colors.border },
          ]}
        >
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={onViewDetails}
          >
            <Ionicons name="document-text" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Details</Text>
          </TouchableOpacity>
          {session.status === "IN_PROGRESS" && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: "#ef4444" }]}
              onPress={onEndSession}
            >
              <Ionicons name="stop-circle" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>End</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stats Section */}
        {stats && (
          <View
            style={[
              styles.statsContainer,
              {
                backgroundColor: colors.card,
                borderBottomColor: colors.border,
              },
            ]}
          >
            <View style={styles.statItem}>
              <Ionicons name="people" size={20} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.foreground }]}>
                {stats.totalAttended || 0}/{stats.expectedStudents || 0}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              <Text style={[styles.statValue, { color: colors.foreground }]}>
                {stats.submitted || 0}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="time" size={20} color="#3b82f6" />
              <Text style={[styles.statValue, { color: colors.foreground }]}>
                {stats.present || 0}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="alert-circle" size={20} color="#6b7280" />
              <Text style={[styles.statValue, { color: colors.foreground }]}>
                {(stats.expectedStudents || 0) - (stats.totalAttended || 0)}
              </Text>
            </View>
          </View>
        )}

        {/* Recent Attendees */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {loading && attendances.length === 0 ? (
            <ActivityIndicator
              size="small"
              color={colors.primary}
              style={{ marginTop: 20 }}
            />
          ) : attendances.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="scan" size={48} color={colors.border} />
              <Text
                style={[styles.emptyText, { color: colors.foregroundMuted }]}
              >
                No attendances yet
              </Text>
            </View>
          ) : (
            attendances.map((attendance) => (
              <View
                key={attendance.id}
                style={[
                  styles.attendanceItem,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <View style={styles.attendanceRow}>
                  <View style={styles.attendanceInfo}>
                    <Text
                      style={[styles.studentName, { color: colors.foreground }]}
                      numberOfLines={1}
                    >
                      {attendance.student.firstName}{" "}
                      {attendance.student.lastName}
                    </Text>
                    <Text
                      style={[
                        styles.indexNumber,
                        { color: colors.foregroundMuted },
                      ]}
                    >
                      {attendance.student.indexNumber}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: getStatusColor(attendance.status) },
                    ]}
                  />
                </View>
                {attendance.entryTime && (
                  <Text
                    style={[styles.timeText, { color: colors.foregroundMuted }]}
                  >
                    <Ionicons name="enter" size={12} />{" "}
                    {formatTime(attendance.entryTime)}
                    {attendance.exitTime &&
                      ` • ${formatTime(attendance.exitTime)}`}
                  </Text>
                )}
              </View>
            ))
          )}
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
    overflow: "hidden",
  },
  handle: {
    paddingVertical: 8,
    alignItems: "center",
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  drawerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  courseName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  courseCode: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  sessionId: {
    fontSize: 9,
    fontWeight: "500",
  },
  headerRight: {
    alignItems: "flex-end",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
  },
  venueText: {
    fontSize: 11,
    fontWeight: "500",
  },
  actionBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  statItem: {
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: "500",
  },
  attendanceItem: {
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
  },
  attendanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  attendanceInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  indexNumber: {
    fontSize: 12,
    fontWeight: "500",
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  timeText: {
    fontSize: 11,
    fontWeight: "500",
  },
});
