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
  ActivityIndicator,
  RefreshControl,
  Modal,
  Clipboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "@/constants/design-system";
import { useRouter } from "expo-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { classAttendanceApi } from "@/api/classAttendance";
import { useSocket } from "@/hooks/useSocket";
import type {
  ClassAttendanceRecord,
  StartSessionRequest,
  RecordingStatus,
} from "@/types";
import * as Device from "expo-device";
import { toast } from "@/utils/toast";

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
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
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
    flexWrap: "wrap",
    gap: 8,
  },
  actionButton: {
    flexBasis: "48%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    padding: 10,
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
  // Student Drawer Styles
  studentDrawer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "85%",
    paddingBottom: 20,
  },
  drawerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  drawerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  closeButton: {
    padding: 8,
  },
  drawerContent: {
    padding: 16,
  },
  studentCategory: {
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  studentItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginBottom: 8,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  studentPhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    overflow: "hidden",
  },
  studentPhotoImage: {
    width: "100%",
    height: "100%",
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  studentMeta: {
    flexDirection: "row",
    gap: 12,
  },
  verificationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  studentMetaText: {
    fontSize: 12,
  },
  studentStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  studentStatusBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  studentEmptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  studentEmptyStateText: {
    fontSize: 16,
    marginTop: 12,
  },
  // Link Modal Styles
  linkModalContent: {
    borderRadius: 16,
    width: "90%",
    maxWidth: 600,
    maxHeight: "85%",
  },
  linkModalBody: {
    padding: 20,
  },
  linkSessionInfo: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  linkSessionCode: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  linkSessionName: {
    fontSize: 16,
  },
  linkOption: {
    marginBottom: 24,
  },
  linkOptionLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  expirationButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  expirationButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: "48%",
    alignItems: "center",
  },
  expirationButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  linkInfoBox: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 8,
    gap: 10,
    alignItems: "flex-start",
  },
  linkInfoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  generatedLinkContainer: {
    gap: 16,
  },
  linkDisplayBox: {
    padding: 16,
    borderRadius: 8,
  },
  linkUrl: {
    fontSize: 14,
    lineHeight: 20,
  },
  linkSuccessBox: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    gap: 10,
  },
  linkSuccessText: {
    fontSize: 16,
    fontWeight: "600",
  },
  linkInstructions: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  endButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
  },
  endButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  hint: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
});

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
  const [submitting, setSubmitting] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedSessionForLink, setSelectedSessionForLink] = useState<ClassAttendanceRecord | null>(null);
  const [linkExpiration, setLinkExpiration] = useState("60"); // minutes
  const [generatingLink, setGeneratingLink] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [sessionToEnd, setSessionToEnd] = useState<ClassAttendanceRecord | null>(null);
  const [endingSession, setEndingSession] = useState(false);

  const loadActiveSessions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await classAttendanceApi.getActiveSessions();
      setActiveSessions(response.sessions || []);
    } catch (error: any) {
      console.error("Failed to load sessions:", error);
      toast.error(error?.error || "Failed to load sessions");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadActiveSessions();

    // Setup socket listeners
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

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadActiveSessions();
  };

  const handleStartSession = async () => {
    if (!formData.courseCode?.trim()) {
      toast.error("Course code is required");
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

      toast.success("Attendance session started successfully");
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
      toast.error(error?.error || "Failed to start session");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateLink = async () => {
    if (!selectedSessionForLink) return;
    
    try {
      setGeneratingLink(true);
      const response = await classAttendanceApi.generateAttendanceLink({
        recordId: selectedSessionForLink.id,
        expiresInMinutes: parseInt(linkExpiration),
        maxUses: 100,
      });

      setGeneratedLink(response.link.url);
    } catch (error: any) {
      console.error("Failed to generate link:", error);
      toast.error(error?.error || "Failed to generate attendance link");
    } finally {
      setGeneratingLink(false);
    }
  };

  const handleEndSession = (session: ClassAttendanceRecord) => {
    setSessionToEnd(session);
    setShowEndDialog(true);
  };

  const confirmEndSession = async () => {
    if (!sessionToEnd) return;

    try {
      setEndingSession(true);
      const response = await classAttendanceApi.endSession({ recordId: sessionToEnd.id });
      
      toast.success(
        `Session ended. Total: ${response.summary.totalRecorded}, Present: ${response.summary.presentCount}`
      );
      
      setShowEndDialog(false);
      setSessionToEnd(null);
      loadActiveSessions();
    } catch (error: any) {
      console.error("Failed to end session:", error);
      toast.error(error?.error || "Failed to end session");
    } finally {
      setEndingSession(false);
    }
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

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

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
        </View>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowStartForm(true)}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

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
              const totalRegistered = session.totalStudents;
              const attendanceRate = totalRegistered > 0 ? (attendanceCount / totalRegistered) : 0;
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
                        {session.students?.length || 0} / {session.totalStudents || 'N/A'} students
                      </Text>
                      {session.totalStudents > 0 && (
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

                  {/* 2x2 Action Grid */}
                  <View style={styles.sessionActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: colors.primary }]}
                      onPress={() => {
                        router.push({
                          pathname: "/scanner",
                          params: { sessionId: session.id }
                        });
                      }}
                    >
                      <Ionicons name="scan-outline" size={20} color="#fff" />
                      <Text style={[styles.actionButtonText, { color: "#fff" }]}>
                        Record
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: colors.muted }]}
                      onPress={() => {
                        setSelectedSessionForLink(session);
                        setGeneratedLink(null);
                        setShowLinkModal(true);
                      }}
                    >
                      <Ionicons name="link-outline" size={20} color={colors.foreground} />
                      <Text style={[styles.actionButtonText, { color: colors.foreground }]}>
                        Link
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: colors.muted }]}
                      onPress={() => {
                        router.push({
                          pathname: "/session-details" as any,
                          params: { sessionId: session.id }
                        });
                      }}
                    >
                      <Ionicons name="eye-outline" size={20} color={colors.foreground} />
                      <Text style={[styles.actionButtonText, { color: colors.foreground }]}>
                        Details
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: `${colors.foregroundMuted}20`, opacity: 0.5 }]}
                      disabled
                    >
                      <Ionicons name="pause-circle-outline" size={20} color={colors.foregroundMuted} />
                      <Text style={[styles.actionButtonText, { color: colors.foregroundMuted }]}>
                        Pause
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Full-width End Button (only for IN_PROGRESS) */}
                  {session.status === "IN_PROGRESS" && (
                    <TouchableOpacity
                      style={[
                        styles.endButton,
                        { 
                          backgroundColor: `${colors.error}20`,
                          borderColor: colors.error,
                        }
                      ]}
                      onPress={() => handleEndSession(session)}
                    >
                      <Ionicons name="stop-circle-outline" size={20} color={colors.error} />
                      <Text style={[styles.endButtonText, { color: colors.error }]}>
                        End Session
                      </Text>
                    </TouchableOpacity>
                  )}
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
                  Total Students (Optional)
                </Text>
                <Text style={[styles.hint, { color: colors.foregroundMuted }]}>
                  Set a limit on expected attendance. Leave empty for unlimited.
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

      {/* Generate Link Modal */}
      <Modal
        visible={showLinkModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLinkModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: "rgba(0, 0, 0, 0.5)" }]}>
          <View style={[styles.linkModalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                Generate Attendance Link
              </Text>
              <TouchableOpacity onPress={() => setShowLinkModal(false)}>
                <Ionicons name="close" size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.linkModalBody}>
              {selectedSessionForLink && (
                <View style={[styles.linkSessionInfo, { backgroundColor: colors.muted }]}>
                  <Text style={[styles.linkSessionCode, { color: colors.primary }]}>
                    {selectedSessionForLink.courseCode}
                  </Text>
                  <Text style={[styles.linkSessionName, { color: colors.foreground }]}>
                    {selectedSessionForLink.courseName}
                  </Text>
                </View>
              )}

              {!generatedLink ? (
                <>
                  <View style={styles.linkOption}>
                    <Text style={[styles.linkOptionLabel, { color: colors.foreground }]}>
                      Link Expiration
                    </Text>
                    <View style={styles.expirationButtons}>
                      {[
                        { label: "30 min", value: "30" },
                        { label: "1 hour", value: "60" },
                        { label: "2 hours", value: "120" },
                        { label: "Class duration", value: "180" },
                      ].map((option) => (
                        <TouchableOpacity
                          key={option.value}
                          style={[
                            styles.expirationButton,
                            {
                              backgroundColor:
                                linkExpiration === option.value
                                  ? colors.primary
                                  : colors.muted,
                            },
                          ]}
                          onPress={() => setLinkExpiration(option.value)}
                        >
                          <Text
                            style={[
                              styles.expirationButtonText,
                              {
                                color:
                                  linkExpiration === option.value
                                    ? "#fff"
                                    : colors.foreground,
                              },
                            ]}
                          >
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={[styles.linkInfoBox, { backgroundColor: colors.muted }]}>
                    <Ionicons name="information-circle" size={20} color={colors.primary} />
                    <Text style={[styles.linkInfoText, { color: colors.foreground }]}>
                      Students will use this link to mark their attendance without scanning QR codes
                    </Text>
                  </View>
                </>
              ) : (
                <View style={styles.generatedLinkContainer}>
                  <View style={[styles.linkDisplayBox, { backgroundColor: colors.muted }]}>
                    <Text style={[styles.linkUrl, { color: colors.foreground }]}>
                      {generatedLink}
                    </Text>
                  </View>

                  <View style={[styles.linkSuccessBox, { backgroundColor: `${colors.success}20` }]}>
                    <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                    <Text style={[styles.linkSuccessText, { color: colors.success }]}>
                      Link generated successfully!
                    </Text>
                  </View>

                  <Text style={[styles.linkInstructions, { color: colors.foregroundMuted }]}>
                    Share this link with your students via WhatsApp, email, or display it on the projector
                  </Text>
                </View>
              )}
            </ScrollView>

            <View style={[styles.modalActions, { borderTopColor: colors.border }]}>
              {!generatedLink ? (
                <>
                  <Button
                    variant="outline"
                    onPress={() => setShowLinkModal(false)}
                    style={styles.modalButton}
                    disabled={generatingLink}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="default"
                    onPress={handleGenerateLink}
                    style={styles.modalButton}
                    disabled={generatingLink}
                  >
                    {generatingLink ? "Generating..." : "Generate Link"}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onPress={() => {
                      setShowLinkModal(false);
                      setGeneratedLink(null);
                    }}
                    style={styles.modalButton}
                  >
                    Done
                  </Button>
                  <Button
                    variant="default"
                    onPress={() => {
                      if (generatedLink) {
                        Clipboard.setString(generatedLink);
                        toast.success("Link copied to clipboard");
                      }
                    }}
                    style={styles.modalButton}
                  >
                    Copy Link
                  </Button>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* End Session Dialog */}
      {sessionToEnd && (
        <Dialog
          visible={showEndDialog}
          onClose={() => {
            setShowEndDialog(false);
            setSessionToEnd(null);
          }}
          title="End Attendance Session"
          message={`Are you sure you want to end this session?\n\nCourse: ${sessionToEnd.courseCode}${sessionToEnd.courseName ? ` - ${sessionToEnd.courseName}` : ""}\nDuration: ${formatDuration(sessionToEnd.startTime)}\nStudents Recorded: ${sessionToEnd.students?.length || 0}\n\nThis action cannot be undone.`}
          variant="warning"
          icon="stop-circle-outline"
          primaryAction={{
            label: endingSession ? "Ending..." : "End Session",
            onPress: confirmEndSession,
          }}
          secondaryAction={{
            label: "Cancel",
            onPress: () => {
              setShowEndDialog(false);
              setSessionToEnd(null);
            },
          }}
        />
      )}
    </SafeAreaView>
  );
}
