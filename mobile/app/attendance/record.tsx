import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { CameraView, Camera } from "expo-camera";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import {
  classAttendanceApi,
  type ClassAttendanceRecord,
} from "@/api/classAttendance";
import { useThemeColors } from "@/constants/design-system";
import { Button } from "@/components/ui/button";

export default function AttendanceRecordScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { recordId } = useLocalSearchParams<{ recordId?: string }>();

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [record, setRecord] = useState<ClassAttendanceRecord | null>(null);
  const [scanned, setScanned] = useState(false);
  const [lastStudent, setLastStudent] = useState<string>("");
  const [studentCount, setStudentCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const cameraRef = useRef<CameraView | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  useEffect(() => {
    if (!recordId) return;
    loadRecord();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordId]);

  const loadRecord = async () => {
    if (!recordId) return;
    try {
      setLoading(true);
      const resp = await classAttendanceApi.getRecord(recordId);
      setRecord(resp.record);
      setStudentCount(resp.record.totalStudents || 0);
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Record",
        text2: error?.error || "Failed to load record",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || !recordId) return;
    setScanned(true);
    const studentId = data?.trim();
    if (!studentId) {
      Toast.show({ type: "error", text1: "Scan", text2: "Invalid QR data" });
      setScanned(false);
      return;
    }

    try {
      await classAttendanceApi.recordStudentAttendance({
        recordId,
        studentId,
      });
      setLastStudent(studentId);
      setStudentCount((prev) => prev + 1);
      Toast.show({ type: "success", text1: "Recorded", text2: studentId });
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Attendance",
        text2: error?.error || "Failed to record attendance",
      });
    } finally {
      setTimeout(() => setScanned(false), 600);
    }
  };

  const handleEndRecording = async () => {
    if (!recordId) return;
    Alert.alert(
      "End Recording",
      "Are you sure you want to end this recording?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "End",
          style: "destructive",
          onPress: async () => {
            try {
              await classAttendanceApi.endRecord(recordId);
              Toast.show({ type: "success", text1: "Recording ended" });
              router.replace("/attendance" as any);
            } catch (error: any) {
              Toast.show({
                type: "error",
                text1: "End recording",
                text2: error?.error || "Failed to end recording",
              });
            }
          },
        },
      ]
    );
  };

  if (hasPermission === null || loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View
        style={[
          styles.center,
          { backgroundColor: colors.background, padding: 16 },
        ]}
      >
        <Text style={{ color: colors.foreground, textAlign: "center" }}>
          Camera permission is required to scan attendance QR codes.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      \
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Class Attendance
          </Text>
          <Text style={[styles.subtitle, { color: colors.foregroundMuted }]}>
            Record ID: {record?.id.slice(0, 8)}...
          </Text>
        </View>
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Ionicons name="people" size={18} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.foreground }]}>
              {studentCount}
            </Text>
            <Text style={[styles.statLabel, { color: colors.foregroundMuted }]}>
              Students
            </Text>
          </View>
          {lastStudent ? (
            <View style={styles.statItem}>
              <Ionicons
                name="checkmark-circle"
                size={18}
                color={colors.success}
              />
              <Text
                style={[styles.statLabel, { color: colors.foregroundMuted }]}
              >
                Last
              </Text>
              <Text
                style={[styles.statValue, { color: colors.foreground }]}
                numberOfLines={1}
              >
                {lastStudent}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
      <View style={styles.cameraContainer}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          ref={cameraRef}
        />
        <View style={styles.overlay}>
          <Text style={[styles.scanHint, { color: "#fff" }]}>
            Align QR within frame
          </Text>
        </View>
      </View>
      <View style={styles.actions}>
        <Button variant="destructive" onPress={handleEndRecording}>
          End Recording
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 13,
  },
  stats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
  },
  cameraContainer: {
    flex: 1,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  overlay: {
    position: "absolute",
    bottom: 16,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  scanHint: {
    fontSize: 14,
    fontWeight: "600",
  },
  actions: {
    padding: 16,
  },
});
