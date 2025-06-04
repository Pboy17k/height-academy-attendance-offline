import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DatabaseService, AttendanceRecord, Staff } from '@/lib/database';
import { Clock, Users, UserCheck, UserX, Activity, Calendar, TrendingUp, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

export function Dashboard() {
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
      
      // Generate weekly data
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
      .slice(0, 8);
  };

  const getPieChartData = () => {
    const stats = getStaffStats();
    return [
      { name: 'Present', value: stats.present, color: '#10b981' },
      { name: 'Absent', value: stats.absent, color: '#ef4444' },
      { name: 'Checked Out', value: stats.checkedOut, color: '#f59e0b' }
    ];
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
  const pieData = getPieChartData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400">Welcome to Al'asr Comprehensive Academy Attendance Platform</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Registered staff members</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present Today</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.present}</div>
            <Progress value={stats.presentPercentage} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {stats.presentPercentage.toFixed(1)}% attendance rate
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent Today</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
            <p className="text-xs text-muted-foreground">Not checked in yet</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200">
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

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Attendance Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Weekly Attendance Trend</span>
            </CardTitle>
            <CardDescription>Staff attendance over the past 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="present" stroke="#10b981" strokeWidth={2} />
                  <Line type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Attendance Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Today's Distribution</span>
            </CardTitle>
            <CardDescription>Current attendance breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Recent Activity</span>
          </CardTitle>
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
                <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
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
