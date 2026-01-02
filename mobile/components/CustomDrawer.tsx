import {
  useState,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import type { ExamSession } from "@/api/examSessions";
import type { ExamAttendance } from "@/types";
import { examSessionsApi } from "@/api/examSessions";
import { mobileSocketService } from "@/lib/socket";
import { useThemeColors } from "@/constants/design-system";
import SideDrawer from "./SideDrawer";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const TAB_BAR_HEIGHT = 80; // Bottom tab bar height
const PEEK_HEIGHT = 110; // Reduced peek drawer content height
const BOTTOM_OFFSET = 0; // Position at bottom of screen

interface CustomDrawerProps {
  session: ExamSession | null;
  onViewDetails: () => void;
  onEndSession: () => void;
}

export interface CustomDrawerRef {
  snapToIndex: (index: number) => void;
  close: () => void;
}

const CustomDrawer = forwardRef<CustomDrawerRef, CustomDrawerProps>(
  ({ session, onViewDetails, onEndSession }, ref) => {
    const colors = useThemeColors();
    const [drawerHeight] = useState(new Animated.Value(0));
    const [isVisible, setIsVisible] = useState(false);
    const [attendances, setAttendances] = useState<ExamAttendance[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [showSideDrawer, setShowSideDrawer] = useState(false);

    useImperativeHandle(ref, () => ({
      snapToIndex: (index: number) => {
        setIsVisible(index >= 0);
        const height = index >= 0 ? PEEK_HEIGHT : 0;
        Animated.spring(drawerHeight, {
          toValue: height,
          useNativeDriver: false,
          damping: 20,
          stiffness: 90,
        }).start();
      },
      close: () => {
        setIsVisible(false);
        Animated.spring(drawerHeight, {
          toValue: 0,
          useNativeDriver: false,
          damping: 20,
          stiffness: 90,
        }).start();
      },
    }));

    const loadAttendanceData = useCallback(async () => {
      if (!session) return;

      try {
        setLoading(true);
        const data = await examSessionsApi.getExamSession(session.id);

        if (data.attendances) {
          const sortedAttendances = [...data.attendances].sort((a, b) => 
            new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime()
          );
          setAttendances(sortedAttendances);
        }

        if (data.stats) {
          setStats(data.stats);
        }
      } catch (error: any) {
        Toast.show({
          type: "error",
          text1: "Load Error",
          text2: error.error || "Failed to load attendance data",
        });
      } finally {
        setLoading(false);
      }
    }, [session]);

    useEffect(() => {
      if (!session) return;

      const handleAttendanceUpdate = () => {
        loadAttendanceData();
      };

      const handleBatchUpdate = (data: any) => {
        if (data.id === session.id) {
          loadAttendanceData();
        }
      };

      mobileSocketService.emit("join", { examSessionId: session.id });

      const socket = (mobileSocketService as any).socket;
      if (socket) {
        socket.on("attendance:recorded", handleAttendanceUpdate);
        socket.on("batch:status_updated", handleBatchUpdate);
      }

      loadAttendanceData();

      return () => {
        if (socket) {
          socket.off("attendance:recorded", handleAttendanceUpdate);
          socket.off("batch:status_updated", handleBatchUpdate);
        }
        mobileSocketService.emit("leave", { examSessionId: session.id });
      };
    }, [session, loadAttendanceData]);

    if (!session) return null;

    return (
      <>
        <Animated.View
          style={[
            styles.peekDrawer,
            { 
              height: drawerHeight, 
              backgroundColor: colors.card,
              bottom: BOTTOM_OFFSET 
            },
          ]}
        >
          <View style={styles.drawerContent}>
            {/* Left side: Course info */}
            <View style={styles.leftContent}>
              <Text
                style={[styles.courseName, { color: colors.foreground }]}
                numberOfLines={1}
              >
                {session.courseName}
              </Text>
              <Text
                style={[styles.courseCode, { color: colors.foregroundMuted }]}
              >
                {session.courseCode}
              </Text>
              <View style={styles.statsRow}>
                {stats && (
                  <>
                    <View style={styles.statChip}>
                      <Ionicons name="people" size={14} color={colors.primary} />
                      <Text
                        style={[styles.statText, { color: colors.foregroundMuted }]}
                      >
                        {stats.totalAttended || 0}/{stats.expectedStudents || 0}
                      </Text>
                    </View>
                    <View style={styles.statChip}>
                      <Ionicons name="checkmark-circle" size={14} color="#10b981" />
                      <Text
                        style={[styles.statText, { color: colors.foregroundMuted }]}
                      >
                        {stats.submitted || 0}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </View>

            {/* Right side: Hamburger button */}
            <TouchableOpacity
              style={[styles.hamburgerButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowSideDrawer(true)}
            >
              <Ionicons name="menu" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Side Drawer */}
        <SideDrawer
          visible={showSideDrawer}
          onClose={() => setShowSideDrawer(false)}
          session={session}
          attendances={attendances}
          stats={stats}
          onViewDetails={onViewDetails}
          onEndSession={onEndSession}
        />
      </>
    );
  }
);

CustomDrawer.displayName = "CustomDrawer";

export default CustomDrawer;

const styles = StyleSheet.create({
  peekDrawer: {
    position: "absolute",
    left: 0,
    right: 0,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  drawerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: "100%",
  },
  leftContent: {
    flex: 1,
    marginRight: 12,
    justifyContent: "center",
  },
  courseName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  courseCode: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
  },
  statChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 12,
    fontWeight: "600",
  },
  hamburgerButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
});