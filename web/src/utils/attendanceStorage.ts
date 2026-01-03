// ========================================
// STUDENT PERSONAL ATTENDANCE LEDGER
// Privacy-First Local Storage System
// ========================================

const STORAGE_KEY = 'student_attendance_history';
const MAX_RECORDS = 500; // Prevent storage overflow

export interface LocalAttendanceRecord {
  id: string;                     // Unique record ID
  timestamp: string;              // When marked (ISO format)
  
  // Session Info
  sessionId: string;
  courseCode: string;
  courseName: string;
  lecturerName: string;
  venue: string;
  sessionDate: string;
  
  // Student Info (cached)
  studentId: string;
  indexNumber: string;
  firstName: string;
  lastName: string;
  profilePictureUrl: string;      // base64 or cached URL
  program: string;
  level: number;
  
  // Verification Details
  verificationMethod: 'BIOMETRIC_FACE' | 'BIOMETRIC_FINGERPRINT' | 'QR_SCAN' | 'MANUAL';
  confidence?: number;            // If biometric (0-1)
  deviceId: string;
}

export interface AttendanceFilter {
  courseCode?: string;
  startDate?: string;             // ISO date
  endDate?: string;               // ISO date
  verificationMethod?: LocalAttendanceRecord['verificationMethod'];
}

export interface AttendanceStats {
  totalSessions: number;
  byMethod: Record<string, number>;
  byCourse: Record<string, number>;
  latestSession?: LocalAttendanceRecord;
  oldestSession?: LocalAttendanceRecord;
}

/**
 * Save a new attendance record to local storage
 */
export function saveAttendanceRecord(record: LocalAttendanceRecord): void {
  try {
    const records = getAllRecords();
    
    // Check for duplicate (same sessionId)
    const exists = records.some(r => r.sessionId === record.sessionId);
    if (exists) {
      console.warn('Attendance record already exists for this session');
      return;
    }
    
    // Add new record
    records.push(record);
    
    // Keep only latest MAX_RECORDS
    if (records.length > MAX_RECORDS) {
      records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      records.splice(MAX_RECORDS);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (error) {
    console.error('Failed to save attendance record:', error);
    throw new Error('Failed to save attendance record to local storage');
  }
}

/**
 * Get all attendance records
 */
export function getAllRecords(): LocalAttendanceRecord[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    
    const records = JSON.parse(data) as LocalAttendanceRecord[];
    
    // Sort by timestamp descending (newest first)
    return records.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  } catch (error) {
    console.error('Failed to retrieve attendance records:', error);
    return [];
  }
}

/**
 * Get filtered attendance records
 */
export function getFilteredRecords(filter: AttendanceFilter): LocalAttendanceRecord[] {
  const records = getAllRecords();
  
  return records.filter(record => {
    // Filter by course code
    if (filter.courseCode && record.courseCode !== filter.courseCode) {
      return false;
    }
    
    // Filter by date range
    if (filter.startDate) {
      const recordDate = new Date(record.sessionDate);
      const startDate = new Date(filter.startDate);
      if (recordDate < startDate) return false;
    }
    
    if (filter.endDate) {
      const recordDate = new Date(record.sessionDate);
      const endDate = new Date(filter.endDate);
      if (recordDate > endDate) return false;
    }
    
    // Filter by verification method
    if (filter.verificationMethod && record.verificationMethod !== filter.verificationMethod) {
      return false;
    }
    
    return true;
  });
}

/**
 * Get attendance statistics
 */
export function getAttendanceStats(): AttendanceStats {
  const records = getAllRecords();
  
  const stats: AttendanceStats = {
    totalSessions: records.length,
    byMethod: {},
    byCourse: {},
  };
  
  if (records.length === 0) return stats;
  
  // Count by method
  records.forEach(record => {
    stats.byMethod[record.verificationMethod] = 
      (stats.byMethod[record.verificationMethod] || 0) + 1;
    
    stats.byCourse[record.courseCode] = 
      (stats.byCourse[record.courseCode] || 0) + 1;
  });
  
  // Latest and oldest
  stats.latestSession = records[0];
  stats.oldestSession = records[records.length - 1];
  
  return stats;
}

/**
 * Get unique course codes from records
 */
export function getUniqueCourses(): string[] {
  const records = getAllRecords();
  const courses = new Set(records.map(r => r.courseCode));
  return Array.from(courses).sort();
}

/**
 * Delete a specific attendance record
 */
export function deleteRecord(recordId: string): void {
  try {
    const records = getAllRecords();
    const filtered = records.filter(r => r.id !== recordId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to delete record:', error);
    throw new Error('Failed to delete attendance record');
  }
}

/**
 * Clear all attendance records
 */
export function clearAllRecords(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear records:', error);
    throw new Error('Failed to clear attendance records');
  }
}

/**
 * Export attendance records to CSV
 */
export function exportToCSV(records?: LocalAttendanceRecord[]): void {
  const data = records || getAllRecords();
  
  if (data.length === 0) {
    throw new Error('No attendance records to export');
  }
  
  // CSV headers
  const headers = [
    'Date',
    'Time',
    'Index Number',
    'Name',
    'Course Code',
    'Course Name',
    'Lecturer',
    'Venue',
    'Verification Method',
    'Confidence',
  ];
  
  // CSV rows
  const rows = data.map(record => {
    const date = new Date(record.timestamp);
    const method = formatVerificationMethod(record.verificationMethod);
    const confidence = record.confidence ? `${(record.confidence * 100).toFixed(1)}%` : 'N/A';
    
    return [
      date.toLocaleDateString(),
      date.toLocaleTimeString(),
      record.indexNumber,
      `${record.firstName} ${record.lastName}`,
      record.courseCode,
      record.courseName,
      record.lecturerName,
      record.venue,
      method,
      confidence,
    ];
  });
  
  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  // Download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `attendance_history_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Get storage usage in KB
 */
export function getStorageSize(): number {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return 0;
    
    // Calculate size in KB
    return new Blob([data]).size / 1024;
  } catch {
    return 0;
  }
}

/**
 * Format verification method for display
 */
export function formatVerificationMethod(method: LocalAttendanceRecord['verificationMethod']): string {
  switch (method) {
    case 'BIOMETRIC_FACE':
      return 'Face ID';
    case 'BIOMETRIC_FINGERPRINT':
      return 'Fingerprint';
    case 'QR_SCAN':
      return 'QR Code';
    case 'MANUAL':
      return 'Manual Entry';
    default:
      return method;
  }
}

/**
 * Get icon for verification method
 */
export function getMethodIcon(method: LocalAttendanceRecord['verificationMethod']): string {
  switch (method) {
    case 'BIOMETRIC_FACE':
      return '👤';
    case 'BIOMETRIC_FINGERPRINT':
      return '👆';
    case 'QR_SCAN':
      return '📷';
    case 'MANUAL':
      return '⌨️';
    default:
      return '✓';
  }
}
