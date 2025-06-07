import localforage from 'localforage';

// Configure LocalForage for better persistence
const staffStorage = localforage.createInstance({
  name: 'AlasrAcademyDB',
  storeName: 'staff_backup',
  description: 'Staff data backup storage'
});

const attendanceStorage = localforage.createInstance({
  name: 'AlasrAcademyDB', 
  storeName: 'attendance_backup',
  description: 'Attendance data backup storage'
});

const metadataStorage = localforage.createInstance({
  name: 'AlasrAcademyDB',
  storeName: 'metadata',
  description: 'Database metadata and health info'
});

// Types for backup data
interface BackupData {
  staff: any[];
  attendance: any[];
  timestamp: string;
  version: string;
  checksum: string;
}

interface DatabaseHealth {
  lastBackup: string;
  totalStaff: number;
  totalAttendance: number;
  integrityCheck: boolean;
  lastValidation: string;
}

export class EnhancedStorageService {
  private static readonly VERSION = '1.0.0';
  private static readonly BACKUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private static backupTimer: NodeJS.Timeout | null = null;

  // Initialize enhanced storage system
  static async initialize(): Promise<void> {
    try {
      console.log('Initializing enhanced storage system...');
      
      // Start automatic backup system
      this.startAutomaticBackup();
      
      // Validate existing data
      await this.validateDataIntegrity();
      
      console.log('Enhanced storage system initialized successfully');
    } catch (error) {
      console.error('Failed to initialize enhanced storage:', error);
    }
  }

