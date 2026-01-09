/**
 * Create Session Drawer
 * Reusable bottom drawer for creating attendance sessions
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/constants/design-system';
import { classAttendanceApi } from '@/api/classAttendance';
import type { AttendanceSession } from '@/types';

interface CreateSessionDrawerProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (session: AttendanceSession) => void;
}

export default function CreateSessionDrawer({
  visible,
  onClose,
  onSuccess,
}: CreateSessionDrawerProps) {
  const colors = useThemeColors();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    courseCode: '',
    courseName: '',
    venue: '',
    expectedStudentCount: '',
    notes: '',
  });

  const handleSubmit = async () => {
    // Validation
    if (!formData.courseCode.trim()) {
      Alert.alert('Validation Error', 'Course code is required');
      return;
    }
    if (!formData.courseName.trim()) {
      Alert.alert('Validation Error', 'Course name is required');
      return;
    }

    setLoading(true);
    try {
      const response = await classAttendanceApi.createSession({
        courseCode: formData.courseCode.trim(),
        courseName: formData.courseName.trim(),
        venue: formData.venue.trim() || undefined,
        expectedStudentCount: formData.expectedStudentCount
          ? parseInt(formData.expectedStudentCount)
          : undefined,
        notes: formData.notes.trim() || undefined,
      });

      // Reset form
      setFormData({
        courseCode: '',
        courseName: '',
        venue: '',
        expectedStudentCount: '',
        notes: '',
      });

      // Close drawer
      onClose();

      // Notify parent
      if (onSuccess && response.data) {
        onSuccess(response.data);
      }

      Alert.alert('Success', 'Session created successfully');
    } catch (error: any) {
      console.error('Failed to create session:', error);
      Alert.alert(
        'Error',
        error?.error || error?.message || 'Failed to create session'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />
        <View style={[styles.drawer, { backgroundColor: colors.card }]}>
          {/* Handle Bar */}
          <View style={styles.handleBar}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground }]}>
              Create Attendance Session
            </Text>
            <TouchableOpacity onPress={handleClose} disabled={loading}>
              <Ionicons name="close" size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          {/* Form */}
          <ScrollView
            style={styles.formContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Course Code */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.foreground }]}>
                Course Code <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.foreground,
                  },
                ]}
                placeholder="e.g., CS101"
                placeholderTextColor={colors.foregroundMuted}
                value={formData.courseCode}
                onChangeText={(text) =>
                  setFormData({ ...formData, courseCode: text })
                }
                autoCapitalize="characters"
                editable={!loading}
              />
            </View>

            {/* Course Name */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.foreground }]}>
                Course Name <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.foreground,
                  },
                ]}
                placeholder="e.g., Introduction to Computer Science"
                placeholderTextColor={colors.foregroundMuted}
                value={formData.courseName}
                onChangeText={(text) =>
                  setFormData({ ...formData, courseName: text })
                }
                editable={!loading}
              />
            </View>

            {/* Venue */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.foreground }]}>
                Venue
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.foreground,
                  },
                ]}
                placeholder="e.g., Lecture Hall A"
                placeholderTextColor={colors.foregroundMuted}
                value={formData.venue}
                onChangeText={(text) =>
                  setFormData({ ...formData, venue: text })
                }
                editable={!loading}
              />
            </View>

            {/* Expected Student Count */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.foreground }]}>
                Expected Student Count
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.foreground,
                  },
                ]}
                placeholder="e.g., 50"
                placeholderTextColor={colors.foregroundMuted}
                value={formData.expectedStudentCount}
                onChangeText={(text) =>
                  setFormData({ ...formData, expectedStudentCount: text })
                }
                keyboardType="number-pad"
                editable={!loading}
              />
            </View>

            {/* Notes */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.foreground }]}>
                Notes
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.foreground,
                  },
                ]}
                placeholder="Additional notes or instructions..."
                placeholderTextColor={colors.foregroundMuted}
                value={formData.notes}
                onChangeText={(text) =>
                  setFormData({ ...formData, notes: text })
                }
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                editable={!loading}
              />
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={[styles.buttonText, { color: colors.foreground }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.submitButton,
                { backgroundColor: colors.primary },
                loading && styles.buttonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={[styles.buttonText, { color: '#fff' }]}>
                  Create Session
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    maxHeight: '90%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  handleBar: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  required: {
    color: '#ef4444',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  submitButton: {
    minHeight: 48,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
