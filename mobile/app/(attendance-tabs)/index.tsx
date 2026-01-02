/**
 * Attendance Dashboard
 * Main landing screen for the attendance app
 */

import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "@/constants/design-system";
import { useAuthStore } from "@/store/auth";
import { Card } from "@/components/ui/card";

export default function AttendanceDashboard() {
  const colors = useThemeColors();
  const { user } = useAuthStore();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
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

        {/* Today's Stats */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Today&apos;s Overview
          </Text>
          
          <Card elevation="sm">
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Ionicons name="people" size={24} color={colors.primary} />
                <Text style={[styles.statValue, { color: colors.foreground }]}>0</Text>
                <Text style={[styles.statLabel, { color: colors.foregroundMuted }]}>
                  Sessions
                </Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                <Text style={[styles.statValue, { color: colors.foreground }]}>0</Text>
                <Text style={[styles.statLabel, { color: colors.foregroundMuted }]}>
                  Present
                </Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="time" size={24} color="#f59e0b" />
                <Text style={[styles.statValue, { color: colors.foreground }]}>0%</Text>
                <Text style={[styles.statLabel, { color: colors.foregroundMuted }]}>
                  Attendance
                </Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Recent Sessions - Placeholder */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Recent Sessions
            </Text>
            <TouchableOpacity onPress={() => router.push("/(attendance-tabs)/sessions")}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
            </TouchableOpacity>
          </View>
          
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
});
