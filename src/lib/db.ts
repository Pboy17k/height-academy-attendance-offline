import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { LocalStorageBackup } from './storage';

// Database schema interface
interface AttendanceSystemDB extends DBSchema {
  staff: {
    key: string;
    value: Staff;
    indexes: { 'by-staffId': string; 'by-email': string };
  };
  attendance: {
    key: string;
    value: AttendanceRecord;
    indexes: { 'by-staffId': string; 'by-date': string; 'by-timestamp': Date };
  };
  admin: {
    key: string;
    value: Admin;
    indexes: { 'by-username': string };
  };
  settings: {
    key: string;
    value: AppSettingsRecord;
  };
}

// Types
export interface Staff {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  staffId: string;
  department: string;
  role: string;
  photo: string;
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
  autoLogout: number;
  requireFingerprint: boolean;
  workingHours: {
    start: string;
    end: string;
  };
}

// Internal type for storage (includes id)
interface AppSettingsRecord extends AppSettings {
  id: string;
}

// Database instance
let dbInstance: IDBPDatabase<AttendanceSystemDB> | null = null;

// Initialize database with proper error handling and persistence
export async function initDB(): Promise<IDBPDatabase<AttendanceSystemDB>> {
  try {
    if (dbInstance) {
      return dbInstance;
    }

    dbInstance = await openDB<AttendanceSystemDB>('AlasrAcademyDB', 2, {
      upgrade(db, oldVersion, newVersion, transaction) {
        console.log(`Upgrading database from version ${oldVersion} to ${newVersion}`);
        
        // Staff store
        if (!db.objectStoreNames.contains('staff')) {
          const staffStore = db.createObjectStore('staff', { keyPath: 'id' });
          staffStore.createIndex('by-staffId', 'staffId', { unique: true });
          staffStore.createIndex('by-email', 'email', { unique: true });
        }

        // Attendance store
        if (!db.objectStoreNames.contains('attendance')) {
          const attendanceStore = db.createObjectStore('attendance', { keyPath: 'id' });
          attendanceStore.createIndex('by-staffId', 'staffId');
          attendanceStore.createIndex('by-date', 'timestamp');
          attendanceStore.createIndex('by-timestamp', 'timestamp');
        }

        // Admin store
        if (!db.objectStoreNames.contains('admin')) {
          const adminStore = db.createObjectStore('admin', { keyPath: 'id' });
          adminStore.createIndex('by-username', 'username', { unique: true });
        }

        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'id' });
        }
      },
      blocked() {
        console.warn('Database upgrade blocked');
      },
      blocking() {
        console.warn('Database is blocking a newer version');
      },
      terminated() {
        console.warn('Database connection terminated');
        dbInstance = null;
      }
    });

    console.log('IndexedDB initialized successfully');
    return dbInstance;
  } catch (error) {
    console.error('Failed to initialize IndexedDB:', error);
    throw new Error('Database initialization failed');
  }
}

// Get database instance
export async function getDB(): Promise<IDBPDatabase<AttendanceSystemDB>> {
  if (!dbInstance) {
    return await initDB();
  }
  return dbInstance;
}

// Add method to clear all sample data
export async function clearAllSampleData(): Promise<void> {
  try {
    const db = await getDB();
    
    // Clear all staff data
    const staffTransaction = db.transaction('staff', 'readwrite');
    await staffTransaction.objectStore('staff').clear();
    await staffTransaction.done;
    
    // Clear all attendance data
    const attendanceTransaction = db.transaction('attendance', 'readwrite');
    await attendanceTransaction.objectStore('attendance').clear();
    await attendanceTransaction.done;
    
    console.log('All sample data cleared from IndexedDB');
    
    // Clear localStorage backups
    LocalStorageBackup.clearAllBackups();
    
    // Set flag that user will create their own data
    LocalStorageBackup.setUserDataModified();
    
  } catch (error) {
    console.error('Failed to clear sample data:', error);
  }
}

