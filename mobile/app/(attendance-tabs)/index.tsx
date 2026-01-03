/**
 * Attendance Dashboard
 * Main landing screen for the attendance app
 */

import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "@/constants/design-system";
import { useAuthStore } from "@/store/auth";
import { Card } from "@/components/ui/card";
import { classAttendanceApi, type SessionLiveStats } from "@/api/classAttendance";
import { useSocket } from "@/hooks/useSocket";
import type { ClassAttendanceRecord } from "@/types";

export default function AttendanceDashboard() {
  const colors = useThemeColors();
  const { user } = useAuthStore();
  const socket = useSocket();
  const [activeSessions, setActiveSessions] = useState<ClassAttendanceRecord[]>([]);
  const [recentSessions, setRecentSessions] = useState<ClassAttendanceRecord[]>([]);
  const [liveStats, setLiveStats] = useState<SessionLiveStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const setupSocketListeners = useCallback(() => {
    const unsubscribers: (() => void)[] = [];

    // Listen for session started events
    unsubscribers.push(socket.on("session:started", (data: unknown) => {
      const typedData = data as { record: ClassAttendanceRecord };
      setActiveSessions((prev) => [typedData.record, ...prev]);
    }));

    // Listen for session ended events
    unsubscribers.push(socket.on("session:ended", (data: unknown) => {
      const typedData = data as { record: ClassAttendanceRecord };
      setActiveSessions((prev) => prev.filter((s) => s.id !== typedData.record.id));
      setLiveStats((prev) => prev && prev.sessionId === typedData.record.id ? null : prev);
    }));

    // Listen for attendance recorded events
    unsubscribers.push(socket.on("attendance:recorded", (data: unknown) => {
      const typedData = data as { record: ClassAttendanceRecord };
      setActiveSessions((prev) =>
        prev.map((session) => (session.id === typedData.record.id ? typedData.record : session))
      );
    }));

    // Listen for live attendance updates
    unsubscribers.push(socket.on("attendance:live_update", (data: unknown) => {
      const typedData = data as { recordId: string; stats: any };
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
    loadRecentSessions();
    const cleanup = setupSocketListeners();
    return cleanup;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load live stats for the first active session
  useEffect(() => {
    if (activeSessions.length > 0 && activeSessions[0].status === 'IN_PROGRESS') {
      loadLiveStats(activeSessions[0].id);
    } else {
      setLiveStats(null);
    }
  }, [activeSessions]);

  const loadActiveSessions = async () => {
    try {
      const response = await classAttendanceApi.getActiveSessions();
      setActiveSessions(response.sessions || []);
    } catch (error: any) {
      console.error("Failed to load sessions:", error);
    }
  };

  const loadRecentSessions = async () => {
    try {
      const response = await classAttendanceApi.getAttendanceHistory({ 
        limit: 5,
        status: 'COMPLETED'
      });
      setRecentSessions(response.records || []);
    } catch (error: any) {
      console.error("Failed to load recent sessions:", error);
    }
  };

  const loadLiveStats = async (sessionId: string) => {
    try {
      const stats = await classAttendanceApi.getSessionLiveStats(sessionId);
      setLiveStats(stats);
    } catch (error: any) {
      console.error("Failed to load live stats:", error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadActiveSessions(), loadRecentSessions()]);
    setRefreshing(false);
  };



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
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.foregroundMuted }]}>
              Good {getTimeOfDay()},
            </Text>
            <Text style={[styles.userName, { color: colors.foreground }]}>
              {user?.name}
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
              onPress={() => {/* TODO: Navigate to start recording */}}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#10b981' }]}>
                <Ionicons name="add-circle" size={28} color="#fff" />
              </View>
              <Text style={[styles.actionTitle, { color: colors.foreground }]}>
                Start Recording
              </Text>
              <Text style={[styles.actionSubtitle, { color: colors.foregroundMuted }]}>
                New attendance session
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: colors.card }]}
              onPress={() => router.push("/(attendance-tabs)/sessions")}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#3b82f6' }]}>
                <Ionicons name="list" size={28} color="#fff" />
              </View>
              <Text style={[styles.actionTitle, { color: colors.foreground }]}>
                Active Sessions
              </Text>
              <Text style={[styles.actionSubtitle, { color: colors.foregroundMuted }]}>
                View ongoing recordings
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: colors.card }]}
              onPress={() => router.push("/(attendance-tabs)/scanner")}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#8b5cf6' }]}>
                <Ionicons name="qr-code" size={28} color="#fff" />
              </View>
              <Text style={[styles.actionTitle, { color: colors.foreground }]}>
                QR Scanner
              </Text>
              <Text style={[styles.actionSubtitle, { color: colors.foregroundMuted }]}>
                Scan student IDs
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: colors.card }]}
              onPress={() => router.push("/(attendance-tabs)/history")}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#f59e0b' }]}>
                <Ionicons name="stats-chart" size={28} color="#fff" />
              </View>
              <Text style={[styles.actionTitle, { color: colors.foreground }]}>
                Analytics
              </Text>
              <Text style={[styles.actionSubtitle, { color: colors.foregroundMuted }]}>
                View reports
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Live Session Stats */}
        {activeSessions.length > 0 && liveStats && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Live Session
              </Text>
              <TouchableOpacity onPress={() => router.push({
                pathname: "/session-details" as any,
                params: { sessionId: activeSessions[0].id }
              })}>
                <Text style={[styles.seeAll, { color: colors.primary }]}>View Details</Text>
              </TouchableOpacity>
            </View>

            <Card elevation="sm" style={styles.liveSessionCard}>
              <View style={styles.liveSessionHeader}>
                <View>
                  <Text style={[styles.liveSessionTitle, { color: colors.foreground }]}>
                    {liveStats.courseCode} - {liveStats.courseName}
                  </Text>
                  <Text style={[styles.liveSessionSubtitle, { color: colors.foregroundMuted }]}>
                    {liveStats.statistics.totalRecorded}/{liveStats.statistics.totalRegisteredStudents || 'N/A'} students
                    {liveStats.statistics.attendanceRate ? ` (${liveStats.statistics.attendanceRate}%)` : ''}
                  </Text>
                </View>
                <View style={[styles.liveIndicator, { backgroundColor: colors.success }]}>
                  <Ionicons name="radio-button-on" size={10} color="#fff" />
                  <Text style={styles.liveIndicatorText}>LIVE</Text>
                </View>
              </View>

              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(liveStats.statistics.attendanceRate || 0, 100)}%`,
                      backgroundColor: (liveStats.statistics.attendanceRate || 0) >= 80 ? colors.success :
                                      (liveStats.statistics.attendanceRate || 0) >= 60 ? colors.warning : colors.error
                    }
                  ]}
                />
              </View>

              <View style={styles.methodStats}>
                <View style={styles.methodStat}>
                  <Ionicons name="finger-print" size={16} color={colors.primary} />
                  <Text style={[styles.methodStatText, { color: colors.foreground }]}>
                    {liveStats.methodBreakdown.biometric} ({liveStats.methodBreakdown.biometricPercent}%)
                  </Text>
                </View>
                <View style={styles.methodStat}>
                  <Ionicons name="qr-code" size={16} color={colors.success} />
                  <Text style={[styles.methodStatText, { color: colors.foreground }]}>
                    {liveStats.methodBreakdown.qrCode} ({liveStats.methodBreakdown.qrPercent}%)
                  </Text>
                </View>
                <View style={styles.methodStat}>
                  <Ionicons name="create" size={16} color={colors.warning} />
                  <Text style={[styles.methodStatText, { color: colors.foreground }]}>
                    {liveStats.methodBreakdown.manual} ({liveStats.methodBreakdown.manualPercent}%)
                  </Text>
                </View>
              </View>
            </Card>
          </View>
        )}

        {/* Today's Stats */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Today&apos;s Overview
          </Text>
          
          <Card elevation="sm">
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Ionicons name="people" size={24} color={colors.primary} />
                <Text style={[styles.statValue, { color: colors.foreground }]}>
                  {activeSessions.length}
                </Text>
                <Text style={[styles.statLabel, { color: colors.foregroundMuted }]}>
                  Sessions
                </Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                <Text style={[styles.statValue, { color: colors.foreground }]}>
                  {liveStats?.statistics.presentCount || 0}
                </Text>
                <Text style={[styles.statLabel, { color: colors.foregroundMuted }]}>
                  Present
                </Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="time" size={24} color="#f59e0b" />
                <Text style={[styles.statValue, { color: colors.foreground }]}>
                  {liveStats?.statistics.attendanceRate || 0}%
                </Text>
                <Text style={[styles.statLabel, { color: colors.foregroundMuted }]}>
                  Attendance
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
            <TouchableOpacity onPress={() => router.push("/(attendance-tabs)/history")}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {recentSessions.length > 0 ? (
            <View style={{ gap: 12 }}>
              {recentSessions.map((session) => (
                <TouchableOpacity 
                  key={session.id}
                  onPress={() => router.push(`/session-details?sessionId=${session.id}`)}
                >
                  <Card elevation="sm" style={{ padding: 16 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <View style={{ flex: 1, marginRight: 12 }}>
                        <Text style={[{ 
                          fontSize: 18, 
                          fontWeight: 'bold', 
                          color: colors.foreground,
                          marginBottom: 4 
                        }]}>
                          {session.courseCode}
                        </Text>
                        {session.courseName && (
                          <Text style={[{ 
                            fontSize: 14, 
                            color: colors.foregroundMuted,
                            marginBottom: 8
                          }]}>
                            {session.courseName}
                          </Text>
                        )}
                      </View>
                      <View style={[{ 
                        backgroundColor: colors.success + '20',
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 12,
                      }]}>
                        <Text style={[{ color: colors.success, fontSize: 11, fontWeight: '700' }]}>
                          COMPLETED
                        </Text>
                      </View>
                    </View>
                    
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="calendar-outline" size={14} color={colors.foregroundMuted} />
                        <Text style={[{ fontSize: 13, color: colors.foregroundMuted }]}>
                          {new Date(session.startTime).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="people-outline" size={14} color={colors.foregroundMuted} />
                        <Text style={[{ fontSize: 13, color: colors.foregroundMuted }]}>
                          {session.students?.length || 0} students
                        </Text>
                      </View>
                      {session.lecturerName && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Ionicons name="person-outline" size={14} color={colors.foregroundMuted} />
                          <Text style={[{ fontSize: 13, color: colors.foregroundMuted }]}>
                            {session.lecturerName}
                          </Text>
                        </View>
                      )}
                    </View>
                  </Card>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Card elevation="sm">
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={48} color={colors.foregroundMuted} />
                <Text style={[styles.emptyText, { color: colors.foregroundMuted }]}>
                  No recent sessions
                </Text>
                <Text style={[styles.emptySubtext, { color: colors.foregroundMuted }]}>
                  Start recording attendance to see sessions here
                </Text>
              </View>
            </Card>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
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
    marginBottom: 12,
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
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 16,
  },
  statItem: {
    alignItems: "center",
    gap: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 12,
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
  liveSessionCard: {
    padding: 16,
  },
  liveSessionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  liveSessionTitle: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  liveSessionSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveIndicatorText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
  progressBar: {
    height: 6,
    backgroundColor: "rgba(0,0,0,0.1)",
    borderRadius: 3,
    marginBottom: 12,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  methodStats: {
    flexDirection: "row",
    gap: 16,
    justifyContent: "space-around",
  },
  methodStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  methodStatText: {
    fontSize: 13,
    fontWeight: "500",
  },
});
