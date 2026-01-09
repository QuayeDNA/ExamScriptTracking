/**
 * Session Details Screen
 * Comprehensive view of a specific attendance session
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "@/constants/design-system";
import { classAttendanceApi } from "@/api/classAttendance";
import { AttendanceSession, StudentAttendance, AttendanceLink, AttendanceStatus, SessionStatus } from "@/types";
import { useSocket } from "@/hooks/useSocket";
import { getFileUrl } from "@/lib/api-client";
import { toast } from "@/utils/toast";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Dialog } from "@/components/ui/dialog";
import GenerateLinkDrawer from "@/components/GenerateLinkDrawer";
// File export will use Share API for React Native

export default function SessionDetailsScreen() {
  const colors = useThemeColors();
  const socket = useSocket();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  
  const [session, setSession] = useState<AttendanceSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingSession, setDeletingSession] = useState(false);
  const [showLinkDrawer, setShowLinkDrawer] = useState(false);
  const [activeLinks, setActiveLinks] = useState<AttendanceLink[]>([]);
  const [loadingLinks, setLoadingLinks] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selectedAttendanceIds, setSelectedAttendanceIds] = useState<string[]>([]);
  const [showBulkConfirmDialog, setShowBulkConfirmDialog] = useState(false);
  const [bulkConfirming, setBulkConfirming] = useState(false);
  const [showUpdateStatusDialog, setShowUpdateStatusDialog] = useState(false);
  const [attendanceToUpdate, setAttendanceToUpdate] = useState<StudentAttendance | null>(null);
  const [newStatus, setNewStatus] = useState<AttendanceStatus>(AttendanceStatus.PRESENT);

  const loadActiveLinks = useCallback(async (sessionId: string) => {
    try {
      setLoadingLinks(true);
      const links = await classAttendanceApi.getActiveLinks(sessionId);
      setActiveLinks(links);
    } catch (error: any) {
      console.error("Failed to load active links:", error);
    } finally {
      setLoadingLinks(false);
    }
  }, []);

  const loadSessionDetails = useCallback(async () => {
    if (!sessionId) return;
    
    try {
      setLoading(true);
      // Fetch specific session by ID using correct endpoint
      const response = await classAttendanceApi.getSessionDetails(sessionId);
      console.log("Session response:", JSON.stringify(response, null, 2));
      
      // Handle response - ensure arrays are initialized
      if (response && response.id) {
        const sessionData: AttendanceSession = {
          ...response,
          attendance: Array.isArray(response.attendance) ? response.attendance : [],
          assistants: Array.isArray(response.assistants) ? response.assistants : [],
          links: Array.isArray(response.links) ? response.links : [],
        };
        setSession(sessionData);
        
        // Load active links if session is active
        if (sessionData.status === SessionStatus.IN_PROGRESS) {
          loadActiveLinks(sessionData.id);
        }
      } else {
        console.error("Invalid response structure:", response);
        setSession(null);
      }
    } catch (error) {
      console.error("Failed to load session details:", error);
      setSession(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sessionId, loadActiveLinks]);

  useEffect(() => {
    loadSessionDetails();
  }, [loadSessionDetails]);

  // Socket listeners for real-time updates
  useEffect(() => {
    if (!sessionId) return;

    const unsubscribers: (() => void)[] = [];

    unsubscribers.push(socket.on("attendance:recorded", (data: unknown) => {
      const typedData = data as { data: StudentAttendance };
      // Update session attendance list
      setSession(prev => {
        if (!prev || typedData.data.sessionId !== sessionId) return prev;
        return {
          ...prev,
          attendance: [...(prev.attendance || []), typedData.data]
        };
      });
    }));

    unsubscribers.push(socket.on("attendance:sessionEnded", (data: unknown) => {
      const typedData = data as { data: AttendanceSession };
      if (typedData.data.id === sessionId) {
        setSession(typedData.data);
      }
    }));

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [sessionId, socket]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadSessionDetails();
  };

  const handleExportSession = async () => {
    if (!session) return;

    try {
      setExporting(true);
      const blob = await classAttendanceApi.exportSession(session.id);
      
      // Convert blob to text
      const text = await blob.text();
      
      // Share the CSV content
      try {
        await Share.share({
          message: text,
          title: `Attendance Export - ${session.courseCode}`,
        });
        toast.success("Attendance data exported successfully");
      } catch {
        // If sharing fails, show the content in an alert (fallback)
        Alert.alert(
          "Export Complete",
          "CSV data ready. Please use the share dialog to save or send the file.",
          [{ text: "OK" }]
        );
      }
    } catch (error: any) {
      console.error("Failed to export session:", error);
      toast.error(error?.error || "Failed to export session");
    } finally {
      setExporting(false);
    }
  };

  const handlePauseResumeSession = async () => {
    if (!session) return;
    
    const isPaused = session.status === 'PAUSED';
    const action = isPaused ? 'resume' : 'pause';
    
    Alert.alert(
      isPaused ? 'Resume Session' : 'Pause Session',
      `Are you sure you want to ${action} this session?`,
      [
        { text: 'Cancel', style: 'cancel' },
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
              loadSessionDetails();
            } catch (error: any) {
              console.error(`Failed to ${action} session:`, error);
              toast.error(error?.error || `Failed to ${action} session`);
            }
          },
        },
      ]
    );
  };

  const handleRevokeLink = async (linkToken: string) => {
    Alert.alert(
      "Revoke Link",
      "Are you sure you want to revoke this link? Students will no longer be able to use it.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Revoke",
          style: "destructive",
          onPress: async () => {
            try {
              await classAttendanceApi.revokeLink(linkToken);
              toast.success("Link revoked successfully");
              if (session) {
                loadActiveLinks(session.id);
              }
            } catch (error: any) {
              console.error("Failed to revoke link:", error);
              toast.error(error?.error || "Failed to revoke link");
            }
          },
        },
      ]
    );
  };

  const handleBulkConfirm = async (confirm: boolean) => {
    if (!session || selectedAttendanceIds.length === 0) return;

    try {
      setBulkConfirming(true);
      await classAttendanceApi.bulkConfirmAttendance(session.id, {
        attendanceIds: selectedAttendanceIds,
        confirm,
      });
      
      toast.success(
        confirm 
          ? `${selectedAttendanceIds.length} attendance records confirmed`
          : `${selectedAttendanceIds.length} attendance records rejected`
      );
      
      setSelectedAttendanceIds([]);
      setShowBulkConfirmDialog(false);
      loadSessionDetails();
    } catch (error: any) {
      console.error("Failed to bulk confirm:", error);
      toast.error(error?.error || "Failed to update attendance");
    } finally {
      setBulkConfirming(false);
    }
  };

  const handleUpdateAttendanceStatus = async () => {
    if (!attendanceToUpdate) return;

    try {
      await classAttendanceApi.updateAttendanceStatus(attendanceToUpdate.id, {
        status: newStatus,
      });
      
      toast.success("Attendance status updated");
      setShowUpdateStatusDialog(false);
      setAttendanceToUpdate(null);
      loadSessionDetails();
    } catch (error: any) {
      console.error("Failed to update attendance:", error);
      toast.error(error?.error || "Failed to update attendance");
    }
  };

  const handleDeleteAttendance = async (attendanceId: string) => {
    Alert.alert(
      "Delete Attendance Record",
      "Are you sure you want to delete this attendance record? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await classAttendanceApi.deleteAttendance(attendanceId);
              toast.success("Attendance record deleted");
              loadSessionDetails();
            } catch (error: any) {
              console.error("Failed to delete attendance:", error);
              toast.error(error?.error || "Failed to delete attendance");
            }
          },
        },
      ]
    );
  };

  const handleDeleteSession = async () => {
    if (!session) return;

    try {
      setDeletingSession(true);
      await classAttendanceApi.deleteSession(session.id);
      
      toast.success(
        `Session deleted: ${session.courseCode}`
      );
      
      setShowDeleteDialog(false);
      router.back();
    } catch (error: any) {
      console.error("Failed to delete session:", error);
      toast.error(error?.error || "Failed to delete session");
      setDeletingSession(false);
    }
  };

  const getVerificationIcon = (method: string) => {
    switch (method?.toUpperCase()) {
      case "QR_CODE": return "qr-code";
      case "MANUAL_INDEX": return "create-outline";
      case "BIOMETRIC_FINGERPRINT": return "finger-print";
      case "BIOMETRIC_FACE": return "camera-outline";
      default: return "help-circle-outline";
    }
  };

  const getVerificationLabel = (method: string) => {
    switch (method?.toUpperCase()) {
      case "QR_CODE": return "QR Scan";
      case "MANUAL_INDEX": return "Manual Entry";
      case "BIOMETRIC_FINGERPRINT": return "Fingerprint";
      case "BIOMETRIC_FACE": return "Face Recognition";
      default: return method || "Unknown";
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDuration = (startTime: string) => {
    const start = new Date(startTime);
    const now = new Date();
    const diff = now.getTime() - start.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.foreground }]}>Session Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.foreground }]}>Session Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.foreground }]}>Session not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const students = session.attendance || [];
  const totalRecorded = students.length;
  const presentStudents = students.filter((s: StudentAttendance) => s.status === "PRESENT");
  const lateStudents = students.filter((s: StudentAttendance) => s.status === "LATE");
  const excusedStudents = students.filter((s: StudentAttendance) => s.status === "EXCUSED");
  const pendingConfirmations = students.filter((s: StudentAttendance) => s.requiresConfirmation && !s.confirmedAt);
  const totalExpected = session.expectedStudentCount || 0;
  const attendancePercentage = totalExpected > 0 ? Math.round((totalRecorded / totalExpected) * 100) : 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Session Details</Text>
        <TouchableOpacity 
          onPress={() => setShowDeleteDialog(true)} 
          style={styles.backButton}
        >
          <Ionicons name="trash-outline" size={22} color={colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Session Header Card */}
        <View style={[styles.headerCard, { backgroundColor: colors.card }]}>
          <View style={styles.courseHeader}>
            <View style={styles.courseInfo}>
              <Text style={[styles.courseCode, { color: colors.primary }]}>
                {session.courseCode}
              </Text>
              <Text style={[styles.courseName, { color: colors.foreground }]}>
                {session.courseName}
              </Text>
              {session.creator && (
                <Text style={[styles.lecturer, { color: colors.foregroundMuted }]}>
                  {session.creator.name}
                </Text>
              )}
              {!session.creator && session.lecturerName && (
                <Text style={[styles.lecturer, { color: colors.foregroundMuted }]}>
                  {session.lecturerName}
                </Text>
              )}
              {session.venue && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <Ionicons name="location-outline" size={14} color={colors.foregroundMuted} />
                  <Text style={[styles.lecturer, { color: colors.foregroundMuted }]}>
                    {session.venue}
                  </Text>
                </View>
              )}
            </View>
            <View style={[
              styles.statusBadge,
              { backgroundColor: session.status === SessionStatus.IN_PROGRESS ? `${colors.success}20` : `${colors.foregroundMuted}20` }
            ]}>
              <Text style={[
                styles.statusText,
                { color: session.status === SessionStatus.IN_PROGRESS ? colors.success : colors.foregroundMuted }
              ]}>
                {session.status === SessionStatus.IN_PROGRESS ? "RECORDING" : session.status}
              </Text>
            </View>
          </View>

          <View style={styles.sessionMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={16} color={colors.foregroundMuted} />
              <Text style={[styles.metaText, { color: colors.foregroundMuted }]}>
                Started {formatTime(session.startTime)}
              </Text>
            </View>
            {session.status === SessionStatus.IN_PROGRESS && (
              <View style={styles.metaItem}>
                <Ionicons name="hourglass-outline" size={16} color={colors.foregroundMuted} />
                <Text style={[styles.metaText, { color: colors.foregroundMuted }]}>
                  Duration: {formatDuration(session.startTime)}
                </Text>
              </View>
            )}
          </View>

          {session.notes && (
            <View style={[styles.notesSection, { backgroundColor: colors.muted }]}>
              <Text style={[styles.notesText, { color: colors.foreground }]}>
                {session.notes}
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        {(session.status === SessionStatus.IN_PROGRESS || session.status === SessionStatus.PAUSED) && (
          <View style={[styles.actionsCard, { backgroundColor: colors.card }]}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={handleExportSession}
              disabled={exporting}
            >
              <Ionicons name="download-outline" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>
                {exporting ? "Exporting..." : "Export Data"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.surface }]}
              onPress={() => setShowLinkDrawer(true)}
            >
              <Ionicons name="link-outline" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Generate Link</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { 
                backgroundColor: session!.status === SessionStatus.PAUSED ? colors.success : colors.warning,
                opacity: 0.9 
              }]}
              onPress={handlePauseResumeSession}
            >
              <Ionicons 
                name={session!.status === SessionStatus.PAUSED ? "play-circle-outline" : "pause-circle-outline"} 
                size={20} 
                color="#fff" 
              />
              <Text style={styles.actionButtonText}>
                {session!.status === SessionStatus.PAUSED ? 'Resume' : 'Pause'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.error, opacity: 0.9 }]}
              onPress={async () => {
                if (!session || session.status !== SessionStatus.IN_PROGRESS) {
                  toast.error("Cannot end: Only IN PROGRESS sessions can be ended");
                  return;
                }
                try {
                  await classAttendanceApi.endSession(session.id);
                  // Clear recent recordings from AsyncStorage
                  await AsyncStorage.removeItem(`attendance_recent_${session.id}`);
                  toast.success("Session ended: Attendance session completed successfully");
                  router.back();
                } catch (error: any) {
                  console.error("Failed to end session:", error);
                  toast.error(error?.error || "Failed to end session");
                }
              }}
            >
              <Ionicons name="stop-circle-outline" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>End Session</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Statistics Card */}
        <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Attendance Statistics
          </Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.success }]}>
                {presentStudents.length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.foregroundMuted }]}>
                Present
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.warning }]}>
                {lateStudents.length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.foregroundMuted }]}>
                Late
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {excusedStudents.length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.foregroundMuted }]}>
                Excused
              </Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.foreground }]}>
                {totalRecorded}
              </Text>
              <Text style={[styles.statLabel, { color: colors.foregroundMuted }]}>
                Recorded
              </Text>
            </View>
            {totalExpected > 0 && (
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.foreground }]}>
                  {totalExpected}
                </Text>
                <Text style={[styles.statLabel, { color: colors.foregroundMuted }]}>
                  Expected
                </Text>
              </View>
            )}
            {totalExpected > 0 && (
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {attendancePercentage}%
                </Text>
                <Text style={[styles.statLabel, { color: colors.foregroundMuted }]}>
                  Rate
                </Text>
              </View>
            )}
          </View>

          {/* Progress Bar - Shows recorded vs expected */}
          {totalExpected > 0 && (
            <View style={[styles.progressBar, { backgroundColor: colors.muted }]}>
              <View
                style={[
                  styles.progressFill,
                  { 
                    backgroundColor: colors.success, 
                    width: `${Math.min(attendancePercentage, 100)}%`
                  }
                ]}
              />
            </View>
          )}
        </View>

        {/* Student List */}
        <View style={[styles.studentsCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Student Attendance
          </Text>

          {/* Present Students */}
          {presentStudents.length > 0 && (
            <View style={styles.studentCategory}>
              <View style={styles.categoryHeader}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Text style={[styles.categoryTitle, { color: colors.foreground }]}>
                  Present ({presentStudents.length})
                </Text>
              </View>
              {presentStudents.map((record: StudentAttendance) => (
                <View
                  key={record.id}
                  style={[
                    styles.studentItem,
                    { backgroundColor: colors.background, borderLeftColor: colors.success }
                  ]}
                >
                  <View style={[styles.studentPhoto, { backgroundColor: colors.muted }]}>
                    {record.student?.profilePicture ? (
                      <Image source={{ uri: getFileUrl(record.student.profilePicture) }} style={styles.studentPhotoImage} />
                    ) : (
                      <Ionicons name="person" size={24} color={colors.foregroundMuted} />
                    )}
                  </View>
                  <View style={styles.studentInfo}>
                    <Text style={[styles.studentName, { color: colors.foreground }]}>
                      {record.student ? `${record.student.firstName} ${record.student.lastName}` : 'Unknown'}
                    </Text>
                    <Text style={[styles.studentMetaText, { color: colors.foregroundMuted }]}>
                      {record.student?.indexNumber || ''}
                    </Text>
                    <View style={styles.studentMeta}>
                      <View style={styles.verificationBadge}>
                        <Ionicons
                          name={getVerificationIcon(record.verificationMethod)}
                          size={12}
                          color={colors.foregroundMuted}
                        />
                        <Text style={[styles.studentMetaText, { color: colors.foregroundMuted }]}>
                          {getVerificationLabel(record.verificationMethod)}
                        </Text>
                      </View>
                      {record.markedAt && (
                        <Text style={[styles.studentMetaText, { color: colors.foregroundMuted }]}>
                          {formatTime(record.markedAt)}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Late Students */}
          {lateStudents.length > 0 && (
            <View style={styles.studentCategory}>
              <View style={styles.categoryHeader}>
                <Ionicons name="time" size={20} color={colors.warning} />
                <Text style={[styles.categoryTitle, { color: colors.foreground }]}>
                  Late ({lateStudents.length})
                </Text>
              </View>
              {lateStudents.map((record: StudentAttendance) => (
                <View
                  key={record.id}
                  style={[
                    styles.studentItem,
                    { backgroundColor: colors.background, borderLeftColor: colors.warning }
                  ]}
                >
                  <View style={[styles.studentPhoto, { backgroundColor: colors.muted }]}>
                    {record.student?.profilePicture ? (
                      <Image source={{ uri: getFileUrl(record.student.profilePicture) }} style={styles.studentPhotoImage} />
                    ) : (
                      <Ionicons name="person" size={24} color={colors.foregroundMuted} />
                    )}
                  </View>
                  <View style={styles.studentInfo}>
                    <Text style={[styles.studentName, { color: colors.foreground }]}>
                      {record.student ? `${record.student.firstName} ${record.student.lastName}` : 'Unknown'}
                    </Text>
                    <Text style={[styles.studentMetaText, { color: colors.foregroundMuted }]}>
                      {record.student?.indexNumber || ''}
                    </Text>
                    <View style={styles.studentMeta}>
                      <View style={styles.verificationBadge}>
                        <Ionicons
                          name={getVerificationIcon(record.verificationMethod)}
                          size={12}
                          color={colors.foregroundMuted}
                        />
                        <Text style={[styles.studentMetaText, { color: colors.foregroundMuted }]}>
                          {getVerificationLabel(record.verificationMethod)}
                        </Text>
                      </View>
                      {record.markedAt && (
                        <Text style={[styles.studentMetaText, { color: colors.foregroundMuted }]}>
                          {formatTime(record.markedAt)}
                        </Text>
                      )}
                      {record.requiresConfirmation && !record.confirmedAt && (
                        <View style={[styles.pendingBadge, { backgroundColor: colors.warning }]}>
                          <Text style={[styles.pendingBadgeText, { color: "#fff" }]}>Pending</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  {session.status === "IN_PROGRESS" && (
                    <View style={styles.studentActions}>
                      <TouchableOpacity
                        onPress={() => {
                          setAttendanceToUpdate(record);
                          setNewStatus(record.status);
                          setShowUpdateStatusDialog(true);
                        }}
                        style={[styles.studentActionButton, { backgroundColor: colors.muted }]}
                      >
                        <Ionicons name="create-outline" size={16} color={colors.foreground} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteAttendance(record.id)}
                        style={[styles.studentActionButton, { backgroundColor: `${colors.error}20` }]}
                      >
                        <Ionicons name="trash-outline" size={16} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Pending Confirmations */}
          {pendingConfirmations.length > 0 && (
            <View style={styles.studentCategory}>
              <View style={styles.categoryHeader}>
                <Ionicons name="time-outline" size={20} color={colors.warning} />
                <Text style={[styles.categoryTitle, { color: colors.foreground }]}>
                  Pending Confirmation ({pendingConfirmations.length})
                </Text>
                {session.status === "IN_PROGRESS" && (
                  <TouchableOpacity
                    onPress={() => {
                      const ids = pendingConfirmations.map(a => a.id);
                      setSelectedAttendanceIds(ids);
                      setShowBulkConfirmDialog(true);
                    }}
                    style={[styles.bulkActionButton, { backgroundColor: colors.primary }]}
                  >
                    <Text style={[styles.bulkActionText, { color: "#fff" }]}>Bulk Confirm</Text>
                  </TouchableOpacity>
                )}
              </View>
              {pendingConfirmations.map((record: StudentAttendance) => (
                <View
                  key={record.id}
                  style={[
                    styles.studentItem,
                    { backgroundColor: colors.background, borderLeftColor: colors.warning }
                  ]}
                >
                  <View style={[styles.studentPhoto, { backgroundColor: colors.muted }]}>
                    {record.student?.profilePicture ? (
                      <Image source={{ uri: getFileUrl(record.student.profilePicture) }} style={styles.studentPhotoImage} />
                    ) : (
                      <Ionicons name="person" size={24} color={colors.foregroundMuted} />
                    )}
                  </View>
                  <View style={styles.studentInfo}>
                    <Text style={[styles.studentName, { color: colors.foreground }]}>
                      {record.student ? `${record.student.firstName} ${record.student.lastName}` : 'Unknown'}
                    </Text>
                    <Text style={[styles.studentMetaText, { color: colors.foregroundMuted }]}>
                      {record.student?.indexNumber || ''}
                    </Text>
                    <View style={styles.studentMeta}>
                      <View style={styles.verificationBadge}>
                        <Ionicons
                          name={getVerificationIcon(record.verificationMethod)}
                          size={12}
                          color={colors.foregroundMuted}
                        />
                        <Text style={[styles.studentMetaText, { color: colors.foregroundMuted }]}>
                          {getVerificationLabel(record.verificationMethod)}
                        </Text>
                      </View>
                      {record.markedAt && (
                        <Text style={[styles.studentMetaText, { color: colors.foregroundMuted }]}>
                          {formatTime(record.markedAt)}
                        </Text>
                      )}
                    </View>
                  </View>
                  {session.status === "IN_PROGRESS" && (
                    <View style={styles.studentActions}>
                      <TouchableOpacity
                        onPress={async () => {
                          try {
                            await classAttendanceApi.bulkConfirmAttendance(session.id, {
                              attendanceIds: [record.id],
                              confirm: true,
                            });
                            toast.success("Attendance confirmed");
                            loadSessionDetails();
                          } catch (error: any) {
                            console.error("Failed to confirm attendance:", error);
                            toast.error(error?.error || "Failed to confirm attendance");
                          }
                        }}
                        style={[styles.studentActionButton, { backgroundColor: `${colors.success}20` }]}
                      >
                        <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={async () => {
                          try {
                            await classAttendanceApi.bulkConfirmAttendance(session.id, {
                              attendanceIds: [record.id],
                              confirm: false,
                            });
                            toast.success("Attendance rejected");
                            loadSessionDetails();
                          } catch (error: any) {
                            console.error("Failed to reject attendance:", error);
                            toast.error(error?.error || "Failed to reject attendance");
                          }
                        }}
                        style={[styles.studentActionButton, { backgroundColor: `${colors.error}20` }]}
                      >
                        <Ionicons name="close-circle" size={16} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Excused Students */}
          {excusedStudents.length > 0 && (
            <View style={styles.studentCategory}>
              <View style={styles.categoryHeader}>
                <Ionicons name="alert-circle" size={20} color={colors.primary} />
                <Text style={[styles.categoryTitle, { color: colors.foreground }]}>
                  Excused ({excusedStudents.length})
                </Text>
              </View>
              {excusedStudents.map((record: StudentAttendance) => (
                <View
                  key={record.id}
                  style={[
                    styles.studentItem,
                    { backgroundColor: colors.background, borderLeftColor: colors.primary }
                  ]}
                >
                  <View style={[styles.studentPhoto, { backgroundColor: colors.muted }]}>
                    {record.student?.profilePicture ? (
                      <Image source={{ uri: getFileUrl(record.student.profilePicture) }} style={styles.studentPhotoImage} />
                    ) : (
                      <Ionicons name="person" size={24} color={colors.foregroundMuted} />
                    )}
                  </View>
                  <View style={styles.studentInfo}>
                    <Text style={[styles.studentName, { color: colors.foreground }]}>
                      {record.student ? `${record.student.firstName} ${record.student.lastName}` : 'Unknown'}
                    </Text>
                    <Text style={[styles.studentMetaText, { color: colors.foregroundMuted }]}>
                      {record.student?.indexNumber || ''}
                    </Text>
                    <View style={styles.studentMeta}>
                      <View style={styles.verificationBadge}>
                        <Ionicons
                          name={getVerificationIcon(record.verificationMethod)}
                          size={12}
                          color={colors.foregroundMuted}
                        />
                        <Text style={[styles.studentMetaText, { color: colors.foregroundMuted }]}>
                          {getVerificationLabel(record.verificationMethod)}
                        </Text>
                      </View>
                      {record.markedAt && (
                        <Text style={[styles.studentMetaText, { color: colors.foregroundMuted }]}>
                          {formatTime(record.markedAt)}
                        </Text>
                      )}
                    </View>
                  </View>
                  {session.status === "IN_PROGRESS" && (
                    <View style={styles.studentActions}>
                      <TouchableOpacity
                        onPress={() => {
                          setAttendanceToUpdate(record);
                          setNewStatus(record.status);
                          setShowUpdateStatusDialog(true);
                        }}
                        style={[styles.studentActionButton, { backgroundColor: colors.muted }]}
                      >
                        <Ionicons name="create-outline" size={16} color={colors.foreground} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteAttendance(record.id)}
                        style={[styles.studentActionButton, { backgroundColor: `${colors.error}20` }]}
                      >
                        <Ionicons name="trash-outline" size={16} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Empty State */}
          {students.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color={colors.foregroundMuted} />
              <Text style={[styles.emptyStateText, { color: colors.foregroundMuted }]}>
                No students recorded yet
              </Text>
              <Text style={[styles.emptyStateSubtext, { color: colors.foregroundMuted }]}>
                Students will appear here as they mark attendance
              </Text>
            </View>
          )}
        </View>

        {/* Active Links Section */}
        {session.status === "IN_PROGRESS" && (
          <View style={[styles.linksCard, { backgroundColor: colors.card }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Active Links
              </Text>
              <TouchableOpacity
                onPress={() => setShowLinkDrawer(true)}
                style={[styles.addButton, { backgroundColor: colors.primary }]}
              >
                <Ionicons name="add" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
            {loadingLinks ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 16 }} />
            ) : activeLinks.length > 0 ? (
              <View style={styles.linksList}>
                {activeLinks.map((link) => (
                  <View
                    key={link.id}
                    style={[styles.linkItem, { backgroundColor: colors.background }]}
                  >
                    <View style={styles.linkInfo}>
                      <Text style={[styles.linkToken, { color: colors.primary }]}>
                        {link.linkToken || link.token}
                      </Text>
                      <Text style={[styles.linkMeta, { color: colors.foregroundMuted }]}>
                        Uses: {link.usesCount || link.usageCount || 0} / {link.maxUses || link.maxUsage || "∞"}
                      </Text>
                      <Text style={[styles.linkMeta, { color: colors.foregroundMuted }]}>
                        Expires: {new Date(link.expiresAt).toLocaleString()}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleRevokeLink(link.linkToken || link.token || '')}
                      style={[styles.revokeButton, { backgroundColor: `${colors.error}20` }]}
                    >
                      <Ionicons name="close-circle" size={20} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="link-outline" size={32} color={colors.foregroundMuted} />
                <Text style={[styles.emptyStateText, { color: colors.foregroundMuted }]}>
                  No active links
                </Text>
                <TouchableOpacity
                  onPress={() => setShowLinkDrawer(true)}
                  style={[styles.addLinkButton, { backgroundColor: colors.primary }]}
                >
                  <Text style={[styles.addLinkButtonText, { color: "#fff" }]}>
                    Generate Link
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Assistants Section */}
        {session.assistants && session.assistants.length > 0 && (
          <View style={[styles.assistantsCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Assistants ({session.assistants.length})
            </Text>
            {session.assistants.map((assistant) => (
              <View
                key={assistant.id}
                style={[styles.assistantItem, { backgroundColor: colors.background }]}
              >
                <View style={styles.assistantInfo}>
                  <Text style={[styles.assistantName, { color: colors.foreground }]}>
                    {assistant.user?.name}
                  </Text>
                  <Text style={[styles.assistantRole, { color: colors.foregroundMuted }]}>
                    {assistant.role} • {assistant.recordedCount} recorded
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Generate Link Drawer */}
      <GenerateLinkDrawer
        visible={showLinkDrawer}
        session={session}
        onClose={() => setShowLinkDrawer(false)}
        onLinkGenerated={(link) => {
          toast.success(`Link generated with code: ${link.token}`);
        }}
      />

      {/* Delete Session Dialog */}
      {session && (
        <Dialog
          visible={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          title="Delete Attendance Session"
          message={`Are you sure you want to permanently delete this session?\n\nCourse: ${session.courseCode}${session.courseName ? ` - ${session.courseName}` : ""}\nStudents Recorded: ${session.attendance?.length || 0}\n\nThis will delete:\n• All attendance records\n• All attendance links\n• Session history\n\nThis action CANNOT be undone!`}
          variant="error"
          icon="trash-outline"
          primaryAction={{
            label: deletingSession ? "Deleting..." : "Delete Session",
            onPress: handleDeleteSession,
          }}
          secondaryAction={{
            label: "Cancel",
            onPress: () => setShowDeleteDialog(false),
          }}
        />
      )}

      {/* Bulk Confirm Dialog */}
      <Dialog
        visible={showBulkConfirmDialog}
        onClose={() => {
          setShowBulkConfirmDialog(false);
          setSelectedAttendanceIds([]);
        }}
        title="Confirm Attendance"
        message={`Confirm ${selectedAttendanceIds.length} pending attendance record(s)?`}
        variant="default"
        icon="checkmark-circle-outline"
        primaryAction={{
          label: bulkConfirming ? "Confirming..." : "Confirm",
          onPress: () => handleBulkConfirm(true),
        }}
        secondaryAction={{
          label: "Reject",
          onPress: () => handleBulkConfirm(false),
        }}
      />

      {/* Update Status Dialog */}
      {attendanceToUpdate && (
        <Dialog
          visible={showUpdateStatusDialog}
          onClose={() => {
            setShowUpdateStatusDialog(false);
            setAttendanceToUpdate(null);
          }}
          title="Update Attendance Status"
          message={`Update status for ${attendanceToUpdate.student?.firstName} ${attendanceToUpdate.student?.lastName}?`}
          variant="default"
          icon="create-outline"
          primaryAction={{
            label: "Update",
            onPress: handleUpdateAttendanceStatus,
          }}
          secondaryAction={{
            label: "Cancel",
            onPress: () => {
              setShowUpdateStatusDialog(false);
              setAttendanceToUpdate(null);
            },
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "600",
  },
  headerCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  courseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  courseInfo: {
    flex: 1,
  },
  courseCode: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  courseName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  lecturer: {
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  sessionMeta: {
    gap: 8,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaText: {
    fontSize: 14,
  },
  notesSection: {
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
  },
  statsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 32,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  studentsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  studentCategory: {
    marginBottom: 20,
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
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 16,
    marginTop: 12,
    fontWeight: "600",
  },
  emptyStateSubtext: {
    fontSize: 14,
    marginTop: 4,
    textAlign: "center",
  },
  actionsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 10,
    gap: 8,
    flex: 1,
    minWidth: "30%",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  pendingBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  pendingBadgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  studentActions: {
    flexDirection: "row",
    gap: 8,
    marginLeft: 8,
  },
  studentActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  bulkActionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  bulkActionText: {
    fontSize: 12,
    fontWeight: "600",
  },
  linksCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  linksList: {
    gap: 8,
  },
  linkItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
  },
  linkInfo: {
    flex: 1,
  },
  linkToken: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  linkMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  revokeButton: {
    padding: 8,
    borderRadius: 8,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  addLinkButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
  },
  addLinkButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  assistantsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  assistantItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  assistantInfo: {
    flex: 1,
  },
  assistantName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  assistantRole: {
    fontSize: 12,
  },
});
