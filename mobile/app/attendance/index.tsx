import { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Platform,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Application from "expo-application";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { Text } from "@/components/ui/typography";
import { 
  useThemeColors, 
  Spacing, 
  BorderRadius, 
  Shadows,
  Typography 
} from "@/constants/design-system";
import {
  classAttendanceApi,
  type ClassAttendanceRecord,
  type AttendanceSession,
} from "@/api/classAttendance";

const DEVICE_ID_KEY = "attendance_device_id";

// Safe AsyncStorage wrapper
let asyncStorage: any = null;
try {
  asyncStorage = AsyncStorage;
} catch {
  console.warn("AsyncStorage not available, using fallback storage");
}

async function getOrCreateDeviceId() {
  if (!asyncStorage) {
    return `fallback-${Date.now()}`;
  }
  const existing = await asyncStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;

  let candidate: string;
  if (Platform.OS === "web") {
    candidate = `web-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  } else {
    candidate =
      Application.getAndroidId() ||
      (await Application.getIosIdForVendorAsync()) ||
      `device-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
  await asyncStorage.setItem(DEVICE_ID_KEY, candidate);
  return candidate;
}

export default function AttendanceDashboard() {
  const colors = useThemeColors();
  const router = useRouter();

  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [session, setSession] = useState<AttendanceSession | null>(null);
  const [records, setRecords] = useState<ClassAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Start recording modal
  const [showStartModal, setShowStartModal] = useState(false);
  const [courseName, setCourseName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [lecturerName, setLecturerName] = useState("");
  const [notes, setNotes] = useState("");

  // Active recording dialog
  const [showActiveRecordingDialog, setShowActiveRecordingDialog] = useState(false);
  const [activeRecordingData, setActiveRecordingData] = useState<{
    record: ClassAttendanceRecord;
    action: 'continue' | 'end';
  } | null>(null);

  useEffect(() => {
    (async () => {
      const id = await getOrCreateDeviceId();
      setDeviceId(id);
    })();
  }, []);

  useEffect(() => {
    if (!deviceId) return;
    loadSessionAndRecords();
  }, [deviceId]);

  const loadSessionAndRecords = async () => {
    if (!deviceId) return;
    try {
      if (!refreshing) setLoading(true);
      const sessionResp = await classAttendanceApi.createOrGetSession({
        deviceId,
      });
      setSession(sessionResp.session);
      const recordResp = await classAttendanceApi.getSessionRecords(
        sessionResp.session.id,
        { page: 1, limit: 10 }
      );
      setRecords(recordResp.records || []);
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Attendance",
        text2: error?.error || "Failed to load attendance data",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleStartNewRecording = () => {
    const activeRecord = records.find((r) => r.status === "IN_PROGRESS");
    if (activeRecord) {
      setActiveRecordingData({ record: activeRecord, action: 'continue' });
      setShowActiveRecordingDialog(true);
    } else {
      setShowStartModal(true);
    }
  };

  const handleContinueRecording = () => {
    if (!activeRecordingData?.record) return;
    router.push({
      pathname: "/attendance/record",
      params: { recordId: activeRecordingData.record.id, sessionId: session?.id },
    });
    setShowActiveRecordingDialog(false);
  };

  const handleEndAndStartNew = async () => {
    if (!activeRecordingData?.record) return;
    try {
      await classAttendanceApi.endRecord(activeRecordingData.record.id);
      Toast.show({ type: "info", text1: "Previous recording ended" });
      setShowStartModal(true);
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error?.error || "Failed to end previous recording",
      });
    } finally {
      setShowActiveRecordingDialog(false);
    }
  };

  const handleStartRecording = async () => {
    if (!session) return;
    try {
      const { record } = await classAttendanceApi.createRecord({
        sessionId: session.id,
        courseName: courseName || undefined,
        courseCode: courseCode || undefined,
        lecturerName: lecturerName || undefined,
        notes: notes || undefined,
      });
      setShowStartModal(false);
      setCourseName("");
      setCourseCode("");
      setLecturerName("");
      setNotes("");
      Toast.show({ type: "success", text1: "Recording started" });
      router.push({
        pathname: "/attendance/record",
        params: { recordId: record.id, sessionId: session.id },
      });
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Start recording",
        text2: error?.error || "Failed to start recording",
      });
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadSessionAndRecords();
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView
        style={[styles.center, { backgroundColor: colors.background }]}
        edges={["top"]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.foregroundMuted }]}>
          Loading attendance...
        </Text>
      </SafeAreaView>
    );
  }

  const activeRecord = records.find((r) => r.status === "IN_PROGRESS");
  const completedCount = records.filter((r) => r.status === "COMPLETED").length;
  const totalStudents = records.reduce((sum, r) => sum + (r.totalStudents || 0), 0);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Active Recording Banner */}
        {activeRecord && (
          <View
            style={[
              styles.activeRecording,
              {
                backgroundColor: colors.successMuted + "20",
                borderColor: colors.success,
              },
            ]}
          >
            <View style={styles.activeRecordingContent}>
              <View
                style={[
                  styles.pulseIndicator,
                  { backgroundColor: colors.success },
                ]}
              />
              <View style={styles.activeRecordingInfo}>
                <Text
                  style={[
                    styles.activeRecordingTitle,
                    { color: colors.success },
                  ]}
                >
                  Recording Active
                </Text>
                <Text
                  style={[
                    styles.activeRecordingSubtitle,
                    { color: colors.foregroundMuted },
                  ]}
                >
                  {activeRecord.courseCode || "Class"} •{" "}
                  {activeRecord.totalStudents || 0} students
                </Text>
              </View>
              <Button
                variant="default"
                style={{
                  backgroundColor: colors.success,
                  ...Shadows.sm,
                }}
                onPress={() =>
                  router.push({
                    pathname: "/attendance/record",
                    params: {
                      recordId: activeRecord.id,
                      sessionId: session?.id,
                    },
                  })
                }
              >
                <Text variant="default">Continue</Text>
              </Button>
            </View>
          </View>
        )}

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <Card
            style={{
              flex: 1,
              backgroundColor: colors.card,
              borderColor: colors.border,
              ...Shadows.sm,
            }}
          >
            <CardContent style={{ alignItems: 'center', padding: Spacing[4] }}>
              <View
                style={[
                  styles.statIconContainer,
                  { backgroundColor: colors.primary + "15" },
                ]}
              >
                <Ionicons name="document-text" size={24} color={colors.primary} />
              </View>
              <Text
                style={[styles.statNumber, { color: colors.foreground }]}
              >
                {records.length}
              </Text>
              <Text
                style={[styles.statLabel, { color: colors.foregroundMuted }]}
              >
                Total Sessions
              </Text>
            </CardContent>
          </Card>

          <Card
            style={{
              flex: 1,
              backgroundColor: colors.card,
              borderColor: colors.border,
              ...Shadows.sm,
            }}
          >
            <CardContent style={{ alignItems: 'center', padding: Spacing[4] }}>
              <View
                style={[
                  styles.statIconContainer,
                  { backgroundColor: colors.success + "15" },
                ]}
              >
                <Ionicons name="checkmark-circle" size={24} color={colors.success} />
              </View>
              <Text
                style={[styles.statNumber, { color: colors.foreground }]}
              >
                {completedCount}
              </Text>
              <Text
                style={[styles.statLabel, { color: colors.foregroundMuted }]}
              >
                Completed
              </Text>
            </CardContent>
          </Card>

          <Card
            style={{
              flex: 1,
              backgroundColor: colors.card,
              borderColor: colors.border,
              ...Shadows.sm,
            }}
          >
            <CardContent style={{ alignItems: 'center', padding: Spacing[4] }}>
              <View
                style={[
                  styles.statIconContainer,
                  { backgroundColor: colors.info + "15" },
                ]}
              >
                <Ionicons name="people" size={24} color={colors.info} />
              </View>
              <Text
                style={[styles.statNumber, { color: colors.foreground }]}
              >
                {totalStudents}
              </Text>
              <Text
                style={[styles.statLabel, { color: colors.foregroundMuted }]}
              >
                Total Students
              </Text>
            </CardContent>
          </Card>
        </View>

        {/* Start Recording Card */}
        <Card
          style={{
            marginHorizontal: Spacing[4],
            marginBottom: Spacing[4],
            backgroundColor: colors.primary,
            ...Shadows.md,
          }}
        >
          <CardContent style={{ padding: Spacing[5] }}>
            <View style={styles.actionCardContent}>
              <View style={[styles.actionCardIcon, { backgroundColor: colors.surface }]}>
                <Ionicons name="scan" size={32} color={colors.primary} />
              </View>
              <View style={styles.actionCardText}>
                <Text style={[styles.actionCardTitle, { color: colors.foreground }]}>
                  {activeRecord ? "Start New Recording" : "Ready to Record"}
                </Text>
                <Text style={[styles.actionCardSubtitle, { color: colors.foregroundMuted }]}>
                  {activeRecord
                    ? "End current session or continue recording"
                    : "Begin tracking class attendance"}
                </Text>
              </View>
            </View>
            <Button
              variant="secondary"
              onPress={handleStartNewRecording}
              style={{ backgroundColor: colors.surface, alignSelf: 'flex-end' }}
            >
              <Text variant="default" style={{ color: colors.foreground }}>
                {activeRecord ? "New Recording" : "Start Recording"}
              </Text>
              <Ionicons name="arrow-forward" size={20} color={colors.foreground} />
            </Button>
          </CardContent>
        </Card>

        {/* Recent Sessions */}
        {records.length > 0 && (
          <View style={styles.recentSection}>
            <View style={styles.sectionHeader}>
              <Text
                style={[styles.sectionTitle, { color: colors.foreground }]}
              >
                Recent Sessions
              </Text>
              <Text
                style={[
                  styles.sectionSubtitle,
                  { color: colors.foregroundMuted },
                ]}
              >
                Last {Math.min(records.length, 3)} recordings
              </Text>
            </View>
            
            {records.slice(0, 3).map((record) => (
              <TouchableOpacity
                key={record.id}
                onPress={() => {
                  if (record.status === "IN_PROGRESS") {
                    router.push({
                      pathname: "/attendance/record",
                      params: { recordId: record.id, sessionId: session?.id },
                    });
                  }
                }}
              >
                <Card
                  style={{
                    marginBottom: Spacing[2],
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    ...Shadows.sm,
                  }}
                >
                  <CardContent style={{ padding: Spacing[4], flexDirection: 'row', alignItems: 'center' }}>
                    <View style={styles.recordCardLeft}>
                      <View
                        style={[
                          styles.recordIcon,
                          {
                            backgroundColor:
                              record.status === "IN_PROGRESS"
                                ? colors.success + "15"
                                : colors.muted,
                          },
                        ]}
                      >
                        <Ionicons
                          name={
                            record.status === "IN_PROGRESS"
                              ? "radio"
                              : "checkmark-circle"
                          }
                          size={20}
                          color={
                            record.status === "IN_PROGRESS"
                              ? colors.success
                              : colors.foregroundMuted
                          }
                        />
                      </View>
                      <View style={styles.recordInfo}>
                        <Text
                          style={[
                            styles.recordTitle,
                            { color: colors.foreground },
                          ]}
                        >
                          {record.courseCode || "Class Attendance"}
                        </Text>
                        <Text
                          style={[
                            styles.recordSubtitle,
                            { color: colors.foregroundMuted },
                          ]}
                        >
                          {record.totalStudents || 0} students •{" "}
                          {new Date(record.startTime).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            record.status === "IN_PROGRESS"
                              ? colors.success + "20"
                              : colors.muted,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          {
                            color:
                              record.status === "IN_PROGRESS"
                                ? colors.success
                                : colors.foregroundMuted,
                          },
                        ]}
                      >
                        {record.status === "IN_PROGRESS" ? "Live" : "Done"}
                      </Text>
                    </View>
                  </CardContent>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Start Recording Modal */}
      <Modal
        visible={showStartModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowStartModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { 
                backgroundColor: colors.card,
                ...Shadows.xl,
              },
            ]}
          >
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                Start New Recording
              </Text>
              <Button
                variant="ghost"
                onPress={() => setShowStartModal(false)}
                style={{ backgroundColor: colors.muted }}
              >
                <Ionicons name="close" size={20} color={colors.foreground} />
              </Button>
            </View>

            <ScrollView 
              style={styles.modalBody}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.modalInputGroup}>
                <Text
                  style={[styles.modalLabel, { color: colors.foregroundMuted }]}
                >
                  Lecturer Name
                </Text>
                <Input
                  placeholder="Enter lecturer name"
                  value={lecturerName}
                  onChangeText={setLecturerName}
                  style={[
                    styles.modalInput,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      color: colors.foreground,
                    },
                  ]}
                  placeholderTextColor={colors.foregroundMuted}
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text
                  style={[styles.modalLabel, { color: colors.foregroundMuted }]}
                >
                  Course Code
                </Text>
                <Input
                  placeholder="e.g., CS101"
                  value={courseCode}
                  onChangeText={setCourseCode}
                  style={[
                    styles.modalInput,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      color: colors.foreground,
                    },
                  ]}
                  placeholderTextColor={colors.foregroundMuted}
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text
                  style={[styles.modalLabel, { color: colors.foregroundMuted }]}
                >
                  Course Name
                </Text>
                <Input
                  placeholder="Enter course name"
                  value={courseName}
                  onChangeText={setCourseName}
                  style={[
                    styles.modalInput,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      color: colors.foreground,
                    },
                  ]}
                  placeholderTextColor={colors.foregroundMuted}
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text
                  style={[styles.modalLabel, { color: colors.foregroundMuted }]}
                >
                  Notes (Optional)
                </Text>
                <Input
                  placeholder="Add any additional notes"
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={3}
                  style={[
                    styles.modalInput,
                    styles.modalTextArea,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      color: colors.foreground,
                    },
                  ]}
                  placeholderTextColor={colors.foregroundMuted}
                />
              </View>
            </ScrollView>

            <View style={[styles.modalActions, { borderTopColor: colors.border }]}>
              <Button
                variant="secondary"
                onPress={() => setShowStartModal(false)}
                style={{
                  backgroundColor: colors.muted,
                  borderColor: colors.border,
                }}
              >
                <Text
                  variant="default"
                  style={{ color: colors.foreground }}
                >
                  Cancel
                </Text>
              </Button>
              <Button
                variant="default"
                onPress={handleStartRecording}
                style={{
                  backgroundColor: colors.primary,
                  ...Shadows.sm,
                }}
              >
                <Ionicons name="play" size={18} color="white" />
                <Text style={styles.modalStartButtonText}>
                  Start Recording
                </Text>
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* Active Recording Dialog */}
      <Dialog
        visible={showActiveRecordingDialog}
        onClose={() => setShowActiveRecordingDialog(false)}
        title="Active Recording Found"
        message={`You have an active recording for ${activeRecordingData?.record.courseCode || "this class"}. What would you like to do?`}
        variant="warning"
        icon="radio"
        primaryAction={{
          label: "Continue Recording",
          onPress: handleContinueRecording,
        }}
        secondaryAction={{
          label: "End & Start New",
          onPress: handleEndAndStartNew,
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: Spacing[3],
    fontSize: Typography.fontSize.sm,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing[6],
  },
  
  // Active Recording Banner
  activeRecording: {
    marginHorizontal: Spacing[4],
    marginTop: Spacing[4],
    marginBottom: Spacing[4],
    borderWidth: 1.5,
    borderRadius: BorderRadius.lg,
    padding: Spacing[4],
  },
  activeRecordingContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[3],
  },
  pulseIndicator: {
    width: 12,
    height: 12,
    borderRadius: BorderRadius.full,
  },
  activeRecordingInfo: {
    flex: 1,
  },
  activeRecordingTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing[1],
  },
  activeRecordingSubtitle: {
    fontSize: Typography.fontSize.sm,
  },
  
  // Stats Grid
  statsGrid: {
    flexDirection: "row",
    gap: Spacing[3],
    paddingHorizontal: Spacing[4],
    marginBottom: Spacing[4],
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing[3],
  },
  statNumber: {
    fontSize: Typography.fontSize["2xl"],
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing[1],
  },
  statLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    textAlign: "center",
  },
  
  // Action Card
  actionCardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[4],
    marginBottom: Spacing[4],
  },
  actionCardIcon: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius["2xl"],
    alignItems: "center",
    justifyContent: "center",
  },
  actionCardText: {
    flex: 1,
  },
  actionCardTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing[1],
  },
  actionCardSubtitle: {
    fontSize: Typography.fontSize.sm,
  },

  // Recent Sessions
  recentSection: {
    paddingHorizontal: Spacing[4],
    marginBottom: Spacing[4],
  },
  sectionHeader: {
    marginBottom: Spacing[3],
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing[1],
  },
  sectionSubtitle: {
    fontSize: Typography.fontSize.sm,
  },
  recordCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  recordIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing[3],
  },
  recordInfo: {
    flex: 1,
  },
  recordTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing[1],
  },
  recordSubtitle: {
    fontSize: Typography.fontSize.sm,
  },
  statusBadge: {
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
    borderRadius: BorderRadius.full,
  },
  statusBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius["3xl"],
    borderTopRightRadius: BorderRadius["3xl"],
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing[4],
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
  },
  modalBody: {
    padding: Spacing[4],
  },
  modalInputGroup: {
    marginBottom: Spacing[4],
  },
  modalLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: Spacing[2],
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing[3],
    fontSize: Typography.fontSize.base,
  },
  modalTextArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  modalActions: {
    flexDirection: "row",
    gap: Spacing[3],
    padding: Spacing[4],
    borderTopWidth: 1,
  },
  modalStartButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: "white",
  },
});