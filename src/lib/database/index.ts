
// Re-export all types
export * from './types';

// Re-export all database classes
export { StaffDB } from './staff';
export { AttendanceDB } from './attendance';
export { AdminDB } from './admin';
export { SettingsDB } from './settings';

// Re-export connection utilities
export { initDB, getDB, clearAllSampleData } from './connection';

// Initialize default admin function
import { initDB } from './connection';
import { AdminDB } from './admin';

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
