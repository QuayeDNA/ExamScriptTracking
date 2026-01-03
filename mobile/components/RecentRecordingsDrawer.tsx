/**
 * Recent Recordings Drawer for Attendance Scanner
 * Shows locally stored recent attendance recordings
 */

import React, { forwardRef, useImperativeHandle, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Animated,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "@/constants/design-system";
import { getFileUrl } from "@/lib/api-client";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const DRAWER_HEIGHTS = {
  CLOSED: 0,
  PEEK: SCREEN_HEIGHT * 0.3,
  OPEN: SCREEN_HEIGHT * 0.7,
};

export interface RecentRecording {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  indexNumber: string;
  profilePicture?: string;
  timestamp: string;
  method: string;
  status: string;
}

interface RecentRecordingsDrawerProps {
  recordings: RecentRecording[];
}

export interface RecentRecordingsDrawerRef {
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const RecentRecordingsDrawer = forwardRef<RecentRecordingsDrawerRef, RecentRecordingsDrawerProps>(
  ({ recordings }, ref) => {
    const colors = useThemeColors();
    const translateY = useRef(new Animated.Value(DRAWER_HEIGHTS.CLOSED)).current;
    const isOpen = useRef(false);

    useImperativeHandle(ref, () => ({
      open: () => {
        isOpen.current = true;
        Animated.spring(translateY, {
          toValue: -DRAWER_HEIGHTS.OPEN,
          useNativeDriver: true,
          damping: 20,
          stiffness: 90,
        }).start();
      },
      close: () => {
        isOpen.current = false;
        Animated.spring(translateY, {
          toValue: DRAWER_HEIGHTS.CLOSED,
          useNativeDriver: true,
          damping: 20,
          stiffness: 90,
        }).start();
      },
      toggle: () => {
        if (isOpen.current) {
          isOpen.current = false;
          Animated.spring(translateY, {
            toValue: DRAWER_HEIGHTS.CLOSED,
            useNativeDriver: true,
            damping: 20,
            stiffness: 90,
          }).start();
        } else {
          isOpen.current = true;
          Animated.spring(translateY, {
            toValue: -DRAWER_HEIGHTS.OPEN,
            useNativeDriver: true,
            damping: 20,
            stiffness: 90,
          }).start();
        }
      },
    }));

    const getMethodIcon = (method: string) => {
      switch (method?.toUpperCase()) {
        case "QR_CODE":
          return "qr-code";
        case "MANUAL_INDEX":
          return "create-outline";
        case "BIOMETRIC_FINGERPRINT":
          return "finger-print";
        case "BIOMETRIC_FACE":
          return "camera-outline";
        default:
          return "checkmark-circle";
      }
    };

    const getMethodLabel = (method: string) => {
      switch (method?.toUpperCase()) {
        case "QR_CODE":
          return "QR Scan";
        case "MANUAL_INDEX":
          return "Manual";
        case "BIOMETRIC_FINGERPRINT":
          return "Fingerprint";
        case "BIOMETRIC_FACE":
          return "Face ID";
        default:
          return method;
      }
    };

    const formatTime = (timestamp: string) => {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    return (
      <Animated.View
        style={[
          styles.drawer,
          { backgroundColor: colors.card, transform: [{ translateY }] },
        ]}
      >
        <View style={[styles.handle, { backgroundColor: colors.border }]} />
        
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="time-outline" size={24} color={colors.foreground} />
            <Text style={[styles.title, { color: colors.foreground }]}>
              Recent Recordings
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: colors.primary }]}>
            <Text style={styles.badgeText}>{recordings.length}</Text>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {recordings.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="time-outline" size={48} color={colors.foregroundMuted} />
              <Text style={[styles.emptyText, { color: colors.foregroundMuted }]}>
                No recordings yet
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.foregroundMuted }]}>
                Students will appear here as you record attendance
              </Text>
            </View>
          ) : (
            recordings.map((recording, index) => (
              <View
                key={recording.id}
                style={[
                  styles.recordingItem,
                  { backgroundColor: colors.background, borderBottomColor: colors.border },
                  index === recordings.length - 1 && styles.lastItem,
                ]}
              >
                <View style={[styles.studentPhoto, { backgroundColor: colors.muted }]}>
                  {recording.profilePicture ? (
                    <Image
                      source={{ uri: getFileUrl(recording.profilePicture) }}
                      style={styles.photoImage}
                    />
                  ) : (
                    <Ionicons name="person" size={24} color={colors.foregroundMuted} />
                  )}
                </View>
                
                <View style={styles.recordingInfo}>
                  <Text style={[styles.studentName, { color: colors.foreground }]}>
                    {recording.firstName} {recording.lastName}
                  </Text>
                  <Text style={[styles.indexNumber, { color: colors.foregroundMuted }]}>
                    {recording.indexNumber}
                  </Text>
                  <View style={styles.recordingMeta}>
                    <View style={styles.methodBadge}>
                      <Ionicons
                        name={getMethodIcon(recording.method)}
                        size={12}
                        color={colors.foregroundMuted}
                      />
                      <Text style={[styles.methodText, { color: colors.foregroundMuted }]}>
                        {getMethodLabel(recording.method)}
                      </Text>
                    </View>
                    <Text style={[styles.timestamp, { color: colors.foregroundMuted }]}>
                      {formatTime(recording.timestamp)}
                    </Text>
                  </View>
                </View>

                <Ionicons name="checkmark-circle" size={24} color={colors.success} />
              </View>
            ))
          )}
        </ScrollView>
      </Animated.View>
    );
  }
);

const styles = StyleSheet.create({
  drawer: {
    position: "absolute",
    bottom: -SCREEN_HEIGHT,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 32,
    alignItems: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  recordingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderBottomWidth: 1,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  studentPhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    overflow: "hidden",
  },
  photoImage: {
    width: "100%",
    height: "100%",
  },
  recordingInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  indexNumber: {
    fontSize: 13,
    marginBottom: 4,
  },
  recordingMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  methodBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  methodText: {
    fontSize: 12,
  },
  timestamp: {
    fontSize: 12,
  },
});

RecentRecordingsDrawer.displayName = "RecentRecordingsDrawer";

export default RecentRecordingsDrawer;
