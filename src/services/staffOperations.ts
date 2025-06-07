
import { Staff, StaffDB } from '@/lib/db';
import { LocalStorageBackup } from '@/lib/storage';

export class StaffOperations {
  static async loadAllStaff(): Promise<Staff[]> {
    try {
      console.log('Loading staff from database...');
      const allStaff = await StaffDB.getAll();
      console.log('Staff loaded successfully:', allStaff.length, 'members');
      
      // Ensure localStorage backup is up to date
      await LocalStorageBackup.backupStaff(allStaff);
      return allStaff;
    } catch (err) {
      console.error('Failed to load staff from database:', err);
      
      // Try to load from localStorage backup as fallback
      try {
        console.log('Attempting to load from localStorage backup...');
        const backupStaff = await LocalStorageBackup.getStaffBackup();
        console.log('Loaded from localStorage backup:', backupStaff.length, 'members');
        return backupStaff;
      } catch (backupError) {
        console.error('Failed to load from backup:', backupError);
        throw new Error('Failed to load staff from all sources');
      }
    }
  }

  static async createStaff(staffData: Omit<Staff, 'id' | 'createdAt'>): Promise<Staff | null> {
    try {
      console.log('Creating new staff member:', staffData.fullName);
      
      // Check if staff ID already exists
      const existingStaffId = await StaffDB.getByStaffId(staffData.staffId);
      if (existingStaffId) {
        throw new Error(`Staff ID "${staffData.staffId}" is already registered. Please use a different staff ID.`);
      }

      // Check if email already exists
      const allStaff = await StaffDB.getAll();
      const existingEmail = allStaff.find(s => s.email.toLowerCase() === staffData.email.toLowerCase());
      if (existingEmail) {
        throw new Error(`Email "${staffData.email}" is already registered to ${existingEmail.fullName}. Please use a different email address.`);
      }

      // Check if phone number already exists
      const existingPhone = allStaff.find(s => s.phone === staffData.phone);
      if (existingPhone) {
        throw new Error(`Phone number "${staffData.phone}" is already registered to ${existingPhone.fullName}. Please use a different phone number.`);
      }

      const newStaff = await StaffDB.create(staffData);
      console.log('Staff created successfully:', newStaff.fullName);
      return newStaff;
    } catch (err) {
      console.error('Failed to create staff member:', err);
      throw err;
    }
  }

  static async updateStaff(id: string, updates: Partial<Staff>): Promise<Staff | null> {
    try {
      const updatedStaff = await StaffDB.update(id, updates);
      if (updatedStaff) {
        console.log('Staff updated successfully:', updatedStaff.fullName);
        return updatedStaff;
      }
      return null;
    } catch (err) {
      console.error('Failed to update staff member:', err);
      throw new Error('Failed to update staff member');
    }
  }

  static async deleteStaff(id: string): Promise<boolean> {
    try {
      const success = await StaffDB.delete(id);
      if (success) {
        console.log('Staff deleted successfully');
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to delete staff member:', err);
      throw new Error('Failed to delete staff member');
    }
  }

  static async toggleStaffStatus(id: string, staff: Staff[]): Promise<Staff | null> {
    const staffMember = staff.find(s => s.id === id);
    if (staffMember) {
      return await this.updateStaff(id, { isActive: !staffMember.isActive });
    }
    return null;
  }
}
