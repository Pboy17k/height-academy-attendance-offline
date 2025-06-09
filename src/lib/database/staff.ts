
import { getDB } from './connection';
import { Staff } from './types';
import { LocalStorageBackup } from '../storage';

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
      console.log('Staff created successfully in IndexedDB:', newStaff.fullName);
      
      // Mark that user has modified data
      LocalStorageBackup.setUserDataModified();
      
      // Backup to localStorage immediately
      const allStaff = await this.getAll();
      await LocalStorageBackup.backupStaff(allStaff);
      
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
      
      console.log('Staff loaded from IndexedDB:', sortedStaff.length, 'members');
      
      // Backup to localStorage whenever we fetch
      await LocalStorageBackup.backupStaff(sortedStaff);
      
      return sortedStaff;
    } catch (error) {
      console.error('Failed to get all staff from IndexedDB:', error);
      
      // Fallback to localStorage if IndexedDB fails
      console.log('Attempting to load staff from localStorage backup...');
      const backup = await LocalStorageBackup.getStaffBackup();
      console.log('Loaded from localStorage backup:', backup.length, 'staff members');
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
      const backup = await LocalStorageBackup.getStaffBackup();
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
      const backup = await LocalStorageBackup.getStaffBackup();
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
      console.log('Staff updated successfully in IndexedDB:', updated.fullName);
      
      // Mark that user has modified data
      LocalStorageBackup.setUserDataModified();
      
      // Backup to localStorage
      const allStaff = await this.getAll();
      await LocalStorageBackup.backupStaff(allStaff);
      
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
      await LocalStorageBackup.backupStaff(allStaff);
      
      return true;
    } catch (error) {
      console.error('Failed to delete staff from IndexedDB:', error);
      return false;
    }
  }
}
