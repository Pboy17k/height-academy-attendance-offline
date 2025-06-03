
import React from 'react';
import { Layout } from '@/components/Layout';
import { AttendanceStation } from '@/components/AttendanceStation';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

const Attendance = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Layout>
          <AttendanceStation />
        </Layout>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default Attendance;
