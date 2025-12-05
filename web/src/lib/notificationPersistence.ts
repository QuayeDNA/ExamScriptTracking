/**
 * Notification persistence utilities
 * Stores notifications in localStorage for persistence across sessions
 */

import type { Notification } from "@/store/notifications";

const STORAGE_KEY = "exam_tracking_notifications";
const MAX_STORED_NOTIFICATIONS = 100; // Limit storage size

/**
 * Load notifications from localStorage
 */
export function loadNotifications(): Notification[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const notifications = JSON.parse(stored) as Notification[];

    // Convert timestamp strings back to Date objects
    return notifications.map((n) => ({
      ...n,
      timestamp: new Date(n.timestamp),
    }));
  } catch (error) {
    console.error("Error loading notifications:", error);
    return [];
  }
}

/**
 * Save notifications to localStorage
 */
export function saveNotifications(notifications: Notification[]): void {
  try {
    // Keep only the most recent notifications
    const toStore = notifications.slice(0, MAX_STORED_NOTIFICATIONS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  } catch (error) {
    console.error("Error saving notifications:", error);

    // If quota exceeded, try clearing old data
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      try {
        const reduced = notifications.slice(0, 50);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(reduced));
      } catch {
        console.error("Failed to save even reduced notifications");
      }
    }
  }
}

/**
 * Clear all notifications from localStorage
 */
export function clearStoredNotifications(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Error clearing notifications:", error);
  }
}
