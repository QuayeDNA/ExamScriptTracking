import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { CameraView, Camera } from "expo-camera";
import { useRouter } from "expo-router";

export default function ScannerScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [activeExamSessionId, setActiveExamSessionId] = useState<string | null>(
    null
  );
  const router = useRouter();

  const requestPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === "granted");
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;

    setScanned(true);

    try {
      const qrData = JSON.parse(data);

      if (qrData.type === "EXAM_BATCH") {
        // Set active exam session and navigate to batch details
        setActiveExamSessionId(qrData.id);
        router.push({
          pathname: "/batch-details",
          params: { batchId: qrData.id },
        });
      } else if (qrData.type === "STUDENT") {
        // Check if we have an active exam session
        if (!activeExamSessionId) {
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
            examSessionId: activeExamSessionId,
          },
        });
      } else {
        Alert.alert("Invalid QR Code", "This QR code is not recognized.");
      }
    } catch {
      Alert.alert(
        "Invalid QR Code",
        "Unable to read QR code data. Please try again."
      );
    }

    // Reset scanner after 2 seconds
    setTimeout(() => setScanned(false), 2000);
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Requesting camera permission...</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>No access to camera</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Request Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
              {activeExamSessionId
                ? "Scan Student ID Cards"
                : "Scan Batch QR Code First"}
            </Text>
            {activeExamSessionId && (
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
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
    marginBottom: 20,
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
