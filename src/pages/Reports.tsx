
import React from 'react';
import { Layout } from '@/components/Layout';
import { AttendanceReports } from '@/components/AttendanceReports';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

const Reports = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Layout>
          <AttendanceReports />
        </Layout>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default Reports;
