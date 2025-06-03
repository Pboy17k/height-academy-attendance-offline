
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DigitalClock } from '@/components/DigitalClock';
import { CompactLogin } from '@/components/CompactLogin';
import { DatabaseService, Staff, AttendanceRecord } from '@/lib/database';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon, Fingerprint } from 'lucide-react';

export function HomeAttendance() {
  const { admin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [currentStaff, setCurrentStaff] = useState<Staff | null>(null);
  const [lastAttendance, setLastAttendance] = useState<AttendanceRecord | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [recentActivity, setRecentActivity] = useState<AttendanceRecord[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadRecentActivity();
  }, []);

  const loadRecentActivity = async () => {
    try {
      const records = await DatabaseService.getTodayAttendance();
      setRecentActivity(records.slice(0, 5));
    } catch (error) {
      console.error('Failed to load recent activity:', error);
    }
  };

  const simulateFingerprintScan = async () => {
    setIsScanning(true);
    
    setTimeout(async () => {
      try {
        const allStaff = await DatabaseService.getAllStaff();
        if (allStaff.length > 0) {
          const randomStaff = allStaff[Math.floor(Math.random() * allStaff.length)];
          const lastRecord = await DatabaseService.getStaffLatestAttendance(randomStaff.id);
          
          if (lastRecord) {
            const timeDiff = Date.now() - new Date(lastRecord.timestamp).getTime();
            const minutesDiff = timeDiff / (1000 * 60);
            
            if (minutesDiff < 10) {
              toast({
                title: "Too Soon",
                description: `Please wait ${Math.ceil(10 - minutesDiff)} more minutes before next scan`,
                variant: "destructive",
              });
              setIsScanning(false);
              return;
            }
          }
          
          const nextType = getNextAttendanceType(lastRecord);
          
          const newRecord = await DatabaseService.recordAttendance({
            staffId: randomStaff.id,
            staffName: randomStaff.fullName,
            type: nextType,
            timestamp: new Date(),
            method: 'fingerprint'
          });
          
          setCurrentStaff(randomStaff);
          setLastAttendance(newRecord);
          loadRecentActivity();
          
          toast({
            title: "Success!",
            description: `${randomStaff.fullName} ${nextType === 'check-in' ? 'checked in' : 'checked out'} successfully`,
          });
          
          setTimeout(() => {
            setCurrentStaff(null);
            setLastAttendance(null);
          }, 5000);
          
        } else {
          toast({
            title: "No Staff Found",
            description: "Please register staff members first",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Scan Failed",
          description: "Fingerprint not recognized",
          variant: "destructive",
        });
      } finally {
        setIsScanning(false);
      }
    }, 2000);
  };

  const getNextAttendanceType = (lastRecord: AttendanceRecord | null): 'check-in' | 'check-out' => {
    if (!lastRecord) return 'check-in';
    
    const today = new Date();
    const lastDate = new Date(lastRecord.timestamp);
    const isToday = today.toDateString() === lastDate.toDateString();
    
    if (!isToday) return 'check-in';
    return lastRecord.type === 'check-in' ? 'check-out' : 'check-in';
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

      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Attendance Station - 70% width */}
        <div className="flex-1 lg:w-[70%] flex flex-col items-center justify-center p-8 space-y-8">
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
                    className={`mx-auto w-40 h-40 rounded-full border-8 flex items-center justify-center cursor-pointer transition-all duration-300 ${
                      isScanning
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 animate-pulse'
                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                    }`}
                    onClick={simulateFingerprintScan}
                  >
                    <Fingerprint className={`h-16 w-16 ${isScanning ? 'text-blue-600 animate-pulse' : 'text-gray-400'} transition-all duration-300`} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {isScanning ? 'Scanning...' : 'Place Your Finger'}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400">
                      {isScanning ? 'Verifying fingerprint...' : 'Touch the scanner to check in or out'}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {recentActivity.length > 0 && (
            <Card className="w-full max-w-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Today's Activity
                </h3>
                <div className="space-y-2">
                  {recentActivity.map((record) => (
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
