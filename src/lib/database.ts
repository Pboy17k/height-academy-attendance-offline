
import localforage from 'localforage';

// Configure localforage instances
const staffDB = localforage.createInstance({
  name: 'GreaterHeightAcademy',
  storeName: 'staff'
});

const attendanceDB = localforage.createInstance({
  name: 'GreaterHeightAcademy',
  storeName: 'attendance'
});

const adminDB = localforage.createInstance({
  name: 'GreaterHeightAcademy',
  storeName: 'admin'
});

const settingsDB = localforage.createInstance({
  name: 'GreaterHeightAcademy',
  storeName: 'settings'
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

// Database operations
export class DatabaseService {
  
  // Staff operations
  static async createStaff(staff: Omit<Staff, 'id' | 'createdAt'>): Promise<Staff> {
    const newStaff: Staff = {
      ...staff,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      isActive: true
    };
    
    await staffDB.setItem(newStaff.id, newStaff);
    return newStaff;
  }

  static async getAllStaff(): Promise<Staff[]> {
    const staff: Staff[] = [];
    await staffDB.iterate((value: Staff) => {
      staff.push(value);
    });
    return staff.sort((a, b) => a.fullName.localeCompare(b.fullName));
  }

  static async getStaffById(id: string): Promise<Staff | null> {
    return await staffDB.getItem(id);
  }

  static async getStaffByStaffId(staffId: string): Promise<Staff | null> {
    const allStaff = await this.getAllStaff();
    return allStaff.find(s => s.staffId === staffId) || null;
  }

  static async updateStaff(id: string, updates: Partial<Staff>): Promise<Staff | null> {
    const existing = await staffDB.getItem<Staff>(id);
    if (!existing) return null;
    
    const updated = { ...existing, ...updates };
    await staffDB.setItem(id, updated);
    return updated;
  }

  static async deleteStaff(id: string): Promise<boolean> {
    try {
      await staffDB.removeItem(id);
      return true;
    } catch {
      return false;
    }
  }

  // Attendance operations
  static async recordAttendance(record: Omit<AttendanceRecord, 'id'>): Promise<AttendanceRecord> {
    const newRecord: AttendanceRecord = {
      ...record,
      id: crypto.randomUUID()
    };
    
    await attendanceDB.setItem(newRecord.id, newRecord);
    return newRecord;
  }

  static async getAttendanceRecords(filters?: {
    startDate?: Date;
    endDate?: Date;
    staffId?: string;
    type?: 'check-in' | 'check-out';
  }): Promise<AttendanceRecord[]> {
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

  // Admin operations
  static async createAdmin(admin: Omit<Admin, 'id' | 'createdAt'>): Promise<Admin> {
    const newAdmin: Admin = {
      ...admin,
      id: crypto.randomUUID(),
      createdAt: new Date()
    };
    
    await adminDB.setItem(newAdmin.id, newAdmin);
    return newAdmin;
  }

  static async getAdminByUsername(username: string): Promise<Admin | null> {
    const admins: Admin[] = [];
    await adminDB.iterate((value: Admin) => {
      admins.push(value);
    });
    
    return admins.find(a => a.username === username) || null;
  }

  static async updateAdminLastLogin(id: string): Promise<void> {
    const admin = await adminDB.getItem<Admin>(id);
    if (admin) {
      admin.lastLogin = new Date();
      await adminDB.setItem(id, admin);
    }
  }

  // Settings operations
  static async getSettings(): Promise<AppSettings> {
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
  }

  static async updateSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    const current = await this.getSettings();
    const updated = { ...current, ...settings };
    await settingsDB.setItem('app-settings', updated);
    return updated;
  }

  // Initialize default admin
  static async initializeDefaultAdmin(): Promise<void> {
    const existingAdmin = await this.getAdminByUsername('admin');
    if (!existingAdmin) {
      // Simple hash function for demo - in production use bcrypt
      const passwordHash = btoa('admin123');
      await this.createAdmin({
        username: 'admin',
        passwordHash,
        fullName: 'System Administrator',
        email: 'admin@greaterheight.edu',
        role: 'super-admin'
      });
    }
  }
}