// Staff operations
export class StaffDB {
  static async create(staff: Omit<Staff, 'id' | 'createdAt'>): Promise<Staff> {
    try {
      const db = await getDB();
      const newStaff: Staff = {
        ...staff,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        isActive: staff.isActive ?? true
      };
      
      await db.add('staff', newStaff);
      console.log('Staff created in IndexedDB:', newStaff.fullName);
      
      // Mark that user has modified data
      LocalStorageBackup.setUserDataModified();
      
      // Backup to localStorage
      const allStaff = await this.getAll();
      LocalStorageBackup.backupStaff(allStaff);
      
      return newStaff;
    } catch (error) {
      console.error('Failed to create staff in IndexedDB:', error);
      throw new Error('Failed to create staff member');
    }
  }

  static async getAll(): Promise<Staff[]> {
    try {
      const db = await getDB();
      const staff = await db.getAll('staff');
      const sortedStaff = staff.sort((a, b) => a.fullName.localeCompare(b.fullName));
      
      // Backup to localStorage whenever we fetch
      LocalStorageBackup.backupStaff(sortedStaff);
      
      return sortedStaff;
    } catch (error) {
      console.error('Failed to get all staff from IndexedDB:', error);
      
      // Fallback to localStorage if IndexedDB fails
      console.log('Attempting to load staff from localStorage backup...');
      const backup = LocalStorageBackup.getStaffBackup();
      return backup.sort((a, b) => a.fullName.localeCompare(b.fullName));
    }
  }

  static async getById(id: string): Promise<Staff | null> {
    try {
      const db = await getDB();
      const staff = await db.get('staff', id);
      return staff || null;
    } catch (error) {
      console.error('Failed to get staff by ID from IndexedDB:', error);
      
      // Fallback to localStorage
      const backup = LocalStorageBackup.getStaffBackup();
      return backup.find(s => s.id === id) || null;
    }
  }

  static async getByStaffId(staffId: string): Promise<Staff | null> {
    try {
      const db = await getDB();
      const staff = await db.getFromIndex('staff', 'by-staffId', staffId);
      return staff || null;
    } catch (error) {
      console.error('Failed to get staff by staffId from IndexedDB:', error);
      
      // Fallback to localStorage
      const backup = LocalStorageBackup.getStaffBackup();
      return backup.find(s => s.staffId === staffId) || null;
    }
  }

  static async update(id: string, updates: Partial<Staff>): Promise<Staff | null> {
    try {
      const db = await getDB();
      const existing = await db.get('staff', id);
      if (!existing) return null;
      
      const updated = { ...existing, ...updates };
      await db.put('staff', updated);
      console.log('Staff updated in IndexedDB:', updated.fullName);
      
      // Mark that user has modified data
      LocalStorageBackup.setUserDataModified();
      
      // Backup to localStorage
      const allStaff = await this.getAll();
      LocalStorageBackup.backupStaff(allStaff);
      
      return updated;
    } catch (error) {
      console.error('Failed to update staff in IndexedDB:', error);
      return null;
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      const db = await getDB();
      
      // First get the staff member to log the deletion
      const staff = await db.get('staff', id);
      if (staff) {
        console.log('Deleting staff from IndexedDB:', staff.fullName);
      }
      
      // Delete from IndexedDB
      await db.delete('staff', id);
      console.log('Staff deleted from IndexedDB successfully');
      
      // Mark that user has modified data
      LocalStorageBackup.setUserDataModified();
      
      // Update localStorage backup
      const allStaff = await this.getAll();
      LocalStorageBackup.backupStaff(allStaff);
      
      return true;
    } catch (error) {
      console.error('Failed to delete staff from IndexedDB:', error);
      return false;
    }
  }
}

// Attendance operations
export class AttendanceDB {
  static async create(record: Omit<AttendanceRecord, 'id'>): Promise<AttendanceRecord> {
    try {
      const db = await getDB();
      const newRecord: AttendanceRecord = {
        ...record,
        id: crypto.randomUUID()
      };
      
      await db.add('attendance', newRecord);
      console.log('Attendance recorded in IndexedDB:', newRecord.staffName, newRecord.type);
      return newRecord;
    } catch (error) {
      console.error('Failed to record attendance in IndexedDB:', error);
      throw new Error('Failed to record attendance');
    }
  }

