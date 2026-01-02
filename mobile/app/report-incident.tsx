/**
 * Report Incident Screen - REFACTORED
 * Enhanced with: session selection, debounced lookup, manual student info, auto-severity, file validation, draft system
 */

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Pressable,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  useThemeColors,
  Spacing,
  Typography,
  BorderRadius,
} from "@/constants/design-system";
import { getFileUrl } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import {
  createIncident,
  uploadAttachments,
  type IncidentType,
  getIncidentTypeLabel,
  getSeverityFromType,
} from "@/api/incidents";
import { examSessionsApi, type ExamSession } from "@/api/examSessions";
import { useSessionStore } from "@/store/session";
import {
  searchIncidentTemplates,
  getTemplatesForType,
  type IncidentTemplate,
} from "@/constants/incident-templates";
import {
  lookupStudentForIncident,
  type Student,
  type StudentLookupResult,
} from "@/api/students";
import {
  debounce,
  validateAttachment,
  type AttachmentFile,
} from "@/utils/debounce";

// Safe ImagePicker wrapper
let imagePicker: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ImagePicker = require("expo-image-picker");
  imagePicker = ImagePicker;
} catch {
  console.warn("ImagePicker not available, camera features disabled");
}

const DRAFT_KEY = "incident_draft";

export default function ReportIncidentScreen() {
  const colors = useThemeColors();
  const { currentSession } = useSessionStore();

  // Ref to track if a suggestion is being selected
  const selectingSuggestionRef = useRef(false);

  const [loading, setLoading] = useState(false);

  // Form data
  const [formData, setFormData] = useState<{
    type: IncidentType;
    title: string;
    description: string;
    location: string;
    isConfidential: boolean;
  }>({
    type: "OTHER",
    title: "",
    description: "",
    location: "",
    isConfidential: false,
  });

  // Exam session selection
  const [examSessions, setExamSessions] = useState<ExamSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ExamSession | null>(null);

  // Student-related state (only for student-related incidents)
  const [showStudentField, setShowStudentField] = useState(false);
  const [studentIndexNumber, setStudentIndexNumber] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentLookupLoading, setStudentLookupLoading] = useState(false);
  
  // Manual student info (when student not found)
  const [showManualStudentFields, setShowManualStudentFields] = useState(false);
  const [manualStudentInfo, setManualStudentInfo] = useState({
    indexNumber: "",
    fullName: "",
    program: "",
  });

  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [titleSuggestions, setTitleSuggestions] = useState<IncidentTemplate[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Preview modal state
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewFile, setPreviewFile] = useState<AttachmentFile | null>(null);
  
  // Session picker modal state
  const [sessionPickerVisible, setSessionPickerVisible] = useState(false);
  
  // Dialog states
  const [errorDialog, setErrorDialog] = useState({ visible: false, title: "", message: "" });
  const [successDialog, setSuccessDialog] = useState({ visible: false, incidentId: "", message: "" });

  // Auto-determined severity based on incident type
  const currentSeverity = getSeverityFromType(formData.type);

  // Handle form field changes
  const handleChange = useCallback((field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  // Load exam sessions on mount
  useEffect(() => {
    loadExamSessions();
  }, []);

  const loadExamSessions = async () => {
    try {
      const sessions = await examSessionsApi.getExamSessions();
      // Show all exam sessions
      setExamSessions(sessions);
    } catch (error) {
      console.error("Failed to load exam sessions:", error);
    }
  };

  // Auto-populate session from scanner context
  useEffect(() => {
    if (currentSession && !selectedSession) {
      // Find matching session from examSessions list
      const matchingSession = examSessions.find(s => s.id === currentSession.id);
      if (matchingSession) {
        setSelectedSession(matchingSession);
        if (matchingSession.venue && !formData.location) {
          handleChange("location", matchingSession.venue);
        }
      }
    }
  }, [currentSession, selectedSession, examSessions, formData.location, handleChange]);

  // Auto-populate location when session changes
  useEffect(() => {
    if (selectedSession?.venue && !formData.location) {
      handleChange("location", selectedSession.venue);
    }
  }, [selectedSession, formData.location, handleChange]);

  // Show/hide student field based on incident type
  useEffect(() => {
    const studentRelatedTypes: IncidentType[] = [
      "MALPRACTICE",
      "STUDENT_ILLNESS",
    ];
    const shouldShow = studentRelatedTypes.includes(formData.type);
    setShowStudentField(shouldShow);

    // Clear student data when switching away from student-related types
    if (!shouldShow) {
      setStudentIndexNumber("");
      setSelectedStudent(null);
      setShowManualStudentFields(false);
      setManualStudentInfo({ indexNumber: "", fullName: "", program: "" });
    }
  }, [formData.type]);

  // Debounced student lookup (1 second)
  const debouncedStudentLookup = useMemo(
    () => debounce(async (indexNumber: string, sessionId?: string) => {
      if (indexNumber.trim().length < 3) {
        return;
      }

      try {
        setStudentLookupLoading(true);
        const result: StudentLookupResult = await lookupStudentForIncident(
          indexNumber.trim(),
          sessionId
        );

        if (result.found && result.student) {
          setSelectedStudent(result.student);
          setShowManualStudentFields(false);
        } else {
          // Student not found - show manual entry fields
          setSelectedStudent(null);
          setShowManualStudentFields(true);
          setManualStudentInfo({
            indexNumber: indexNumber.trim(),
            fullName: "",
            program: "",
          });
        }
      } catch (error: any) {
        // Student not found (404) - show manual entry fields
        if (error?.response?.status === 404 || error?.error === "Student not found") {
          setSelectedStudent(null);
          setShowManualStudentFields(true);
          setManualStudentInfo({
            indexNumber: indexNumber.trim(),
            fullName: "",
            program: "",
          });
        } else {
          console.error("Student lookup error:", error);
          setSelectedStudent(null);
        }
      } finally {
        setStudentLookupLoading(false);
      }
    }, 1000),
    []
  );

  // Handle student index number input
  const handleStudentIndexNumberChange = (indexNumber: string) => {
    setStudentIndexNumber(indexNumber);

    if (indexNumber.trim().length === 0) {
      setSelectedStudent(null);
      setShowManualStudentFields(false);
      return;
    }

    // Call debounced lookup with exam session context
    debouncedStudentLookup(indexNumber, selectedSession?.id);
  };

  // Get current location
  const getCurrentLocation = async () => {
    try {
      setFetchingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setErrorDialog({
          visible: true,
          title: "Permission Denied",
          message: "Location permission is required to get your current location."
        });
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (address[0]) {
        const { name, street, city, region } = address[0];
        const locationStr = [name, street, city, region]
          .filter(Boolean)
          .join(", ");
        handleChange("location", locationStr);
      } else {
        handleChange(
          "location",
          `${location.coords.latitude.toFixed(6)}, ${location.coords.longitude.toFixed(6)}`
        );
      }
    } catch {
      setErrorDialog({
        visible: true,
        title: "Location Error",
        message: "Failed to get current location. Please try again."
      });
    } finally {
      setFetchingLocation(false);
    }
  };

  // Auto-populate location from selected exam session
  const populateLocationFromSession = () => {
    if (selectedSession?.venue) {
      handleChange("location", selectedSession.venue);
    }
  };

  // Handle title input change with smart suggestions
  const handleTitleChange = (text: string) => {
    handleChange("title", text);

    if (text.trim().length > 0) {
      const allSuggestions = searchIncidentTemplates(text);
      const typeSuggestions = searchIncidentTemplates(text, formData.type);
      const combinedSuggestions = [
        ...typeSuggestions,
        ...allSuggestions.filter(
          (s) => !typeSuggestions.find((ts) => ts.id === s.id)
        ),
      ];
      setTitleSuggestions(combinedSuggestions.slice(0, 5));
      setShowSuggestions(combinedSuggestions.length > 0);
    } else {
      setTitleSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Select a template suggestion
  const selectTemplate = (template: IncidentTemplate) => {
    console.log("selectTemplate called:", template.title);
    
    // Immediately update form data - no setTimeout needed
    setFormData((prev) => ({
      ...prev,
      title: template.title,
      description: template.description,
    }));
    
    // Hide suggestions immediately
    setShowSuggestions(false);
    setTitleSuggestions([]);
    
    console.log("Form data updated with template");
  };

  // Handle incident type change
  const handleTypeChange = (type: IncidentType) => {
    handleChange("type", type);
    
    // Refresh suggestions
    if (formData.title.trim().length > 0) {
      const allSuggestions = searchIncidentTemplates(formData.title);
      const typeSuggestions = searchIncidentTemplates(formData.title, type);
      const combinedSuggestions = [
        ...typeSuggestions,
        ...allSuggestions.filter(
          (s) => !typeSuggestions.find((ts) => ts.id === s.id)
        ),
      ];
      setTitleSuggestions(combinedSuggestions.slice(0, 5));
      setShowSuggestions(combinedSuggestions.length > 0);
    }
  };

  // Take photo with camera
  const takePhoto = async () => {
    if (!imagePicker) {
      setErrorDialog({
        visible: true,
        title: "Camera Unavailable",
        message: "Camera functionality is not available on this device."
      });
      return;
    }

    if (attachments.length >= 5) {
      setErrorDialog({
        visible: true,
        title: "Limit Reached",
        message: "Maximum 5 attachments allowed per incident report."
      });
      return;
    }

    try {
      const { status } = await imagePicker.requestCameraPermissionsAsync();

      if (status !== "granted") {
        setErrorDialog({
          visible: true,
          title: "Permission Denied",
          message: "Camera permission is required to take photos."
        });
        return;
      }

      const result = await imagePicker.launchCameraAsync({
        mediaTypes: imagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const file: AttachmentFile = {
          uri: asset.uri,
          name: `photo_${Date.now()}.jpg`,
          type: "image/jpeg",
          size: asset.fileSize,
        };

        const validation = validateAttachment(file);
        if (!validation.valid) {
          setErrorDialog({
            visible: true,
            title: "Invalid File",
            message: validation.error || "The selected file is invalid."
          });
          return;
        }

        setAttachments((prev) => [...prev, file]);
      }
    } catch {
      setErrorDialog({
        visible: true,
        title: "Camera Error",
        message: "Failed to take photo. Please try again."
      });
    }
  };

  // Pick image from gallery
  const pickImage = async () => {
    if (!imagePicker) {
      setErrorDialog({
        visible: true,
        title: "Image Picker Unavailable",
        message: "Image picker is not available on this device."
      });
      return;
    }

    if (attachments.length >= 5) {
      setErrorDialog({
        visible: true,
        title: "Limit Reached",
        message: "Maximum 5 attachments allowed per incident report."
      });
      return;
    }

    try {
      const result = await imagePicker.launchImageLibraryAsync({
        mediaTypes: imagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        const newFiles: AttachmentFile[] = [];
        for (const asset of result.assets) {
          if (attachments.length + newFiles.length >= 5) {
            setErrorDialog({
              visible: true,
              title: "Limit Reached",
              message: "Maximum 5 attachments allowed. Some files were not added."
            });
            break;
          }

          const file: AttachmentFile = {
            uri: asset.uri,
            name: `image_${Date.now()}.jpg`,
            type: "image/jpeg",
            size: asset.fileSize,
          };

          const validation = validateAttachment(file);
          if (validation.valid) {
            newFiles.push(file);
          } else {
            setErrorDialog({
              visible: true,
              title: "Invalid File",
              message: `${asset.fileName || 'File'}: ${validation.error}`
            });
          }
        }
        setAttachments((prev) => [...prev, ...newFiles]);
      }
    } catch {
      setErrorDialog({
        visible: true,
        title: "Image Picker Error",
        message: "Failed to pick image. Please try again."
      });
    }
  };

  // Pick document
  const pickDocument = async () => {
    if (attachments.length >= 5) {
      setErrorDialog({
        visible: true,
        title: "Limit Reached",
        message: "Maximum 5 attachments allowed per incident report."
      });
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*", "video/*"],
        multiple: true,
      });

      if (!result.canceled && result.assets) {
        const newFiles: AttachmentFile[] = [];
        for (const asset of result.assets) {
          if (attachments.length + newFiles.length >= 5) {
            setErrorDialog({
              visible: true,
              title: "Limit Reached",
              message: "Maximum 5 attachments allowed. Some files were not added."
            });
            break;
          }

          const file: AttachmentFile = {
            uri: asset.uri,
            name: asset.name,
            type: asset.mimeType || "application/octet-stream",
            size: asset.size,
          };

          const validation = validateAttachment(file);
          if (validation.valid) {
            newFiles.push(file);
          } else {
            setErrorDialog({
              visible: true,
              title: "Invalid File",
              message: `${asset.name}: ${validation.error}`
            });
          }
        }
        setAttachments((prev) => [...prev, ...newFiles]);
      }
    } catch {
      setErrorDialog({
        visible: true,
        title: "Document Picker Error",
        message: "Failed to pick document. Please try again."
      });
    }
  };

  // Remove attachment
  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Preview attachment
  const previewAttachment = (file: AttachmentFile) => {
    setPreviewFile(file);
    setPreviewVisible(true);
  };

  const closePreview = () => {
    setPreviewVisible(false);
    setPreviewFile(null);
  };

  // Draft system - auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (formData.title || formData.description) {
        saveDraft();
      }
    }, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, attachments, selectedSession, manualStudentInfo]);

  const saveDraft = async () => {
    try {
      const draft = {
        formData,
        attachments: attachments.map(a => ({ uri: a.uri, name: a.name, type: a.type, size: a.size })),
        selectedSessionId: selectedSession?.id,
        studentIndexNumber,
        manualStudentInfo: showManualStudentFields ? manualStudentInfo : null,
        timestamp: new Date().toISOString(),
      };
      await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      console.log("Draft saved");
    } catch (error) {
      console.error("Failed to save draft:", error);
    }
  };

  const loadDraft = async () => {
    try {
      const draftJson = await AsyncStorage.getItem(DRAFT_KEY);
      if (draftJson) {
        const draft = JSON.parse(draftJson);
        return draft;
      }
    } catch (error) {
      console.error("Failed to load draft:", error);
    }
    return null;
  };

  const clearDraft = async () => {
    try {
      await AsyncStorage.removeItem(DRAFT_KEY);
    } catch (error) {
      console.error("Failed to clear draft:", error);
    }
  };

  // Restore draft on mount
  useEffect(() => {
    const restoreDraft = async () => {
      const draft = await loadDraft();
      if (draft && !formData.title && examSessions.length > 0) {
        Alert.alert(
          'Restore Draft?',
          `You have an unsaved incident report from ${new Date(draft.timestamp).toLocaleString()}`,
          [
            { 
              text: 'Discard', 
              style: 'destructive',
              onPress: () => clearDraft() 
            },
            { 
              text: 'Restore', 
              onPress: () => {
                setFormData(draft.formData);
                if (draft.attachments) setAttachments(draft.attachments);
                if (draft.studentIndexNumber) setStudentIndexNumber(draft.studentIndexNumber);
                if (draft.manualStudentInfo) {
                  setShowManualStudentFields(true);
                  setManualStudentInfo(draft.manualStudentInfo);
                }
                // Find and set session
                if (draft.selectedSessionId) {
                  const session = examSessions.find(s => s.id === draft.selectedSessionId);
                  if (session) setSelectedSession(session);
                }
              }
            }
          ]
        );
      }
    };
    restoreDraft();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examSessions]);

  // Submit incident
  const handleSubmit = async () => {
    // Validation
    if (!formData.title.trim()) {
      setErrorDialog({
        visible: true,
        title: "Validation Error",
        message: "Please enter an incident title."
      });
      return;
    }
    if (!formData.description.trim()) {
      setErrorDialog({
        visible: true,
        title: "Validation Error",
        message: "Please enter a description."
      });
      return;
    }

    // Validate student info for student-related incidents
    if (showStudentField) {
      if (!selectedStudent && !showManualStudentFields) {
        setErrorDialog({
          visible: true,
          title: "Validation Error",
          message: "Please enter student information or search for a student."
        });
        return;
      }

      if (showManualStudentFields) {
        if (!manualStudentInfo.indexNumber.trim() || !manualStudentInfo.fullName.trim() || !manualStudentInfo.program.trim()) {
          setErrorDialog({
            visible: true,
            title: "Validation Error",
            message: "Please complete all student information fields."
          });
          return;
        }
      }
    }

    try {
      setLoading(true);

      // Prepare incident data
      const incidentData: any = {
        type: formData.type,
        // Severity auto-determined by backend
        title: formData.title.trim(),
        description: formData.description.trim(),
        location: formData.location.trim() || undefined,
        isConfidential: formData.isConfidential,
        examSessionId: selectedSession?.id,
      };

      // Add student info
      if (showStudentField) {
        if (selectedStudent?.id) {
          incidentData.studentId = selectedStudent.id;
        } else if (showManualStudentFields) {
          incidentData.manualStudentInfo = {
            indexNumber: manualStudentInfo.indexNumber.trim(),
            fullName: manualStudentInfo.fullName.trim(),
            program: manualStudentInfo.program.trim(),
          };
        }
      }

      const response = await createIncident(incidentData);
      const incidentId = response.incident.id;

      // Upload attachments if any
      if (attachments.length > 0) {
        const formDataObj = new FormData();
        attachments.forEach((file) => {
          formDataObj.append("files", {
            uri: file.uri,
            name: file.name,
            type: file.type,
          } as any);
        });

        await uploadAttachments(incidentId, formDataObj);
      }

      // Clear draft
      await clearDraft();

      setSuccessDialog({
        visible: true,
        incidentId: incidentId,
        message: "Incident reported successfully"
      });
    } catch (error: any) {
      setErrorDialog({
        visible: true,
        title: "Submission Error",
        message: error.response?.data?.error || "Failed to report incident. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top"]}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <View className="px-4 pt-6 pb-4 flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <View>
              <Text
                className="text-2xl font-bold"
                style={{ color: colors.foreground }}
              >
                Report Incident
              </Text>
              <Text
                className="text-sm"
                style={{ color: colors.foregroundMuted }}
              >
                Fill in the details below
              </Text>
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: Spacing[4], gap: Spacing[4] }}>
          {/* Exam Session Selection */}
          <Card>
            <View style={{ padding: Spacing[4] }}>
              <Text
                style={[
                  { color: colors.foreground, marginBottom: Spacing[3] },
                  {
                    fontSize: Typography.fontSize.sm,
                    fontWeight: Typography.fontWeight.semibold,
                  },
                ]}
              >
                Exam Session (Optional)
              </Text>
              
              <TouchableOpacity
                onPress={() => setSessionPickerVisible(true)}
                style={{
                  padding: Spacing[3],
                  borderRadius: BorderRadius.md,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View style={{ flex: 1 }}>
                  {selectedSession ? (
                    <>
                      <Text style={{ color: colors.foreground, fontWeight: "600" }}>
                        {selectedSession.courseName}
                      </Text>
                      <Text style={{ color: colors.foregroundMuted, fontSize: Typography.fontSize.sm }}>
                        {selectedSession.courseCode} • {selectedSession.venue}
                      </Text>
                    </>
                  ) : (
                    <Text style={{ color: colors.foregroundMuted }}>
                      Select exam session for context-aware lookup
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-down" size={20} color={colors.foregroundMuted} />
              </TouchableOpacity>

              {selectedSession && (
                <TouchableOpacity
                  onPress={() => setSelectedSession(null)}
                  style={{
                    marginTop: Spacing[2],
                    padding: Spacing[2],
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: colors.error, fontSize: Typography.fontSize.sm }}>
                    Clear Selection
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </Card>

          {/* Type Selection */}
          <Card>
            <View style={{ padding: Spacing[4] }}>
              <Text
                style={[
                  { color: colors.foreground, marginBottom: Spacing[3] },
                  {
                    fontSize: Typography.fontSize.sm,
                    fontWeight: Typography.fontWeight.semibold,
                  },
                ]}
              >
                Incident Type *
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: "row", gap: Spacing[2] }}>
                  {(
                    [
                      "MISSING_SCRIPT",
                      "DAMAGED_SCRIPT",
                      "MALPRACTICE",
                      "STUDENT_ILLNESS",
                      "VENUE_ISSUE",
                      "COUNT_DISCREPANCY",
                      "LATE_SUBMISSION",
                      "OTHER",
                    ] as IncidentType[]
                  ).map((type) => (
                    <TouchableOpacity
                      key={type}
                      onPress={() => handleTypeChange(type)}
                      style={{
                        paddingHorizontal: Spacing[3],
                        paddingVertical: Spacing[2],
                        borderRadius: BorderRadius.md,
                        borderWidth: 1,
                        borderColor:
                          formData.type === type
                            ? colors.primary
                            : colors.border,
                        backgroundColor:
                          formData.type === type
                            ? colors.primary
                            : colors.muted,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: Typography.fontSize.sm,
                          fontWeight: Typography.fontWeight.medium,
                          color:
                            formData.type === type
                              ? "white"
                              : colors.foreground,
                        }}
                      >
                        {getIncidentTypeLabel(type)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </Card>

          {/* Auto-Determined Severity Display */}
          <Card>
            <View style={{ padding: Spacing[4] }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View>
                  <Text
                    style={[
                      { color: colors.foreground, marginBottom: Spacing[1] },
                      {
                        fontSize: Typography.fontSize.sm,
                        fontWeight: Typography.fontWeight.semibold,
                      },
                    ]}
                  >
                    Severity Level
                  </Text>
                  <Text style={{ color: colors.foregroundMuted, fontSize: Typography.fontSize.xs }}>
                    Auto-determined from incident type
                  </Text>
                </View>
                <Badge
                  variant={
                    currentSeverity === "CRITICAL"
                      ? "error"
                      : currentSeverity === "HIGH"
                        ? "warning"
                        : currentSeverity === "MEDIUM"
                          ? "default"
                          : "secondary"
                  }
                >
                  {currentSeverity}
                </Badge>
              </View>
            </View>
          </Card>

          {/* Student Information - Only shown for student-related incidents */}
          {showStudentField && (
            <Card>
              <View style={{ padding: Spacing[4] }}>
                <Text
                  style={[
                    { color: colors.foreground, marginBottom: Spacing[3] },
                    {
                      fontSize: Typography.fontSize.sm,
                      fontWeight: Typography.fontWeight.semibold,
                    },
                  ]}
                >
                  Student Information *
                </Text>

                <View style={{ gap: Spacing[3] }}>
                  <View>
                    <Text
                      style={[
                        { color: colors.foreground, marginBottom: Spacing[2] },
                        {
                          fontSize: Typography.fontSize.sm,
                          fontWeight: Typography.fontWeight.medium,
                        },
                      ]}
                    >
                      Student Index Number
                    </Text>
                    <View style={{ position: "relative" }}>
                      <TextInput
                        style={{
                          borderWidth: 1,
                          borderColor: colors.border,
                          borderRadius: BorderRadius.md,
                          padding: Spacing[3],
                          fontSize: Typography.fontSize.base,
                          color: colors.foreground,
                          backgroundColor: colors.background,
                        }}
                        placeholder={selectedSession ? "Search in session students first..." : "Enter student index number"}
                        value={studentIndexNumber}
                        onChangeText={handleStudentIndexNumberChange}
                        autoCapitalize="characters"
                        autoCorrect={false}
                      />
                      {studentLookupLoading && (
                        <View
                          style={{
                            position: "absolute",
                            right: Spacing[3],
                            top: "50%",
                            transform: [{ translateY: -8 }],
                          }}
                        >
                          <ActivityIndicator
                            size="small"
                            color={colors.primary}
                          />
                        </View>
                      )}
                    </View>
                    {selectedSession && (
                      <Text style={{ fontSize: Typography.fontSize.xs, color: colors.info, marginTop: Spacing[1] }}>
                        💡 Searching in {selectedSession.courseName} students first
                      </Text>
                    )}
                  </View>

                  {/* Found Student Display */}
                  {selectedStudent && (
                    <View
                      style={{
                        padding: Spacing[3],
                        backgroundColor: colors.success + "20",
                        borderRadius: BorderRadius.md,
                        borderWidth: 1,
                        borderColor: colors.success,
                      }}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: Spacing[2] }}>
                        <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                        <Text
                          style={[
                            {
                              color: colors.foreground,
                              marginLeft: Spacing[2],
                            },
                            {
                              fontSize: Typography.fontSize.sm,
                              fontWeight: Typography.fontWeight.semibold,
                            },
                          ]}
                        >
                          Student Found
                        </Text>
                      </View>
                      
                      {/* Student Info with Profile Picture */}
                      <View style={{ flexDirection: "row", gap: Spacing[3], alignItems: "center" }}>
                        {/* Profile Picture */}
                        <View
                          style={{
                            width: 60,
                            height: 60,
                            borderRadius: BorderRadius.md,
                            backgroundColor: colors.background,
                            overflow: "hidden",
                            borderWidth: 2,
                            borderColor: colors.success,
                          }}
                        >
                          {selectedStudent.profilePicture ? (() => {
                            const profileUrl = getFileUrl(selectedStudent.profilePicture);
                            return (
                              <Image
                                source={{ uri: profileUrl }}
                                style={{ width: "100%", height: "100%" }}
                                resizeMode="cover"
                                onError={(e) => console.error("Image load error:", e.nativeEvent.error, "URL:", profileUrl)}
                                onLoad={() => console.log("Image loaded successfully:", profileUrl)}
                              />
                            );
                          })() : (
                            <View
                              style={{
                                width: "100%",
                                height: "100%",
                                justifyContent: "center",
                                alignItems: "center",
                              }}
                            >
                              <Ionicons
                                name="person"
                                size={32}
                                color={colors.foregroundMuted}
                              />
                            </View>
                          )}
                        </View>
                        
                        {/* Student Details */}
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              color: colors.foreground,
                              marginBottom: Spacing[1],
                              fontWeight: "600",
                              fontSize: Typography.fontSize.base,
                            }}
                          >
                            {selectedStudent.firstName} {selectedStudent.lastName}
                          </Text>
                          <Text
                            style={{
                              color: colors.foregroundMuted,
                              fontSize: Typography.fontSize.sm,
                              marginBottom: 2,
                            }}
                          >
                            {selectedStudent.indexNumber}
                          </Text>
                          <Text
                            style={{
                              color: colors.foregroundMuted,
                              fontSize: Typography.fontSize.sm,
                            }}
                          >
                            {selectedStudent.program}
                            {selectedStudent.level && ` • Level ${selectedStudent.level}`}
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Manual Student Info Fields */}
                  {showManualStudentFields && !selectedStudent && studentIndexNumber.trim().length >= 3 && (
                    <View
                      style={{
                        padding: Spacing[3],
                        backgroundColor: colors.warning + "20",
                        borderRadius: BorderRadius.md,
                        borderWidth: 1,
                        borderColor: colors.warning,
                        gap: Spacing[3],
                      }}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Ionicons name="alert-circle" size={20} color={colors.warning} />
                        <Text
                          style={{
                            color: colors.foreground,
                            marginLeft: Spacing[2],
                            fontSize: Typography.fontSize.sm,
                            fontWeight: "600",
                          }}
                        >
                          Student Not Found - Enter Details Manually
                        </Text>
                      </View>
                      
                      <View>
                        <Text style={{ color: colors.foreground, marginBottom: Spacing[1], fontSize: Typography.fontSize.sm }}>
                          Index Number *
                        </Text>
                        <TextInput
                          style={{
                            borderWidth: 1,
                            borderColor: colors.border,
                            borderRadius: BorderRadius.md,
                            padding: Spacing[2],
                            fontSize: Typography.fontSize.base,
                            color: colors.foreground,
                            backgroundColor: colors.background,
                          }}
                          value={manualStudentInfo.indexNumber}
                          onChangeText={(value) =>
                            setManualStudentInfo((prev) => ({
                              ...prev,
                              indexNumber: value,
                            }))
                          }
                          autoCapitalize="characters"
                        />
                      </View>

                      <View>
                        <Text style={{ color: colors.foreground, marginBottom: Spacing[1], fontSize: Typography.fontSize.sm }}>
                          Full Name *
                        </Text>
                        <TextInput
                          style={{
                            borderWidth: 1,
                            borderColor: colors.border,
                            borderRadius: BorderRadius.md,
                            padding: Spacing[2],
                            fontSize: Typography.fontSize.base,
                            color: colors.foreground,
                            backgroundColor: colors.background,
                          }}
                          placeholder="First and Last Name"
                          value={manualStudentInfo.fullName}
                          onChangeText={(value) =>
                            setManualStudentInfo((prev) => ({
                              ...prev,
                              fullName: value,
                            }))
                          }
                          autoCapitalize="words"
                        />
                      </View>

                      <View>
                        <Text style={{ color: colors.foreground, marginBottom: Spacing[1], fontSize: Typography.fontSize.sm }}>
                          Program *
                        </Text>
                        <TextInput
                          style={{
                            borderWidth: 1,
                            borderColor: colors.border,
                            borderRadius: BorderRadius.md,
                            padding: Spacing[2],
                            fontSize: Typography.fontSize.base,
                            color: colors.foreground,
                            backgroundColor: colors.background,
                          }}
                          placeholder="e.g., Computer Science"
                          value={manualStudentInfo.program}
                          onChangeText={(value) =>
                            setManualStudentInfo((prev) => ({
                              ...prev,
                              program: value,
                            }))
                          }
                          autoCapitalize="words"
                        />
                      </View>
                    </View>
                  )}
                </View>
              </View>
            </Card>
          )}

           {/* Title with Smart Suggestions */}
                   <View style={{ position: "relative" }}>
                     <Card>
                       <View style={{ padding: Spacing[4] }}>
                         <Text
                           style={[
                             { color: colors.foreground, marginBottom: Spacing[2] },
                             {
                               fontSize: Typography.fontSize.sm,
                               fontWeight: Typography.fontWeight.semibold,
                             },
                           ]}
                         >
                           Title *
                         </Text>
                         <TextInput
                           style={{
                             padding: Spacing[3],
                             borderRadius: BorderRadius.md,
                             fontSize: Typography.fontSize.base,
                             backgroundColor: colors.background,
                             color: colors.foreground,
                             borderWidth: 1,
                             borderColor: colors.border,
                           }}
                           placeholder="Start typing for suggestions..."
                           placeholderTextColor={colors.foregroundMuted}
                           value={formData.title}
                           onChangeText={handleTitleChange}
                           onFocus={() => {
                             // Show suggestions based on current title or show default suggestions for the incident type
                             if (formData.title.trim().length > 0) {
                               // Search across all types when user has typed something
                               const allSuggestions = searchIncidentTemplates(
                                 formData.title
                               );
                               const typeSuggestions = searchIncidentTemplates(
                                 formData.title,
                                 formData.type
                               );
                               const combinedSuggestions = [
                                 ...typeSuggestions,
                                 ...allSuggestions.filter(
                                   (s) => !typeSuggestions.find((ts) => ts.id === s.id)
                                 ),
                               ];
                               setTitleSuggestions(combinedSuggestions.slice(0, 5));
                               setShowSuggestions(combinedSuggestions.length > 0);
                             } else {
                               // Show top templates for the selected incident type when field is focused
                               const typeTemplates = getTemplatesForType(formData.type);
                               const defaultSuggestions = typeTemplates.slice(0, 3); // Show top 3 templates
                               setTitleSuggestions(defaultSuggestions);
                               setShowSuggestions(defaultSuggestions.length > 0);
                             }
                           }}
                         />
                       </View>
                     </Card>
         
                     {/* Smart Suggestions - positioned outside the Card to avoid overflow:hidden clipping */}
                     {showSuggestions && titleSuggestions.length > 0 && (
                       <Card
                         style={{
                           position: "absolute",
                           top: "100%",
                           left: Spacing[4],
                           right: Spacing[4],
                           zIndex: 9999,
                           marginTop: Spacing[1],
                           maxHeight: 200,
                         }}
                       >
                         <ScrollView
                           showsVerticalScrollIndicator={false}
                           keyboardShouldPersistTaps="always"
                           nestedScrollEnabled={true}
                           scrollEnabled={true}
                           bounces={false}
                           contentContainerStyle={{ paddingVertical: Spacing[2] }}
                         >
                           {titleSuggestions.map((template) => (
                             <Pressable
                               key={template.id}
                               onPress={() => {
                                 console.log("Pressable pressed!", template.title);
                                 selectTemplate(template);
                               }}
                               style={({ pressed }) => [
                                 {
                                   padding: Spacing[3],
                                   borderBottomWidth: 1,
                                   borderBottomColor: colors.border,
                                   backgroundColor: pressed ? colors.muted : "transparent",
                                 },
                               ]}
                             >
                               <Text
                                 style={{
                                   fontSize: Typography.fontSize.sm,
                                   fontWeight: Typography.fontWeight.medium,
                                   color: colors.foreground,
                                   marginBottom: Spacing[1],
                                 }}
                                 numberOfLines={1}
                               >
                                 {template.title}
                               </Text>
                               <Text
                                 style={{
                                   fontSize: Typography.fontSize.xs,
                                   color: colors.foregroundMuted,
                                 }}
                                 numberOfLines={2}
                               >
                                 {template.description}
                               </Text>
                               <View
                                 style={{
                                   flexDirection: "row",
                                   alignItems: "center",
                                   marginTop: Spacing[1],
                                 }}
                               >
                                 <Badge
                                   variant={
                                     template.severity === "CRITICAL"
                                       ? "error"
                                       : template.severity === "HIGH"
                                         ? "warning"
                                         : template.severity === "MEDIUM"
                                           ? "default"
                                           : "secondary"
                                   }
                                   style={{ marginRight: Spacing[2] }}
                                 >
                                   {template.severity}
                                 </Badge>
                               </View>
                             </Pressable>
                           ))}
                         </ScrollView>
                       </Card>
                     )}
                   </View>
         
                   {/* Help text for smart suggestions */}
                   <View style={{ marginBottom: Spacing[2] }}>
                     <Text
                       style={{
                         fontSize: Typography.fontSize.xs,
                         color: colors.foregroundMuted,
                         textAlign: "center",
                       }}
                     >
                       💡 Type to see smart suggestions
                     </Text>
                   </View>
         
                   {/* Description */}
                   <Card>
                     <View style={{ padding: Spacing[4] }}>
                       <Text
                         style={[
                           { color: colors.foreground, marginBottom: Spacing[2] },
                           {
                             fontSize: Typography.fontSize.sm,
                             fontWeight: Typography.fontWeight.semibold,
                           },
                         ]}
                       >
                         Description *
                       </Text>
                       <TextInput
                         style={{
                           padding: Spacing[3],
                           borderRadius: BorderRadius.md,
                           fontSize: Typography.fontSize.base,
                           backgroundColor: colors.background,
                           color: colors.foreground,
                           borderWidth: 1,
                           borderColor: colors.border,
                           minHeight: 120,
                           textAlignVertical: "top",
                         }}
                         placeholder="Detailed description of what happened..."
                         placeholderTextColor={colors.foregroundMuted}
                         value={formData.description}
                         onChangeText={(value) => handleChange("description", value)}
                         multiline
                         numberOfLines={5}
                       />
                     </View>
                   </Card>
         
                   {/* Location */}
                   <Card>
                     <View style={{ padding: Spacing[4] }}>
                       <View
                         style={{
                           flexDirection: "row",
                           alignItems: "center",
                           justifyContent: "space-between",
                           marginBottom: Spacing[2],
                         }}
                       >
                         <Text
                           style={[
                             { color: colors.foreground },
                             {
                               fontSize: Typography.fontSize.sm,
                               fontWeight: Typography.fontWeight.semibold,
                             },
                           ]}
                         >
                           Location
                         </Text>
                         <View style={{ flexDirection: "row", gap: Spacing[2] }}>
                           {currentSession?.venue && (
                             <TouchableOpacity
                               onPress={populateLocationFromSession}
                               style={{
                                 flexDirection: "row",
                                 alignItems: "center",
                                 gap: Spacing[1],
                                 paddingHorizontal: Spacing[2],
                                 paddingVertical: Spacing[1],
                                 borderRadius: BorderRadius.sm,
                                 backgroundColor: colors.info,
                               }}
                             >
                               <Ionicons name="school" size={14} color="white" />
                               <Text
                                 style={{
                                   fontSize: Typography.fontSize.xs,
                                   fontWeight: Typography.fontWeight.medium,
                                   color: "white",
                                 }}
                               >
                                 Use Venue
                               </Text>
                             </TouchableOpacity>
                           )}
                           <TouchableOpacity
                             onPress={getCurrentLocation}
                             disabled={fetchingLocation}
                             style={{
                               flexDirection: "row",
                               alignItems: "center",
                               gap: Spacing[1],
                               paddingHorizontal: Spacing[2],
                               paddingVertical: Spacing[1],
                               borderRadius: BorderRadius.sm,
                               backgroundColor: colors.primary,
                             }}
                           >
                             {fetchingLocation ? (
                               <ActivityIndicator size="small" color="white" />
                             ) : (
                               <>
                                 <Ionicons name="location" size={14} color="white" />
                                 <Text
                                   style={{
                                     fontSize: Typography.fontSize.xs,
                                     fontWeight: Typography.fontWeight.medium,
                                     color: "white",
                                   }}
                                 >
                                   Use Current
                                 </Text>
                               </>
                             )}
                           </TouchableOpacity>
                         </View>
                       </View>
                       <TextInput
                         style={{
                           padding: Spacing[3],
                           borderRadius: BorderRadius.md,
                           fontSize: Typography.fontSize.base,
                           backgroundColor: colors.background,
                           color: colors.foreground,
                           borderWidth: 1,
                           borderColor: colors.border,
                         }}
                         placeholder="Where did this occur?"
                         placeholderTextColor={colors.foregroundMuted}
                         value={formData.location}
                         onChangeText={(value) => handleChange("location", value)}
                       />
                     </View>
                   </Card>
         
                   {/* Confidential Toggle */}
                   <Card>
                     <TouchableOpacity
                       onPress={() =>
                         handleChange("isConfidential", !formData.isConfidential)
                       }
                       style={{
                         padding: Spacing[4],
                         flexDirection: "row",
                         alignItems: "center",
                         justifyContent: "space-between",
                       }}
                     >
                       <View style={{ flex: 1, marginRight: Spacing[3] }}>
                         <Text
                           style={[
                             { color: colors.foreground, marginBottom: Spacing[1] },
                             {
                               fontSize: Typography.fontSize.sm,
                               fontWeight: Typography.fontWeight.semibold,
                             },
                           ]}
                         >
                           Mark as Confidential
                         </Text>
                         <Text
                           style={[
                             { color: colors.foregroundMuted },
                             { fontSize: Typography.fontSize.xs },
                           ]}
                         >
                           Restrict access to authorized personnel only
                         </Text>
                       </View>
                       <View
                         style={{
                           width: Spacing[12],
                           height: Spacing[7],
                           borderRadius: BorderRadius.full,
                           padding: Spacing[1],
                           backgroundColor: formData.isConfidential
                             ? colors.primary
                             : colors.muted,
                         }}
                       >
                         <View
                           style={{
                             width: Spacing[5],
                             height: Spacing[5],
                             borderRadius: BorderRadius.full,
                             backgroundColor: "white",
                             marginLeft: formData.isConfidential ? "auto" : 0,
                           }}
                         />
                       </View>
                     </TouchableOpacity>
                   </Card>
         
                   {/* Attachments */}
                   <Card>
                     <View style={{ padding: Spacing[4] }}>
                       <Text
                         style={[
                           { color: colors.foreground, marginBottom: Spacing[3] },
                           {
                             fontSize: Typography.fontSize.sm,
                             fontWeight: Typography.fontWeight.semibold,
                           },
                         ]}
                       >
                         Attachments ({attachments.length}/5)
                       </Text>
         
                       {/* Attachment Actions */}
                       <View
                         style={{
                           flexDirection: "row",
                           gap: Spacing[2],
                           marginBottom: Spacing[3],
                         }}
                       >
                         <Button
                           variant="outline"
                           size="sm"
                           onPress={takePhoto}
                           disabled={attachments.length >= 5}
                           style={{ flex: 1 }}
                         >
                           <View
                             style={{
                               flexDirection: "row",
                               alignItems: "center",
                               gap: Spacing[2],
                             }}
                           >
                             <Ionicons
                               name="camera-outline"
                               size={18}
                               color={colors.foreground}
                             />
                             <Text style={{ color: colors.foreground }}>Camera</Text>
                           </View>
                         </Button>
                         <Button
                           variant="outline"
                           size="sm"
                           onPress={pickImage}
                           disabled={attachments.length >= 5}
                           style={{ flex: 1 }}
                         >
                           <View
                             style={{
                               flexDirection: "row",
                               alignItems: "center",
                               gap: Spacing[2],
                             }}
                           >
                             <Ionicons
                               name="images-outline"
                               size={18}
                               color={colors.foreground}
                             />
                             <Text style={{ color: colors.foreground }}>Gallery</Text>
                           </View>
                         </Button>
                         <Button
                           variant="outline"
                           size="sm"
                           onPress={pickDocument}
                           disabled={attachments.length >= 5}
                           style={{ flex: 1 }}
                         >
                           <View
                             style={{
                               flexDirection: "row",
                               alignItems: "center",
                               gap: Spacing[2],
                             }}
                           >
                             <Ionicons
                               name="document-outline"
                               size={18}
                               color={colors.foreground}
                             />
                             <Text style={{ color: colors.foreground }}>Files</Text>
                           </View>
                         </Button>
                       </View>
         
                       {/* Attachment List with Thumbnails */}
                       {attachments.map((file, index) => (
                         <TouchableOpacity
                           key={index}
                           onPress={() => previewAttachment(file)}
                           activeOpacity={0.7}
                           style={{
                             flexDirection: "row",
                             alignItems: "center",
                             justifyContent: "space-between",
                             padding: Spacing[3],
                             marginBottom: Spacing[2],
                             borderRadius: BorderRadius.md,
                             backgroundColor: colors.muted,
                           }}
                         >
                           <View
                             style={{
                               flexDirection: "row",
                               alignItems: "center",
                               gap: Spacing[2],
                               flex: 1,
                             }}
                           >
                             {/* Thumbnail or Icon */}
                             {file.type.startsWith("image/") ? (
                               <Image
                                 source={{ uri: file.uri }}
                                 style={{
                                   width: 40,
                                   height: 40,
                                   borderRadius: BorderRadius.sm,
                                   backgroundColor: colors.background,
                                 }}
                                 resizeMode="cover"
                               />
                             ) : (
                               <View
                                 style={{
                                   width: 40,
                                   height: 40,
                                   borderRadius: BorderRadius.sm,
                                   backgroundColor: colors.background,
                                   alignItems: "center",
                                   justifyContent: "center",
                                 }}
                               >
                                 <Ionicons
                                   name={
                                     file.type.startsWith("video/")
                                       ? "videocam-outline"
                                       : "document-outline"
                                   }
                                   size={24}
                                   color={colors.foreground}
                                 />
                               </View>
                             )}
                             <View style={{ flex: 1 }}>
                               <Text
                                 style={[
                                   { color: colors.foreground },
                                   { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium },
                                 ]}
                                 numberOfLines={1}
                               >
                                 {file.name}
                               </Text>
                               <Text
                                 style={{
                                   color: colors.foregroundMuted,
                                   fontSize: Typography.fontSize.xs,
                                   marginTop: 2,
                                 }}
                               >
                                 {file.type.split("/")[1]?.toUpperCase() || "FILE"}
                                 {file.size ? ` • ${(file.size / 1024 / 1024).toFixed(2)} MB` : ""}
                               </Text>
                             </View>
                           </View>
                           <TouchableOpacity 
                             onPress={(e) => {
                               e.stopPropagation();
                               removeAttachment(index);
                             }}
                             style={{ padding: Spacing[1] }}
                           >
                             <Ionicons
                               name="close-circle"
                               size={22}
                               color={colors.error}
                             />
                           </TouchableOpacity>
                         </TouchableOpacity>
                       ))}
         
                       {attachments.length === 0 && (
                         <View
                           style={{ paddingVertical: Spacing[8], alignItems: "center" }}
                         >
                           <Ionicons
                             name="cloud-upload-outline"
                             size={40}
                             color={colors.foregroundMuted}
                           />
                           <Text
                             style={[
                               { color: colors.foregroundMuted, marginTop: Spacing[2] },
                               { fontSize: Typography.fontSize.sm },
                             ]}
                           >
                             No attachments added
                           </Text>
                         </View>
                       )}
                     </View>
                   </Card>
         
                   {/* Submit Button */}
                   <Button
                     onPress={handleSubmit}
                     disabled={
                       loading || !formData.title.trim() || !formData.description.trim()
                     }
                     loading={loading}
                     style={{ marginTop: Spacing[2] }}
                   >
                     {loading ? "Submitting..." : "Submit Incident Report"}
                   </Button>
                 </View>
               </ScrollView>

               {/* Session Picker Modal */}
               <Modal
                 visible={sessionPickerVisible}
                 transparent={true}
                 animationType="slide"
                 onRequestClose={() => setSessionPickerVisible(false)}
               >
                 <View
                   style={{
                     flex: 1,
                     backgroundColor: "rgba(0, 0, 0, 0.5)",
                     justifyContent: "flex-end",
                   }}
                 >
                   <View
                     style={{
                       flex: 1,
                       backgroundColor: colors.background,
                       borderTopLeftRadius: BorderRadius.lg,
                       borderTopRightRadius: BorderRadius.lg,
                       paddingTop: Spacing[4],
                       paddingBottom: Spacing[8],
                       maxHeight: "70%",
                     }}
                   >
                     <View
                       style={{
                         flexDirection: "row",
                         alignItems: "center",
                         justifyContent: "space-between",
                         paddingHorizontal: Spacing[4],
                         paddingBottom: Spacing[4],
                         borderBottomWidth: 1,
                         borderBottomColor: colors.border,
                       }}
                     >
                       <Text
                         style={{
                           fontSize: Typography.fontSize.lg,
                           fontWeight: Typography.fontWeight.semibold,
                           color: colors.foreground,
                         }}
                       >
                         Select Exam Session
                       </Text>
                       <TouchableOpacity
                         onPress={() => setSessionPickerVisible(false)}
                         style={{ padding: Spacing[2] }}
                       >
                         <Ionicons name="close" size={24} color={colors.foreground} />
                       </TouchableOpacity>
                     </View>

                     <ScrollView
                       style={{ flex: 1, paddingHorizontal: Spacing[4] }}
                       contentContainerStyle={{ paddingTop: Spacing[4], gap: Spacing[3] }}
                     >
                       {examSessions.length === 0 ? (
                         <View style={{ paddingVertical: Spacing[8], alignItems: "center" }}>
                           <Text style={{ color: colors.foregroundMuted }}>
                             No exam sessions available
                           </Text>
                         </View>
                       ) : (
                         examSessions.map((session) => (
                           <TouchableOpacity
                             key={session.id}
                             onPress={() => {
                               setSelectedSession(session);
                               setSessionPickerVisible(false);
                             }}
                             style={{
                               padding: Spacing[4],
                               borderRadius: BorderRadius.md,
                               borderWidth: 1,
                               borderColor:
                                 selectedSession?.id === session.id
                                   ? colors.primary
                                   : colors.border,
                               backgroundColor:
                                 selectedSession?.id === session.id
                                   ? colors.primary + "20"
                                   : colors.muted,
                             }}
                           >
                             <Text
                               style={{
                                 fontSize: Typography.fontSize.base,
                                 fontWeight: Typography.fontWeight.semibold,
                                 color: colors.foreground,
                                 marginBottom: Spacing[1],
                               }}
                             >
                               {session.courseName}
                             </Text>
                             <Text
                               style={{
                                 fontSize: Typography.fontSize.sm,
                                 color: colors.foregroundMuted,
                                 marginBottom: Spacing[2],
                               }}
                             >
                               {session.courseCode} • {session.venue}
                             </Text>
                             <View style={{ flexDirection: "row", gap: Spacing[2] }}>
                               <Badge
                                 variant={
                                   session.status === "IN_PROGRESS"
                                     ? "default"
                                     : session.status === "COMPLETED"
                                       ? "secondary"
                                       : "secondary"
                                 }
                               >
                                 {session.status.replace("_", " ")}
                               </Badge>
                               <Text
                                 style={{
                                   fontSize: Typography.fontSize.xs,
                                   color: colors.foregroundMuted,
                                 }}
                               >
                                 {new Date(session.examDate).toLocaleDateString()}
                               </Text>
                             </View>
                           </TouchableOpacity>
                         ))
                       )}
                     </ScrollView>
                   </View>
                 </View>
               </Modal>

               {/* Preview Modal */}
               <Modal
                 visible={previewVisible}
                 transparent={true}
                 animationType="fade"
                 onRequestClose={closePreview}
               >
                 <View
                   style={{
                     flex: 1,
                     backgroundColor: "rgba(0, 0, 0, 0.9)",
                     justifyContent: "center",
                     alignItems: "center",
                   }}
                 >
                   <TouchableOpacity
                     onPress={closePreview}
                     style={{
                       position: "absolute",
                       top: 50,
                       right: 20,
                       zIndex: 10,
                       backgroundColor: "rgba(255, 255, 255, 0.2)",
                       borderRadius: BorderRadius.full,
                       padding: Spacing[2],
                     }}
                   >
                     <Ionicons name="close" size={28} color="white" />
                   </TouchableOpacity>

                   {previewFile && (
                     <View style={{ width: "100%", height: "100%", justifyContent: "center", alignItems: "center" }}>
                       {previewFile.type.startsWith("image/") ? (
                         <ScrollView
                           maximumZoomScale={3}
                           minimumZoomScale={1}
                           style={{ width: "100%", height: "100%" }}
                           contentContainerStyle={{ flexGrow: 1, justifyContent: "center", alignItems: "center", padding: Spacing[4] }}
                         >
                           <Image
                             source={{ uri: previewFile.uri }}
                             style={{
                               width: 350,
                               height: 500,
                             }}
                             resizeMode="contain"
                           />
                         </ScrollView>
                       ) : (
                         <View style={{ alignItems: "center", gap: Spacing[4] }}>
                           <Ionicons
                             name={
                               previewFile.type.startsWith("video/")
                                 ? "videocam"
                                 : "document-text"
                             }
                             size={80}
                             color="white"
                           />
                           <Text
                             style={{
                               color: "white",
                               fontSize: Typography.fontSize.lg,
                               fontWeight: Typography.fontWeight.semibold,
                               textAlign: "center",
                               paddingHorizontal: Spacing[4],
                             }}
                           >
                             {previewFile.name}
                           </Text>
                           <Text
                             style={{
                               color: "rgba(255, 255, 255, 0.7)",
                               fontSize: Typography.fontSize.sm,
                               textAlign: "center",
                             }}
                           >
                             {previewFile.type.startsWith("video/")
                               ? "Video preview not available"
                               : "Document preview not available"}
                           </Text>
                         </View>
                       )}
                     </View>
                   )}
                 </View>
               </Modal>

               {/* Error Dialog */}
               <Dialog
                 visible={errorDialog.visible}
                 onClose={() => setErrorDialog({ visible: false, title: "", message: "" })}
                 title={errorDialog.title}
                 message={errorDialog.message}
                 variant="error"
                 primaryAction={{
                   label: "OK",
                   onPress: () => setErrorDialog({ visible: false, title: "", message: "" })
                 }}
               />

               {/* Success Dialog */}
               <Dialog
                 visible={successDialog.visible}
                 onClose={() => setSuccessDialog({ visible: false, incidentId: "", message: "" })}
                 title="Success"
                 message={successDialog.message}
                 variant="success"
                 primaryAction={{
                   label: "View Incident",
                   onPress: () => {
                     router.replace(`/incident-details?id=${successDialog.incidentId}` as any);
                   }
                 }}
                 secondaryAction={{
                   label: "Close",
                   onPress: () => {
                     router.back();
                   }
                 }}
               />
             </SafeAreaView>
           );
         }