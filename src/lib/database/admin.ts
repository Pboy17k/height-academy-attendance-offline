
import { getDB } from './connection';
import { Admin } from './types';

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
