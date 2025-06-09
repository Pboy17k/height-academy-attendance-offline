
import { DBSchema } from 'idb';

// Database schema interface
export interface AttendanceSystemDB extends DBSchema {
  staff: {
    key: string;
    value: Staff;
    indexes: { 'by-staffId': string; 'by-email': string };
  };
  attendance: {
    key: string;
    value: AttendanceRecord;
    indexes: { 'by-staffId': string; 'by-date': string; 'by-timestamp': Date };
  };
  admin: {
    key: string;
    value: Admin;
    indexes: { 'by-username': string };
  };
  settings: {
    key: string;
    value: AppSettingsRecord;
  };
}

// Core types
export interface Staff {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  staffId: string;
  department: string;
  role: string;
  photo: string;
  fingerprintId?: string;
  createdAt: Date;
  isActive: boolean;
}

export interface AttendanceRecord {
  id: string;
  staffId: string;
  staffName: string;
  type: 'check-in' | 'check-out';
  timestamp: Date;
  method: 'fingerprint' | 'manual';
  deviceInfo?: string;
}

export interface Admin {
  id: string;
  username: string;
  passwordHash: string;
  fullName: string;
  email: string;
  role: 'super-admin' | 'admin';
  createdAt: Date;
  lastLogin?: Date;
}

export interface AppSettings {
  theme: 'light' | 'dark';
  autoLogout: number;
  requireFingerprint: boolean;
  workingHours: {
    start: string;
    end: string;
  };
}

// Internal type for storage (includes id)
export interface AppSettingsRecord extends AppSettings {
  id: string;
}
