import { useEffect, useState, useCallback } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
  Modal,
  FlatList,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, Camera } from "expo-camera";
import Toast from "react-native-toast-message";
import * as LocalAuthentication from "expo-local-authentication";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/typography";
import { useThemeColors, BorderRadius, Spacing, Typography, Shadows } from "@/constants/design-system";
import { classAttendanceApi } from "@/api/classAttendance";
import type { ClassAttendanceRecord } from "@/api/classAttendance";

type AttendanceMethod = "qrcode" | "manual" | "biometric";

interface RecordedStudent {
  id: string;
  indexNumber: string;
  name: string;
  scanTime: string;
  method: AttendanceMethod;
  confirmed: boolean;
}

export default function RecordAttendance() {
  const colors = useThemeColors();
  const router = useRouter();
  const params = useLocalSearchParams();
  const recordId = params.recordId as string;

  const [activeMethod, setActiveMethod] = useState<AttendanceMethod | null>(null);
  const [record, setRecord] = useState<ClassAttendanceRecord | null>(null);
  const [recordedStudents, setRecordedStudents] = useState<RecordedStudent[]>([]);
  const [showStudentsList, setShowStudentsList] = useState(false);
  const [loading, setLoading] = useState(false);

  // Manual entry state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // Biometric state
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  // QR Scanner state
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (!recordId) {
      Alert.alert("Error", "No active recording found", [
        { text: "OK", onPress: () => router.back() },
      ]);
      return;
    }
    loadRecord();
    checkBiometricSupport();
    requestCameraPermission();
  }, [recordId]);

  const loadRecord = useCallback(async () => {
    try {
      const { record: fetchedRecord } = await classAttendanceApi.getRecord(recordId);
      setRecord(fetchedRecord);
      
      // Transform students to RecordedStudent format
      if (fetchedRecord.students) {
        const students = fetchedRecord.students.map((s) => ({
          id: s.id,
          indexNumber: s.student.indexNumber,
          name: `${s.student.firstName} ${s.student.lastName}`,
          scanTime: s.scanTime,
          method: "manual" as AttendanceMethod, // Default, would come from backend
          confirmed: s.lecturerConfirmed,
        }));
        setRecordedStudents(students);
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error?.error || "Failed to load record",
      });
    }
  }, [recordId]);

  const checkBiometricSupport = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    setBiometricAvailable(hasHardware && isEnrolled);
  };

  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasCameraPermission(status === 'granted');
  };

  // QR Code Scanning
  const handleQRScan = async (qrData: string) => {
    setLoading(true);
    try {
      // Validate QR data is not empty
      if (!qrData || qrData.trim() === '') {
        throw new Error("Empty QR code data");
      }

      // The QR data should be a JSON string containing student information
      let data;
      try {
        data = JSON.parse(qrData);
      } catch (parseError) {
        throw new Error("Invalid QR code format");
      }
      
      // Extract student identifier (index number is required)
      const studentIdentifier = data.indexNumber || data.id;
      
      if (!studentIdentifier) {
        throw new Error("Invalid QR code: missing student identifier");
      }

      await classAttendanceApi.recordStudentAttendance({
        recordId,
        studentId: qrData, // Send the full JSON string, backend will parse it
      });

      // Add to recorded students with data from QR
      const newStudent: RecordedStudent = {
        id: data.id || studentIdentifier,
        indexNumber: data.indexNumber || studentIdentifier,
        name: data.name || 'Student',
        scanTime: new Date().toISOString(),
        method: "qrcode",
        confirmed: true,
      };
      setRecordedStudents((prev) => [newStudent, ...prev]);

      Toast.show({
        type: "success",
        text1: "Attendance Recorded",
        text2: `${newStudent.name} marked present`,
      });
      
      // Close scanner after successful scan
      setShowQRScanner(false);
    } catch (error: any) {
      console.error('QR Scan error:', error);
      Toast.show({
        type: "error",
        text1: "Scan Failed",
        text2: error.message || "Failed to record attendance",
      });
    } finally {
      setLoading(false);
      setIsScanning(false);
    }
  };

  // Manual Search
  const searchStudents = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      // TODO: Implement backend search endpoint
      // const results = await classAttendanceApi.searchStudents(query);
      // setSearchResults(results);
      
      // Mock implementation for now
      setTimeout(() => {
        setSearchResults([
          {
            id: "1",
            indexNumber: "20230001",
            firstName: "John",
            lastName: "Doe",
            program: "Computer Science",
            level: 300,
          },
        ]);
        setSearching(false);
      }, 500);
    } catch (error) {
      setSearching(false);
      setSearchResults([]);
    }
  }, []);

  useEffect(() => {
    const debounce = setTimeout(() => {
      searchStudents(searchQuery);
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchQuery, searchStudents]);

  const handleManualRecord = async (student: any) => {
    setLoading(true);
    try {
      await classAttendanceApi.recordStudentAttendance({
        recordId,
        studentId: student.id,
      });

      const newStudent: RecordedStudent = {
        id: student.id,
        indexNumber: student.indexNumber,
        name: `${student.firstName} ${student.lastName}`,
        scanTime: new Date().toISOString(),
        method: "manual",
        confirmed: false, // Requires confirmation
      };
      setRecordedStudents((prev) => [newStudent, ...prev]);

      Toast.show({
        type: "success",
        text1: "Attendance Recorded",
        text2: `${newStudent.name} marked present (pending confirmation)`,
      });

      setSearchQuery("");
      setSearchResults([]);
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error?.error || "Failed to record attendance",
      });
    } finally {
      setLoading(false);
    }
  };

  // Biometric Attendance
  const handleBiometricScan = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Scan fingerprint to mark attendance",
        cancelLabel: "Cancel",
        disableDeviceFallback: false,
      });

      if (!result.success) {
        if (result.error !== "user_cancel") {
          Toast.show({
            type: "error",
            text1: "Authentication Failed",
            text2: "Please try again",
          });
        }
        return;
      }

      // TODO: Get biometric hash and send to backend
      // For now, prompt for student ID
      Alert.prompt(
        "Student ID",
        "Enter student index number",
        async (indexNumber) => {
          if (!indexNumber) return;

          setLoading(true);
          try {
            await classAttendanceApi.recordStudentAttendance({
              recordId,
              studentId: indexNumber,
            });

            const newStudent: RecordedStudent = {
              id: indexNumber,
              indexNumber,
              name: "Student", // Would come from backend
              scanTime: new Date().toISOString(),
              method: "biometric",
              confirmed: true,
            };
            setRecordedStudents((prev) => [newStudent, ...prev]);

            Toast.show({
              type: "success",
              text1: "Attendance Recorded",
              text2: "Biometric verification successful",
            });
          } catch (error: any) {
            Toast.show({
              type: "error",
              text1: "Error",
              text2: error?.error || "Failed to record attendance",
            });
          } finally {
            setLoading(false);
          }
        }
      );
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Biometric authentication failed",
      });
    }
  };

  const handleEndRecording = () => {
    Alert.alert(
      "End Recording",
      "Are you sure you want to end this recording session?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "End Recording",
          style: "destructive",
          onPress: async () => {
            try {
              await classAttendanceApi.endRecord(recordId);
              Toast.show({
                type: "success",
                text1: "Recording Ended",
                text2: "Attendance recording has been stopped",
              });
              router.back();
            } catch (error: any) {
              Toast.show({
                type: "error",
                text1: "Error",
                text2: error?.error || "Failed to end recording",
              });
            }
          },
        },
      ]
    );
  };

  const getMethodIcon = (method: AttendanceMethod) => {
    switch (method) {
      case "qrcode":
        return "qr-code";
      case "manual":
        return "create";
      case "biometric":
        return "finger-print";
    }
  };

  const getMethodColor = (method: AttendanceMethod) => {
    switch (method) {
      case "qrcode":
        return "#3b82f6";
      case "manual":
        return "#f59e0b";
      case "biometric":
        return "#10b981";
    }
  };

  if (!recordId) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Stats Bar */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: Spacing[4],
          paddingVertical: Spacing[3],
          borderBottomWidth: 1,
          backgroundColor: colors.card,
          borderColor: colors.border,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing[2] }}>
          <Ionicons name="people" size={20} color={colors.primary} />
          <Text style={{
            fontSize: Typography.fontSize.base,
            fontWeight: Typography.fontWeight.semibold,
            color: colors.foreground
          }}>
            {recordedStudents.length} Students
          </Text>
        </View>
        <View style={{ flexDirection: "row", gap: Spacing[3] }}>
          <TouchableOpacity
            onPress={() => setShowStudentsList(true)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: Spacing[2],
              paddingHorizontal: Spacing[3],
              paddingVertical: Spacing[2],
              borderRadius: BorderRadius.lg,
              backgroundColor: colors.muted,
            }}
          >
            <Ionicons name="list" size={18} color={colors.primary} />
            <Text style={{
              fontSize: Typography.fontSize.sm,
              fontWeight: Typography.fontWeight.medium,
              color: colors.primary
            }}>
              View List
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleEndRecording}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: Spacing[2],
              paddingHorizontal: Spacing[3],
              paddingVertical: Spacing[2],
              borderRadius: BorderRadius.lg,
              backgroundColor: colors.error,
            }}
          >
            <Ionicons name="stop-circle" size={18} color="white" />
            <Text style={{
              fontSize: Typography.fontSize.sm,
              fontWeight: Typography.fontWeight.semibold,
              color: "white"
            }}>End</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1, padding: Spacing[4] }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Spacing[6] }}
      >
        {/* Recording Info */}
        {record && (
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
                  backgroundColor: colors.success
                }}
              >
                <Text style={{
                  fontSize: Typography.fontSize.xs,
                  fontWeight: Typography.fontWeight.semibold,
                  color: "white"
                }}>IN PROGRESS</Text>
              </View>
            </View>
            <Text style={{
              fontSize: Typography.fontSize.xs,
              marginTop: Spacing[2],
              color: colors.foregroundMuted
            }}>
              Started: {new Date(record.startTime).toLocaleString()}
            </Text>
          </Card>
        )}

        {/* Method Selection */}
        <Text style={{
          fontSize: Typography.fontSize.base,
          fontWeight: Typography.fontWeight.semibold,
          marginBottom: Spacing[3],
          color: colors.foreground
        }}>
          Recording Methods
        </Text>

        <View style={{ gap: Spacing[3], marginBottom: Spacing[6] }}>
          {/* QR Code Method */}
          <TouchableOpacity
            onPress={() => setActiveMethod(activeMethod === "qrcode" ? null : "qrcode")}
            style={{
              overflow: "hidden",
              borderRadius: BorderRadius.xl,
              borderWidth: 2,
              backgroundColor: activeMethod === "qrcode" ? colors.primary + "10" : colors.card,
              borderColor: activeMethod === "qrcode" ? colors.primary : colors.border,
            }}
          >
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              padding: Spacing[4]
            }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: BorderRadius.full,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: Spacing[3],
                  backgroundColor: colors.primary + "15",
                }}
              >
                <Ionicons name="qr-code" size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: Typography.fontSize.base,
                  fontWeight: Typography.fontWeight.semibold,
                  color: colors.foreground
                }}>
                  QR Code Scan
                </Text>
                <Text style={{
                  fontSize: Typography.fontSize.sm,
                  color: colors.foregroundMuted
                }}>
                  Scan student QR codes
                </Text>
              </View>
              <Ionicons
                name={activeMethod === "qrcode" ? "chevron-up" : "chevron-down"}
                size={20}
                color={colors.foregroundMuted}
              />
            </View>

            {activeMethod === "qrcode" && (
              <View style={{
                paddingHorizontal: Spacing[4],
                paddingBottom: Spacing[4],
                borderTopWidth: 1,
                borderColor: colors.border
              }}>
                <Button
                  onPress={() => {
                    if (hasCameraPermission) {
                      setShowQRScanner(true);
                    } else {
                      Alert.alert(
                        "Camera Permission Required",
                        "Please enable camera permissions to scan QR codes",
                        [
                          { text: "Cancel", style: "cancel" },
                          { text: "Settings", onPress: () => requestCameraPermission() }
                        ]
                      );
                    }
                  }}
                  style={{ marginTop: Spacing[3] }}
                  disabled={loading}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing[2] }}>
                    <Ionicons name="scan" size={18} color="white" />
                    <Text style={{
                      color: "white",
                      fontWeight: Typography.fontWeight.semibold
                    }}>
                      {loading ? "Processing..." : "Open Scanner"}
                    </Text>
                  </View>
                </Button>
              </View>
            )}
          </TouchableOpacity>

          {/* Manual Entry Method */}
          <TouchableOpacity
            onPress={() => setActiveMethod(activeMethod === "manual" ? null : "manual")}
            style={{
              overflow: "hidden",
              borderRadius: BorderRadius.xl,
              borderWidth: 2,
              backgroundColor: activeMethod === "manual" ? "#fef3c715" : colors.card,
              borderColor: activeMethod === "manual" ? "#f59e0b" : colors.border,
            }}
          >
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              padding: Spacing[4]
            }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: BorderRadius.full,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: Spacing[3],
                  backgroundColor: "#fef3c7",
                }}
              >
                <Ionicons name="create" size={24} color="#f59e0b" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: Typography.fontSize.base,
                  fontWeight: Typography.fontWeight.semibold,
                  color: colors.foreground
                }}>
                  Manual Entry
                </Text>
                <Text style={{
                  fontSize: Typography.fontSize.sm,
                  color: colors.foregroundMuted
                }}>
                  Search and select students
                </Text>
              </View>
              <Ionicons
                name={activeMethod === "manual" ? "chevron-up" : "chevron-down"}
                size={20}
                color={colors.foregroundMuted}
              />
            </View>

            {activeMethod === "manual" && (
              <View style={{
                paddingHorizontal: Spacing[4],
                paddingBottom: Spacing[4],
                borderTopWidth: 1,
                borderColor: colors.border
              }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginTop: Spacing[3],
                    paddingHorizontal: Spacing[3],
                    paddingVertical: Spacing[2],
                    borderRadius: BorderRadius.lg,
                    borderWidth: 1,
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  }}
                >
                  <Ionicons name="search" size={18} color={colors.foregroundMuted} />
                  <TextInput
                    style={{
                      flex: 1,
                      marginLeft: Spacing[2],
                      fontSize: Typography.fontSize.base,
                      color: colors.foreground
                    }}
                    placeholder="Search by name or index number..."
                    placeholderTextColor={colors.foregroundMuted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCapitalize="none"
                  />
                  {searching && <ActivityIndicator size="small" color={colors.primary} />}
                </View>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <View style={{
                    marginTop: Spacing[2],
                    borderRadius: BorderRadius.lg,
                    borderWidth: 1,
                    borderColor: colors.border
                  }}>
                    {searchResults.map((student, index) => (
                      <TouchableOpacity
                        key={student.id}
                        onPress={() => handleManualRecord(student)}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          padding: Spacing[3],
                          backgroundColor: colors.card,
                          borderBottomWidth: index === searchResults.length - 1 ? 0 : 1,
                          borderColor: colors.border,
                        }}
                        disabled={loading}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={{
                            fontSize: Typography.fontSize.sm,
                            fontWeight: Typography.fontWeight.semibold,
                            color: colors.foreground
                          }}>
                            {student.firstName} {student.lastName}
                          </Text>
                          <Text style={{
                            fontSize: Typography.fontSize.xs,
                            color: colors.foregroundMuted
                          }}>
                            {student.indexNumber} • {student.program}
                          </Text>
                        </View>
                        <Ionicons name="add-circle" size={24} color={colors.primary} />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}
          </TouchableOpacity>

          {/* Biometric Method */}
          <TouchableOpacity
            onPress={() =>
              biometricAvailable
                ? setActiveMethod(activeMethod === "biometric" ? null : "biometric")
                : Alert.alert("Not Available", "Biometric authentication is not set up on this device")
            }
            style={{
              overflow: "hidden",
              borderRadius: BorderRadius.xl,
              borderWidth: 2,
              backgroundColor: activeMethod === "biometric" ? "#d1fae515" : colors.card,
              borderColor: activeMethod === "biometric" ? "#10b981" : colors.border,
              opacity: biometricAvailable ? 1 : 0.5,
            }}
          >
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              padding: Spacing[4]
            }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: BorderRadius.full,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: Spacing[3],
                  backgroundColor: "#d1fae5",
                }}
              >
                <Ionicons name="finger-print" size={24} color="#10b981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: Typography.fontSize.base,
                  fontWeight: Typography.fontWeight.semibold,
                  color: colors.foreground
                }}>
                  Biometric Scan
                </Text>
                <Text style={{
                  fontSize: Typography.fontSize.sm,
                  color: colors.foregroundMuted
                }}>
                  {biometricAvailable ? "Use fingerprint/face ID" : "Not available"}
                </Text>
              </View>
              <Ionicons
                name={activeMethod === "biometric" ? "chevron-up" : "chevron-down"}
                size={20}
                color={colors.foregroundMuted}
              />
            </View>

            {activeMethod === "biometric" && biometricAvailable && (
              <View style={{
                paddingHorizontal: Spacing[4],
                paddingBottom: Spacing[4],
                borderTopWidth: 1,
                borderColor: colors.border
              }}>
                <Button
                  onPress={handleBiometricScan}
                  style={{
                    marginTop: Spacing[3],
                    backgroundColor: "#10b981"
                  }}
                  disabled={loading}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing[2] }}>
                    <Ionicons name="finger-print" size={18} color="white" />
                    <Text style={{
                      color: "white",
                      fontWeight: Typography.fontWeight.semibold
                    }}>
                      {loading ? "Processing..." : "Scan Fingerprint"}
                    </Text>
                  </View>
                </Button>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Recent Recordings Preview */}
        {recordedStudents.length > 0 && (
          <View>
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: Spacing[3]
            }}>
              <Text style={{
                fontSize: Typography.fontSize.base,
                fontWeight: Typography.fontWeight.semibold,
                color: colors.foreground
              }}>
                Recent Recordings
              </Text>
              <TouchableOpacity onPress={() => setShowStudentsList(true)}>
                <Text style={{
                  fontSize: Typography.fontSize.sm,
                  fontWeight: Typography.fontWeight.medium,
                  color: colors.primary
                }}>
                  View All ({recordedStudents.length})
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{ gap: Spacing[2] }}>
              {recordedStudents.slice(0, 3).map((student) => (
                <View
                  key={student.id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    padding: Spacing[3],
                    borderRadius: BorderRadius.lg,
                    backgroundColor: colors.card,
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: BorderRadius.full,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: Spacing[3],
                      backgroundColor: getMethodColor(student.method) + "15",
                    }}
                  >
                    <Ionicons
                      name={getMethodIcon(student.method)}
                      size={18}
                      color={getMethodColor(student.method)}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: Typography.fontSize.sm,
                      fontWeight: Typography.fontWeight.semibold,
                      color: colors.foreground
                    }}>
                      {student.name}
                    </Text>
                    <Text style={{
                      fontSize: Typography.fontSize.xs,
                      color: colors.foregroundMuted
                    }}>
                      {student.indexNumber} • {new Date(student.scanTime).toLocaleTimeString()}
                    </Text>
                  </View>
                  {student.confirmed ? (
                    <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                  ) : (
                    <View
                      style={{
                        paddingHorizontal: Spacing[2],
                        paddingVertical: Spacing[1],
                        borderRadius: BorderRadius.full,
                        backgroundColor: "#fef3c7",
                      }}
                    >
                      <Text style={{
                        fontSize: Typography.fontSize.xs,
                        fontWeight: Typography.fontWeight.medium,
                        color: "#f59e0b"
                      }}>
                        Pending
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* QR Scanner Modal */}
      <Modal
        visible={showQRScanner}
        animationType="slide"
        transparent={false}
        onRequestClose={() => {
          setShowQRScanner(false);
          setIsScanning(false);
        }}
      >
        <View style={{ flex: 1, backgroundColor: "black" }}>
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            padding: Spacing[4],
            paddingTop: Spacing[6],
            backgroundColor: "black"
          }}>
            <Text style={{
              fontSize: Typography.fontSize.lg,
              fontWeight: Typography.fontWeight.bold,
              color: "white"
            }}>
              Scan Student QR Code
            </Text>
            <TouchableOpacity 
              onPress={() => {
                setShowQRScanner(false);
                setIsScanning(false);
              }}
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {hasCameraPermission && (
            <CameraView
              style={{ flex: 1 }}
              facing="back"
              barcodeScannerSettings={{
                barcodeTypes: ["qr"],
              }}
              onBarcodeScanned={({ data }) => {
                if (isScanning) return; // Prevent multiple scans
                setIsScanning(true);
                handleQRScan(data);
              }}
            >
              <View style={{
                flex: 1,
                backgroundColor: "transparent",
                justifyContent: "center",
                alignItems: "center"
              }}>
                <View style={{
                  width: 250,
                  height: 250,
                  borderWidth: 2,
                  borderColor: "white",
                  borderRadius: BorderRadius.lg,
                  backgroundColor: "transparent"
                }} />
                <Text style={{
                  color: "white",
                  fontSize: Typography.fontSize.sm,
                  marginTop: Spacing[4],
                  textAlign: "center",
                  paddingHorizontal: Spacing[4]
                }}>
                  Position the QR code within the frame to scan
                </Text>
              </View>
            </CameraView>
          )}

          {!hasCameraPermission && (
            <View style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              padding: Spacing[4]
            }}>
              <Ionicons name="camera" size={64} color="white" />
              <Text style={{
                color: "white",
                fontSize: Typography.fontSize.lg,
                fontWeight: Typography.fontWeight.semibold,
                marginTop: Spacing[4],
                textAlign: "center"
              }}>
                Camera Permission Required
              </Text>
              <Text style={{
                color: "white",
                fontSize: Typography.fontSize.base,
                marginTop: Spacing[2],
                textAlign: "center"
              }}>
                Please enable camera permissions to scan QR codes
              </Text>
              <Button
                onPress={requestCameraPermission}
                style={{ marginTop: Spacing[4] }}
              >
                <Text style={{ color: "white", fontWeight: Typography.fontWeight.semibold }}>
                  Grant Permission
                </Text>
              </Button>
            </View>
          )}
        </View>
      </Modal>

      {/* Students List Drawer */}
      <Modal
        visible={showStudentsList}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowStudentsList(false)}
      >
        <View style={{
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: "rgba(0,0,0,0.5)"
        }}>
          <View
            style={{
              height: "75%",
              borderTopLeftRadius: BorderRadius["3xl"],
              borderTopRightRadius: BorderRadius["3xl"],
              backgroundColor: colors.background,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                padding: Spacing[4],
                borderBottomWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{
                fontSize: Typography.fontSize.lg,
                fontWeight: Typography.fontWeight.bold,
                color: colors.foreground
              }}>
                Recorded Students ({recordedStudents.length})
              </Text>
              <TouchableOpacity onPress={() => setShowStudentsList(false)}>
                <Ionicons name="close" size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={recordedStudents}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{
                padding: Spacing[4],
                paddingBottom: Spacing[8]
              }}
              renderItem={({ item }) => (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    padding: Spacing[4],
                    marginBottom: Spacing[2],
                    borderRadius: BorderRadius.xl,
                    backgroundColor: colors.card,
                  }}
                >
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: BorderRadius.full,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: Spacing[3],
                      backgroundColor: getMethodColor(item.method) + "15",
                    }}
                  >
                    <Ionicons
                      name={getMethodIcon(item.method)}
                      size={20}
                      color={getMethodColor(item.method)}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: Typography.fontSize.base,
                      fontWeight: Typography.fontWeight.semibold,
                      marginBottom: Spacing[1],
                      color: colors.foreground
                    }}>
                      {item.name}
                    </Text>
                    <Text style={{
                      fontSize: Typography.fontSize.sm,
                      marginBottom: Spacing[1],
                      color: colors.foregroundMuted
                    }}>
                      {item.indexNumber}
                    </Text>
                    <Text style={{
                      fontSize: Typography.fontSize.xs,
                      color: colors.foregroundMuted
                    }}>
                      {new Date(item.scanTime).toLocaleString()}
                    </Text>
                  </View>
                  {item.confirmed ? (
                    <View style={{ alignItems: "center" }}>
                      <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                      <Text style={{
                        fontSize: Typography.fontSize.xs,
                        marginTop: Spacing[1],
                        color: "#10b981"
                      }}>
                        Confirmed
                      </Text>
                    </View>
                  ) : (
                    <View style={{ alignItems: "center" }}>
                      <View
                        style={{
                          paddingHorizontal: Spacing[3],
                          paddingVertical: Spacing[1],
                          borderRadius: BorderRadius.full,
                          backgroundColor: "#fef3c7",
                        }}
                      >
                        <Text style={{
                          fontSize: Typography.fontSize.xs,
                          fontWeight: Typography.fontWeight.medium,
                          color: "#f59e0b"
                        }}>
                          Pending
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              )}
              ListEmptyComponent={
                <View style={{
                  alignItems: "center",
                  paddingVertical: Spacing[12]
                }}>
                  <Ionicons name="people-outline" size={64} color={colors.foregroundMuted} />
                  <Text style={{
                    fontSize: Typography.fontSize.base,
                    marginTop: Spacing[4],
                    color: colors.foregroundMuted
                  }}>
                    No students recorded yet
                  </Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}