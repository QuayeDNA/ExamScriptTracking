/**
 * App Context Store
 * Manages which app (Exam or Attendance) the user is currently using
 * Remembers last selection for seamless UX
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useAuthStore } from './auth';

export type AppType = 'exam' | 'attendance';

// Role-based access control
const EXAM_APP_ROLES = [
  'ADMIN',
  'INVIGILATOR',
  'DEPARTMENT_HEAD',
  'FACULTY_OFFICER',
  'LECTURER',
] as const;

const ATTENDANCE_APP_ROLES = [
  'ADMIN',
  'LECTURER',
  'CLASS_REP',
  'DEPARTMENT_HEAD',    // Can also manage attendance
  'FACULTY_OFFICER',    // Can also manage attendance
] as const;

interface AppContextState {
  currentApp: AppType | null;
  lastUsedApp: AppType | null;
  isLoading: boolean;
  
  // Computed access permissions
  canAccessExamApp: boolean;
  canAccessAttendanceApp: boolean;
  canAccessBothApps: boolean;
  
  // Actions
  setCurrentApp: (app: AppType) => Promise<void>;
  switchApp: (app: AppType) => Promise<void>;
  loadLastUsedApp: () => Promise<void>;
  clearAppPreference: () => Promise<void>;
  
  // Access check utilities
  checkAccess: () => void;
}

export const useAppContext = create<AppContextState>((set, get) => ({
  currentApp: null,
  lastUsedApp: null,
  isLoading: true,
  canAccessExamApp: false,
  canAccessAttendanceApp: false,
  canAccessBothApps: false,
  
  /**
   * Check user's access to apps based on their role
   */
  checkAccess: () => {
    const { user } = useAuthStore.getState();
    
    if (!user) {
      set({
        canAccessExamApp: false,
        canAccessAttendanceApp: false,
        canAccessBothApps: false,
      });
      return;
    }
    
    const canAccessExam = EXAM_APP_ROLES.includes(user.role as any);
    const canAccessAttendance = ATTENDANCE_APP_ROLES.includes(user.role as any);
    
    console.log('🔐 Access Check:', {
      userRole: user.role,
      canAccessExam,
      canAccessAttendance,
      examRoles: EXAM_APP_ROLES,
      attendanceRoles: ATTENDANCE_APP_ROLES
    });
    
    set({
      canAccessExamApp: canAccessExam,
      canAccessAttendanceApp: canAccessAttendance,
      canAccessBothApps: canAccessExam && canAccessAttendance,
    });
  },
  
  /**
   * Load last used app from storage on app start
   */
  loadLastUsedApp: async () => {
    try {
      set({ isLoading: true });
      const lastApp = await AsyncStorage.getItem('lastUsedApp');
      
      if (lastApp === 'exam' || lastApp === 'attendance') {
        set({ 
          lastUsedApp: lastApp,
          currentApp: lastApp,
        });
      }
    } catch (error) {
      console.error('Error loading last used app:', error);
    } finally {
      set({ isLoading: false });
    }
  },
  
  /**
   * Set current app and save preference
   */
  setCurrentApp: async (app: AppType) => {
    try {
      await AsyncStorage.setItem('lastUsedApp', app);
      set({ 
        currentApp: app,
        lastUsedApp: app,
      });
    } catch (error) {
      console.error('Error saving app preference:', error);
    }
  },
  
  /**
   * Switch to a different app and navigate
   */
  switchApp: async (app: AppType) => {
    const { canAccessExamApp, canAccessAttendanceApp } = get();
    
    // Verify access before switching
    if (app === 'exam' && !canAccessExamApp) {
      console.warn('User does not have access to Exam app');
      return;
    }
    
    if (app === 'attendance' && !canAccessAttendanceApp) {
      console.warn('User does not have access to Attendance app');
      return;
    }
    
    // Save preference
    await get().setCurrentApp(app);
    
    // Navigate to the selected app
    if (app === 'exam') {
      router.replace('/(exam-tabs)' as any);
    } else {
      router.replace('/(attendance-tabs)' as any);
    }
  },
  
  /**
   * Clear app preference (useful on logout)
   */
  clearAppPreference: async () => {
    try {
      await AsyncStorage.removeItem('lastUsedApp');
      set({ 
        currentApp: null,
        lastUsedApp: null,
      });
    } catch (error) {
      console.error('Error clearing app preference:', error);
    }
  },
}));

/**
 * Export clearAppPreference for use in other modules
 */
export const clearAppPreference = () => {
  return useAppContext.getState().clearAppPreference();
};

/**
 * Hook to get user's accessible apps
 * Returns array of apps the user can access
 */
export const useAccessibleApps = () => {
  const { canAccessExamApp, canAccessAttendanceApp } = useAppContext();
  
  const apps: AppType[] = [];
  if (canAccessExamApp) apps.push('exam');
  if (canAccessAttendanceApp) apps.push('attendance');
  
  return apps;
};

/**
 * Initialize app context on auth state change
 */
export const initializeAppContext = async () => {
  const { loadLastUsedApp, checkAccess } = useAppContext.getState();
  
  // Check access permissions based on current user
  checkAccess();
  
  // Load last used app preference
  await loadLastUsedApp();
};
