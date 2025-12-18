import { create } from "zustand";
import { storage } from "@/utils/storage";

interface ExamSession {
  id: string;
  courseCode: string;
  courseName: string;
  venue: string;
  batchQrCode: string;
  status?: string;
}

interface SessionState {
  currentSession: ExamSession | null;
  hasRecordedFirstAttendance: boolean;
  setCurrentSession: (session: ExamSession | null) => void;
  setFirstAttendanceRecorded: (recorded: boolean) => void;
  clearSession: () => void;
  initialize: () => Promise<void>;
}

const SESSION_KEY = "current_exam_session";
const FIRST_ATTENDANCE_KEY = "first_attendance_recorded";

export const useSessionStore = create<SessionState>((set, get) => ({
  currentSession: null,
  hasRecordedFirstAttendance: false,

  setCurrentSession: async (session) => {
    set({ currentSession: session });
    if (session) {
      await storage.setItem(SESSION_KEY, JSON.stringify(session));
    } else {
      await storage.deleteItem(SESSION_KEY);
    }
  },

  setFirstAttendanceRecorded: async (recorded) => {
    set({ hasRecordedFirstAttendance: recorded });
    await storage.setItem(FIRST_ATTENDANCE_KEY, recorded.toString());
  },

  clearSession: async () => {
    set({ currentSession: null, hasRecordedFirstAttendance: false });
    await Promise.all([
      storage.deleteItem(SESSION_KEY),
      storage.deleteItem(FIRST_ATTENDANCE_KEY),
    ]);
  },

  initialize: async () => {
    try {
      const sessionData = await storage.getItem(SESSION_KEY);
      const firstAttendanceData = await storage.getItem(FIRST_ATTENDANCE_KEY);

      if (sessionData) {
        const session = JSON.parse(sessionData);
        set({ currentSession: session });
      }

      if (firstAttendanceData) {
        const recorded = firstAttendanceData === "true";
        set({ hasRecordedFirstAttendance: recorded });
      }
    } catch (error) {
      console.error("Error initializing session store:", error);
    }
  },
}));
