import { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from "react-native";
import { CameraView, Camera } from "expo-camera";
import { useRouter } from "expo-router";
import CustomDrawer, { type CustomDrawerRef } from "@/components/CustomDrawer";
import { examSessionsApi, type ExamSession } from "@/api/examSessions";

export default function ScannerScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [activeExamSession, setActiveExamSession] =
    useState<ExamSession | null>(null);
  const drawerRef = useRef<CustomDrawerRef>(null);
  const router = useRouter();

  const requestPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === "granted");
  };

  const loadExamSession = async (batchId: string) => {
    try {
      console.log("Loading exam session:", batchId);
      const session = await examSessionsApi.getExamSession(batchId);
      setActiveExamSession(session);
      drawerRef.current?.snapToIndex(1);
      console.log("Exam session loaded, drawer opened");
    } catch (error) {
      console.error("Failed to load exam session:", error);
      Alert.alert("Error", "Failed to load exam session details");
    }
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;

    setScanned(true);

    try {
      const qrData = JSON.parse(data);
      console.log("QR Data parsed:", qrData);

      if (qrData.type === "EXAM_BATCH") {
        // Load exam session and open drawer
        loadExamSession(qrData.id);
        setTimeout(() => setScanned(false), 2000);
      } else if (qrData.type === "STUDENT") {
        // Check if we have an active exam session
        if (!activeExamSession) {
          Alert.alert(
            "No Active Exam Session",
            "Please scan the Batch QR Code first to select an exam session.",
            [{ text: "OK" }]
          );
          setTimeout(() => setScanned(false), 1000);
          return;
        }

        // Navigate to student attendance with active session
        router.push({
          pathname: "/student-attendance",
          params: {
            studentId: qrData.id,
            examSessionId: activeExamSession.id,
          },
        });

        setTimeout(() => setScanned(false), 2000);
      } else {
        Alert.alert("Invalid QR Code", "This QR code is not recognized.");
        setTimeout(() => setScanned(false), 1000);
      }
    } catch (error) {
      console.error("QR Scan error:", error);
      Alert.alert(
        "Invalid QR Code",
        "Unable to read QR code data. Please try again."
      );
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

  const handleEndSession = () => {
    Alert.alert(
      "End Session",
      "Are you sure you want to end this exam session?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "End Session",
          style: "destructive",
          onPress: () => {
            setActiveExamSession(null);
            drawerRef.current?.close();
          },
        },
      ]
    );
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>QR Scanner</Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.text}>Camera permission required</Text>
          <TouchableOpacity style={styles.button} onPress={requestPermission}>
            <Text style={styles.buttonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>QR Scanner</Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.text}>No access to camera</Text>
          <Text style={styles.subText}>
            Please enable camera permissions in settings
          </Text>
          <TouchableOpacity style={styles.button} onPress={requestPermission}>
            <Text style={styles.buttonText}>Request Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>QR Scanner</Text>
        {activeExamSession && (
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>Session Active</Text>
          </View>
        )}
      </View>
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
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>

          <View style={styles.instructionContainer}>
            <Text style={styles.instructionText}>
              {activeExamSession
                ? "Scan Student ID Cards"
                : "Scan Batch QR Code First"}
            </Text>
            {activeExamSession && (
              <Text style={styles.activeSessionText}>
                ✓ Exam Session Active
              </Text>
            )}
            {scanned && (
              <Text style={styles.successText}>✓ Scanned Successfully</Text>
            )}
          </View>
        </View>
      </CameraView>

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
    backgroundColor: "#1f2937",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  activeBadge: {
    backgroundColor: "#10b981",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
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
    borderColor: "#fff",
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
  },
  instructionText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  successText: {
    color: "#4ade80",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 16,
  },
  activeSessionText: {
    color: "#10b981",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
  },
  text: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 12,
    textAlign: "center",
    fontWeight: "600",
  },
  subText: {
    color: "#9ca3af",
    fontSize: 14,
    marginBottom: 20,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#3b82f6",
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
