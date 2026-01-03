/**
 * Attendance Recording Screen
 * QR Scanner, Manual Entry, and Biometric Verification
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  ScrollView,
  Image,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useThemeColors } from "@/constants/design-system";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CameraView, Camera } from "expo-camera";
import * as LocalAuthentication from "expo-local-authentication";
import { classAttendanceApi } from "@/api/classAttendance";
import { useSocket } from "@/hooks/useSocket";
import type { ClassAttendanceRecord, RecordAttendanceResponse } from "@/types";
import * as Device from "expo-device";
import { toast } from "@/utils/toast";
import { searchStudents, type Student } from "@/api/students";
import { getFileUrl } from "@/lib/api-client";
import { Dialog } from "@/components/ui/dialog";
import AsyncStorage from '@react-native-async-storage/async-storage';
import RecentRecordingsDrawer, { type RecentRecordingsDrawerRef, type RecentRecording } from "@/components/RecentRecordingsDrawer";

type RecordingMethod = "QR" | "MANUAL" | "BIOMETRIC";

export default function AttendanceRecorder() {
  const colors = useThemeColors();
  const socket = useSocket();
  const params = useLocalSearchParams();
  const sessionId = params.sessionId as string;
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [recording, setRecording] = useState(false);
  const [method, setMethod] = useState<RecordingMethod>("QR");
  const [indexNumber, setIndexNumber] = useState("");
  const [activeSession, setActiveSession] = useState<ClassAttendanceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastRecorded, setLastRecorded] = useState<RecordAttendanceResponse | null>(null);
  const [hasBiometric, setHasBiometric] = useState(false);
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmingStudent, setConfirmingStudent] = useState<Student | null>(null);
  const [recentRecordings, setRecentRecordings] = useState<RecentRecording[]>([]);
  const drawerRef = useRef<RecentRecordingsDrawerRef>(null);

  

  const setupSocketListeners = useCallback(() => {
    const unsubscribers: (() => void)[] = [];

    // Listen for attendance recorded events to update the session
    unsubscribers.push(socket.on("attendance:recorded", (data: unknown) => {
      const typedData = data as { record: ClassAttendanceRecord };
      console.log("Real-time attendance update:", typedData);
      if (activeSession && typedData.record.id === activeSession.id) {
        setActiveSession(typedData.record);
      }
    }));

    // Listen for session ended events
    unsubscribers.push(socket.on("session:ended", (data: unknown) => {
      const typedData = data as { record: ClassAttendanceRecord };
      console.log("Session ended:", typedData);
      if (activeSession && typedData.record.id === activeSession.id) {
        toast.info("Session ended by lecturer");
        setActiveSession(null);
        setLoading(false);
      }
    }));

    // Listen for live updates
    unsubscribers.push(socket.on("attendance:live_update", (data: unknown) => {
      const typedData = data as { recordId: string; stats: any };
      console.log("Live stats update:", typedData);
      if (activeSession && typedData.recordId === activeSession.id) {
        setActiveSession((prev) =>
          prev ? { ...prev, totalStudents: typedData.stats.totalRecorded } : prev
        );
      }
    }));

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [socket, activeSession]);

  useEffect(() => {
    requestCameraPermission();
    checkBiometricSupport();
    loadActiveSession();
  }, [loadActiveSession]);

  useEffect(() => {
    if (!socket || !activeSession) return;

    const cleanup = setupSocketListeners();
    return cleanup;
  }, [socket, activeSession, setupSocketListeners]);
  
  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === "granted");
  };

  const checkBiometricSupport = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    setHasBiometric(compatible && enrolled);
  };

  // Search students with debouncing (wait for at least 6 characters for full index)
  useEffect(() => {
    const searchTimer = setTimeout(async () => {
      if (indexNumber.trim().length >= 6) {
        setSearching(true);
        try {
          const response = await searchStudents(indexNumber.trim(), 10);
          setSearchResults(response.students);
        } catch (error) {
          console.error("Search failed:", error);
          setSearchResults([]);
        } finally {
          setSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(searchTimer);
  }, [indexNumber]);

  // Load recent recordings from AsyncStorage
  useEffect(() => {
    if (activeSession?.id) {
      AsyncStorage.getItem(`attendance_recent_${activeSession.id}`)
        .then(data => {
          if (data) {
            setRecentRecordings(JSON.parse(data));
          }
        })
        .catch(err => console.error('Failed to load recent recordings:', err));
    }
  }, [activeSession?.id]);

  const loadActiveSession = useCallback(async () => {
    try {
      setLoading(true);
      if (sessionId) {
        // Load specific session
        const response = await classAttendanceApi.getSession(sessionId);
        // Handle both wrapped and unwrapped responses
        setActiveSession(response.record || response);
      } else {
        // Load first active session
        const response = await classAttendanceApi.getActiveSessions();
        if (response.sessions && response.sessions.length > 0) {
          setActiveSession(response.sessions[0]);
        }
      }
    } catch (error: any) {
      console.error("Failed to load active session:", error);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || !activeSession) return;

    setScanned(true);
    setRecording(true);

    try {
      const deviceId = Device.osBuildId || Device.osInternalBuildId || `device-${Date.now()}`;
      const response = await classAttendanceApi.recordAttendanceByQR({
        recordId: activeSession.id,
        qrCode: data,
        deviceId,
      });

      setLastRecorded(response);
      setShowSuccess(true);
      toast.success(
        `✓ ${response.student.firstName} ${response.student.lastName}`,
        `Attendance recorded via QR`
      );

      // Add to recent recordings
      const newRecording: RecentRecording = {
        id: response.attendance.id,
        studentId: response.student.id,
        firstName: response.student.firstName,
        lastName: response.student.lastName,
        indexNumber: response.student.indexNumber,
        profilePicture: response.student.profilePicture,
        timestamp: new Date().toISOString(),
        method: response.attendance.verificationMethod,
        status: response.attendance.status,
      };
      const updated = [newRecording, ...recentRecordings];
      setRecentRecordings(updated);
      await AsyncStorage.setItem(`attendance_recent_${activeSession.id}`, JSON.stringify(updated));

      setTimeout(() => {
        setShowSuccess(false);
        setScanned(false);
      }, 2000);
    } catch (error: any) {
      console.error("QR scan error:", error);
      // Handle duplicate attendance
      if (error.status === 409 || error.code === 'ALREADY_RECORDED') {
        toast.info("Student already marked attendance");
      } else {
        // Show user-friendly error message
        const errorMessage = error.error || error.message || "Failed to record attendance";
        toast.error(errorMessage);
      }
      setScanned(false);
    } finally {
      setRecording(false);
    }
  };

  const handleStudentSelect = (student: Student) => {
    setConfirmingStudent(student);
    setShowConfirmDialog(true);
  };

  const handleConfirmAttendance = async () => {
    if (!confirmingStudent || !activeSession) return;

    setShowConfirmDialog(false);
    setRecording(true);
    try {
      const response = await classAttendanceApi.recordAttendanceByIndex({
        recordId: activeSession.id,
        indexNumber: confirmingStudent.indexNumber.toUpperCase(),
        verificationMethod: "MANUAL_INDEX",
      });

      setLastRecorded(response);
      setShowSuccess(true);
      toast.success(
        `✓ ${response.student.firstName} ${response.student.lastName}`,
        `Attendance recorded manually`
      );

      // Add to recent recordings
      const newRecording: RecentRecording = {
        id: response.attendance.id,
        studentId: response.student.id,
        firstName: response.student.firstName,
        lastName: response.student.lastName,
        indexNumber: response.student.indexNumber,
        profilePicture: response.student.profilePicture,
        timestamp: new Date().toISOString(),
        method: response.attendance.verificationMethod,
        status: response.attendance.status,
      };
      const updated = [newRecording, ...recentRecordings];
      setRecentRecordings(updated);
      await AsyncStorage.setItem(`attendance_recent_${activeSession.id}`, JSON.stringify(updated));

      setIndexNumber("");
      setSelectedStudent(null);
      setConfirmingStudent(null);
      setSearchResults([]);
      setTimeout(() => {
        setShowSuccess(false);
      }, 2000);
    } catch (error: any) {
      console.error("Manual entry error:", error);
      if (error.status === 409 || error.code === 'ALREADY_RECORDED') {
        toast.info("Student already marked attendance");
      } else {
        const errorMessage = error.error || error.message || "Failed to record attendance";
        toast.error(errorMessage);
      }
    } finally {
      setRecording(false);
    }
  };

  const handleBiometricAuth = async () => {
    if (!activeSession) {
      toast.error("No Active Session", "Please start a session first");
      return;
    }

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Verify attendance with biometric",
        fallbackLabel: "Use PIN",
      });

      if (result.success) {
        setRecording(true);
        // Note: In a real implementation, you would need to:
        // 1. Get the student's ID associated with this device/biometric
        // 2. Get the actual biometric data (this varies by platform)
        // For now, this is a placeholder showing the flow
        toast.info(
          "Biometric Verified",
          "In production, this would record attendance with biometric data"
        );
        setRecording(false);
      }
    } catch {
      toast.error("Authentication Failed", "Biometric authentication failed");
    }
  };

  const renderMethodSelector = () => (
    <View style={styles.methodSelector}>
      <TouchableOpacity
        style={[
          styles.methodButton,
          { borderColor: method === "QR" ? colors.primary : colors.border },
          method === "QR" && { backgroundColor: `${colors.primary}10` },
        ]}
        onPress={() => setMethod("QR")}
      >
        <Ionicons
          name="qr-code-outline"
          size={24}
          color={method === "QR" ? colors.primary : colors.foregroundMuted}
        />
        <Text
          style={[
            styles.methodText,
            { color: method === "QR" ? colors.primary : colors.foregroundMuted },
          ]}
        >
          QR Code
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.methodButton,
          { borderColor: method === "MANUAL" ? colors.primary : colors.border },
          method === "MANUAL" && { backgroundColor: `${colors.primary}10` },
        ]}
        onPress={() => setMethod("MANUAL")}
      >
        <Ionicons
          name="keypad-outline"
          size={24}
          color={method === "MANUAL" ? colors.primary : colors.foregroundMuted}
        />
        <Text
          style={[
            styles.methodText,
            { color: method === "MANUAL" ? colors.primary : colors.foregroundMuted },
          ]}
        >
          Manual
        </Text>
      </TouchableOpacity>

      {hasBiometric && (
        <TouchableOpacity
          style={[
            styles.methodButton,
            { borderColor: method === "BIOMETRIC" ? colors.primary : colors.border },
            method === "BIOMETRIC" && { backgroundColor: `${colors.primary}10` },
          ]}
          onPress={() => setMethod("BIOMETRIC")}
        >
          <Ionicons
            name="finger-print-outline"
            size={24}
            color={method === "BIOMETRIC" ? colors.primary : colors.foregroundMuted}
          />
          <Text
            style={[
              styles.methodText,
              {
                color: method === "BIOMETRIC" ? colors.primary : colors.foregroundMuted,
              },
            ]}
          >
            Biometric
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!activeSession) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Record Attendance
          </Text>
        </View>
        <View style={styles.centerContainer}>
          <Card elevation="sm">
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={64} color={colors.foregroundMuted} />
              <Text style={[styles.emptyText, { color: colors.foregroundMuted }]}>
                No Active Session
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.foregroundMuted }]}>
                Start a session from the Sessions tab to record attendance
              </Text>
              <Button
                variant="default"
                onPress={loadActiveSession}
                style={{ marginTop: 16 }}
              >
                Refresh
              </Button>
            </View>
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Record Attendance
          </Text>
          <Text style={[styles.subtitle, { color: colors.foregroundMuted }]}>
            {activeSession.courseCode} - {activeSession.courseName || "Course"}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.refreshButton, { backgroundColor: colors.muted }]}
          onPress={loadActiveSession}
        >
          <Ionicons name="refresh" size={20} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      {/* Session Info Banner */}
      <View style={[styles.sessionBanner, { backgroundColor: `${colors.success}20` }]}>
        <View style={styles.sessionBannerLeft}>
          <Ionicons name="checkmark-circle" size={20} color={colors.success} />
          <Text style={[styles.sessionBannerText, { color: colors.success }]}>
            Session Active • {activeSession.students?.length || 0} recorded
          </Text>
        </View>
        <TouchableOpacity onPress={() => drawerRef.current?.toggle()} style={styles.eyeButton}>
          <Ionicons name="eye-outline" size={24} color={colors.success} />
        </TouchableOpacity>
      </View>

      {renderMethodSelector()}

      <View style={styles.content}>
        {method === "QR" && (
          <View style={styles.scannerContainer}>
            {hasPermission === null ? (
              <Card elevation="sm">
                <View style={styles.permissionContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={[styles.permissionText, { color: colors.foregroundMuted }]}>
                    Requesting camera permission...
                  </Text>
                </View>
              </Card>
            ) : hasPermission === false ? (
              <Card elevation="sm">
                <View style={styles.permissionContainer}>
                  <Ionicons name="videocam-off" size={64} color={colors.error} />
                  <Text style={[styles.permissionText, { color: colors.foreground }]}>
                    Camera permission denied
                  </Text>
                  <Button variant="default" onPress={requestCameraPermission}>
                    Grant Permission
                  </Button>
                </View>
              </Card>
            ) : (
              <View style={styles.cameraContainer}>
                <CameraView
                  style={styles.camera}
                  facing="back"
                  onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                  barcodeScannerSettings={{
                    barcodeTypes: ["qr"],
                  }}
                >
                  <View style={styles.cameraOverlay}>
                    <View style={[styles.scanFrame, { borderColor: colors.primary }]} />
                    <Text style={styles.scanText}>Position QR code within frame</Text>
                  </View>
                </CameraView>
                {recording && (
                  <View style={styles.recordingOverlay}>
                    <ActivityIndicator size="large" color="#fff" />
                    <Text style={styles.recordingText}>Recording...</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {method === "MANUAL" && (
          <View style={styles.manualWrapper}>
            <Card elevation="sm" style={styles.manualCard}>
              <View style={styles.searchContainer}>
                <View style={styles.searchInputWrapper}>
                  <Ionicons name="search" size={20} color={colors.foregroundMuted} />
                  <TextInput
                    style={[styles.searchInput, { color: colors.foreground }]}
                    placeholder="Enter full index number..."
                    placeholderTextColor={colors.foregroundMuted}
                    value={indexNumber}
                    onChangeText={setIndexNumber}
                    autoCapitalize="characters"
                    autoFocus
                  />
                  {indexNumber.length > 0 && (
                    <TouchableOpacity
                      onPress={() => {
                        setIndexNumber("");
                        setSearchResults([]);
                        setSelectedStudent(null);
                      }}
                    >
                      <Ionicons name="close-circle" size={20} color={colors.foregroundMuted} />
                    </TouchableOpacity>
                  )}
                </View>
                {indexNumber.trim().length < 6 && indexNumber.trim().length > 0 && (
                  <Text style={[styles.searchHint, { color: colors.foregroundMuted }]}>
                    Type at least 6 characters to search...
                  </Text>
                )}
                {searching && (
                  <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 8 }} />
                )}
              </View>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <FlatList
                  data={searchResults}
                  keyExtractor={(item) => item.id || item.indexNumber}
                  style={styles.searchResults}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.studentCard,
                        { backgroundColor: colors.muted, borderColor: colors.border },
                      ]}
                      onPress={() => handleStudentSelect(item)}
                    >
                      <View style={styles.studentCardLeft}>
                        {item.profilePicture ? (
                          <Image
                            source={{ uri: getFileUrl(item.profilePicture) }}
                            style={styles.studentPhoto}
                          />
                        ) : (
                          <View
                            style={[
                              styles.studentPhotoPlaceholder,
                              { backgroundColor: colors.border },
                            ]}
                          >
                            <Ionicons name="person" size={24} color={colors.foregroundMuted} />
                          </View>
                        )}
                        <View style={styles.studentInfo}>
                          <Text style={[styles.studentName, { color: colors.foreground }]}>
                            {item.firstName} {item.lastName}
                          </Text>
                          <Text style={[styles.studentIndex, { color: colors.foregroundMuted }]}>
                            {item.indexNumber}
                          </Text>
                          <Text style={[styles.studentProgram, { color: colors.foregroundMuted }]}>
                            {item.program} • Level {item.level || "N/A"}
                          </Text>
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={24} color={colors.foregroundMuted} />
                    </TouchableOpacity>
                  )}
                />
              )}

              {/* No Results */}
              {indexNumber.trim().length >= 6 && !searching && searchResults.length === 0 && (
                <View style={styles.noResults}>
                  <Ionicons name="search" size={48} color={colors.foregroundMuted} />
                  <Text style={[styles.noResultsText, { color: colors.foregroundMuted }]}>
                    No students found
                  </Text>
                </View>
              )}
            </Card>
          </View>
        )}

        {method === "BIOMETRIC" && (
          <Card elevation="sm" style={styles.biometricCard}>
            <View style={styles.biometricContainer}>
              <Ionicons name="finger-print" size={80} color={colors.primary} />
              <Text style={[styles.biometricTitle, { color: colors.foreground }]}>
                Biometric Verification
              </Text>
              <Text style={[styles.biometricSubtext, { color: colors.foregroundMuted }]}>
                Use your fingerprint or face ID to mark attendance
              </Text>
              <Button
                variant="default"
                onPress={handleBiometricAuth}
                disabled={recording}
                style={styles.biometricButton}
              >
                <Ionicons name="finger-print-outline" size={20} color="#fff" />
                {recording ? "Verifying..." : "Verify Identity"}
              </Button>
            </View>
          </Card>
        )}
      </View>

      {/* Success Modal */}
      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.successOverlay}>
          <View style={[styles.successCard, { backgroundColor: colors.card }]}>
            <Ionicons name="checkmark-circle" size={80} color={colors.success} />
            <Text style={[styles.successTitle, { color: colors.foreground }]}>
              Attendance Recorded
            </Text>
            {lastRecorded && (
              <View style={styles.successInfo}>
                <Text style={[styles.successName, { color: colors.foreground }]}>
                  {lastRecorded.student.firstName} {lastRecorded.student.lastName}
                </Text>
                <Text style={[styles.successIndex, { color: colors.foregroundMuted }]}>
                  {lastRecorded.student.indexNumber}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Confirmation Dialog */}
      {confirmingStudent && (
        <Dialog
          visible={showConfirmDialog}
          onClose={() => {
            setShowConfirmDialog(false);
            setConfirmingStudent(null);
          }}
          title="Confirm Attendance"
          variant="default"
          primaryAction={{
            label: recording ? "Recording..." : "Mark Present",
            onPress: handleConfirmAttendance,
          }}
          secondaryAction={{
            label: "Cancel",
            onPress: () => {
              setShowConfirmDialog(false);
              setConfirmingStudent(null);
            },
          }}
          icon="person"
        >
          <View style={styles.confirmDialogContent}>
            {confirmingStudent.profilePicture ? (
              <Image
                source={{ uri: getFileUrl(confirmingStudent.profilePicture) }}
                style={styles.confirmStudentPhoto}
              />
            ) : (
              <View style={[styles.confirmStudentPhotoPlaceholder, { backgroundColor: colors.border }]}>
                <Ionicons name="person" size={60} color={colors.foregroundMuted} />
              </View>
            )}
            <Text style={[styles.confirmStudentName, { color: colors.foreground }]}>
              {confirmingStudent.firstName} {confirmingStudent.lastName}
            </Text>
            <Text style={[styles.confirmStudentIndex, { color: colors.primary }]}>
              {confirmingStudent.indexNumber}
            </Text>
            <Text style={[styles.confirmStudentProgram, { color: colors.foregroundMuted }]}>
              {confirmingStudent.program}
            </Text>
            <Text style={[styles.confirmStudentLevel, { color: colors.foregroundMuted }]}>
              Level {confirmingStudent.level || "N/A"}
            </Text>
          </View>
        </Dialog>
      )}

      {/* Recent Recordings Drawer */}
      <RecentRecordingsDrawer ref={drawerRef} recordings={recentRecordings} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  sessionBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  sessionBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sessionBannerText: {
    fontSize: 14,
    fontWeight: "600",
  },
  eyeButton: {
    padding: 4,
  },
  methodSelector: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  methodButton: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  methodText: {
    fontSize: 12,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  scannerContainer: {
    flex: 1,
  },
  cameraContainer: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 3,
    borderRadius: 12,
  },
  scanText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 24,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  recordingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  recordingText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  permissionContainer: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 16,
  },
  permissionText: {
    fontSize: 16,
    textAlign: "center",
  },
  manualWrapper: {
    flex: 1,
  },
  manualCard: {
    flex: 1,
    marginBottom: 16,
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  searchHint: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  searchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  searchResults: {
    maxHeight: 350,
    paddingHorizontal: 16,
  },
  studentCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
  },
  studentCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  studentPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  studentPhotoPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  studentIndex: {
    fontSize: 13,
    marginBottom: 2,
  },
  studentProgram: {
    fontSize: 12,
  },
  noResults: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 12,
  },
  noResultsText: {
    fontSize: 16,
  },
  markButton: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  markButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  biometricCard: {
    marginBottom: 16,
  },
  biometricContainer: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 16,
  },
  biometricTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  biometricSubtext: {
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 24,
  },
  biometricButton: {
    marginTop: 16,
    flexDirection: "row",
    gap: 4,
  },
  recentCard: {
    marginTop: 16,
    maxHeight: 200,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  recentList: {
    flex: 1,
  },
  recentItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  recentItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  recentName: {
    fontSize: 14,
    fontWeight: "600",
  },
  recentIndex: {
    fontSize: 12,
  },
  recentTime: {
    fontSize: 12,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 24,
  },
  successOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  successCard: {
    padding: 32,
    borderRadius: 20,
    alignItems: "center",
    gap: 16,
    minWidth: 280,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  successInfo: {
    alignItems: "center",
    gap: 4,
  },
  successName: {
    fontSize: 16,
    fontWeight: "600",
  },
  successIndex: {
    fontSize: 14,
  },
  confirmDialogContent: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 20,
  },
  confirmStudentPhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 8,
  },
  confirmStudentPhotoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  confirmStudentName: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  confirmStudentIndex: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  confirmStudentProgram: {
    fontSize: 16,
    textAlign: "center",
  },
  confirmStudentLevel: {
    fontSize: 14,
    textAlign: "center",
  },
});
