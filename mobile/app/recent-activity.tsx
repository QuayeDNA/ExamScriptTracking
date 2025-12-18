/**
 * Recent Activity Page
 * Dedicated page showing all recent user activities with clear option
 */

import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useThemeColors, Spacing, Typography } from "@/constants/design-system";
import { Card } from "@/components/ui/card";
import { H2, H3, Text } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getUserActivity,
  clearUserActivity,
  type UserActivity,
  type UserActivityResponse,
} from "@/api/analytics";

// Helper functions for activity display
const getActivityIcon = (
  type: UserActivity["type"]
): keyof typeof Ionicons.glyphMap => {
  switch (type) {
    case "audit":
      return "person-circle-outline";
    case "incident":
      return "alert-circle-outline";
    case "transfer":
      return "swap-horizontal-outline";
    case "attendance":
      return "people-outline";
    default:
      return "ellipse-outline";
  }
};

const getActivityColor = (status: string, colors: any): string => {
  switch (status.toLowerCase()) {
    case "completed":
    case "resolved":
    case "confirmed":
      return colors.success;
    case "pending":
    case "investigating":
    case "requested":
      return colors.warning;
    case "failed":
    case "cancelled":
      return colors.error;
    default:
      return colors.primary;
  }
};

const getStatusVariant = (
  status: string
): "default" | "secondary" | "error" | "outline" => {
  switch (status.toLowerCase()) {
    case "completed":
    case "resolved":
    case "confirmed":
      return "default";
    case "pending":
    case "investigating":
    case "requested":
      return "secondary";
    case "failed":
    case "cancelled":
      return "error";
    default:
      return "outline";
  }
};

