
import React from 'react';
import { Layout } from '@/components/Layout';
import { StaffList } from '@/components/StaffList';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

const StaffManagement = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Layout>
          <StaffList />
        </Layout>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default StaffManagement;
