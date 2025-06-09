import { EnhancedStorageService } from './enhancedStorage';

// Local storage utilities for backup persistence and user data tracking
const STORAGE_KEYS = {
  STAFF: 'alasr_academy_staff_backup',
  ATTENDANCE: 'alasr_academy_attendance_backup',
  SETTINGS: 'alasr_academy_settings_backup',
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
      console.log('🔒 Data persistence flag set - data will be preserved');
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

  // Enhanced staff backup operations with multiple redundancy
  static async backupStaff(staff: any[]): Promise<void> {
    try {
      const timestamp = new Date().toISOString();
      const backupData = {
        staff,
        timestamp,
        count: staff.length,
        version: '2.0'
      };

      // Primary backup to localStorage
      localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(backupData));
      
      // Enhanced backup with LocalForage
      await EnhancedStorageService.createBackup(staff);
      
      console.log('💾 Staff data backed up successfully:', staff.length, 'members');
    } catch (error) {
      console.error('❌ Failed to backup staff:', error);
      // Fallback to localStorage only
      try {
        const timestamp = new Date().toISOString();
        const backupData = { staff, timestamp, count: staff.length };
        localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(backupData));
        console.log('💾 Staff data backed up to localStorage (fallback)');
      } catch (fallbackError) {
        console.error('❌ Complete backup failure:', fallbackError);
      }
    }
  }

  static async getStaffBackup(): Promise<any[]> {
    try {
      // First try enhanced storage
      const enhancedBackup = await EnhancedStorageService.restoreFromBackup();
      if (enhancedBackup && enhancedBackup.staff.length > 0) {
        console.log('📦 Staff loaded from enhanced storage:', enhancedBackup.staff.length, 'members');
        return enhancedBackup.staff;
      }

      // Fallback to localStorage
      const data = localStorage.getItem(STORAGE_KEYS.STAFF);
      if (!data) {
        console.log('📦 No staff backup found');
        return [];
      }
      
      const parsed = JSON.parse(data);
      const staff = Array.isArray(parsed) ? parsed : (parsed.staff || []);
      
      console.log('📦 Staff loaded from localStorage backup:', staff.length, 'members');
      return staff;
    } catch (error) {
      console.error('❌ Failed to get staff backup:', error);
      return [];
    }
  }

  // Attendance backup operations with enhanced storage
  static async backupAttendance(attendance: any[]): Promise<void> {
    try {
      // Traditional localStorage backup
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendance));
      
      // Enhanced backup (will be integrated when attendance data is available)
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

  // Enhanced data export/import methods
  static async exportData(staff: any[], attendance: any[] = []): Promise<void> {
    try {
      await EnhancedStorageService.exportToFile(staff, attendance);
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  }

  static async importData(fileContent: string): Promise<{ staff: any[], attendance: any[] } | null> {
    try {
      return await EnhancedStorageService.importFromFile(fileContent);
    } catch (error) {
      console.error('Failed to import data:', error);
      return null;
    }
  }

  // Get database health status
  static async getHealthStatus() {
    try {
      return await EnhancedStorageService.getHealthStatus();
    } catch (error) {
      console.error('Failed to get health status:', error);
      return null;
    }
  }

  // Clear all backup data
  static async clearAllBackups(): Promise<void> {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      await EnhancedStorageService.clearAllBackups();
      console.log('All localStorage and enhanced storage backups cleared');
    } catch (error) {
      console.error('Failed to clear all backups:', error);
    }
  }
}
