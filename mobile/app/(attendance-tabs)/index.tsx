/**
 * Attendance Dashboard
 * Main landing screen for lecturers to manage class attendance
 */

import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useThemeColors } from "@/constants/design-system";
import { useAuthStore } from "@/store/auth";
import { Card } from "@/components/ui/card";
import { classAttendanceApi } from "@/api/classAttendance";
import { useSocket } from "@/hooks/useSocket";
import CreateSessionDrawer from "@/components/CreateSessionDrawer";
import type { AttendanceSession, StudentAttendance } from "@/types";

interface LiveSessionStats {
  sessionId: string;
  totalRecorded: number;
  totalExpected: number;
  attendanceRate: number;
  byMethod: {
    QR_SCAN: number;
    MANUAL_ENTRY: number;
    BIOMETRIC_FINGERPRINT: number;
    BIOMETRIC_FACE: number;
    LINK_SELF_MARK: number;
  };
}

interface TodayStats {
  totalSessions: number;
  totalAttendance: number;
  averageRate: number;
  activeSessions: number;
}

const getTimeOfDay = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
};

export default function AttendanceDashboard() {
  const colors = useThemeColors();
  const { user } = useAuthStore();
  const socket = useSocket();
  const [activeSessions, setActiveSessions] = useState<AttendanceSession[]>([]);
  const [recentSessions, setRecentSessions] = useState<AttendanceSession[]>([]);
  const [liveStats, setLiveStats] = useState<LiveSessionStats | null>(null);
  const [todayStats, setTodayStats] = useState<TodayStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [createDrawerVisible, setCreateDrawerVisible] = useState(false);

  // Socket event handlers
  const loadActiveSessions = useCallback(async () => {
    try {
      const sessions = await classAttendanceApi.getActiveSessions();
      setActiveSessions(Array.isArray(sessions) ? sessions : []);
    } catch (error) {
      console.error("Failed to load active sessions:", error);
      setActiveSessions([]);
    }
  }, []);

  const loadRecentSessions = useCallback(async () => {
    try {
      const response = await classAttendanceApi.getAttendanceHistory({
        limit: 5,
        page: 1
      });
      setRecentSessions(Array.isArray(response?.sessions) ? response.sessions : []);
    } catch (error) {
      console.error("Failed to load recent sessions:", error);
      setRecentSessions([]);
    }
  }, []);

  const loadTodayStats = useCallback(async () => {
    try {
      // Get today's date range
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);

      const analytics = await classAttendanceApi.getAttendanceAnalytics({
        startDate: startOfDay.toISOString(),
        endDate: endOfDay.toISOString()
      });

      if (analytics.success) {
        setTodayStats({
          totalSessions: analytics.data.summary.totalSessions,
          totalAttendance: analytics.data.summary.totalAttendance,
          averageRate: analytics.data.summary.averageAttendanceRate,
          activeSessions: activeSessions.length
        });
      }
    } catch (error) {
      console.error("Failed to load today stats:", error);
      // Fallback to local calculation if analytics API fails
      const today = new Date().toISOString().split('T')[0];
      const todaySessions = recentSessions.filter(s =>
        s.createdAt.startsWith(today) || s.startTime.startsWith(today)
      );

      const totalAttendance = todaySessions.reduce((sum, session) =>
        sum + (session.attendance?.length || 0), 0
      );

      setTodayStats({
        totalSessions: todaySessions.length,
        totalAttendance,
        averageRate: todaySessions.length > 0
          ? (totalAttendance / todaySessions.length) * 100
          : 0,
        activeSessions: activeSessions.length
      });
    }
  }, []);

  const loadLiveStats = useCallback(async (sessionId: string) => {
    try {
      // Get full session details to calculate live stats
      const sessionDetails = await classAttendanceApi.getSessionDetails(sessionId);
      if (sessionDetails) {
        const attendance = sessionDetails.attendance || [];
        setLiveStats({
          sessionId,
          totalRecorded: attendance.length,
          totalExpected: sessionDetails.expectedStudentCount,
          attendanceRate: (attendance.length / sessionDetails.expectedStudentCount) * 100,
          byMethod: {
            QR_SCAN: attendance.filter((a: StudentAttendance) => a.verificationMethod === 'QR_SCAN').length,
            MANUAL_ENTRY: attendance.filter((a: StudentAttendance) => a.verificationMethod === 'MANUAL_ENTRY').length,
            BIOMETRIC_FINGERPRINT: attendance.filter((a: StudentAttendance) => a.verificationMethod === 'BIOMETRIC_FINGERPRINT').length,
            BIOMETRIC_FACE: attendance.filter((a: StudentAttendance) => a.verificationMethod === 'BIOMETRIC_FACE').length,
            LINK_SELF_MARK: attendance.filter((a: StudentAttendance) => a.verificationMethod === 'LINK_SELF_MARK').length,
          }
        });
      }
    } catch (error) {
      console.error("Failed to load live stats:", error);
      // Fallback to calculating from cached session data
      const session = activeSessions.find(s => s.id === sessionId);
      if (session) {
        const attendance = session.attendance || [];
        setLiveStats({
          sessionId,
          totalRecorded: attendance.length,
          totalExpected: session.expectedStudentCount,
          attendanceRate: (attendance.length / session.expectedStudentCount) * 100,
          byMethod: {
            QR_SCAN: attendance.filter(a => a.verificationMethod === 'QR_SCAN').length,
            MANUAL_ENTRY: attendance.filter(a => a.verificationMethod === 'MANUAL_ENTRY').length,
            BIOMETRIC_FINGERPRINT: attendance.filter(a => a.verificationMethod === 'BIOMETRIC_FINGERPRINT').length,
            BIOMETRIC_FACE: attendance.filter(a => a.verificationMethod === 'BIOMETRIC_FACE').length,
            LINK_SELF_MARK: attendance.filter(a => a.verificationMethod === 'LINK_SELF_MARK').length,
          }
        });
      }
    }
  }, []);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadActiveSessions(),
        loadRecentSessions(),
        loadTodayStats()
      ]);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [loadActiveSessions, loadRecentSessions, loadTodayStats]);

  const setupSocketListeners = useCallback(() => {
    const unsubscribers: (() => void)[] = [];

    // Session started
    unsubscribers.push(socket.on("attendance:sessionStarted", (data: any) => {
      const session = data.data as AttendanceSession;
      setActiveSessions(prev => [session, ...prev]);
    }));

    // Session ended
    unsubscribers.push(socket.on("attendance:sessionEnded", (data: any) => {
      const { sessionId } = data.data;
      setActiveSessions(prev => prev.filter(s => s.id !== sessionId));
      setLiveStats(prev => prev?.sessionId === sessionId ? null : prev);
    }));

    // Attendance recorded
    unsubscribers.push(socket.on("attendance:recorded", (data: any) => {
      const attendance = data.data as StudentAttendance;
      // Update session attendance count
      setActiveSessions(prev =>
        prev.map(session =>
          session.id === attendance.sessionId
            ? { ...session, attendance: [...(session.attendance || []), attendance] }
            : session
        )
      );

      // Update live stats if this session is currently being displayed
      if (liveStats && liveStats.sessionId === attendance.sessionId) {
        setLiveStats(prev => {
          if (!prev) return null;
          const newTotalRecorded = prev.totalRecorded + 1;
          const method = attendance.verificationMethod;
          return {
            ...prev,
            totalRecorded: newTotalRecorded,
            attendanceRate: (newTotalRecorded / prev.totalExpected) * 100,
            byMethod: {
              ...prev.byMethod,
              [method]: prev.byMethod[method as keyof typeof prev.byMethod] + 1
            }
          };
        });
      }
    }));

    // Live update
    unsubscribers.push(socket.on("attendance:liveUpdate", (data: any) => {
      setLiveStats(data.data);
    }));

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [socket]);

  useEffect(() => {
    loadDashboardData();
    const cleanup = setupSocketListeners();
    return cleanup;
  }, [setupSocketListeners, loadDashboardData]);

  // Load live stats for first active session
  useEffect(() => {
    if (activeSessions.length > 0) {
      const firstActive = activeSessions.find(s => s.status === 'IN_PROGRESS');
      if (firstActive) {
        loadLiveStats(firstActive.id);
      }
    } else {
      setLiveStats(null);
    }
  }, [activeSessions, loadLiveStats]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleCreateSession = () => {
    setCreateDrawerVisible(true);
  };

  const handleSessionCreated = (session: AttendanceSession) => {
    // Add newly created session to active sessions
    setActiveSessions(prev => [session, ...prev]);
    // Reload dashboard to refresh stats
    loadDashboardData();
  };

  const handleScanQR = () => {
    router.push("/(attendance-tabs)/scanner");
  };



  const handleViewSession = (sessionId: string) => {
    router.push({
      pathname: "/session-details" as any,
      params: { sessionId },
    });
  };

  const handleViewAnalytics = () => {
    router.push("/(attendance-tabs)/analytics");
  };

  const handleEndSession = async (sessionId: string) => {
    Alert.alert(
      "End Session",
      "Are you sure you want to end this attendance session?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "End Session",
          style: "destructive",
          onPress: async () => {
            try {
              await classAttendanceApi.endSession(sessionId);
              // Socket will handle the UI update
            } catch {
              Alert.alert("Error", "Failed to end session");
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.foreground }]}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.foregroundMuted }]}>
              Good {getTimeOfDay()},
            </Text>
            <Text style={[styles.userName, { color: colors.foreground }]}>
              {user?.name || "Lecturer"}
            </Text>
          </View>
          <View style={[styles.appBadge, { backgroundColor: colors.primary }]}>
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={styles.appBadgeText}>Attendance</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Quick Actions
          </Text>

          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: colors.card }]}
              onPress={handleCreateSession}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.primary }]}>
                <Ionicons name="add-circle" size={28} color="#fff" />
              </View>
              <Text style={[styles.actionTitle, { color: colors.foreground }]}>Create Session</Text>
              <Text style={[styles.actionSubtitle, { color: colors.foregroundMuted }]}>Start new attendance</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: colors.card }]}
              onPress={handleScanQR}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.success }]}>
                <Ionicons name="qr-code" size={28} color="#fff" />
              </View>
              <Text style={[styles.actionTitle, { color: colors.foreground }]}>Scan QR</Text>
              <Text style={[styles.actionSubtitle, { color: colors.foregroundMuted }]}>Record attendance</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: colors.card }]}
              onPress={() => router.push("/(attendance-tabs)/sessions")}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.warning }]}>
                <MaterialIcons name="link" size={28} color="#fff" />
              </View>
              <Text style={[styles.actionTitle, { color: colors.foreground }]}>Generate Links</Text>
              <Text style={[styles.actionSubtitle, { color: colors.foregroundMuted }]}>Self-service attendance</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: colors.card }]}
              onPress={handleViewAnalytics}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.success }]}>
                <Ionicons name="bar-chart" size={28} color="#fff" />
              </View>
              <Text style={[styles.actionTitle, { color: colors.foreground }]}>Analytics</Text>
              <Text style={[styles.actionSubtitle, { color: colors.foregroundMuted }]}>View reports</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Active Sessions */}
        {activeSessions.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Active Sessions
            </Text>

            {activeSessions.map((session) => (
              <Card key={session.id} elevation="sm" style={styles.sessionCard}>
                <View style={styles.sessionHeader}>
                  <View style={styles.sessionInfo}>
                    <Text style={[styles.sessionTitle, { color: colors.foreground }]}>
                      {session.courseCode} - {session.courseName}
                    </Text>
                    <Text style={[styles.sessionSubtitle, { color: colors.foregroundMuted }]}>
                      {session.venue || "No venue"} • {new Date(session.startTime).toLocaleTimeString()}
                    </Text>
                  </View>
                  <View style={[
                    styles.statusBadge, 
                    { 
                      backgroundColor: session.status === 'PAUSED' 
                        ? colors.warning 
                        : colors.success 
                    }
                  ]}>
                    <Text style={styles.statusText}>
                      {session.status === 'PAUSED' ? 'PAUSED' : 'IN PROGRESS'}
                    </Text>
                  </View>
                </View>

                {liveStats && liveStats.sessionId === session.id && (
                  <View style={styles.liveStats}>
                    <View style={styles.progressContainer}>
                      <View
                        style={[
                          styles.progressBar,
                          { width: `${Math.min(liveStats.attendanceRate, 100)}%`, backgroundColor: colors.primary }
                        ]}
                      />
                    </View>
                    <View style={styles.statsRow}>
                      <Text style={[styles.statText, { color: colors.foreground }]}>
                        {liveStats.totalRecorded}/{liveStats.totalExpected} students
                      </Text>
                      <Text style={[styles.rateText, { color: colors.primary }]}>
                        {(liveStats.attendanceRate || 0).toFixed(1)}%
                      </Text>
                    </View>
                  </View>
                )}

                <View style={styles.sessionActions}>
                  <TouchableOpacity
                    style={[styles.sessionButton, { backgroundColor: colors.primary }]}
                    onPress={() => handleViewSession(session.id)}
                  >
                    <Text style={styles.sessionButtonText}>View Details</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.sessionButton, styles.endButton, { borderColor: colors.error }]}
                    onPress={() => handleEndSession(session.id)}
                  >
                    <Text style={[styles.sessionButtonText, { color: colors.error }]}>End Session</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Today's Overview */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Today&apos;s Overview
          </Text>

          <Card elevation="sm">
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {todayStats?.totalSessions || 0}
                </Text>
                <Text style={[styles.statLabel, { color: colors.foregroundMuted }]}>
                  Sessions
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.success }]}>
                  {todayStats?.totalAttendance || 0}
                </Text>
                <Text style={[styles.statLabel, { color: colors.foregroundMuted }]}>
                  Attendance
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.warning }]}>
                  {(todayStats?.averageRate || 0).toFixed(1)}%
                </Text>
                <Text style={[styles.statLabel, { color: colors.foregroundMuted }]}>
                  Avg Rate
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.primaryMuted }]}>
                  {todayStats?.activeSessions || 0}
                </Text>
                <Text style={[styles.statLabel, { color: colors.foregroundMuted }]}>
                  Active
                </Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Recent Sessions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Recent Sessions
            </Text>
            <TouchableOpacity onPress={() => router.push("/(attendance-tabs)/sessions")}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
            </TouchableOpacity>
          </View>

          {recentSessions.length > 0 ? (
            recentSessions.map((session) => (
              <TouchableOpacity
                key={session.id}
                style={[styles.recentSession, { backgroundColor: colors.card }]}
                onPress={() => handleViewSession(session.id)}
              >
                <View style={styles.recentSessionContent}>
                  <View>
                    <Text style={[styles.recentSessionTitle, { color: colors.foreground }]}>
                      {session.courseCode} - {session.courseName}
                    </Text>
                    <Text style={[styles.recentSessionMeta, { color: colors.foregroundMuted }]}>
                      {new Date(session.startTime).toLocaleDateString()} • {session.attendance?.length || 0} students
                    </Text>
                  </View>
                  <View style={[styles.completedBadge, { backgroundColor: colors.success }]}>
                    <Text style={styles.completedText}>COMPLETED</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={48} color={colors.foregroundMuted} />
              <Text style={[styles.emptyText, { color: colors.foreground }]}>No recent sessions</Text>
              <Text style={[styles.emptySubtext, { color: colors.foregroundMuted }]}>
                Your completed attendance sessions will appear here
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Create Session Drawer */}
      <CreateSessionDrawer
        visible={createDrawerVisible}
        onClose={() => setCreateDrawerVisible(false)}
        onSuccess={handleSessionCreated}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  greeting: {
    fontSize: 14,
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 4,
  },
  appBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  appBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  seeAll: {
    fontSize: 14,
    fontWeight: "600",
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  actionCard: {
    width: "48%",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    textAlign: "center",
  },
  sessionCard: {
    padding: 16,
    marginBottom: 12,
  },
  sessionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  sessionInfo: {
    flex: 1,
    marginRight: 12,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  sessionSubtitle: {
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
  liveStats: {
    marginBottom: 12,
  },
  progressContainer: {
    height: 6,
    backgroundColor: "rgba(0,0,0,0.1)",
    borderRadius: 3,
    marginBottom: 8,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 3,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statText: {
    fontSize: 14,
    fontWeight: "500",
  },
  rateText: {
    fontSize: 14,
    fontWeight: "600",
  },
  sessionActions: {
    flexDirection: "row",
    gap: 12,
  },
  sessionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  sessionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  endButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 16,
  },
  statItem: {
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 12,
  },
  recentSession: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  recentSessionContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  recentSessionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  recentSessionMeta: {
    fontSize: 14,
  },
  completedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "500",
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
  },
});
