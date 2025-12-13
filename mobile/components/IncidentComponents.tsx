/**
 * Incident UI Components
 * Reusable components for incident management screens
 */

import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  type IncidentSeverity,
  type IncidentStatus,
  type Incident,
} from "@/types";
import {
  getIncidentTypeLabel,
  getStatusLabel,
  getSeverityColor,
} from "@/api/incidents";
import { useThemeColors } from "@/constants/design-system";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";

// ============================================
// Severity Badge Component
// ============================================

interface SeverityBadgeProps {
  severity: IncidentSeverity;
}

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  const getVariant = (): "default" | "secondary" | "error" | "outline" => {
    switch (severity) {
      case "CRITICAL":
        return "error";
      case "HIGH":
        return "default";
      case "MEDIUM":
        return "outline";
      case "LOW":
        return "secondary";
      default:
        return "secondary";
    }
  };

  return <Badge variant={getVariant()}>{severity}</Badge>;
}

// ============================================
// Status Badge Component
// ============================================

interface StatusBadgeProps {
  status: IncidentStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const getVariant = (): "default" | "secondary" | "error" | "outline" => {
    switch (status) {
      case "ESCALATED":
        return "error";
      case "INVESTIGATING":
        return "default";
      case "RESOLVED":
      case "CLOSED":
        return "secondary";
      case "REPORTED":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <Badge variant={getVariant()}>
      {getStatusLabel(status).replace("_", " ")}
    </Badge>
  );
}

// ============================================
// Incident Card Component
// ============================================

interface IncidentCardProps {
  incident: Incident;
  onPress: () => void;
}

export function IncidentCard({ incident, onPress }: IncidentCardProps) {
  const colors = useThemeColors();

  const getSeverityIcon = (severity: IncidentSeverity) => {
    switch (severity) {
      case "CRITICAL":
        return "alert-circle";
      case "HIGH":
        return "alert";
      case "MEDIUM":
        return "warning";
      case "LOW":
        return "information-circle";
      default:
        return "information-circle";
    }
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card>
        <View className="p-4">
          {/* Header */}
          <View className="flex-row items-start justify-between mb-2">
            <View className="flex-1 mr-2">
              <View className="flex-row items-center gap-2 mb-1">
                <Ionicons
                  name={getSeverityIcon(incident.severity)}
                  size={18}
                  color={getSeverityColor(incident.severity)}
                />
                <Text
                  className="font-semibold text-sm"
                  style={{ color: colors.foreground }}
                >
                  {incident.incidentNumber}
                </Text>
                {incident.isConfidential && (
                  <Badge variant="error">Confidential</Badge>
                )}
              </View>
              <Text
                className="font-bold text-base mb-1"
                style={{ color: colors.foreground }}
                numberOfLines={2}
              >
                {incident.title}
              </Text>
            </View>
            <View className="gap-1">
              <SeverityBadge severity={incident.severity} />
              <StatusBadge status={incident.status} />
            </View>
          </View>

          {/* Description */}
          <Text
            className="text-sm mb-3"
            style={{ color: colors.foregroundMuted }}
            numberOfLines={2}
          >
            {incident.description}
          </Text>

          {/* Meta Info */}
          <View className="flex-row items-center gap-4 flex-wrap">
            <View className="flex-row items-center gap-1">
              <Ionicons
                name="folder-outline"
                size={14}
                color={colors.foregroundMuted}
              />
              <Text
                className="text-xs"
                style={{ color: colors.foregroundMuted }}
              >
                {getIncidentTypeLabel(incident.type)}
              </Text>
            </View>

            {incident.location && (
              <View className="flex-row items-center gap-1">
                <Ionicons
                  name="location-outline"
                  size={14}
                  color={colors.foregroundMuted}
                />
                <Text
                  className="text-xs"
                  style={{ color: colors.foregroundMuted }}
                  numberOfLines={1}
                >
                  {incident.location}
                </Text>
              </View>
            )}

            <View className="flex-row items-center gap-1">
              <Ionicons
                name="time-outline"
                size={14}
                color={colors.foregroundMuted}
              />
              <Text
                className="text-xs"
                style={{ color: colors.foregroundMuted }}
              >
                {new Date(incident.reportedAt).toLocaleDateString()}
              </Text>
            </View>

            {incident._count && incident._count.comments > 0 && (
              <View className="flex-row items-center gap-1">
                <Ionicons
                  name="chatbubble-outline"
                  size={14}
                  color={colors.foregroundMuted}
                />
                <Text
                  className="text-xs"
                  style={{ color: colors.foregroundMuted }}
                >
                  {incident._count.comments}
                </Text>
              </View>
            )}

            {incident._count && incident._count.attachments > 0 && (
              <View className="flex-row items-center gap-1">
                <Ionicons
                  name="attach-outline"
                  size={14}
                  color={colors.foregroundMuted}
                />
                <Text
                  className="text-xs"
                  style={{ color: colors.foregroundMuted }}
                >
                  {incident._count.attachments}
                </Text>
              </View>
            )}
          </View>

          {/* Reporter/Assignee */}
          {(incident.reporter || incident.assignee) && (
            <View
              className="mt-3 pt-3 border-t"
              style={{ borderColor: colors.border }}
            >
              <View className="flex-row justify-between">
                {incident.reporter && (
                  <View className="flex-row items-center gap-1">
                    <Ionicons
                      name="person-outline"
                      size={12}
                      color={colors.foregroundMuted}
                    />
                    <Text
                      className="text-xs"
                      style={{ color: colors.foregroundMuted }}
                    >
                      {incident.reporter.name}
                    </Text>
                  </View>
                )}
                {incident.assignee && (
                  <View className="flex-row items-center gap-1">
                    <Ionicons
                      name="person-add-outline"
                      size={12}
                      color={colors.primary}
                    />
                    <Text
                      className="text-xs font-medium"
                      style={{ color: colors.primary }}
                    >
                      {incident.assignee.name}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );
}

// ============================================
// Comment Item Component
// ============================================

interface CommentItemProps {
  comment: {
    id: string;
    comment: string;
    isInternal: boolean;
    createdAt: string;
    user: {
      name: string;
      role: string;
    };
  };
}

export function CommentItem({ comment }: CommentItemProps) {
  const colors = useThemeColors();

  return (
    <View
      className={`p-3 rounded-lg mb-2 ${
        comment.isInternal
          ? "bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800"
          : "bg-muted"
      }`}
    >
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-2 flex-1">
          <Ionicons
            name="person-circle-outline"
            size={16}
            color={colors.foregroundMuted}
          />
          <Text
            className="text-xs font-semibold"
            style={{ color: colors.foreground }}
          >
            {comment.user.name}
          </Text>
          <Text className="text-xs" style={{ color: colors.foregroundMuted }}>
            ({comment.user.role})
          </Text>
          {comment.isInternal && <Badge variant="outline">Internal</Badge>}
        </View>
        <Text className="text-xs" style={{ color: colors.foregroundMuted }}>
          {new Date(comment.createdAt).toLocaleString([], {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>
      <Text className="text-sm" style={{ color: colors.foreground }}>
        {comment.comment}
      </Text>
    </View>
  );
}

// ============================================
// Stats Card Component
// ============================================

interface StatsCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string | number;
  iconColor?: string;
}

export function StatsCard({ icon, label, value, iconColor }: StatsCardProps) {
  const colors = useThemeColors();

  return (
    <Card style={{ flex: 1, minWidth: 150 }}>
      <View className="p-4">
        <View className="flex-row items-center justify-between mb-2">
          <Ionicons name={icon} size={24} color={iconColor || colors.primary} />
        </View>
        <Text
          className="text-2xl font-bold mb-1"
          style={{ color: colors.foreground }}
        >
          {value}
        </Text>
        <Text className="text-xs" style={{ color: colors.foregroundMuted }}>
          {label}
        </Text>
      </View>
    </Card>
  );
}
