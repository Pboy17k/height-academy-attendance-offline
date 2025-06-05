
import { StaffDB, AttendanceDB } from './db';
import { LocalStorageBackup } from './storage';

const sampleStaffData = [
  {
    fullName: "Dr. Ahmed Hassan",
    email: "ahmed.hassan@alasracademy.edu",
    phone: "+20 123 456 7890",
    staffId: "STF001",
    department: "Administration",
    role: "Principal",
    photo: "/placeholder.svg",
    fingerprintId: "fp_001",
    isActive: true
  },
  {
    fullName: "Ms. Fatima Al-Zahra",
    email: "fatima.alzahra@alasracademy.edu",
    phone: "+20 123 456 7891",
    staffId: "STF002",
    department: "Teaching Staff",
    role: "Vice Principal",
    photo: "/placeholder.svg",
    fingerprintId: "fp_002",
    isActive: true
  },
  {
    fullName: "Mr. Omar Ibn Khattab",
    email: "omar.khattab@alasracademy.edu",
    phone: "+20 123 456 7892",
    staffId: "STF003",
    department: "Teaching Staff",
    role: "Teacher",
    photo: "/placeholder.svg",
    fingerprintId: "fp_003",
    isActive: true
  },
  {
    fullName: "Ms. Aisha Siddiqah",
    email: "aisha.siddiqah@alasracademy.edu",
    phone: "+20 123 456 7893",
    staffId: "STF004",
    department: "Library",
    role: "Librarian",
    photo: "/placeholder.svg",
    fingerprintId: "fp_004",
    isActive: true
  },
  {
    fullName: "Mr. Khalid Al-Waleed",
    email: "khalid.waleed@alasracademy.edu",
    phone: "+20 123 456 7894",
    staffId: "STF005",
    department: "Laboratory",
    role: "Lab Assistant",
    photo: "/placeholder.svg",
    fingerprintId: "fp_005",
    isActive: true
  },
  {
    fullName: "Ms. Zainab Al-Kubra",
    email: "zainab.kubra@alasracademy.edu",
    phone: "+20 123 456 7895",
    staffId: "STF006",
    department: "Administration",
    role: "Administrative Officer",
    photo: "/placeholder.svg",
    fingerprintId: "fp_006",
    isActive: true
  },
  {
    fullName: "Mr. Ali Ibn Abi Talib",
    email: "ali.talib@alasracademy.edu",
    phone: "+20 123 456 7896",
    staffId: "STF007",
    department: "Security",
    role: "Security Guard",
    photo: "/placeholder.svg",
    fingerprintId: "fp_007",
    isActive: true
  },
  {
    fullName: "Ms. Khadijah Al-Kubra",
    email: "khadijah.kubra@alasracademy.edu",
    phone: "+20 123 456 7897",
    staffId: "STF008",
    department: "Support Staff",
    role: "Accountant",
    photo: "/placeholder.svg",
    fingerprintId: "fp_008",
    isActive: true
  }
];

export async function generateSampleStaff(): Promise<void> {
  try {
    // Check if user has already modified data - if so, never regenerate
    if (LocalStorageBackup.hasUserModifiedData()) {
      console.log('User has modified data previously, skipping sample generation to preserve user changes');
      return;
    }

    // Check if any staff exists in the database
    const existingStaff = await StaffDB.getAll();
    
    // Only generate sample data if NO staff exists (completely empty database)
    if (existingStaff.length === 0) {
      console.log('Database is empty and no user modifications detected, generating initial sample staff...');
      
      // Create sample staff
      for (const staffData of sampleStaffData) {
        await StaffDB.create(staffData);
      }
      
      console.log(`Created ${sampleStaffData.length} sample staff members in IndexedDB`);
      
      // Generate some sample attendance records for today
      await generateSampleAttendance();
      
      // Important: Do NOT set the user data flag here - this is initial sample data
      console.log('Sample data generation completed without setting user modification flag');
    } else {
      console.log(`Database already contains ${existingStaff.length} staff members, skipping sample generation`);
    }
  } catch (error) {
    console.error('Failed to generate sample staff:', error);
  }
}

async function generateSampleAttendance(): Promise<void> {
  try {
    const staff = await StaffDB.getAll();
    const today = new Date();
    
    // Generate check-in records for some staff (simulate morning attendance)
    const checkInTimes = [
      new Date(today.getFullYear(), today.getMonth(), today.getDate(), 7, 30),
      new Date(today.getFullYear(), today.getMonth(), today.getDate(), 7, 45),
      new Date(today.getFullYear(), today.getMonth(), today.getDate(), 8, 0),
      new Date(today.getFullYear(), today.getMonth(), today.getDate(), 8, 15),
    ];
    
    for (let i = 0; i < Math.min(4, staff.length); i++) {
      await AttendanceDB.create({
        staffId: staff[i].id,
        staffName: staff[i].fullName,
        type: 'check-in',
        timestamp: checkInTimes[i],
        method: 'fingerprint',
        deviceInfo: 'Main Entrance Scanner'
      });
    }
    
    console.log('Generated sample attendance records');
  } catch (error) {
    console.error('Failed to generate sample attendance:', error);
  }
}
