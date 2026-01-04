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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "@/constants/design-system";
import { classAttendanceApi, type ClassAttendanceRecord } from "@/api/classAttendance";
import { useSocket } from "@/hooks/useSocket";
import { getFileUrl } from "@/lib/api-client";
import { toast } from "@/utils/toast";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Dialog } from "@/components/ui/dialog";

export default function SessionDetailsScreen() {
  const colors = useThemeColors();
  const socket = useSocket();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  
  const [session, setSession] = useState<ClassAttendanceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingSession, setDeletingSession] = useState(false);

  const loadSessionDetails = useCallback(async () => {
    if (!sessionId) return;
    
    try {
      setLoading(true);
      // Fetch specific session by ID
      const response = await classAttendanceApi.getSession(sessionId);
      console.log("Session response:", JSON.stringify(response, null, 2));
      
      // Handle both wrapped and unwrapped responses
      const sessionData = response.record || response;
      if (sessionData && sessionData.id) {
        setSession(sessionData as ClassAttendanceRecord);
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
  }, [sessionId]);

  useEffect(() => {
    loadSessionDetails();
  }, [loadSessionDetails]);

  // Socket listeners for real-time updates
  useEffect(() => {
    if (!sessionId) return;

    const unsubscribers: (() => void)[] = [];

    unsubscribers.push(socket.on("attendance:recorded", (data: unknown) => {
      const typedData = data as { record: ClassAttendanceRecord };
      if (typedData.record.id === sessionId) {
        setSession(typedData.record);
      }
    }));

    unsubscribers.push(socket.on("session:ended", (data: unknown) => {
      const typedData = data as { record: ClassAttendanceRecord };
      if (typedData.record.id === sessionId) {
        setSession(typedData.record);
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

  const students = session.students || [];
  const totalRecorded = students.length;
  const presentStudents = students.filter((s: any) => s.status === "PRESENT");
  const lateStudents = students.filter((s: any) => s.status === "LATE");
  const excusedStudents = students.filter((s: any) => s.status === "EXCUSED");
  const totalExpected = session.totalStudents || 0;
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
              {session.lecturerName && (
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
              { backgroundColor: session.status === "IN_PROGRESS" ? `${colors.success}20` : `${colors.foregroundMuted}20` }
            ]}>
              <Text style={[
                styles.statusText,
                { color: session.status === "IN_PROGRESS" ? colors.success : colors.foregroundMuted }
              ]}>
                {session.status === "IN_PROGRESS" ? "RECORDING" : session.status}
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
            {session.status === "IN_PROGRESS" && (
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
        {session.status === "IN_PROGRESS" && (
          <View style={[styles.actionsCard, { backgroundColor: colors.card }]}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                toast.info("Coming Soon: Export feature is in development");
              }}
            >
              <Ionicons name="download-outline" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Export Data</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.error, opacity: 0.9 }]}
              onPress={async () => {
                if (!session || session.status !== "IN_PROGRESS") {
                  toast.error("Cannot end: Only IN PROGRESS sessions can be ended");
                  return;
                }
                try {
                  await classAttendanceApi.endSession({ recordId: session.id });
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
              {presentStudents.map((record: any) => (
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
                      {(record.confirmedAt || record.scanTime) && (
                        <Text style={[styles.studentMetaText, { color: colors.foregroundMuted }]}>
                          {formatTime(record.confirmedAt || record.scanTime)}
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
              {lateStudents.map((record: any) => (
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
                      {(record.confirmedAt || record.scanTime) && (
                        <Text style={[styles.studentMetaText, { color: colors.foregroundMuted }]}>
                          {formatTime(record.confirmedAt || record.scanTime)}
                        </Text>
                      )}
                    </View>
                  </View>
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
              {excusedStudents.map((record: any) => (
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
                      {(record.confirmedAt || record.scanTime) && (
                        <Text style={[styles.studentMetaText, { color: colors.foregroundMuted }]}>
                          {formatTime(record.confirmedAt || record.scanTime)}
                        </Text>
                      )}
                    </View>
                  </View>
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
      </ScrollView>

      {/* Delete Session Dialog */}
      {session && (
        <Dialog
          visible={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          title="Delete Attendance Session"
          message={`Are you sure you want to permanently delete this session?\n\nCourse: ${session.courseCode}${session.courseName ? ` - ${session.courseName}` : ""}\nStudents Recorded: ${session.students?.length || 0}\n\nThis will delete:\n• All attendance records\n• All attendance links\n• Session history\n\nThis action CANNOT be undone!`}
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
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 10,
    gap: 8,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
