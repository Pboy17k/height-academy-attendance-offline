
import { useState, useEffect, useCallback } from 'react';
import { AttendanceDB, AttendanceRecord } from '@/lib/db';
import { useToast } from '@/hooks/use-toast';

export function useAttendance() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Load attendance records
  const loadAttendance = useCallback(async (filters?: {
    startDate?: Date;
    endDate?: Date;
    staffId?: string;
    type?: 'check-in' | 'check-out';
  }) => {
    try {
      setIsLoading(true);
      setError(null);
      const records = await AttendanceDB.getAll(filters);
      setAttendanceRecords(records);
      console.log('Attendance loaded from IndexedDB:', records.length, 'records');
    } catch (err) {
      const errorMessage = 'Failed to load attendance records';
      setError(errorMessage);
      console.error('useAttendance - loadAttendance error:', err);
      toast({
        title: "Database Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Load today's attendance
  const loadTodayAttendance = useCallback(async () => {
    try {
      const records = await AttendanceDB.getToday();
      setTodayAttendance(records);
      console.log('Today\'s attendance loaded from IndexedDB:', records.length, 'records');
    } catch (err) {
      console.error('useAttendance - loadTodayAttendance error:', err);
    }
  }, []);

  // Record attendance
  const recordAttendance = useCallback(async (record: Omit<AttendanceRecord, 'id'>) => {
    try {
      const newRecord = await AttendanceDB.create(record);
      setAttendanceRecords(prev => [newRecord, ...prev]);
      setTodayAttendance(prev => [newRecord, ...prev]);
      
      toast({
        title: "Success!",
        description: `${record.staffName} ${record.type === 'check-in' ? 'checked in' : 'checked out'} successfully`,
      });
      
      return newRecord;
    } catch (err) {
      const errorMessage = 'Failed to record attendance';
      setError(errorMessage);
      console.error('useAttendance - recordAttendance error:', err);
      toast({
        title: "Recording failed",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    }
  }, [toast]);

  // Get latest attendance for staff
  const getLatestAttendanceForStaff = useCallback(async (staffId: string): Promise<AttendanceRecord | null> => {
    try {
      return await AttendanceDB.getLatestForStaff(staffId);
    } catch (err) {
      console.error('useAttendance - getLatestAttendanceForStaff error:', err);
      return null;
    }
  }, []);

  // Determine next attendance type
  const getNextAttendanceType = useCallback((lastRecord: AttendanceRecord | null): 'check-in' | 'check-out' => {
    if (!lastRecord) return 'check-in';
    
    const today = new Date();
    const lastDate = new Date(lastRecord.timestamp);
    const isToday = today.toDateString() === lastDate.toDateString();
    
    if (!isToday) return 'check-in';
    return lastRecord.type === 'check-in' ? 'check-out' : 'check-in';
  }, []);

  // Refresh attendance data
  const refreshAttendance = useCallback(() => {
    loadAttendance();
    loadTodayAttendance();
  }, [loadAttendance, loadTodayAttendance]);

  // Load attendance on hook initialization
  useEffect(() => {
    loadAttendance();
    loadTodayAttendance();
  }, [loadAttendance, loadTodayAttendance]);

  return {
    attendanceRecords,
    todayAttendance,
    isLoading,
    error,
    recordAttendance,
    getLatestAttendanceForStaff,
    getNextAttendanceType,
    loadAttendance,
    refreshAttendance
  };
}
