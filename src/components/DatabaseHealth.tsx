
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LocalStorageBackup } from '@/lib/storage';
import { EnhancedStorageService } from '@/lib/enhancedStorage';
import { useStaff } from '@/hooks/useStaff';
import { Download, Upload, Shield, Database, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DatabaseHealth {
  lastBackup: string;
  totalStaff: number;
  totalAttendance: number;
  integrityCheck: boolean;
  lastValidation: string;
}

export function DatabaseHealth() {
  const [health, setHealth] = useState<DatabaseHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { staff, refreshStaff } = useStaff();
  const { toast } = useToast();

  useEffect(() => {
    loadHealthStatus();
    const interval = setInterval(loadHealthStatus, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadHealthStatus = async () => {
    try {
      const healthData = await LocalStorageBackup.getHealthStatus();
      setHealth(healthData);
    } catch (error) {
      console.error('Failed to load health status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      await LocalStorageBackup.exportData(staff);
      toast({
        title: "Data exported",
        description: "Your data has been exported to a backup file",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export data",
        variant: "destructive",
      });
    }
  };

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      const imported = await LocalStorageBackup.importData(content);
      
      if (imported) {
        // This would require additional integration with the database
        toast({
          title: "Import successful",
          description: `Imported ${imported.staff.length} staff members`,
        });
        refreshStaff();
      } else {
        toast({
          title: "Import failed",
          description: "Invalid backup file or corrupted data",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Import failed",
        description: "Failed to read backup file",
        variant: "destructive",
      });
    }
  };

  const handleValidateIntegrity = async () => {
    try {
      const isValid = await EnhancedStorageService.validateDataIntegrity();
      toast({
        title: isValid ? "Data integrity confirmed" : "Data integrity issue",
        description: isValid ? "All data is valid and secure" : "Some data may be corrupted",
        variant: isValid ? "default" : "destructive",
      });
      await loadHealthStatus();
    } catch (error) {
      toast({
        title: "Validation failed",
        description: "Failed to validate data integrity",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Database className="h-5 w-5" />
          <span>Database Health</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {health ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                  <Badge variant={health.integrityCheck ? "default" : "destructive"}>
                    {health.integrityCheck ? "Healthy" : "Issue"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Staff Count:</span>
                  <span className="font-medium">{health.totalStaff}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Last Backup:</span>
                  <span className="text-xs font-medium">
                    {new Date(health.lastBackup).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Last Check:</span>
                  <span className="text-xs font-medium">
                    {new Date(health.lastValidation).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={handleExportData} className="flex items-center space-x-1">
                <Download className="h-3 w-3" />
                <span>Export Backup</span>
              </Button>
              
              <Button size="sm" variant="outline" className="flex items-center space-x-1">
                <Upload className="h-3 w-3" />
                <label htmlFor="import-file" className="cursor-pointer">
                  Import Backup
                </label>
                <input
                  id="import-file"
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  className="hidden"
                />
              </Button>
              
              <Button size="sm" variant="outline" onClick={handleValidateIntegrity} className="flex items-center space-x-1">
                <Shield className="h-3 w-3" />
                <span>Validate</span>
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <Database className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No health data available
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
