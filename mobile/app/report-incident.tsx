/**
 * Report Incident Screen
 * Form to create new incidents with camera and file attachment support
 */

import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
// import * as ImagePicker from "expo-image-picker"; // Temporarily commented out
import * as DocumentPicker from "expo-document-picker";
import * as Location from "expo-location";
import {
  useThemeColors,
  Spacing,
  Typography,
  BorderRadius,
} from "@/constants/design-system";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  createIncident,
  uploadAttachments,
  type IncidentType,
  type IncidentSeverity,
  getIncidentTypeLabel,
} from "@/api/incidents";
import { useSessionStore } from "@/store/session";
import {
  searchIncidentTemplates,
  getTemplatesForType,
  type IncidentTemplate,
} from "@/constants/incident-templates";

// Safe ImagePicker wrapper
let imagePicker: any = null;
try {
  const ImagePicker = require("expo-image-picker");
  imagePicker = ImagePicker;
} catch (_) {
  console.warn("ImagePicker not available, camera features disabled");
}

interface AttachmentFile {
  uri: string;
  name: string;
  type: string;
  size?: number;
}

export default function ReportIncidentScreen() {
  const colors = useThemeColors();
  const { currentSession, hasRecordedFirstAttendance } = useSessionStore();

  // Ref to track if a suggestion is being selected
  const selectingSuggestionRef = useRef(false);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<{
    type: IncidentType;
    severity: IncidentSeverity;
    title: string;
    description: string;
    location: string;
    isConfidential: boolean;
  }>({
    type: "OTHER",
    severity: "MEDIUM",
    title: "",
    description: "",
    location: "",
    isConfidential: false,
  });

  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [titleSuggestions, setTitleSuggestions] = useState<IncidentTemplate[]>(
    []
  );
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);

  // Auto-populate location when first attendance is recorded
  useEffect(() => {
    if (
      hasRecordedFirstAttendance &&
      currentSession?.venue &&
      !formData.location
    ) {
      handleChange("location", currentSession.venue);
    }
  }, [hasRecordedFirstAttendance, currentSession?.venue, formData.location]);

  // Handle form field change
  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Get current location
  const getCurrentLocation = async () => {
    try {
      setFetchingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permission is required to get your current location."
        );
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
      Alert.alert("Error", "Failed to get current location");
    } finally {
      setFetchingLocation(false);
    }
  };

  // Auto-populate location from current exam session
  const populateLocationFromSession = () => {
    if (currentSession?.venue && !formData.location) {
      handleChange("location", currentSession.venue);
    }
  };

  // Handle title input change with smart suggestions
  const handleTitleChange = (text: string) => {
    handleChange("title", text);

    if (text.trim().length > 0) {
      // Search across all incident types for better UX, but prioritize the selected type
      const allSuggestions = searchIncidentTemplates(text); // Search all types
      const typeSuggestions = searchIncidentTemplates(text, formData.type); // Search selected type

      // Combine results, prioritizing selected type first, then others
      const combinedSuggestions = [
        ...typeSuggestions,
        ...allSuggestions.filter(
          (s) => !typeSuggestions.find((ts) => ts.id === s.id)
        ),
      ];

      setTitleSuggestions(combinedSuggestions.slice(0, 5)); // Limit to 5 suggestions
      setShowSuggestions(combinedSuggestions.length > 0);
    } else {
      setTitleSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Select a template suggestion
  const selectTemplate = (template: IncidentTemplate) => {
    selectingSuggestionRef.current = true;

    // Update form data with individual state updates to ensure they take effect
    setFormData((prev) => {
      const newState = { ...prev, title: template.title };
      return newState;
    });
    setTimeout(() => {
      setFormData((prev) => {
        const newState = { ...prev, description: template.description };
        return newState;
      });
    }, 10);
    setTimeout(() => {
      setFormData((prev) => {
        const newState = { ...prev, severity: template.severity };
        return newState;
      });
      // Force a re-render to ensure TextInputs update
      setForceUpdate((prev) => prev + 1);
    }, 20);

    setTitleSuggestions([]);
    setShowSuggestions(false);
    // Reset the ref after a short delay
    setTimeout(() => {
      selectingSuggestionRef.current = false;
    }, 100);
  };

  // Handle incident type change - update suggestions
  const handleTypeChange = (type: IncidentType) => {
    handleChange("type", type);
    // Refresh suggestions if there's text in the title field
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
    } else {
      // Show default suggestions for the new type
      const typeTemplates = getTemplatesForType(type);
      const defaultSuggestions = typeTemplates.slice(0, 3);
      setTitleSuggestions(defaultSuggestions);
      setShowSuggestions(defaultSuggestions.length > 0);
    }
  };

  // Take photo with camera
  const takePhoto = async () => {
    if (!imagePicker) {
      Alert.alert("Error", "Camera not available");
      return;
    }

    try {
      const { status } = await imagePicker.requestCameraPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Camera permission is required to take photos."
        );
        return;
      }

      const result = await imagePicker.launchCameraAsync({
        mediaTypes: imagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setAttachments((prev) => [
          ...prev,
          {
            uri: asset.uri,
            name: `photo_${Date.now()}.jpg`,
            type: "image/jpeg",
            size: asset.fileSize,
          },
        ]);
      }
    } catch {
      Alert.alert("Error", "Failed to take photo");
    }
  };

  // Pick image from gallery
  const pickImage = async () => {
    if (!imagePicker) {
      Alert.alert("Error", "Image picker not available");
      return;
    }

    try {
      const result = await imagePicker.launchImageLibraryAsync({
        mediaTypes: imagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        const newAttachments = result.assets.map((asset: any) => ({
          uri: asset.uri,
          name: `image_${Date.now()}.jpg`,
          type: "image/jpeg",
          size: asset.fileSize,
        }));
        setAttachments((prev) => [...prev, ...newAttachments]);
      }
    } catch {
      Alert.alert("Error", "Failed to pick image");
    }
  };

  // Pick document
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*", "video/*"],
        multiple: true,
      });

      if (!result.canceled && result.assets) {
        const newAttachments = result.assets.map(
          (asset: DocumentPicker.DocumentPickerAsset) => ({
            uri: asset.uri,
            name: asset.name,
            type: asset.mimeType || "application/octet-stream",
            size: asset.size,
          })
        );
        setAttachments((prev) => [...prev, ...newAttachments]);
      }
    } catch {
      Alert.alert("Error", "Failed to pick document");
    }
  };

  // Remove attachment
  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit incident
  const handleSubmit = async () => {
    // Validation
    if (!formData.title.trim()) {
      Alert.alert("Validation Error", "Please enter an incident title");
      return;
    }
    if (!formData.description.trim()) {
      Alert.alert("Validation Error", "Please enter a description");
      return;
    }

    try {
      setLoading(true);

      // Create incident
      const response = await createIncident({
        type: formData.type,
        severity: formData.severity,
        title: formData.title.trim(),
        description: formData.description.trim(),
        location: formData.location.trim() || undefined,
        isConfidential: formData.isConfidential,
      });

      const incidentId = response.incident.id;

      // Upload attachments if any
      if (attachments.length > 0) {
        const formDataObj = new FormData();
        attachments.forEach((file, index) => {
          formDataObj.append("files", {
            uri: file.uri,
            name: file.name,
            type: file.type,
          } as any);
        });

        await uploadAttachments(incidentId, formDataObj);
      }

      Alert.alert("Success", "Incident reported successfully", [
        {
          text: "View Incident",
          onPress: () => {
            router.replace(`/incident-details?id=${incidentId}` as any);
          },
        },
        {
          text: "OK",
          onPress: () => {
            router.back();
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.error || "Failed to report incident"
      );
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

          {/* Severity Selection */}
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
                Severity Level *
              </Text>
              <View style={{ flexDirection: "row", gap: Spacing[2] }}>
                {(
                  ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as IncidentSeverity[]
                ).map((severity) => (
                  <TouchableOpacity
                    key={severity}
                    onPress={() => handleChange("severity", severity)}
                    style={{
                      flex: 1,
                      paddingVertical: Spacing[3],
                      borderRadius: BorderRadius.md,
                      alignItems: "center",
                      borderWidth: 1,
                      borderColor:
                        formData.severity === severity
                          ? colors.primary
                          : colors.border,
                      backgroundColor:
                        formData.severity === severity
                          ? colors.primary
                          : colors.muted,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: Typography.fontSize.sm,
                        fontWeight: Typography.fontWeight.medium,
                        color:
                          formData.severity === severity
                            ? "white"
                            : colors.foreground,
                      }}
                    >
                      {severity}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Card>

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
                  key={`title-${forceUpdate}`}
                  style={{
                    padding: Spacing[3],
                    borderRadius: BorderRadius.md,
                    fontSize: Typography.fontSize.base,
                    backgroundColor: colors.background,
                    color: colors.foreground,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                  placeholder="Start typing to see incident suggestions from all categories"
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
                  onBlur={() => {
                    // Delay hiding suggestions to allow selection, but don't hide if selecting a suggestion
                    setTimeout(() => {
                      if (!selectingSuggestionRef.current) {
                        setShowSuggestions(false);
                      }
                    }, 200);
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
                  keyboardShouldPersistTaps="handled"
                >
                  {titleSuggestions.map((template) => (
                    <TouchableOpacity
                      key={template.id}
                      onPress={() => selectTemplate(template)}
                      activeOpacity={0.7}
                      style={{
                        padding: Spacing[3],
                        borderBottomWidth: 1,
                        borderBottomColor: colors.border,
                      }}
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
                    </TouchableOpacity>
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
              💡 Start typing to see smart suggestions from all incident
              categories
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
                key={`description-${forceUpdate}`}
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

              {/* Attachment List */}
              {attachments.map((file, index) => (
                <View
                  key={index}
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
                    <Ionicons
                      name={
                        file.type.startsWith("image/")
                          ? "image-outline"
                          : file.type.startsWith("video/")
                            ? "videocam-outline"
                            : "document-outline"
                      }
                      size={20}
                      color={colors.foreground}
                    />
                    <Text
                      style={[
                        { color: colors.foreground, flex: 1 },
                        { fontSize: Typography.fontSize.sm },
                      ]}
                      numberOfLines={1}
                    >
                      {file.name}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => removeAttachment(index)}>
                    <Ionicons
                      name="close-circle"
                      size={22}
                      color={colors.error}
                    />
                  </TouchableOpacity>
                </View>
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
    </SafeAreaView>
  );
}
