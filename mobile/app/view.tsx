import React, { useEffect, useState } from "react";
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Alert,
  Image,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { Card, CardContent } from "@/components/ui/card";
import { Text } from "@/components/ui/typography";
import { useThemeColors, BorderRadius, Spacing, Typography, Shadows } from "@/constants/design-system";
import { classAttendanceApi } from "@/api/classAttendance";
import type { ClassAttendanceRecord } from "@/api/classAttendance";

interface RecordedStudent {
  id: string;
  indexNumber: string;
  name: string;
  scanTime: string;
  method: string;
  confirmed: boolean;
  student: {
    id: string;
    indexNumber: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
  };
}

export default function ViewAttendanceRecord() {
  const colors = useThemeColors();
  const router = useRouter();
  const params = useLocalSearchParams();
  const recordId = params.recordId as string;

  console.log("ViewAttendanceRecord component rendered with params:", params, "recordId:", recordId);

  const [record, setRecord] = useState<ClassAttendanceRecord | null>(null);
  const [recordedStudents, setRecordedStudents] = useState<RecordedStudent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!recordId) {
      Alert.alert("Error", "No record ID provided", [
        { text: "OK", onPress: () => router.back() },
      ]);
      return;
    }
    loadRecord();
  }, [recordId]);

  const loadRecord = async () => {
    try {
      setLoading(true);
      const { record: fetchedRecord } = await classAttendanceApi.getRecord(recordId);
      setRecord(fetchedRecord);

      // Transform students to RecordedStudent format
      if (fetchedRecord.students) {
        const students = fetchedRecord.students.map((s) => ({
          id: s.id,
          indexNumber: s.student.indexNumber,
          name: `${s.student.firstName} ${s.student.lastName}`,
          scanTime: s.scanTime,
          method: s.verificationMethod || "MANUAL_INDEX",
          confirmed: s.lecturerConfirmed,
          student: s.student,
        }));
        setRecordedStudents(students);
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error?.error || "Failed to load record",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: Spacing[3], color: colors.foregroundMuted }}>Loading record...</Text>
      </View>
    );
  }

  if (!record) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <Ionicons name="document-text-outline" size={64} color={colors.foregroundMuted} />
        <Text style={{ marginTop: Spacing[3], color: colors.foregroundMuted }}>Record not found</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            marginTop: Spacing[4],
            paddingHorizontal: Spacing[4],
            paddingVertical: Spacing[2],
            backgroundColor: colors.primary,
            borderRadius: BorderRadius.md,
          }}
        >
          <Text style={{ color: "white", fontWeight: "600" }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  try {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={[{ type: 'header' }, { type: 'stats' }, ...recordedStudents.map(s => ({ type: 'student', data: s }))]}
        keyExtractor={(item, index) => item.type === 'student' ? item.data.id : item.type + index}
        contentContainerStyle={{ padding: Spacing[4], paddingBottom: Spacing[6] }}
        renderItem={({ item }) => {
          if (item.type === 'header') {
            return (
              <>
                {/* Record Info */}
                <Card style={{
                  marginBottom: Spacing[4],
                  padding: Spacing[4],
                  backgroundColor: colors.card,
                  ...Shadows.sm
                }}>
                  <View style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    marginBottom: Spacing[2]
                  }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{
                        fontSize: Typography.fontSize.lg,
                        fontWeight: Typography.fontWeight.bold,
                        marginBottom: Spacing[1],
                        color: colors.foreground
                      }}>
                        {record.courseName || "Attendance Recording"}
                      </Text>
                      {record.courseCode && (
                        <Text style={{
                          fontSize: Typography.fontSize.sm,
                          marginBottom: Spacing[1],
                          color: colors.foregroundMuted
                        }}>
                          {record.courseCode}
                        </Text>
                      )}
                      {record.lecturerName && (
                        <Text style={{
                          fontSize: Typography.fontSize.sm,
                          color: colors.foregroundMuted
                        }}>
                          Lecturer: {record.lecturerName}
                        </Text>
                      )}
                    </View>
                    <View
                      style={{
                        paddingHorizontal: Spacing[3],
                        paddingVertical: Spacing[1],
                        borderRadius: BorderRadius.full,
                        backgroundColor: record.status === "COMPLETED" ? colors.success : colors.primary
                      }}
                    >
                      <Text style={{
                        fontSize: Typography.fontSize.xs,
                        fontWeight: Typography.fontWeight.semibold,
                        color: "white"
                      }}>
                        {record.status === "COMPLETED" ? "COMPLETED" : record.status}
                      </Text>
                    </View>
                  </View>

                  <View style={{
                    flexDirection: "column",
                    alignItems: "flex-start",
                    marginTop: Spacing[2]
                  }}>
                    <Text style={{
                      fontSize: Typography.fontSize.xs,
                      color: colors.foregroundMuted,
                      marginBottom: Spacing[1]
                    }}>
                      Started: {new Date(record.startTime).toLocaleString()}
                    </Text>
                    {record.endTime && (
                      <Text style={{
                        fontSize: Typography.fontSize.xs,
                        color: colors.foregroundMuted
                      }}>
                        Ended: {new Date(record.endTime).toLocaleString()}
                      </Text>
                    )}
                  </View>
                </Card>
              </>
            );
          } else if (item.type === 'stats') {
            return (
              <>
                {/* Stats */}
                <View style={{ flexDirection: "row", gap: Spacing[3], marginBottom: Spacing[4] }}>
                  <Card
                    style={{
                      flex: 1,
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      ...Shadows.sm,
                    }}
                  >
                    <CardContent style={{ alignItems: 'center', padding: Spacing[3] }}>
                      <Ionicons name="people" size={24} color={colors.primary} style={{ marginBottom: Spacing[1] }} />
                      <Text style={{
                        fontSize: Typography.fontSize["2xl"],
                        fontWeight: Typography.fontWeight.bold,
                        color: colors.foreground,
                        marginBottom: Spacing[1]
                      }}>
                        {recordedStudents.length}
                      </Text>
                      <Text style={{
                        fontSize: Typography.fontSize.xs,
                        fontWeight: Typography.fontWeight.medium,
                        color: colors.foregroundMuted,
                        textAlign: "center"
                      }}>
                        Total Students
                      </Text>
                    </CardContent>
                  </Card>

                  <Card
                    style={{
                      flex: 1,
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      ...Shadows.sm,
                    }}
                  >
                    <CardContent style={{ alignItems: 'center', padding: Spacing[3] }}>
                      <Ionicons name="checkmark-circle" size={24} color={colors.success} style={{ marginBottom: Spacing[1] }} />
                      <Text style={{
                        fontSize: Typography.fontSize["2xl"],
                        fontWeight: Typography.fontWeight.bold,
                        color: colors.foreground,
                        marginBottom: Spacing[1]
                      }}>
                        {recordedStudents.filter(s => s.confirmed).length}
                      </Text>
                      <Text style={{
                        fontSize: Typography.fontSize.xs,
                        fontWeight: Typography.fontWeight.medium,
                        color: colors.foregroundMuted,
                        textAlign: "center"
                      }}>
                        Confirmed
                      </Text>
                    </CardContent>
                  </Card>

                  <Card
                    style={{
                      flex: 1,
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      ...Shadows.sm,
                    }}
                  >
                    <CardContent style={{ alignItems: 'center', padding: Spacing[3] }}>
                      <Ionicons name="time" size={24} color={colors.warning} style={{ marginBottom: Spacing[1] }} />
                      <Text style={{
                        fontSize: Typography.fontSize["2xl"],
                        fontWeight: Typography.fontWeight.bold,
                        color: colors.foreground,
                        marginBottom: Spacing[1]
                      }}>
                        {recordedStudents.filter(s => !s.confirmed).length}
                      </Text>
                      <Text style={{
                        fontSize: Typography.fontSize.xs,
                        fontWeight: Typography.fontWeight.medium,
                        color: colors.foregroundMuted,
                        textAlign: "center"
                      }}>
                        Pending
                      </Text>
                    </CardContent>
                  </Card>
                </View>

                {/* Students List Header */}
                <View>
                  <Text style={{
                    fontSize: Typography.fontSize.base,
                    fontWeight: Typography.fontWeight.semibold,
                    marginBottom: Spacing[3],
                    color: colors.foreground
                  }}>
                    Recorded Students ({recordedStudents.length})
                  </Text>
                </View>
              </>
            );
          } else {
            // Student item
            const student = item.data;
            return (
              <Card
                style={{
                  marginBottom: Spacing[2],
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  ...Shadows.sm,
                }}
              >
                <CardContent style={{ padding: Spacing[4] }}>
                  <View style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between"
                  }}>
                    <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                      {student.student.profilePicture ? (
                        <Image
                          source={{ uri: student.student.profilePicture }}
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: BorderRadius.full,
                            marginRight: Spacing[3],
                          }}
                          resizeMode="cover"
                        />
                      ) : (
                        <View
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: BorderRadius.full,
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: Spacing[3],
                            backgroundColor: colors.muted,
                          }}
                        >
                          <Ionicons
                            name="person"
                            size={18}
                            color={colors.foregroundMuted}
                          />
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={{
                          fontSize: Typography.fontSize.base,
                          fontWeight: Typography.fontWeight.semibold,
                          marginBottom: Spacing[1],
                          color: colors.foreground
                        }}>
                          {student.name}
                        </Text>
                        <Text style={{
                          fontSize: Typography.fontSize.sm,
                          marginBottom: Spacing[1],
                          color: colors.foregroundMuted
                        }}>
                          {student.indexNumber} • {student.method.replace('_', ' ')}
                        </Text>
                        <Text style={{
                          fontSize: Typography.fontSize.xs,
                          color: colors.foregroundMuted
                        }}>
                          {new Date(student.scanTime).toLocaleString()}
                        </Text>
                      </View>
                    </View>
                    {student.confirmed ? (
                      <View style={{ alignItems: "center" }}>
                        <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                        <Text style={{
                          fontSize: Typography.fontSize.xs,
                          marginTop: Spacing[1],
                          color: colors.success,
                          fontWeight: Typography.fontWeight.medium
                        }}>
                          Confirmed
                        </Text>
                      </View>
                    ) : (
                      <View style={{ alignItems: "center" }}>
                        <Ionicons name="time-outline" size={24} color={colors.warning} />
                        <Text style={{
                          fontSize: Typography.fontSize.xs,
                          marginTop: Spacing[1],
                          color: colors.warning,
                          fontWeight: Typography.fontWeight.medium
                        }}>
                          Pending
                        </Text>
                      </View>
                    )}
                  </View>
                </CardContent>
              </Card>
            );
          }
        }}
        ListEmptyComponent={
          recordedStudents.length === 0 ? (
            <View style={{
              alignItems: "center",
              paddingVertical: Spacing[8]
            }}>
              <Ionicons name="people-outline" size={48} color={colors.foregroundMuted} />
              <Text style={{
                fontSize: Typography.fontSize.base,
                marginTop: Spacing[2],
                color: colors.foregroundMuted
              }}>
                No students recorded
              </Text>
            </View>
          ) : null
        }
      />
    </View>
    );
  } catch (error) {
    console.error("Error rendering ViewAttendanceRecord:", error);
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <Text style={{ color: colors.foreground }}>Error loading attendance record</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            marginTop: Spacing[4],
            paddingHorizontal: Spacing[4],
            paddingVertical: Spacing[2],
            backgroundColor: colors.primary,
            borderRadius: BorderRadius.md,
          }}
        >
          <Text style={{ color: "white", fontWeight: "600" }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
}