  static async getAll(filters?: {
    startDate?: Date;
    endDate?: Date;
    staffId?: string;
    type?: 'check-in' | 'check-out';
  }): Promise<AttendanceRecord[]> {
    try {
      const db = await getDB();
      let records = await db.getAll('attendance');
      
      if (filters) {
        records = records.filter(record => {
          if (filters.startDate && new Date(record.timestamp) < filters.startDate) return false;
          if (filters.endDate && new Date(record.timestamp) > filters.endDate) return false;
          if (filters.staffId && record.staffId !== filters.staffId) return false;
          if (filters.type && record.type !== filters.type) return false;
          return true;
        });
      }
      
      return records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.error('Failed to get attendance records from IndexedDB:', error);
      return [];
    }
  }

  static async getToday(): Promise<AttendanceRecord[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return this.getAll({
      startDate: today,
      endDate: tomorrow
    });
  }

  static async getLatestForStaff(staffId: string): Promise<AttendanceRecord | null> {
    try {
      const records = await this.getAll({ staffId });
      return records.length > 0 ? records[0] : null;
    } catch (error) {
      console.error('Failed to get latest attendance for staff from IndexedDB:', error);
      return null;
    }
  }
}

// Admin operations
export class AdminDB {
  static async create(admin: Omit<Admin, 'id' | 'createdAt'>): Promise<Admin> {
    try {
      const db = await getDB();
      const newAdmin: Admin = {
        ...admin,
        id: crypto.randomUUID(),
        createdAt: new Date()
      };
      
      await db.add('admin', newAdmin);
      console.log('Admin created in IndexedDB:', newAdmin.username);
      return newAdmin;
    } catch (error) {
      console.error('Failed to create admin in IndexedDB:', error);
      throw new Error('Failed to create admin');
    }
  }

  static async getByUsername(username: string): Promise<Admin | null> {
    try {
      const db = await getDB();
      const admin = await db.getFromIndex('admin', 'by-username', username);
      return admin || null;
    } catch (error) {
      console.error('Failed to get admin by username from IndexedDB:', error);
      return null;
    }
  }

  static async updateLastLogin(id: string): Promise<void> {
    try {
      const db = await getDB();
      const admin = await db.get('admin', id);
      if (admin) {
        admin.lastLogin = new Date();
        await db.put('admin', admin);
        console.log('Admin last login updated in IndexedDB');
      }
    } catch (error) {
      console.error('Failed to update admin last login in IndexedDB:', error);
    }
  }
}

// Settings operations
export class SettingsDB {
  static async get(): Promise<AppSettings> {
    try {
      const db = await getDB();
      const settings = await db.get('settings', 'app-settings');
      if (settings) {
        // Return without the id property
        const { id, ...appSettings } = settings;
        return appSettings;
      }
      return {
        theme: 'light',
        autoLogout: 30,
        requireFingerprint: true,
        workingHours: {
          start: '08:00',
          end: '17:00'
        }
      };
    } catch (error) {
      console.error('Failed to get settings from IndexedDB:', error);
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

  static async update(settings: Partial<AppSettings>): Promise<AppSettings> {
    try {
      const db = await getDB();
      const current = await this.get();
      const updated = { ...current, ...settings };
      const settingsRecord: AppSettingsRecord = { id: 'app-settings', ...updated };
      await db.put('settings', settingsRecord);
      console.log('Settings updated in IndexedDB');
      return updated;
    } catch (error) {
      console.error('Failed to update settings in IndexedDB:', error);
      throw new Error('Failed to update settings');
    }
  }
}

// Initialize default admin
export async function initializeDefaultAdmin(): Promise<void> {
  try {
    await initDB();
    
    const existingAdmin = await AdminDB.getByUsername('admin');
    if (!existingAdmin) {
      const passwordHash = btoa('admin123');
      await AdminDB.create({
        username: 'admin',
        passwordHash,
        fullName: 'System Administrator',
        email: 'admin@alasracademy.edu',
        role: 'super-admin'
      });
      console.log('Default admin created in IndexedDB');
    }
  } catch (error) {
    console.error('Failed to initialize default admin:', error);
    throw new Error('Failed to initialize system');
  }
}
