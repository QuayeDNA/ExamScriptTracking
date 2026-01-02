/**
 * Profile Screen
 * User profile with SafeAreaView and design system integration
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
import { useAppContext } from "@/store/appContext";
import { authApi } from "@/api/auth";
import { useThemeColors } from "@/constants/design-system";
import { Card } from "@/components/ui/card";
import { H2, H3, Text } from "@/components/ui/typography";
import { Dialog } from "@/components/ui/dialog";
import { useState } from "react";
import Toast from "react-native-toast-message";

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const { currentApp, switchApp, canAccessBothApps, canAccessAttendanceApp } = useAppContext();
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
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <View style={styles.headerContent}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0).toUpperCase()}
              </Text>
            </View>
            <H2 style={styles.headerName}>{user?.name}</H2>
            <Text style={styles.headerEmail}>{user?.email}</Text>
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
          {canAccessBothApps && canAccessAttendanceApp && (
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: colors.card }]}
              onPress={() => switchApp('attendance')}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.actionIcon,
                  { backgroundColor: '#10b98115' },
                ]}
              >
                <Ionicons name="swap-horizontal" size={20} color="#10b981" />
              </View>
              <Text
                style={StyleSheet.flatten([
                  styles.actionText,
                  { color: colors.foreground },
                ])}
              >
                Switch to Attendance App
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
                text1: "Settings",
                text2: "Settings screen coming soon",
              })
            }
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.actionIcon,
                { backgroundColor: `${colors.info}15` },
              ]}
            >
              <Ionicons name="settings" size={20} color={colors.info} />
            </View>
            <Text
              style={StyleSheet.flatten([
                styles.actionText,
                { color: colors.foreground },
              ])}
            >
              Settings
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
                text2: "Exam Script Tracking System v1.0",
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
            style={[styles.logoutButton, { backgroundColor: colors.error }]}
            onPress={() => setShowLogoutDialog(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out" size={20} color="#ffffff" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Logout Confirmation Dialog */}
      <Dialog
        visible={showLogoutDialog}
        onClose={() => setShowLogoutDialog(false)}
        title="Logout"
        message="Are you sure you want to logout?"
        variant="warning"
        icon="log-out"
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
    paddingTop: 24,
    paddingBottom: 32,
    paddingHorizontal: 16,
  },
  headerContent: {
    alignItems: "center",
    gap: 8,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#3b82f6",
  },
  headerName: {
    color: "#ffffff",
  },
  headerEmail: {
    color: "#ffffff",
    opacity: 0.9,
    fontSize: 14,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  lastSection: {
    paddingBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  infoRow: {
    padding: 16,
    borderBottomWidth: 1,
    gap: 4,
  },
  infoRowLast: {
    padding: 16,
    gap: 4,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "600",
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
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
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
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
