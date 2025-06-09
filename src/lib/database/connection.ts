
import { openDB, IDBPDatabase } from 'idb';
import { AttendanceSystemDB } from './types';
import { LocalStorageBackup } from '../storage';

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

// Clear all sample data
export async function clearAllSampleData(): Promise<void> {
  try {
    const db = await getDB();
    
    console.log('Manually clearing all sample data...');
    
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
    
  } catch (error) {
    console.error('Failed to clear sample data:', error);
  }
}
