
interface BiometricDevice {
  id: string;
  name: string;
  type: 'fingerprint' | 'face' | 'iris';
  connected: boolean;
}

interface BiometricReading {
  deviceId: string;
  template: string;
  quality: number;
  timestamp: Date;
}

interface BiometricMatch {
  staffId: string;
  confidence: number;
  template: string;
}

export class BiometricService {
  private static devices: BiometricDevice[] = [];
  private static listeners: ((reading: BiometricReading) => void)[] = [];
  private static isInitialized = false;

  static async initialize(): Promise<boolean> {
    try {
      console.log('🔍 Initializing biometric service...');
      
      // Check if WebUSB is supported
      if (!navigator.usb) {
        console.warn('WebUSB not supported in this browser');
        return false;
      }

      // Start device monitoring
      await this.startDeviceMonitoring();
      
      this.isInitialized = true;
      console.log('✅ Biometric service initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize biometric service:', error);
      return false;
    }
  }

  static async requestDeviceAccess(): Promise<void> {
    try {
      if (!navigator.usb) {
        throw new Error('WebUSB not supported');
      }

      // Common vendor IDs for fingerprint devices
      const filters = [
        { vendorId: 0x27c6 }, // Goodix
        { vendorId: 0x138a }, // Validity Sensors
        { vendorId: 0x06cb }, // Synaptics
        { vendorId: 0x147e }, // Upek
        { vendorId: 0x0483 }, // STMicroelectronics
        { vendorId: 0x1c7a }, // LighTuning
      ];

      const device = await navigator.usb.requestDevice({ filters });
      
      if (device) {
        console.log('📱 USB biometric device detected:', device.productName || 'Unknown Device');
        await this.addDevice(device);
      }
    } catch (error: any) {
      if (error.name === 'NotFoundError') {
        console.log('No biometric device selected by user');
      } else {
        console.error('Error requesting device access:', error);
      }
    }
  }

  private static async addDevice(usbDevice: USBDevice): Promise<void> {
    try {
      await usbDevice.open();
      
      const device: BiometricDevice = {
        id: `usb-${usbDevice.vendorId}-${usbDevice.productId}`,
        name: usbDevice.productName || `Device ${usbDevice.vendorId}:${usbDevice.productId}`,
        type: 'fingerprint',
        connected: true
      };

      this.devices.push(device);
      console.log('✅ Biometric device added:', device.name);
      
      // Start listening for fingerprint data
      await this.listenToDevice(usbDevice, device);
      
    } catch (error) {
      console.error('Failed to add biometric device:', error);
    }
  }

  private static async listenToDevice(usbDevice: USBDevice, device: BiometricDevice): Promise<void> {
    try {
      // Configure the device
      if (usbDevice.configuration === null) {
        await usbDevice.selectConfiguration(1);
      }

      // Claim interface (usually interface 0 for fingerprint readers)
      await usbDevice.claimInterface(0);

      // Start continuous reading
      this.startContinuousReading(usbDevice, device);
      
    } catch (error) {
      console.error('Failed to configure biometric device:', error);
    }
  }

  private static async startContinuousReading(usbDevice: USBDevice, device: BiometricDevice): Promise<void> {
    const readLoop = async () => {
      try {
        // Try to read from the device (endpoint 1 is common for fingerprint data)
        const result = await usbDevice.transferIn(1, 64);
        
        if (result.status === 'ok' && result.data) {
          const reading: BiometricReading = {
            deviceId: device.id,
            template: this.dataToTemplate(result.data),
            quality: this.calculateQuality(result.data),
            timestamp: new Date()
          };

          // Only process high-quality readings
          if (reading.quality > 70) {
            console.log('👆 Fingerprint detected with quality:', reading.quality);
            this.notifyListeners(reading);
          }
        }
        
        // Continue reading
        setTimeout(readLoop, 100); // Read every 100ms
        
      } catch (error: any) {
        if (error.name !== 'NetworkError') {
          console.error('Error reading from biometric device:', error);
        }
        setTimeout(readLoop, 500); // Retry after 500ms on error
      }
    };

    readLoop();
  }

  private static dataToTemplate(data: DataView): string {
    // Convert raw fingerprint data to template string
    const bytes = new Uint8Array(data.buffer);
    return btoa(String.fromCharCode(...bytes));
  }

  private static calculateQuality(data: DataView): number {
    // Simple quality calculation based on data variance
    const bytes = new Uint8Array(data.buffer);
    let variance = 0;
    const mean = bytes.reduce((sum, byte) => sum + byte, 0) / bytes.length;
    
    for (const byte of bytes) {
      variance += Math.pow(byte - mean, 2);
    }
    
    variance /= bytes.length;
    return Math.min(100, Math.floor(variance / 10)); // Normalize to 0-100
  }

  static onFingerprintDetected(callback: (reading: BiometricReading) => void): void {
    this.listeners.push(callback);
  }

  static removeListener(callback: (reading: BiometricReading) => void): void {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  private static notifyListeners(reading: BiometricReading): void {
    this.listeners.forEach(listener => {
      try {
        listener(reading);
      } catch (error) {
        console.error('Error in biometric listener:', error);
      }
    });
  }

  static async startDeviceMonitoring(): Promise<void> {
    if (!navigator.usb) return;

    navigator.usb.addEventListener('connect', async (event) => {
      console.log('🔌 USB device connected:', event.device.productName);
      await this.addDevice(event.device);
    });

    navigator.usb.addEventListener('disconnect', (event) => {
      console.log('🔌 USB device disconnected:', event.device.productName);
      this.devices = this.devices.filter(device => 
        device.id !== `usb-${event.device.vendorId}-${event.device.productId}`
      );
    });
  }

  static getConnectedDevices(): BiometricDevice[] {
    return this.devices.filter(device => device.connected);
  }

  static isDeviceConnected(): boolean {
    return this.devices.some(device => device.connected);
  }

  // Fallback simulation for testing without physical device
  static simulateFingerprintScan(): BiometricReading {
    return {
      deviceId: 'simulator',
      template: btoa('simulated_fingerprint_' + Math.random().toString(36).substr(2, 9)),
      quality: 85,
      timestamp: new Date()
    };
  }
}
