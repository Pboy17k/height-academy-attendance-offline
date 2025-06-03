
import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatabaseService, Staff, AttendanceRecord } from '@/lib/database';
import { useToast } from '@/hooks/use-toast';
import { Fingerprint, Search, Clock, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function AttendanceStation() {
  const [staffId, setStaffId] = useState('');
  const [staff, setStaff] = useState<Staff | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastAttendance, setLastAttendance] = useState<AttendanceRecord | null>(null);
  const [searchMode, setSearchMode] = useState(true);
  const { toast } = useToast();
  const fingerprintRef = useRef<HTMLDivElement>(null);

  const searchStaff = async () => {
    if (!staffId.trim()) return;
    
    try {
      const foundStaff = await DatabaseService.getStaffByStaffId(staffId);
      if (foundStaff) {
        setStaff(foundStaff);
        const lastRecord = await DatabaseService.getStaffLatestAttendance(foundStaff.id);
        setLastAttendance(lastRecord);
        setSearchMode(false);
      } else {
        toast({
          title: "Staff not found",
          description: "No staff member found with this ID",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to search for staff member",
        variant: "destructive",
      });
    }
  };

  const simulateFingerprint = useCallback(async () => {
    if (!staff) return;
    
    setIsProcessing(true);
    
    // Simulate fingerprint scanning delay
    setTimeout(async () => {
      try {
        const nextType = getNextAttendanceType();
        const record = await DatabaseService.recordAttendance({
          staffId: staff.id,
          staffName: staff.fullName,
          type: nextType,
          timestamp: new Date(),
          method: 'fingerprint'
        });
        
        setLastAttendance(record);
        
        toast({
          title: "Success!",
          description: `${staff.fullName} has been ${nextType === 'check-in' ? 'checked in' : 'checked out'} successfully`,
        });
        
        // Show success message for a few seconds, then reset
        setTimeout(() => {
          resetStation();
        }, 3000);
        
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to record attendance",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
    }, 2000);
  }, [staff, lastAttendance, toast]);

  const getNextAttendanceType = (): 'check-in' | 'check-out' => {
    if (!lastAttendance) return 'check-in';
    
    const today = new Date();
    const lastDate = new Date(lastAttendance.timestamp);
    const isToday = today.toDateString() === lastDate.toDateString();
    
    if (!isToday) return 'check-in';
    return lastAttendance.type === 'check-in' ? 'check-out' : 'check-in';
  };

  const resetStation = () => {
    setStaff(null);
    setStaffId('');
    setLastAttendance(null);
    setSearchMode(true);
    setIsProcessing(false);
  };

  const getLastAttendanceToday = () => {
    if (!lastAttendance) return null;
    
    const today = new Date();
    const lastDate = new Date(lastAttendance.timestamp);
    const isToday = today.toDateString() === lastDate.toDateString();
    
    return isToday ? lastAttendance : null;
  };

  const todayLastAttendance = getLastAttendanceToday();

  if (!searchMode && staff) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Attendance Station</h1>
          <Button variant="outline" onClick={resetStation}>
            New Scan
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Staff Profile */}
          <Card>
            <CardHeader>
              <CardTitle>Staff Profile</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="mx-auto w-32 h-32 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                {staff.photo ? (
                  <img
                    src={staff.photo}
                    alt={staff.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-3xl font-bold text-gray-400">
                      {staff.fullName.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {staff.fullName}
                </h3>
                <p className="text-gray-500 dark:text-gray-400">{staff.role}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{staff.department}</p>
                <Badge variant="outline" className="mt-2">
                  ID: {staff.staffId}
                </Badge>
              </div>
              
              {todayLastAttendance && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    Last Activity Today
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    {todayLastAttendance.type === 'check-in' ? 'Checked In' : 'Checked Out'} at{' '}
                    {new Date(todayLastAttendance.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fingerprint Scanner */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Fingerprint className="h-5 w-5" />
                <span>Fingerprint Scanner</span>
              </CardTitle>
              <CardDescription>
                Place your finger on the scanner to {getNextAttendanceType().replace('-', ' ')}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <div
                ref={fingerprintRef}
                className={`mx-auto w-32 h-32 rounded-full border-4 flex items-center justify-center cursor-pointer transition-all duration-300 ${
                  isProcessing
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 animate-pulse'
                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                }`}
                onClick={simulateFingerprint}
              >
                {isProcessing ? (
                  <div className="text-blue-600">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <Fingerprint className="h-12 w-12 text-gray-400" />
                )}
              </div>
              
              <div>
                <Button
                  onClick={simulateFingerprint}
                  disabled={isProcessing}
                  size="lg"
                  className="w-full"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Fingerprint className="h-4 w-4 mr-2" />
                      {getNextAttendanceType() === 'check-in' ? 'Check In' : 'Check Out'}
                    </>
                  )}
                </Button>
              </div>

              <div className="text-sm text-gray-500 dark:text-gray-400">
                <p>Next action: <strong>{getNextAttendanceType().replace('-', ' ')}</strong></p>
                <p className="flex items-center justify-center mt-1">
                  <Clock className="h-4 w-4 mr-1" />
                  {new Date().toLocaleTimeString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Attendance Station</h1>
        <p className="text-gray-500 dark:text-gray-400">Fingerprint-based check-in and check-out system</p>
      </div>

      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Find Staff Member</span>
          </CardTitle>
          <CardDescription>Enter staff ID to begin attendance process</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="staffId">Staff ID</Label>
            <Input
              id="staffId"
              type="text"
              value={staffId}
              onChange={(e) => setStaffId(e.target.value.toUpperCase())}
              placeholder="Enter staff ID (e.g., STF001)"
              onKeyPress={(e) => e.key === 'Enter' && searchStaff()}
            />
          </div>
          <Button onClick={searchStaff} className="w-full" disabled={!staffId.trim()}>
            <Search className="h-4 w-4 mr-2" />
            Find Staff
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
