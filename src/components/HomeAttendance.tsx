
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DigitalClock } from '@/components/DigitalClock';
import { CompactLogin } from '@/components/CompactLogin';
import { useStaff } from '@/hooks/useStaff';
import { useAttendance } from '@/hooks/useAttendance';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon, Fingerprint } from 'lucide-react';
import { Staff, AttendanceRecord } from '@/lib/db';

export function HomeAttendance() {
  const { admin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [currentStaff, setCurrentStaff] = useState<Staff | null>(null);
  const [lastAttendance, setLastAttendance] = useState<AttendanceRecord | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  
  const { staff } = useStaff();
  const { 
    todayAttendance, 
    recordAttendance, 
    getLatestAttendanceForStaff, 
    getNextAttendanceType 
  } = useAttendance();

  const simulateFingerprintScan = async () => {
    setIsScanning(true);
    
    setTimeout(async () => {
      try {
        if (staff.length > 0) {
          const randomStaff = staff[Math.floor(Math.random() * staff.length)];
          const lastRecord = await getLatestAttendanceForStaff(randomStaff.id);
          
          const nextType = getNextAttendanceType(lastRecord);
          
          const newRecord = await recordAttendance({
            staffId: randomStaff.id,
            staffName: randomStaff.fullName,
            type: nextType,
            timestamp: new Date(),
            method: 'fingerprint'
          });
          
          if (newRecord) {
            setCurrentStaff(randomStaff);
            setLastAttendance(newRecord);
            
            setTimeout(() => {
              setCurrentStaff(null);
              setLastAttendance(null);
            }, 5000);
          }
          
        } else {
          console.warn('No staff found for fingerprint scan');
        }
      } catch (error) {
        console.error('Fingerprint scan failed:', error);
      } finally {
        setIsScanning(false);
      }
    }, 2000);
  };

  // Public attendance interface (no login required)
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <header className="absolute top-4 right-4 z-10">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleTheme}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
        >
          {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </Button>
      </header>

      {/* School Logo and Name Header */}
      <div className="absolute top-6 left-6 flex items-center space-x-3 z-10">
        <img 
          src="/lovable-uploads/fa512d41-576b-43a9-88ba-aaa4123bc20a.png" 
          alt="Al'asr Comprehensive Academy Logo" 
          className="h-12 w-12 object-contain"
        />
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Al'asr Comprehensive Academy
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Attendance Management System
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Attendance Station - 70% width */}
        <div className="flex-1 lg:w-[70%] flex flex-col items-center justify-center p-8 space-y-8 pt-24">
          <div className="text-center">
            <DigitalClock />
          </div>
          
          <Card className="w-full max-w-2xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-2xl">
            <CardContent className="p-12 text-center space-y-8">
              {currentStaff && lastAttendance ? (
                <div className="space-y-6 animate-fade-in">
                  <div className="w-32 h-32 mx-auto rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 border-4 border-green-500">
                    {currentStaff.photo ? (
                      <img
                        src={currentStaff.photo}
                        alt={currentStaff.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-4xl font-bold text-gray-400">
                          {currentStaff.fullName.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                      Welcome, {currentStaff.fullName.split(' ')[0]}!
                    </h2>
                    <Badge variant={lastAttendance.type === 'check-in' ? 'default' : 'secondary'} className="text-lg px-4 py-2">
                      {lastAttendance.type === 'check-in' ? 'Checked In' : 'Checked Out'} at{' '}
                      {new Date(lastAttendance.timestamp).toLocaleTimeString()}
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div
                    className={`mx-auto w-48 h-48 rounded-full border-8 flex items-center justify-center cursor-pointer transition-all duration-300 ${
                      isScanning
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 animate-pulse shadow-lg shadow-blue-500/50'
                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                    }`}
                    onClick={simulateFingerprintScan}
                    style={{
                      animation: isScanning 
                        ? 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite' 
                        : 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                    }}
                  >
                    <Fingerprint 
                      className={`h-20 w-20 ${
                        isScanning 
                          ? 'text-blue-600 animate-pulse' 
                          : 'text-blue-500 dark:text-blue-400'
                      } transition-all duration-300`}
                      style={{
                        animation: !isScanning ? 'pulse 3s ease-in-out infinite' : undefined
                      }}
                    />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                      {isScanning ? 'Scanning Fingerprint...' : 'Touch to Scan'}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-lg">
                      {isScanning ? 'Verifying identity...' : 'Place your finger to check in or out'}
                    </p>
                    {!isScanning && (
                      <div className="mt-4 flex items-center justify-center space-x-2 text-blue-500 dark:text-blue-400">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {todayAttendance.length > 0 && (
            <Card className="w-full max-w-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Today's Activity
                </h3>
                <div className="space-y-2">
                  {todayAttendance.slice(0, 5).map((record) => (
                    <div key={record.id} className="flex justify-between items-center p-2 rounded bg-gray-50 dark:bg-gray-700">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {record.staffName}
                      </span>
                      <div className="flex items-center space-x-2">
                        <Badge variant={record.type === 'check-in' ? 'default' : 'secondary'} className="text-xs">
                          {record.type === 'check-in' ? 'In' : 'Out'}
                        </Badge>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(record.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Admin Login Panel - 30% width */}
        <div className="lg:w-[30%] bg-white dark:bg-gray-800 shadow-2xl flex items-center justify-center p-6 lg:border-l border-gray-200 dark:border-gray-700">
          <CompactLogin />
        </div>
      </div>
    </div>
  );
}
