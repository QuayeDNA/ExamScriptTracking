import { Tabs } from 'expo-router';
import { useThemeColors } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, View, Text as RNText } from 'react-native';
import { useAuthStore } from '@/store/auth';
import { authApi } from '@/api/auth';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

const DEVICE_NAME_KEY = "attendance_device_name";

export default function AttendanceLayout() {
  const colors = useThemeColors();
  const router = useRouter();
  const { logout: storeLogout } = useAuthStore();
  const [deviceName, setDeviceName] = useState<string>('');

  useEffect(() => {
    const loadDeviceName = async () => {
      try {
        const stored = await AsyncStorage.getItem(DEVICE_NAME_KEY);
        if (stored) {
          setDeviceName(stored);
        }
      } catch (error) {
        console.warn('Failed to load device name:', error);
      }
    };
    loadDeviceName();
  }, []);

  const handleLogout = async () => {
    try {
      await authApi.logout();
      storeLogout();
      router.replace('/login');
      Toast.show({
        type: 'success',
        text1: 'Logged out',
        text2: 'You have been successfully logged out',
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Logout failed',
        text2: error?.error || 'Failed to logout',
      });
    }
  };

  const DashboardHeaderTitle = () => (
    <View style={{ alignItems: 'center' }}>
      <RNText style={{ 
        color: colors.foreground, 
        fontSize: 17, 
        fontWeight: '600' 
      }}>
        Dashboard
      </RNText>
      {deviceName ? (
        <RNText style={{ 
          color: colors.foregroundMuted, 
          fontSize: 12, 
          marginTop: 2 
        }}>
          {deviceName}
        </RNText>
      ) : null}
    </View>
  );

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.foregroundMuted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
        headerStyle: {
          backgroundColor: colors.card,
        },
        headerTintColor: colors.foreground,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
          headerTitle: () => <DashboardHeaderTitle />,
          headerRight: () => (
            <TouchableOpacity
              onPress={handleLogout}
              style={{ padding: 8, marginRight: 8 }}
            >
              <Ionicons name="log-out-outline" size={24} color={colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />
      <Tabs.Screen
        name="record"
        options={{
          title: 'Record',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="scan-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="file-tray-full-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}