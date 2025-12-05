import type { NotificationPreferences } from "@/types/notifications";
import { defaultPreferences } from "@/types/notifications";

const STORAGE_KEY = "exam_tracking_notification_preferences";

export function loadPreferences(): NotificationPreferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return defaultPreferences;
    }

    const parsed = JSON.parse(stored);
    return { ...defaultPreferences, ...parsed };
  } catch (error) {
    console.error("Failed to load notification preferences:", error);
    return defaultPreferences;
  }
}

export function savePreferences(preferences: NotificationPreferences): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    return true;
  } catch (error) {
    console.error("Failed to save notification preferences:", error);
    if (error instanceof Error && error.name === "QuotaExceededError") {
      console.warn("Storage quota exceeded. Preferences not saved.");
    }
    return false;
  }
}

export function resetPreferences(): NotificationPreferences {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return defaultPreferences;
  } catch (error) {
    console.error("Failed to reset notification preferences:", error);
    return defaultPreferences;
  }
}
