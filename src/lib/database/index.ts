
// Re-export all types
export * from './types';

// Re-export all database classes  
export { StaffDB } from './staff';
export { AttendanceDB } from './attendance';
export { AdminDB } from './admin';
export { SettingsDB } from './settings';

// Re-export connection utilities
export { initDB, getDB, ensureDBReady } from './connection';

// BULLETPROOF admin initialization that NEVER fails or clears data
import { getDB } from './connection';
import { Admin } from './types';

export async function initializeDefaultAdmin(): Promise<void> {
  try {
    const db = await getDB();
    
    // Check if ANY admin exists first
    const adminCount = await db.count('admin');
    if (adminCount > 0) {
      console.log('✅ Admin accounts already exist, preserving existing data');
      return;
    }
    
    // Only create if NO admins exist
    const defaultAdmin: Admin = {
      id: crypto.randomUUID(),
      username: 'admin',
      passwordHash: btoa('admin123'),
      fullName: 'System Administrator',
      email: 'admin@alasracademy.edu',
      role: 'super-admin',
      createdAt: new Date()
    };
    
    await db.add('admin', defaultAdmin);
    console.log('✅ Default admin created successfully');
    
  } catch (error) {
    // Even if admin creation fails, don't throw - just log
    console.log('ℹ️ Admin initialization skipped (may already exist):', error.message);
  }
}
