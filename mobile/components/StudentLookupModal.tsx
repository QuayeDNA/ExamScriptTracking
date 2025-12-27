import React, { useState, useEffect } from "react";
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text, H3 } from "@/components/ui/typography";
import { useThemeColors } from "@/constants/design-system";
import {
  LocalStudent,
  findStudent,
  saveStudent,
  searchStudents,
  getAllStudents,
} from "@/utils/localStudentStorage";

interface StudentLookupModalProps {
  visible: boolean;
  onClose: () => void;
  onStudentSelected: (student: LocalStudent) => void;
  sessionId?: string;
}

interface StudentFormData {
  indexNumber: string;
  name: string;
  program: string;
  level: string;
}

export function StudentLookupModal({
  visible,
  onClose,
  onStudentSelected,
  sessionId,
}: StudentLookupModalProps) {
  const colors = useThemeColors();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<LocalStudent[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<StudentFormData>({
    indexNumber: "",
    name: "",
    program: "",
    level: "",
  });
  const [isSearching, setIsSearching] = useState(false);

  const [recentStudents, setRecentStudents] = useState<LocalStudent[]>([]);

  useEffect(() => {
    if (visible) {
      // Reset state when modal opens
      setSearchQuery("");
      setSearchResults([]);
      setShowForm(false);
      setFormData({
        indexNumber: "",
        name: "",
        program: "",
        level: "",
      });
      // Load recent students
      loadRecentStudents();
    }
  }, [visible]);

  const loadRecentStudents = async () => {
    try {
      const allStudents = await getAllStudents(sessionId);
      const recent = allStudents
        .sort(
          (a: LocalStudent, b: LocalStudent) =>
            new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()
        )
        .slice(0, 5);
      setRecentStudents(recent);
    } catch (error) {
      console.error("Failed to load recent students:", error);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchStudents(query, sessionId);
      setSearchResults(results);
    } catch (error) {
      console.error("Search failed:", error);
      Alert.alert("Error", "Failed to search students");
    } finally {
      setIsSearching(false);
    }
  };

  const handleStudentSelect = (student: LocalStudent) => {
    Alert.alert(
      "Use Saved Student?",
      `Use saved data for ${student.name} (${student.indexNumber})?`,
      [
        {
          text: "Use Saved",
          onPress: () => {
            onStudentSelected(student);
            onClose();
          },
        },
        {
          text: "Enter New",
          onPress: () => {
            setFormData({
              indexNumber: student.indexNumber,
              name: student.name,
              program: student.program || "",
              level: student.level || "",
            });
            setShowForm(true);
          },
        },
      ]
    );
  };

  const handleManualEntry = () => {
    setShowForm(true);
  };

  const handleFormSubmit = async () => {
    if (!formData.indexNumber.trim() || !formData.name.trim()) {
      Alert.alert("Error", "Index number and name are required");
      return;
    }

    try {
      const student: LocalStudent = {
        indexNumber: formData.indexNumber.trim(),
        name: formData.name.trim(),
        program: formData.program.trim() || undefined,
        level: formData.level.trim() || undefined,
        lastUsed: new Date(),
        sessionId,
      };

      // Save to local storage
      await saveStudent(student, sessionId);

      // Return the student
      onStudentSelected(student);
      onClose();
    } catch (error) {
      console.error("Failed to save student:", error);
      Alert.alert("Error", "Failed to save student data");
    }
  };

  const renderStudentItem = ({ item }: { item: LocalStudent }) => (
    <TouchableOpacity
      style={[styles.studentItem, { borderBottomColor: colors.border }]}
      onPress={() => handleStudentSelect(item)}
    >
      <View style={styles.studentInfo}>
        <Text style={[styles.studentName, { color: colors.foreground }]}>
          {item.name}
        </Text>
        <Text
          style={[styles.studentDetails, { color: colors.foregroundMuted }]}
        >
          {item.indexNumber}
          {item.program && ` • ${item.program}`}
          {item.level && ` • Level ${item.level}`}
        </Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={20}
        color={colors.foregroundMuted}
      />
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <H3 style={{ color: colors.foreground }}>Add Student</H3>
          <View style={styles.headerSpacer} />
        </View>

        {!showForm ? (
          /* Search View */
          <View style={styles.content}>
            <Input
              label="Search by Index Number or Name"
              placeholder="Enter index number or student name..."
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                handleSearch(text);
              }}
              autoCapitalize="none"
            />

            {searchResults.length > 0 ? (
              <View style={styles.resultsContainer}>
                <Text
                  style={[
                    styles.resultsTitle,
                    { color: colors.foregroundMuted },
                  ]}
                >
                  Found {searchResults.length} student
                  {searchResults.length !== 1 ? "s" : ""}
                </Text>
                <FlatList
                  data={searchResults}
                  keyExtractor={(item) => item.indexNumber}
                  renderItem={renderStudentItem}
                  style={styles.resultsList}
                />
              </View>
            ) : searchQuery.trim() === "" && recentStudents.length > 0 ? (
              <View style={styles.resultsContainer}>
                <Text
                  style={[
                    styles.resultsTitle,
                    { color: colors.foregroundMuted },
                  ]}
                >
                  Recent Students
                </Text>
                <FlatList
                  data={recentStudents}
                  keyExtractor={(item) => item.indexNumber}
                  renderItem={renderStudentItem}
                  style={styles.resultsList}
                />
              </View>
            ) : null}

            <View style={styles.actions}>
              <Button
                variant="outline"
                onPress={handleManualEntry}
                style={styles.manualButton}
              >
                <Text style={{ color: colors.foreground }}>Enter Manually</Text>
              </Button>
            </View>
          </View>
        ) : (
          /* Manual Entry Form */
          <View style={styles.content}>
            <Input
              label="Index Number *"
              placeholder="e.g., 12345678"
              value={formData.indexNumber}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, indexNumber: text }))
              }
              autoCapitalize="none"
            />

            <Input
              label="Full Name *"
              placeholder="e.g., John Doe"
              value={formData.name}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, name: text }))
              }
              autoCapitalize="words"
            />

            <Input
              label="Program"
              placeholder="e.g., Computer Science"
              value={formData.program}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, program: text }))
              }
              autoCapitalize="words"
            />

            <Input
              label="Level"
              placeholder="e.g., 300"
              value={formData.level}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, level: text }))
              }
              keyboardType="numeric"
            />

            <View style={styles.formActions}>
              <Button
                variant="outline"
                onPress={() => setShowForm(false)}
                style={styles.backButton}
              >
                <Text style={{ color: colors.foreground }}>Back</Text>
              </Button>
              <Button onPress={handleFormSubmit} style={styles.submitButton}>
                <Text style={{ color: colors.primaryForeground }}>
                  Save & Continue
                </Text>
              </Button>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 8,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  resultsContainer: {
    flex: 1,
    marginTop: 16,
  },
  resultsTitle: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  resultsList: {
    flex: 1,
  },
  studentItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  studentDetails: {
    fontSize: 14,
  },
  actions: {
    marginTop: 24,
  },
  manualButton: {
    width: "100%",
  },
  formActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  backButton: {
    flex: 1,
  },
  submitButton: {
    flex: 2,
  },
});
