import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DigitalClock } from '@/components/DigitalClock';
import { CompactLogin } from '@/components/CompactLogin';
import { DeviceStatus } from '@/components/DeviceStatus';
import { useStaff } from '@/hooks/useStaff';
import { useAttendance } from '@/hooks/useAttendance';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon, Fingerprint } from 'lucide-react';
import { Staff, AttendanceRecord } from '@/lib/db';
import { BiometricService } from '@/services/biometricService';
import { FingerprintMatcher } from '@/services/fingerprintMatcher';
import { useToast } from '@/hooks/use-toast';

export function HomeAttendance() {
  const { admin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const [currentStaff, setCurrentStaff] = useState<Staff | null>(null);
  const [lastAttendance, setLastAttendance] = useState<AttendanceRecord | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [biometricConnected, setBiometricConnected] = useState(false);
  const [scanStatus, setScanStatus] = useState<'waiting' | 'scanning' | 'success' | 'error'>('waiting');
  const [deviceReady, setDeviceReady] = useState(false);
  
  const { staff } = useStaff();
  const { 
    todayAttendance, 
    recordAttendance, 
    getLatestAttendanceForStaff, 
    getNextAttendanceType 
  } = useAttendance();

  useEffect(() => {
    const initializeBiometric = async () => {
      try {
        console.log('🚀 Initializing Al\'asr Academy Biometric System...');
        await BiometricService.initialize();
        await FingerprintMatcher.initialize();
        
        const connected = BiometricService.isDeviceConnected();
        setBiometricConnected(connected);
        
        if (connected) {
          console.log('✅ SecureGen Hamster auto-connected and ready');
        } else {
          console.log('⚠️ SecureGen Hamster not found - manual connection required');
        }
      } catch (error) {
        console.error('❌ Failed to initialize biometric system:', error);
      }
    };

    initializeBiometric();

    // Listen for connection changes
    const handleConnectionChange = (connected: boolean) => {
      setBiometricConnected(connected);
      if (!connected) {
        setDeviceReady(false);
      }
    };

    // Listen for device test results
    const handleDeviceTest = (status: 'testing' | 'ready' | 'error') => {
      setDeviceReady(status === 'ready');
    };

    BiometricService.onConnectionChange(handleConnectionChange);
    BiometricService.onDeviceTest(handleDeviceTest);

    // Listen for real fingerprint scans only
    const handleFingerprintDetected = async (reading: any) => {
      if (isScanning) return; // Prevent multiple simultaneous scans
      
      setIsScanning(true);
      setScanStatus('scanning');
      
      try {
        console.log('👆 Processing real fingerprint scan...');
        
        // Match fingerprint to staff member
        const matchedStaff = await FingerprintMatcher.matchFingerprint(reading.template);
        
        if (matchedStaff) {
          const lastRecord = await getLatestAttendanceForStaff(matchedStaff.id);
          const nextType = getNextAttendanceType(lastRecord);
          
          const newRecord = await recordAttendance({
            staffId: matchedStaff.id,
            staffName: matchedStaff.fullName,
            type: nextType,
            timestamp: new Date(),
            method: 'fingerprint'
          });
          
          if (newRecord) {
            setCurrentStaff(matchedStaff);
            setLastAttendance(newRecord);
            setScanStatus('success');
            
            toast({
              title: "Attendance Recorded!",
              description: `${matchedStaff.fullName} has been ${nextType === 'check-in' ? 'checked in' : 'checked out'} successfully`,
            });
            
            // Clear display after 5 seconds
            setTimeout(() => {
              setCurrentStaff(null);
              setLastAttendance(null);
              setScanStatus('waiting');
            }, 5000);
          }
        } else {
          setScanStatus('error');
          console.log('❌ Fingerprint not recognized');
          
          toast({
            title: "Fingerprint Not Recognized",
            description: "Please try again or contact administrator",
            variant: "destructive",
          });
          
          // Reset status after 3 seconds
          setTimeout(() => {
            setScanStatus('waiting');
          }, 3000);
        }
      } catch (error) {
        console.error('❌ Fingerprint processing failed:', error);
        setScanStatus('error');
        setTimeout(() => {
          setScanStatus('waiting');
        }, 3000);
      } finally {
        setIsScanning(false);
      }
    };

    BiometricService.onFingerprintDetected(handleFingerprintDetected);

    return () => {
      BiometricService.removeListener(handleFingerprintDetected);
      BiometricService.removeConnectionListener(handleConnectionChange);
      BiometricService.removeDeviceTestListener(handleDeviceTest);
    };
  }, [isScanning, getLatestAttendanceForStaff, getNextAttendanceType, recordAttendance, toast]);

  const getScannerStatus = () => {
    switch (scanStatus) {
      case 'scanning':
        return {
          text: 'Scanning Fingerprint...',
          subtext: 'Verifying identity...',
          color: 'text-blue-600',
          bgColor: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
        };
      case 'success':
        return {
          text: 'Scan Successful!',
          subtext: 'Welcome back!',
          color: 'text-green-600',
          bgColor: 'border-green-500 bg-green-50 dark:bg-green-900/20'
        };
      case 'error':
        return {
          text: 'Scan Failed',
          subtext: 'Fingerprint not recognized',
          color: 'text-red-600',
          bgColor: 'border-red-500 bg-red-50 dark:bg-red-900/20'
        };
      default:
        if (deviceReady) {
          return {
            text: 'Fingerprint Ready!',
            subtext: 'SecureGen Hamster ready for scanning',
            color: 'text-green-500 dark:text-green-400',
            bgColor: 'border-green-300 dark:border-green-600 hover:border-green-400'
          };
        } else if (biometricConnected) {
          return {
            text: 'Device Connected',
            subtext: 'Running diagnostics...',
            color: 'text-blue-500 dark:text-blue-400',
            bgColor: 'border-blue-300 dark:border-blue-600'
          };
        } else {
          return {
            text: 'Waiting for Device...',
            subtext: 'Connect SecureGen Hamster to begin',
            color: 'text-orange-500 dark:text-orange-400',
            bgColor: 'border-orange-300 dark:border-orange-600'
          };
        }
    }
  };

  const status = getScannerStatus();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <header className="absolute top-4 right-4 z-10 flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleTheme}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
        >
          {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </Button>
      </header>

      {/* School Logo and Enhanced Device Status */}
      <div className="absolute top-6 left-6 z-10 space-y-3">
        <div className="flex items-center space-x-3">
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
              Auto-Detecting Biometric Attendance System
            </p>
          </div>
        </div>
        
        <DeviceStatus compact onDeviceReady={() => setDeviceReady(true)} />
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
                    className={`mx-auto w-48 h-48 rounded-full border-8 flex items-center justify-center transition-all duration-300 ${status.bgColor} ${
                      deviceReady ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                    }`}
                  >
                    <Fingerprint 
                      className={`h-20 w-20 ${status.color} transition-all duration-300 ${
                        scanStatus === 'scanning' ? 'animate-pulse' : ''
                      }`}
                    />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                      {status.text}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-lg">
                      {status.subtext}
                    </p>
                    {scanStatus === 'waiting' && deviceReady && (
                      <div className="mt-4 flex items-center justify-center space-x-2 text-green-500 dark:text-green-400">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
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
