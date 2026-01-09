import { apiClient } from '@/lib/api-client';
import type {
  AttendanceSession,
  StudentAttendance,
  AttendanceLink,
  BulkConfirmResponse,
  BulkRecordRequest,
  BulkRecordResponse,
  CreateSessionRequest,
  CreateSessionResponse,
  GenerateLinkRequest,
  RecordAttendanceRequest,
  RecordAttendanceResponse,
  BulkConfirmRequest,
  UpdateStatusRequest,
  Student
} from '@/types';

// Session Management
export async function createSession(data: CreateSessionRequest): Promise<CreateSessionResponse> {
  const response = await apiClient.post<CreateSessionResponse>('/class-attendance/sessions', data);
  return response;
}

export async function getActiveSessions(): Promise<AttendanceSession[]> {
  const response = await apiClient.get<{ data?: AttendanceSession[] }>('/class-attendance/sessions/active');
  return response.data || [];
}

export async function getSessionDetails(sessionId: string): Promise<any> {
  const response = await apiClient.get<{ data?: any }>(`/class-attendance/sessions/${sessionId}`);
  return response.data;
}

export async function endSession(sessionId: string): Promise<{ message: string }> {
  const response = await apiClient.post<{ message?: string }>(`/class-attendance/sessions/${sessionId}/end`);
  return { message: response.message || 'Session ended successfully' };
}

export async function deleteSession(sessionId: string): Promise<{ message: string }> {
  const response = await apiClient.delete<{ message?: string }>(`/class-attendance/sessions/${sessionId}`);
  return { message: response.message || 'Session deleted successfully' };
}

// Recording Attendance
export async function recordAttendance(
  sessionId: string,
  data: RecordAttendanceRequest
): Promise<RecordAttendanceResponse> {
  const response = await apiClient.post<RecordAttendanceResponse>(
    `/class-attendance/sessions/${sessionId}/record`,
    data
  );
  return response;
}

export async function recordBulkAttendance(
  sessionId: string,
  data: BulkRecordRequest
): Promise<BulkRecordResponse> {
  const response = await apiClient.post<BulkRecordResponse>(
    `/class-attendance/sessions/${sessionId}/record/bulk`,
    data
  );
  return response;
}

// Student Search
export async function searchStudents(query: string): Promise<Student[]> {
  const response = await apiClient.get<{ data?: { students?: Student[] } }>('/class-attendance/students/search', {
    params: { q: query, limit: 10 }
  });
  return response.data?.students || [];
}

// Link Generation
export async function generateAttendanceLink(
  sessionId: string,
  data: GenerateLinkRequest
): Promise<AttendanceLink> {
  const response = await apiClient.post<{ data?: AttendanceLink }>(
    `/class-attendance/sessions/${sessionId}/links`,
    data
  );
  return response.data!;
}

export async function getActiveLinks(sessionId: string): Promise<AttendanceLink[]> {
  const response = await apiClient.get<{ data?: AttendanceLink[] }>(`/class-attendance/sessions/${sessionId}/links`);
  return response.data || [];
}

export async function revokeLink(token: string): Promise<{ message: string }> {
  const response = await apiClient.delete<{ message?: string }>(`/class-attendance/links/${token}`);
  return { message: response.message || 'Link revoked successfully' };
}

// Assistant Management
export async function addAssistant(
  sessionId: string,
  assistantId: string
): Promise<{ message: string }> {
  const response = await apiClient.post<{ message?: string }>(
    `/class-attendance/sessions/${sessionId}/assistants`,
    { assistantId }
  );
  return { message: response.message || 'Assistant added successfully' };
}

export async function removeAssistant(
  sessionId: string,
  assistantId: string
): Promise<{ message: string }> {
  const response = await apiClient.delete<{ message?: string }>(
    `/class-attendance/sessions/${sessionId}/assistants/${assistantId}`
  );
  return { message: response.message || 'Assistant removed successfully' };
}

// Bulk Operations
export async function bulkConfirmAttendance(
  sessionId: string,
  data: BulkConfirmRequest
): Promise<BulkConfirmResponse> {
  const response = await apiClient.post<BulkConfirmResponse>(
    `/class-attendance/sessions/${sessionId}/confirm-bulk`, 
    data
  );
  return response;
}

// Update/Delete Individual Records
export async function updateAttendanceStatus(
  attendanceId: string,
  data: UpdateStatusRequest
): Promise<StudentAttendance> {
  const response = await apiClient.patch<{ data?: StudentAttendance }>(
    `/class-attendance/${attendanceId}`,
    data
  );
  return response.data!;
}

export async function deleteAttendance(attendanceId: string): Promise<{ message: string }> {
  const response = await apiClient.delete<{ message?: string }>(`/class-attendance/${attendanceId}`);
  return { message: response.message || 'Attendance record deleted successfully' };
}

// Templates
export async function saveSessionTemplate(
  data: { name: string; courseCode: string; courseName: string; venue?: string; expectedStudentCount?: number }
): Promise<{ templateId: string; message: string }> {
  const response = await apiClient.post<{ data?: { templateId?: string }; message?: string }>(
    '/class-attendance/templates', 
    data
  );
  return { 
    templateId: response.data?.templateId || '', 
    message: response.message || 'Template saved successfully' 
  };
}

export async function createFromTemplate(templateId: string): Promise<CreateSessionResponse> {
  const response = await apiClient.post<CreateSessionResponse>(
    '/class-attendance/sessions/from-template',
    { templateId }
  );
  return response;
}

// History & Export
export async function getAttendanceHistory(params?: {
  page?: number;
  limit?: number;
  courseCode?: string;
  startDate?: string;
  endDate?: string;
}): Promise<{
  sessions: AttendanceSession[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const response = await apiClient.get<{
    data?: {
      sessions: AttendanceSession[];
      total: number;
      page: number;
      totalPages: number;
    }
  }>('/class-attendance/history', { params });
  
  return response.data || {
    sessions: [],
    total: 0,
    page: 1,
    totalPages: 0
  };
}

export async function exportSession(sessionId: string): Promise<Blob> {
  // For blob responses, we need to bypass the apiClient's response transformation
  const response = await apiClient.rawClient.get(
    `/class-attendance/sessions/${sessionId}/export`,
    { responseType: 'blob' }
  );
  return response.data;
}