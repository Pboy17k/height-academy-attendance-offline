
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { AttendanceSystemDB } from './types';

let db: IDBPDatabase<AttendanceSystemDB> | null = null;

export async function initDB(): Promise<IDBPDatabase<AttendanceSystemDB>> {
  if (db) return db;

  try {
    db = await openDB<AttendanceSystemDB>('AttendanceSystemDB', 1, {
      upgrade(database) {
        // Create staff store
        if (!database.objectStoreNames.contains('staff')) {
          const staffStore = database.createObjectStore('staff', { keyPath: 'id' });
          staffStore.createIndex('by-staffId', 'staffId', { unique: true });
          staffStore.createIndex('by-email', 'email', { unique: false });
        }

        // Create attendance store
        if (!database.objectStoreNames.contains('attendance')) {
          const attendanceStore = database.createObjectStore('attendance', { keyPath: 'id' });
          attendanceStore.createIndex('by-staffId', 'staffId', { unique: false });
          attendanceStore.createIndex('by-date', 'timestamp', { unique: false });
          attendanceStore.createIndex('by-timestamp', 'timestamp', { unique: false });
        }

        // Create admin store
        if (!database.objectStoreNames.contains('admin')) {
          const adminStore = database.createObjectStore('admin', { keyPath: 'id' });
          adminStore.createIndex('by-username', 'username', { unique: true });
        }

        // Create settings store
        if (!database.objectStoreNames.contains('settings')) {
          database.createObjectStore('settings', { keyPath: 'id' });
        }
      },
    });

    console.log('IndexedDB initialized successfully');
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

export async function clearAllSampleData(): Promise<void> {
  try {
    const database = await getDB();
    
    // Clear all stores
    const tx = database.transaction(['staff', 'attendance', 'admin', 'settings'], 'readwrite');
    await Promise.all([
      tx.objectStore('staff').clear(),
      tx.objectStore('attendance').clear(),
      tx.objectStore('admin').clear(),
      tx.objectStore('settings').clear(),
    ]);
    
    console.log('All sample data cleared from IndexedDB');
  } catch (error) {
    console.error('Failed to clear sample data:', error);
    throw new Error('Failed to clear sample data');
  }
}
