import { useState, useEffect, useCallback } from 'react';
import { StaffDB, Staff } from '@/lib/db';
import { useToast } from '@/hooks/use-toast';
import { LocalStorageBackup } from '@/lib/storage';

export function useStaff() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Load all staff from IndexedDB with improved error handling
  const loadStaff = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Loading staff from database...');
      
      const allStaff = await StaffDB.getAll();
      setStaff(allStaff);
      console.log('Staff loaded successfully:', allStaff.length, 'members');
      
      // Ensure localStorage backup is up to date
      LocalStorageBackup.backupStaff(allStaff);
      
    } catch (err) {
      const errorMessage = 'Failed to load staff members';
      setError(errorMessage);
      console.error('useStaff - loadStaff error:', err);
      
      // Try to load from localStorage backup as fallback
      try {
        console.log('Attempting to load from localStorage backup...');
        const backupStaff = LocalStorageBackup.getStaffBackup();
        setStaff(backupStaff);
        console.log('Loaded from localStorage backup:', backupStaff.length, 'members');
        
        if (backupStaff.length > 0) {
          toast({
            title: "Loaded from backup",
            description: "Staff data loaded from local backup",
            variant: "default",
          });
        }
      } catch (backupError) {
        console.error('Failed to load from backup:', backupError);
        toast({
          title: "Database Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Create new staff member with duplicate checking and specific error messages
  const createStaff = useCallback(async (staffData: Omit<Staff, 'id' | 'createdAt'>) => {
    try {
      console.log('Creating new staff member:', staffData.fullName);
      
      // Check if staff ID already exists
      const existingStaffId = await StaffDB.getByStaffId(staffData.staffId);
      if (existingStaffId) {
        toast({
          title: "Registration failed",
          description: `Staff ID "${staffData.staffId}" is already registered. Please use a different staff ID.`,
          variant: "destructive",
        });
        return null;
      }

      // Check if email already exists
      const allStaff = await StaffDB.getAll();
      const existingEmail = allStaff.find(s => s.email.toLowerCase() === staffData.email.toLowerCase());
      if (existingEmail) {
        toast({
          title: "Registration failed", 
          description: `Email "${staffData.email}" is already registered to ${existingEmail.fullName}. Please use a different email address.`,
          variant: "destructive",
        });
        return null;
      }

      // Check if phone number already exists
      const existingPhone = allStaff.find(s => s.phone === staffData.phone);
      if (existingPhone) {
        toast({
          title: "Registration failed",
          description: `Phone number "${staffData.phone}" is already registered to ${existingPhone.fullName}. Please use a different phone number.`,
          variant: "destructive",
        });
        return null;
      }

      const newStaff = await StaffDB.create(staffData);
      console.log('Staff created successfully:', newStaff.fullName);
      
      // Refresh the entire staff list to ensure consistency
      await loadStaff();
      
      toast({
        title: "Registration successful",
        description: `${staffData.fullName} has been registered successfully`,
      });
      
      return newStaff;
    } catch (err) {
      const errorMessage = 'Failed to create staff member';
      setError(errorMessage);
      console.error('useStaff - createStaff error:', err);
      toast({
        title: "Registration failed",
        description: `${errorMessage}. Please check the form data and try again.`,
        variant: "destructive",
      });
      return null;
    }
  }, [toast, loadStaff]);

  // Update staff member
  const updateStaff = useCallback(async (id: string, updates: Partial<Staff>) => {
    try {
      const updatedStaff = await StaffDB.update(id, updates);
      if (updatedStaff) {
        // Refresh the entire staff list to ensure consistency
        await loadStaff();
        
        toast({
          title: "Staff updated",
          description: `${updatedStaff.fullName} has been updated successfully`,
        });
        
        return updatedStaff;
      }
      return null;
    } catch (err) {
      const errorMessage = 'Failed to update staff member';
      setError(errorMessage);
      console.error('useStaff - updateStaff error:', err);
      toast({
        title: "Update failed",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    }
  }, [toast, loadStaff]);

  // Delete staff member
  const deleteStaff = useCallback(async (id: string) => {
    try {
      const staffToDelete = staff.find(s => s.id === id);
      const success = await StaffDB.delete(id);
      
      if (success) {
        // Refresh the entire staff list to ensure consistency
        await loadStaff();
        
        toast({
          title: "Staff deleted",
          description: `${staffToDelete?.fullName || 'Staff member'} has been removed from the system permanently`,
        });
        
        return true;
      }
      return false;
    } catch (err) {
      const errorMessage = 'Failed to delete staff member';
      setError(errorMessage);
      console.error('useStaff - deleteStaff error:', err);
      toast({
        title: "Delete failed",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  }, [staff, toast, loadStaff]);

  // Get staff by ID
  const getStaffById = useCallback((id: string): Staff | null => {
    return staff.find(s => s.id === id) || null;
  }, [staff]);

  // Get staff by staff ID
  const getStaffByStaffId = useCallback((staffId: string): Staff | null => {
    return staff.find(s => s.staffId === staffId) || null;
  }, [staff]);

  // Toggle staff status
  const toggleStaffStatus = useCallback(async (id: string) => {
    const staffMember = staff.find(s => s.id === id);
    if (staffMember) {
      return await updateStaff(id, { isActive: !staffMember.isActive });
    }
    return null;
  }, [staff, updateStaff]);

  // Refresh staff data
  const refreshStaff = useCallback(() => {
    loadStaff();
  }, [loadStaff]);

  // Load staff on hook initialization
  useEffect(() => {
    console.log('useStaff hook initialized, loading staff...');
    loadStaff();
  }, [loadStaff]);

  return {
    staff,
    isLoading,
    error,
    createStaff,
    updateStaff,
    deleteStaff,
    getStaffById,
    getStaffByStaffId,
    toggleStaffStatus,
    refreshStaff,
    loadStaff
  };
}
