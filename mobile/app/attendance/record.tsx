import { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import * as LocalAuthentication from "expo-local-authentication";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text, H2 } from "@/components/ui/typography";
import { useThemeColors } from "@/constants/design-system";
import { classAttendanceApi } from "@/api/classAttendance";

type AttendanceMethod = 'qrcode' | 'manual' | 'fingerprint' | null;

export default function RecordAttendance() {
  const colors = useThemeColors();
  const router = useRouter();
  const params = useLocalSearchParams();
  const recordId = params.recordId as string;
  const sessionId = params.sessionId as string;

  const [selectedMethod, setSelectedMethod] = useState<AttendanceMethod>(null);
  const [manualStudentId, setManualStudentId] = useState("");
  const [biometricStudentId, setBiometricStudentId] = useState("");
  const [showBiometricStudentInput, setShowBiometricStudentInput] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!recordId) {
      Alert.alert("Error", "No active recording found", [
        { text: "OK", onPress: () => router.back() }
      ]);
    }
  }, [recordId]);

  const handleMethodSelect = (method: AttendanceMethod) => {
    setSelectedMethod(method);
  };

  const handleManualRecord = async () => {
    if (!manualStudentId.trim()) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please enter a student ID",
      });
      return;
    }

    setLoading(true);
    try {
      await classAttendanceApi.recordManualAttendance({
        recordId,
        studentId: manualStudentId.trim(),
      });
      Toast.show({
        type: "success",
        text1: "Attendance Recorded",
        text2: `Student ${manualStudentId} marked present`,
      });
      setManualStudentId("");
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error?.error || "Failed to record attendance",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQRScan = () => {
    // TODO: Implement QR scanning
    Alert.alert("QR Code", "QR scanning functionality to be implemented");
  };

  const handleFingerprint = () => {
    handleBiometricAttendance();
  };

  const authenticateBiometric = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        Alert.alert("Error", "Biometric authentication is not available on this device");
        return null;
      }

      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (supportedTypes.length === 0) {
        Alert.alert("Error", "No biometric authentication methods are supported");
        return null;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate to record attendance",
        fallbackLabel: "Use PIN",
        cancelLabel: "Cancel",
        disableDeviceFallback: false,
      });

      if (result.success) {
        return result;
      } else {
        if (result.error === "user_cancel") {
          return null;
        }
        Alert.alert("Authentication Failed", "Please try again");
        return null;
      }
    } catch (error) {
      console.error("Biometric authentication error:", error);
      Alert.alert("Error", "Failed to authenticate");
      return null;
    }
  };

  const handleBiometricAttendance = async () => {
    // First, authenticate the lecturer biometrically
    const authResult = await authenticateBiometric();
    if (!authResult) return;

    // After successful biometric authentication, show student ID input
    setShowBiometricStudentInput(true);
  };

  const handleBiometricRecordSubmit = async () => {
    if (!biometricStudentId.trim()) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please enter a student ID",
      });
      return;
    }

    setLoading(true);
    try {
      await classAttendanceApi.recordStudentAttendance({
        recordId,
        studentId: biometricStudentId.trim(),
      });

      Toast.show({
        type: "success",
        text1: "Attendance Recorded",
        text2: `Student ${biometricStudentId} marked present (biometrically verified)`,
      });

      // Reset the biometric input
      setBiometricStudentId("");
      setShowBiometricStudentInput(false);
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error?.error || "Failed to record attendance",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricCancel = () => {
    setBiometricStudentId("");
    setShowBiometricStudentInput(false);
  };

  const handleEndRecording = () => {
    Alert.alert(
      "End Recording",
      "Are you sure you want to end this recording session?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "End Recording",
          style: "destructive",
          onPress: async () => {
            try {
              await classAttendanceApi.endRecord(recordId);
              Toast.show({
                type: "success",
                text1: "Recording Ended",
                text2: "The attendance recording has been stopped",
              });
              router.back();
            } catch (error: any) {
              Toast.show({
                type: "error",
                text1: "Error",
                text2: error?.error || "Failed to end recording",
              });
            }
          },
        },
      ]
    );
  };

  if (!recordId) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={["top"]}
      >
        <View style={styles.center}>
          <Text style={{ color: colors.foreground }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <H2 style={{ color: colors.foreground }}>Record Attendance</H2>
          <TouchableOpacity onPress={handleEndRecording} style={styles.endButton}>
            <Ionicons name="stop-circle" size={24} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {!selectedMethod ? (
          <View style={styles.methodSelection}>
            <Text style={[styles.instruction, { color: colors.foreground }]}>
              Choose an attendance method:
            </Text>
            <Card elevation="sm" style={styles.methodCard}>
              <TouchableOpacity
                style={styles.methodOption}
                onPress={() => handleMethodSelect('qrcode')}
              >
                <Ionicons name="qr-code" size={32} color={colors.primary} />
                <Text style={[styles.methodTitle, { color: colors.foreground }]}>
                  QR Code
                </Text>
                <Text style={[styles.methodDescription, { color: colors.foregroundMuted }]}>
                  Scan student QR codes
                </Text>
              </TouchableOpacity>
            </Card>
            <Card elevation="sm" style={styles.methodCard}>
              <TouchableOpacity
                style={styles.methodOption}
                onPress={() => handleMethodSelect('manual')}
              >
                <Ionicons name="create" size={32} color={colors.primary} />
                <Text style={[styles.methodTitle, { color: colors.foreground }]}>
                  Manual Entry
                </Text>
                <Text style={[styles.methodDescription, { color: colors.foregroundMuted }]}>
                  Enter student IDs manually
                </Text>
              </TouchableOpacity>
            </Card>
            <Card elevation="sm" style={styles.methodCard}>
              <TouchableOpacity
                style={styles.methodOption}
                onPress={() => handleMethodSelect('fingerprint')}
              >
                <Ionicons name="finger-print" size={32} color={colors.primary} />
                <Text style={[styles.methodTitle, { color: colors.foreground }]}>
                  Fingerprint
                </Text>
                <Text style={[styles.methodDescription, { color: colors.foregroundMuted }]}>
                  Use biometric authentication
                </Text>
              </TouchableOpacity>
            </Card>
          </View>
        ) : (
          <View style={styles.methodView}>
            <TouchableOpacity
              style={styles.backToMethods}
              onPress={() => setSelectedMethod(null)}
            >
              <Ionicons name="arrow-back" size={20} color={colors.primary} />
              <Text style={[styles.backText, { color: colors.primary }]}>
                Back to Methods
              </Text>
            </TouchableOpacity>

            {selectedMethod === 'qrcode' && (
              <Card elevation="sm" style={styles.card}>
                <CardContent>
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                    QR Code Scanning
                  </Text>
                  <Text style={[styles.sectionDescription, { color: colors.foregroundMuted }]}>
                    Scan student QR codes to record attendance
                  </Text>
                  <Button onPress={handleQRScan} style={styles.actionButton}>
                    <Ionicons name="scan" size={20} color="white" />
                    <Text style={styles.buttonText}>Start Scanning</Text>
                  </Button>
                </CardContent>
              </Card>
            )}

            {selectedMethod === 'manual' && (
              <Card elevation="sm" style={styles.card}>
                <CardContent>
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                    Manual Entry
                  </Text>
                  <Text style={[styles.sectionDescription, { color: colors.foregroundMuted }]}>
                    Enter student ID to record attendance
                  </Text>
                  <Input
                    placeholder="Student ID"
                    value={manualStudentId}
                    onChangeText={setManualStudentId}
                    style={styles.input}
                  />
                  <Button
                    onPress={handleManualRecord}
                    disabled={loading || !manualStudentId.trim()}
                    style={styles.actionButton}
                  >
                    <Text style={styles.buttonText}>
                      {loading ? "Recording..." : "Record Attendance"}
                    </Text>
                  </Button>
                </CardContent>
              </Card>
            )}

            {selectedMethod === 'fingerprint' && !showBiometricStudentInput && (
              <Card elevation="sm" style={styles.card}>
                <CardContent>
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                    Biometric Verification
                  </Text>
                  <Text style={[styles.sectionDescription, { color: colors.foregroundMuted }]}>
                    Authenticate with fingerprint/face ID to record attendance
                  </Text>
                  <Button onPress={handleFingerprint} style={styles.actionButton}>
                    <Ionicons name="finger-print" size={20} color="white" />
                    <Text style={styles.buttonText}>Authenticate & Record</Text>
                  </Button>
                </CardContent>
              </Card>
            )}

            {selectedMethod === 'fingerprint' && showBiometricStudentInput && (
              <Card elevation="sm" style={styles.card}>
                <CardContent>
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                    Enter Student ID
                  </Text>
                  <Text style={[styles.sectionDescription, { color: colors.foregroundMuted }]}>
                    Biometric authentication successful. Enter the student ID to record attendance.
                  </Text>
                  <Input
                    placeholder="Student ID or Index Number"
                    value={biometricStudentId}
                    onChangeText={setBiometricStudentId}
                    style={styles.input}
                    autoFocus={true}
                  />
                  <View style={styles.buttonRow}>
                    <Button
                      variant="outline"
                      onPress={handleBiometricCancel}
                      style={styles.cancelButton}
                    >
                      <Text style={{ color: colors.primary }}>Cancel</Text>
                    </Button>
                    <Button
                      onPress={handleBiometricRecordSubmit}
                      disabled={loading || !biometricStudentId.trim()}
                      style={styles.submitButton}
                    >
                      <Text style={styles.buttonText}>
                        {loading ? "Recording..." : "Record Attendance"}
                      </Text>
                    </Button>
                  </View>
                </CardContent>
              </Card>
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
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    padding: 8,
  },
  endButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  methodSelection: {
    gap: 16,
  },
  instruction: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  methodCard: {
    marginBottom: 8,
  },
  methodOption: {
    padding: 16,
    alignItems: "center",
  },
  methodTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 4,
  },
  methodDescription: {
    fontSize: 14,
    textAlign: "center",
  },
  methodView: {
    gap: 16,
  },
  backToMethods: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  backText: {
    fontSize: 16,
    marginLeft: 8,
  },
  card: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 2,
  },
});