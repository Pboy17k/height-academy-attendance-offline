
import { StaffDB } from './db';

export async function generateSampleStaff() {
  const existingStaff = await StaffDB.getAll();
  if (existingStaff.length > 0) {
    console.log('Sample staff already exists, skipping generation');
    return;
  }

  console.log('Generating sample staff data...');

  const sampleStaff = [
    {
      fullName: 'Ahmed Al-Rashid',
      email: 'ahmed.rashid@alasracademy.edu',
      phone: '+1-555-0101',
      staffId: 'STF001',
      department: 'Mathematics',
      role: 'Senior Teacher',
      photo: '',
      isActive: true,
    },
    {
      fullName: 'Fatima Al-Zahra',
      email: 'fatima.zahra@alasracademy.edu',
      phone: '+1-555-0102',
      staffId: 'STF002',
      department: 'English',
      role: 'Head of Department',
      photo: '',
      isActive: true,
    },
    {
      fullName: 'Omar Hassan',
      email: 'omar.hassan@alasracademy.edu',
      phone: '+1-555-0103',
      staffId: 'STF003',
      department: 'Science',
      role: 'Laboratory Technician',
      photo: '',
      isActive: true,
    },
    {
      fullName: 'Aisha Ibrahim',
      email: 'aisha.ibrahim@alasracademy.edu',
      phone: '+1-555-0104',
      staffId: 'STF004',
      department: 'History',
      role: 'Teacher',
      photo: '',
      isActive: true,
    },
    {
      fullName: 'Yusuf Al-Mahmoud',
      email: 'yusuf.mahmoud@alasracademy.edu',
      phone: '+1-555-0105',
      staffId: 'STF005',
      department: 'Physical Education',
      role: 'Sports Coordinator',
      photo: '',
      isActive: true,
    },
    {
      fullName: 'Zainab Al-Kindi',
      email: 'zainab.kindi@alasracademy.edu',
      phone: '+1-555-0106',
      staffId: 'STF006',
      department: 'Art',
      role: 'Art Teacher',
      photo: '',
      isActive: true,
    },
    {
      fullName: 'Ibrahim Al-Farisi',
      email: 'ibrahim.farisi@alasracademy.edu',
      phone: '+1-555-0107',
      staffId: 'STF007',
      department: 'Music',
      role: 'Music Director',
      photo: '',
      isActive: true,
    },
    {
      fullName: 'Maryam Al-Andalusi',
      email: 'maryam.andalusi@alasracademy.edu',
      phone: '+1-555-0108',
      staffId: 'STF008',
      department: 'Administration',
      role: 'Principal',
      photo: '',
      isActive: true,
    }
  ];

  try {
    for (const staff of sampleStaff) {
      await StaffDB.create(staff);
    }
    console.log('Sample staff data generated successfully');
  } catch (error) {
    console.error('Failed to generate sample staff:', error);
  }
}
