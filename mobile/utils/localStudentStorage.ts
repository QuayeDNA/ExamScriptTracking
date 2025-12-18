/**
 * Local Student Storage Utility
 * Manages student data storage for quick re-entry in attendance sessions
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

export interface LocalStudent {
  indexNumber: string;
  name: string;
  program?: string;
  level?: string;
  lastUsed: Date;
  sessionId?: string; // Optional: associate with specific session
}

const STORAGE_KEY_PREFIX = "attendance_students_";
const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Get storage key for a session
 */
function getStorageKey(sessionId?: string): string {
  return sessionId
    ? `${STORAGE_KEY_PREFIX}${sessionId}`
    : `${STORAGE_KEY_PREFIX}global`;
}

/**
 * Save a student to local storage
 */
export async function saveStudent(
  student: LocalStudent,
  sessionId?: string
): Promise<void> {
  try {
    const key = getStorageKey(sessionId);
    const existing = await getAllStudents(sessionId);

    // Update if exists, otherwise add
    const updated = existing.filter(
      (s) => s.indexNumber !== student.indexNumber
    );
    updated.push({
      ...student,
      lastUsed: new Date(),
      sessionId,
    });

    await AsyncStorage.setItem(key, JSON.stringify(updated));
  } catch (error) {
    console.error("Failed to save student:", error);
    throw new Error("Failed to save student data");
  }
}

/**
 * Find a student by index number
 */
export async function findStudent(
  indexNumber: string,
  sessionId?: string
): Promise<LocalStudent | null> {
  try {
    const students = await getAllStudents(sessionId);
    return students.find((s) => s.indexNumber === indexNumber) || null;
  } catch (error) {
    console.error("Failed to find student:", error);
    return null;
  }
}

/**
 * Get all students for a session
 */
export async function getAllStudents(
  sessionId?: string
): Promise<LocalStudent[]> {
  try {
    const key = getStorageKey(sessionId);
    const data = await AsyncStorage.getItem(key);

    if (!data) return [];

    const students: LocalStudent[] = JSON.parse(data);

    // Parse dates back to Date objects
    return students.map((student) => ({
      ...student,
      lastUsed: new Date(student.lastUsed),
    }));
  } catch (error) {
    console.error("Failed to get students:", error);
    return [];
  }
}

/**
 * Remove a student from storage
 */
export async function removeStudent(
  indexNumber: string,
  sessionId?: string
): Promise<void> {
  try {
    const key = getStorageKey(sessionId);
    const existing = await getAllStudents(sessionId);
    const filtered = existing.filter((s) => s.indexNumber !== indexNumber);

    await AsyncStorage.setItem(key, JSON.stringify(filtered));
  } catch (error) {
    console.error("Failed to remove student:", error);
    throw new Error("Failed to remove student data");
  }
}

/**
 * Clear all students for a session
 */
export async function clearSessionStudents(sessionId?: string): Promise<void> {
  try {
    const key = getStorageKey(sessionId);
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error("Failed to clear session students:", error);
  }
}

/**
 * Clean up old student data (older than 24 hours)
 */
export async function cleanupOldData(sessionId?: string): Promise<void> {
  try {
    const students = await getAllStudents(sessionId);
    const now = new Date();
    const validStudents = students.filter(
      (student) => now.getTime() - student.lastUsed.getTime() < CLEANUP_INTERVAL
    );

    if (validStudents.length !== students.length) {
      const key = getStorageKey(sessionId);
      await AsyncStorage.setItem(key, JSON.stringify(validStudents));
    }
  } catch (error) {
    console.error("Failed to cleanup old data:", error);
  }
}

/**
 * Search students by partial index number or name
 */
export async function searchStudents(
  query: string,
  sessionId?: string
): Promise<LocalStudent[]> {
  try {
    const students = await getAllStudents(sessionId);
    const lowerQuery = query.toLowerCase();

    return students.filter(
      (student) =>
        student.indexNumber.toLowerCase().includes(lowerQuery) ||
        student.name.toLowerCase().includes(lowerQuery)
    );
  } catch (error) {
    console.error("Failed to search students:", error);
    return [];
  }
}
