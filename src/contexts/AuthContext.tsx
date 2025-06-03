
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { DatabaseService, Admin } from '@/lib/database';

interface AuthContextType {
  admin: Admin | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      await DatabaseService.initializeDefaultAdmin();
      // Check if there's a stored session
      const storedAdminId = localStorage.getItem('adminSession');
      if (storedAdminId) {
        const storedAdmin = localStorage.getItem('adminData');
        if (storedAdmin) {
          setAdmin(JSON.parse(storedAdmin));
        }
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const adminUser = await DatabaseService.getAdminByUsername(username);
      if (!adminUser) return false;

      // Simple password verification - in production use bcrypt
      const passwordHash = btoa(password);
      if (adminUser.passwordHash !== passwordHash) return false;

      await DatabaseService.updateAdminLastLogin(adminUser.id);
      setAdmin(adminUser);
      
      // Store session
      localStorage.setItem('adminSession', adminUser.id);
      localStorage.setItem('adminData', JSON.stringify(adminUser));
      
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const logout = () => {
    setAdmin(null);
    localStorage.removeItem('adminSession');
    localStorage.removeItem('adminData');
  };

  return (
    <AuthContext.Provider value={{ admin, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
