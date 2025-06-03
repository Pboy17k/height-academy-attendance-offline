
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DatabaseService, Staff, AttendanceRecord } from '@/lib/database';
import { useToast } from '@/hooks/use-toast';
import { Download, FileText, Search, Clock, Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export function AttendanceReports() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    dateRange: 'today',
    staffId: 'all',
    type: 'all',
    startDate: '',
    endDate: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [records, filters, searchTerm]);

  const loadData = async () => {
    try {
      const [attendanceRecords, staffMembers] = await Promise.all([
        DatabaseService.getAttendanceRecords(),
        DatabaseService.getAllStaff()
      ]);
      
      // If no attendance records exist, create some sample data
      if (attendanceRecords.length === 0 && staffMembers.length > 0) {
        await generateSampleAttendanceData(staffMembers);
        const newRecords = await DatabaseService.getAttendanceRecords();
        setRecords(newRecords);
      } else {
        setRecords(attendanceRecords);
      }
      
      setStaff(staffMembers);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load attendance data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateSampleAttendanceData = async (staffMembers: Staff[]) => {
    const sampleRecords = [];
    const today = new Date();
    
    // Generate attendance for the past 7 days
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const date = new Date(today);
      date.setDate(date.getDate() - dayOffset);
      
      for (const staffMember of staffMembers) {
        // 80% chance of attendance
        if (Math.random() > 0.2) {
          // Check-in time (8-10 AM)
          const checkInTime = new Date(date);
          checkInTime.setHours(8 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60));
          
          await DatabaseService.recordAttendance({
            staffId: staffMember.id,
            staffName: staffMember.fullName,
            type: 'check-in',
            timestamp: checkInTime,
            method: 'fingerprint'
          });
          
          // 70% chance of check-out
          if (Math.random() > 0.3) {
            const checkOutTime = new Date(date);
            checkOutTime.setHours(16 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60));
            
            await DatabaseService.recordAttendance({
              staffId: staffMember.id,
              staffName: staffMember.fullName,
              type: 'check-out',
              timestamp: checkOutTime,
              method: 'fingerprint'
            });
          }
        }
      }
    }
  };

  const applyFilters = () => {
    let filtered = [...records];

    // Date range filter
    if (filters.dateRange !== 'custom') {
      const now = new Date();
      let startDate;
      
      switch (filters.dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(0);
      }
      
      filtered = filtered.filter(record => new Date(record.timestamp) >= startDate);
    } else if (filters.startDate && filters.endDate) {
      const start = new Date(filters.startDate);
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      
      filtered = filtered.filter(record => {
        const recordDate = new Date(record.timestamp);
        return recordDate >= start && recordDate <= end;
      });
    }

    // Staff filter
    if (filters.staffId !== 'all') {
      filtered = filtered.filter(record => record.staffId === filters.staffId);
    }

    // Type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter(record => record.type === filters.type);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(record => 
        record.staffName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredRecords(filtered);
  };

  const printReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Attendance Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .header { text-align: center; margin-bottom: 20px; }
            .meta { margin-bottom: 10px; }
            @media print { button { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Greater Height Academy</h1>
            <h2>Attendance Report</h2>
            <div class="meta">
              <p>Generated on: ${new Date().toLocaleDateString()}</p>
              <p>Total Records: ${filteredRecords.length}</p>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Staff Name</th>
                <th>Staff ID</th>
                <th>Type</th>
                <th>Method</th>
              </tr>
            </thead>
            <tbody>
              ${filteredRecords.map(record => `
                <tr>
                  <td>${new Date(record.timestamp).toLocaleDateString()}</td>
                  <td>${new Date(record.timestamp).toLocaleTimeString()}</td>
                  <td>${record.staffName}</td>
                  <td>${staff.find(s => s.id === record.staffId)?.staffId || 'N/A'}</td>
                  <td>${record.type}</td>
                  <td>${record.method}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);

    toast({
      title: "Success",
      description: "Print dialog opened successfully"
    });
  };

  const exportToPDF = async () => {
    try {
      const element = document.getElementById('attendance-table');
      if (!element) return;

      const canvas = await html2canvas(element);
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF();
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save('attendance-report.pdf');
      
      toast({
        title: "Success",
        description: "Report exported to PDF successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export PDF",
        variant: "destructive",
      });
    }
  };

  const exportToCSV = () => {
    try {
      const headers = ['Date', 'Time', 'Staff Name', 'Staff ID', 'Type', 'Method'];
      const csvData = filteredRecords.map(record => [
        new Date(record.timestamp).toLocaleDateString(),
        new Date(record.timestamp).toLocaleTimeString(),
        record.staffName,
        staff.find(s => s.id === record.staffId)?.staffId || 'N/A',
        record.type,
        record.method
      ]);

      const csvContent = [headers, ...csvData]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'attendance-report.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Success",
        description: "Report exported to CSV successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export CSV",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Attendance Reports</h1>
        <p className="text-gray-500 dark:text-gray-400">View and export attendance records</p>
      </div>

      {/* Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Date Range</Label>
              <Select
                value={filters.dateRange}
                onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Staff Member</Label>
              <Select
                value={filters.staffId}
                onValueChange={(value) => setFilters(prev => ({ ...prev, staffId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select staff" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Staff</SelectItem>
                  {staff.map(member => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Attendance Type</Label>
              <Select
                value={filters.type}
                onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="check-in">Check In</SelectItem>
                  <SelectItem value="check-out">Check Out</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search staff name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>

          {filters.dateRange === 'custom' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2">
            <Button onClick={printReport} variant="outline" className="flex items-center space-x-2">
              <Printer className="h-4 w-4" />
              <span>Print Report</span>
            </Button>
            <Button onClick={exportToPDF} variant="outline" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Export PDF</span>
            </Button>
            <Button onClick={exportToCSV} variant="outline" className="flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Attendance Records</CardTitle>
            <Badge variant="secondary">
              {filteredRecords.length} records found
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div id="attendance-table" className="overflow-x-auto">
            {filteredRecords.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No attendance records found for the selected criteria
              </p>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Date</th>
                    <th className="text-left p-3 font-medium">Time</th>
                    <th className="text-left p-3 font-medium">Staff Name</th>
                    <th className="text-left p-3 font-medium">Staff ID</th>
                    <th className="text-left p-3 font-medium">Type</th>
                    <th className="text-left p-3 font-medium">Method</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record) => (
                    <tr key={record.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="p-3">
                        {new Date(record.timestamp).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span>{new Date(record.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </td>
                      <td className="p-3 font-medium">
                        {record.staffName}
                      </td>
                      <td className="p-3">
                        <Badge variant="outline">
                          {staff.find(s => s.id === record.staffId)?.staffId || 'N/A'}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge 
                          variant={record.type === 'check-in' ? 'default' : 'secondary'}
                          className={record.type === 'check-in' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : ''}
                        >
                          {record.type === 'check-in' ? 'Check In' : 'Check Out'}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <span className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                          {record.method}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
