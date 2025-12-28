import { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Text } from "@/components/ui/typography";
import { useThemeColors } from "@/constants/design-system";
import {
  classAttendanceApi,
  type ClassAttendanceRecord,
} from "@/api/classAttendance";

export default function AttendanceHistory() {
  const colors = useThemeColors();
  const router = useRouter();

  const [records, setRecords] = useState<ClassAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      if (!refreshing) setLoading(true);
      // Assuming we have a way to get session, but for history, perhaps get all records
      // For now, we'll need to adjust the API or get from current session
      // Since history is for past records, we might need a different API
      // For simplicity, using the same as before
      const sessionResp = await classAttendanceApi.createOrGetSession({
        deviceId: 'dummy', // TODO: get actual deviceId
      });
      const recordResp = await classAttendanceApi.getSessionRecords(
        sessionResp.session.id,
        { page: 1, limit: 50 }
      );
      setRecords(recordResp.records || []);
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "History",
        text2: error?.error || "Failed to load attendance history",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadRecords();
  };

  const handleDeleteRecord = async (recordId: string) => {
    // TODO: Implement delete if allowed
    Toast.show({
      type: "info",
      text1: "Delete",
      text2: "Delete functionality to be implemented",
    });
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {records.length === 0 ? (
          <Card elevation="sm" style={styles.card}>
            <CardContent>
              <View style={styles.emptyState}>
                <Ionicons
                  name="file-tray-full-outline"
                  size={48}
                  color={colors.foregroundMuted}
                />
                <Text
                  style={[
                    styles.emptyText,
                    { color: colors.foregroundMuted },
                  ]}
                >
                  No recordings yet
                </Text>
                <Text
                  style={[
                    styles.emptySubtext,
                    { color: colors.foregroundMuted },
                  ]}
                >
                  Your attendance recordings will appear here
                </Text>
              </View>
            </CardContent>
          </Card>
        ) : (
          records.map((record) => (
            <TouchableOpacity
              key={record.id}
              activeOpacity={0.7}
              onPress={() =>
                router.push(
                  `/attendance/details?recordId=${record.id}` as any
                )
              }
            >
              <Card elevation="sm" style={styles.card}>
                <CardContent>
                  <View style={styles.recordHeader}>
                    <View style={styles.recordInfo}>
                      <Text
                        style={[
                          styles.recordCourse,
                          { color: colors.foreground },
                        ]}
                      >
                        {record.courseCode || "Unspecified"}
                      </Text>
                      <Text
                        style={[
                          styles.recordMeta,
                          { color: colors.foregroundMuted },
                        ]}
                      >
                        {record.courseName || "No title"}
                      </Text>
                      <View style={styles.recordStats}>
                        <Ionicons
                          name="people"
                          size={14}
                          color={colors.foregroundMuted}
                        />
                        <Text
                          style={[
                            styles.recordStatText,
                            { color: colors.foregroundMuted },
                          ]}
                        >
                          {record.totalStudents} students
                        </Text>
                        <Ionicons
                          name="time-outline"
                          size={14}
                          color={colors.foregroundMuted}
                          style={{ marginLeft: 12 }}
                        />
                        <Text
                          style={[
                            styles.recordStatText,
                            { color: colors.foregroundMuted },
                          ]}
                        >
                          {new Date(record.startTime).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.recordHeaderRight}>
                      <Badge variant="secondary">{record.status}</Badge>
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={colors.foregroundMuted}
                        style={{ marginLeft: 8 }}
                      />
                    </View>
                  </View>
                </CardContent>
              </Card>
            </TouchableOpacity>
          ))
        )}
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
    padding: 16,
  },
  card: {
    marginBottom: 12,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    marginTop: 4,
  },
  recordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  recordInfo: {
    flex: 1,
    marginRight: 12,
  },
  recordHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  recordCourse: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  recordMeta: {
    fontSize: 13,
    marginBottom: 8,
  },
  recordStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  recordStatText: {
    fontSize: 12,
  },
});