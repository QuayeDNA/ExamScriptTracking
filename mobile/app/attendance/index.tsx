import { useEffect, useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import * as SecureStore from "expo-secure-store";
import * as Application from "expo-application";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Text } from "@/components/ui/typography";
import { Separator } from "@/components/ui/separator";
import { useThemeColors } from "@/constants/design-system";
import {
  classAttendanceApi,
  type ClassAttendanceRecord,
  type AttendanceSession,
} from "@/api/classAttendance";

const DEVICE_ID_KEY = "attendance_device_id";
const DEVICE_NAME_KEY = "attendance_device_name";

async function getOrCreateDeviceId() {
  const existing = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  if (existing) return existing;

  const candidate =
    Application.getAndroidId() ||
    (await Application.getIosIdForVendorAsync()) ||
    `device-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await SecureStore.setItemAsync(DEVICE_ID_KEY, candidate);
  return candidate;
}

async function getStoredDeviceName() {
  return SecureStore.getItemAsync(DEVICE_NAME_KEY);
}

async function saveDeviceName(name: string) {
  await SecureStore.setItemAsync(DEVICE_NAME_KEY, name);
}

export default function AttendanceDashboard() {
  const colors = useThemeColors();
  const router = useRouter();

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
      const storedName = (await getStoredDeviceName()) || "";
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
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Class Attendance</CardTitle>
          <CardDescription>
            Device session is {session?.isActive ? "active" : "inactive"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <View style={styles.rowBetween}>
            <Text style={[styles.muted, { color: colors.foregroundMuted }]}>
              Device ID
            </Text>
            <Text style={{ fontFamily: "monospace", color: colors.foreground }}>
              {deviceId?.slice(0, 6)}...{deviceId?.slice(-4)}
            </Text>
          </View>
          <Separator style={styles.separator} />
          <Input
            label="Device Name"
            placeholder="Lecture Hall A - iPad"
            value={deviceName}
            onChangeText={setDeviceName}
          />
          <Button style={styles.mt12} onPress={handleSaveDeviceName}>
            Save Device Name
          </Button>
        </CardContent>
      </Card>

      <Card style={styles.mt16}>
        <CardHeader>
          <CardTitle>Start New Recording</CardTitle>
          <CardDescription>Enter optional details</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            label="Lecturer Name (optional)"
            placeholder="Dr. Jane Doe"
            value={lecturerName}
            onChangeText={setLecturerName}
          />
          <View style={styles.mt12} />
          <Input
            label="Course Code (optional)"
            placeholder="CS101"
            value={courseCode}
            onChangeText={setCourseCode}
          />
          <View style={styles.mt12} />
          <Input
            label="Course Name (optional)"
            placeholder="Intro to CS"
            value={courseName}
            onChangeText={setCourseName}
          />
          <View style={styles.mt12} />
          <Input
            label="Notes (optional)"
            placeholder="Morning lecture"
            value={notes}
            onChangeText={setNotes}
          />
          <Button style={styles.mt16} onPress={handleStartRecording}>
            Start Recording
          </Button>
        </CardContent>
      </Card>

      <Card style={styles.mt16}>
        <CardHeader>
          <CardTitle>Ongoing Recordings</CardTitle>
          <CardDescription>
            {activeRecords.length === 0
              ? "No active recordings"
              : `${activeRecords.length} active`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeRecords.length === 0 ? (
            <Text style={{ color: colors.foregroundMuted }}>
              Start a new recording to begin scanning attendance.
            </Text>
          ) : (
            activeRecords.map((record) => (
              <View key={record.id} style={styles.recordRow}>
                <View>
                  <Text style={{ color: colors.foreground }}>
                    {record.courseCode || "Unspecified Course"}
                  </Text>
                  <Text
                    style={[styles.muted, { color: colors.foregroundMuted }]}
                  >
                    {record.lecturerName || "No lecturer"}
                  </Text>
                </View>
                <View style={styles.rowGap}>
                  <Badge>Active</Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onPress={() =>
                      router.push({
                        pathname: "/attendance/record" as any,
                        params: {
                          recordId: record.id,
                          sessionId: record.sessionId,
                        },
                      })
                    }
                  >
                    Resume
                  </Button>
                </View>
              </View>
            ))
          )}
        </CardContent>
      </Card>

      <Card style={styles.mt16}>
        <CardHeader>
          <CardTitle>History</CardTitle>
          <CardDescription>Recent recordings for this device</CardDescription>
        </CardHeader>
        <CardContent>
          {completedRecords.length === 0 ? (
            <Text style={{ color: colors.foregroundMuted }}>
              No completed recordings yet.
            </Text>
          ) : (
            completedRecords.map((record) => (
              <View key={record.id} style={styles.historyRow}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.foreground }}>
                    {record.courseCode || "Unspecified Course"}
                  </Text>
                  <Text
                    style={[styles.muted, { color: colors.foregroundMuted }]}
                  >
                    {record.courseName || "No title"}
                  </Text>
                  <Text
                    style={[
                      styles.mutedSmall,
                      { color: colors.foregroundMuted },
                    ]}
                  >
                    Students: {record.totalStudents}
                  </Text>
                </View>
                <Badge variant="secondary">{record.status}</Badge>
              </View>
            ))
          )}
        </CardContent>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  separator: {
    marginVertical: 12,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowGap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  mt12: {
    marginTop: 12,
  },
  mt16: {
    marginTop: 16,
  },
  muted: {
    fontSize: 13,
  },
  mutedSmall: {
    fontSize: 12,
  },
  recordRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
});
