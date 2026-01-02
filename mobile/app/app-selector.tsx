/**
 * App Selector Screen
 * Let users choose between Exam App and Attendance App
 * Remembers last selection for quick access
 */

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppContext } from "@/store/appContext";
import { useAuthStore } from "@/store/auth";
import { useThemeColors } from "@/constants/design-system";

export default function AppSelector() {
  const { setCurrentApp, canAccessExamApp, canAccessAttendanceApp, checkAccess } = useAppContext();
  const { user, logout } = useAuthStore();
  const colors = useThemeColors();
  const [isCheckingAccess, setIsCheckingAccess] = React.useState(true);

  // Ensure access is checked when component mounts
  React.useEffect(() => {
    console.log('📱 App Selector mounted, checking access...');
    checkAccess();
    // Give a small delay to ensure state updates
    setTimeout(() => setIsCheckingAccess(false), 100);
  }, [checkAccess]);

  // Log access status whenever it changes
  React.useEffect(() => {
    console.log('🔓 App Selector access status:', {
      userRole: user?.role,
      canAccessExamApp,
      canAccessAttendanceApp,
      canAccessBoth: canAccessExamApp && canAccessAttendanceApp
    });
  }, [canAccessExamApp, canAccessAttendanceApp, user?.role]);

  const selectApp = async (app: 'exam' | 'attendance') => {
    // Save preference
    await setCurrentApp(app);
    
    // Navigate to selected app
    if (app === 'exam') {
      router.replace('/(exam-tabs)' as any);
    } else {
      router.replace('/(attendance-tabs)' as any);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  // If user only has access to one app, auto-route them
  React.useEffect(() => {
    // Only auto-route if we've determined access (not initial state)
    const hasCheckedAccess = canAccessExamApp || canAccessAttendanceApp;
    
    if (!hasCheckedAccess) {
      console.log('⏳ Waiting for access check to complete...');
      return;
    }

    console.log('🔀 Auto-route check:', {
      canAccessExamApp,
      canAccessAttendanceApp,
      willAutoRoute: (canAccessExamApp && !canAccessAttendanceApp) || (canAccessAttendanceApp && !canAccessExamApp)
    });

    if (canAccessExamApp && !canAccessAttendanceApp) {
      console.log('🚀 Auto-routing to Exam app (only access)');
      selectApp('exam');
    } else if (canAccessAttendanceApp && !canAccessExamApp) {
      console.log('🚀 Auto-routing to Attendance app (only access)');
      selectApp('attendance');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canAccessExamApp, canAccessAttendanceApp]);

  // Show loading while checking access
  if (isCheckingAccess) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.foregroundMuted }]}>
            Checking access...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {__DEV__ && (
        <View style={{ padding: 10, backgroundColor: '#f0f0f0', marginBottom: 10, borderRadius: 8 }}>
          <Text style={{ fontSize: 10, color: '#333' }}>
            Debug: Role={user?.role} | Exam={String(canAccessExamApp)} | Attendance={String(canAccessAttendanceApp)}
          </Text>
        </View>
      )}

      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.greeting, { color: colors.foreground }]}>
            Welcome back,
          </Text>
          <Text style={[styles.userName, { color: colors.primary }]}>
            {user?.name}
          </Text>
          <Text style={[styles.subtitle, { color: colors.foregroundMuted }]}>
            Select an application to continue
          </Text>
        </View>

        {/* App Cards */}
        <ScrollView 
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardsContainer}
          style={styles.cardsScrollView}
        >
          {/* Exam Tracking App */}
          {canAccessExamApp && (
            <TouchableOpacity
              style={styles.cardWrapper}
              onPress={() => selectApp('exam')}
              activeOpacity={0.8}
            >
              <View
                style={[styles.card, { backgroundColor: '#3b82f6' }]}
              >
                <View style={styles.cardIcon}>
                  <Ionicons name="document-text" size={48} color="#fff" />
                </View>
                
                <Text style={styles.cardTitle}>Exam Script Tracking</Text>
                <Text style={styles.cardDescription}>
                  Manage exam scripts, custody transfers, and incident reports
                </Text>

                <View style={styles.cardFeatures}>
                  <View style={styles.feature}>
                    <Ionicons name="scan" size={16} color="#fff" />
                    <Text style={styles.featureText}>QR Scanning</Text>
                  </View>
                  <View style={styles.feature}>
                    <Ionicons name="cube" size={16} color="#fff" />
                    <Text style={styles.featureText}>Batch Custody</Text>
                  </View>
                  <View style={styles.feature}>
                    <Ionicons name="alert-circle" size={16} color="#fff" />
                    <Text style={styles.featureText}>Incident Reporting</Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.cardAction}>Open</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </View>
              </View>
            </TouchableOpacity>
          )}

          {/* Attendance App */}
          {canAccessAttendanceApp && (
            <TouchableOpacity
              style={styles.cardWrapper}
              onPress={() => selectApp('attendance')}
              activeOpacity={0.8}
            >
              <View
                style={[styles.card, { backgroundColor: '#10b981' }]}
              >
                <View style={styles.cardIcon}>
                  <Ionicons name="checkmark-circle" size={48} color="#fff" />
                </View>
                
                <Text style={styles.cardTitle}>Class Attendance</Text>
                <Text style={styles.cardDescription}>
                  Record student attendance using QR codes and biometrics
                </Text>

                <View style={styles.cardFeatures}>
                  <View style={styles.feature}>
                    <Ionicons name="qr-code" size={16} color="#fff" />
                    <Text style={styles.featureText}>QR & Biometric</Text>
                  </View>
                  <View style={styles.feature}>
                    <Ionicons name="people" size={16} color="#fff" />
                    <Text style={styles.featureText}>Live Tracking</Text>
                  </View>
                  <View style={styles.feature}>
                    <Ionicons name="stats-chart" size={16} color="#fff" />
                    <Text style={styles.featureText}>Analytics</Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.cardAction}>Open</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </View>
              </View>
            </TouchableOpacity>
          )}

          {/* No Access Message */}
          {!canAccessExamApp && !canAccessAttendanceApp && (
            <View style={[styles.noAccessCard, { backgroundColor: colors.card }]}>
              <Ionicons name="lock-closed" size={48} color={colors.foregroundMuted} />
              <Text style={[styles.noAccessTitle, { color: colors.foreground }]}>
                No Access
              </Text>
              <Text style={[styles.noAccessText, { color: colors.foregroundMuted }]}>
                You do not have permission to access any applications.
                Please contact your administrator.
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.logoutButton, { borderColor: colors.border }]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.foregroundMuted} />
            <Text style={[styles.logoutText, { color: colors.foregroundMuted }]}>
              Logout
            </Text>
          </TouchableOpacity>
          
          <Text style={[styles.roleText, { color: colors.foregroundMuted }]}>
            Role: {user?.role?.replace('_', ' ')}
          </Text>
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
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  greeting: {
    fontSize: 18,
    fontWeight: '500',
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 4,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  cardsScrollView: {
    flexGrow: 0,
    paddingTop: 20,
  },
  cardsContainer: {
    paddingHorizontal: 20,
    gap: 16,
    flexDirection: 'row',
  },
  cardWrapper: {
    width: Dimensions.get('window').width - 60,
    borderRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  card: {
    padding: 24,
    borderRadius: 20,
    minHeight: 280,
  },
  cardIcon: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 20,
    lineHeight: 22,
  },
  cardFeatures: {
    gap: 10,
    marginBottom: 20,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.95)',
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  cardAction: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  noAccessCard: {
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    gap: 16,
  },
  noAccessTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  noAccessText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderRadius: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '500',
  },
  roleText: {
    fontSize: 14,
    textTransform: 'capitalize',
  },
});