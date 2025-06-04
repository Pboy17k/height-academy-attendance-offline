
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStaff } from '@/hooks/useStaff';
import { Camera, Fingerprint, User, Save } from 'lucide-react';

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const { createStaff } = useStaff();
  const [isSaving, setIsSaving] = useState(false);

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
    // Simulate fingerprint enrollment
    setTimeout(() => {
      setFingerprintEnrolled(true);
    }, 2000);
  };

  const validateForm = () => {
    const required = ['fullName', 'email', 'phone', 'staffId', 'department', 'role'];
    const missing = required.filter(field => !formData[field as keyof typeof formData]);
    return missing.length === 0 && photo && fingerprintEnrolled;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSaving(true);
    
    try {
      const success = await createStaff({
        ...formData,
        photo,
        fingerprintId: crypto.randomUUID(),
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
      }
    } catch (error) {
      console.error('Registration failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Staff Registration</h1>
        <p className="text-gray-500 dark:text-gray-400">Register new staff members with photo and fingerprint</p>
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
                  <span>Fingerprint Enrollment</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <div className={`w-24 h-24 mx-auto rounded-full border-4 flex items-center justify-center ${
                  fingerprintEnrolled ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-300 dark:border-gray-600'
                }`}>
                  <Fingerprint className={`h-8 w-8 ${
                    fingerprintEnrolled ? 'text-green-600' : 'text-gray-400'
                  }`} />
                </div>
                
                {fingerprintEnrolled ? (
                  <div className="text-green-600 dark:text-green-400">
                    <p className="font-medium">✓ Fingerprint Enrolled</p>
                    <p className="text-sm">Ready for attendance</p>
                  </div>
                ) : (
                  <Button type="button" onClick={enrollFingerprint}>
                    <Fingerprint className="h-4 w-4 mr-2" />
                    Enroll Fingerprint
                  </Button>
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
