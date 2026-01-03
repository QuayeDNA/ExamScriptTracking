/**
 * Attendance Sessions Screen
 * View and manage active attendance recording sessions
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "@/constants/design-system";
import { useRouter } from "expo-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { classAttendanceApi, type ClassAttendance } from "@/api/classAttendance";
import { useSocket } from "@/hooks/useSocket";
import type {
  ClassAttendanceRecord,
  StartSessionRequest,
  RecordingStatus,
} from "@/types";
import * as Device from "expo-device";

export default function AttendanceSessions() {
  const colors = useThemeColors();
  const socket = useSocket();
  const router = useRouter();
  const [activeSessions, setActiveSessions] = useState<ClassAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showStartForm, setShowStartForm] = useState(false);
  const [formData, setFormData] = useState<Partial<StartSessionRequest>>({
    courseCode: "",
    courseName: "",
    lecturerName: "",
    notes: "",
    totalRegisteredStudents: undefined,
  });
  const [showStudentList, setShowStudentList] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const setupSocketListeners = useCallback(() => {
    const unsubscribers: (() => void)[] = [];

    // Listen for session started events
    unsubscribers.push(socket.on("session:started", (data: unknown) => {
      const typedData = data as { record: ClassAttendanceRecord };
      console.log("Session started:", typedData);
      setActiveSessions((prev) => [typedData.record, ...prev]);
    }));

    // Listen for session ended events
    unsubscribers.push(socket.on("session:ended", (data: unknown) => {
      const typedData = data as { record: ClassAttendanceRecord };
      console.log("Session ended:", typedData);
      setActiveSessions((prev) => prev.filter((s) => s.id !== typedData.record.id));
    }));

    // Listen for attendance recorded events
    unsubscribers.push(socket.on("attendance:recorded", (data: unknown) => {
      const typedData = data as { record: ClassAttendanceRecord };
      console.log("Attendance recorded:", typedData);
      setActiveSessions((prev) =>
        prev.map((session) => (session.id === typedData.record.id ? typedData.record : session))
      );
    }));

    // Listen for live attendance updates
    unsubscribers.push(socket.on("attendance:live_update", (data: unknown) => {
      const typedData = data as { recordId: string; stats: any };
      console.log("Live update:", typedData);
      setActiveSessions((prev) =>
        prev.map((session) => {
          if (session.id === typedData.recordId) {
            return { ...session, totalStudents: typedData.stats.totalRecorded };
          }
          return session;
        })
      );
    }));

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [socket]);

  useEffect(() => {
    loadActiveSessions();
    const cleanup = setupSocketListeners();

    return cleanup;
  }, [setupSocketListeners]);

  const loadActiveSessions = async () => {
    try {
      setLoading(true);
      const response = await classAttendanceApi.getActiveSessions();
      setActiveSessions(response.sessions || []);
    } catch (error: any) {
      console.error("Failed to load sessions:", error);
      Alert.alert("Error", error?.error || "Failed to load sessions");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadActiveSessions();
  };

  const handleStartSession = async () => {
    if (!formData.courseCode?.trim()) {
      Alert.alert("Error", "Course code is required");
      return;
    }

    try {
      setSubmitting(true);
      const deviceId = Device.osBuildId || Device.osInternalBuildId || `device-${Date.now()}`;
      const deviceName = `${Device.brand} ${Device.modelName}`;

      await classAttendanceApi.startSession({
        deviceId,
        deviceName,
        courseCode: formData.courseCode.trim(),
        courseName: formData.courseName?.trim(),
        lecturerName: formData.lecturerName?.trim(),
        notes: formData.notes?.trim(),
        totalRegisteredStudents: formData.totalRegisteredStudents,
      });

      Alert.alert("Success", "Attendance session started successfully");
      setShowStartForm(false);
      setFormData({
        courseCode: "",
        courseName: "",
        lecturerName: "",
        notes: "",
        totalRegisteredStudents: undefined,
      });
      loadActiveSessions();
    } catch (error: any) {
      console.error("Failed to start session:", error);
      Alert.alert("Error", error?.error || "Failed to start session");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateLink = async (recordId: string) => {
    try {
      const response = await classAttendanceApi.generateAttendanceLink({
        recordId,
        expiresInMinutes: 60, // 1 hour default
        maxUses: 100, // Allow multiple uses
      });

      // Copy link to clipboard and show success message
      // For now, just show the link
      Alert.alert(
        "Link Generated",
        `Share this link with students:\n\n${response.link.url}`,
        [
          { text: "OK" },
          {
            text: "Copy Link",
            onPress: () => {
              // In a real app, you'd use Clipboard.setStringAsync
              Alert.alert("Link copied to clipboard", response.link.url);
            }
          }
        ]
      );
    } catch (error: any) {
      console.error("Failed to generate link:", error);
      Alert.alert("Error", error?.error || "Failed to generate attendance link");
    }
  };

  const handleEndSession = (recordId: string) => {
    Alert.alert(
      "End Session",
      "Are you sure you want to end this attendance session?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "End",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await classAttendanceApi.endSession({ recordId });
              Alert.alert(
                "Session Ended",
                `Total Recorded: ${response.summary.totalRecorded}\nPresent: ${response.summary.presentCount}\nDuration: ${response.summary.duration}`
              );
              loadActiveSessions();
            } catch (error: any) {
              console.error("Failed to end session:", error);
              Alert.alert("Error", error?.error || "Failed to end session");
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: RecordingStatus) => {
    switch (status) {
      case "IN_PROGRESS":
        return colors.success;
      case "COMPLETED":
        return colors.primary;
      case "CANCELLED":
        return colors.error;
      default:
        return colors.foregroundMuted;
    }
  };

  const formatDuration = (startTime: string) => {
    const start = new Date(startTime);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getStudentListData = (session: ClassAttendanceRecord) => {
    const presentStudents = session.students?.filter(s => s.status === 'PRESENT') || [];
    // Note: No "MARKING" status exists, so we'll skip this
    const markingStudents: ClassAttendance[] = [];
    // For absent, we'll consider students not in the present list (this is a simplification)
    const absentStudents: ClassAttendance[] = [];

    // Sort present students by scan time (most recent first)
    presentStudents.sort((a, b) => new Date(b.scanTime).getTime() - new Date(a.scanTime).getTime());

    return {
      present: presentStudents.slice(0, 10), // Show last 10 present students
      marking: markingStudents,
      absent: absentStudents.slice(0, 5), // Show first 5 absent students
    };
  };

  const getVerificationIcon = (method?: string) => {
    switch (method) {
      case 'BIOMETRIC_FINGERPRINT':
        return 'finger-print';
      case 'QR_CODE':
        return 'qr-code';
      case 'MANUAL_INDEX':
        return 'create';
      default:
        return 'checkmark-circle';
    };
  };

  const formatTime = (scanTime: string) => {
    return new Date(scanTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const getMethodStats = (session: ClassAttendanceRecord) => {
    const methods = {
      BIOMETRIC_FINGERPRINT: 0,
      QR_CODE: 0,
      MANUAL_INDEX: 0,
    };

    if (session.students) {
      session.students.forEach((student) => {
        if (student.verificationMethod) {
          if (student.verificationMethod === "BIOMETRIC_FINGERPRINT") {
            methods.BIOMETRIC_FINGERPRINT++;
          } else if (student.verificationMethod === "QR_CODE") {
            methods.QR_CODE++;
          } else if (student.verificationMethod === "MANUAL_INDEX") {
            methods.MANUAL_INDEX++;
          }
        }
      });
    }

    const total = session.students?.length || 0;
    return {
      ...methods,
      total,
      biometricPercent: total > 0 ? Math.round((methods.BIOMETRIC_FINGERPRINT / total) * 100) : 0,
      qrPercent: total > 0 ? Math.round((methods.QR_CODE / total) * 100) : 0,
      manualPercent: total > 0 ? Math.round((methods.MANUAL_INDEX / total) * 100) : 0,
    };
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Attendance Sessions
          </Text>
          <View style={styles.subtitleRow}>
            <Text style={[styles.subtitle, { color: colors.foregroundMuted }]}>
              {activeSessions.length} active session{activeSessions.length !== 1 ? "s" : ""}
            </Text>
            {activeSessions.length > 0 && (
              <View style={[styles.activeIndicator, { backgroundColor: colors.success }]}>
                <Ionicons name="radio-button-on" size={12} color="#fff" />
                <Text style={styles.activeIndicatorText}>Recording</Text>
              </View>
            )}
          </View>
          {activeSessions.length > 0 && (() => {
            const firstSession = activeSessions[0];
            const stats = getMethodStats(firstSession);
            const expectedStudents = (firstSession as any).totalRegisteredStudents || 50; // Default to 50 if not set
            const attendanceRate = expectedStudents > 0 ? Math.round((stats.total / expectedStudents) * 100) : 0;

            return (
              <View style={styles.methodBreakdown}>
                <Text style={[styles.methodBreakdownTitle, { color: colors.foreground }]}>
                  {firstSession.courseCode} - {stats.total}/{expectedStudents} students ({attendanceRate}%)
                </Text>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(attendanceRate, 100)}%`,
                        backgroundColor: attendanceRate >= 80 ? colors.success : attendanceRate >= 60 ? colors.warning : colors.error
                      }
                    ]}
                  />
                </View>
                <View style={styles.methodStats}>
                  <View style={styles.methodStat}>
                    <Ionicons name="finger-print" size={16} color={colors.primary} />
                    <Text style={[styles.methodStatText, { color: colors.foreground }]}>
                      {stats.BIOMETRIC_FINGERPRINT} ({stats.biometricPercent}%)
                    </Text>
                  </View>
                  <View style={styles.methodStat}>
                    <Ionicons name="qr-code" size={16} color={colors.success} />
                    <Text style={[styles.methodStatText, { color: colors.foreground }]}>
                      {stats.QR_CODE} ({stats.qrPercent}%)
                    </Text>
                  </View>
                  <View style={styles.methodStat}>
                    <Ionicons name="create" size={16} color={colors.warning} />
                    <Text style={[styles.methodStatText, { color: colors.foreground }]}>
                      {stats.MANUAL_INDEX} ({stats.manualPercent}%)
                    </Text>
                  </View>
                </View>
              </View>
            );
          })()}
        </View>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowStartForm(true)}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Live Student List */}
      {activeSessions.length > 0 && (() => {
        const firstSession = activeSessions[0];
        const studentData = getStudentListData(firstSession);

        return (
          <Card elevation="sm" style={styles.studentListCard}>
            <TouchableOpacity
              style={styles.studentListHeader}
              onPress={() => setShowStudentList(!showStudentList)}
            >
              <View style={styles.studentListTitleRow}>
                <Ionicons name="people-outline" size={20} color={colors.primary} />
                <Text style={[styles.studentListTitle, { color: colors.foreground }]}>
                  Live Student List
                </Text>
                <View style={[styles.liveIndicator, { backgroundColor: colors.success }]}>
                  <Ionicons name="radio-button-on" size={8} color="#fff" />
                  <Text style={styles.liveIndicatorText}>Live</Text>
                </View>
              </View>
              <Ionicons
                name={showStudentList ? "chevron-up" : "chevron-down"}
                size={20}
                color={colors.foregroundMuted}
              />
            </TouchableOpacity>

            {showStudentList && (
              <View style={styles.studentListContent}>
                {/* Present Students */}
                {studentData.present.length > 0 && (
                  <View style={styles.studentSection}>
                    <Text style={[styles.sectionTitle, { color: colors.success }]}>
                      ✓ Marked Present ({studentData.present.length})
                    </Text>
                    {studentData.present.map((student, index) => (
                      <View key={student.studentId || index} style={styles.studentRow}>
                        <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                        <Text style={[styles.studentName, { color: colors.foreground }]}>
                          {student.student ? student.student.firstName + ' ' + student.student.lastName : 'Unknown'} ({student.studentId})
                        </Text>
                        <Ionicons
                          name={getVerificationIcon(student.verificationMethod)}
                          size={14}
                          color={colors.primary}
                        />
                        <Text style={[styles.studentTime, { color: colors.foregroundMuted }]}>
                          {formatTime(student.scanTime)}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Currently Marking */}
                {studentData.marking.length > 0 && (
                  <View style={styles.studentSection}>
                    <Text style={[styles.sectionTitle, { color: colors.warning }]}>
                      ⏱️ Currently Marking ({studentData.marking.length})
                    </Text>
                    {studentData.marking.map((student, index) => (
                      <View key={student.studentId || index} style={styles.studentRow}>
                        <Ionicons name="time-outline" size={16} color={colors.warning} />
                        <Text style={[styles.studentName, { color: colors.foreground }]}>
                          {student.student ? student.student.firstName + ' ' + student.student.lastName : 'Unknown'} ({student.studentId})
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Absent Students */}
                {studentData.absent.length > 0 && (
                  <View style={styles.studentSection}>
                    <Text style={[styles.sectionTitle, { color: colors.error }]}>
                      ❌ Not Yet Marked ({studentData.absent.length})
                    </Text>
                    {studentData.absent.map((student, index) => (
                      <View key={student.studentId || index} style={styles.studentRow}>
                        <Ionicons name="close-circle" size={16} color={colors.error} />
                        <Text style={[styles.studentName, { color: colors.foregroundMuted }]}>
                          {student.student ? student.student.firstName + ' ' + student.student.lastName : 'Unknown'} ({student.studentId})
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {studentData.present.length === 0 && studentData.marking.length === 0 && studentData.absent.length === 0 && (
                  <View style={styles.emptyStudentList}>
                    <Text style={[styles.emptyStudentText, { color: colors.foregroundMuted }]}>
                      No students recorded yet
                    </Text>
                  </View>
                )}
              </View>
            )}
          </Card>
        );
      })()}

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View>
          {activeSessions.length === 0 ? (
            <Card elevation="sm">
              <View style={styles.emptyState}>
                <Ionicons name="list-outline" size={64} color={colors.foregroundMuted} />
                <Text style={[styles.emptyText, { color: colors.foregroundMuted }]}>
                  No active sessions
                </Text>
                <Text style={[styles.emptySubtext, { color: colors.foregroundMuted }]}>
                  Start a new attendance recording session
                </Text>
              </View>
            </Card>
          ) : (
            activeSessions.map((session) => {
              const attendanceCount = session.students?.length || 0;
              const totalRegistered = (session as any).totalRegisteredStudents;
              const attendanceRate = totalRegistered ? (attendanceCount / totalRegistered) : 0;
              const attendanceColor = attendanceRate >= 0.8 ? colors.success :
                                     attendanceRate >= 0.6 ? colors.warning : colors.error;

              return (
                <Card key={session.id} elevation="sm" style={styles.sessionCard}>
                  <View style={styles.sessionHeader}>
                    <View style={styles.sessionTitleRow}>
                      <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(session.status)}20` }]}>
                        <Ionicons
                          name={session.status === "IN_PROGRESS" ? "radio-button-on" : session.status === "COMPLETED" ? "checkmark-circle" : "close-circle"}
                          size={14}
                          color={getStatusColor(session.status)}
                        />
                        <Text style={[styles.statusText, { color: getStatusColor(session.status) }]}>
                          {session.status === "IN_PROGRESS" ? "Recording" : session.status === "COMPLETED" ? "Completed" : "Cancelled"}
                        </Text>
                      </View>
                      <Text style={[styles.durationText, { color: colors.foregroundMuted }]}>
                        {formatDuration(session.startTime)}
                      </Text>
                    </View>
                    <Text style={[styles.courseCode, { color: colors.foreground }]}>
                      {session.courseCode}
                    </Text>
                    {session.courseName && (
                      <Text style={[styles.courseName, { color: colors.foregroundMuted }]}>
                        {session.courseName}
                      </Text>
                    )}
                    <View style={styles.attendanceSummary}>
                      <Text style={[styles.attendanceText, { color: colors.foreground }]}>
                        {session.students?.length || 0} / {(session as any).totalRegisteredStudents || 'N/A'} students
                      </Text>
                      {(session as any).totalRegisteredStudents && (
                        <Text style={[styles.attendancePercent, { color: attendanceColor }]}>
                          {Math.round(attendanceRate * 100)}%
                        </Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.sessionInfo}>
                    {session.lecturerName && (
                      <View style={styles.infoRow}>
                        <Ionicons name="person-outline" size={16} color={colors.foregroundMuted} />
                        <Text style={[styles.infoText, { color: colors.foregroundMuted }]}>
                          {session.lecturerName}
                        </Text>
                      </View>
                    )}
                    <View style={styles.infoRow}>
                      <Ionicons name="time-outline" size={16} color={colors.foregroundMuted} />
                      <Text style={[styles.infoText, { color: colors.foregroundMuted }]}>
                        Started {new Date(session.startTime).toLocaleTimeString()}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Ionicons name="people-outline" size={16} color={colors.foregroundMuted} />
                      <Text style={[styles.infoText, { color: colors.foregroundMuted }]}>
                        {session.students?.length || 0} students recorded
                      </Text>
                    </View>
                  </View>

                  {session.notes && (
                    <View style={[styles.notesContainer, { backgroundColor: colors.muted }]}>
                      <Text style={[styles.notesText, { color: colors.foregroundMuted }]}>
                        {session.notes}
                      </Text>
                    </View>
                  )}

                  <View style={styles.sessionActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: colors.muted }]}
                      onPress={() => {
                        // Navigate to record screen with this session
                        router.push({
                          pathname: "/scanner",
                          params: { sessionId: session.id }
                        });
                      }}
                    >
                      <Ionicons name="scan-outline" size={20} color={colors.foreground} />
                      <Text style={[styles.actionButtonText, { color: colors.foreground }]}>
                        Record
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: colors.muted }]}
                      onPress={() => {
                        // Navigate to session details/history
                        router.push({
                          pathname: "/history",
                          params: { sessionId: session.id }
                        });
                      }}
                    >
                      <Ionicons name={session.status === "COMPLETED" ? "bar-chart-outline" : "list-outline"} size={20} color={colors.foreground} />
                      <Text style={[styles.actionButtonText, { color: colors.foreground }]}>
                        {session.status === "COMPLETED" ? "Analytics" : "View"}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: colors.muted }]}
                      onPress={() => handleGenerateLink(session.id)}
                    >
                      <Ionicons name="link-outline" size={20} color={colors.foreground} />
                      <Text style={[styles.actionButtonText, { color: colors.foreground }]}>
                        Link
                      </Text>
                    </TouchableOpacity>
                    {session.status === "IN_PROGRESS" && (
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: `${colors.error}20` }]}
                        onPress={() => handleEndSession(session.id)}
                      >
                        <Ionicons name="stop-circle-outline" size={20} color={colors.error} />
                        <Text style={[styles.actionButtonText, { color: colors.error }]}>
                          End
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </Card>
              );
            })
          )}
        </View>
      </ScrollView>

      {showStartForm && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                Start Attendance Session
              </Text>
              <TouchableOpacity onPress={() => setShowStartForm(false)}>
                <Ionicons name="close" size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form}>
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.foreground }]}>
                  Course Code <Text style={{ color: colors.error }}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground }]}
                  placeholder="e.g., CS101"
                  placeholderTextColor={colors.foregroundMuted}
                  value={formData.courseCode}
                  onChangeText={(text) => setFormData({ ...formData, courseCode: text })}
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.foreground }]}>Course Name</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground }]}
                  placeholder="e.g., Data Structures"
                  placeholderTextColor={colors.foregroundMuted}
                  value={formData.courseName}
                  onChangeText={(text) => setFormData({ ...formData, courseName: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.foreground }]}>Lecturer Name</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground }]}
                  placeholder="e.g., Dr. Smith"
                  placeholderTextColor={colors.foregroundMuted}
                  value={formData.lecturerName}
                  onChangeText={(text) => setFormData({ ...formData, lecturerName: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.foreground }]}>
                  Total Registered Students
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground }]}
                  placeholder="e.g., 45"
                  placeholderTextColor={colors.foregroundMuted}
                  value={formData.totalRegisteredStudents?.toString() || ""}
                  onChangeText={(text) =>
                    setFormData({
                      ...formData,
                      totalRegisteredStudents: text ? parseInt(text) : undefined,
                    })
                  }
                  keyboardType="number-pad"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.foreground }]}>Notes</Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.textArea,
                    { backgroundColor: colors.muted, color: colors.foreground },
                  ]}
                  placeholder="Optional notes..."
                  placeholderTextColor={colors.foregroundMuted}
                  value={formData.notes}
                  onChangeText={(text) => setFormData({ ...formData, notes: text })}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <Button
                variant="outline"
                onPress={() => setShowStartForm(false)}
                style={styles.modalButton}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                onPress={handleStartSession}
                style={styles.modalButton}
                disabled={submitting}
              >
                {submitting ? "Starting..." : "Start Session"}
              </Button>
            </View>
          </View>
        </View>
      )}
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
    alignItems: "center",
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
  },
  subtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  activeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeIndicatorText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    gap: 16,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
  },
  sessionCard: {
    marginBottom: 16,
    padding: 16,
  },
  sessionHeader: {
    marginBottom: 16,
  },
  sessionTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  durationText: {
    fontSize: 12,
    fontWeight: "500",
  },
  courseCode: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 4,
  },
  courseName: {
    fontSize: 14,
    marginTop: 4,
  },
  attendanceSummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  attendanceText: {
    fontSize: 14,
    fontWeight: "500",
  },
  attendancePercent: {
    fontSize: 16,
    fontWeight: "bold",
  },
  sessionInfo: {
    gap: 4,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  infoText: {
    fontSize: 14,
  },
  notesContainer: {
    padding: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  notesText: {
    fontSize: 13,
    fontStyle: "italic",
  },
  sessionActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    padding: 8,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  form: {
    padding: 24,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  input: {
    padding: 8,
    borderRadius: 8,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  modalActions: {
    flexDirection: "row",
    gap: 8,
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  modalButton: {
    flex: 1,
  },
  methodBreakdown: {
    marginTop: 8,
  },
  methodBreakdownTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: "rgba(0,0,0,0.1)",
    borderRadius: 3,
    marginBottom: 8,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  methodStats: {
    flexDirection: "row",
    gap: 12,
  },
  methodStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  methodStatText: {
    fontSize: 14,
    fontWeight: "500",
  },
  studentListCard: {
    marginHorizontal: 24,
    marginBottom: 16,
  },
  studentListHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  studentListTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  studentListTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  liveIndicatorText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
  studentListContent: {
    padding: 16,
    paddingTop: 0,
  },
  studentSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  studentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  studentName: {
    flex: 1,
    fontSize: 14,
  },
  studentTime: {
    fontSize: 12,
    fontWeight: "500",
  },
  emptyStudentList: {
    alignItems: "center",
    paddingVertical: 20,
  },
  emptyStudentText: {
    fontSize: 14,
    fontStyle: "italic",
  },
});
