import { useEffect, useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Pressable,
  Platform,
  Alert,
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
import { Badge } from "@/components/ui/badge";
import { Text, H2 } from "@/components/ui/typography";
import { Separator } from "@/components/ui/separator";
import { useThemeColors } from "@/constants/design-system";
import {
  classAttendanceApi,
  type ClassAttendanceRecord,
  type AttendanceSession,
} from "@/api/classAttendance";
import { useAuthStore } from "@/store/auth";
import { authApi } from "@/api/auth";

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
    // Fallback for when AsyncStorage is not available
    return `fallback-${Date.now()}`;
  }

  const existing = await asyncStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;

  let candidate: string;

  if (Platform.OS === "web") {
    // For web, use a combination of browser info and timestamp
    candidate = `web-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  } else {
    // For native platforms
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
      // Get device name using expo-device
      const modelName =
        Device.modelName || Device.deviceName || "Unknown Device";

      // Create a readable device name
      let readableName = modelName;

      // Add OS info
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

  const [activeTab, setActiveTab] = useState<"record" | "active" | "history">(
    "record"
  );
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [deviceName, setDeviceName] = useState("");
  const [session, setSession] = useState<AttendanceSession | null>(null);
  const [records, setRecords] = useState<ClassAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [courseName, setCourseName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [lecturerName, setLecturerName] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    (async () => {
      const id = await getOrCreateDeviceId();
      let storedName = (await getStoredDeviceName()) || "";

      // If no device name is stored, get the device name and save it
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleLogout = async () => {
    try {
      await authApi.logout();
      const { logout } = useAuthStore.getState();
      await logout();
      Toast.show({
        type: "success",
        text1: "Logged Out",
        text2: "You have been successfully logged out",
      });
      router.replace("/login");
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Logout Failed",
        text2: error.error || "An error occurred",
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
      Toast.show({ type: "success", text1: "Recording started" });
      router.push({
        pathname: "/attendance/record" as any,
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

  const handleDeleteRecord = async (recordId: string) => {
    Alert.alert(
      "Delete Recording",
      "Are you sure you want to delete this recording? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await classAttendanceApi.deleteRecord(recordId);
              Toast.show({
                type: "success",
                text1: "Recording deleted",
                text2: "The recording has been successfully deleted",
              });
              // Refresh the records
              loadSessionAndRecords();
            } catch (error: any) {
              Toast.show({
                type: "error",
                text1: "Delete failed",
                text2: error?.error || "Failed to delete recording",
              });
            }
          },
        },
      ]
    );
  };

  const activeRecords = useMemo(
    () => records.filter((r) => r.status === "IN_PROGRESS"),
    [records]
  );

  const completedRecords = useMemo(
    () => records.filter((r) => r.status !== "IN_PROGRESS"),
    [records]
  );

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

  const renderTabButton = (
    tab: "record" | "active" | "history",
    label: string,
    icon: keyof typeof Ionicons.glyphMap
  ) => (
    <Pressable
      onPress={() => setActiveTab(tab)}
      style={[
        styles.tabButton,
        activeTab === tab && {
          borderBottomWidth: 2,
          borderBottomColor: colors.primary,
        },
      ]}
    >
      <Ionicons
        name={icon}
        size={20}
        color={activeTab === tab ? colors.primary : colors.foregroundMuted}
      />
      <Text
        style={[
          styles.tabLabel,
          {
            color: activeTab === tab ? colors.primary : colors.foregroundMuted,
            fontWeight: activeTab === tab ? "600" : "400",
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <View style={styles.headerContent}>
          <H2 style={{ color: colors.foreground }}>Attendance</H2>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              onPress={() => router.push("/attendance/student-attendance")}
              style={styles.studentButton}
            >
              <Ionicons name="finger-print" size={20} color={colors.primary} />
              <Text style={[styles.studentButtonText, { color: colors.primary }]}>
                Student
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <Ionicons name="log-out-outline" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.headerMeta}>
          <Badge variant={session?.isActive ? "default" : "secondary"}>
            {session?.isActive ? "Active" : "Inactive"}
          </Badge>
          <Text style={[styles.deviceText, { color: colors.foregroundMuted }]}>
            {deviceName || `Device ${deviceId?.slice(0, 6)}`}
          </Text>
        </View>
      </View>

      {/* Tab Bar */}
      <View
        style={[
          styles.tabBar,
          { backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        {renderTabButton("record", "Record", "create-outline")}
        {renderTabButton("active", "Active", "timer-outline")}
        {renderTabButton("history", "History", "file-tray-full-outline")}
      </View>

      {/* Tab Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === "record" && (
          <View style={styles.tabContent}>
            {/* Device Setup Card */}
            <Card elevation="sm" style={styles.card}>
              <CardContent>
                <Text
                  style={[styles.sectionLabel, { color: colors.foreground }]}
                >
                  Device Setup
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

            {/* Quick Start Card */}
            <Card elevation="sm" style={styles.card}>
              <CardContent>
                <Text
                  style={[styles.sectionLabel, { color: colors.foreground }]}
                >
                  Start Recording
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
                <Button onPress={handleStartRecording} style={styles.startBtn}>
                  <Ionicons
                    name="scan"
                    size={18}
                    color="#fff"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.startBtnText}>Start Scanning</Text>
                </Button>
              </CardContent>
            </Card>
          </View>
        )}

        {activeTab === "active" && (
          <View style={styles.tabContent}>
            {activeRecords.length === 0 ? (
              <Card elevation="sm" style={styles.card}>
                <CardContent>
                  <View style={styles.emptyState}>
                    <Ionicons
                      name="timer-outline"
                      size={48}
                      color={colors.foregroundMuted}
                    />
                    <Text
                      style={[
                        styles.emptyText,
                        { color: colors.foregroundMuted },
                      ]}
                    >
                      No active recordings
                    </Text>
                    <Text
                      style={[
                        styles.emptySubtext,
                        { color: colors.foregroundMuted },
                      ]}
                    >
                      Start a new recording to begin
                    </Text>
                  </View>
                </CardContent>
              </Card>
            ) : (
              activeRecords.map((record) => (
                <Card key={record.id} elevation="sm" style={styles.card}>
                  <CardContent>
                    <View style={styles.recordHeader}>
                      <View style={styles.recordInfo}>
                        <Text
                          style={[
                            styles.recordCourse,
                            { color: colors.foreground },
                          ]}
                        >
                          {record.courseCode || "Unspecified"}
                        </Text>
                        <Text
                          style={[
                            styles.recordMeta,
                            { color: colors.foregroundMuted },
                          ]}
                        >
                          {record.lecturerName || "No lecturer"}
                        </Text>
                        <View style={styles.recordStats}>
                          <Ionicons
                            name="people"
                            size={14}
                            color={colors.foregroundMuted}
                          />
                          <Text
                            style={[
                              styles.recordStatText,
                              { color: colors.foregroundMuted },
                            ]}
                          >
                            {record.totalStudents} students
                          </Text>
                        </View>
                      </View>
                      <Badge>Active</Badge>
                    </View>
                    <Separator style={styles.recordSeparator} />
                    <View style={styles.recordActions}>
                      <Button
                        variant="outline"
                        size="sm"
                        onPress={() =>
                          router.push({
                            pathname: "/attendance/record" as any,
                            params: {
                              recordId: record.id,
                              sessionId: record.sessionId,
                            },
                          })
                        }
                        style={styles.resumeButton}
                      >
                        <Ionicons
                          name="play"
                          size={14}
                          color={colors.primary}
                          style={{ marginRight: 4 }}
                        />
                        <Text>Resume</Text>
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onPress={() => handleDeleteRecord(record.id)}
                        style={styles.deleteButton}
                      >
                        <Ionicons
                          name="trash"
                          size={14}
                          color={colors.background}
                          style={{ marginRight: 4 }}
                        />
                        <Text style={{ color: colors.background }}>Delete</Text>
                      </Button>
                    </View>
                  </CardContent>
                </Card>
              ))
            )}
          </View>
        )}

        {activeTab === "history" && (
          <View style={styles.tabContent}>
            {completedRecords.length === 0 ? (
              <Card elevation="sm" style={styles.card}>
                <CardContent>
                  <View style={styles.emptyState}>
                    <Ionicons
                      name="file-tray-full-outline"
                      size={48}
                      color={colors.foregroundMuted}
                    />
                    <Text
                      style={[
                        styles.emptyText,
                        { color: colors.foregroundMuted },
                      ]}
                    >
                      No history yet
                    </Text>
                    <Text
                      style={[
                        styles.emptySubtext,
                        { color: colors.foregroundMuted },
                      ]}
                    >
                      Completed recordings will appear here
                    </Text>
                  </View>
                </CardContent>
              </Card>
            ) : (
              completedRecords.map((record) => (
                <TouchableOpacity
                  key={record.id}
                  activeOpacity={0.7}
                  onPress={() =>
                    router.push(
                      `/attendance/details?recordId=${record.id}` as any
                    )
                  }
                >
                  <Card elevation="sm" style={styles.card}>
                    <CardContent>
                      <View style={styles.recordHeader}>
                        <View style={styles.recordInfo}>
                          <Text
                            style={[
                              styles.recordCourse,
                              { color: colors.foreground },
                            ]}
                          >
                            {record.courseCode || "Unspecified"}
                          </Text>
                          <Text
                            style={[
                              styles.recordMeta,
                              { color: colors.foregroundMuted },
                            ]}
                          >
                            {record.courseName || "No title"}
                          </Text>
                          <View style={styles.recordStats}>
                            <Ionicons
                              name="people"
                              size={14}
                              color={colors.foregroundMuted}
                            />
                            <Text
                              style={[
                                styles.recordStatText,
                                { color: colors.foregroundMuted },
                              ]}
                            >
                              {record.totalStudents} students
                            </Text>
                            <Ionicons
                              name="time-outline"
                              size={14}
                              color={colors.foregroundMuted}
                              style={{ marginLeft: 12 }}
                            />
                            <Text
                              style={[
                                styles.recordStatText,
                                { color: colors.foregroundMuted },
                              ]}
                            >
                              {new Date(record.startTime).toLocaleDateString()}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.recordHeaderRight}>
                          <Badge variant="secondary">{record.status}</Badge>
                          <Ionicons
                            name="chevron-forward"
                            size={20}
                            color={colors.foregroundMuted}
                            style={{ marginLeft: 8 }}
                          />
                        </View>
                      </View>
                    </CardContent>
                  </Card>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
      </ScrollView>
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
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  studentButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "transparent",
  },
  studentButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  logoutButton: {
    padding: 8,
  },
  headerMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  deviceText: {
    fontSize: 12,
  },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 6,
  },
  tabLabel: {
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  card: {
    marginBottom: 12,
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
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    marginTop: 4,
  },
  recordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  recordInfo: {
    flex: 1,
    marginRight: 12,
  },
  recordHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  recordCourse: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  recordMeta: {
    fontSize: 13,
    marginBottom: 8,
  },
  recordStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  recordStatText: {
    fontSize: 12,
  },
  recordSeparator: {
    marginVertical: 12,
  },
  recordActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  resumeButton: {
    flex: 1,
    backgroundColor: "#007AFF",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: "center",
  },
  deleteButton: {
    flex: 1,
    backgroundColor: "#FF3B30",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: "center",
  },
});
