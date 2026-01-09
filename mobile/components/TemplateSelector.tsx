/**
 * Template Selector
 * Modal for selecting saved attendance session templates
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/constants/design-system';
import { classAttendanceApi } from '@/api/classAttendance';
import type { AttendanceSession } from '@/types';

interface SessionTemplate {
  id: string;
  name: string;
  courseCode: string;
  courseName: string;
  venue?: string;
  expectedStudentCount?: number;
  createdAt: string;
}

interface TemplateSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelectTemplate: (session: AttendanceSession) => void;
}

export default function TemplateSelector({
  visible,
  onClose,
  onSelectTemplate,
}: TemplateSelectorProps) {
  const colors = useThemeColors();
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<SessionTemplate[]>([]);
  const [creating, setCreating] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      loadTemplates();
    }
  }, [visible]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const response = await classAttendanceApi.getSessionTemplates();
      setTemplates(response);
    } catch (error: any) {
      console.error('Failed to load templates:', error);
      Alert.alert('Error', 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = async (template: SessionTemplate) => {
    setCreating(template.id);
    try {
      const response = await classAttendanceApi.createFromTemplate(template.id);
      
      if (response.data) {
        onSelectTemplate(response.data);
        onClose();
        Alert.alert('Success', `Session created from template: ${template.name}`);
      }
    } catch (error: any) {
      console.error('Failed to create session from template:', error);
      Alert.alert(
        'Error',
        error?.error || error?.message || 'Failed to create session from template'
      );
    } finally {
      setCreating(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[styles.drawer, { backgroundColor: colors.card }]}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: colors.foreground }]}>
                Session Templates
              </Text>
              <Text style={[styles.subtitle, { color: colors.foregroundMuted }]}>
                Create session from saved template
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content}>
            {loading ? (
              <View style={styles.centerContent}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.foregroundMuted }]}>
                  Loading templates...
                </Text>
              </View>
            ) : templates.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="bookmarks-outline" size={64} color={colors.foregroundMuted} />
                <Text style={[styles.emptyText, { color: colors.foreground }]}>
                  No Templates Yet
                </Text>
                <Text style={[styles.emptySubtext, { color: colors.foregroundMuted }]}>
                  Save a session as a template to quickly create similar sessions in the future
                </Text>
              </View>
            ) : (
              templates.map((template) => (
                <TouchableOpacity
                  key={template.id}
                  style={[styles.templateCard, { backgroundColor: colors.background }]}
                  onPress={() => handleSelectTemplate(template)}
                  disabled={creating !== null}
                >
                  <View style={styles.templateHeader}>
                    <View style={[styles.templateIcon, { backgroundColor: colors.primary }]}>
                      <Ionicons name="bookmark" size={20} color="#fff" />
                    </View>
                    <View style={styles.templateInfo}>
                      <Text style={[styles.templateName, { color: colors.foreground }]}>
                        {template.name}
                      </Text>
                      <Text style={[styles.templateCourse, { color: colors.foregroundMuted }]}>
                        {template.courseCode} - {template.courseName}
                      </Text>
                      {template.venue && (
                        <Text style={[styles.templateVenue, { color: colors.foregroundMuted }]}>
                          📍 {template.venue}
                        </Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.templateFooter}>
                    <Text style={[styles.templateDate, { color: colors.foregroundMuted }]}>
                      Created {formatDate(template.createdAt)}
                    </Text>
                    {creating === template.id ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <Ionicons name="chevron-forward" size={20} color={colors.foregroundMuted} />
                    )}
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  content: {
    padding: 16,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  templateCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  templateIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  templateCourse: {
    fontSize: 14,
    marginBottom: 4,
  },
  templateVenue: {
    fontSize: 12,
  },
  templateFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  templateDate: {
    fontSize: 12,
  },
});
