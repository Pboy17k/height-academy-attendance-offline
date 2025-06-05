
import { StaffDB, AttendanceDB } from './db';
import { LocalStorageBackup } from './storage';

// Sample data arrays kept for reference but not used for auto-generation
const sampleStaffData = [
  // Data kept for reference only - not used for auto-generation
];

export async function generateSampleStaff(): Promise<void> {
  try {
    // Sample data generation is now completely disabled
    // Users must create their own staff data manually
    console.log('Sample data generation is disabled - users must create data manually');
    return;
  } catch (error) {
    console.error('Sample data generation error (disabled):', error);
  }
}

async function generateSampleAttendance(): Promise<void> {
  try {
    // Sample attendance generation is also disabled
    console.log('Sample attendance generation is disabled');
    return;
  } catch (error) {
    console.error('Sample attendance generation error (disabled):', error);
  }
}
