
import { persistentStorage } from '@/lib/persistentStorage';
import { AttendanceSystemDB } from './types';

let db: any = null;

export async function initDB(): Promise<any> {
  if (db) return db;

  try {
    console.log('🔗 Connecting to persistent database...');
    db = await persistentStorage.getDatabase();
    console.log('✅ Database connection established');
    return db;
  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
    throw new Error('Failed to initialize database connection');
  }
}

export async function getDB(): Promise<any> {
  if (!db) {
    db = await initDB();
  }
  return db;
}

// Ensure database is always ready
export async function ensureDBReady(): Promise<void> {
  try {
    await getDB();
    await persistentStorage.backup();
  } catch (error) {
    console.error('❌ Database readiness check failed:', error);
  }
}
