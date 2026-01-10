/**
 * Attendance Analytics Screen
 * View attendance statistics, insights, and trends
 * Mobile-first responsive design with comprehensive metrics
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "@/constants/design-system";
import { Card } from "@/components/ui/card";
import { LineChart, BarChart, PieChart } from "react-native-chart-kit";
import { toast } from "@/utils/toast";
import type { VerificationMethod, AttendanceStatus } from "@/types";

interface LecturerStats {
  overview: {
    totalSessions: number;
    completedSessions: number;
    activeSessions: number;
    totalStudentsRecorded: number;
    avgStudentsPerSession: number;
    avgAttendanceRate: number;
  };
  byCourse: {
    courseCode: string;
    courseName: string;
    sessionCount: number;
    expectedStudents: number;
    actualStudents: number;
    attendanceRate: number;
  }[];
  methodBreakdown: {
    method: VerificationMethod;
    count: number;
    percentage: number;
  }[];
  statusBreakdown: {
    status: AttendanceStatus;
    count: number;
    percentage: number;
  }[];
  weeklyTrend: {
    day: string;
    sessions: number;
    students: number;
    rate: number;
  }[];
  monthlyTrend: {
    month: string;
    sessions: number;
    students: number;
    rate: number;
  }[];
  peakTimes: {
    hour: string;
    count: number;
  }[];
}

type TimeRange = "week" | "month" | "semester";

export default function AttendanceAnalytics() {
  const colors = useThemeColors();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lecturerStats, setLecturerStats] = useState<LecturerStats | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>("week");

  // Chart dimensions - responsive
  const screenWidth = Dimensions.get("window").width;
  const chartWidth = Math.min(screenWidth - 48, 400); // Max 400px wide

  // Chart configuration
  const chartConfig = {
    backgroundColor: colors.background,
    backgroundGradientFrom: colors.background,
    backgroundGradientTo: colors.background,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    labelColor: (opacity = 1) => colors.foregroundMuted,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: colors.primary,
    },
  };

  useEffect(() => {
    loadData();
  }, [timeRange]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));

      // Generate comprehensive dummy data
      const dummyStats: LecturerStats = {
        overview: {
          totalSessions: 24,
          completedSessions: 22,
          activeSessions: 2,
          totalStudentsRecorded: 1248,
          avgStudentsPerSession: 52,
          avgAttendanceRate: 87,
        },
        byCourse: [
          {
            courseCode: "CS301",
            courseName: "Data Structures & Algorithms",
            sessionCount: 10,
            expectedStudents: 550,
            actualStudents: 492,
            attendanceRate: 89,
          },
          {
            courseCode: "MATH201",
            courseName: "Linear Algebra",
            sessionCount: 8,
            expectedStudents: 360,
            actualStudents: 298,
            attendanceRate: 83,
          },
          {
            courseCode: "PHYS101",
            courseName: "Classical Mechanics",
            sessionCount: 6,
            expectedStudents: 280,
            actualStudents: 258,
            attendanceRate: 92,
          },
        ],
        methodBreakdown: [
          { method: "QR_SCAN" as VerificationMethod, count: 512, percentage: 41 },
          { method: "LINK_SELF_MARK" as VerificationMethod, count: 386, percentage: 31 },
          { method: "MANUAL_ENTRY" as VerificationMethod, count: 224, percentage: 18 },
          { method: "BIOMETRIC_FACE" as VerificationMethod, count: 126, percentage: 10 },
        ],
        statusBreakdown: [
          { status: "PRESENT" as AttendanceStatus, count: 1086, percentage: 87 },
          { status: "LATE" as AttendanceStatus, count: 112, percentage: 9 },
          { status: "EXCUSED" as AttendanceStatus, count: 50, percentage: 4 },
        ],
        weeklyTrend: [
          { day: "Mon", sessions: 4, students: 198, rate: 88 },
          { day: "Tue", sessions: 5, students: 246, rate: 85 },
          { day: "Wed", sessions: 3, students: 152, rate: 91 },
          { day: "Thu", sessions: 5, students: 252, rate: 89 },
          { day: "Fri", sessions: 3, students: 145, rate: 82 },
          { day: "Sat", sessions: 2, students: 96, rate: 78 },
          { day: "Sun", sessions: 0, students: 0, rate: 0 },
        ],
        monthlyTrend: [
          { month: "Jan", sessions: 5, students: 248, rate: 86 },
          { month: "Feb", sessions: 6, students: 298, rate: 84 },
          { month: "Mar", sessions: 7, students: 356, rate: 89 },
          { month: "Apr", sessions: 6, students: 346, rate: 91 },
        ],
        peakTimes: [
          { hour: "8:00", count: 45 },
          { hour: "10:00", count: 128 },
          { hour: "12:00", count: 86 },
          { hour: "14:00", count: 156 },
          { hour: "16:00", count: 92 },
        ],
      };

      setLecturerStats(dummyStats);
    } catch (error: any) {
      console.error("Failed to load analytics:", error);
      toast.error(error.error || error.message || "Failed to load analytics");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getMethodLabel = (method: VerificationMethod): string => {
    const labels: Record<VerificationMethod, string> = {
      QR_SCAN: "QR Scan",
      MANUAL_ENTRY: "Manual",
      BIOMETRIC_FINGERPRINT: "Fingerprint",
      BIOMETRIC_FACE: "Face ID",
      LINK_SELF_MARK: "Self-Mark",
    };
    return labels[method] || method;
  };

  const getStatusLabel = (status: AttendanceStatus): string => {
    const labels: Record<AttendanceStatus, string> = {
      PRESENT: "Present",
      LATE: "Late",
      EXCUSED: "Excused",
      ABSENT: "Absent",
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: AttendanceStatus): string => {
    const statusColors: Record<AttendanceStatus, string> = {
      PRESENT: colors.success,
      LATE: "#f59e0b", // Amber
      EXCUSED: colors.primary,
      ABSENT: colors.error,
    };
    return statusColors[status] || colors.foregroundMuted;
  };

  const renderTimeRangeSelector = () => (
    <View style={[styles.timeRangeSelector, { backgroundColor: colors.muted }]}>
      {(["week", "month", "semester"] as TimeRange[]).map((range) => (
        <TouchableOpacity
          key={range}
          style={[
            styles.timeRangeButton,
            timeRange === range && {
              backgroundColor: colors.background,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            },
          ]}
          onPress={() => setTimeRange(range)}
        >
          <Text
            style={[
              styles.timeRangeText,
              {
                color: timeRange === range ? colors.primary : colors.foregroundMuted,
                fontWeight: timeRange === range ? "700" : "500",
              },
            ]}
          >
            {range.charAt(0).toUpperCase() + range.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderOverviewCards = () => {
    if (!lecturerStats) return null;

    const { overview } = lecturerStats;

    const cards = [
      {
        icon: "calendar-outline" as const,
        label: "Total Sessions",
        value: overview.totalSessions.toString(),
        color: colors.primary,
        subtitle: `${overview.completedSessions} completed`,
      },
      {
        icon: "people-outline" as const,
        label: "Students Recorded",
        value: overview.totalStudentsRecorded.toString(),
        color: colors.success,
        subtitle: `Avg. ${overview.avgStudentsPerSession}/session`,
      },
      {
        icon: "checkmark-circle-outline" as const,
        label: "Attendance Rate",
        value: `${overview.avgAttendanceRate}%`,
        color: overview.avgAttendanceRate >= 80 ? colors.success : "#f59e0b",
        subtitle: overview.avgAttendanceRate >= 80 ? "Excellent" : "Good",
      },
    ];

    return (
      <View style={styles.overviewGrid}>
        {cards.map((card, index) => (
          <Card key={index} elevation="sm" style={styles.overviewCard}>
            <View style={styles.overviewCardContent}>
              <View style={[styles.iconContainer, { backgroundColor: `${card.color}15` }]}>
                <Ionicons name={card.icon} size={24} color={card.color} />
              </View>
              <View style={styles.overviewCardText}>
                <Text style={[styles.overviewValue, { color: card.color }]}>
                  {card.value}
                </Text>
                <Text style={[styles.overviewLabel, { color: colors.foregroundMuted }]}>
                  {card.label}
                </Text>
                <Text style={[styles.overviewSubtitle, { color: colors.foregroundMuted }]}>
                  {card.subtitle}
                </Text>
              </View>
            </View>
          </Card>
        ))}
      </View>
    );
  };

  const renderTrendChart = () => {
    if (!lecturerStats) return null;

    const data = timeRange === "week" ? lecturerStats.weeklyTrend : lecturerStats.monthlyTrend;

    return (
      <Card elevation="sm" style={styles.chartCard}>
        <Text style={[styles.chartTitle, { color: colors.foreground }]}>
          Attendance Trend
        </Text>
        <Text style={[styles.chartSubtitle, { color: colors.foregroundMuted }]}>
          {timeRange === "week" ? "Last 7 days" : "Last 4 months"}
        </Text>
        <LineChart
          data={{
            labels: data.map((item) => 'day' in item ? item.day : item.month),
            datasets: [
              {
                data: data.map((item) => item.rate),
                color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
                strokeWidth: 3,
              },
            ],
          }}
          width={chartWidth}
          height={220}
          chartConfig={{
            ...chartConfig,
            color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
          }}
          bezier
          style={styles.chart}
          withInnerLines={false}
          withOuterLines={true}
          withVerticalLabels={true}
          withHorizontalLabels={true}
          fromZero={true}
          yAxisSuffix="%"
        />
      </Card>
    );
  };

  const renderMethodBreakdown = () => {
    if (!lecturerStats) return null;

    const colors_array = [
      "rgba(59, 130, 246, 0.9)",   // Blue
      "rgba(34, 197, 94, 0.9)",    // Green
      "rgba(251, 191, 36, 0.9)",   // Amber
      "rgba(168, 85, 247, 0.9)",   // Purple
    ];

    return (
      <Card elevation="sm" style={styles.chartCard}>
        <Text style={[styles.chartTitle, { color: colors.foreground }]}>
          Recording Methods
        </Text>
        <Text style={[styles.chartSubtitle, { color: colors.foregroundMuted }]}>
          How attendance was recorded
        </Text>
        <PieChart
          data={lecturerStats.methodBreakdown.map((method, index) => ({
            name: getMethodLabel(method.method),
            population: method.count,
            color: colors_array[index % colors_array.length],
            legendFontColor: colors.foreground,
            legendFontSize: 13,
          }))}
          width={chartWidth}
          height={220}
          chartConfig={chartConfig}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          center={[10, 0]}
          absolute
          style={styles.chart}
        />
      </Card>
    );
  };

  const renderStatusBreakdown = () => {
    if (!lecturerStats) return null;

    return (
      <Card elevation="sm" style={styles.chartCard}>
        <Text style={[styles.chartTitle, { color: colors.foreground }]}>
          Attendance Status
        </Text>
        <Text style={[styles.chartSubtitle, { color: colors.foregroundMuted }]}>
          Student attendance breakdown
        </Text>
        <View style={styles.statusList}>
          {lecturerStats.statusBreakdown.map((status) => (
            <View key={status.status} style={styles.statusItem}>
              <View style={styles.statusItemLeft}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: getStatusColor(status.status) },
                  ]}
                />
                <Text style={[styles.statusLabel, { color: colors.foreground }]}>
                  {getStatusLabel(status.status)}
                </Text>
              </View>
              <View style={styles.statusItemRight}>
                <Text style={[styles.statusCount, { color: colors.foreground }]}>
                  {status.count}
                </Text>
                <Text style={[styles.statusPercentage, { color: colors.foregroundMuted }]}>
                  {status.percentage}%
                </Text>
              </View>
            </View>
          ))}
        </View>
      </Card>
    );
  };

  const renderCoursePerformance = () => {
    if (!lecturerStats) return null;

    return (
      <Card elevation="sm" style={styles.chartCard}>
        <Text style={[styles.chartTitle, { color: colors.foreground }]}>
          Course Performance
        </Text>
        <Text style={[styles.chartSubtitle, { color: colors.foregroundMuted }]}>
          Attendance rates by course
        </Text>
        <View style={styles.courseList}>
          {lecturerStats.byCourse.map((course) => (
            <View key={course.courseCode} style={styles.courseItem}>
              <View style={styles.courseHeader}>
                <View>
                  <Text style={[styles.courseCode, { color: colors.foreground }]}>
                    {course.courseCode}
                  </Text>
                  <Text style={[styles.courseName, { color: colors.foregroundMuted }]}>
                    {course.courseName}
                  </Text>
                </View>
                <View style={styles.courseStats}>
                  <Text
                    style={[
                      styles.courseRate,
                      {
                        color:
                          course.attendanceRate >= 85
                            ? colors.success
                            : course.attendanceRate >= 70
                            ? colors.primary
                            : "#f59e0b",
                      },
                    ]}
                  >
                    {course.attendanceRate}%
                  </Text>
                </View>
              </View>
              <View style={styles.courseDetails}>
                <Text style={[styles.courseDetailText, { color: colors.foregroundMuted }]}>
                  {course.sessionCount} sessions • {course.actualStudents}/{course.expectedStudents} students
                </Text>
              </View>
              <View
                style={[
                  styles.progressBar,
                  { backgroundColor: colors.muted },
                ]}
              >
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${course.attendanceRate}%`,
                      backgroundColor:
                        course.attendanceRate >= 85
                          ? colors.success
                          : course.attendanceRate >= 70
                          ? colors.primary
                          : "#f59e0b",
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>
      </Card>
    );
  };

  const renderPeakTimes = () => {
    if (!lecturerStats) return null;

    return (
      <Card elevation="sm" style={styles.chartCard}>
        <Text style={[styles.chartTitle, { color: colors.foreground }]}>
          Peak Attendance Times
        </Text>
        <Text style={[styles.chartSubtitle, { color: colors.foregroundMuted }]}>
          When students mark attendance most
        </Text>
        <BarChart
          data={{
            labels: lecturerStats.peakTimes.map((item) => item.hour),
            datasets: [
              {
                data: lecturerStats.peakTimes.map((item) => item.count),
              },
            ],
          }}
          width={chartWidth}
          height={220}
          chartConfig={{
            ...chartConfig,
            color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
          }}
          style={styles.chart}
          showValuesOnTopOfBars
          fromZero
          yAxisLabel=""
          yAxisSuffix=""
        />
      </Card>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.foregroundMuted }]}>
            Loading analytics...
          </Text>
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
            Attendance insights & trends
          </Text>
        </View>
      </View>

      {renderTimeRangeSelector()}

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
        showsVerticalScrollIndicator={false}
      >
        {renderOverviewCards()}
        {renderTrendChart()}
        {renderCoursePerformance()}
        {renderMethodBreakdown()}
        {renderStatusBreakdown()}
        {renderPeakTimes()}
        
        <View style={styles.bottomSpacer} />
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
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  timeRangeSelector: {
    flexDirection: "row",
    marginHorizontal: 24,
    marginVertical: 12,
    padding: 4,
    borderRadius: 12,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  timeRangeText: {
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  overviewGrid: {
    gap: 12,
    marginBottom: 16,
  },
  overviewCard: {
    padding: 0,
  },
  overviewCardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  overviewCardText: {
    flex: 1,
    gap: 2,
  },
  overviewValue: {
    fontSize: 28,
    fontWeight: "bold",
  },
  overviewLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  overviewSubtitle: {
    fontSize: 12,
  },
  chartCard: {
    marginBottom: 16,
    padding: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  chartSubtitle: {
    fontSize: 13,
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  statusList: {
    gap: 12,
  },
  statusItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  statusItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusLabel: {
    fontSize: 15,
    fontWeight: "500",
  },
  statusItemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusCount: {
    fontSize: 16,
    fontWeight: "bold",
  },
  statusPercentage: {
    fontSize: 14,
    fontWeight: "500",
  },
  courseList: {
    gap: 16,
  },
  courseItem: {
    paddingVertical: 8,
  },
  courseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  courseCode: {
    fontSize: 16,
    fontWeight: "bold",
  },
  courseName: {
    fontSize: 13,
    marginTop: 2,
  },
  courseStats: {
    alignItems: "flex-end",
  },
  courseRate: {
    fontSize: 20,
    fontWeight: "bold",
  },
  courseDetails: {
    marginBottom: 8,
  },
  courseDetailText: {
    fontSize: 12,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  bottomSpacer: {
    height: 24,
  },
});