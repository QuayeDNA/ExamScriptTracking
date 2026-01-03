// ========================================
// ENROLLMENT PROMPT UTILITIES
// Helper functions for enrollment prompt management
// ========================================

const DISMISS_KEY = 'enrollment_prompt_dismissed';

interface DismissalData {
  dismissed: boolean;
  timestamp: number;
}

/**
 * Check if enrollment prompt has been dismissed by user
 */
export function isEnrollmentPromptDismissed(): boolean {
  try {
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (!dismissed) return false;

    const data = JSON.parse(dismissed) as DismissalData;
    return data.dismissed === true;
  } catch (error) {
    console.error('Failed to check dismissal status:', error);
    return false;
  }
}

/**
 * Mark enrollment prompt as dismissed
 */
export function setEnrollmentPromptDismissed(): void {
  try {
    const data: DismissalData = {
      dismissed: true,
      timestamp: Date.now(),
    };
    localStorage.setItem(DISMISS_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save dismissal preference:', error);
  }
}

/**
 * Clear dismissal preference (useful for testing or reset)
 */
export function clearEnrollmentPromptDismissal(): void {
  try {
    localStorage.removeItem(DISMISS_KEY);
  } catch (error) {
    console.error('Failed to clear dismissal preference:', error);
  }
}
