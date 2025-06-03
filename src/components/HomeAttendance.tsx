
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DigitalClock } from '@/components/DigitalClock';
import { AttendanceStation } from '@/components/AttendanceStation';
import { CompactLogin } from '@/components/CompactLogin';

export function HomeAttendance() {
  const { admin } = useAuth();

  if (!admin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex">
        {/* Main Content - Staff Check-In/Out */}
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="w-full max-w-4xl space-y-8">
            {/* Digital Clock */}
            <div className="text-center">
              <DigitalClock />
            </div>
            
            {/* Attendance Station */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
              <AttendanceStation />
            </div>
          </div>
        </div>

        {/* Admin Login Panel */}
        <div className="w-80 bg-white dark:bg-gray-800 shadow-2xl flex items-center justify-center p-6">
          <CompactLogin />
        </div>
      </div>
    );
  }

  // Admin is logged in - show regular dashboard layout
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Digital Clock */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <DigitalClock />
          </div>
        </div>
        
        {/* Attendance Station */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <AttendanceStation />
          </div>
        </div>
      </div>
    </div>
  );
}
