import { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { CameraView, Camera } from "expo-camera";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import {
  classAttendanceApi,
  type ClassAttendanceRecord,
} from "@/api/classAttendance";
import { useThemeColors } from "@/constants/design-system";
import { useSocket } from "@/hooks/useSocket";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { StudentLookupModal } from "@/components/StudentLookupModal";
import { LocalStudent } from "@/utils/localStudentStorage";

export default function AttendanceRecordScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { recordId } = useLocalSearchParams<{ recordId?: string }>();
  const socket = useSocket();

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [record, setRecord] = useState<ClassAttendanceRecord | null>(null);
  const [scanned, setScanned] = useState(false);
  const [lastStudent, setLastStudent] = useState<string>("");
  const [studentCount, setStudentCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [showStudentLookup, setShowStudentLookup] = useState(false);

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

  // Listen for real-time socket events
  useEffect(() => {
    if (!recordId) return;

    const unsubscribe = socket.on(
      "class_attendance:student_scanned",
      (data: any) => {
        // Only update if this is the active recording
        if (data.recordId === recordId) {
          setLastStudent(data.studentName);
          setStudentCount(data.totalStudents);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [recordId, socket]);

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

    const qrData = data?.trim();
    if (!qrData) {
      Toast.show({ type: "error", text1: "Scan", text2: "Invalid QR data" });
      setScanned(false);
      return;
    }

    // Try to parse QR code and extract student info
    let studentId = qrData;
    let studentName = qrData;

    try {
      const parsed = JSON.parse(qrData);
      studentId = parsed.indexNumber || parsed.id || qrData;
      studentName = parsed.name || parsed.indexNumber || studentId;
    } catch {
      // Not JSON, use raw data
    }

    try {
      await classAttendanceApi.recordStudentAttendance({
        recordId,
        studentId: qrData, // Send the full QR data to backend
      });
      setLastStudent(studentName);
      setStudentCount((prev) => prev + 1);
      Toast.show({
        type: "success",
        text1: "✓ Recorded",
        text2: studentName,
      });
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

  const handleEndRecording = () => {
    if (!recordId) return;
    setShowEndDialog(true);
  };

  const confirmEndRecording = async () => {
    if (!recordId) return;
    setShowEndDialog(false);

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
  };

  const handleManualStudentEntry = async (student: LocalStudent) => {
    if (!recordId) return;

    try {
      setScanned(true); // Show processing state

      // Record the student attendance using their index number
      await classAttendanceApi.recordStudentAttendance({
        recordId,
        studentId: student.indexNumber,
      });

      // Update local state
      setLastStudent(student.name);
      setStudentCount((prev) => prev + 1);

      Toast.show({
        type: "success",
        text1: "Student Recorded",
        text2: `${student.name} (${student.indexNumber})`,
      });
    } catch (error: any) {
      console.error("Manual entry error:", error);
      Toast.show({
        type: "error",
        text1: "Recording Failed",
        text2: error.error || "Failed to record student",
      });
    } finally {
      setTimeout(() => setScanned(false), 600);
    }
  };

  if (hasPermission === null || loading) {
    return (
      <SafeAreaView
        style={[styles.center, { backgroundColor: colors.background }]}
        edges={["top"]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView
        style={[styles.center, { backgroundColor: colors.background }]}
        edges={["top"]}
      >
        <Card elevation="sm" style={{ margin: 16 }}>
          <CardContent>
            <View style={styles.permissionContent}>
              <Ionicons
                name="camera-outline"
                size={48}
                color={colors.foregroundMuted}
              />
              <Text
                style={[styles.permissionText, { color: colors.foreground }]}
              >
                Camera permission required
              </Text>
              <Text
                style={[
                  styles.permissionSubtext,
                  { color: colors.foregroundMuted },
                ]}
              >
                Please enable camera access to scan attendance QR codes
              </Text>
            </View>
          </CardContent>
        </Card>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      {/* Info Bar */}
      <View
        style={[
          styles.infoBar,
          { backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        <View style={styles.infoItem}>
          <Ionicons name="people" size={20} color={colors.primary} />
          <Text style={[styles.infoValue, { color: colors.foreground }]}>
            {studentCount}
          </Text>
          <Text style={[styles.infoLabel, { color: colors.foregroundMuted }]}>
            scanned
          </Text>
        </View>
        {record?.courseCode && (
          <View style={styles.infoDivider}>
            <Badge variant="secondary">{record.courseCode}</Badge>
          </View>
        )}
        {lastStudent && (
          <View style={styles.infoItem}>
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={colors.success}
            />
            <Text
              style={[styles.infoLabel, { color: colors.foregroundMuted }]}
              numberOfLines={1}
            >
              Last: {lastStudent}
            </Text>
          </View>
        )}
      </View>

      {/* Camera */}
      <View style={styles.cameraContainer}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          ref={cameraRef}
        />
        <View style={styles.scanFrame}>
          <View
            style={[
              styles.corner,
              styles.cornerTL,
              { borderColor: colors.primary },
            ]}
          />
          <View
            style={[
              styles.corner,
              styles.cornerTR,
              { borderColor: colors.primary },
            ]}
          />
          <View
            style={[
              styles.corner,
              styles.cornerBL,
              { borderColor: colors.primary },
            ]}
          />
          <View
            style={[
              styles.corner,
              styles.cornerBR,
              { borderColor: colors.primary },
            ]}
          />
        </View>
        <View style={styles.scanHintContainer}>
          <Text style={styles.scanHint}>Position QR code within frame</Text>
          {scanned && (
            <View style={styles.scanningIndicator}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.scanningText}>Processing...</Text>
            </View>
          )}
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <View style={styles.actionButtons}>
          <Button
            variant="outline"
            onPress={() => setShowStudentLookup(true)}
            style={styles.manualButton}
            disabled={scanned}
          >
            <Ionicons
              name="person-add"
              size={18}
              color={colors.primary}
              style={{ marginRight: 8 }}
            />
            <Text style={{ color: colors.primary }}>Manual Entry</Text>
          </Button>
          <Button
            variant="destructive"
            onPress={handleEndRecording}
            style={styles.endButton}
          >
            <Ionicons
              name="stop-circle"
              size={18}
              color="#fff"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.endButtonText}>End Recording</Text>
          </Button>
        </View>
      </View>

      {/* End Recording Dialog */}
      <Dialog
        visible={showEndDialog}
        onClose={() => setShowEndDialog(false)}
        title="End Recording"
        message="Are you sure you want to end this attendance recording? This action cannot be undone."
        variant="warning"
        icon="warning"
        primaryAction={{
          label: "End Recording",
          onPress: confirmEndRecording,
        }}
        secondaryAction={{
          label: "Cancel",
          onPress: () => setShowEndDialog(false),
        }}
      />

      {/* Student Lookup Modal */}
      <StudentLookupModal
        visible={showStudentLookup}
        onClose={() => setShowStudentLookup(false)}
        onStudentSelected={handleManualStudentEntry}
        sessionId={record?.sessionId}
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
    justifyContent: "center",
    alignItems: "center",
  },
  permissionContent: {
    alignItems: "center",
    paddingVertical: 24,
  },
  permissionText: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 16,
    textAlign: "center",
  },
  permissionSubtext: {
    fontSize: 13,
    marginTop: 8,
    textAlign: "center",
  },
  infoBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  infoDivider: {
    marginHorizontal: 8,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  infoLabel: {
    fontSize: 12,
  },
  cameraContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#000",
    position: "relative",
  },
  scanFrame: {
    position: "absolute",
    top: "30%",
    left: "15%",
    right: "15%",
    aspectRatio: 1,
  },
  corner: {
    position: "absolute",
    width: 40,
    height: 40,
    borderWidth: 3,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 8,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 8,
  },
  scanHintContainer: {
    position: "absolute",
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  scanHint: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  scanningIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 20,
  },
  scanningText: {
    fontSize: 13,
    color: "#fff",
    fontWeight: "600",
  },
  actions: {
    padding: 16,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  manualButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  endButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  endButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
