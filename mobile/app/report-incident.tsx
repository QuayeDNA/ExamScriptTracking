/**
 * Report Incident Screen
 * Form to create new incidents with camera and file attachment support
 */

import { useState } from "react";
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
import { useThemeColors } from "@/constants/design-system";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  createIncident,
  uploadAttachments,
  type IncidentType,
  type IncidentSeverity,
  getIncidentTypeLabel,
} from "@/api/incidents";

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

        <View className="px-4 gap-4">
          {/* Type Selection */}
          <Card>
            <View className="p-4">
              <Text
                className="text-sm font-semibold mb-3"
                style={{ color: colors.foreground }}
              >
                Incident Type *
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
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
                      onPress={() => handleChange("type", type)}
                      className={`px-4 py-2 rounded-lg ${formData.type === type ? "bg-primary" : "bg-muted"}`}
                      style={{
                        borderWidth: 1,
                        borderColor:
                          formData.type === type
                            ? colors.primary
                            : colors.border,
                      }}
                    >
                      <Text
                        className="text-sm font-medium"
                        style={{
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
            <View className="p-4">
              <Text
                className="text-sm font-semibold mb-3"
                style={{ color: colors.foreground }}
              >
                Severity Level *
              </Text>
              <View className="flex-row gap-2">
                {(
                  ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as IncidentSeverity[]
                ).map((severity) => (
                  <TouchableOpacity
                    key={severity}
                    onPress={() => handleChange("severity", severity)}
                    className={`flex-1 py-3 rounded-lg items-center ${formData.severity === severity ? "bg-primary" : "bg-muted"}`}
                    style={{
                      borderWidth: 1,
                      borderColor:
                        formData.severity === severity
                          ? colors.primary
                          : colors.border,
                    }}
                  >
                    <Text
                      className="text-sm font-medium"
                      style={{
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

          {/* Title */}
          <Card>
            <View className="p-4">
              <Text
                className="text-sm font-semibold mb-2"
                style={{ color: colors.foreground }}
              >
                Title *
              </Text>
              <TextInput
                className="p-3 rounded-lg text-base"
                placeholder="Brief description of the incident"
                placeholderTextColor={colors.foregroundMuted}
                value={formData.title}
                onChangeText={(value) => handleChange("title", value)}
                style={{
                  backgroundColor: colors.background,
                  color: colors.foreground,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              />
            </View>
          </Card>

          {/* Description */}
          <Card>
            <View className="p-4">
              <Text
                className="text-sm font-semibold mb-2"
                style={{ color: colors.foreground }}
              >
                Description *
              </Text>
              <TextInput
                className="p-3 rounded-lg text-base"
                placeholder="Detailed description of what happened..."
                placeholderTextColor={colors.foregroundMuted}
                value={formData.description}
                onChangeText={(value) => handleChange("description", value)}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                style={{
                  backgroundColor: colors.background,
                  color: colors.foreground,
                  borderWidth: 1,
                  borderColor: colors.border,
                  minHeight: 120,
                }}
              />
            </View>
          </Card>

          {/* Location */}
          <Card>
            <View className="p-4">
              <View className="flex-row items-center justify-between mb-2">
                <Text
                  className="text-sm font-semibold"
                  style={{ color: colors.foreground }}
                >
                  Location
                </Text>
                <TouchableOpacity
                  onPress={getCurrentLocation}
                  disabled={fetchingLocation}
                  className="flex-row items-center gap-1"
                >
                  {fetchingLocation ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <>
                      <Ionicons
                        name="location"
                        size={16}
                        color={colors.primary}
                      />
                      <Text
                        className="text-sm font-medium"
                        style={{ color: colors.primary }}
                      >
                        Use Current
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
              <TextInput
                className="p-3 rounded-lg text-base"
                placeholder="Where did this occur?"
                placeholderTextColor={colors.foregroundMuted}
                value={formData.location}
                onChangeText={(value) => handleChange("location", value)}
                style={{
                  backgroundColor: colors.background,
                  color: colors.foreground,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              />
            </View>
          </Card>

          {/* Confidential Toggle */}
          <Card>
            <TouchableOpacity
              onPress={() =>
                handleChange("isConfidential", !formData.isConfidential)
              }
              className="p-4 flex-row items-center justify-between"
            >
              <View className="flex-1 mr-3">
                <Text
                  className="text-sm font-semibold mb-1"
                  style={{ color: colors.foreground }}
                >
                  Mark as Confidential
                </Text>
                <Text
                  className="text-xs"
                  style={{ color: colors.foregroundMuted }}
                >
                  Restrict access to authorized personnel only
                </Text>
              </View>
              <View
                className={`w-12 h-7 rounded-full p-1 ${formData.isConfidential ? "bg-primary" : "bg-muted"}`}
              >
                <View
                  className={`w-5 h-5 rounded-full bg-white ${formData.isConfidential ? "ml-auto" : ""}`}
                />
              </View>
            </TouchableOpacity>
          </Card>

          {/* Attachments */}
          <Card>
            <View className="p-4">
              <Text
                className="text-sm font-semibold mb-3"
                style={{ color: colors.foreground }}
              >
                Attachments ({attachments.length}/5)
              </Text>

              {/* Attachment Actions */}
              <View className="flex-row gap-2 mb-3">
                <Button
                  variant="outline"
                  size="sm"
                  onPress={takePhoto}
                  disabled={attachments.length >= 5}
                  className="flex-1"
                >
                  <View className="flex-row items-center gap-2">
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
                  className="flex-1"
                >
                  <View className="flex-row items-center gap-2">
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
                  className="flex-1"
                >
                  <View className="flex-row items-center gap-2">
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
                  className="flex-row items-center justify-between p-3 mb-2 rounded-lg"
                  style={{ backgroundColor: colors.muted }}
                >
                  <View className="flex-row items-center gap-2 flex-1">
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
                      className="text-sm flex-1"
                      style={{ color: colors.foreground }}
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
                <View className="py-8 items-center">
                  <Ionicons
                    name="cloud-upload-outline"
                    size={40}
                    color={colors.foregroundMuted}
                  />
                  <Text
                    className="text-sm mt-2"
                    style={{ color: colors.foregroundMuted }}
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
            className="mt-2"
          >
            {loading ? "Submitting..." : "Submit Incident Report"}
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
