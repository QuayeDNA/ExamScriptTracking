import { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Application from "expo-application";
import * as Device from "expo-device";
import { Ionicons } from "@expo/vector-icons";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/typography";
import {
  useThemeColors,
  Spacing,
  BorderRadius,
  Shadows,
  Typography
} from "@/constants/design-system";
import { classAttendanceApi } from "@/api/classAttendance";
import Toast from "react-native-toast-message";

const DEVICE_ID_KEY = "attendance_device_id";
const DEVICE_NAME_KEY = "attendance_device_name";

// Safe AsyncStorage wrapper
let asyncStorage: any = null;
try {
  asyncStorage = AsyncStorage;
} catch {
  console.warn("AsyncStorage not available, using fallback storage");
}

async function getOrCreateDeviceId() {
  if (!asyncStorage) {
    return `fallback-${Date.now()}`;
  }
  const existing = await asyncStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;

  let candidate: string;
  if (Platform.OS === "web") {
    candidate = `web-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  } else {
    candidate =
      Application.getAndroidId() ||
      (await Application.getIosIdForVendorAsync()) ||
      `device-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
  await asyncStorage.setItem(DEVICE_ID_KEY, candidate);
  return candidate;
}

async function getStoredDeviceName() {
  if (!asyncStorage) return null;
  return asyncStorage.getItem(DEVICE_NAME_KEY);
}

async function saveDeviceName(name: string) {
  if (!asyncStorage) return;
  await asyncStorage.setItem(DEVICE_NAME_KEY, name);
}

async function getDeviceName() {
  try {
    if (Platform.OS === "web") {
      return `Web Browser`;
    } else {
      const modelName =
        Device.modelName || Device.deviceName || "Unknown Device";
      let readableName = modelName;
      if (Platform.OS === "ios") {
        readableName += " (iOS)";
      } else if (Platform.OS === "android") {
        readableName += " (Android)";
      }
      return readableName;
    }
  } catch (error) {
    console.warn("Failed to get device name:", error);
    return Platform.OS === "web" ? "Web Browser" : "Mobile Device";
  }
}

export default function AttendanceSettings() {
  const colors = useThemeColors();

  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [deviceName, setDeviceName] = useState("");

  useEffect(() => {
    (async () => {
      const id = await getOrCreateDeviceId();
      let storedName = (await getStoredDeviceName()) || "";
      if (!storedName) {
        storedName = await getDeviceName();
        if (storedName) {
          await saveDeviceName(storedName);
        }
      }
      setDeviceId(id);
      setDeviceName(storedName);
    })();
  }, []);

  const handleSaveDeviceName = async () => {
    if (!deviceName.trim() || !deviceId) return;
    try {
      await saveDeviceName(deviceName.trim());
      await classAttendanceApi.createOrGetSession({
        deviceId,
        deviceName: deviceName.trim(),
      });
      Toast.show({ type: "success", text1: "Device saved" });
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Device name",
        text2: error?.error || "Could not save device name",
      });
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Device Setup Card */}
        <Card
          style={{
            marginHorizontal: Spacing[4],
            marginTop: Spacing[4],
            marginBottom: Spacing[4],
            backgroundColor: colors.card,
            borderColor: colors.border,
            ...Shadows.DEFAULT,
          }}
        >
          <CardContent>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <View
                  style={[
                    styles.cardIcon,
                    { backgroundColor: colors.primary + "15" },
                  ]}
                >
                  <Ionicons name="phone-portrait" size={20} color={colors.primary} />
                </View>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                  Device Settings
                </Text>
              </View>
            </View>
            <View style={styles.cardContent}>
              <Text
                style={[styles.inputLabel, { color: colors.foregroundMuted }]}
              >
                Device Name
              </Text>
              <Input
                placeholder="e.g., Lecture Hall A - iPad"
                value={deviceName}
                onChangeText={setDeviceName}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.foreground,
                  },
                ]}
                placeholderTextColor={colors.foregroundMuted}
              />
              <Button
                variant="secondary"
                onPress={handleSaveDeviceName}
                disabled={!deviceName.trim()}
                style={{
                  backgroundColor: colors.muted,
                  borderColor: colors.border,
                }}
              >
                <Ionicons name="save" size={16} color={colors.primary} />
                <Text style={[styles.saveButtonText, { color: colors.primary }]}>
                  Save Device Name
                </Text>
              </Button>

              {deviceId && (
                <View style={[styles.deviceIdContainer, { borderTopColor: colors.border }]}>
                  <Text
                    style={[
                      styles.deviceIdLabel,
                      { color: colors.foregroundMuted },
                    ]}
                  >
                    Device ID: {deviceId.slice(0, 16)}...
                  </Text>
                </View>
              )}
            </View>
          </CardContent>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing[6],
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[4],
    paddingBottom: Spacing[3],
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[3],
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
  cardContent: {
    paddingHorizontal: Spacing[4],
    paddingBottom: Spacing[4],
  },
  inputLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: Spacing[2],
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing[3],
    fontSize: Typography.fontSize.base,
    marginBottom: Spacing[3],
  },
  saveButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  deviceIdContainer: {
    marginTop: Spacing[3],
    paddingTop: Spacing[3],
    borderTopWidth: 1,
  },
  deviceIdLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
});