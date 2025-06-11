
import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Fingerprint, Usb, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { BiometricService } from '@/services/biometricService';
import { useToast } from '@/hooks/use-toast';

interface DeviceStatusProps {
  compact?: boolean;
  onDeviceReady?: () => void;
}

export function DeviceStatus({ compact = false, onDeviceReady }: DeviceStatusProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'scanning' | 'disconnected'>('disconnected');
  const [deviceTestStatus, setDeviceTestStatus] = useState<'testing' | 'ready' | 'error' | 'idle'>('idle');
  const [deviceError, setDeviceError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Initialize status
    setIsConnected(BiometricService.isDeviceConnected());
    setConnectionStatus(BiometricService.getConnectionStatus());

    // Listen for connection changes
    const handleConnectionChange = (connected: boolean) => {
      setIsConnected(connected);
      setConnectionStatus(BiometricService.getConnectionStatus());
      setDeviceError(null);
      
      if (connected) {
        toast({
          title: "Device Connected!",
          description: "SecureGen Hamster is ready for fingerprint scanning",
        });
      } else {
        setDeviceTestStatus('idle');
        toast({
          title: "Device Disconnected",
          description: "SecureGen Hamster has been disconnected",
          variant: "destructive",
        });
      }
    };

    // Listen for device test results
    const handleDeviceTest = (status: 'testing' | 'ready' | 'error') => {
      setDeviceTestStatus(status);
      
      switch (status) {
        case 'testing':
          toast({
            title: "Testing Device",
            description: "Running SecureGen Hamster diagnostics...",
          });
          break;
        case 'ready':
          toast({
            title: "Fingerprint Ready!",
            description: "SecureGen Hamster passed all tests and is ready for scanning",
          });
          onDeviceReady?.();
          break;
        case 'error':
          toast({
            title: "Device Test Failed",
            description: "Please check SecureGen Hamster connection and try again",
            variant: "destructive",
          });
          break;
      }
    };

    BiometricService.onConnectionChange(handleConnectionChange);
    BiometricService.onDeviceTest(handleDeviceTest);

    return () => {
      BiometricService.removeConnectionListener(handleConnectionChange);
      BiometricService.removeDeviceTestListener(handleDeviceTest);
    };
  }, [toast, onDeviceReady]);

  const requestDeviceConnection = async () => {
    try {
      setDeviceError(null);
      await BiometricService.requestDeviceAccess();
    } catch (error: any) {
      setDeviceError(error.message || 'Failed to connect to SecureGen Hamster');
      toast({
        title: "Connection Failed",
        description: error.message || 'Failed to connect to SecureGen Hamster',
        variant: "destructive",
      });
    }
  };

  const getStatusInfo = () => {
    if (deviceTestStatus === 'testing') {
      return {
        icon: <Loader2 className="h-4 w-4 animate-spin" />,
        text: 'Testing Device...',
        variant: 'secondary' as const,
        description: 'Running diagnostics on SecureGen Hamster'
      };
    }
    
    if (deviceTestStatus === 'ready') {
      return {
        icon: <CheckCircle className="h-4 w-4" />,
        text: 'Fingerprint Ready',
        variant: 'default' as const,
        description: 'SecureGen Hamster is ready for scanning'
      };
    }
    
    if (isConnected) {
      return {
        icon: <Fingerprint className="h-4 w-4" />,
        text: 'Device Connected',
        variant: 'default' as const,
        description: 'SecureGen Hamster connected successfully'
      };
    }
    
    if (connectionStatus === 'scanning') {
      return {
        icon: <Loader2 className="h-4 w-4 animate-spin" />,
        text: 'Scanning for Device...',
        variant: 'secondary' as const,
        description: 'Looking for SecureGen Hamster'
      };
    }
    
    return {
      icon: <AlertCircle className="h-4 w-4" />,
      text: 'Device Not Found',
      variant: 'destructive' as const,
      description: 'SecureGen Hamster not detected'
    };
  };

  const status = getStatusInfo();

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        <Badge variant={status.variant} className="flex items-center space-x-1">
          {status.icon}
          <span>{status.text}</span>
        </Badge>
        {!isConnected && (
          <Button size="sm" variant="outline" onClick={requestDeviceConnection}>
            <Usb className="h-3 w-3 mr-1" />
            Connect
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${
              status.variant === 'default' ? 'bg-green-100 text-green-600 dark:bg-green-900/20' :
              status.variant === 'secondary' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20' :
              'bg-red-100 text-red-600 dark:bg-red-900/20'
            }`}>
              {status.icon}
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{status.text}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{status.description}</p>
            </div>
          </div>
          
          {!isConnected && (
            <Button onClick={requestDeviceConnection} disabled={connectionStatus === 'scanning'}>
              <Usb className="h-4 w-4 mr-2" />
              Connect Device
            </Button>
          )}
        </div>
        
        {deviceError && (
          <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">{deviceError}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
