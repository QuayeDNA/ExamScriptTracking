/**
 * Attendance Analytics Screen
 * View attendance statistics, insights, and export data
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "@/constants/design-system";
import { Card } from "@/components/ui/card";
import { classAttendanceApi } from "@/api/classAttendance";
import { toast } from "@/utils/toast";
import type {
  ClassAttendanceRecord,
  AttendanceStats,
  RecordingStatus,
} from "@/types";

type ViewMode = "STATS" | "EXPORT";

export default function AttendanceAnalytics() {
  const colors = useThemeColors();
  const [viewMode, setViewMode] = useState<ViewMode>("STATS");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [history, setHistory] = useState<ClassAttendanceRecord[]>([]);
  const [lecturerStats, setLecturerStats] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [historyResponse, lecturerStatsResponse] = await Promise.all([
        classAttendanceApi.getAttendanceHistory({ limit: 20 }),
        classAttendanceApi.getLecturerStats(),
      ]);

      console.log("History response:", historyResponse);
      console.log("Lecturer stats response:", lecturerStatsResponse);

      setHistory(historyResponse.records || []);
      setLecturerStats(lecturerStatsResponse);
    } catch (error: any) {
      console.error("Failed to load data:", error);
      const errorMessage = error.error || error.message || "Failed to load attendance data";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString()}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString()}`;
    } else {
      return date.toLocaleDateString() + ", " + date.toLocaleTimeString();
    }
  };

  const calculateAttendanceRate = (record: ClassAttendanceRecord): number => {
    const total = record.totalStudents || 0;
    const attended = record.students?.length || 0;
    return total > 0 ? Math.round((attended / total) * 100) : 0;
  };

  const renderHistory = () => {
    if (history.length === 0) {
      return (
        <Card elevation="sm">
          <View style={styles.emptyState}>
            <Ionicons name="time-outline" size={64} color={colors.foregroundMuted} />
            <Text style={[styles.emptyText, { color: colors.foregroundMuted }]}>
              No history yet
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.foregroundMuted }]}>
              Completed attendance sessions will appear here
            </Text>
          </View>
        </Card>
      );
    }

    return (
      <View style={styles.historyList}>
        {history.map((record) => (
          <Card key={record.id} elevation="sm" style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <View style={styles.historyTitleRow}>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: `${getStatusColor(record.status)}20` },
                  ]}
                >
                  <Text style={[styles.statusText, { color: getStatusColor(record.status) }]}>
                    {record.status}
                  </Text>
                </View>
                <Text style={[styles.attendanceRate, { color: colors.foregroundMuted }]}>
                  {calculateAttendanceRate(record)}% attended
                </Text>
              </View>
              <Text style={[styles.courseCode, { color: colors.foreground }]}>
                {record.courseCode}
              </Text>
              {record.courseName && (
                <Text style={[styles.courseName, { color: colors.foregroundMuted }]}>
                  {record.courseName}
                </Text>
              )}
            </View>

            <View style={styles.historyInfo}>
              {record.lecturerName && (
                <View style={styles.infoRow}>
                  <Ionicons name="person-outline" size={16} color={colors.foregroundMuted} />
                  <Text style={[styles.infoText, { color: colors.foregroundMuted }]}>
                    {record.lecturerName}
                  </Text>
                </View>
              )}
              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={16} color={colors.foregroundMuted} />
                <Text style={[styles.infoText, { color: colors.foregroundMuted }]}>
                  {formatDate(record.startTime)}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="people-outline" size={16} color={colors.foregroundMuted} />
                <Text style={[styles.infoText, { color: colors.foregroundMuted }]}>
                  {record.students?.length || 0} / {record.totalStudents || 0} students
                </Text>
              </View>
            </View>

            {record.notes && (
              <View style={[styles.notesContainer, { backgroundColor: colors.muted }]}>
                <Text style={[styles.notesText, { color: colors.foregroundMuted }]}>
                  {record.notes}
                </Text>
              </View>
            )}
          </Card>
        ))}
      </View>
    );
  };

  const renderStats = () => {
    if (!lecturerStats) {
      return (
        <Card elevation="sm">
          <View style={styles.emptyState}>
            <Ionicons name="bar-chart-outline" size={64} color={colors.foregroundMuted} />
            <Text style={[styles.emptyText, { color: colors.foregroundMuted }]}>
              No statistics yet
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.foregroundMuted }]}>
              Statistics will appear after recording attendance
            </Text>
          </View>
        </Card>
      );
    }

    const overview = lecturerStats.overview || lecturerStats;
    const byCourse = lecturerStats.byCourse || [];
    const methodBreakdown = lecturerStats.methodBreakdown || [];

    return (
      <View style={styles.statsContainer}>
        {/* Overview Stats */}
        <Card elevation="sm" style={styles.statsCard}>
          <Text style={[styles.statsTitle, { color: colors.foreground }]}>Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {overview.totalSessions || overview.completedSessions || 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.foregroundMuted }]}>
                Total Sessions
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.success }]}>
                {overview.totalStudentsRecorded || 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.foregroundMuted }]}>
                Students Recorded
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {Math.round(overview.averageAttendanceRate || lecturerStats.averageAttendanceRate || 0)}%
              </Text>
              <Text style={[styles.statLabel, { color: colors.foregroundMuted }]}>
                Avg. Attendance
              </Text>
            </View>
          </View>
        </Card>

        {/* Recording Methods */}
        {methodBreakdown.length > 0 && (
          <Card elevation="sm" style={styles.statsCard}>
            <Text style={[styles.statsTitle, { color: colors.foreground }]}>Recording Methods</Text>
            <View style={{ gap: 12, marginTop: 12 }}>
              {methodBreakdown.map((method: any) => {
                const total = methodBreakdown.reduce((sum: number, m: any) => sum + m.count, 0);
                const percentage = total > 0 ? (method.count / total) * 100 : 0;
                const methodName = method.method === 'QR_CODE' ? 'QR Code' : 
                                  method.method === 'MANUAL_INDEX' ? 'Index Number' : 
                                  method.method === 'BIOMETRIC' ? 'Biometric' : method.method;
                return (
                  <View key={method.method}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text style={{ fontSize: 14, color: colors.foreground, fontWeight: '500' }}>
                        {methodName}
                      </Text>
                      <Text style={{ fontSize: 14, color: colors.foregroundMuted }}>
                        {method.count} ({Math.round(percentage)}%)
                      </Text>
                    </View>
                    <View style={{ height: 8, backgroundColor: colors.muted, borderRadius: 4, overflow: 'hidden' }}>
                      <View style={{ 
                        height: '100%', 
                        width: `${percentage}%`, 
                        backgroundColor: colors.primary,
                        borderRadius: 4
                      }} />
                    </View>
                  </View>
                );
              })}
            </View>
          </Card>
        )}

        {/* By Course */}
        {byCourse.length > 0 && (
          <Card elevation="sm" style={styles.statsCard}>
            <Text style={[styles.statsTitle, { color: colors.foreground }]}>By Course</Text>
            <View style={styles.courseList}>
              {byCourse.map((course: any) => (
                <View key={course.courseCode} style={styles.courseItem}>
                  <View style={styles.courseItemHeader}>
                    <Text style={[styles.courseCodeText, { color: colors.foreground }]}>
                      {course.courseCode}
                    </Text>
                    <Text style={[styles.courseRate, { color: colors.primary }]}>
                      {Math.round(course.attendanceRate)}%
                    </Text>
                  </View>
                  {course.courseName && (
                    <Text style={[styles.courseNameText, { color: colors.foregroundMuted }]}>
                      {course.courseName}
                    </Text>
                  )}
                  <View style={styles.courseStats}>
                    <Text style={[styles.courseStatText, { color: colors.foregroundMuted }]}>
                      {course.sessions} sessions • {course.totalStudents} students
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </Card>
        )}
      </View>
    );
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
          <Text style={[styles.title, { color: colors.foreground }]}>Analytics</Text>
          <Text style={[styles.subtitle, { color: colors.foregroundMuted }]}>
            Insights and statistics
          </Text>
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
        {renderStats()}
      </ScrollView>
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
    marginTop: 4,
  },
  tabSelector: {
    flexDirection: "row",
    paddingHorizontal: 24,
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
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
  historyList: {
    gap: 16,
  },
  historyCard: {
    marginBottom: 16,
  },
  historyHeader: {
    marginBottom: 16,
  },
  historyTitleRow: {
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
  attendanceRate: {
    fontSize: 12,
    fontWeight: "500",
  },
  courseCode: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 4,
  },
  courseName: {
    fontSize: 14,
    marginTop: 4,
  },
  historyInfo: {
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
  },
  notesText: {
    fontSize: 13,
    fontStyle: "italic",
  },
  statsContainer: {
    gap: 16,
  },
  statsCard: {
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 16,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: 32,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 12,
    textAlign: "center",
  },
  courseList: {
    gap: 16,
  },
  courseItem: {
    paddingVertical: 8,
  },
  courseItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  courseCodeText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  courseRate: {
    fontSize: 16,
    fontWeight: "bold",
  },
  courseNameText: {
    fontSize: 14,
    marginTop: 4,
  },
  courseStats: {
    marginTop: 4,
  },
  courseStatText: {
    fontSize: 12,
  },
});
