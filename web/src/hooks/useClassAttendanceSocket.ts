import { useEffect, useCallback, useState } from 'react';
import { socketService } from '@/lib/socket';
import { useAuthStore } from '@/store/auth';
import { toast } from 'sonner';
import type {
  SessionStartedEvent,
  SessionEndedEvent,
  AttendanceRecordedEvent,
  LiveUpdateEvent,
  LinkGeneratedEvent,
  BiometricEnrolledEvent,
  AttendanceErrorEvent,
} from '@/types';

interface UseClassAttendanceSocketOptions {
  onSessionStarted?: (event: SessionStartedEvent) => void;
  onSessionEnded?: (event: SessionEndedEvent) => void;
  onAttendanceRecorded?: (event: AttendanceRecordedEvent) => void;
  onLiveUpdate?: (event: LiveUpdateEvent) => void;
  onLinkGenerated?: (event: LinkGeneratedEvent) => void;
  onBiometricEnrolled?: (event: BiometricEnrolledEvent) => void;
  onError?: (event: AttendanceErrorEvent) => void;
  sessionId?: string; // For joining specific session rooms
}

export function useClassAttendanceSocket(options: UseClassAttendanceSocketOptions = {}) {
  const {
    onSessionStarted,
    onSessionEnded,
    onAttendanceRecorded,
    onLiveUpdate,
    onLinkGenerated,
    onBiometricEnrolled,
    onError,
    sessionId,
  } = options;

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Join/leave session room
  const joinSession = useCallback((id: string) => {
    socketService.emit('attendance:joinSession', id);
  }, []);

  const leaveSession = useCallback((id: string) => {
    socketService.emit('attendance:leaveSession', id);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    // Connect socket if not already connected
    if (!socketService.isConnected()) {
      socketService.connect();
    }

    // Join session room if sessionId provided
    if (sessionId) {
      joinSession(sessionId);
    }

    // Event handlers
    const handleSessionStarted = (data: unknown) => {
      const event = data as SessionStartedEvent;
      console.log('Session started:', event);

      toast.success(`Session started: ${event.data.courseCode} - ${event.data.courseName}`);
      onSessionStarted?.(event);
    };

    const handleSessionEnded = (data: unknown) => {
      const event = data as SessionEndedEvent;
      console.log('Session ended:', event);

      toast.info(`Session ended: ${event.data.sessionId}`);
      onSessionEnded?.(event);
    };

    const handleAttendanceRecorded = (data: unknown) => {
      const event = data as AttendanceRecordedEvent;
      console.log('Attendance recorded:', event);

      toast.success('Attendance recorded successfully');
      onAttendanceRecorded?.(event);
    };

    const handleLiveUpdate = (data: unknown) => {
      const event = data as LiveUpdateEvent;
      console.log('Live update:', event);

      onLiveUpdate?.(event);
    };

    const handleLinkGenerated = (data: unknown) => {
      const event = data as LinkGeneratedEvent;
      console.log('Link generated:', event);

      toast.success('Attendance link generated');
      onLinkGenerated?.(event);
    };

    const handleBiometricEnrolled = (data: unknown) => {
      const event = data as BiometricEnrolledEvent;
      console.log('Biometric enrolled:', event);

      toast.success('Biometric enrollment completed');
      onBiometricEnrolled?.(event);
    };

    const handleError = (data: unknown) => {
      const event = data as AttendanceErrorEvent;
      console.error('Attendance error:', event);

      toast.error(event.data.error);
      onError?.(event);
    };

    // Register event listeners
    socketService.on('attendance:sessionStarted', handleSessionStarted);
    socketService.on('attendance:sessionEnded', handleSessionEnded);
    socketService.on('attendance:recorded', handleAttendanceRecorded);
    socketService.on('attendance:liveUpdate', handleLiveUpdate);
    socketService.on('attendance:linkGenerated', handleLinkGenerated);
    socketService.on('attendance:biometricEnrolled', handleBiometricEnrolled);
    socketService.on('attendance:error', handleError);

    // Cleanup function
    return () => {
      // Leave session room if joined
      if (sessionId) {
        leaveSession(sessionId);
      }

      // Remove event listeners
      socketService.off('attendance:sessionStarted', handleSessionStarted);
      socketService.off('attendance:sessionEnded', handleSessionEnded);
      socketService.off('attendance:recorded', handleAttendanceRecorded);
      socketService.off('attendance:liveUpdate', handleLiveUpdate);
      socketService.off('attendance:linkGenerated', handleLinkGenerated);
      socketService.off('attendance:biometricEnrolled', handleBiometricEnrolled);
      socketService.off('attendance:error', handleError);
    };
  }, [
    isAuthenticated,
    sessionId,
    joinSession,
    leaveSession,
    onSessionStarted,
    onSessionEnded,
    onAttendanceRecorded,
    onLiveUpdate,
    onLinkGenerated,
    onBiometricEnrolled,
    onError,
  ]);

  return {
    isConnected: socketService.isConnected(),
    joinSession,
    leaveSession,
  };
}

// Specialized hook for session monitoring
export function useSessionMonitor(sessionId: string | null) {
  const [liveStats, setLiveStats] = useState<{
    sessionId: string;
    totalRecorded: number;
    totalExpected: number;
    attendanceRate: number;
  } | null>(null);

  const socketOptions: UseClassAttendanceSocketOptions = {
    sessionId: sessionId || undefined,
    onLiveUpdate: (event) => {
      setLiveStats(event.data);
    },
    onAttendanceRecorded: () => {
      // Could trigger a refetch of session details here
    },
  };

  const { isConnected } = useClassAttendanceSocket(socketOptions);

  return {
    liveStats,
    isConnected,
  };
}