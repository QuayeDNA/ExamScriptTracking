import { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Text, H2 } from "@/components/ui/typography";
import { Separator } from "@/components/ui/separator";
import { useThemeColors } from "@/constants/design-system";
import { classAttendanceApi } from "@/api/classAttendance";

interface Student {
  id: string;
  studentId: string;
  recordId: string;
  scanTime: string;
  student: {
    id: string;
    indexNumber: string;
    firstName: string;
    lastName: string;
  };
}

interface RecordDetails {
  id: string;
  sessionId: string;
  lecturerName: string | null;
  courseName: string | null;
  courseCode: string | null;
  notes: string | null;
  status: string;
  totalStudents: number;
  startTime: string;
  endTime: string | null;
  session?: {
    id: string;
    deviceId: string;
    deviceName: string | null;
  };
  students?: Student[];
}

export default function AttendanceDetailsScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { recordId } = useLocalSearchParams();

  const [record, setRecord] = useState<RecordDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (recordId) {
      loadRecordDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordId]);

  const loadRecordDetails = async () => {
    try {
      setLoading(true);
      const response = await classAttendanceApi.getAttendanceRecordById(
        recordId as string
      );
      setRecord(response.record as RecordDetails);
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to load recording details",
      });
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const renderStudentItem = ({
    item,
    index,
  }: {
    item: Student;
    index: number;
  }) => (
    <View
      style={[
        styles.studentRow,
        { borderBottomColor: colors.border },
        index === (record?.students?.length || 0) - 1 && styles.lastRow,
      ]}
    >
      <Text style={[styles.studentNumber, { color: colors.foregroundMuted }]}>
        {index + 1}
      </Text>
      <View style={styles.studentInfo}>
        <Text style={[styles.studentName, { color: colors.foreground }]}>
          {item.student.firstName} {item.student.lastName}
        </Text>
        <Text style={[styles.studentIndex, { color: colors.foregroundMuted }]}>
          {item.student.indexNumber}
        </Text>
      </View>
      <Text style={[styles.studentTime, { color: colors.foregroundMuted }]}>
        {new Date(item.scanTime).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!record) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.center}>
          <Text style={{ color: colors.foregroundMuted }}>
            Recording not found
          </Text>
          <Button variant="secondary" onPress={() => router.back()}>
            <Text>Go Back</Text>
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <Button
            variant="ghost"
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.foreground} />
          </Button>
          <View style={styles.headerTitle}>
            <H2 style={{ color: colors.foreground }}>Recording Details</H2>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Course Info */}
        <Card elevation="sm" style={styles.card}>
          <CardContent>
            <View style={styles.infoRow}>
              <Text
                style={[styles.infoLabel, { color: colors.foregroundMuted }]}
              >
                Course
              </Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>
                {record.courseName || "N/A"}
              </Text>
              {record.courseCode && (
                <Text
                  style={[styles.infoSub, { color: colors.foregroundMuted }]}
                >
                  ({record.courseCode})
                </Text>
              )}
            </View>

            <Separator style={styles.separator} />

            <View style={styles.infoRow}>
              <Text
                style={[styles.infoLabel, { color: colors.foregroundMuted }]}
              >
                Lecturer
              </Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>
                {record.lecturerName || "Not specified"}
              </Text>
            </View>

            <Separator style={styles.separator} />

            <View style={styles.infoRow}>
              <Text
                style={[styles.infoLabel, { color: colors.foregroundMuted }]}
              >
                <Ionicons name="calendar-outline" size={14} /> Start Time
              </Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>
                {new Date(record.startTime).toLocaleString()}
              </Text>
            </View>

            <Separator style={styles.separator} />

            <View style={styles.infoRow}>
              <Text
                style={[styles.infoLabel, { color: colors.foregroundMuted }]}
              >
                <Ionicons name="time-outline" size={14} /> End Time
              </Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>
                {record.endTime
                  ? new Date(record.endTime).toLocaleString()
                  : "In Progress"}
              </Text>
            </View>

            <Separator style={styles.separator} />

            <View style={styles.infoRow}>
              <Text
                style={[styles.infoLabel, { color: colors.foregroundMuted }]}
              >
                Total Students
              </Text>
              <Badge variant="default">{record.totalStudents}</Badge>
            </View>

            {record.session && (
              <>
                <Separator style={styles.separator} />
                <View style={styles.infoRow}>
                  <Text
                    style={[
                      styles.infoLabel,
                      { color: colors.foregroundMuted },
                    ]}
                  >
                    Device
                  </Text>
                  <Text
                    style={[styles.infoValue, { color: colors.foreground }]}
                  >
                    {record.session.deviceName || record.session.deviceId}
                  </Text>
                </View>
              </>
            )}
          </CardContent>
        </Card>

        {/* Students List */}
        <Card elevation="sm" style={styles.card}>
          <CardContent>
            <View style={styles.studentsHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Students ({record.students?.length || 0})
              </Text>
            </View>

            {!record.students || record.students.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons
                  name="people-outline"
                  size={48}
                  color={colors.foregroundMuted}
                />
                <Text
                  style={[styles.emptyText, { color: colors.foregroundMuted }]}
                >
                  No students recorded yet
                </Text>
              </View>
            ) : (
              <FlatList
                data={record.students}
                renderItem={renderStudentItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            )}
          </CardContent>
        </Card>

        {record.notes && (
          <Card elevation="sm" style={styles.card}>
            <CardContent>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Notes
              </Text>
              <Text
                style={[styles.notesText, { color: colors.foregroundMuted }]}
              >
                {record.notes}
              </Text>
            </CardContent>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  infoLabel: {
    fontSize: 13,
    marginRight: 8,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "600",
  },
  infoSub: {
    fontSize: 13,
    marginLeft: 4,
  },
  separator: {
    marginVertical: 12,
  },
  studentsHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  studentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  studentNumber: {
    fontSize: 13,
    width: 30,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 14,
    fontWeight: "600",
  },
  studentIndex: {
    fontSize: 12,
    marginTop: 2,
  },
  studentTime: {
    fontSize: 12,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 12,
  },
  notesText: {
    fontSize: 14,
    marginTop: 8,
    lineHeight: 20,
  },
});
