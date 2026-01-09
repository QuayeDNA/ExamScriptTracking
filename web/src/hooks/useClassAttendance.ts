import { useState, useEffect, useCallback } from 'react';
import { classAttendanceApi } from '@/api/classAttendance';
import type {
  ClassAttendanceSession,
  AttendanceLink,
  AttendanceHistoryFilters,
  AnalyticsFilters,
  ValidateLinkResponse,
  SelfMarkAttendanceRequest,
  SelfMarkAttendanceResponse,
  AttendanceHistoryResponse,
  SessionDetailsResponse,
  CreateSessionRequest,
  CreateSessionResponse,
  GenerateLinkRequest,
  GenerateLinkResponse,
  AttendanceAnalyticsResponse,
} from '@/types';

// Hook for validating attendance links
export function useValidateAttendanceLink() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateLink = useCallback(async (
    token: string,
    lat?: number,
    lng?: number
  ): Promise<ValidateLinkResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await classAttendanceApi.validateAttendanceLink(token, lat, lng);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to validate link';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { validateLink, isLoading, error };
}

// Hook for self-marking attendance
export function useSelfMarkAttendance() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const markAttendance = useCallback(async (
    data: SelfMarkAttendanceRequest
  ): Promise<SelfMarkAttendanceResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await classAttendanceApi.selfMarkAttendance(data);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark attendance';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { markAttendance, isLoading, error };
}

// Hook for attendance history
export function useAttendanceHistory() {
  const [data, setData] = useState<AttendanceHistoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async (filters: AttendanceHistoryFilters = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await classAttendanceApi.getAttendanceHistory(filters);
      setData(response);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch attendance history';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { data, isLoading, error, fetchHistory, refetch: fetchHistory };
}

// Hook for active sessions
export function useActiveSessions() {
  const [sessions, setSessions] = useState<ClassAttendanceSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await classAttendanceApi.getActiveSessions();
      setSessions(response.data);
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch active sessions';
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return { sessions, isLoading, error, refetch: fetchSessions };
}

// Hook for session details
export function useSessionDetails(sessionId: string | null) {
  const [data, setData] = useState<SessionDetailsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetails = useCallback(async () => {
    if (!sessionId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await classAttendanceApi.getSessionDetails(sessionId);
      setData(response);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch session details';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (sessionId) {
      fetchDetails();
    }
  }, [sessionId, fetchDetails]);

  return { data, isLoading, error, refetch: fetchDetails };
}

// Hook for creating sessions
export function useCreateSession() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSession = useCallback(async (
    data: CreateSessionRequest
  ): Promise<CreateSessionResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await classAttendanceApi.createSession(data);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create session';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { createSession, isLoading, error };
}

// Hook for ending sessions
export function useEndSession() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const endSession = useCallback(async (sessionId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await classAttendanceApi.endSession(sessionId);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to end session';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { endSession, isLoading, error };
}

// Hook for generating links
export function useGenerateLink() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateLink = useCallback(async (
    sessionId: string,
    data: GenerateLinkRequest
  ): Promise<GenerateLinkResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await classAttendanceApi.generateAttendanceLink(sessionId, data);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate link';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { generateLink, isLoading, error };
}

// Hook for active links
export function useActiveLinks(sessionId: string | null) {
  const [links, setLinks] = useState<AttendanceLink[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLinks = useCallback(async () => {
    if (!sessionId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await classAttendanceApi.getActiveLinks(sessionId);
      setLinks(response.data);
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch active links';
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (sessionId) {
      fetchLinks();
    }
  }, [sessionId, fetchLinks]);

  return { links, isLoading, error, refetch: fetchLinks };
}

// Hook for revoking links
export function useRevokeLink() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const revokeLink = useCallback(async (token: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await classAttendanceApi.revokeLink(token);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to revoke link';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { revokeLink, isLoading, error };
}

// Hook for analytics
export function useAttendanceAnalytics() {
  const [data, setData] = useState<AttendanceAnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async (filters: AnalyticsFilters) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await classAttendanceApi.getAttendanceAnalytics(filters);
      setData(response);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch analytics';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { data, isLoading, error, fetchAnalytics };
}

// Hook for exporting data
export function useExportData() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportSessionData = useCallback(async (sessionId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const blob = await classAttendanceApi.exportSessionData(sessionId);
      return blob;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export data';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const exportAttendanceData = useCallback(async (filters: {
    startDate?: string;
    endDate?: string;
    courseCode?: string;
    lecturerId?: string;
  } = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const blob = await classAttendanceApi.exportAttendanceData(filters);
      return blob;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export data';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { exportSessionData, exportAttendanceData, isLoading, error };
}