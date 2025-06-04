import localforage from 'localforage';

// Enhanced configuration for better persistence
const dbConfig = {
  name: 'AlasrAcademy',
  version: 1.0,
  description: 'Al\'asr Comprehensive Academy Attendance Management System'
};

// Configure localforage instances with enhanced settings
const staffDB = localforage.createInstance({
  ...dbConfig,
  storeName: 'staff',
  driver: [localforage.INDEXEDDB, localforage.WEBSQL, localforage.LOCALSTORAGE]
});

const attendanceDB = localforage.createInstance({
  ...dbConfig,
  storeName: 'attendance',
  driver: [localforage.INDEXEDDB, localforage.WEBSQL, localforage.LOCALSTORAGE]
});

const adminDB = localforage.createInstance({
  ...dbConfig,
  storeName: 'admin',
  driver: [localforage.INDEXEDDB, localforage.WEBSQL, localforage.LOCALSTORAGE]
});

const settingsDB = localforage.createInstance({
  ...dbConfig,
  storeName: 'settings',
  driver: [localforage.INDEXEDDB, localforage.WEBSQL, localforage.LOCALSTORAGE]
});

// Types
export interface Staff {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  staffId: string;
  department: string;
  role: string;
  photo: string; // base64 encoded image
  fingerprintId?: string;
  createdAt: Date;
  isActive: boolean;
}

export interface AttendanceRecord {
  id: string;
  staffId: string;
  staffName: string;
  type: 'check-in' | 'check-out';
  timestamp: Date;
  method: 'fingerprint' | 'manual';
  deviceInfo?: string;
}

export interface Admin {
  id: string;
  username: string;
  passwordHash: string;
  fullName: string;
  email: string;
  role: 'super-admin' | 'admin';
  createdAt: Date;
  lastLogin?: Date;
}

export interface AppSettings {
  theme: 'light' | 'dark';
  autoLogout: number; // minutes
  requireFingerprint: boolean;
  workingHours: {
    start: string;
    end: string;
  };
}

// Database operations with enhanced error handling and persistence
export class DatabaseService {
  
  // Initialize database with error handling
  static async initializeDatabase(): Promise<void> {
    try {
      await Promise.all([
        staffDB.ready(),
        attendanceDB.ready(),
        adminDB.ready(),
        settingsDB.ready()
      ]);
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw new Error('Failed to initialize database');
    }
  }

  // Enhanced staff operations with better error handling
  static async createStaff(staff: Omit<Staff, 'id' | 'createdAt'>): Promise<Staff> {
    try {
      const newStaff: Staff = {
        ...staff,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        isActive: true
      };
      
      await staffDB.setItem(newStaff.id, newStaff);
      console.log('Staff created successfully:', newStaff.fullName);
      return newStaff;
    } catch (error) {
      console.error('Failed to create staff:', error);
      throw new Error('Failed to create staff member');
    }
  }

  static async getAllStaff(): Promise<Staff[]> {
    try {
      const staff: Staff[] = [];
      await staffDB.iterate((value: Staff) => {
        staff.push(value);
      });
      return staff.sort((a, b) => a.fullName.localeCompare(b.fullName));
    } catch (error) {
      console.error('Failed to get staff:', error);
      return [];
    }
  }

  static async getStaffById(id: string): Promise<Staff | null> {
    try {
      return await staffDB.getItem(id);
    } catch (error) {
      console.error('Failed to get staff by ID:', error);
      return null;
    }
  }

  static async getStaffByStaffId(staffId: string): Promise<Staff | null> {
    try {
      const allStaff = await this.getAllStaff();
      return allStaff.find(s => s.staffId === staffId) || null;
    } catch (error) {
      console.error('Failed to get staff by staff ID:', error);
      return null;
    }
  }

  static async updateStaff(id: string, updates: Partial<Staff>): Promise<Staff | null> {
    try {
      const existing = await staffDB.getItem<Staff>(id);
      if (!existing) return null;
      
      const updated = { ...existing, ...updates };
      await staffDB.setItem(id, updated);
      console.log('Staff updated successfully:', updated.fullName);
      return updated;
    } catch (error) {
      console.error('Failed to update staff:', error);
      return null;
    }
  }

  static async deleteStaff(id: string): Promise<boolean> {
    try {
      await staffDB.removeItem(id);
      console.log('Staff deleted successfully');
      return true;
    } catch (error) {
      console.error('Failed to delete staff:', error);
      return false;
    }
  }

  // Enhanced attendance operations
  static async recordAttendance(record: Omit<AttendanceRecord, 'id'>): Promise<AttendanceRecord> {
    try {
      const newRecord: AttendanceRecord = {
        ...record,
        id: crypto.randomUUID()
      };
      
      await attendanceDB.setItem(newRecord.id, newRecord);
      console.log('Attendance recorded successfully:', newRecord.staffName, newRecord.type);
      return newRecord;
    } catch (error) {
      console.error('Failed to record attendance:', error);
      throw new Error('Failed to record attendance');
    }
  }

