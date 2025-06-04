
import { useState, useEffect, useCallback } from 'react';
import { StaffDB, Staff } from '@/lib/db';
import { useToast } from '@/hooks/use-toast';

export function useStaff() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Load all staff from IndexedDB
  const loadStaff = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const allStaff = await StaffDB.getAll();
      setStaff(allStaff);
      console.log('Staff loaded from IndexedDB:', allStaff.length, 'members');
    } catch (err) {
      const errorMessage = 'Failed to load staff members';
      setError(errorMessage);
      console.error('useStaff - loadStaff error:', err);
      toast({
        title: "Database Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Create new staff member
  const createStaff = useCallback(async (staffData: Omit<Staff, 'id' | 'createdAt'>) => {
    try {
      // Check if staff ID already exists
      const existingStaff = await StaffDB.getByStaffId(staffData.staffId);
      if (existingStaff) {
        toast({
          title: "Staff ID exists",
          description: "This staff ID is already registered",
          variant: "destructive",
        });
        return null;
      }

      const newStaff = await StaffDB.create(staffData);
      setStaff(prev => [...prev, newStaff].sort((a, b) => a.fullName.localeCompare(b.fullName)));
      
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
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    }
  }, [toast]);

  // Update staff member
  const updateStaff = useCallback(async (id: string, updates: Partial<Staff>) => {
    try {
      const updatedStaff = await StaffDB.update(id, updates);
      if (updatedStaff) {
        setStaff(prev => 
          prev.map(s => s.id === id ? updatedStaff : s)
            .sort((a, b) => a.fullName.localeCompare(b.fullName))
        );
        
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
  }, [toast]);

  // Delete staff member
  const deleteStaff = useCallback(async (id: string) => {
    try {
      const staffToDelete = staff.find(s => s.id === id);
      const success = await StaffDB.delete(id);
      
      if (success) {
        setStaff(prev => prev.filter(s => s.id !== id));
        
        toast({
          title: "Staff deleted",
          description: `${staffToDelete?.fullName || 'Staff member'} has been removed from the system`,
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
  }, [staff, toast]);

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
