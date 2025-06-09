
import { getDB } from './connection';
import { AttendanceRecord } from './types';

export class AttendanceDB {
  static async create(record: Omit<AttendanceRecord, 'id'>): Promise<AttendanceRecord> {
    try {
      const db = await getDB();
      const newRecord: AttendanceRecord = {
        ...record,
        id: crypto.randomUUID()
      };
      
      await db.add('attendance', newRecord);
      console.log('Attendance recorded in IndexedDB:', newRecord.staffName, newRecord.type);
      return newRecord;
    } catch (error) {
      console.error('Failed to record attendance in IndexedDB:', error);
      throw new Error('Failed to record attendance');
    }
  }

  static async getAll(filters?: {
    startDate?: Date;
    endDate?: Date;
    staffId?: string;
    type?: 'check-in' | 'check-out';
  }): Promise<AttendanceRecord[]> {
    try {
      const db = await getDB();
      let records = await db.getAll('attendance');
      
      if (filters) {
        records = records.filter(record => {
          if (filters.startDate && new Date(record.timestamp) < filters.startDate) return false;
          if (filters.endDate && new Date(record.timestamp) > filters.endDate) return false;
          if (filters.staffId && record.staffId !== filters.staffId) return false;
          if (filters.type && record.type !== filters.type) return false;
          return true;
        });
      }
      
      return records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.error('Failed to get attendance records from IndexedDB:', error);
      return [];
    }
  }

  static async getToday(): Promise<AttendanceRecord[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return this.getAll({
      startDate: today,
      endDate: tomorrow
    });
  }

  static async getLatestForStaff(staffId: string): Promise<AttendanceRecord | null> {
    try {
      const records = await this.getAll({ staffId });
      return records.length > 0 ? records[0] : null;
    } catch (error) {
      console.error('Failed to get latest attendance for staff from IndexedDB:', error);
      return null;
    }
  }
}
