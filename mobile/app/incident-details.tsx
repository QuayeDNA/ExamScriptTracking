/**
 * Incident Details Screen - REDESIGNED
 * Enhanced UI with better layout, proper icons, and improved attachment handling
 */

import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Modal,
  RefreshControl,
  Dimensions,
  Share,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
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
  getIncident,
  updateStatus,
  deleteIncident,
  type Incident,
  type IncidentStatus,
  getIncidentTypeLabel,
} from "@/api/incidents";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Status configuration with icons and colors
const STATUS_CONFIG = {
  REPORTED: {
    icon: "alert-circle-outline" as const,
    label: "Reported",
    color: "#3B82F6", // blue
  },
  INVESTIGATING: {
    icon: "search-outline" as const,
    label: "Investigating",
    color: "#F59E0B", // amber
  },
  RESOLVED: {
    icon: "checkmark-circle-outline" as const,
    label: "Resolved",
    color: "#10B981", // green
  },
  ESCALATED: {
    icon: "arrow-up-circle-outline" as const,
    label: "Escalated",
    color: "#DC2626", // red
  },
  CLOSED: {
    icon: "close-circle-outline" as const,
    label: "Closed",
    color: "#6B7280", // gray
  },
};

// Severity configuration
const SEVERITY_CONFIG = {
  CRITICAL: { color: "#EF4444", bgColor: "#FEE2E2", icon: "warning" as const },
  HIGH: { color: "#F97316", bgColor: "#FFEDD5", icon: "alert" as const },
  MEDIUM: { color: "#F59E0B", bgColor: "#FEF3C7", icon: "information-circle" as const },
  LOW: { color: "#10B981", bgColor: "#D1FAE5", icon: "checkmark-circle" as const },
};

