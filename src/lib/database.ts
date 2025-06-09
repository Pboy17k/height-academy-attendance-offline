
// Re-export everything from the new database/index file for backward compatibility
export * from './database/index';
import { 
  initializeDefaultAdmin as initDefault,
  StaffDB,
  AttendanceDB,
  AdminDB,
  SettingsDB,
  Staff,
  AttendanceRecord,
  Admin,
  AppSettings
} from './database/index';

// Legacy DatabaseService class for backward compatibility
export class DatabaseService {
  static async initializeDatabase() {
    return await initDefault();
  }

  static async initializeDefaultAdmin() {
    return await initDefault();
  }

  // Staff operations
  static async createStaff(staff: Omit<Staff, 'id' | 'createdAt'>): Promise<Staff> {
    return await StaffDB.create(staff);
  }

  static async getAllStaff(): Promise<Staff[]> {
    return await StaffDB.getAll();
  }

  static async getStaffById(id: string): Promise<Staff | null> {
    return await StaffDB.getById(id);
  }

  static async getStaffByStaffId(staffId: string): Promise<Staff | null> {
    return await StaffDB.getByStaffId(staffId);
  }

  static async updateStaff(id: string, updates: Partial<Staff>): Promise<Staff | null> {
    return await StaffDB.update(id, updates);
  }

  static async deleteStaff(id: string): Promise<boolean> {
    return await StaffDB.delete(id);
  }

  // Attendance operations
  static async recordAttendance(record: Omit<AttendanceRecord, 'id'>): Promise<AttendanceRecord> {
    return await AttendanceDB.create(record);
  }

  static async getAttendanceRecords(filters?: {
    startDate?: Date;
    endDate?: Date;
    staffId?: string;
    type?: 'check-in' | 'check-out';
  }): Promise<AttendanceRecord[]> {
    return await AttendanceDB.getAll(filters);
  }

  static async getTodayAttendance(): Promise<AttendanceRecord[]> {
    return await AttendanceDB.getToday();
  }

  static async getStaffLatestAttendance(staffId: string): Promise<AttendanceRecord | null> {
    return await AttendanceDB.getLatestForStaff(staffId);
  }

  // Admin operations
  static async createAdmin(admin: Omit<Admin, 'id' | 'createdAt'>): Promise<Admin> {
    return await AdminDB.create(admin);
  }

  static async getAdminByUsername(username: string): Promise<Admin | null> {
    return await AdminDB.getByUsername(username);
  }

  static async updateAdminLastLogin(id: string): Promise<void> {
    return await AdminDB.updateLastLogin(id);
  }

  // Settings operations
  static async getSettings(): Promise<AppSettings> {
    return await SettingsDB.get();
  }

  static async updateSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    return await SettingsDB.update(settings);
  }

  // Backup and restore methods (simplified for IndexedDB)
  static async backupData(): Promise<string> {
    try {
      const backup = {
        staff: await StaffDB.getAll(),
        attendance: await AttendanceDB.getAll(),
        settings: await SettingsDB.get(),
        timestamp: new Date().toISOString()
      };
      
      return JSON.stringify(backup);
    } catch (error) {
      console.error('Failed to backup data:', error);
      throw new Error('Failed to backup data');
    }
  }

  static async restoreData(backupData: string): Promise<boolean> {
    try {
      const backup = JSON.parse(backupData);
      
      // Note: This is a simplified restore - in production you'd want more sophisticated restore logic
      console.log('Restore functionality requires more sophisticated implementation with IndexedDB');
      console.log('Backup data structure:', backup);
      
      return true;
    } catch (error) {
      console.error('Failed to restore data:', error);
      return false;
    }
  }
}
