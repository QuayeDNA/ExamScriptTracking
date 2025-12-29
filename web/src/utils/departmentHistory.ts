/**
 * Department History Utility
 * Manages department name history for consistent input across the application
 * Stores department names locally to prevent typos and maintain consistency
 */

const STORAGE_KEY = 'examtrack_department_history';
const MAX_HISTORY_ITEMS = 50; // Limit to prevent storage bloat

export interface DepartmentHistoryItem {
  name: string;
  lastUsed: Date;
  usageCount: number;
}

/**
 * Get all stored department names from localStorage
 */
export function getDepartmentHistory(): DepartmentHistoryItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const history: DepartmentHistoryItem[] = JSON.parse(stored);
    // Parse dates back to Date objects
    return history.map(item => ({
      ...item,
      lastUsed: new Date(item.lastUsed)
    }));
  } catch (error) {
    console.error('Error loading department history:', error);
    return [];
  }
}

/**
 * Save a department name to history
 * Updates usage count and last used timestamp
 */
export function saveDepartmentToHistory(departmentName: string): void {
  if (!departmentName.trim()) return;

  try {
    const history = getDepartmentHistory();
    const trimmedName = departmentName.trim();

    // Find existing entry or create new one
    const existingIndex = history.findIndex(
      item => item.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (existingIndex >= 0) {
      // Update existing entry
      history[existingIndex].usageCount += 1;
      history[existingIndex].lastUsed = new Date();
      history[existingIndex].name = trimmedName; // Ensure exact casing is preserved
    } else {
      // Add new entry
      history.push({
        name: trimmedName,
        lastUsed: new Date(),
        usageCount: 1
      });
    }

    // Sort by usage count (most used first), then by last used
    history.sort((a, b) => {
      if (a.usageCount !== b.usageCount) {
        return b.usageCount - a.usageCount;
      }
      return b.lastUsed.getTime() - a.lastUsed.getTime();
    });

    // Limit history size
    const limitedHistory = history.slice(0, MAX_HISTORY_ITEMS);

    // Save back to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedHistory));
  } catch (error) {
    console.error('Error saving department to history:', error);
  }
}

/**
 * Get department names sorted for display (most used first)
 */
export function getDepartmentSuggestions(): string[] {
  const history = getDepartmentHistory();
  return history.map(item => item.name);
}

/**
 * Search department history for matches
 */
export function searchDepartments(query: string): string[] {
  if (!query.trim()) return getDepartmentSuggestions();

  const history = getDepartmentHistory();
  const lowerQuery = query.toLowerCase();

  return history
    .filter(item => item.name.toLowerCase().includes(lowerQuery))
    .sort((a, b) => {
      // Prioritize exact matches
      const aExact = a.name.toLowerCase() === lowerQuery;
      const bExact = b.name.toLowerCase() === lowerQuery;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;

      // Then by usage count
      if (a.usageCount !== b.usageCount) {
        return b.usageCount - a.usageCount;
      }

      // Finally by last used
      return b.lastUsed.getTime() - a.lastUsed.getTime();
    })
    .map(item => item.name);
}

/**
 * Remove a department from history
 */
export function removeDepartmentFromHistory(departmentName: string): void {
  try {
    const history = getDepartmentHistory();
    const filteredHistory = history.filter(
      item => item.name.toLowerCase() !== departmentName.toLowerCase()
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredHistory));
  } catch (error) {
    console.error('Error removing department from history:', error);
  }
}

/**
 * Clear all department history
 */
export function clearDepartmentHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing department history:', error);
  }
}

/**
 * Get usage statistics
 */
export function getDepartmentStats(): { totalDepartments: number; totalUsage: number } {
  const history = getDepartmentHistory();
  return {
    totalDepartments: history.length,
    totalUsage: history.reduce((sum, item) => sum + item.usageCount, 0)
  };
}