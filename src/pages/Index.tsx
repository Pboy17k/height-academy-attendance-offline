
import React from 'react';
import { HomeAttendance } from '@/components/HomeAttendance';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

const Index = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <HomeAttendance />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default Index;