  static async getAttendanceRecords(filters?: {
    startDate?: Date;
    endDate?: Date;
    staffId?: string;
    type?: 'check-in' | 'check-out';
  }): Promise<AttendanceRecord[]> {
    try {
      const records: AttendanceRecord[] = [];
      
      await attendanceDB.iterate((value: AttendanceRecord) => {
        let include = true;
        
        if (filters?.startDate && new Date(value.timestamp) < filters.startDate) {
          include = false;
        }
        if (filters?.endDate && new Date(value.timestamp) > filters.endDate) {
          include = false;
        }
        if (filters?.staffId && value.staffId !== filters.staffId) {
          include = false;
        }
        if (filters?.type && value.type !== filters.type) {
          include = false;
        }
        
        if (include) {
          records.push(value);
        }
      });
      
      return records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.error('Failed to get attendance records:', error);
      return [];
    }
  }

  static async getTodayAttendance(): Promise<AttendanceRecord[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return this.getAttendanceRecords({
      startDate: today,
      endDate: tomorrow
    });
  }

  static async getStaffLatestAttendance(staffId: string): Promise<AttendanceRecord | null> {
    const records = await this.getAttendanceRecords({ staffId });
    return records.length > 0 ? records[0] : null;
  }

  // Enhanced admin operations
  static async createAdmin(admin: Omit<Admin, 'id' | 'createdAt'>): Promise<Admin> {
    try {
      const newAdmin: Admin = {
        ...admin,
        id: crypto.randomUUID(),
        createdAt: new Date()
      };
      
      await adminDB.setItem(newAdmin.id, newAdmin);
      console.log('Admin created successfully:', newAdmin.username);
      return newAdmin;
    } catch (error) {
      console.error('Failed to create admin:', error);
      throw new Error('Failed to create admin');
    }
  }

  static async getAdminByUsername(username: string): Promise<Admin | null> {
    try {
      const admins: Admin[] = [];
      await adminDB.iterate((value: Admin) => {
        admins.push(value);
      });
      
      return admins.find(a => a.username === username) || null;
    } catch (error) {
      console.error('Failed to get admin:', error);
      return null;
    }
  }

  static async updateAdminLastLogin(id: string): Promise<void> {
    try {
      const admin = await adminDB.getItem<Admin>(id);
      if (admin) {
        admin.lastLogin = new Date();
        await adminDB.setItem(id, admin);
        console.log('Admin last login updated');
      }
    } catch (error) {
      console.error('Failed to update admin last login:', error);
    }
  }

  // Enhanced settings operations
  static async getSettings(): Promise<AppSettings> {
    try {
      const settings = await settingsDB.getItem<AppSettings>('app-settings');
      return settings || {
        theme: 'light',
        autoLogout: 30,
        requireFingerprint: true,
        workingHours: {
          start: '08:00',
          end: '17:00'
        }
      };
    } catch (error) {
      console.error('Failed to get settings:', error);
      return {
        theme: 'light',
        autoLogout: 30,
        requireFingerprint: true,
        workingHours: {
          start: '08:00',
          end: '17:00'
        }
      };
    }
  }

  static async updateSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    try {
      const current = await this.getSettings();
      const updated = { ...current, ...settings };
      await settingsDB.setItem('app-settings', updated);
      console.log('Settings updated successfully');
      return updated;
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw new Error('Failed to update settings');
    }
  }

  // Enhanced initialization with better error handling
  static async initializeDefaultAdmin(): Promise<void> {
    try {
      await this.initializeDatabase();
      
      const existingAdmin = await this.getAdminByUsername('admin');
      if (!existingAdmin) {
        // Simple hash function for demo - in production use bcrypt
        const passwordHash = btoa('admin123');
        await this.createAdmin({
          username: 'admin',
          passwordHash,
          fullName: 'System Administrator',
          email: 'admin@alasracademy.edu',
          role: 'super-admin'
        });
        console.log('Default admin created successfully');
      }
    } catch (error) {
      console.error('Failed to initialize default admin:', error);
      throw new Error('Failed to initialize system');
    }
  }

  // Data backup and restore methods for better persistence
  static async backupData(): Promise<string> {
    try {
      const backup = {
        staff: await this.getAllStaff(),
        attendance: await this.getAttendanceRecords(),
        settings: await this.getSettings(),
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
      
      // Restore staff
      for (const staff of backup.staff) {
        await staffDB.setItem(staff.id, staff);
      }
      
      // Restore attendance
      for (const record of backup.attendance) {
        await attendanceDB.setItem(record.id, record);
      }
      
      // Restore settings
      await settingsDB.setItem('app-settings', backup.settings);
      
      console.log('Data restored successfully');
      return true;
    } catch (error) {
      console.error('Failed to restore data:', error);
      return false;
    }
  }
}
