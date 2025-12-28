import { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Application from "expo-application";
import * as Device from "expo-device";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/typography";
import { useThemeColors } from "@/constants/design-system";
import {
  classAttendanceApi,
  type ClassAttendanceRecord,
  type AttendanceSession,
} from "@/api/classAttendance";
import { useAuthStore } from "@/store/auth";

const DEVICE_ID_KEY = "attendance_device_id";
const DEVICE_NAME_KEY = "attendance_device_name";

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

async function getStoredDeviceName() {
  if (!asyncStorage) return null;
  return asyncStorage.getItem(DEVICE_NAME_KEY);
}

async function saveDeviceName(name: string) {
  if (!asyncStorage) return;
  await asyncStorage.setItem(DEVICE_NAME_KEY, name);
}

async function getDeviceName() {
  try {
    if (Platform.OS === "web") {
      return `Web Browser`;
    } else {
      const modelName =
        Device.modelName || Device.deviceName || "Unknown Device";
      let readableName = modelName;
      if (Platform.OS === "ios") {
        readableName += " (iOS)";
      } else if (Platform.OS === "android") {
        readableName += " (Android)";
      }
      return readableName;
    }
  } catch (error) {
    console.warn("Failed to get device name:", error);
    return Platform.OS === "web" ? "Web Browser" : "Mobile Device";
  }
}

export default function AttendanceDashboard() {
  const colors = useThemeColors();
  const router = useRouter();
  const { user } = useAuthStore();

  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [deviceName, setDeviceName] = useState("");
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

  useEffect(() => {
    (async () => {
      const id = await getOrCreateDeviceId();
      let storedName = (await getStoredDeviceName()) || "";
      if (!storedName) {
        storedName = await getDeviceName();
        if (storedName) {
          await saveDeviceName(storedName);
        }
      }
      setDeviceId(id);
      setDeviceName(storedName);
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
        deviceName: deviceName || undefined,
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

  const handleSaveDeviceName = async () => {
    if (!deviceName.trim() || !deviceId) return;
    try {
      await saveDeviceName(deviceName.trim());
      await classAttendanceApi.createOrGetSession({
        deviceId,
        deviceName: deviceName.trim(),
      });
      Toast.show({ type: "success", text1: "Device saved" });
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Device name",
        text2: error?.error || "Could not save device name",
      });
    }
  };

  const handleStartNewRecording = () => {
    const activeRecord = records.find(r => r.status === 'IN_PROGRESS');
    if (activeRecord) {
      Alert.alert(
        "Active Recording Found",
        `You have an active recording for ${activeRecord.courseCode || 'this class'}. What would you like to do?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Continue Recording",
            onPress: () => {
              router.push({
                pathname: "/attendance/record",
                params: { recordId: activeRecord.id, sessionId: session?.id },
              });
            },
          },
          {
            text: "End & Start New",
            style: "destructive",
            onPress: () => handleEndAndStartNew(activeRecord.id),
          },
        ]
      );
    } else {
      setShowStartModal(true);
    }
  };

  const handleEndAndStartNew = async (activeRecordId: string) => {
    try {
      await classAttendanceApi.endRecord(activeRecordId);
      Toast.show({ type: "info", text1: "Previous recording ended" });
      setShowStartModal(true);
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error?.error || "Failed to end previous recording",
      });
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
      </SafeAreaView>
    );
  }

  const activeRecord = records.find(r => r.status === 'IN_PROGRESS');

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      {/* Active Recording Display */}
      {activeRecord && (
        <View style={[styles.activeRecording, { backgroundColor: colors.success + '15', borderColor: colors.success }]}>
          <View style={styles.activeRecordingContent}>
            <Ionicons name="radio" size={20} color={colors.success} />
            <View style={styles.activeRecordingInfo}>
              <Text style={[styles.activeRecordingTitle, { color: colors.success }]}>
                Recording Active
              </Text>
              <Text style={[styles.activeRecordingSubtitle, { color: colors.foregroundMuted }]}>
                {activeRecord.courseCode || 'Class'} • {activeRecord.totalStudents || 0} students recorded
              </Text>
            </View>
            <Button
              size="sm"
              variant="outline"
              onPress={() => router.push({
                pathname: "/attendance/record",
                params: { recordId: activeRecord.id, sessionId: session?.id },
              })}
              style={styles.continueButton}
            >
              <Text style={{ color: colors.success }}>Continue</Text>
            </Button>
          </View>
        </View>
      )}

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <Card elevation="sm" style={styles.statsCard}>
            <CardContent style={styles.statsCardContent}>
              <Ionicons name="file-tray-full" size={24} color={colors.primary} />
              <View>
                <Text style={[styles.statsNumber, { color: colors.foreground }]}>
                  {records.length}
                </Text>
                <Text style={[styles.statsLabel, { color: colors.foregroundMuted }]}>
                  Recorded Sessions
                </Text>
              </View>
            </CardContent>
          </Card>
          <Card elevation="sm" style={styles.statsCard}>
            <CardContent style={styles.statsCardContent}>
              <Ionicons name="radio" size={24} color={colors.success} />
              <View>
                <Text style={[styles.statsNumber, { color: colors.foreground }]}>
                  {records.filter(r => r.status === 'IN_PROGRESS').length}
                </Text>
                <Text style={[styles.statsLabel, { color: colors.foregroundMuted }]}>
                  Active Now
                </Text>
              </View>
            </CardContent>
          </Card>
        </View>

        {/* Device Setup Card */}
        <Card elevation="sm" style={styles.card}>
          <CardContent>
            <Text
              style={[styles.sectionLabel, { color: colors.foreground }]}
            >
              Device Info
            </Text>
            <Input
              placeholder="e.g., Lecture Hall A - iPad"
              value={deviceName}
              onChangeText={setDeviceName}
              style={styles.input}
            />
            <Button
              size="sm"
              variant="outline"
              onPress={handleSaveDeviceName}
              disabled={!deviceName.trim()}
            >
              Save Device Name
            </Button>
          </CardContent>
        </Card>

        {/* Start New Recording Button */}
        <Card elevation="sm" style={styles.card}>
          <CardContent>
            <Button onPress={handleStartNewRecording} style={styles.startBtn}>
              <Ionicons
                name="scan"
                size={18}
                color="#fff"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.startBtnText}>Start a New Recording</Text>
            </Button>
          </CardContent>
        </Card>
      </ScrollView>

      {/* Start Recording Modal */}
      <Modal
        visible={showStartModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowStartModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              Start New Recording
            </Text>
            <Input
              placeholder="Lecturer Name"
              value={lecturerName}
              onChangeText={setLecturerName}
              style={styles.input}
            />
            <Input
              placeholder="Course Code"
              value={courseCode}
              onChangeText={setCourseCode}
              style={styles.input}
            />
            <Input
              placeholder="Course Name"
              value={courseName}
              onChangeText={setCourseName}
              style={styles.input}
            />
            <Input
              placeholder="Notes (optional)"
              value={notes}
              onChangeText={setNotes}
              style={styles.input}
            />
            <View style={styles.modalButtons}>
              <Button
                variant="outline"
                onPress={() => setShowStartModal(false)}
                style={styles.cancelBtn}
              >
                Cancel
              </Button>
              <Button onPress={handleStartRecording} style={styles.startBtn}>
                Start Recording
              </Button>
            </View>
          </View>
        </View>
      </Modal>
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
  content: {
    flex: 1,
  },
  card: {
    margin: 16,
    marginBottom: 0,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
  },
  input: {
    marginBottom: 8,
  },
  startBtn: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  startBtnText: {
    color: "#fff",
    fontWeight: "600",
  },
  activeRecording: {
    marginHorizontal: 16,
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  activeRecordingContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  activeRecordingInfo: {
    flex: 1,
  },
  activeRecordingTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  activeRecordingSubtitle: {
    fontSize: 14,
  },
  continueButton: {
    borderColor: "currentColor",
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  statsCard: {
    flex: 1,
  },
  statsCardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
  },
  statsNumber: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    borderRadius: 8,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  cancelBtn: {
    flex: 1,
    marginRight: 8,
  },
});