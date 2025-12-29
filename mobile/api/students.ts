/**
 * Students API Client for Mobile
 * Handles student lookup and creation for incident reporting
 */

import { apiClient } from "@/lib/api-client";

// ============================================
// Types & Interfaces
// ============================================

export interface Student {
  id: string | null;
  indexNumber: string;
  firstName: string;
  lastName: string;
  program: string;
  level: number | null;
  profilePicture?: string;
}

export interface StudentLookupResult {
  found: boolean;
  source?: "database" | "expected";
  student: Student | null;
}

export interface CreateStudentData {
  indexNumber: string;
  firstName: string;
  lastName: string;
  program: string;
  level: number;
}

// ============================================
// API Functions
// ============================================

/**
 * Lookup student by index number for incident reporting
 * Includes expected students from current exam session
 */
export const lookupStudentForIncident = async (
  indexNumber: string,
  examSessionId?: string
): Promise<StudentLookupResult> => {
  const params = new URLSearchParams({ indexNumber });
  if (examSessionId) {
    params.append("examSessionId", examSessionId);
  }

  const response = await apiClient.get(`/students/lookup?${params}`);
  return response as StudentLookupResult;
};

/**
 * Create a new student (for incident reporting when student doesn't exist)
 */
export const createStudent = async (
  data: CreateStudentData
): Promise<{ student: Student }> => {
  const response = await apiClient.post("/students", data);
  return response as { student: Student };
};

/**
 * Get student by index number (for QR lookup)
 */
export const getStudentByIndexNumber = async (
  indexNumber: string
): Promise<Student> => {
  const response = await apiClient.get(
    `/students/qr?indexNumber=${encodeURIComponent(indexNumber)}`
  );
  return response as Student;
};

/**
 * Search students by name or index number
 */
export const searchStudents = async (
  query: string,
  limit: number = 10
): Promise<{ students: Student[]; pagination: any }> => {
  const params = new URLSearchParams({
    search: query,
    limit: limit.toString(),
  });

  const response = await apiClient.get(`/students?${params}`);
  return response;
};
