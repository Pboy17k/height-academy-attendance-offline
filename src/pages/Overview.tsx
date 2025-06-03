
import React from 'react';
import { Layout } from '@/components/Layout';
import { OverviewDashboard } from '@/components/OverviewDashboard';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

const Overview = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Layout>
          <OverviewDashboard />
        </Layout>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default Overview;
