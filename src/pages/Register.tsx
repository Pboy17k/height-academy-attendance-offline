
import React from 'react';
import { Layout } from '@/components/Layout';
import { StaffRegistration } from '@/components/StaffRegistration';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

const Register = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Layout>
          <StaffRegistration />
        </Layout>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default Register;
