
// Re-export all types
export * from './types';

// Re-export all database classes
export { StaffDB } from './staff';
export { AttendanceDB } from './attendance';
export { AdminDB } from './admin';
export { SettingsDB } from './settings';

// Re-export connection utilities
export { initDB, getDB } from './connection';

// Safe admin initialization that preserves existing data
import { initDB } from './connection';
import { AdminDB } from './admin';

export async function initializeDefaultAdmin(): Promise<void> {
  try {
    await initDB();
    
    // Only create admin if it doesn't exist
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
      console.log('✅ Default admin created - existing data preserved');
    } else {
      console.log('✅ Default admin already exists - no changes made');
    }
  } catch (error) {
    console.error('❌ Failed to initialize default admin:', error);
    throw new Error('Failed to initialize system');
  }
}
