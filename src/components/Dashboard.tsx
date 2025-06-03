
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DatabaseService, AttendanceRecord, Staff } from '@/lib/database';
import { Clock, Users, UserCheck, UserX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function Dashboard() {
  const [todayRecords, setTodayRecords] = useState<AttendanceRecord[]>([]);
  const [allStaff, setAllStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [records, staff] = await Promise.all([
        DatabaseService.getTodayAttendance(),
        DatabaseService.getAllStaff()
      ]);
      setTodayRecords(records);
      setAllStaff(staff);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStaffStats = () => {
    const checkedInStaff = new Set();
    const checkedOutStaff = new Set();
    
    // Process today's records chronologically
    const sortedRecords = [...todayRecords].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    sortedRecords.forEach(record => {
      if (record.type === 'check-in') {
        checkedInStaff.add(record.staffId);
        checkedOutStaff.delete(record.staffId);
      } else {
        checkedOutStaff.add(record.staffId);
        checkedInStaff.delete(record.staffId);
      }
    });

    return {
      present: checkedInStaff.size,
      absent: allStaff.length - checkedInStaff.size,
      checkedOut: checkedOutStaff.size,
      total: allStaff.length
    };
  };

  const getRecentActivity = () => {
    return todayRecords
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);
  };

  if (loading) {
    return <div className="animate-pulse">Loading dashboard...</div>;
  }

  const stats = getStaffStats();
  const recentActivity = getRecentActivity();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400">Welcome to Greater Height Academy Attendance Platform</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Registered staff members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present Today</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.present}</div>
            <p className="text-xs text-muted-foreground">Currently checked in</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent Today</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
            <p className="text-xs text-muted-foreground">Not checked in yet</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{todayRecords.length}</div>
            <p className="text-xs text-muted-foreground">Today's activity</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest check-ins and check-outs today</CardDescription>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No activity recorded today
            </p>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg dark:border-gray-700">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      record.type === 'check-in' ? 'bg-green-500' : 'bg-orange-500'
                    }`} />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {record.staffName}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(record.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant={record.type === 'check-in' ? 'default' : 'secondary'}
                    className={record.type === 'check-in' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : ''}
                  >
                    {record.type === 'check-in' ? 'Check In' : 'Check Out'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
