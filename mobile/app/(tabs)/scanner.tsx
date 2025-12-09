import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, Camera } from "expo-camera";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import * as SecureStore from "expo-secure-store";
import CustomDrawer, { type CustomDrawerRef } from "@/components/CustomDrawer";
import { examSessionsApi, type ExamSession } from "@/api/examSessions";
import { useThemeColors } from "@/constants/design-system";

const CAMERA_PERMISSION_KEY = "camera_permission_granted";

function ScannerScreen() {
  const colors = useThemeColors();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [scanMode, setScanMode] = useState<"ENTRY" | "EXIT">("ENTRY");
  const [activeExamSession, setActiveExamSession] =
    useState<ExamSession | null>(null);
  const drawerRef = useRef<CustomDrawerRef>(null);
  const router = useRouter();
  const scanAreaHeight = useRef(new Animated.Value(0)).current;

  // Check for existing camera permission on mount
  useEffect(() => {
    checkCameraPermission();
  }, []);

  const checkCameraPermission = async () => {
    try {
      // Check if we've already granted permission
      const granted = await SecureStore.getItemAsync(CAMERA_PERMISSION_KEY);

      if (granted === "true") {
        const { status } = await Camera.getCameraPermissionsAsync();
        if (status === "granted") {
          setHasPermission(true);
          return;
        }
      }

      // Request permission if not granted
      const { status } = await Camera.requestCameraPermissionsAsync();
      if (status === "granted") {
        await SecureStore.setItemAsync(CAMERA_PERMISSION_KEY, "true");
        setHasPermission(true);
      } else {
        setHasPermission(false);
      }
    } catch {
      setHasPermission(false);
    }
  };

  const loadExamSession = async (batchId: string) => {
    try {
      const session = await examSessionsApi.getExamSession(batchId);
      setActiveExamSession(session);
      drawerRef.current?.snapToIndex(0);

      // Animate scan area to adjust for drawer
      Animated.spring(scanAreaHeight, {
        toValue: 100,
        useNativeDriver: false,
        damping: 20,
        stiffness: 90,
      }).start();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Load Error",
        text2: error.error || "Failed to load exam session",
      });
    }
  };

  const handleStudentScan = async (qrData: any) => {
    if (!activeExamSession) {
      Toast.show({
        type: "warning",
        text1: "No Active Session",
        text2: "Please scan the Batch QR Code first",
      });
      return;
    }

    try {
      const studentIndexNumber = qrData.indexNumber;

      const students = await examSessionsApi.getExpectedStudents(
        activeExamSession.id
      );
      const expectedStudent = students.expectedStudents.find(
        (s: any) => s.indexNumber === studentIndexNumber
      );

      if (!expectedStudent) {
        Toast.show({
          type: "error",
          text1: "Student Not Expected",
          text2: `${studentIndexNumber} is not in the expected list`,
        });
        return;
      }

      const studentName = `${expectedStudent.firstName || ""} ${expectedStudent.lastName || ""}`;

      if (scanMode === "ENTRY") {
        if (expectedStudent.attendance) {
          Toast.show({
            type: "info",
            text1: "Already Entered",
            text2: `${studentName} entered at ${new Date(expectedStudent.attendance.entryTime).toLocaleTimeString()}`,
          });
          return;
        }

        await recordStudentEntry(qrData.id);

        Toast.show({
          type: "success",
          text1: "✓ Entry Recorded",
          text2: `${studentName} (${studentIndexNumber})`,
        });
      } else {
        if (!expectedStudent.attendance) {
          Toast.show({
            type: "warning",
            text1: "Not Entered Yet",
            text2: `${studentName} has not entered the exam yet`,
          });
          return;
        }

        if (expectedStudent.attendance.exitTime) {
          Toast.show({
            type: "info",
            text1: "Already Exited",
            text2: `${studentName} exited at ${new Date(expectedStudent.attendance.exitTime).toLocaleTimeString()}`,
          });
          return;
        }

        await recordStudentExit(expectedStudent.attendance.id);

        Toast.show({
          type: "success",
          text1: "✓ Exit Recorded",
          text2: `${studentName} (${studentIndexNumber})`,
        });
      }

      const updatedSession = await examSessionsApi.getExamSession(
        activeExamSession.id
      );
      setActiveExamSession(updatedSession);
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Processing Error",
        text2: error.error || "Failed to process student scan",
      });
    }
  };

  const recordStudentEntry = async (studentId: string) => {
    if (!activeExamSession) return;

    const { attendanceApi } = await import("@/api/attendance");
    await attendanceApi.recordEntry(studentId, activeExamSession.id);
  };

  const recordStudentExit = async (attendanceId: string) => {
    const { attendanceApi } = await import("@/api/attendance");
    await attendanceApi.recordExit(attendanceId);
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;

    setScanned(true);

    try {
      const qrData = JSON.parse(data);

      if (qrData.type === "EXAM_BATCH") {
        if (activeExamSession && activeExamSession.id !== qrData.id) {
          Toast.show({
            type: "info",
            text1: "Switch Session?",
            text2: `Switch from ${activeExamSession.courseCode} to ${qrData.courseCode}?`,
            visibilityTime: 4000,
            onPress: () => loadExamSession(qrData.id),
          });
        } else if (!activeExamSession) {
          loadExamSession(qrData.id);
        }
        setTimeout(() => setScanned(false), 1000);
      } else if (qrData.type === "STUDENT") {
        await handleStudentScan(qrData);
        setTimeout(() => setScanned(false), 1500);
      } else {
        Toast.show({
          type: "error",
          text1: "Invalid QR Code",
          text2: "This QR code is not recognized",
        });
        setTimeout(() => setScanned(false), 1000);
      }
    } catch {
      Toast.show({
        type: "error",
        text1: "Invalid QR Code",
        text2: "Unable to read QR code data",
      });
      setTimeout(() => setScanned(false), 1000);
    }
  };

  const handleViewDetails = () => {
    if (activeExamSession) {
      router.push({
        pathname: "/batch-details",
        params: { batchId: activeExamSession.id },
      });
    }
  };

  const handleEndSession = async () => {
    if (!activeExamSession) return;

    if (activeExamSession.status !== "IN_PROGRESS") {
      Toast.show({
        type: "warning",
        text1: "Cannot End Session",
        text2: "Only IN PROGRESS sessions can be ended",
      });
      return;
    }

    try {
      await examSessionsApi.endExamSession(activeExamSession.id);
      Toast.show({
        type: "success",
        text1: "Session Ended",
        text2: "Exam session marked as SUBMITTED",
      });
      setActiveExamSession(null);
      drawerRef.current?.close();

      // Reset scan area
      Animated.spring(scanAreaHeight, {
        toValue: 0,
        useNativeDriver: false,
        damping: 20,
        stiffness: 90,
      }).start();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "End Session Failed",
        text2: error.error || "Failed to end exam session",
      });
    }
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={[styles.header, { backgroundColor: colors.card }]}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Scanner
          </Text>
        </View>
        <View style={styles.content}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.text, { color: colors.foreground }]}>
            Checking camera access...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={[styles.header, { backgroundColor: colors.card }]}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Scanner
          </Text>
        </View>
        <View style={styles.content}>
          <Ionicons name="camera-outline" size={64} color={colors.border} />
          <Text style={[styles.text, { color: colors.foreground }]}>
            Camera access denied
          </Text>
          <Text style={[styles.subText, { color: colors.foregroundMuted }]}>
            Please enable camera permissions in settings
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={checkCameraPermission}
          >
            <Text style={styles.buttonText}>Grant Access</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View
        style={[
          styles.header,
          { backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Scanner
        </Text>
        {activeExamSession && (
          <View style={[styles.activeBadge, { backgroundColor: "#10b981" }]}>
            <Ionicons name="radio-button-on" size={12} color="#fff" />
            <Text style={styles.activeBadgeText}>Active</Text>
          </View>
        )}
      </View>

      {/* Mode Toggle */}
      {activeExamSession && (
        <View
          style={[
            styles.modeToggle,
            { backgroundColor: colors.card, borderBottomColor: colors.border },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.modeButton,
              { borderColor: colors.border },
              scanMode === "ENTRY" && {
                backgroundColor: colors.primary,
                borderColor: colors.primary,
              },
            ]}
            onPress={() => setScanMode("ENTRY")}
          >
            <Ionicons
              name="enter"
              size={18}
              color={scanMode === "ENTRY" ? "#fff" : colors.foregroundMuted}
            />
            <Text
              style={[
                styles.modeButtonText,
                { color: colors.foregroundMuted },
                scanMode === "ENTRY" && { color: "#fff" },
              ]}
            >
              ENTRY
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modeButton,
              { borderColor: colors.border },
              scanMode === "EXIT" && {
                backgroundColor: colors.primary,
                borderColor: colors.primary,
              },
            ]}
            onPress={() => setScanMode("EXIT")}
          >
            <Ionicons
              name="exit"
              size={18}
              color={scanMode === "EXIT" ? "#fff" : colors.foregroundMuted}
            />
            <Text
              style={[
                styles.modeButtonText,
                { color: colors.foregroundMuted },
                scanMode === "EXIT" && { color: "#fff" },
              ]}
            >
              EXIT
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <Animated.View
        style={[styles.cameraContainer, { marginBottom: scanAreaHeight }]}
      >
        <CameraView
          style={styles.camera}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
        >
          <View style={styles.overlay}>
            <View style={styles.scanArea}>
              <View
                style={[
                  styles.corner,
                  styles.topLeft,
                  { borderColor: colors.primary },
                ]}
              />
              <View
                style={[
                  styles.corner,
                  styles.topRight,
                  { borderColor: colors.primary },
                ]}
              />
              <View
                style={[
                  styles.corner,
                  styles.bottomLeft,
                  { borderColor: colors.primary },
                ]}
              />
              <View
                style={[
                  styles.corner,
                  styles.bottomRight,
                  { borderColor: colors.primary },
                ]}
              />
            </View>

            <View style={styles.instructionContainer}>
              {!activeExamSession ? (
                <View
                  style={[
                    styles.instructionBox,
                    { backgroundColor: "rgba(0,0,0,0.7)" },
                  ]}
                >
                  <Ionicons name="cube" size={24} color="#fff" />
                  <Text style={styles.instructionText}>Scan Batch QR Code</Text>
                </View>
              ) : (
                <View
                  style={[
                    styles.instructionBox,
                    { backgroundColor: "rgba(0,0,0,0.7)" },
                  ]}
                >
                  <Ionicons
                    name={scanMode === "ENTRY" ? "enter" : "exit"}
                    size={24}
                    color="#fff"
                  />
                  <Text style={styles.instructionText}>
                    Scan Student ID - {scanMode}
                  </Text>
                </View>
              )}
              {scanned && (
                <View
                  style={[styles.successBadge, { backgroundColor: "#10b981" }]}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.successText}>Scanned</Text>
                </View>
              )}
            </View>
          </View>
        </CameraView>
      </Animated.View>

      {/* Attendance Drawer */}
      <CustomDrawer
        ref={drawerRef}
        session={activeExamSession}
        onViewDetails={handleViewDetails}
        onEndSession={handleEndSession}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  activeBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  modeToggle: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
  },
  modeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    gap: 6,
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
    width: "100%",
  },
  overlay: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "space-between",
    paddingVertical: 60,
  },
  scanArea: {
    alignSelf: "center",
    width: 250,
    height: 250,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 40,
    height: 40,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  instructionContainer: {
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  instructionBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  instructionText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  successBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 6,
  },
  successText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  subText: {
    fontSize: 14,
    textAlign: "center",
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default ScannerScreen;