export default function IncidentDetailsScreen() {
  const colors = useThemeColors();
  const params = useLocalSearchParams();
  const incidentId = params.id as string;

  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Modal states
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewType, setPreviewType] = useState("");
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  
  // Dialog states
  const [errorDialog, setErrorDialog] = useState({ visible: false, message: "" });
  const [successDialog, setSuccessDialog] = useState({ visible: false, message: "" });

  const loadIncident = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getIncident(incidentId);
      setIncident(response.incident);
    } catch (error: any) {
      setErrorDialog({
        visible: true,
        message: error.response?.data?.error || "Failed to load incident details",
      });
    } finally {
      setLoading(false);
    }
  }, [incidentId]);

  useEffect(() => {
    loadIncident();
  }, [loadIncident]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadIncident();
    setRefreshing(false);
  };

  const handleStatusChange = async (newStatus: IncidentStatus) => {
    try {
      setUpdating(true);
      setStatusModalVisible(false);
      await updateStatus(incidentId, { status: newStatus });
      await loadIncident();
      setSuccessDialog({
        visible: true,
        message: `Incident status updated to ${STATUS_CONFIG[newStatus].label}`,
      });
    } catch (error: any) {
      setErrorDialog({
        visible: true,
        message: error.response?.data?.error || "Failed to update status",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    try {
      setUpdating(true);
      setDeleteConfirmVisible(false);
      await deleteIncident(incidentId);
      setSuccessDialog({
        visible: true,
        message: "Incident deleted successfully",
      });
      setTimeout(() => router.back(), 1500);
    } catch (error: any) {
      setErrorDialog({
        visible: true,
        message: error.response?.data?.error || "Failed to delete incident",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleShare = async () => {
    if (!incident) return;
    
    try {
      await Share.share({
        message: `Incident Report: ${incident.title}\n\nType: ${getIncidentTypeLabel(incident.type)}\nStatus: ${STATUS_CONFIG[incident.status].label}\nSeverity: ${incident.severity}\n\nDescription: ${incident.description}`,
        title: "Share Incident",
      });
    } catch (error) {
      console.error("Share error:", error);
    }
  };

  const previewAttachment = (url: string, type: string) => {
    setPreviewUrl(url);
    setPreviewType(type);
    setPreviewVisible(true);
  };

  const closePreview = () => {
    setPreviewVisible(false);
    setPreviewUrl("");
    setPreviewType("");
  };

  const openAttachmentExternal = (url: string) => {
    Linking.openURL(url).catch(() => {
      setErrorDialog({
        visible: true,
        message: "Cannot open this file type",
      });
    });
  };

  if (loading) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.background }}
        edges={["top"]}
      >
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text
            style={{
              marginTop: Spacing[4],
              color: colors.foregroundMuted,
              fontSize: Typography.fontSize.sm,
            }}
          >
            Loading incident details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!incident) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.background }}
        edges={["top"]}
      >
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: Spacing[4] }}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.foregroundMuted} />
          <Text
            style={{
              marginTop: Spacing[4],
              color: colors.foreground,
              fontSize: Typography.fontSize.lg,
              fontWeight: Typography.fontWeight.semibold,
              textAlign: "center",
            }}
          >
            Incident Not Found
          </Text>
          <Text
            style={{
              marginTop: Spacing[2],
              color: colors.foregroundMuted,
              fontSize: Typography.fontSize.sm,
              textAlign: "center",
            }}
          >
            The incident you&apos;re looking for doesn&apos;t exist or has been removed.
          </Text>
          <Button onPress={() => router.back()} style={{ marginTop: Spacing[6] }}>
            Go Back
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const statusConfig = STATUS_CONFIG[incident.status];
  const severityConfig = SEVERITY_CONFIG[incident.severity];

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top"]}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: Spacing[4],
          paddingVertical: Spacing[3],
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing[3], flex: 1 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: Typography.fontSize.lg,
                fontWeight: Typography.fontWeight.semibold,
                color: colors.foreground,
              }}
              numberOfLines={1}
            >
              Incident Details
            </Text>
            <Text
              style={{
                fontSize: Typography.fontSize.xs,
                color: colors.foregroundMuted,
                marginTop: 2,
              }}
            >
              ID: {incident.id.slice(0, 8)}
            </Text>
          </View>
        </View>
        
        <View style={{ flexDirection: "row", gap: Spacing[2] }}>
          <TouchableOpacity
            onPress={handleShare}
            style={{
              padding: Spacing[2],
              borderRadius: BorderRadius.md,
              backgroundColor: colors.muted,
            }}
          >
            <Ionicons name="share-outline" size={20} color={colors.foreground} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setDeleteConfirmVisible(true)}
            style={{
              padding: Spacing[2],
              borderRadius: BorderRadius.md,
              backgroundColor: colors.error + "20",
            }}
          >
            <Ionicons name="trash-outline" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: Spacing[4], paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Status & Severity Header Card */}
        <Card style={{ marginBottom: Spacing[4] }}>
          <View style={{ padding: Spacing[4] }}>
            <View style={{ flexDirection: "row", gap: Spacing[3], marginBottom: Spacing[4] }}>
              {/* Status Badge */}
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: Typography.fontSize.xs,
                    color: colors.foregroundMuted,
                    marginBottom: Spacing[2],
                    textTransform: "uppercase",
                    fontWeight: Typography.fontWeight.medium,
                  }}
                >
                  Status
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: statusConfig.color + "20",
                    paddingVertical: Spacing[2],
                    paddingHorizontal: Spacing[3],
                    borderRadius: BorderRadius.md,
                    borderWidth: 1,
                    borderColor: statusConfig.color,
                  }}
                >
                  <Ionicons
                    name={statusConfig.icon}
                    size={18}
                    color={statusConfig.color}
                    style={{ marginRight: Spacing[2] }}
                  />
                  <Text
                    style={{
                      color: statusConfig.color,
                      fontSize: Typography.fontSize.sm,
                      fontWeight: Typography.fontWeight.semibold,
                    }}
                  >
                    {statusConfig.label}
                  </Text>
                </View>
              </View>

              {/* Severity Badge */}
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: Typography.fontSize.xs,
                    color: colors.foregroundMuted,
                    marginBottom: Spacing[2],
                    textTransform: "uppercase",
                    fontWeight: Typography.fontWeight.medium,
                  }}
                >
                  Severity
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: severityConfig.bgColor,
                    paddingVertical: Spacing[2],
                    paddingHorizontal: Spacing[3],
                    borderRadius: BorderRadius.md,
                    borderWidth: 1,
                    borderColor: severityConfig.color,
                  }}
                >
                  <Ionicons
                    name={severityConfig.icon}
                    size={18}
                    color={severityConfig.color}
                    style={{ marginRight: Spacing[2] }}
                  />
                  <Text
                    style={{
                      color: severityConfig.color,
                      fontSize: Typography.fontSize.sm,
                      fontWeight: Typography.fontWeight.semibold,
                    }}
                  >
                    {incident.severity}
                  </Text>
                </View>
              </View>
            </View>

            {/* Update Status Button */}
            <Button
              variant="outline"
              size="sm"
              onPress={() => setStatusModalVisible(true)}
              disabled={updating}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing[2] }}>
                <Ionicons name="refresh-outline" size={16} color={colors.foreground} />
                <Text style={{ color: colors.foreground }}>Update Status</Text>
              </View>
            </Button>
          </View>
        </Card>

        {/* Incident Title & Type */}
        <Card style={{ marginBottom: Spacing[4] }}>
          <View style={{ padding: Spacing[4] }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                justifyContent: "space-between",
                marginBottom: Spacing[2],
              }}
            >
              <View style={{ flex: 1, marginRight: Spacing[2] }}>
                <Text
                  style={{
                    fontSize: Typography.fontSize.xl,
                    fontWeight: Typography.fontWeight.bold,
                    color: colors.foreground,
                    lineHeight: 28,
                  }}
                >
                  {incident.title}
                </Text>
              </View>
              {incident.isConfidential && (
                <View
                  style={{
                    backgroundColor: colors.error + "20",
                    paddingVertical: Spacing[1],
                    paddingHorizontal: Spacing[2],
                    borderRadius: BorderRadius.sm,
                    borderWidth: 1,
                    borderColor: colors.error,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Ionicons name="lock-closed" size={12} color={colors.error} />
                    <Text
                      style={{
                        fontSize: Typography.fontSize.xs,
                        color: colors.error,
                        fontWeight: Typography.fontWeight.semibold,
                      }}
                    >
                      CONFIDENTIAL
                    </Text>
                  </View>
                </View>
              )}
            </View>

            <Badge variant="default" style={{ alignSelf: "flex-start" }}>
              {getIncidentTypeLabel(incident.type)}
            </Badge>
          </View>
        </Card>

        {/* Description */}
        <Card style={{ marginBottom: Spacing[4] }}>
          <View style={{ padding: Spacing[4] }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: Spacing[3] }}>
              <Ionicons name="document-text-outline" size={20} color={colors.primary} />
              <Text
                style={{
                  fontSize: Typography.fontSize.sm,
                  fontWeight: Typography.fontWeight.semibold,
                  color: colors.foreground,
                  marginLeft: Spacing[2],
                }}
              >
                Description
              </Text>
            </View>
            <Text
              style={{
                fontSize: Typography.fontSize.base,
                color: colors.foreground,
                lineHeight: 24,
              }}
            >
              {incident.description}
            </Text>
          </View>
        </Card>

        {/* Metadata Grid */}
        <Card style={{ marginBottom: Spacing[4] }}>
          <View style={{ padding: Spacing[4] }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: Spacing[3] }}>
              <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
              <Text
                style={{
                  fontSize: Typography.fontSize.sm,
                  fontWeight: Typography.fontWeight.semibold,
                  color: colors.foreground,
                  marginLeft: Spacing[2],
                }}
              >
                Additional Information
              </Text>
            </View>

            <View style={{ gap: Spacing[3] }}>
              {/* Location */}
              {incident.location && (
                <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: BorderRadius.md,
                      backgroundColor: colors.muted,
                      justifyContent: "center",
                      alignItems: "center",
                      marginRight: Spacing[3],
                    }}
                  >
                    <Ionicons name="location-outline" size={16} color={colors.foreground} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: Typography.fontSize.xs,
                        color: colors.foregroundMuted,
                        marginBottom: 2,
                      }}
                    >
                      Location
                    </Text>
                    <Text
                      style={{
                        fontSize: Typography.fontSize.sm,
                        color: colors.foreground,
                        fontWeight: Typography.fontWeight.medium,
                      }}
                    >
                      {incident.location}
                    </Text>
                  </View>
                </View>
              )}

              {/* Reported By */}
              {incident.reporter && (
                <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: BorderRadius.md,
                      backgroundColor: colors.muted,
                      justifyContent: "center",
                      alignItems: "center",
                      marginRight: Spacing[3],
                    }}
                  >
                    <Ionicons name="person-outline" size={16} color={colors.foreground} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: Typography.fontSize.xs,
                        color: colors.foregroundMuted,
                        marginBottom: 2,
                      }}
                    >
                      Reported By
                    </Text>
                    <Text
                      style={{
                        fontSize: Typography.fontSize.sm,
                        color: colors.foreground,
                        fontWeight: Typography.fontWeight.medium,
                      }}
                    >
                      {incident.reporter.firstName} {incident.reporter.lastName}
                    </Text>
                    <Text
                      style={{
                        fontSize: Typography.fontSize.xs,
                        color: colors.foregroundMuted,
                      }}
                    >
                      {incident.reporter.email}
                    </Text>
                  </View>
                </View>
              )}

              {/* Reported At */}
              <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: BorderRadius.md,
                    backgroundColor: colors.muted,
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: Spacing[3],
                  }}
                >
                  <Ionicons name="calendar-outline" size={16} color={colors.foreground} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: Typography.fontSize.xs,
                      color: colors.foregroundMuted,
                      marginBottom: 2,
                    }}
                  >
                    Reported At
                  </Text>
                  <Text
                    style={{
                      fontSize: Typography.fontSize.sm,
                      color: colors.foreground,
                      fontWeight: Typography.fontWeight.medium,
                    }}
                  >
                    {new Date(incident.reportedAt).toLocaleString()}
                  </Text>
                </View>
              </View>

              {/* Updated At */}
              {incident.resolvedAt && (
                <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: BorderRadius.md,
                      backgroundColor: colors.muted,
                      justifyContent: "center",
                      alignItems: "center",
                      marginRight: Spacing[3],
                    }}
                  >
                    <Ionicons name="time-outline" size={16} color={colors.foreground} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: Typography.fontSize.xs,
                        color: colors.foregroundMuted,
                        marginBottom: 2,
                      }}
                    >
                      Resolved At
                    </Text>
                    <Text
                      style={{
                        fontSize: Typography.fontSize.sm,
                        color: colors.foreground,
                        fontWeight: Typography.fontWeight.medium,
                      }}
                    >
                      {new Date(incident.resolvedAt).toLocaleString()}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </Card>

        {/* Student Information (if applicable) */}
        {incident.student && (
          <Card style={{ marginBottom: Spacing[4] }}>
            <View style={{ padding: Spacing[4] }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: Spacing[3] }}>
                <Ionicons name="school-outline" size={20} color={colors.primary} />
                <Text
                  style={{
                    fontSize: Typography.fontSize.sm,
                    fontWeight: Typography.fontWeight.semibold,
                    color: colors.foreground,
                    marginLeft: Spacing[2],
                  }}
                >
                  Student Information
                </Text>
              </View>

              <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing[3] }}>
                {/* Profile Picture */}
                <View
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: BorderRadius.md,
                    backgroundColor: colors.muted,
                    overflow: "hidden",
                    borderWidth: 2,
                    borderColor: colors.border,
                  }}
                >
                  {(incident.student as any).profilePicture ? (
                    <Image
                      source={{ uri: getFileUrl((incident.student as any).profilePicture) }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={{
                        width: "100%",
                        height: "100%",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Ionicons name="person" size={32} color={colors.foregroundMuted} />
                    </View>
                  )}
                </View>

                {/* Student Details */}
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: Typography.fontSize.base,
                      fontWeight: Typography.fontWeight.semibold,
                      color: colors.foreground,
                      marginBottom: 2,
                    }}
                  >
                    {incident.student.firstName} {incident.student.lastName}
                  </Text>
                  <Text
                    style={{
                      fontSize: Typography.fontSize.sm,
                      color: colors.foregroundMuted,
                      marginBottom: 2,
                    }}
                  >
                    {incident.student.indexNumber}
                  </Text>
                  {incident.student.program && (
                    <Text
                      style={{
                        fontSize: Typography.fontSize.xs,
                        color: colors.foregroundMuted,
                      }}
                    >
                      {incident.student.program}
                      {incident.student.level && ` • Level ${incident.student.level}`}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </Card>
        )}

        {/* Exam Session (if applicable) */}
        {incident.examSession && (
          <Card style={{ marginBottom: Spacing[4] }}>
            <View style={{ padding: Spacing[4] }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: Spacing[3] }}>
                <Ionicons name="book-outline" size={20} color={colors.primary} />
                <Text
                  style={{
                    fontSize: Typography.fontSize.sm,
                    fontWeight: Typography.fontWeight.semibold,
                    color: colors.foreground,
                    marginLeft: Spacing[2],
                  }}
                >
                  Exam Session
                </Text>
              </View>

              <View style={{ gap: Spacing[2] }}>
                <Text
                  style={{
                    fontSize: Typography.fontSize.base,
                    fontWeight: Typography.fontWeight.semibold,
                    color: colors.foreground,
                  }}
                >
                  {incident.examSession.courseName}
                </Text>
                <Text
                  style={{
                    fontSize: Typography.fontSize.sm,
                    color: colors.foregroundMuted,
                  }}
                >
                  {incident.examSession.courseCode}
                </Text>
                <View style={{ flexDirection: "row", gap: Spacing[2], flexWrap: "wrap" }}>
                  {(incident.examSession as any).venue && (
                    <Badge variant="secondary">{(incident.examSession as any).venue}</Badge>
                  )}
                  {(incident.examSession as any).examDate && (
                    <Badge variant="secondary">
                      {new Date((incident.examSession as any).examDate).toLocaleDateString()}
                    </Badge>
                  )}
                  <Badge variant="secondary">
                    {incident.examSession.batchQrCode}
                  </Badge>
                </View>
              </View>
            </View>
          </Card>
        )}

        {/* Attachments */}
        {incident.attachments && incident.attachments.length > 0 && (
          <Card>
            <View style={{ padding: Spacing[4] }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: Spacing[3] }}>
                <Ionicons name="attach-outline" size={20} color={colors.primary} />
                <Text
                  style={{
                    fontSize: Typography.fontSize.sm,
                    fontWeight: Typography.fontWeight.semibold,
                    color: colors.foreground,
                    marginLeft: Spacing[2],
                  }}
                >
                  Attachments ({incident.attachments.length})
                </Text>
              </View>

              <View style={{ gap: Spacing[3] }}>
                {incident.attachments.map((attachment, index) => {
                  const fileUrl = getFileUrl(attachment.filePath);
                  const isImage = attachment.fileType.startsWith("image/");
                  const isVideo = attachment.fileType.startsWith("video/");
                  const isPDF = attachment.fileType === "application/pdf";

                  return (
                    <TouchableOpacity
                      key={index}
                      onPress={() => {
                        if (isImage || isVideo) {
                          previewAttachment(fileUrl, attachment.fileType);
                        } else {
                          openAttachmentExternal(fileUrl);
                        }
                      }}
                      activeOpacity={0.7}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        padding: Spacing[3],
                        backgroundColor: colors.muted,
                        borderRadius: BorderRadius.md,
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    >
                      {/* Thumbnail or Icon */}
                      <View
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: BorderRadius.sm,
                          backgroundColor: colors.background,
                          marginRight: Spacing[3],
                          overflow: "hidden",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        {isImage ? (
                          <Image
                            source={{ uri: fileUrl }}
                            style={{ width: "100%", height: "100%" }}
                            resizeMode="cover"
                          />
                        ) : (
                          <Ionicons
                            name={
                              isVideo
                                ? "videocam"
                                : isPDF
                                  ? "document-text"
                                  : "document"
                            }
                            size={28}
                            color={
                              isVideo
                                ? colors.error
                                : isPDF
                                  ? colors.warning
                                  : colors.foregroundMuted
                            }
                          />
                        )}
                      </View>

                      {/* File Info */}
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: Typography.fontSize.sm,
                            fontWeight: Typography.fontWeight.medium,
                            color: colors.foreground,
                            marginBottom: 2,
                          }}
                          numberOfLines={1}
                        >
                          {attachment.fileName || `Attachment ${index + 1}`}
                        </Text>
                        <Text
                          style={{
                            fontSize: Typography.fontSize.xs,
                            color: colors.foregroundMuted,
                          }}
                        >
                          {attachment.fileSize
                            ? `${(attachment.fileSize / 1024).toFixed(1)} KB`
                            : "Unknown size"}{" "}
                          • {attachment.fileType.split("/")[1]?.toUpperCase() || "FILE"}
                        </Text>
                      </View>

                      {/* Preview/Open Icon */}
                      <Ionicons
                        name={isImage || isVideo ? "eye-outline" : "open-outline"}
                        size={20}
                        color={colors.primary}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </Card>
        )}
      </ScrollView>

      {/* Status Change Modal */}
      <Modal
        visible={statusModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setStatusModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "center",
            padding: Spacing[4],
          }}
        >
          <View
            style={{
              backgroundColor: colors.background,
              borderRadius: BorderRadius.lg,
              padding: Spacing[4],
            }}
          >
            <Text
              style={{
                fontSize: Typography.fontSize.lg,
                fontWeight: Typography.fontWeight.semibold,
                color: colors.foreground,
                marginBottom: Spacing[4],
              }}
            >
              Update Incident Status
            </Text>

            <View style={{ gap: Spacing[2] }}>
              {(Object.keys(STATUS_CONFIG) as IncidentStatus[]).map((status) => {
                const config = STATUS_CONFIG[status];
                const isCurrentStatus = incident.status === status;

                return (
                  <TouchableOpacity
                    key={status}
                    onPress={() => handleStatusChange(status)}
                    disabled={isCurrentStatus}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      padding: Spacing[3],
                      backgroundColor: isCurrentStatus
                        ? config.color + "20"
                        : colors.muted,
                      borderRadius: BorderRadius.md,
                      borderWidth: 1,
                      borderColor: isCurrentStatus ? config.color : colors.border,
                      opacity: isCurrentStatus ? 0.6 : 1,
                    }}
                  >
                    <Ionicons
                      name={config.icon}
                      size={20}
                      color={config.color}
                      style={{ marginRight: Spacing[3] }}
                    />
                    <Text
                      style={{
                        fontSize: Typography.fontSize.base,
                        fontWeight: Typography.fontWeight.medium,
                        color: colors.foreground,
                        flex: 1,
                      }}
                    >
                      {config.label}
                    </Text>
                    {isCurrentStatus && (
                      <Ionicons name="checkmark-circle" size={20} color={config.color} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <Button
              variant="outline"
              onPress={() => setStatusModalVisible(false)}
              style={{ marginTop: Spacing[4] }}
            >
              Cancel
            </Button>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteConfirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteConfirmVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "center",
            padding: Spacing[4],
          }}
        >
          <View
            style={{
              backgroundColor: colors.background,
              borderRadius: BorderRadius.lg,
              padding: Spacing[4],
            }}
          >
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: colors.error + "20",
                justifyContent: "center",
                alignItems: "center",
                alignSelf: "center",
                marginBottom: Spacing[3],
              }}
            >
              <Ionicons name="warning" size={32} color={colors.error} />
            </View>

            <Text
              style={{
                fontSize: Typography.fontSize.lg,
                fontWeight: Typography.fontWeight.semibold,
                color: colors.foreground,
                marginBottom: Spacing[2],
                textAlign: "center",
              }}
            >
              Delete Incident?
            </Text>

            <Text
              style={{
                fontSize: Typography.fontSize.sm,
                color: colors.foregroundMuted,
                marginBottom: Spacing[4],
                textAlign: "center",
                lineHeight: 20,
              }}
            >
              This action cannot be undone. All incident data and attachments will be permanently deleted.
            </Text>

            <View style={{ flexDirection: "row", gap: Spacing[2] }}>
              <Button
                variant="outline"
                onPress={() => setDeleteConfirmVisible(false)}
                style={{ flex: 1 }}
              >
                Cancel
              </Button>
              <Button
                onPress={handleDelete}
                disabled={updating}
                loading={updating}
                style={{ flex: 1, backgroundColor: colors.error }}
              >
                Delete
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* Attachment Preview Modal */}
      <Modal
        visible={previewVisible}
        transparent
        animationType="fade"
        onRequestClose={closePreview}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.95)",
          }}
        >
          <SafeAreaView style={{ flex: 1 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                padding: Spacing[4],
              }}
            >
              <TouchableOpacity
                onPress={closePreview}
                style={{
                  padding: Spacing[2],
                  borderRadius: BorderRadius.md,
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                }}
              >
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => openAttachmentExternal(previewUrl)}
                style={{
                  padding: Spacing[2],
                  borderRadius: BorderRadius.md,
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                }}
              >
                <Ionicons name="open-outline" size={24} color="white" />
              </TouchableOpacity>
            </View>

            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                padding: Spacing[4],
              }}
            >
              {previewType.startsWith("image/") ? (
                <Image
                  source={{ uri: previewUrl }}
                  style={{
                    width: SCREEN_WIDTH - Spacing[8],
                    height: "100%",
                  }}
                  resizeMode="contain"
                />
              ) : (
                <View style={{ alignItems: "center" }}>
                  <Ionicons name="videocam" size={64} color="white" />
                  <Text
                    style={{
                      color: "white",
                      fontSize: Typography.fontSize.lg,
                      marginTop: Spacing[4],
                    }}
                  >
                    Video preview not available
                  </Text>
                  <Text
                    style={{
                      color: "rgba(255, 255, 255, 0.7)",
                      fontSize: Typography.fontSize.sm,
                      marginTop: Spacing[2],
                    }}
                  >
                    Tap the open icon to view externally
                  </Text>
                </View>
              )}
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Error Dialog */}
      <Dialog
        visible={errorDialog.visible}
        onClose={() => setErrorDialog({ visible: false, message: "" })}
        title="Error"
        message={errorDialog.message}
        variant="error"
        primaryAction={{
          label: "OK",
          onPress: () => setErrorDialog({ visible: false, message: "" }),
        }}
      />

      {/* Success Dialog */}
      <Dialog
        visible={successDialog.visible}
        onClose={() => setSuccessDialog({ visible: false, message: "" })}
        title="Success"
        message={successDialog.message}
        variant="success"
        primaryAction={{
          label: "OK",
          onPress: () => setSuccessDialog({ visible: false, message: "" }),
        }}
      />
    </SafeAreaView>
  );
}
