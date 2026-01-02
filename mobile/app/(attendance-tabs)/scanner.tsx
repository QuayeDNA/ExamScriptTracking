/**
 * Attendance QR Scanner Screen
 * Scan student ID cards for attendance
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "@/constants/design-system";
import { Card } from "@/components/ui/card";

export default function AttendanceScanner() {
  const colors = useThemeColors();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          QR Scanner
        </Text>
        <Text style={[styles.subtitle, { color: colors.foregroundMuted }]}>
          Scan student ID cards
        </Text>
      </View>

      <View style={styles.content}>
        <Card elevation="sm">
          <View style={styles.placeholder}>
            <Ionicons name="qr-code-outline" size={64} color={colors.foregroundMuted} />
            <Text style={[styles.placeholderText, { color: colors.foregroundMuted }]}>
              QR Scanner Coming Soon
            </Text>
            <Text style={[styles.placeholderSubtext, { color: colors.foregroundMuted }]}>
              Scan student ID QR codes for quick attendance marking
            </Text>
          </View>
        </Card>
      </View>
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
  placeholder: {
    alignItems: "center",
    paddingVertical: 80,
    gap: 12,
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: "600",
  },
  placeholderSubtext: {
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 20,
  },
});
