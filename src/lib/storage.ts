
// Local storage utilities for backup persistence
const STORAGE_KEYS = {
  STAFF: 'alasr_academy_staff',
  ATTENDANCE: 'alasr_academy_attendance',
  SETTINGS: 'alasr_academy_settings'
} as const;

export class LocalStorageBackup {
  // Staff backup operations
  static backupStaff(staff: any[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(staff));
      console.log('Staff data backed up to localStorage');
    } catch (error) {
      console.error('Failed to backup staff to localStorage:', error);
    }
  }

  static getStaffBackup(): any[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STAFF);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get staff backup from localStorage:', error);
      return [];
    }
  }

  // Attendance backup operations
  static backupAttendance(attendance: any[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendance));
      console.log('Attendance data backed up to localStorage');
    } catch (error) {
      console.error('Failed to backup attendance to localStorage:', error);
    }
  }

  static getAttendanceBackup(): any[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get attendance backup from localStorage:', error);
      return [];
    }
  }

  // Settings backup operations
  static backupSettings(settings: any): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      console.log('Settings backed up to localStorage');
    } catch (error) {
      console.error('Failed to backup settings to localStorage:', error);
    }
  }

  static getSettingsBackup(): any | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to get settings backup from localStorage:', error);
      return null;
    }
  }

  // Clear all backup data
  static clearAllBackups(): void {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      console.log('All localStorage backups cleared');
    } catch (error) {
      console.error('Failed to clear localStorage backups:', error);
    }
  }
}
