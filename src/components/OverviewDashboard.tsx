
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatabaseService, AttendanceRecord, Staff } from '@/lib/database';
import { Users, UserCheck, UserX, BarChart3, Clock, TrendingUp, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

export function OverviewDashboard() {
  const [todayRecords, setTodayRecords] = useState<AttendanceRecord[]>([]);
  const [allStaff, setAllStaff] = useState<Staff[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
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
      
      const weekData = await generateWeeklyData();
      setWeeklyData(weekData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateWeeklyData = async () => {
    const weekData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      
      const dayRecords = await DatabaseService.getAttendanceRecords({
        startDate: date,
        endDate: nextDay
      });
      
      const checkedInStaff = new Set();
      dayRecords.forEach(record => {
        if (record.type === 'check-in') {
          checkedInStaff.add(record.staffId);
        }
      });
      
      weekData.push({
        day: date.toLocaleDateString('en', { weekday: 'short' }),
        present: checkedInStaff.size,
        absent: allStaff.length - checkedInStaff.size,
        total: allStaff.length
      });
    }
    return weekData;
  };

  const getStaffStats = () => {
    const checkedInStaff = new Set();
    const checkedOutStaff = new Set();
    
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
      total: allStaff.length,
      presentPercentage: allStaff.length > 0 ? (checkedInStaff.size / allStaff.length) * 100 : 0
    };
  };

  const getRecentActivity = () => {
    return todayRecords
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const stats = getStaffStats();
  const recentActivity = getRecentActivity();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Attendance Overview</h1>
        <p className="text-gray-500 dark:text-gray-400">Real-time attendance monitoring and analytics</p>
      </div>

      {/* Main Stats Cards - Matching your image design */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-slate-200 dark:border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Staff</CardTitle>
            <div className="p-2 bg-slate-600 dark:bg-slate-400 rounded-lg">
              <Users className="h-4 w-4 text-white dark:text-slate-800" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">{stats.total}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Registered in system</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-600 dark:text-green-400">Present Today</CardTitle>
            <div className="p-2 bg-green-500 rounded-lg">
              <UserCheck className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700 dark:text-green-300">{stats.present}</div>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">Checked in today</p>
            <Progress value={stats.presentPercentage} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-600 dark:text-red-400">Absent Today</CardTitle>
            <div className="p-2 bg-red-500 rounded-lg">
              <UserX className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-700 dark:text-red-300">{stats.absent}</div>
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">Not checked in</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Records</CardTitle>
            <div className="p-2 bg-blue-500 rounded-lg">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">{todayRecords.length}</div>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Attendance entries</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Attendance Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Weekly Attendance Trend</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="present" stroke="#10b981" strokeWidth={2} name="Present" />
                  <Line type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={2} name="Absent" />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Daily Activity Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Daily Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="present" fill="#10b981" name="Present" />
                  <Bar dataKey="absent" fill="#ef4444" name="Absent" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Recent Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No activity recorded today
            </p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200">
                  <div className="flex items-center space-x-4">
                    <div className={`w-3 h-3 rounded-full ${
                      record.type === 'check-in' ? 'bg-green-500' : 'bg-orange-500'
                    }`} />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {record.staffName}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
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
