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

export default function SessionDetailsScreen() {
  const colors = useThemeColors();
  const socket = useSocket();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  
  const [session, setSession] = useState<ClassAttendanceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadSessionDetails = useCallback(async () => {
    if (!sessionId) return;
    
    try {
      setLoading(true);
      // Fetch session details from API
      const response = await classAttendanceApi.getActiveSessions();
      const sessionData = response.sessions.find((s: ClassAttendanceRecord) => s.id === sessionId);
      
      if (sessionData) {
        setSession(sessionData);
      }
    } catch (error) {
      console.error("Failed to load session details:", error);
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

  const getVerificationIcon = (method: string) => {
    switch (method?.toLowerCase()) {
      case "qr": return "qr-code";
      case "manual": return "create";
      case "photo": return "camera";
      default: return "help-circle";
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
  const presentStudents = students.filter((s: any) => s.status === "present");
  const markingStudents = students.filter((s: any) => s.status === "marking");
  const absentStudents = students.filter((s: any) => s.status === "absent");

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Session Details</Text>
        <View style={{ width: 40 }} />
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
                {markingStudents.length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.foregroundMuted }]}>
                Marking
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.foreground }]}>
                {session.totalStudents}
              </Text>
              <Text style={[styles.statLabel, { color: colors.foregroundMuted }]}>
                Total
              </Text>
            </View>
          </View>

          {/* Progress Bar - Shows present vs total recorded */}
          <View style={[styles.progressBar, { backgroundColor: colors.muted }]}>
            <View
              style={[
                styles.progressFill,
                { 
                  backgroundColor: colors.success, 
                  width: session.totalStudents > 0 
                    ? `${Math.round((presentStudents.length / session.totalStudents) * 100)}%` 
                    : '0%'
                }
              ]}
            />
          </View>
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
              {presentStudents.map((student: any) => (
                <View
                  key={student.id}
                  style={[
                    styles.studentItem,
                    { backgroundColor: colors.background, borderLeftColor: colors.success }
                  ]}
                >
                  <View style={[styles.studentPhoto, { backgroundColor: colors.muted }]}>
                    {student.photoUrl ? (
                      <Image source={{ uri: student.photoUrl }} style={styles.studentPhotoImage} />
                    ) : (
                      <Ionicons name="person" size={24} color={colors.foregroundMuted} />
                    )}
                  </View>
                  <View style={styles.studentInfo}>
                    <Text style={[styles.studentName, { color: colors.foreground }]}>
                      {student.name}
                    </Text>
                    <View style={styles.studentMeta}>
                      <View style={styles.verificationBadge}>
                        <Ionicons
                          name={getVerificationIcon(student.verificationMethod)}
                          size={12}
                          color={colors.foregroundMuted}
                        />
                        <Text style={[styles.studentMetaText, { color: colors.foregroundMuted }]}>
                          {student.verificationMethod}
                        </Text>
                      </View>
                      {student.timestamp && (
                        <Text style={[styles.studentMetaText, { color: colors.foregroundMuted }]}>
                          {formatTime(student.timestamp)}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Marking Students */}
          {markingStudents.length > 0 && (
            <View style={styles.studentCategory}>
              <View style={styles.categoryHeader}>
                <Ionicons name="time" size={20} color={colors.warning} />
                <Text style={[styles.categoryTitle, { color: colors.foreground }]}>
                  Marking ({markingStudents.length})
                </Text>
              </View>
              {markingStudents.map((student: any) => (
                <View
                  key={student.id}
                  style={[
                    styles.studentItem,
                    { backgroundColor: colors.background, borderLeftColor: colors.warning }
                  ]}
                >
                  <View style={[styles.studentPhoto, { backgroundColor: colors.muted }]}>
                    {student.photoUrl ? (
                      <Image source={{ uri: student.photoUrl }} style={styles.studentPhotoImage} />
                    ) : (
                      <Ionicons name="person" size={24} color={colors.foregroundMuted} />
                    )}
                  </View>
                  <View style={styles.studentInfo}>
                    <Text style={[styles.studentName, { color: colors.foreground }]}>
                      {student.name}
                    </Text>
                    <View style={styles.studentMeta}>
                      <View style={styles.verificationBadge}>
                        <Ionicons
                          name={getVerificationIcon(student.verificationMethod)}
                          size={12}
                          color={colors.foregroundMuted}
                        />
                        <Text style={[styles.studentMetaText, { color: colors.foregroundMuted }]}>
                          {student.verificationMethod}
                        </Text>
                      </View>
                      {student.timestamp && (
                        <Text style={[styles.studentMetaText, { color: colors.foregroundMuted }]}>
                          {formatTime(student.timestamp)}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Absent Students */}
          {absentStudents.length > 0 && (
            <View style={styles.studentCategory}>
              <View style={styles.categoryHeader}>
                <Ionicons name="close-circle" size={20} color={colors.error} />
                <Text style={[styles.categoryTitle, { color: colors.foreground }]}>
                  Absent ({absentStudents.length})
                </Text>
              </View>
              {absentStudents.map((student: any) => (
                <View
                  key={student.id}
                  style={[
                    styles.studentItem,
                    { backgroundColor: colors.background, borderLeftColor: colors.error }
                  ]}
                >
                  <View style={[styles.studentPhoto, { backgroundColor: colors.muted }]}>
                    {student.photoUrl ? (
                      <Image source={{ uri: student.photoUrl }} style={styles.studentPhotoImage} />
                    ) : (
                      <Ionicons name="person" size={24} color={colors.foregroundMuted} />
                    )}
                  </View>
                  <View style={styles.studentInfo}>
                    <Text style={[styles.studentName, { color: colors.foreground }]}>
                      {student.name}
                    </Text>
                    <View style={styles.studentMeta}>
                      <View style={styles.verificationBadge}>
                        <Ionicons
                          name={getVerificationIcon(student.verificationMethod)}
                          size={12}
                          color={colors.foregroundMuted}
                        />
                        <Text style={[styles.studentMetaText, { color: colors.foregroundMuted }]}>
                          {student.verificationMethod}
                        </Text>
                      </View>
                      {student.timestamp && (
                        <Text style={[styles.studentMetaText, { color: colors.foregroundMuted }]}>
                          {formatTime(student.timestamp)}
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
});
