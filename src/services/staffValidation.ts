
import { Staff } from '@/lib/db';

export class StaffValidation {
  static getStaffById(staff: Staff[], id: string): Staff | null {
    return staff.find(s => s.id === id) || null;
  }

  static getStaffByStaffId(staff: Staff[], staffId: string): Staff | null {
    return staff.find(s => s.staffId === staffId) || null;
  }

  static validateStaffData(staffData: Partial<Staff>): string[] {
    const errors: string[] = [];
    
    if (!staffData.fullName?.trim()) {
      errors.push('Full name is required');
    }
    
    if (!staffData.email?.trim()) {
      errors.push('Email is required');
    } else if (!/\S+@\S+\.\S+/.test(staffData.email)) {
      errors.push('Invalid email format');
    }
    
    if (!staffData.phone?.trim()) {
      errors.push('Phone number is required');
    }
    
    if (!staffData.staffId?.trim()) {
      errors.push('Staff ID is required');
    }
    
    if (!staffData.department?.trim()) {
      errors.push('Department is required');
    }
    
    if (!staffData.role?.trim()) {
      errors.push('Role is required');
    }
    
    return errors;
  }
}
