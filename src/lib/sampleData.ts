
import { DatabaseService } from './database';

export async function generateSampleStaff() {
  const existingStaff = await DatabaseService.getAllStaff();
  if (existingStaff.length > 0) return;

  const sampleStaff = [
    {
      fullName: 'John Smith',
      email: 'john.smith@greaterheight.edu',
      phone: '+1-555-0101',
      staffId: 'STF001',
      department: 'Mathematics',
      role: 'Senior Teacher',
      photo: '', // You can add base64 image data here
    },
    {
      fullName: 'Sarah Johnson',
      email: 'sarah.johnson@greaterheight.edu',
      phone: '+1-555-0102',
      staffId: 'STF002',
      department: 'English',
      role: 'Head of Department',
      photo: '',
    },
    {
      fullName: 'Michael Brown',
      email: 'michael.brown@greaterheight.edu',
      phone: '+1-555-0103',
      staffId: 'STF003',
      department: 'Science',
      role: 'Laboratory Technician',
      photo: '',
    },
    {
      fullName: 'Emily Davis',
      email: 'emily.davis@greaterheight.edu',
      phone: '+1-555-0104',
      staffId: 'STF004',
      department: 'History',
      role: 'Teacher',
      photo: '',
    },
    {
      fullName: 'David Wilson',
      email: 'david.wilson@greaterheight.edu',
      phone: '+1-555-0105',
      staffId: 'STF005',
      department: 'Physical Education',
      role: 'Sports Coordinator',
      photo: '',
    },
    {
      fullName: 'Lisa Garcia',
      email: 'lisa.garcia@greaterheight.edu',
      phone: '+1-555-0106',
      staffId: 'STF006',
      department: 'Art',
      role: 'Art Teacher',
      photo: '',
    },
    {
      fullName: 'Robert Martinez',
      email: 'robert.martinez@greaterheight.edu',
      phone: '+1-555-0107',
      staffId: 'STF007',
      department: 'Music',
      role: 'Music Director',
      photo: '',
    },
    {
      fullName: 'Jennifer Taylor',
      email: 'jennifer.taylor@greaterheight.edu',
      phone: '+1-555-0108',
      staffId: 'STF008',
      department: 'Administration',
      role: 'Principal',
      photo: '',
    }
  ];

  for (const staff of sampleStaff) {
    await DatabaseService.createStaff(staff);
  }
}
