/**
 * Home Screen
 * Main dashboard with SafeAreaView and design system integration
 */

import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/auth";
import { useThemeColors } from "@/constants/design-system";
import { Card } from "@/components/ui/card";
import { H1, H3, Text } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import {
  getUserActivity,
  type UserActivity,
  type UserActivityResponse,
} from "@/api/analytics";
import { useQuery } from "@tanstack/react-query";

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

export default function HomeScreen() {
  const { user } = useAuthStore();
  const colors = useThemeColors();

  // Fetch user activity
  const { data: activityData, isLoading: activityLoading } =
    useQuery<UserActivityResponse>({
      queryKey: ["user-activity"],
      queryFn: getUserActivity,
    });

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <View style={styles.headerContent}>
            <H1 style={styles.headerTitle}>Welcome Back!</H1>
            <Text style={styles.headerName}>{user?.name || "User"}</Text>
            <View style={styles.headerBadges}>
              <Badge variant="secondary" style={styles.badge}>
                {user?.role?.replace("_", " ") || "Unknown Role"}
              </Badge>
              <Badge variant="secondary" style={styles.badge}>
                {user?.department || "Unknown Department"}
              </Badge>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <Card elevation="sm" style={styles.statCard}>
              <View style={styles.statContent}>
                <Text style={[styles.statNumber, { color: colors.primary }]}>
                  0
                </Text>
                <Text
                  style={[styles.statLabel, { color: colors.foregroundMuted }]}
                >
                  Active Sessions
                </Text>
              </View>
            </Card>

            <Card elevation="sm" style={styles.statCard}>
              <View style={styles.statContent}>
                <Text style={[styles.statNumber, { color: colors.warning }]}>
                  0
                </Text>
                <Text
                  style={[styles.statLabel, { color: colors.foregroundMuted }]}
                >
                  Pending Transfers
                </Text>
              </View>
            </Card>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <H3 style={[styles.sectionTitle, { color: colors.foreground }]}>
            Quick Actions
          </H3>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.card }]}
            onPress={() => router.push("/scanner")}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.actionIcon,
                { backgroundColor: `${colors.primary}15` },
              ]}
            >
              <Ionicons name="scan" size={24} color={colors.primary} />
            </View>
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, { color: colors.foreground }]}>
                Scan QR Code
              </Text>
              <Text
                style={[
                  styles.actionSubtitle,
                  { color: colors.foregroundMuted },
                ]}
              >
                Scan batch or student QR codes
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.foregroundMuted}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.card }]}
            onPress={() => router.push("/custody")}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.actionIcon,
                { backgroundColor: `${colors.warning}15` },
              ]}
            >
              <Ionicons
                name="swap-horizontal"
                size={24}
                color={colors.warning}
              />
            </View>
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, { color: colors.foreground }]}>
                View Transfers
              </Text>
              <Text
                style={[
                  styles.actionSubtitle,
                  { color: colors.foregroundMuted },
                ]}
              >
                Manage pending transfers
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.foregroundMuted}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.card }]}
            onPress={() => router.push("/(exam-tabs)/custody")}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.actionIcon,
                { backgroundColor: `${colors.success}15` },
              ]}
            >
              <Ionicons name="cube" size={24} color={colors.success} />
            </View>
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, { color: colors.foreground }]}>
                Batch Custody
              </Text>
              <Text
                style={[
                  styles.actionSubtitle,
                  { color: colors.foregroundMuted },
                ]}
              >
                View batches in your custody
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.foregroundMuted}
            />
          </TouchableOpacity>
        </View>

        {/* Recent Activity */}
        <View style={[styles.section, styles.lastSection]}>
          <H3 style={[styles.sectionTitle, { color: colors.foreground }]}>
            Recent Activity
          </H3>
          <Card elevation="sm">
            {activityLoading ? (
              <View style={styles.loadingState}>
                <Ionicons
                  name="time-outline"
                  size={48}
                  color={colors.foregroundMuted}
                />
                <Text
                  style={[
                    styles.loadingText,
                    { color: colors.foregroundMuted },
                  ]}
                >
                  Loading activity...
                </Text>
              </View>
            ) : activityData?.activities &&
              activityData.activities.length > 0 ? (
              <View style={styles.activityContainer}>
                {activityData.activities.slice(0, 5).map((activity) => (
                  <TouchableOpacity
                    key={activity.id}
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
                        numberOfLines={1}
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
                <TouchableOpacity
                  style={styles.viewAllButton}
                  activeOpacity={0.7}
                  onPress={() => {
                    router.push("/recent-activity");
                  }}
                >
                  <Text style={[styles.viewAllText, { color: colors.primary }]}>
                    View all activity ({activityData.activities.length})
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons
                  name="time-outline"
                  size={48}
                  color={colors.foregroundMuted}
                />
                <Text
                  style={[styles.emptyText, { color: colors.foregroundMuted }]}
                >
                  No recent activity
                </Text>
              </View>
            )}
          </Card>
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
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  headerContent: {
    gap: 8,
  },
  headerTitle: {
    color: "#ffffff",
    marginBottom: 4,
  },
  headerName: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "500",
    opacity: 0.9,
  },
  headerBadges: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  badge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  statsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
  },
  statContent: {
    padding: 16,
    gap: 4,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  lastSection: {
    paddingBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
    gap: 2,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  actionSubtitle: {
    fontSize: 14,
  },
  emptyState: {
    padding: 48,
    alignItems: "center",
    gap: 16,
  },
  emptyText: {
    fontSize: 14,
  },
  loadingState: {
    padding: 48,
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
  },
  activityContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
    gap: 2,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  activityDescription: {
    fontSize: 12,
  },
  activityTime: {
    fontSize: 10,
  },
  activityStatus: {
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginTop: 8,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "500",
    marginRight: 4,
  },
});