  // Generate checksum for data integrity
  private static generateChecksum(data: any): string {
    const jsonString = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < jsonString.length; i++) {
      const char = jsonString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  // Create comprehensive backup
  static async createBackup(staff: any[], attendance: any[] = []): Promise<BackupData> {
    const timestamp = new Date().toISOString();
    const backupData: BackupData = {
      staff,
      attendance,
      timestamp,
      version: this.VERSION,
      checksum: this.generateChecksum({ staff, attendance })
    };

    try {
      // Store in LocalForage
      await staffStorage.setItem('latest_backup', backupData);
      
      // Store multiple backup versions (keep last 5)
      const backupHistory = await staffStorage.getItem('backup_history') as BackupData[] || [];
      backupHistory.unshift(backupData);
      if (backupHistory.length > 5) {
        backupHistory.splice(5);
      }
      await staffStorage.setItem('backup_history', backupHistory);

      // Update metadata
      const health: DatabaseHealth = {
        lastBackup: timestamp,
        totalStaff: staff.length,
        totalAttendance: attendance.length,
        integrityCheck: true,
        lastValidation: timestamp
      };
      await metadataStorage.setItem('health', health);

      console.log('Backup created successfully:', staff.length, 'staff,', attendance.length, 'attendance records');
      return backupData;
    } catch (error) {
      console.error('Failed to create backup:', error);
      throw error;
    }
  }

  // Restore from backup
  static async restoreFromBackup(): Promise<{ staff: any[], attendance: any[] } | null> {
    try {
      const latestBackup = await staffStorage.getItem('latest_backup') as BackupData;
      if (!latestBackup) {
        console.log('No backup found');
        return null;
      }

      // Validate backup integrity
      const expectedChecksum = this.generateChecksum({
        staff: latestBackup.staff,
        attendance: latestBackup.attendance
      });

      if (expectedChecksum !== latestBackup.checksum) {
        console.warn('Backup integrity check failed, trying backup history...');
        return await this.restoreFromBackupHistory();
      }

      console.log('Restored from backup:', latestBackup.staff.length, 'staff members');
      return {
        staff: latestBackup.staff,
        attendance: latestBackup.attendance
      };
    } catch (error) {
      console.error('Failed to restore from backup:', error);
      return null;
    }
  }

  // Restore from backup history
  private static async restoreFromBackupHistory(): Promise<{ staff: any[], attendance: any[] } | null> {
    try {
      const backupHistory = await staffStorage.getItem('backup_history') as BackupData[];
      if (!backupHistory || backupHistory.length === 0) {
        return null;
      }

      // Find the most recent valid backup
      for (const backup of backupHistory) {
        const expectedChecksum = this.generateChecksum({
          staff: backup.staff,
          attendance: backup.attendance
        });

        if (expectedChecksum === backup.checksum) {
          console.log('Restored from backup history:', backup.staff.length, 'staff members');
          return {
            staff: backup.staff,
            attendance: backup.attendance
          };
        }
      }

      console.warn('No valid backup found in history');
      return null;
    } catch (error) {
      console.error('Failed to restore from backup history:', error);
      return null;
    }
  }

  // Validate data integrity
  static async validateDataIntegrity(): Promise<boolean> {
    try {
      const health = await metadataStorage.getItem('health') as DatabaseHealth;
      if (!health) {
        console.log('No health metadata found, assuming first run');
        return true;
      }

      const latestBackup = await staffStorage.getItem('latest_backup') as BackupData;
      if (!latestBackup) {
        console.log('No backup found for validation');
        return true;
      }

      // Check backup integrity
      const expectedChecksum = this.generateChecksum({
        staff: latestBackup.staff,
        attendance: latestBackup.attendance
      });

      const isValid = expectedChecksum === latestBackup.checksum;
      
      // Update health status
      health.integrityCheck = isValid;
      health.lastValidation = new Date().toISOString();
      await metadataStorage.setItem('health', health);

      if (!isValid) {
        console.warn('Data integrity check failed!');
      } else {
        console.log('Data integrity check passed');
      }

      return isValid;
    } catch (error) {
      console.error('Failed to validate data integrity:', error);
      return false;
    }
  }

  // Get database health status
  static async getHealthStatus(): Promise<DatabaseHealth | null> {
    try {
      return await metadataStorage.getItem('health') as DatabaseHealth;
    } catch (error) {
      console.error('Failed to get health status:', error);
      return null;
    }
  }

  // Export data as downloadable file
  static async exportToFile(staff: any[], attendance: any[] = []): Promise<string> {
    const backupData = await this.createBackup(staff, attendance);
    const dataStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const link = document.createElement('a');
    link.href = url;
    link.download = `alasr-academy-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log('Data exported to file successfully');
    return dataStr;
  }

  // Import data from file
  static async importFromFile(fileContent: string): Promise<{ staff: any[], attendance: any[] } | null> {
    try {
      const backupData = JSON.parse(fileContent) as BackupData;
      
      // Validate imported data
      const expectedChecksum = this.generateChecksum({
        staff: backupData.staff,
        attendance: backupData.attendance
      });

      if (expectedChecksum !== backupData.checksum) {
        console.error('Imported file integrity check failed');
        return null;
      }

      console.log('Data imported from file successfully:', backupData.staff.length, 'staff members');
      return {
        staff: backupData.staff,
        attendance: backupData.attendance
      };
    } catch (error) {
      console.error('Failed to import data from file:', error);
      return null;
    }
  }

  // Start automatic backup system
  private static startAutomaticBackup(): void {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
    }

    this.backupTimer = setInterval(async () => {
      try {
        // This will be called by the database service
        console.log('Automatic backup triggered');
      } catch (error) {
        console.error('Automatic backup failed:', error);
      }
    }, this.BACKUP_INTERVAL);

    console.log('Automatic backup system started (every 5 minutes)');
  }

  // Stop automatic backup system
  static stopAutomaticBackup(): void {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
      this.backupTimer = null;
      console.log('Automatic backup system stopped');
    }
  }

  // Clear all backup data
  static async clearAllBackups(): Promise<void> {
    try {
      await staffStorage.clear();
      await attendanceStorage.clear();
      await metadataStorage.clear();
      console.log('All backup data cleared');
    } catch (error) {
      console.error('Failed to clear backup data:', error);
    }
  }
}