export default function RecentActivityScreen() {
  const colors = useThemeColors();
  const queryClient = useQueryClient();

  // Fetch user activity
  const { data: activityData, isLoading } = useQuery<UserActivityResponse>({
    queryKey: ["user-activity"],
    queryFn: getUserActivity,
  });

  const handleClearAll = async () => {
    Alert.alert(
      "Clear All Activity",
      "Are you sure you want to clear all your recent activity? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            try {
              await clearUserActivity();
              // Invalidate and refetch the query
              queryClient.invalidateQueries({ queryKey: ["user-activity"] });
              Alert.alert("Success", "All recent activity has been cleared.");
            } catch {
              Alert.alert(
                "Error",
                "Failed to clear activity. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <H2 style={[styles.headerTitle, { color: colors.foreground }]}>
            Recent Activity
          </H2>
          <View style={{ width: 40 }} />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Summary Stats */}
        {activityData?.summary && (
          <View style={styles.section}>
            <Card elevation="sm" style={styles.summaryCard}>
              <View style={styles.summaryGrid}>
                <View style={styles.summaryItem}>
                  <Text
                    style={[styles.summaryNumber, { color: colors.primary }]}
                  >
                    {activityData.summary.totalActivities}
                  </Text>
                  <Text
                    style={[
                      styles.summaryLabel,
                      { color: colors.foregroundMuted },
                    ]}
                  >
                    Total Activities
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text
                    style={[styles.summaryNumber, { color: colors.success }]}
                  >
                    {activityData.summary.auditLogs}
                  </Text>
                  <Text
                    style={[
                      styles.summaryLabel,
                      { color: colors.foregroundMuted },
                    ]}
                  >
                    Audit Logs
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text
                    style={[styles.summaryNumber, { color: colors.warning }]}
                  >
                    {activityData.summary.incidents}
                  </Text>
                  <Text
                    style={[
                      styles.summaryLabel,
                      { color: colors.foregroundMuted },
                    ]}
                  >
                    Incidents
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryNumber, { color: colors.info }]}>
                    {activityData.summary.transfers}
                  </Text>
                  <Text
                    style={[
                      styles.summaryLabel,
                      { color: colors.foregroundMuted },
                    ]}
                  >
                    Transfers
                  </Text>
                </View>
              </View>
            </Card>
          </View>
        )}

        {/* Clear All Button */}
        {activityData?.activities && activityData.activities.length > 0 && (
          <View style={styles.section}>
            <Button
              variant="destructive"
              onPress={handleClearAll}
              style={styles.clearButton}
            >
              <Ionicons name="trash-outline" size={16} color="white" />
              <Text style={styles.clearButtonText}>Clear All Activity</Text>
            </Button>
          </View>
        )}

        {/* Activity List */}
        {isLoading ? (
          <View style={styles.loadingState}>
            <Ionicons
              name="time-outline"
              size={48}
              color={colors.foregroundMuted}
            />
            <Text
              style={[styles.loadingText, { color: colors.foregroundMuted }]}
            >
              Loading activity...
            </Text>
          </View>
        ) : activityData?.activities && activityData.activities.length > 0 ? (
          <View style={styles.section}>
            <H3 style={[styles.sectionTitle, { color: colors.foreground }]}>
              Recent Activities
            </H3>
            <View style={styles.activityList}>
              {activityData.activities.map((activity) => (
                <Card
                  key={activity.id}
                  elevation="sm"
                  style={styles.activityCard}
                >
                  <TouchableOpacity
                    style={styles.activityItem}
                    activeOpacity={0.7}
                    onPress={() => {
                      // Navigate based on activity type
                      if (activity.type === "incident") {
                        const incidentId = activity.id.replace("incident-", "");
                        router.push(
                          `/incident-details?id=${incidentId}` as any
                        );
                      }
                    }}
                  >
                    <View style={styles.activityIcon}>
                      <Ionicons
                        name={getActivityIcon(activity.type)}
                        size={20}
                        color={getActivityColor(activity.status, colors)}
                      />
                    </View>
                    <View style={styles.activityContent}>
                      <Text
                        style={[
                          styles.activityTitle,
                          { color: colors.foreground },
                        ]}
                        numberOfLines={1}
                      >
                        {activity.title}
                      </Text>
                      <Text
                        style={[
                          styles.activityDescription,
                          { color: colors.foregroundMuted },
                        ]}
                        numberOfLines={2}
                      >
                        {activity.description}
                      </Text>
                      <Text
                        style={[
                          styles.activityTime,
                          { color: colors.foregroundMuted },
                        ]}
                      >
                        {new Date(activity.timestamp).toLocaleDateString()} •{" "}
                        {new Date(activity.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                    </View>
                    <View style={styles.activityStatus}>
                      <Badge
                        variant={getStatusVariant(activity.status)}
                        style={styles.statusBadge}
                      >
                        {activity.status}
                      </Badge>
                    </View>
                  </TouchableOpacity>
                </Card>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons
              name="document-text-outline"
              size={64}
              color={colors.foregroundMuted}
            />
            <H2 style={[styles.emptyTitle, { color: colors.foreground }]}>
              No Recent Activity
            </H2>
            <Text
              style={[
                styles.emptyDescription,
                { color: colors.foregroundMuted },
              ]}
            >
              Your recent activities will appear here.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
    // borderBottomColor is set dynamically in the component using colors.border
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[4],
  },
  backButton: {
    padding: Spacing[2],
    marginLeft: -Spacing[2],
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  summaryCard: {
    padding: 16,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing[4],
  },
  summaryItem: {
    flex: 1,
    minWidth: Spacing[20],
    alignItems: "center",
  },
  summaryNumber: {
    fontSize: Typography.fontSize["2xl"],
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing[1],
  },
  summaryLabel: {
    fontSize: Typography.fontSize.xs,
    textAlign: "center",
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing[2],
  },
  clearButtonText: {
    color: "white",
    fontWeight: Typography.fontWeight.semibold,
  },
  loadingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing[16],
  },
  loadingText: {
    marginTop: Spacing[4],
    fontSize: Typography.fontSize.base,
  },
  activityList: {
    gap: Spacing[3],
  },
  activityCard: {
    margin: 0,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: Spacing[4],
  },
  activityIcon: {
    marginRight: Spacing[3],
    marginTop: 2, // or use Spacing[1] if you want to keep spacing consistent
  },
  activityContent: {
    flex: 1,
    gap: Spacing[1],
  },
  activityTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
  activityDescription: {
    fontSize: Typography.fontSize.sm,
    lineHeight: Typography.lineHeight.normal * Typography.fontSize.sm,
  },
  activityTime: {
    fontSize: Typography.fontSize.xs,
  },
  activityStatus: {
    marginLeft: Spacing[3],
  },
  statusBadge: {
    minWidth: Spacing[16],
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing[16],
    paddingHorizontal: Spacing[8],
  },
  emptyTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semibold,
    marginTop: Spacing[4],
    marginBottom: Spacing[2],
    textAlign: "center",
  },
  emptyDescription: {
    fontSize: Typography.fontSize.base,
    textAlign: "center",
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
  },
});
