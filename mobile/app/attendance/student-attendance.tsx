import { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as LocalAuthentication from "expo-local-authentication";
import Toast from "react-native-toast-message";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Text, H2 } from "@/components/ui/typography";
import { useThemeColors } from "@/constants/design-system";
import { classAttendanceApi } from "@/api/classAttendance";
import { useAuthStore } from "@/store/auth";
import { LocalStudent } from "@/utils/localStudentStorage";
import { StudentLookupModal } from "@/components/StudentLookupModal";

interface AvailableSession {
  id: string;
  deviceName: string;
  courseName?: string;
  courseCode?: string;
  lecturerName?: string;
  startTime: string;
  recordId: string;
}

export default function StudentAttendanceScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { user } = useAuthStore();

  const [availableSessions, setAvailableSessions] = useState<AvailableSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricType, setBiometricType] = useState<string>("");
  const [selectedStudent, setSelectedStudent] = useState<LocalStudent | null>(null);
  const [showStudentLookup, setShowStudentLookup] = useState(false);
  const [processingAttendance, setProcessingAttendance] = useState<string | null>(null);

  useEffect(() => {
    checkBiometricSupport();
    loadAvailableSessions();
  }, []);

  const checkBiometricSupport = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

      setBiometricSupported(compatible && enrolled);

      // Determine biometric type
      if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricType("Face ID");
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricType("Fingerprint");
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        setBiometricType("Iris");
      } else {
        setBiometricType("Biometric");
      }
    } catch (error) {
      console.warn("Biometric check failed:", error);
      setBiometricSupported(false);
    }
  };

  const loadAvailableSessions = async () => {
    try {
      setLoading(true);
      const response = await classAttendanceApi.getAvailableSessionsForStudent();
      setAvailableSessions(response.sessions);
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Sessions",
        text2: error?.error || "Failed to load available sessions",
      });
    } finally {
      setLoading(false);
    }
  };

  const authenticateBiometric = async (): Promise<string | null> => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate to mark attendance",
        fallbackLabel: "Use Passcode",
        cancelLabel: "Cancel",
        disableDeviceFallback: false,
      });

      if (result.success) {
        // Generate a consistent hash using user ID and successful authentication
        // This creates a user-specific biometric verification hash
        const userId = user?.id || 'unknown';
        const biometricData = `biometric_verified_${userId}_${new Date().toDateString()}`;
        const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(biometricData));
        const hashArray = Array.from(new Uint8Array(hash));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        return hashHex;
      } else {
        if (result.error === 'user_cancel') {
          Toast.show({
            type: "info",
            text1: "Cancelled",
            text2: "Authentication cancelled",
          });
        } else {
          Toast.show({
            type: "error",
            text1: "Authentication Failed",
            text2: result.error || "Biometric authentication failed",
          });
        }
        return null;
      }
    } catch (error) {
      console.warn("Biometric authentication error:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Biometric authentication failed",
      });
      return null;
    }
  };

  const handleBiometricAttendance = async (session: AvailableSession) => {
    if (!biometricSupported) {
      Alert.alert(
        "Biometric Not Available",
        "Biometric authentication is not available on this device. Please set up biometric authentication in your device settings.",
        [{ text: "OK" }]
      );
      return;
    }

    setProcessingAttendance(session.recordId);

    try {
      // Perform biometric authentication
      const biometricHash = await authenticateBiometric();
      if (!biometricHash) {
        setProcessingAttendance(null);
        return;
      }

      // Record attendance with biometric data
      const attendanceData: any = {
        recordId: session.recordId,
        biometricData: biometricHash,
      };

      // Include student ID if selected
      if (selectedStudent) {
        attendanceData.studentId = selectedStudent.indexNumber;
      }

      const response = await classAttendanceApi.recordBiometricAttendance(attendanceData);

      if (response.success) {
        Toast.show({
          type: "success",
          text1: "Attendance Recorded",
          text2: `Successfully marked attendance for ${session.courseName || session.courseCode || 'class'}`,
        });

        // Refresh sessions to update status
        loadAvailableSessions();
      } else {
        Toast.show({
          type: "error",
          text1: "Attendance Failed",
          text2: response.message || "Failed to record attendance",
        });
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error?.error || "Failed to record biometric attendance",
      });
    } finally {
      setProcessingAttendance(null);
    }
  };

  const formatSessionTime = (startTime: string) => {
    const date = new Date(startTime);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.foregroundMuted }]}>
            Loading available sessions...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <H2 style={[styles.title, { color: colors.foreground }]}>
            Student Attendance
          </H2>
          <Text style={[styles.subtitle, { color: colors.foregroundMuted }]}>
            Mark your attendance using {biometricType}
          </Text>

          {/* Student Identification Section */}
          <View style={styles.studentIdSection}>
            <Text style={[styles.studentIdLabel, { color: colors.foreground }]}>
              Identify Yourself
            </Text>
            {selectedStudent ? (
              <View style={[styles.selectedStudentCard, { backgroundColor: colors.card }]}>
                <View style={styles.studentInfo}>
                  <Text style={[styles.studentName, { color: colors.foreground }]}>
                    {selectedStudent.name}
                  </Text>
                  <Text style={[styles.studentIndex, { color: colors.foregroundMuted }]}>
                    {selectedStudent.indexNumber}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedStudent(null)}
                  style={styles.changeStudentButton}
                >
                  <Ionicons name="close-circle" size={24} color={colors.primary} />
                </TouchableOpacity>
              </View>
            ) : (
              <Button
                onPress={() => setShowStudentLookup(true)}
                variant="outline"
                style={styles.identifyButton}
              >
                <Ionicons name="person-add" size={20} color={colors.primary} />
                <Text style={[styles.identifyButtonText, { color: colors.primary }]}>
                  Select Your Details
                </Text>
              </Button>
            )}
          </View>
        </View>

        {!biometricSupported && (
          <Card style={StyleSheet.flatten(StyleSheet.compose(styles.warningCard, { borderColor: colors.warning }))}>
            <CardContent style={styles.warningContent}>
              <Ionicons name="warning" size={24} color={colors.warning} />
              <View style={styles.warningText}>
                <Text style={[styles.warningTitle, { color: colors.warning }]}>
                  Biometric Authentication Required
                </Text>
                <Text style={[styles.warningMessage, { color: colors.foregroundMuted }]}>
                  Please enable {biometricType} in your device settings to use this feature.
                </Text>
              </View>
            </CardContent>
          </Card>
        )}

        {availableSessions.length === 0 ? (
          <Card style={StyleSheet.flatten(StyleSheet.compose(styles.emptyCard, { backgroundColor: colors.card }))}>
            <CardContent style={styles.emptyContent}>
              <Ionicons name="school-outline" size={48} color={colors.foregroundMuted} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                No Active Sessions
              </Text>
              <Text style={[styles.emptyMessage, { color: colors.foregroundMuted }]}>
                There are no active class attendance sessions available right now.
              </Text>
            </CardContent>
          </Card>
        ) : (
          <View style={styles.sessionsList}>
            {availableSessions.map((session) => (
              <Card key={session.id} style={StyleSheet.flatten(StyleSheet.compose(styles.sessionCard, { backgroundColor: colors.card }))}>
                <CardContent style={styles.sessionContent}>
                  <View style={styles.sessionInfo}>
                    <Text style={[styles.courseName, { color: colors.foreground }]}>
                      {session.courseName || "Class Session"}
                    </Text>
                    {session.courseCode && (
                      <Text style={[styles.courseCode, { color: colors.foregroundMuted }]}>
                        {session.courseCode}
                      </Text>
                    )}
                    <Text style={[styles.lecturerName, { color: colors.foregroundMuted }]}>
                      {session.lecturerName || session.deviceName}
                    </Text>
                    <Text style={[styles.sessionTime, { color: colors.primary }]}>
                      Started at {formatSessionTime(session.startTime)}
                    </Text>
                  </View>

                  <Button
                    onPress={() => handleBiometricAttendance(session)}
                    disabled={!biometricSupported || processingAttendance === session.recordId || !selectedStudent}
                    style={styles.attendanceButton}
                  >
                    {processingAttendance === session.recordId ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <>
                        <Ionicons name="finger-print" size={20} color="white" />
                        <Text style={styles.buttonText}>Mark Attendance</Text>
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </View>
        )}

        <View style={styles.refreshContainer}>
          <Button
            variant="outline"
            onPress={loadAvailableSessions}
            style={styles.refreshButton}
          >
            <Ionicons name="refresh" size={20} color={colors.primary} />
            <Text style={[styles.refreshText, { color: colors.primary }]}>Refresh</Text>
          </Button>
        </View>
      </ScrollView>

      {/* Student Lookup Modal */}
      <StudentLookupModal
        visible={showStudentLookup}
        onClose={() => setShowStudentLookup(false)}
        onStudentSelected={(student: LocalStudent) => {
          setSelectedStudent(student);
          setShowStudentLookup(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    marginBottom: 24,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  studentIdSection: {
    marginTop: 16,
  },
  studentIdLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  selectedStudentCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  studentIndex: {
    fontSize: 14,
  },
  changeStudentButton: {
    padding: 4,
  },
  identifyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
  },
  identifyButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  warningCard: {
    borderWidth: 1,
    marginBottom: 16,
  },
  warningContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  warningText: {
    flex: 1,
    marginLeft: 12,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  warningMessage: {
    fontSize: 14,
  },
  emptyCard: {
    marginTop: 32,
  },
  emptyContent: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    textAlign: "center",
  },
  sessionsList: {
    gap: 12,
  },
  sessionCard: {
    marginBottom: 8,
  },
  sessionContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sessionInfo: {
    flex: 1,
  },
  courseName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  courseCode: {
    fontSize: 14,
    marginBottom: 2,
  },
  lecturerName: {
    fontSize: 14,
    marginBottom: 4,
  },
  sessionTime: {
    fontSize: 12,
    fontWeight: "500",
  },
  attendanceButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  buttonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  refreshContainer: {
    marginTop: 24,
    alignItems: "center",
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  refreshText: {
    fontSize: 16,
  },
});