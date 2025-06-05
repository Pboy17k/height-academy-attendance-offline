
// Local storage utilities for backup persistence and user data tracking
const STORAGE_KEYS = {
  STAFF: 'alasr_academy_staff',
  ATTENDANCE: 'alasr_academy_attendance',
  SETTINGS: 'alasr_academy_settings',
  USER_DATA_FLAG: 'alasr_academy_user_data_modified'
} as const;

export class LocalStorageBackup {
  // User data tracking
  static hasUserModifiedData(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEYS.USER_DATA_FLAG) === 'true';
    } catch (error) {
      console.error('Failed to check user data flag:', error);
      return false;
    }
  }

  static setUserDataModified(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.USER_DATA_FLAG, 'true');
      console.log('User data modification flag set');
    } catch (error) {
      console.error('Failed to set user data flag:', error);
    }
  }

  static clearUserDataFlag(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.USER_DATA_FLAG);
      console.log('User data modification flag cleared');
    } catch (error) {
      console.error('Failed to clear user data flag:', error);
    }
  }

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
