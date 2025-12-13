/**
 * Incident Details Screen
 * Detailed view with timeline, comments, status updates, and attachments
 */

import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "@/constants/design-system";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  SeverityBadge,
  StatusBadge,
  CommentItem,
} from "@/components/IncidentComponents";
import {
  getIncident,
  getComments,
  addComment,
  updateStatus,
  getIncidentTypeLabel,
  type IncidentStatus,
} from "@/api/incidents";
import type { Incident } from "@/types";

export default function IncidentDetailsScreen() {
  const colors = useThemeColors();
  const { user } = useAuthStore();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [incident, setIncident] = useState<Incident | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  const isAdmin =
    user?.role === "ADMIN" ||
    user?.role === "DEPARTMENT_HEAD" ||
    user?.role === "FACULTY_OFFICER";

  // Fetch incident and comments
  const fetchData = useCallback(async () => {
    if (!id) return;

    try {
      const [incidentRes, commentsRes] = await Promise.all([
        getIncident(id),
        getComments(id),
      ]);
      setIncident(incidentRes.incident);
      setComments(commentsRes.comments);
    } catch {
      Alert.alert("Error", "Failed to load incident details");
      router.back();
    }
  }, [id]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchData();
      setLoading(false);
    };
    loadData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  // Submit comment
  const handleSubmitComment = async () => {
    if (!commentText.trim() || !id) return;

    try {
      setSubmittingComment(true);
      await addComment(id, {
        comment: commentText.trim(),
        isInternal,
      });
      setCommentText("");
      setIsInternal(false);
      await fetchData();
    } catch {
      Alert.alert("Error", "Failed to add comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  // Update status
  const handleUpdateStatus = async (newStatus: IncidentStatus) => {
    if (!id) return;

    try {
      await updateStatus(id, { status: newStatus });
      await fetchData();
      Alert.alert("Success", "Incident status updated");
    } catch {
      Alert.alert("Error", "Failed to update status");
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.background }}
        edges={["top"]}
      >
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text
            className="mt-4 text-sm"
            style={{ color: colors.foregroundMuted }}
          >
            Loading incident...
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
        <View className="flex-1 items-center justify-center p-8">
          <Ionicons
            name="alert-circle-outline"
            size={64}
            color={colors.foregroundMuted}
          />
          <Text
            className="text-lg font-semibold mt-4"
            style={{ color: colors.foreground }}
          >
            Incident Not Found
          </Text>
          <Button className="mt-6" onPress={() => router.back()}>
            Go Back
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top"]}
    >
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <View className="px-4 pt-6 pb-4">
          <View className="flex-row items-center gap-3 mb-4">
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <View className="flex-1">
              <View className="flex-row items-center gap-2 mb-1">
                <Text
                  className="text-lg font-bold"
                  style={{ color: colors.foreground }}
                >
                  {incident.incidentNumber}
                </Text>
                {incident.isConfidential && (
                  <Badge variant="error">Confidential</Badge>
                )}
                {incident.autoCreated && <Badge variant="outline">Auto</Badge>}
              </View>
              <Text
                className="text-sm"
                style={{ color: colors.foregroundMuted }}
              >
                {new Date(incident.reportedAt).toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        <View className="px-4 gap-4">
          {/* Status & Severity */}
          <Card>
            <View className="p-4">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text
                    className="text-xs mb-2"
                    style={{ color: colors.foregroundMuted }}
                  >
                    Status
                  </Text>
                  <StatusBadge status={incident.status} />
                </View>
                <View>
                  <Text
                    className="text-xs mb-2"
                    style={{ color: colors.foregroundMuted }}
                  >
                    Severity
                  </Text>
                  <SeverityBadge severity={incident.severity} />
                </View>
                <View>
                  <Text
                    className="text-xs mb-2"
                    style={{ color: colors.foregroundMuted }}
                  >
                    Type
                  </Text>
                  <Badge variant="outline">
                    {getIncidentTypeLabel(incident.type)}
                  </Badge>
                </View>
              </View>

              {/* Update Status Button (Admin Only) */}
              {isAdmin && incident.status !== "CLOSED" && (
                <View
                  className="mt-4 pt-4 border-t"
                  style={{ borderColor: colors.border }}
                >
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row gap-2">
                      {(
                        [
                          "INVESTIGATING",
                          "RESOLVED",
                          "ESCALATED",
                          "CLOSED",
                        ] as IncidentStatus[]
                      )
                        .filter((s) => s !== incident.status)
                        .map((status) => (
                          <Button
                            key={status}
                            variant="outline"
                            size="sm"
                            onPress={() => handleUpdateStatus(status)}
                          >
                            {status}
                          </Button>
                        ))}
                    </View>
                  </ScrollView>
                </View>
              )}
            </View>
          </Card>

          {/* Details */}
          <Card>
            <View className="p-4">
              <Text
                className="text-xl font-bold mb-3"
                style={{ color: colors.foreground }}
              >
                {incident.title}
              </Text>
              <Text
                className="text-base leading-6 mb-4"
                style={{ color: colors.foreground }}
              >
                {incident.description}
              </Text>

              {incident.location && (
                <View className="flex-row items-start gap-2 mb-3">
                  <Ionicons
                    name="location-outline"
                    size={18}
                    color={colors.foregroundMuted}
                  />
                  <View className="flex-1">
                    <Text
                      className="text-xs mb-1"
                      style={{ color: colors.foregroundMuted }}
                    >
                      Location
                    </Text>
                    <Text
                      className="text-sm"
                      style={{ color: colors.foreground }}
                    >
                      {incident.location}
                    </Text>
                  </View>
                </View>
              )}

              {incident.resolutionNotes && (
                <View className="p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                  <View className="flex-row items-start gap-2">
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color={colors.success}
                    />
                    <View className="flex-1">
                      <Text
                        className="text-xs font-semibold mb-1"
                        style={{ color: colors.success }}
                      >
                        Resolution
                      </Text>
                      <Text
                        className="text-sm"
                        style={{ color: colors.foreground }}
                      >
                        {incident.resolutionNotes}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          </Card>

          {/* People */}
          <Card>
            <View className="p-4">
              <Text
                className="text-sm font-semibold mb-3"
                style={{ color: colors.foreground }}
              >
                People
              </Text>

              {incident.reporter && (
                <View className="mb-3">
                  <Text
                    className="text-xs mb-1"
                    style={{ color: colors.foregroundMuted }}
                  >
                    Reported By
                  </Text>
                  <View className="flex-row items-center gap-2">
                    <Ionicons
                      name="person-circle-outline"
                      size={20}
                      color={colors.foreground}
                    />
                    <View>
                      <Text
                        className="text-sm font-medium"
                        style={{ color: colors.foreground }}
                      >
                        {incident.reporter.name}
                      </Text>
                      <Text
                        className="text-xs"
                        style={{ color: colors.foregroundMuted }}
                      >
                        {incident.reporter.email}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {incident.assignee ? (
                <View>
                  <Text
                    className="text-xs mb-1"
                    style={{ color: colors.foregroundMuted }}
                  >
                    Assigned To
                  </Text>
                  <View className="flex-row items-center gap-2">
                    <Ionicons
                      name="person-add-outline"
                      size={20}
                      color={colors.primary}
                    />
                    <View>
                      <Text
                        className="text-sm font-medium"
                        style={{ color: colors.foreground }}
                      >
                        {incident.assignee.name}
                      </Text>
                      <Text
                        className="text-xs"
                        style={{ color: colors.foregroundMuted }}
                      >
                        {incident.assignee.role}
                      </Text>
                    </View>
                  </View>
                </View>
              ) : (
                <View
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: colors.muted }}
                >
                  <Text
                    className="text-sm text-center"
                    style={{ color: colors.foregroundMuted }}
                  >
                    Not assigned
                  </Text>
                </View>
              )}
            </View>
          </Card>

          {/* Related Information */}
          {(incident.student || incident.examSession) && (
            <Card>
              <View className="p-4">
                <Text
                  className="text-sm font-semibold mb-3"
                  style={{ color: colors.foreground }}
                >
                  Related Information
                </Text>

                {incident.student && (
                  <View className="mb-3">
                    <Text
                      className="text-xs mb-1"
                      style={{ color: colors.foregroundMuted }}
                    >
                      Student
                    </Text>
                    <Text
                      className="text-sm font-medium"
                      style={{ color: colors.foreground }}
                    >
                      {incident.student.firstName} {incident.student.lastName}
                    </Text>
                    <Text
                      className="text-xs"
                      style={{ color: colors.foregroundMuted }}
                    >
                      {incident.student.indexNumber} •{" "}
                      {incident.student.program} • Level{" "}
                      {incident.student.level}
                    </Text>
                  </View>
                )}

                {incident.examSession && (
                  <View>
                    <Text
                      className="text-xs mb-1"
                      style={{ color: colors.foregroundMuted }}
                    >
                      Exam Session
                    </Text>
                    <Text
                      className="text-sm font-medium"
                      style={{ color: colors.foreground }}
                    >
                      {incident.examSession.courseCode} -{" "}
                      {incident.examSession.courseName}
                    </Text>
                    <Text
                      className="text-xs"
                      style={{ color: colors.foregroundMuted }}
                    >
                      Batch: {incident.examSession.batchQrCode}
                    </Text>
                  </View>
                )}
              </View>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <View className="p-4">
              <Text
                className="text-sm font-semibold mb-3"
                style={{ color: colors.foreground }}
              >
                Timeline
              </Text>

              <View className="gap-3">
                <TimelineItem
                  icon="create-outline"
                  label="Reported"
                  date={incident.reportedAt}
                  color={colors.foregroundMuted}
                />
                {incident.assignedAt && (
                  <TimelineItem
                    icon="person-add-outline"
                    label="Assigned"
                    date={incident.assignedAt}
                    color={colors.primary}
                  />
                )}
                {incident.resolvedAt && (
                  <TimelineItem
                    icon="checkmark-circle-outline"
                    label="Resolved"
                    date={incident.resolvedAt}
                    color={colors.success}
                  />
                )}
                {incident.closedAt && (
                  <TimelineItem
                    icon="close-circle-outline"
                    label="Closed"
                    date={incident.closedAt}
                    color={colors.foregroundMuted}
                  />
                )}
              </View>
            </View>
          </Card>

          {/* Comments */}
          <Card>
            <View className="p-4">
              <View className="flex-row items-center justify-between mb-3">
                <Text
                  className="text-sm font-semibold"
                  style={{ color: colors.foreground }}
                >
                  Comments ({comments.length})
                </Text>
              </View>

              {/* Comment List */}
              {comments.length > 0 && (
                <View className="mb-4">
                  {comments.map((comment) => (
                    <CommentItem key={comment.id} comment={comment} />
                  ))}
                </View>
              )}

              {/* Add Comment */}
              <View className="gap-3">
                <TextInput
                  className="p-3 rounded-lg text-base"
                  placeholder="Add a comment..."
                  placeholderTextColor={colors.foregroundMuted}
                  value={commentText}
                  onChangeText={setCommentText}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  style={{
                    backgroundColor: colors.background,
                    color: colors.foreground,
                    borderWidth: 1,
                    borderColor: colors.border,
                    minHeight: 80,
                  }}
                />

                {isAdmin && (
                  <TouchableOpacity
                    onPress={() => setIsInternal(!isInternal)}
                    className="flex-row items-center gap-2"
                  >
                    <View
                      className={`w-5 h-5 rounded items-center justify-center ${
                        isInternal ? "bg-primary" : "bg-muted"
                      }`}
                      style={{ borderWidth: 1, borderColor: colors.border }}
                    >
                      {isInternal && (
                        <Ionicons name="checkmark" size={14} color="white" />
                      )}
                    </View>
                    <Text
                      className="text-sm"
                      style={{ color: colors.foreground }}
                    >
                      Internal note (staff only)
                    </Text>
                  </TouchableOpacity>
                )}

                <Button
                  onPress={handleSubmitComment}
                  disabled={!commentText.trim() || submittingComment}
                  loading={submittingComment}
                >
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="send" size={16} color="white" />
                    <Text className="text-white font-semibold">
                      {submittingComment ? "Posting..." : "Post Comment"}
                    </Text>
                  </View>
                </Button>
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Helper Component: Timeline Item
function TimelineItem({
  icon,
  label,
  date,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  date: string;
  color: string;
}) {
  const colors = useThemeColors();

  return (
    <View className="flex-row items-center gap-3">
      <Ionicons name={icon} size={20} color={color} />
      <View className="flex-1">
        <Text
          className="text-sm font-medium"
          style={{ color: colors.foreground }}
        >
          {label}
        </Text>
        <Text className="text-xs" style={{ color: colors.foregroundMuted }}>
          {new Date(date).toLocaleString()}
        </Text>
      </View>
    </View>
  );
}
