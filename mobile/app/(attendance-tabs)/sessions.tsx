/**
 * Attendance Sessions Screen
 * View and manage active attendance recording sessions
 */

import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "@/constants/design-system";
import { Card } from "@/components/ui/card";

export default function AttendanceSessions() {
  const colors = useThemeColors();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Attendance Sessions
        </Text>
        <Text style={[styles.subtitle, { color: colors.foregroundMuted }]}>
          Active and past recording sessions
        </Text>
      </View>

      <ScrollView style={styles.content}>
        <Card elevation="sm">
          <View style={styles.emptyState}>
            <Ionicons name="list-outline" size={64} color={colors.foregroundMuted} />
            <Text style={[styles.emptyText, { color: colors.foregroundMuted }]}>
              No sessions yet
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.foregroundMuted }]}>
              Start recording attendance from the dashboard
            </Text>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
  },
});
