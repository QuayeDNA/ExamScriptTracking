/**
 * Public Attendance API Helper
 * 
 * These endpoints do NOT require authentication and bypass the API client guard.
 * Used for student self-service attendance marking.
 */

const API_BASE = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api` 
  : '/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface SessionInfo {
  id: string;
  courseCode: string;
  courseName: string;
  lecturerName?: string;
  venue?: string;
  startTime: string;
}

interface StudentInfo {
  id: string;
  indexNumber: string;
  firstName: string;
  lastName: string;
}

interface AttendanceResult {
  attendance: {
    id: string;
    sessionId: string;
    studentId: string;
    markedAt: string;
    requiresConfirmation: boolean;
  };
  message?: string;
}

/**
 * Base fetch wrapper with error handling
 */
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || data.message || `HTTP ${response.status}`,
      };
    }

    return {
      success: true,
      data: data.data || data,
      message: data.message,
    };
  } catch (error) {
    console.error('API Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Validate attendance link token
 */
export async function validateAttendanceLink(
  token: string,
  location?: { lat: number; lng: number }
): Promise<ApiResponse<SessionInfo>> {
  const params = new URLSearchParams();
  if (location?.lat) params.append('lat', location.lat.toString());
  if (location?.lng) params.append('lng', location.lng.toString());
  const query = params.toString() ? `?${params.toString()}` : '';

  return apiFetch<SessionInfo>(
    `/class-attendance/links/${token}/validate${query}`,
    { method: 'GET' }
  );
}

/**
 * Lookup student by index number
 */
export async function lookupStudent(
  indexNumber: string
): Promise<ApiResponse<StudentInfo>> {
  return apiFetch<StudentInfo>(
    `/students/qr?indexNumber=${encodeURIComponent(indexNumber)}`,
    { method: 'GET' }
  );
}

/**
 * Self-mark attendance
 */
export async function selfMarkAttendance(
  linkToken: string,
  studentId: string,
  location?: { lat: number; lng: number }
): Promise<ApiResponse<AttendanceResult>> {
  return apiFetch<AttendanceResult>(
    '/class-attendance/self-mark',
    {
      method: 'POST',
      body: JSON.stringify({
        linkToken,
        studentId,
        location,
      }),
    }
  );
}

/**
 * Combined workflow: validate -> lookup -> mark
 * Returns a generator for step-by-step progress tracking
 */
export async function* markAttendanceWorkflow(
  token: string,
  indexNumber: string,
  location?: { lat: number; lng: number }
) {
  // Step 1: Validate token
  yield { step: 'validating', progress: 33 };
  const sessionResult = await validateAttendanceLink(token, location);
  
  if (!sessionResult.success || !sessionResult.data) {
    throw new Error(sessionResult.error || 'Invalid link');
  }
  
  yield { 
    step: 'validated', 
    progress: 40,
    session: sessionResult.data 
  };

  // Step 2: Lookup student
  yield { step: 'looking-up', progress: 60 };
  const studentResult = await lookupStudent(indexNumber);
  
  if (!studentResult.success || !studentResult.data) {
    throw new Error(studentResult.error || 'Student not found');
  }
  
  yield { 
    step: 'found-student', 
    progress: 70,
    student: studentResult.data 
  };

  // Step 3: Mark attendance
  yield { step: 'marking', progress: 85 };
  const markResult = await selfMarkAttendance(
    token,
    studentResult.data.id,
    location
  );
  
  if (!markResult.success) {
    throw new Error(markResult.error || 'Failed to mark attendance');
  }
  
  yield { 
    step: 'complete', 
    progress: 100,
    result: markResult.data 
  };
}

/**
 * Export for use in components
 */
export const publicAttendanceApi = {
  validateLink: validateAttendanceLink,
  lookupStudent,
  markAttendance: selfMarkAttendance,
  workflow: markAttendanceWorkflow,
};