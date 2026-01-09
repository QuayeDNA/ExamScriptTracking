import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch,
  TextInput,
  ActivityIndicator,
  Alert,
  Share,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useThemeColors } from "@/constants/design-system";
import { Button } from "@/components/ui/button";
import { classAttendanceApi } from "@/api/classAttendance";
import { toast } from "@/utils/toast";
import type { AttendanceSession, AttendanceLink } from "@/types";

interface GenerateLinkDrawerProps {
  visible: boolean;
  session: AttendanceSession | null;
  onClose: () => void;
  onLinkGenerated?: (link: AttendanceLink) => void;
}

interface SecuritySettings {
  enableGeofencing: boolean;
  radius: number;
  enforceTimeWindow: boolean;
  oneSubmissionOnly: boolean;
}

export default function GenerateLinkDrawer({
  visible,
  session,
  onClose,
  onLinkGenerated,
}: GenerateLinkDrawerProps) {
  const colors = useThemeColors();
  const [linkExpiration, setLinkExpiration] = useState("30");
  const [generatingLink, setGeneratingLink] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<AttendanceLink | null>(null);
  const [existingLinks, setExistingLinks] = useState<AttendanceLink[]>([]);
  const [fetchingExistingLink, setFetchingExistingLink] = useState(false);
  const [capturingLocation, setCapturingLocation] = useState(false);
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    enableGeofencing: true,
    radius: 50,
    enforceTimeWindow: true,
    oneSubmissionOnly: true,
  });

  useEffect(() => {
    if (visible && session) {
      fetchExistingLinks(session.id);
    }
  }, [visible, session]);

  const fetchExistingLinks = async (sessionId: string) => {
    try {
      setFetchingExistingLink(true);
      const links = await classAttendanceApi.getActiveLinks(sessionId);
      setExistingLinks(links);
    } catch (error: any) {
      console.error("Failed to fetch existing links:", error);
      setExistingLinks([]);
    } finally {
      setFetchingExistingLink(false);
    }
  };

  const handleGenerateLink = async () => {
    if (!session) return;

    try {
      setGeneratingLink(true);

      let location;
      if (securitySettings.enableGeofencing) {
        setCapturingLocation(true);
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
          toast.error("Location permission is required for geofencing");
          setCapturingLocation(false);
          setGeneratingLink(false);
          return;
        }

        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        location = {
          lat: currentLocation.coords.latitude,
          lng: currentLocation.coords.longitude,
          radius: securitySettings.radius,
        };
        setCapturingLocation(false);
      }

      const linkData = {
        expiresInMinutes: parseInt(linkExpiration),
        requiresLocation: securitySettings.enableGeofencing,
        location,
        maxUsage: securitySettings.oneSubmissionOnly ? 1 : undefined,
      };

      const response = await classAttendanceApi.generateAttendanceLink(
        session.id,
        linkData
      );

      setGeneratedLink(response);
      onLinkGenerated?.(response);
      toast.success("Attendance link generated successfully");
    } catch (error: any) {
      console.error("Failed to generate link:", error);
      toast.error(error?.error || "Failed to generate attendance link");
    } finally {
      setGeneratingLink(false);
      setCapturingLocation(false);
    }
  };

  const handleCopyLink = async () => {
    if (generatedLink) {
      const code = generatedLink.token || generatedLink.linkToken;
      try {
        await Share.share({
          message: `Attendance Code: ${code}`,
          title: 'Attendance Link Code',
        });
      } catch (error: any) {
        // User cancelled or error occurred
        console.log('Share error:', error);
      }
    }
  };

  const handleClose = () => {
    setGeneratedLink(null);
    setLinkExpiration("30");
    setSecuritySettings({
      enableGeofencing: true,
      radius: 50,
      enforceTimeWindow: true,
      oneSubmissionOnly: true,
    });
    onClose();
  };

  if (!session) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={[styles.modalOverlay, { backgroundColor: "rgba(0, 0, 0, 0.5)" }]}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              Generate Attendance Link
            </Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalBody}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {/* Session Info */}
            <View style={[styles.sessionInfo, { backgroundColor: colors.muted }]}>
              <Text style={[styles.sessionCode, { color: colors.primary }]}>
                {session.courseCode}
              </Text>
              <Text style={[styles.sessionName, { color: colors.foreground }]}>
                {session.courseName}
              </Text>
            </View>

            {/* Existing Links Warning */}
            {fetchingExistingLink && (
              <View style={[styles.loadingBox, { backgroundColor: colors.muted }]}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.foregroundMuted }]}>
                  Checking for active links...
                </Text>
              </View>
            )}

            {!fetchingExistingLink && existingLinks.length > 0 && !generatedLink && (
              <View style={styles.warningBox}>
                <View style={styles.warningHeader}>
                  <Ionicons name="warning" size={20} color="#FF9800" />
                  <Text style={styles.warningTitle}>
                    Active Links Found ({existingLinks.length})
                  </Text>
                </View>
                <Text style={styles.warningText}>
                  Active links already exist for this session. Generating a new link will not affect existing ones.
                </Text>
                {existingLinks.slice(0, 2).map((link, index) => (
                  <View key={link.id} style={[styles.linkPreview, { marginTop: index > 0 ? 8 : 12 }]}>
                    <Text style={styles.linkLabel}>Link {index + 1}:</Text>
                    <Text style={styles.linkText} numberOfLines={1}>
                      {link.url}
                    </Text>
                    <View style={styles.linkMeta}>
                      <Text style={styles.linkMetaText}>
                        Uses: {link.usageCount}/{link.maxUsage || "∞"}
                      </Text>
                      <Text style={styles.linkMetaText}>
                        Expires: {new Date(link.expiresAt).toLocaleTimeString()}
                      </Text>
                    </View>
                  </View>
                ))}
                {existingLinks.length > 2 && (
                  <Text style={styles.moreLinksText}>
                    ...and {existingLinks.length - 2} more links
                  </Text>
                )}
              </View>
            )}

            {!generatedLink ? (
              <>
                {/* Link Expiration */}
                <View style={styles.section}>
                  <Text style={[styles.sectionLabel, { color: colors.foreground }]}>
                    Link Expiration
                  </Text>
                  <View style={styles.expirationButtons}>
                    {[
                      { label: "30 min", value: "30" },
                      { label: "1 hour", value: "60" },
                      { label: "2 hours", value: "120" },
                      { label: "Class duration", value: "180" },
                    ].map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.expirationButton,
                          {
                            backgroundColor:
                              linkExpiration === option.value ? colors.primary : colors.muted,
                          },
                        ]}
                        onPress={() => setLinkExpiration(option.value)}
                      >
                        <Text
                          style={[
                            styles.expirationButtonText,
                            {
                              color:
                                linkExpiration === option.value ? "#fff" : colors.foreground,
                            },
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Security Settings */}
                <View style={[styles.securitySection, { backgroundColor: colors.card }]}>
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                    Security Settings
                  </Text>

                  {/* Geofencing Toggle */}
                  <View style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                      <Text style={[styles.settingLabel, { color: colors.foreground }]}>
                        Enable Location Validation
                      </Text>
                      <Text style={[styles.settingDescription, { color: colors.foregroundMuted }]}>
                        Restrict attendance to within a specific radius
                      </Text>
                    </View>
                    <Switch
                      value={securitySettings.enableGeofencing}
                      onValueChange={(value) =>
                        setSecuritySettings({ ...securitySettings, enableGeofencing: value })
                      }
                      trackColor={{ false: colors.muted, true: `${colors.primary}80` }}
                      thumbColor={
                        securitySettings.enableGeofencing ? colors.primary : colors.foregroundMuted
                      }
                    />
                  </View>

                  {/* Radius Input */}
                  {securitySettings.enableGeofencing && (
                    <View style={styles.settingRow}>
                      <View style={styles.settingInfo}>
                        <Text style={[styles.settingLabel, { color: colors.foreground }]}>
                          Validation Radius
                        </Text>
                        <Text style={[styles.settingDescription, { color: colors.foregroundMuted }]}>
                          Students must be within this distance
                        </Text>
                      </View>
                      <View style={styles.radiusInputContainer}>
                        <TextInput
                          style={[
                            styles.radiusInput,
                            {
                              color: colors.foreground,
                              borderColor: colors.border,
                              backgroundColor: colors.muted,
                            },
                          ]}
                          value={String(securitySettings.radius)}
                          onChangeText={(text) => {
                            const value = parseInt(text) || 50;
                            const clampedValue = Math.max(10, Math.min(5000, value));
                            setSecuritySettings({ ...securitySettings, radius: clampedValue });
                          }}
                          keyboardType="numeric"
                          placeholder="50"
                          maxLength={4}
                        />
                        <Text style={[styles.radiusUnit, { color: colors.foregroundMuted }]}>m</Text>
                      </View>
                    </View>
                  )}

                  {/* Time Window Enforcement */}
                  <View style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                      <Text style={[styles.settingLabel, { color: colors.foreground }]}>
                        Enforce Time Window
                      </Text>
                      <Text style={[styles.settingDescription, { color: colors.foregroundMuted }]}>
                        Only allow attendance during class session times
                      </Text>
                    </View>
                    <Switch
                      value={securitySettings.enforceTimeWindow}
                      onValueChange={(value) =>
                        setSecuritySettings({ ...securitySettings, enforceTimeWindow: value })
                      }
                      trackColor={{ false: colors.muted, true: `${colors.primary}80` }}
                      thumbColor={
                        securitySettings.enforceTimeWindow ? colors.primary : colors.foregroundMuted
                      }
                    />
                  </View>

                  {/* One Submission Only */}
                  <View style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                      <Text style={[styles.settingLabel, { color: colors.foreground }]}>
                        Prevent Duplicate Submissions
                      </Text>
                      <Text style={[styles.settingDescription, { color: colors.foregroundMuted }]}>
                        Each student can only mark attendance once
                      </Text>
                    </View>
                    <Switch
                      value={securitySettings.oneSubmissionOnly}
                      onValueChange={(value) =>
                        setSecuritySettings({ ...securitySettings, oneSubmissionOnly: value })
                      }
                      trackColor={{ false: colors.muted, true: `${colors.primary}80` }}
                      thumbColor={
                        securitySettings.oneSubmissionOnly ? colors.primary : colors.foregroundMuted
                      }
                    />
                  </View>
                </View>

                {/* Info Box */}
                <View style={[styles.infoBox, { backgroundColor: colors.muted }]}>
                  <Ionicons name="information-circle" size={20} color={colors.primary} />
                  <Text style={[styles.infoText, { color: colors.foreground }]}>
                    Students will use this link to mark their attendance themselves
                  </Text>
                </View>
              </>
            ) : (
              /* Generated Link Display */
              <View style={styles.generatedContainer}>
                {/* 5-Digit Code Display */}
                <View style={[styles.codeDisplay, { backgroundColor: colors.primary }]}>
                  <Text style={styles.codeLabel}>Attendance Code</Text>
                  <Text style={styles.codeText}>
                    {generatedLink.token || generatedLink.linkToken}
                  </Text>
                  <Text style={styles.codeHint}>
                    Students enter this code to mark attendance
                  </Text>
                </View>

                {/* Full URL (optional) */}
                <View style={[styles.linkDisplay, { backgroundColor: colors.muted }]}>
                  <Text style={[styles.linkLabel, { color: colors.foregroundMuted }]}>
                    Or share this link:
                  </Text>
                  <Text style={[styles.linkUrl, { color: colors.foreground }]} numberOfLines={2}>
                    {generatedLink.url}
                  </Text>
                </View>

                <View style={[styles.successBox, { backgroundColor: `${colors.success}20` }]}>
                  <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                  <Text style={[styles.successText, { color: colors.success }]}>
                    Link generated successfully!
                  </Text>
                </View>

                <Text style={[styles.instructions, { color: colors.foregroundMuted }]}>
                  Share the 5-digit code with students via WhatsApp, SMS, or display it on the projector
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Actions */}
          <View style={[styles.modalActions, { borderTopColor: colors.border }]}>
            {!generatedLink ? (
              <>
                <Button variant="outline" onPress={handleClose} style={styles.actionButton} disabled={generatingLink}>
                  Cancel
                </Button>
                <Button
                  variant="default"
                  onPress={handleGenerateLink}
                  style={styles.actionButton}
                  disabled={generatingLink || capturingLocation}
                >
                  {capturingLocation
                    ? "Capturing Location..."
                    : generatingLink
                      ? "Generating..."
                      : existingLinks.length > 0
                        ? "Generate Another Link"
                        : "Generate Link"}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onPress={handleClose} style={styles.actionButton}>
                  Done
                </Button>
                <Button variant="default" onPress={handleCopyLink} style={styles.actionButton}>
                  Share Code
                </Button>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 24,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  modalBody: {
    padding: 24,
  },
  sessionInfo: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  sessionCode: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  sessionName: {
    fontSize: 16,
  },
  loadingBox: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 8,
    textAlign: "center",
  },
  warningBox: {
    padding: 16,
    backgroundColor: "#FFF3CD",
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FFC107",
  },
  warningHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  warningTitle: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "600",
    color: "#F57C00",
  },
  warningText: {
    fontSize: 13,
    color: "#795548",
    marginBottom: 8,
  },
  linkPreview: {
    backgroundColor: "#FFF",
    padding: 12,
    borderRadius: 8,
  },
  linkText: {
    fontSize: 12,
    color: "#333",
    fontFamily: "monospace",
  },
  linkMeta: {
    flexDirection: "row",
    marginTop: 8,
    gap: 16,
  },
  linkMetaText: {
    fontSize: 11,
    color: "#666",
  },
  moreLinksText: {
    fontSize: 11,
    color: "#666",
    marginTop: 8,
    textAlign: "center",
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  expirationButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  expirationButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: "48%",
    alignItems: "center",
  },
  expirationButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  securitySection: {
    borderRadius: 8,
    gap: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  settingInfo: {
    flex: 1,
    gap: 4,
    paddingRight: 8,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: "500",
  },
  settingDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  radiusInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  radiusInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    fontWeight: "600",
    minWidth: 70,
    textAlign: "center",
  },
  radiusUnit: {
    fontSize: 13,
    fontWeight: "500",
  },
  infoBox: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 8,
    gap: 10,
    alignItems: "flex-start",
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  generatedContainer: {
    gap: 16,
  },
  codeDisplay: {
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
  },
  codeLabel: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  codeText: {
    color: "#fff",
    fontSize: 48,
    fontWeight: "bold",
    letterSpacing: 8,
    fontFamily: "monospace",
  },
  codeHint: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    marginTop: 8,
  },
  linkDisplay: {
    padding: 16,
    borderRadius: 8,
  },
  linkLabel: {
    fontSize: 12,
    marginBottom: 8,
    fontWeight: "600",
  },
  linkUrl: {
    fontSize: 14,
    lineHeight: 20,
  },
  successBox: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    gap: 10,
  },
  successText: {
    fontSize: 16,
    fontWeight: "600",
  },
  instructions: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  modalActions: {
    flexDirection: "row",
    gap: 8,
    padding: 24,
    borderTopWidth: 1,
  },
  actionButton: {
    flex: 1,
  },
});
