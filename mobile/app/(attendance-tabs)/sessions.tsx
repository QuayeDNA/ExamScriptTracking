/**
 * Attendance Sessions Screen
 * View active session and completed sessions history
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
  Alert,
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
import CreateSessionDrawer from "@/components/CreateSessionDrawer";
import TemplateSelector from "@/components/TemplateSelector";
import GenerateLinkDrawer from "@/components/GenerateLinkDrawer";
import type {
  AttendanceSession,
} from "@/types";
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
  templateButton: {
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
    width: "100%",
    maxHeight: "90%",
    flex: 1,
  },
  linkModalBody: {
    padding: 20,
    paddingBottom: 100, // Add padding to prevent content from going behind buttons
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
  securitySection: {
    borderRadius: 8,
    gap: 16,
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  settingInfo: {
    flex: 1,
    gap: 4,
    paddingRight: 8,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: "500",
  },
  settingDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  radiusInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  radiusInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    fontWeight: "600",
    minWidth: 70,
    textAlign: "center",
  },
  radiusUnit: {
    fontSize: 13,
    fontWeight: "500",
  },
  radiusHint: {
    fontSize: 12,
    marginTop: 4,
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
  const [activeSessions, setActiveSessions] = useState<AttendanceSession[]>([]);
  const [completedSessions, setCompletedSessions] = useState<
    AttendanceSession[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedSessionForLink, setSelectedSessionForLink] =
    useState<AttendanceSession | null>(null);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [sessionToEnd, setSessionToEnd] = useState<AttendanceSession | null>(
    null
  );
  const [endingSession, setEndingSession] = useState(false);

  // Delete session states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [sessionToDelete, setSessionToDelete] =
    useState<AttendanceSession | null>(null);
  const [deletingSession, setDeletingSession] = useState(false);

  // Save template states
  const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false);
  const [sessionToSaveAsTemplate, setSessionToSaveAsTemplate] =
    useState<AttendanceSession | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);

  const loadActiveSessions = useCallback(async () => {
    try {
      setLoading(true);
      const [activeResponse, historyResponse] = await Promise.all([
        classAttendanceApi.getActiveSessions(),
        classAttendanceApi.getAttendanceHistory({ limit: 10 }),
      ]);

      // Set active sessions - ensure it's always an array
      setActiveSessions(Array.isArray(activeResponse) ? activeResponse : []);

      // Set completed sessions from history - ensure it's always an array
      setCompletedSessions(Array.isArray(historyResponse?.sessions) ? historyResponse.sessions : []);
    } catch (error: any) {
      console.error("Failed to load sessions:", error);
      toast.error(error?.error || "Failed to load sessions");
      // Set empty arrays on error to prevent crashes
      setActiveSessions([]);
      setCompletedSessions([]);
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
    unsubscribers.push(
      socket.on("attendance:sessionStarted", (data: unknown) => {
        const typedData = data as { data: AttendanceSession };
        console.log("Session started:", typedData);
        setActiveSessions((prev) => [typedData.data, ...prev]);
      })
    );

    // Listen for session ended events
    unsubscribers.push(
      socket.on("attendance:sessionEnded", (data: unknown) => {
        const typedData = data as { data: AttendanceSession };
        console.log("Session ended:", typedData);
        setActiveSessions((prev) =>
          prev.filter((s) => s.id !== typedData.data.id)
        );
        // Add to completed sessions
        setCompletedSessions((prev) => [typedData.data, ...prev]);
      })
    );

    // Listen for attendance recorded events
    unsubscribers.push(
      socket.on("attendance:recorded", (data: unknown) => {
        const typedData = data as { data: any };
        console.log("Attendance recorded:", typedData);
        // Update the session in active sessions if it exists
        setActiveSessions((prev) =>
          prev.map((session) =>
            session.id === typedData.data.sessionId
              ? {
                  ...session,
                  attendance: [...(session.attendance || []), typedData.data],
                }
              : session
          )
        );
      })
    );

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadActiveSessions();
  };



  const handleEndSession = (session: AttendanceSession) => {
    setSessionToEnd(session);
    setShowEndDialog(true);
  };

  const handlePauseResumeSession = async (session: AttendanceSession) => {
    const isPaused = session.status === 'PAUSED';
    const action = isPaused ? 'resume' : 'pause';
    
    Alert.alert(
      isPaused ? 'Resume Session' : 'Pause Session',
      `Are you sure you want to ${action} this session?\n\nCourse: ${session.courseCode}`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: isPaused ? 'Resume' : 'Pause',
          onPress: async () => {
            try {
              if (isPaused) {
                await classAttendanceApi.resumeSession(session.id);
                toast.success('Session resumed successfully');
              } else {
                await classAttendanceApi.pauseSession(session.id);
                toast.success('Session paused successfully');
              }
              loadActiveSessions();
            } catch (error: any) {
              console.error(`Failed to ${action} session:`, error);
              toast.error(error?.error || `Failed to ${action} session`);
            }
          },
        },
      ]
    );
  };

  const confirmEndSession = async () => {
    if (!sessionToEnd) return;

    try {
      setEndingSession(true);
      await classAttendanceApi.endSession(sessionToEnd.id);

      toast.success(`Session ended successfully`);

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

  const handleDeleteSession = (session: AttendanceSession) => {
    setSessionToDelete(session);
    setShowDeleteDialog(true);
  };

  const handleSaveAsTemplate = async (session: AttendanceSession) => {
    setSessionToSaveAsTemplate(session);
    setTemplateName(`${session.courseCode} Template`);
    setShowSaveTemplateDialog(true);
  };

  const confirmSaveTemplate = async () => {
    if (!sessionToSaveAsTemplate) return;

    if (!templateName?.trim()) {
      toast.error("Template name is required");
      return;
    }

    try {
      setSavingTemplate(true);
      await classAttendanceApi.saveSessionTemplate({
        name: templateName.trim(),
        courseCode: sessionToSaveAsTemplate.courseCode,
        courseName: sessionToSaveAsTemplate.courseName,
        venue: sessionToSaveAsTemplate.venue,
        expectedStudentCount: sessionToSaveAsTemplate.expectedStudentCount,
      });

      toast.success(`Template "${templateName}" saved successfully`);
      setShowSaveTemplateDialog(false);
      setSessionToSaveAsTemplate(null);
      setTemplateName("");
    } catch (error: any) {
      console.error("Failed to save template:", error);
      toast.error(error?.error || "Failed to save template");
    } finally {
      setSavingTemplate(false);
    }
  };

  const confirmDeleteSession = async () => {
    if (!sessionToDelete) return;

    try {
      setDeletingSession(true);
      await classAttendanceApi.deleteSession(sessionToDelete.id);

      toast.success(`Session deleted: ${sessionToDelete.courseCode}`);

      setShowDeleteDialog(false);
      setSessionToDelete(null);
      loadActiveSessions();
    } catch (error: any) {
      console.error("Failed to delete session:", error);
      toast.error(error?.error || "Failed to delete session");
    } finally {
      setDeletingSession(false);
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

  const renderSessionCard = (session: AttendanceSession, isActive: boolean) => {
    const attendanceCount = session.attendance?.length || 0;
    const totalExpected = session.expectedStudentCount || 0;
    const attendanceRate =
      totalExpected > 0 ? attendanceCount / totalExpected : 0;
    const attendanceColor =
      attendanceRate >= 0.8
        ? colors.success
        : attendanceRate >= 0.6
          ? colors.warning
          : colors.error;

    return (
      <Card
        key={session.id}
        elevation="sm"
        style={{ padding: isActive ? 16 : 12 }}
      >
        {isActive ? (
          // Active session - full detailed card
          <>
            <View style={{ marginBottom: 16 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 12,
                }}
              >
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text
                    style={{
                      fontSize: 22,
                      fontWeight: "bold",
                      color: colors.foreground,
                      marginBottom: 4,
                    }}
                  >
                    {session.courseCode}
                  </Text>
                  {session.courseName && (
                    <Text
                      style={{ fontSize: 15, color: colors.foregroundMuted }}
                    >
                      {session.courseName}
                    </Text>
                  )}
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { 
                      backgroundColor: session.status === 'PAUSED' 
                        ? `${colors.warning}20` 
                        : `${colors.success}20` 
                    },
                  ]}
                >
                  <Ionicons
                    name={session.status === 'PAUSED' 
                      ? "pause-circle" 
                      : "radio-button-on"}
                    size={14}
                    color={session.status === 'PAUSED' 
                      ? colors.warning 
                      : colors.success}
                  />
                  <Text style={[
                    styles.statusText, 
                    { 
                      color: session.status === 'PAUSED' 
                        ? colors.warning 
                        : colors.success 
                    }
                  ]}>
                    {session.status === 'PAUSED' ? 'PAUSED' : session.status}
                  </Text>
                </View>
              </View>

              {/* Attendance Summary */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  backgroundColor: colors.muted,
                  padding: 12,
                  borderRadius: 12,
                  marginBottom: 12,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 13,
                      color: colors.foregroundMuted,
                      marginBottom: 4,
                    }}
                  >
                    Attendance
                  </Text>
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "bold",
                      color: colors.foreground,
                    }}
                  >
                    {attendanceCount} / {totalExpected || "N/A"} students
                  </Text>
                </View>
                {totalExpected > 0 && (
                  <View style={{ alignItems: "flex-end" }}>
                    <Text
                      style={{
                        fontSize: 28,
                        fontWeight: "bold",
                        color: attendanceColor,
                      }}
                    >
                      {Math.round(attendanceRate * 100)}%
                    </Text>
                  </View>
                )}
              </View>

              {/* Session Info */}
              <View style={{ gap: 8 }}>
                {session.venue && (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Ionicons
                      name="location-outline"
                      size={16}
                      color={colors.foregroundMuted}
                    />
                    <Text
                      style={{ fontSize: 14, color: colors.foregroundMuted }}
                    >
                      {session.venue}
                    </Text>
                  </View>
                )}
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <Ionicons
                    name="time-outline"
                    size={16}
                    color={colors.foregroundMuted}
                  />
                  <Text style={{ fontSize: 14, color: colors.foregroundMuted }}>
                    Duration: {formatDuration(session.startTime)}
                  </Text>
                </View>
              </View>
            </View>
          </>
        ) : (
          // Completed session - compact card
          <View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "bold",
                    color: colors.foreground,
                    marginBottom: 2,
                  }}
                >
                  {session.courseCode}
                </Text>
                {session.courseName && (
                  <Text style={{ fontSize: 13, color: colors.foregroundMuted }}>
                    {session.courseName}
                  </Text>
                )}
              </View>
              {totalExpected > 0 && (
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "bold",
                    color: attendanceColor,
                  }}
                >
                  {Math.round(attendanceRate * 100)}%
                </Text>
              )}
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
              >
                <Ionicons
                  name="people-outline"
                  size={14}
                  color={colors.foregroundMuted}
                />
                <Text style={{ fontSize: 12, color: colors.foregroundMuted }}>
                  {attendanceCount}/{totalExpected || 0}
                </Text>
              </View>
              <Text style={{ fontSize: 12, color: colors.foregroundMuted }}>
                {new Date(session.startTime).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </Text>
            </View>
          </View>
        )}

        {/* Actions */}
        {isActive ? (
          // Active session actions
          <View style={{ gap: 8 }}>
            {/* First Row: Record and Details */}
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  backgroundColor: colors.primary,
                  padding: 12,
                  borderRadius: 12,
                }}
                onPress={() => {
                  router.push({
                    pathname: "/scanner",
                    params: { sessionId: session.id },
                  });
                }}
              >
                <Ionicons name="scan-outline" size={20} color="#fff" />
                <Text
                  style={{ fontSize: 15, fontWeight: "600", color: "#fff" }}
                >
                  Record
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  backgroundColor: colors.muted,
                  padding: 12,
                  borderRadius: 12,
                }}
                onPress={() => {
                  router.push({
                    pathname: "/session-details" as any,
                    params: { sessionId: session.id },
                  });
                }}
              >
                <Ionicons
                  name="eye-outline"
                  size={20}
                  color={colors.foreground}
                />
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "600",
                    color: colors.foreground,
                  }}
                >
                  Details
                </Text>
              </TouchableOpacity>
            </View>

            {/* Second Row: Link and Pause/Resume */}
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  backgroundColor: `${colors.primary}20`,
                  borderWidth: 1,
                  borderColor: colors.primary,
                  padding: 12,
                  borderRadius: 12,
                }}
                onPress={() => {
                  setSelectedSessionForLink(session);
                  setShowLinkModal(true);
                }}
              >
                <Ionicons
                  name="link-outline"
                  size={20}
                  color={colors.primary}
                />
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "600",
                    color: colors.primary,
                  }}
                >
                  Link
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  backgroundColor: session.status === 'PAUSED' 
                    ? `${colors.success}20` 
                    : `${colors.warning}20`,
                  borderWidth: 1,
                  borderColor: session.status === 'PAUSED' 
                    ? colors.success 
                    : colors.warning,
                  padding: 12,
                  borderRadius: 12,
                }}
                onPress={() => handlePauseResumeSession(session)}
              >
                <Ionicons
                  name={session.status === 'PAUSED' 
                    ? "play-circle-outline" 
                    : "pause-circle-outline"}
                  size={20}
                  color={session.status === 'PAUSED' 
                    ? colors.success 
                    : colors.warning}
                />
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "600",
                    color: session.status === 'PAUSED' 
                      ? colors.success 
                      : colors.warning,
                  }}
                >
                  {session.status === 'PAUSED' ? 'Resume' : 'Pause'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Third Row: Save Template and End Session */}
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  backgroundColor: `${colors.primary}20`,
                  borderWidth: 1,
                  borderColor: colors.primary,
                  padding: 12,
                  borderRadius: 12,
                }}
                onPress={() => handleSaveAsTemplate(session)}
              >
                <Ionicons
                  name="bookmark-outline"
                  size={20}
                  color={colors.primary}
                />
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "600",
                    color: colors.primary,
                  }}
                >
                  Save Template
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  backgroundColor: `${colors.error}15`,
                  borderWidth: 1,
                  borderColor: colors.error,
                  padding: 12,
                  borderRadius: 12,
                }}
                onPress={() => handleEndSession(session)}
              >
                <Ionicons
                  name="stop-circle-outline"
                  size={20}
                  color={colors.error}
                />
                <Text
                  style={{ fontSize: 15, fontWeight: "600", color: colors.error }}
                >
                  End Session
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // Completed session actions - view and delete
          <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                backgroundColor: colors.muted,
                padding: 10,
                borderRadius: 10,
              }}
              onPress={() => {
                router.push({
                  pathname: "/session-details" as any,
                  params: { sessionId: session.id },
                });
              }}
            >
              <Ionicons
                name="eye-outline"
                size={18}
                color={colors.foreground}
              />
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: colors.foreground,
                }}
              >
                View
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                width: 44,
                height: 44,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: `${colors.error}15`,
                borderWidth: 1,
                borderColor: colors.error,
                borderRadius: 10,
              }}
              onPress={() => handleDeleteSession(session)}
            >
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            </TouchableOpacity>
          </View>
        )}
      </Card>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Sessions
          </Text>
          <View style={styles.subtitleRow}>
            {activeSessions.length > 0 ? (
              <>
                <View
                  style={[
                    styles.activeIndicator,
                    { backgroundColor: colors.success },
                  ]}
                >
                  <Ionicons name="radio-button-on" size={12} color="#fff" />
                  <Text style={styles.activeIndicatorText}>
                    {activeSessions.length} Recording
                  </Text>
                </View>
                <Text
                  style={[styles.subtitle, { color: colors.foregroundMuted }]}
                >
                  {activeSessions.length === 1
                    ? activeSessions[0].courseCode
                    : `${activeSessions.length} sessions`}
                </Text>
              </>
            ) : (
              <Text
                style={[styles.subtitle, { color: colors.foregroundMuted }]}
              >
                No active sessions
              </Text>
            )}
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            style={[styles.templateButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowTemplateSelector(true)}
          >
            <Ionicons name="bookmarks" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowCreateDrawer(true)}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
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
        {/* Global Empty State - Show only if no active sessions AND no completed sessions */}
        {activeSessions.length === 0 && completedSessions.length === 0 ? (
          <Card elevation="sm">
            <View style={styles.emptyState}>
              <Ionicons
                name="calendar-outline"
                size={80}
                color={colors.foregroundMuted}
              />
              <Text style={[styles.emptyText, { color: colors.foreground }]}>
                No sessions yet
              </Text>
              <Text
                style={[
                  styles.emptySubtext,
                  { color: colors.foregroundMuted, marginBottom: 16 },
                ]}
              >
                Start recording attendance to see your sessions here
              </Text>
              <Button
                variant="default"
                onPress={() => setShowCreateDrawer(true)}
                style={{ paddingHorizontal: 24 }}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={20}
                  color="#fff"
                  style={{ marginRight: 8 }}
                />
                Start New Session
              </Button>
            </View>
          </Card>
        ) : (
          <View style={{ gap: 24 }}>
            {/* Active Sessions Section */}
            <View>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <Ionicons
                  name="radio-button-on"
                  size={20}
                  color={
                    activeSessions.length > 0
                      ? colors.success
                      : colors.foregroundMuted
                  }
                />
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "bold",
                    color: colors.foreground,
                  }}
                >
                  Active Sessions ({activeSessions.length})
                </Text>
              </View>
              {activeSessions.length > 0 ? (
                <View style={{ gap: 12 }}>
                  {activeSessions.map((session) =>
                    renderSessionCard(session, true)
                  )}
                </View>
              ) : (
                <Card elevation="sm">
                  <View style={{ alignItems: "center", paddingVertical: 32 }}>
                    <Ionicons
                      name="pause-circle-outline"
                      size={48}
                      color={colors.foregroundMuted}
                    />
                    <Text
                      style={{
                        fontSize: 15,
                        color: colors.foregroundMuted,
                        marginTop: 8,
                        marginBottom: 12,
                      }}
                    >
                      No active sessions
                    </Text>
                    <Button
                      variant="default"
                      onPress={() => setShowCreateDrawer(true)}
                      style={{ paddingHorizontal: 20 }}
                    >
                      <Ionicons
                        name="add-circle-outline"
                        size={18}
                        color="#fff"
                        style={{ marginRight: 6 }}
                      />
                      Start Session
                    </Button>
                  </View>
                </Card>
              )}
            </View>

            {/* Completed Sessions History */}
            {completedSessions.length > 0 && (
              <View>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 12,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Ionicons
                      name="time-outline"
                      size={20}
                      color={colors.foregroundMuted}
                    />
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: "bold",
                        color: colors.foreground,
                      }}
                    >
                      Session History
                    </Text>
                  </View>
                  <Text style={{ fontSize: 14, color: colors.foregroundMuted }}>
                    {completedSessions.length} session
                    {completedSessions.length !== 1 ? "s" : ""}
                  </Text>
                </View>
                <View style={{ gap: 12 }}>
                  {completedSessions.map((session) =>
                    renderSessionCard(session, false)
                  )}
                </View>
              </View>
            )}

            {/* Empty History State - Show only if active session exists but no history */}
            {activeSessions.length > 0 && completedSessions.length === 0 && (
              <View>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 12,
                  }}
                >
                  <Ionicons
                    name="time-outline"
                    size={20}
                    color={colors.foregroundMuted}
                  />
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "bold",
                      color: colors.foreground,
                    }}
                  >
                    Session History
                  </Text>
                </View>
                <Card elevation="sm">
                  <View style={[styles.emptyState, { paddingVertical: 40 }]}>
                    <Ionicons
                      name="archive-outline"
                      size={48}
                      color={colors.foregroundMuted}
                    />
                    <Text
                      style={[
                        styles.emptyText,
                        { color: colors.foregroundMuted, fontSize: 16 },
                      ]}
                    >
                      No completed sessions yet
                    </Text>
                    <Text
                      style={[
                        styles.emptySubtext,
                        { color: colors.foregroundMuted },
                      ]}
                    >
                      Completed sessions will appear here
                    </Text>
                  </View>
                </Card>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Generate Link Drawer */}
      <GenerateLinkDrawer
        visible={showLinkModal}
        session={selectedSessionForLink}
        onClose={() => {
          setShowLinkModal(false);
          setSelectedSessionForLink(null);
        }}
        onLinkGenerated={(link) => {
          toast.success(`Link generated: ${link.url || link.token}`);
        }}
      />

      {/* End Session Dialog */}
      {sessionToEnd && (
        <Dialog
          visible={showEndDialog}
          onClose={() => {
            setShowEndDialog(false);
            setSessionToEnd(null);
          }}
          title="End Attendance Session"
          message={`Are you sure you want to end this session?\n\nCourse: ${sessionToEnd.courseCode}${sessionToEnd.courseName ? ` - ${sessionToEnd.courseName}` : ""}\nDuration: ${formatDuration(sessionToEnd.startTime)}\nStudents Recorded: ${sessionToEnd.attendance?.length || 0}\n\nThis action cannot be undone.`}
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

      {/* Delete Session Dialog */}
      {sessionToDelete && (
        <Dialog
          visible={showDeleteDialog}
          onClose={() => {
            setShowDeleteDialog(false);
            setSessionToDelete(null);
          }}
          title="Delete Attendance Session"
          message={`Are you sure you want to permanently delete this session?\n\nCourse: ${sessionToDelete.courseCode}${sessionToDelete.courseName ? ` - ${sessionToDelete.courseName}` : ""}\nStudents Recorded: ${sessionToDelete.attendance?.length || 0}\n\nThis will delete:\n• All attendance records\n• All attendance links\n• Session history\n\nThis action CANNOT be undone!`}
          variant="error"
          icon="trash-outline"
          primaryAction={{
            label: deletingSession ? "Deleting..." : "Delete Session",
            onPress: confirmDeleteSession,
          }}
          secondaryAction={{
            label: "Cancel",
            onPress: () => {
              setShowDeleteDialog(false);
              setSessionToDelete(null);
            },
          }}
        />
      )}

      {/* Save Template Dialog */}
      {sessionToSaveAsTemplate && (
        <Modal
          visible={showSaveTemplateDialog}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setShowSaveTemplateDialog(false);
            setSessionToSaveAsTemplate(null);
            setTemplateName("");
          }}
        >
          <View style={styles.modalOverlay}>
            <Card
              elevation="lg"
              style={{
                margin: 20,
                padding: 20,
                backgroundColor: colors.background,
              }}
            >
              <View style={{ gap: 16 }}>
                <View style={{ gap: 8 }}>
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: "bold",
                      color: colors.foreground,
                    }}
                  >
                    Save as Template
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      color: colors.foregroundMuted,
                    }}
                  >
                    Course: {sessionToSaveAsTemplate.courseCode}
                  </Text>
                </View>

                <View style={styles.formGroup}>
                  <Text
                    style={[
                      styles.label,
                      { color: colors.foreground },
                    ]}
                  >
                    Template Name
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.muted,
                        color: colors.foreground,
                      },
                    ]}
                    value={templateName}
                    onChangeText={setTemplateName}
                    placeholder="Enter template name"
                    placeholderTextColor={colors.foregroundMuted}
                    autoFocus
                  />
                </View>

                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Button
                    variant="outline"
                    onPress={() => {
                      setShowSaveTemplateDialog(false);
                      setSessionToSaveAsTemplate(null);
                      setTemplateName("");
                    }}
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="default"
                    onPress={confirmSaveTemplate}
                    disabled={savingTemplate || !templateName.trim()}
                    style={{ flex: 1 }}
                  >
                    {savingTemplate ? "Saving..." : "Save Template"}
                  </Button>
                </View>
              </View>
            </Card>
          </View>
        </Modal>
      )}

      {/* Create Session Drawer */}
      <CreateSessionDrawer
        visible={showCreateDrawer}
        onClose={() => setShowCreateDrawer(false)}
        onSuccess={(session) => {
          setActiveSessions(prev => [session, ...prev]);
          loadActiveSessions();
        }}
      />

      {/* Template Selector */}
      <TemplateSelector
        visible={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
        onSelectTemplate={(session) => {
          setActiveSessions(prev => [session, ...prev]);
          loadActiveSessions();
        }}
      />
    </SafeAreaView>
  );
}
