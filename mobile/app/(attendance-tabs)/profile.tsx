/**
 * Attendance App Profile Screen
 * Shared profile with app switcher
 */

import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/auth";
import { useAppContext } from "@/store/appContext";
import { authApi } from "@/api/auth";
import { useThemeColors } from "@/constants/design-system";
import { Card } from "@/components/ui/card";
import { H2, H3, Text } from "@/components/ui/typography";
import { Dialog } from "@/components/ui/dialog";
import { useState } from "react";
import Toast from "react-native-toast-message";

export default function AttendanceProfileScreen() {
  const { user, logout } = useAuthStore();
  const { switchApp, canAccessBothApps, canAccessExamApp } = useAppContext();
  const colors = useThemeColors();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleLogout = async () => {
    try {
      await authApi.logout();
      await logout();

      Toast.show({
        type: "success",
        text1: "Logged Out",
        text2: "You have been successfully logged out",
      });

      router.replace("/login");
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Logout Failed",
        text2: error.error || "An error occurred",
      });
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: '#10b981' }]}>
          <View style={styles.headerContent}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0).toUpperCase()}
              </Text>
            </View>
            <H2 style={styles.headerName}>{user?.name}</H2>
            <Text style={styles.headerEmail}>{user?.email}</Text>
            <View style={styles.appBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#fff" />
              <Text style={styles.appBadgeText}>Attendance App</Text>
            </View>
          </View>
        </View>

        {/* User Info Card */}
        <View style={styles.section}>
          <Card elevation="sm">
            <View
              style={[styles.infoRow, { borderBottomColor: colors.border }]}
            >
              <Text
                style={StyleSheet.flatten([
                  styles.infoLabel,
                  { color: colors.foregroundMuted },
                ])}
              >
                Role
              </Text>
              <Text
                style={StyleSheet.flatten([
                  styles.infoValue,
                  { color: colors.foreground },
                ])}
              >
                {user?.role.replace("_", " ")}
              </Text>
            </View>

            <View
              style={[styles.infoRow, { borderBottomColor: colors.border }]}
            >
              <Text
                style={StyleSheet.flatten([
                  styles.infoLabel,
                  { color: colors.foregroundMuted },
                ])}
              >
                Department
              </Text>
              <Text
                style={StyleSheet.flatten([
                  styles.infoValue,
                  { color: colors.foreground },
                ])}
              >
                {user?.department || "N/A"}
              </Text>
            </View>

            <View style={styles.infoRowLast}>
              <Text
                style={StyleSheet.flatten([
                  styles.infoLabel,
                  { color: colors.foregroundMuted },
                ])}
              >
                User ID
              </Text>
              <Text
                style={StyleSheet.flatten([
                  styles.infoValue,
                  { color: colors.foreground },
                ])}
              >
                {user?.id}
              </Text>
            </View>
          </Card>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <H3
            style={StyleSheet.flatten([
              styles.sectionTitle,
              { color: colors.foreground },
            ])}
          >
            Settings
          </H3>

          {/* App Switcher - Only show if user has access to both apps */}
          {canAccessBothApps && canAccessExamApp && (
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: colors.card }]}
              onPress={() => switchApp('exam')}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.actionIcon,
                  { backgroundColor: '#3b82f615' },
                ]}
              >
                <Ionicons name="swap-horizontal" size={20} color="#3b82f6" />
              </View>
              <Text
                style={StyleSheet.flatten([
                  styles.actionText,
                  { color: colors.foreground },
                ])}
              >
                Switch to Exam Tracking App
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.foregroundMuted}
              />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.card }]}
            onPress={() => router.push("/change-password")}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.actionIcon,
                { backgroundColor: `${colors.primary}15` },
              ]}
            >
              <Ionicons name="key" size={20} color={colors.primary} />
            </View>
            <Text
              style={StyleSheet.flatten([
                styles.actionText,
                { color: colors.foreground },
              ])}
            >
              Change Password
            </Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.foregroundMuted}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.card }]}
            onPress={() =>
              Toast.show({
                type: "info",
                text1: "About",
                text2: "Class Attendance System v1.0",
              })
            }
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.actionIcon,
                { backgroundColor: `${colors.foregroundMuted}15` },
              ]}
            >
              <Ionicons
                name="information-circle"
                size={20}
                color={colors.foregroundMuted}
              />
            </View>
            <Text
              style={StyleSheet.flatten([
                styles.actionText,
                { color: colors.foreground },
              ])}
            >
              About
            </Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.foregroundMuted}
            />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <View style={[styles.section, styles.lastSection]}>
          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: '#ef4444' }]}
            onPress={() => setShowLogoutDialog(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out" size={20} color="#fff" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Logout Confirmation Dialog */}
      <Dialog
        visible={showLogoutDialog}
        onClose={() => setShowLogoutDialog(false)}
        title="Confirm Logout"
        message="Are you sure you want to logout?"
        variant="warning"
        primaryAction={{
          label: "Logout",
          onPress: handleLogout,
        }}
        secondaryAction={{
          label: "Cancel",
          onPress: () => setShowLogoutDialog(false),
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: 32,
    paddingTop: 20,
  },
  headerContent: {
    alignItems: "center",
    gap: 8,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
  },
  headerName: {
    color: "#fff",
    fontSize: 24,
  },
  headerEmail: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
  },
  appBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
  },
  appBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  section: {
    padding: 16,
  },
  lastSection: {
    paddingBottom: 40,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  infoRowLast: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  logoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
