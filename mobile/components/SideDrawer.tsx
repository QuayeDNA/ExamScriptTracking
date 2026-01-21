import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Animated,
  Image,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ExamSession } from "@/api/examSessions";
import type { ExamAttendance } from "@/types";
import { useThemeColors } from "@/constants/design-system";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SCREEN_HEIGHT = Dimensions.get("window").height;
const TAB_BAR_HEIGHT = 80;

interface SideDrawerProps {
  visible: boolean;
  onClose: () => void;
  session: ExamSession | null;
  attendances: ExamAttendance[];
  stats: any;
  onViewDetails: () => void;
  onEndSession: () => void;
  isEndingSession?: boolean;
}

const SideDrawer = ({
  visible,
  onClose,
  session,
  attendances,
  stats,
  onViewDetails,
  onEndSession,
  isEndingSession = false,
}: SideDrawerProps) => {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [slideAnim] = useState(new Animated.Value(SCREEN_WIDTH));
  const [backdropOpacity] = useState(new Animated.Value(0));
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showStudentModal, setShowStudentModal] = useState(false);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          damping: 20,
          stiffness: 90,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: SCREEN_WIDTH,
          useNativeDriver: true,
          damping: 20,
          stiffness: 90,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    onClose();
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

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!session) return null;

  // Calculate drawer height (full screen)
  const drawerHeight = SCREEN_HEIGHT;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Backdrop */}
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: backdropOpacity,
            },
          ]}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={handleClose}
          />
        </Animated.View>

        {/* Side Drawer */}
        <Animated.View
          style={[
            styles.drawer,
            {
              backgroundColor: colors.background,
              transform: [{ translateX: slideAnim }],
              height: drawerHeight,
              top: 0,
              paddingTop: insets.top,
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              Exam Session Details
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.content} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Session Info */}
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="document-text" size={20} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  Session Information
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.label, { color: colors.foregroundMuted }]}>
                  Course:
                </Text>
                <Text style={[styles.value, { color: colors.foreground }]}>
                  {session.courseName}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.label, { color: colors.foregroundMuted }]}>
                  Code:
                </Text>
                <Text style={[styles.value, { color: colors.foreground }]}>
                  {session.courseCode}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.label, { color: colors.foregroundMuted }]}>
                  Venue:
                </Text>
                <Text style={[styles.value, { color: colors.foreground }]}>
                  {session.venue}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.label, { color: colors.foregroundMuted }]}>
                  Status:
                </Text>
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
              </View>
            </View>

            {/* Stats Section */}
            {stats && (
              <View style={[styles.section, { backgroundColor: colors.card }]}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="stats-chart" size={20} color={colors.primary} />
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                    Statistics
                  </Text>
                </View>
                <View style={styles.statsGrid}>
                  <View style={styles.statCard}>
                    <Ionicons name="people" size={32} color={colors.primary} />
                    <Text style={[styles.statValue, { color: colors.foreground }]}>
                      {stats.totalAttended || 0}/{stats.expectedStudents || 0}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.foregroundMuted }]}>
                      Attended
                    </Text>
                  </View>
                  <View style={styles.statCard}>
                    <Ionicons name="checkmark-circle" size={32} color="#10b981" />
                    <Text style={[styles.statValue, { color: colors.foreground }]}>
                      {stats.submitted || 0}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.foregroundMuted }]}>
                      Submitted
                    </Text>
                  </View>
                  <View style={styles.statCard}>
                    <Ionicons name="time" size={32} color="#3b82f6" />
                    <Text style={[styles.statValue, { color: colors.foreground }]}>
                      {stats.present || 0}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.foregroundMuted }]}>
                      Present
                    </Text>
                  </View>
                  <View style={styles.statCard}>
                    <Ionicons name="alert-circle" size={32} color="#6b7280" />
                    <Text style={[styles.statValue, { color: colors.foreground }]}>
                      {(stats.expectedStudents || 0) - (stats.totalAttended || 0)}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.foregroundMuted }]}>
                      Absent
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Actions */}
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="options" size={20} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  Actions
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                onPress={onViewDetails}
              >
                <Ionicons name="document-text" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>View Full Details</Text>
              </TouchableOpacity>
              {session.status === "IN_PROGRESS" && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: "#ef4444" }]}
                  onPress={onEndSession}
                  disabled={isEndingSession}
                >
                  {isEndingSession ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="stop-circle" size={20} color="#fff" />
                  )}
                  <Text style={styles.actionButtonText}>
                    {isEndingSession ? "Ending..." : "End Session"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Attendances List */}
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="list" size={20} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  Recent Attendances ({attendances.length})
                </Text>
              </View>
              {attendances.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="scan" size={48} color={colors.border} />
                  <Text style={[styles.emptyText, { color: colors.foregroundMuted }]}>
                    No attendances yet
                  </Text>
                </View>
              ) : (
                attendances.map((attendance) => (
                  <TouchableOpacity
                    key={attendance.id}
                    style={[
                      styles.attendanceItem,
                      { borderColor: colors.border },
                    ]}
                    onPress={() => {
                      setSelectedStudent(attendance.student);
                      setShowStudentModal(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.attendanceRow}>
                      <View style={styles.attendanceInfo}>
                        <Text
                          style={[styles.studentName, { color: colors.foreground }]}
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
                  </TouchableOpacity>
                ))
              )}
            </View>
          </ScrollView>
        </Animated.View>

        {/* Student Profile Modal */}
        <Modal
          visible={showStudentModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowStudentModal(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowStudentModal(false)}
          >
            <View style={[styles.profileModal, { backgroundColor: colors.card }]}>
              {selectedStudent?.profilePicture ? (
                <Image
                  source={{ uri: selectedStudent.profilePicture }}
                  style={styles.profileImage}
                  resizeMode="cover"
                  onError={(error) => {
                    console.log("Profile image load error:", error.nativeEvent.error);
                  }}
                />
              ) : (
                <View style={[styles.profilePlaceholder, { backgroundColor: colors.muted }]}>
                  <Ionicons name="person" size={48} color={colors.foregroundMuted} />
                </View>
              )}
              <Text style={[styles.profileName, { color: colors.foreground }]}>
                {selectedStudent?.firstName} {selectedStudent?.lastName}
              </Text>
              <Text style={[styles.profileIndex, { color: colors.foregroundMuted }]}>
                {selectedStudent?.indexNumber}
              </Text>
              {selectedStudent?.program && (
                <Text style={[styles.profileProgram, { color: colors.foregroundMuted }]}>
                  {selectedStudent.program}
                </Text>
              )}
              <TouchableOpacity
                style={[styles.closeModalButton, { backgroundColor: colors.primary }]}
                onPress={() => setShowStudentModal(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  drawer: {
    position: "absolute",
    right: 0,
    width: "90%",
    shadowColor: "#000",
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 20,
    borderRadius: 12,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
  },
  value: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    alignItems: "center",
    padding: 16,
    gap: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 8,
    gap: 8,
    marginBottom: 12,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
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
    marginBottom: 8,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  profileModal: {
    width: "80%",
    maxWidth: 300,
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    gap: 12,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  profilePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  profileName: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  profileIndex: {
    fontSize: 16,
    textAlign: "center",
    fontWeight: "600",
  },
  profileProgram: {
    fontSize: 14,
    textAlign: "center",
  },
  closeModalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 8,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default SideDrawer;