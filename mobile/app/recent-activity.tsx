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
import { useThemeColors } from "@/constants/design-system";
import { Card } from "@/components/ui/card";
import { H1, Text } from "@/components/ui/typography";
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
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <H1 style={[styles.headerTitle, { color: colors.foreground }]}>
            Recent Activity
          </H1>
          <View style={{ width: 24 }} />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        {/* Summary */}
        {activityData?.summary && (
          <Card elevation="sm" style={styles.summaryCard}>
            <View style={styles.summaryContent}>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryNumber, { color: colors.primary }]}>
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
                <Text style={[styles.summaryNumber, { color: colors.success }]}>
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
                <Text style={[styles.summaryNumber, { color: colors.warning }]}>
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
        )}

        {/* Clear All Button */}
        {activityData?.activities && activityData.activities.length > 0 && (
          <View style={styles.clearButtonContainer}>
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
          <View style={styles.activityList}>
            {activityData.activities.map((activity) => (
              <TouchableOpacity
                key={activity.id}
                style={[styles.activityItem, { backgroundColor: colors.card }]}
                activeOpacity={0.7}
                onPress={() => {
                  // Navigate based on activity type
                  if (activity.type === "incident") {
                    const incidentId = activity.id.replace("incident-", "");
                    router.push(`/incident-details?id=${incidentId}` as any);
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
                    style={[styles.activityTitle, { color: colors.foreground }]}
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
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons
              name="document-text-outline"
              size={64}
              color={colors.foregroundMuted}
            />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              No Recent Activity
            </Text>
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
    borderBottomColor: "#e5e5e5",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  scrollView: {
    flex: 1,
  },
  summaryCard: {
    margin: 16,
    marginBottom: 8,
  },
  summaryContent: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 16,
  },
  summaryItem: {
    alignItems: "center",
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: "bold",
  },
  summaryLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  clearButtonContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  clearButtonText: {
    color: "white",
    fontWeight: "600",
  },
  loadingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  activityList: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  activityIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 14,
    marginBottom: 4,
    lineHeight: 18,
  },
  activityTime: {
    fontSize: 12,
  },
  activityStatus: {
    marginLeft: 12,
  },
  statusBadge: {
    minWidth: 70,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
  },
});
