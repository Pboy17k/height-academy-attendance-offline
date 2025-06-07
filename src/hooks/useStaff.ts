
import { useState, useEffect, useCallback } from 'react';
import { Staff } from '@/lib/db';
import { useToast } from '@/hooks/use-toast';
import { StaffOperations } from '@/services/staffOperations';
import { StaffValidation } from '@/services/staffValidation';

export function useStaff() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Load all staff from database
  const loadStaff = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const allStaff = await StaffOperations.loadAllStaff();
      setStaff(allStaff);
      
    } catch (err) {
      const errorMessage = 'Failed to load staff members';
      setError(errorMessage);
      console.error('useStaff - loadStaff error:', err);
      
      if (err instanceof Error && err.message.includes('backup')) {
        toast({
          title: "Loaded from backup",
          description: "Staff data loaded from local backup",
          variant: "default",
        });
      } else {
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

  // Create new staff member
  const createStaff = useCallback(async (staffData: Omit<Staff, 'id' | 'createdAt'>) => {
    try {
      const newStaff = await StaffOperations.createStaff(staffData);
      
      if (newStaff) {
        // Refresh the entire staff list to ensure consistency
        await loadStaff();
        
        toast({
          title: "Registration successful",
          description: `${staffData.fullName} has been registered successfully`,
        });
        
        return newStaff;
      }
      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create staff member';
      setError(errorMessage);
      console.error('useStaff - createStaff error:', err);
      
      if (errorMessage.includes('already registered')) {
        toast({
          title: "Registration failed",
          description: errorMessage,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Registration failed",
          description: `${errorMessage}. Please check the form data and try again.`,
          variant: "destructive",
        });
      }
      return null;
    }
  }, [toast, loadStaff]);

  // Update staff member
  const updateStaff = useCallback(async (id: string, updates: Partial<Staff>) => {
    try {
      const updatedStaff = await StaffOperations.updateStaff(id, updates);
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
      const success = await StaffOperations.deleteStaff(id);
      
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
    return StaffValidation.getStaffById(staff, id);
  }, [staff]);

  // Get staff by staff ID
  const getStaffByStaffId = useCallback((staffId: string): Staff | null => {
    return StaffValidation.getStaffByStaffId(staff, staffId);
  }, [staff]);

  // Toggle staff status
  const toggleStaffStatus = useCallback(async (id: string) => {
    const updatedStaff = await StaffOperations.toggleStaffStatus(id, staff);
    if (updatedStaff) {
      await loadStaff();
    }
    return updatedStaff;
  }, [staff, loadStaff]);

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
