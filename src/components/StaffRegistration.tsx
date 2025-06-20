import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStaff } from '@/hooks/useStaff';
import { Camera, Fingerprint, User, Save, CheckCircle } from 'lucide-react';
import { BiometricService } from '@/services/biometricService';
import { FingerprintMatcher } from '@/services/fingerprintMatcher';
import { useToast } from '@/hooks/use-toast';

const departments = [
  'Administration',
  'Teaching Staff',
  'Support Staff',
  'Maintenance',
  'Security',
  'Library',
  'Laboratory',
  'Sports'
];

const roles = [
  'Principal',
  'Vice Principal',
  'Teacher',
  'Librarian',
  'Lab Assistant',
  'Administrative Officer',
  'Accountant',
  'Maintenance Staff',
  'Security Guard',
  'Cleaning Staff'
];

export function StaffRegistration() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    staffId: '',
    department: '',
    role: ''
  });
  const [photo, setPhoto] = useState<string>('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [fingerprintEnrolled, setFingerprintEnrolled] = useState(false);
  const [fingerprintTemplate, setFingerprintTemplate] = useState<string>('');
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [biometricConnected, setBiometricConnected] = useState(false);
  const [fingerprintQuality, setFingerprintQuality] = useState<number>(0);
  const [scanningStatus, setScanningStatus] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const { createStaff } = useStaff();
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const initializeBiometric = async () => {
      try {
        await BiometricService.initialize();
        await FingerprintMatcher.initialize();
        const connected = BiometricService.isDeviceConnected();
        setBiometricConnected(connected);
      } catch (error) {
        console.error('Failed to initialize biometric system:', error);
      }
    };

    initializeBiometric();

    // Listen for connection changes
    const handleConnectionChange = (connected: boolean) => {
      setBiometricConnected(connected);
      if (connected) {
        toast({
          title: "Device Connected!",
          description: "SecureGen Hamster is ready for enrollment",
        });
      }
    };

    BiometricService.onConnectionChange(handleConnectionChange);

    return () => {
      BiometricService.removeConnectionListener(handleConnectionChange);
    };
  }, [toast]);

  const generateStaffId = () => {
    const prefix = 'STF';
    const number = Math.floor(Math.random() * 900) + 100;
    return `${prefix}${number}`;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const startCamera = async () => {
    try {
      setIsCapturing(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Camera access failed:', error);
      setIsCapturing(false);
      toast({
        title: "Camera Error",
        description: "Failed to access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      if (context) {
        context.drawImage(video, 0, 0);
        const dataURL = canvas.toDataURL('image/jpeg', 0.8);
        setPhoto(dataURL);
        
        // Stop camera
        const stream = video.srcObject as MediaStream;
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        setIsCapturing(false);
      }
    }
  };

  const retakePhoto = () => {
    setPhoto('');
    startCamera();
  };

  const enrollFingerprint = async () => {
    if (!biometricConnected) {
      toast({
        title: "Device Not Connected",
        description: "Please connect your SecureGen Hamster device first.",
        variant: "destructive",
      });
      return;
    }

    setIsEnrolling(true);
    setFingerprintQuality(0);
    setScanningStatus('Place your finger on the scanner...');
    
    try {
      toast({
        title: "Fingerprint Enrollment Started",
        description: "Place your finger firmly on the SecureGen Hamster scanner...",
      });

      // Listen for real-time fingerprint readings
      const handleFingerprintReading = (reading: any) => {
        console.log('👆 Real-time fingerprint reading detected:', reading.quality);
        setFingerprintQuality(reading.quality);
        
        if (reading.quality > 80) {
          setScanningStatus(`High quality scan detected (${reading.quality}%)!`);
        } else if (reading.quality > 60) {
          setScanningStatus(`Good scan detected (${reading.quality}%). Keep finger steady...`);
        } else if (reading.quality > 40) {
          setScanningStatus(`Scanning... (${reading.quality}%). Press finger firmly.`);
        } else {
          setScanningStatus('Place finger firmly on the scanner...');
        }

        if (reading.quality > 75) {
          setFingerprintTemplate(reading.template);
          setFingerprintEnrolled(true);
          setIsEnrolling(false);
          setScanningStatus('Enrollment successful!');
          
          toast({
            title: "Fingerprint Enrolled Successfully!",
            description: `High quality fingerprint captured (${reading.quality}% quality)`,
          });
          
          // Remove listener after successful enrollment
          BiometricService.removeListener(handleFingerprintReading);
        }
      };

      BiometricService.onFingerprintDetected(handleFingerprintReading);

      // Timeout after 30 seconds
      setTimeout(() => {
        if (isEnrolling) {
          setIsEnrolling(false);
          setScanningStatus('');
          setFingerprintQuality(0);
          BiometricService.removeListener(handleFingerprintReading);
          toast({
            title: "Enrollment Timeout",
            description: "Please try again to enroll your fingerprint.",
            variant: "destructive",
          });
        }
      }, 30000);

    } catch (error) {
      console.error('Fingerprint enrollment failed:', error);
      setIsEnrolling(false);
      setScanningStatus('');
      setFingerprintQuality(0);
      toast({
        title: "Enrollment Failed",
        description: "Failed to enroll fingerprint. Please try again.",
        variant: "destructive",
      });
    }
  };

  const validateForm = () => {
    const required = ['fullName', 'email', 'phone', 'staffId', 'department', 'role'];
    const missing = required.filter(field => !formData[field as keyof typeof formData]);
    return missing.length === 0 && photo && fingerprintEnrolled && fingerprintTemplate;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Incomplete Form",
        description: "Please fill all fields, capture photo, and enroll fingerprint.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      const success = await createStaff({
        ...formData,
        photo,
        fingerprintId: fingerprintTemplate,
        isActive: true
      });
      
      if (success) {
        // Reset form
        setFormData({
          fullName: '',
          email: '',
          phone: '',
          staffId: '',
          department: '',
          role: ''
        });
        setPhoto('');
        setFingerprintEnrolled(false);
        setFingerprintTemplate('');
        setFingerprintQuality(0);
        setScanningStatus('');
        
        toast({
          title: "Registration Successful!",
          description: "Staff member has been registered with biometric data.",
        });
      }
    } catch (error) {
      console.error('Registration failed:', error);
      toast({
        title: "Registration Failed",
        description: "Failed to register staff member. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Staff Registration</h1>
        <p className="text-gray-500 dark:text-gray-400">Register new staff members with real-time biometric enrollment</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Personal Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    placeholder="Enter full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="staffId">Staff ID *</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="staffId"
                      value={formData.staffId}
                      onChange={(e) => handleInputChange('staffId', e.target.value.toUpperCase())}
                      placeholder="STF001"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleInputChange('staffId', generateStaffId())}
                    >
                      Generate
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="email@example.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Department *</Label>
                  <Select value={formData.department} onValueChange={(value) => handleInputChange('department', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role} value={role}>{role}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Camera className="h-5 w-5" />
                  <span>Photo Capture</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                {!photo && !isCapturing && (
                  <div className="space-y-4">
                    <div className="w-32 h-32 mx-auto border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center">
                      <Camera className="h-12 w-12 text-gray-400" />
                    </div>
                    <Button type="button" onClick={startCamera}>
                      <Camera className="h-4 w-4 mr-2" />
                      Start Camera
                    </Button>
                  </div>
                )}
                
                {isCapturing && (
                  <div className="space-y-4">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full max-w-sm mx-auto rounded-lg"
                    />
                    <Button type="button" onClick={capturePhoto}>
                      Capture Photo
                    </Button>
                  </div>
                )}
                
                {photo && (
                  <div className="space-y-4">
                    <img
                      src={photo}
                      alt="Captured"
                      className="w-32 h-32 mx-auto rounded-lg object-cover border"
                    />
                    <Button type="button" variant="outline" onClick={retakePhoto}>
                      Retake Photo
                    </Button>
                  </div>
                )}
                
                <canvas ref={canvasRef} className="hidden" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Fingerprint className="h-5 w-5" />
                  <span>Real-Time Fingerprint Enrollment</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <div className={`w-24 h-24 mx-auto rounded-full border-4 flex items-center justify-center transition-all duration-300 ${
                  fingerprintEnrolled 
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                    : isEnrolling
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 animate-pulse'
                    : biometricConnected
                    ? 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                    : 'border-red-300 dark:border-red-600'
                }`}>
                  {fingerprintEnrolled ? (
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  ) : (
                    <Fingerprint className={`h-8 w-8 ${
                      isEnrolling ? 'text-blue-600' : biometricConnected ? 'text-gray-400' : 'text-red-400'
                    }`} />
                  )}
                </div>
                
                {/* Real-time scanning feedback */}
                {isEnrolling && fingerprintQuality > 0 && (
                  <div className="space-y-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          fingerprintQuality > 75 ? 'bg-green-500' :
                          fingerprintQuality > 50 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${fingerprintQuality}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      Quality: {fingerprintQuality}%
                    </p>
                  </div>
                )}
                
                {fingerprintEnrolled ? (
                  <div className="text-green-600 dark:text-green-400">
                    <p className="font-medium">✓ Fingerprint Enrolled Successfully</p>
                    <p className="text-sm">Ready for attendance system</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Button 
                      type="button" 
                      onClick={enrollFingerprint}
                      disabled={!biometricConnected || isEnrolling}
                      className={isEnrolling ? 'animate-pulse' : ''}
                    >
                      {isEnrolling ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Scanning...
                        </>
                      ) : (
                        <>
                          <Fingerprint className="h-4 w-4 mr-2" />
                          {biometricConnected ? 'Start Enrollment' : 'Connect Device First'}
                        </>
                      )}
                    </Button>
                    {!biometricConnected && (
                      <p className="text-sm text-red-600 dark:text-red-400">
                        SecureGen Hamster device not connected
                      </p>
                    )}
                    {scanningStatus && (
                      <p className="text-sm text-blue-600 dark:text-blue-400">
                        {scanningStatus}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isSaving || !validateForm()}
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Registering...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Register Staff Member
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
