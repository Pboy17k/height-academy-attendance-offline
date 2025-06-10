
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Staff, AttendanceRecord, Admin, AppSettings } from '@/lib/database/types';

interface PersistentDB extends DBSchema {
  staff: {
    key: string;
    value: Staff;
    indexes: { 'by-staffId': string; 'by-email': string };
  };
  attendance: {
    key: string;
    value: AttendanceRecord;
    indexes: { 'by-staffId': string; 'by-timestamp': Date };
  };
  admin: {
    key: string;
    value: Admin;
    indexes: { 'by-username': string };
  };
  settings: {
    key: string;
    value: AppSettings & { id: string };
  };
  metadata: {
    key: string;
    value: {
      id: string;
      lastBackup: string;
      version: string;
      initialized: boolean;
    };
  };
}

class PersistentStorageService {
  private db: IDBPDatabase<PersistentDB> | null = null;
  private dbName = 'AlasrAcademyPersistent';
  private version = 2;

  async initialize(): Promise<void> {
    try {
      console.log('🚀 Initializing persistent storage...');
      
      this.db = await openDB<PersistentDB>(this.dbName, this.version, {
        upgrade: (database, oldVersion, newVersion) => {
          console.log(`📈 Upgrading database from version ${oldVersion} to ${newVersion}`);
          
          // Create stores if they don't exist
          if (!database.objectStoreNames.contains('staff')) {
            const staffStore = database.createObjectStore('staff', { keyPath: 'id' });
            staffStore.createIndex('by-staffId', 'staffId', { unique: true });
            staffStore.createIndex('by-email', 'email', { unique: false });
            console.log('✅ Staff store created');
          }

          if (!database.objectStoreNames.contains('attendance')) {
            const attendanceStore = database.createObjectStore('attendance', { keyPath: 'id' });
            attendanceStore.createIndex('by-staffId', 'staffId', { unique: false });
            attendanceStore.createIndex('by-timestamp', 'timestamp', { unique: false });
            console.log('✅ Attendance store created');
          }

          if (!database.objectStoreNames.contains('admin')) {
            const adminStore = database.createObjectStore('admin', { keyPath: 'id' });
            adminStore.createIndex('by-username', 'username', { unique: true });
            console.log('✅ Admin store created');
          }

          if (!database.objectStoreNames.contains('settings')) {
            database.createObjectStore('settings', { keyPath: 'id' });
            console.log('✅ Settings store created');
          }

          if (!database.objectStoreNames.contains('metadata')) {
            database.createObjectStore('metadata', { keyPath: 'id' });
            console.log('✅ Metadata store created');
          }
        },
        blocked: () => {
          console.warn('⚠️ Database upgrade blocked');
        },
        blocking: () => {
          console.warn('⚠️ Database blocking');
        }
      });

      await this.ensureInitialized();
      console.log('✅ Persistent storage initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize persistent storage:', error);
      throw error;
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const metadata = await this.db.get('metadata', 'system');
      
      if (!metadata || !metadata.initialized) {
        // First time initialization
        await this.db.put('metadata', {
          id: 'system',
          lastBackup: new Date().toISOString(),
          version: this.version.toString(),
          initialized: true
        });

        // Create default admin if not exists
        const existingAdmin = await this.db.getFromIndex('admin', 'by-username', 'admin');
        if (!existingAdmin) {
          const defaultAdmin: Admin = {
            id: crypto.randomUUID(),
            username: 'admin',
            passwordHash: btoa('admin123'),
            fullName: 'System Administrator',
            email: 'admin@alasracademy.edu',
            role: 'super-admin',
            createdAt: new Date()
          };
          
          await this.db.add('admin', defaultAdmin);
          console.log('✅ Default admin created in persistent storage');
        }
      }
    } catch (error) {
      console.error('❌ Failed to ensure initialization:', error);
    }
  }

  async getDatabase(): Promise<IDBPDatabase<PersistentDB>> {
    if (!this.db) {
      await this.initialize();
    }
    return this.db!;
  }

  async backup(): Promise<void> {
    try {
      const db = await this.getDatabase();
      
      // Update backup timestamp
      await db.put('metadata', {
        id: 'system',
        lastBackup: new Date().toISOString(),
        version: this.version.toString(),
        initialized: true
      });

      console.log('💾 Backup timestamp updated');
    } catch (error) {
      console.error('❌ Backup failed:', error);
    }
  }

  async getHealth(): Promise<{
    isHealthy: boolean;
    lastBackup: string;
    staffCount: number;
    attendanceCount: number;
  }> {
    try {
      const db = await this.getDatabase();
      
      const metadata = await db.get('metadata', 'system');
      const staffCount = await db.count('staff');
      const attendanceCount = await db.count('attendance');

      return {
        isHealthy: !!metadata?.initialized,
        lastBackup: metadata?.lastBackup || 'Never',
        staffCount,
        attendanceCount
      };
    } catch (error) {
      console.error('❌ Health check failed:', error);
      return {
        isHealthy: false,
        lastBackup: 'Error',
        staffCount: 0,
        attendanceCount: 0
      };
    }
  }
}

export const persistentStorage = new PersistentStorageService();
