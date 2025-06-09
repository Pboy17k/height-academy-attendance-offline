
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { AttendanceSystemDB } from './types';

let db: IDBPDatabase<AttendanceSystemDB> | null = null;

export async function initDB(): Promise<IDBPDatabase<AttendanceSystemDB>> {
  if (db) return db;

  try {
    db = await openDB<AttendanceSystemDB>('AttendanceSystemDB', 1, {
      upgrade(database) {
        console.log('Setting up database schema...');
        
        // Create staff store
        if (!database.objectStoreNames.contains('staff')) {
          const staffStore = database.createObjectStore('staff', { keyPath: 'id' });
          staffStore.createIndex('by-staffId', 'staffId', { unique: true });
          staffStore.createIndex('by-email', 'email', { unique: false });
          console.log('Staff store created');
        }

        // Create attendance store
        if (!database.objectStoreNames.contains('attendance')) {
          const attendanceStore = database.createObjectStore('attendance', { keyPath: 'id' });
          attendanceStore.createIndex('by-staffId', 'staffId', { unique: false });
          attendanceStore.createIndex('by-date', 'timestamp', { unique: false });
          attendanceStore.createIndex('by-timestamp', 'timestamp', { unique: false });
          console.log('Attendance store created');
        }

        // Create admin store
        if (!database.objectStoreNames.contains('admin')) {
          const adminStore = database.createObjectStore('admin', { keyPath: 'id' });
          adminStore.createIndex('by-username', 'username', { unique: true });
          console.log('Admin store created');
        }

        // Create settings store
        if (!database.objectStoreNames.contains('settings')) {
          database.createObjectStore('settings', { keyPath: 'id' });
          console.log('Settings store created');
        }
      },
    });

    console.log('IndexedDB initialized successfully - existing data preserved');
    return db;
  } catch (error) {
    console.error('Failed to initialize IndexedDB:', error);
    throw new Error('Failed to initialize database');
  }
}

export async function getDB(): Promise<IDBPDatabase<AttendanceSystemDB>> {
  if (!db) {
    db = await initDB();
  }
  return db;
}

// REMOVED the clearAllSampleData function entirely to prevent accidental data loss
