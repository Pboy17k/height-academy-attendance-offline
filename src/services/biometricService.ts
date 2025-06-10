
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
  private static connectionListeners: ((connected: boolean) => void)[] = [];
  private static isInitialized = false;
  private static connectedUSBDevices: USBDevice[] = [];

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
      
      // Automatically try to connect to existing devices
      await this.autoConnectDevices();
      
      this.isInitialized = true;
      console.log('✅ Biometric service initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize biometric service:', error);
      return false;
    }
  }

  static async autoConnectDevices(): Promise<void> {
    try {
      if (!navigator.usb) return;
      
      // Get previously authorized devices
      const devices = await navigator.usb.getDevices();
      console.log('🔍 Found previously authorized USB devices:', devices.length);
      
      for (const device of devices) {
        if (this.isCompatibleDevice(device)) {
          console.log('🔗 Auto-connecting to:', device.productName || 'SecureGen Device');
          await this.addDevice(device);
        }
      }
      
      console.log(`✅ Auto-connection complete. Connected devices: ${this.devices.length}`);
    } catch (error) {
      console.log('Auto-connect failed, manual connection will be required:', error);
    }
  }

  static isCompatibleDevice(device: USBDevice): boolean {
    // Known SecureGen vendor IDs and product IDs - expanded list
    const compatibleDevices = [
      { vendorId: 0x2109, name: 'SecureGen Hamster' }, // Primary SecureGen Hamster ID
      { vendorId: 0x1162, name: 'SecureGen' }, // Alternative SecureGen ID
      { vendorId: 0x16d1, name: 'SecureGen' }, // Another SecureGen variant
      { vendorId: 0x27c6, name: 'Goodix' },
      { vendorId: 0x138a, name: 'Validity Sensors' },
      { vendorId: 0x06cb, name: 'Synaptics' },
      { vendorId: 0x147e, name: 'Upek' },
      { vendorId: 0x0483, name: 'STMicroelectronics' },
      { vendorId: 0x1c7a, name: 'LighTuning' },
    ];

    const isCompatible = compatibleDevices.some(compatible => compatible.vendorId === device.vendorId);
    if (isCompatible) {
      console.log(`✅ Compatible device found: ${device.productName || 'Unknown'} (${device.vendorId}:${device.productId})`);
    }
    return isCompatible;
  }

  static async requestDeviceAccess(): Promise<void> {
    try {
      if (!navigator.usb) {
        throw new Error('WebUSB not supported');
      }

      // Enhanced filters including SecureGen devices
      const filters = [
        { vendorId: 0x2109 }, // SecureGen Hamster (primary)
        { vendorId: 0x1162 }, // Alternative SecureGen ID
        { vendorId: 0x16d1 }, // Another SecureGen variant
        { vendorId: 0x27c6 }, // Goodix
        { vendorId: 0x138a }, // Validity Sensors
        { vendorId: 0x06cb }, // Synaptics
        { vendorId: 0x147e }, // Upek
        { vendorId: 0x0483 }, // STMicroelectronics
        { vendorId: 0x1c7a }, // LighTuning
      ];

      console.log('🔍 Requesting access to biometric devices...');
      const device = await navigator.usb.requestDevice({ filters });
      
      if (device) {
        const deviceName = device.productName || `SecureGen Device (${device.vendorId}:${device.productId})`;
        console.log('📱 USB biometric device selected:', deviceName);
        await this.addDevice(device);
        
        // Notify connection listeners
        this.notifyConnectionListeners(true);
      }
    } catch (error: any) {
      if (error.name === 'NotFoundError') {
        console.log('❌ No compatible biometric device found. Please ensure your SecureGen Hamster is connected.');
        throw new Error('No compatible device found. Please ensure your SecureGen Hamster is properly connected and try again.');
      } else {
        console.error('Error requesting device access:', error);
        throw error;
      }
    }
  }

  private static async addDevice(usbDevice: USBDevice): Promise<void> {
    try {
      // Check if device is already connected
      const existingDeviceIndex = this.connectedUSBDevices.findIndex(
        d => d.vendorId === usbDevice.vendorId && d.productId === usbDevice.productId
      );
      
      if (existingDeviceIndex === -1) {
        await usbDevice.open();
        this.connectedUSBDevices.push(usbDevice);
      }
      
      const deviceName = usbDevice.productName || 
        (usbDevice.vendorId === 0x2109 || usbDevice.vendorId === 0x1162 || usbDevice.vendorId === 0x16d1
          ? 'SecureGen Hamster' 
          : `Device ${usbDevice.vendorId}:${usbDevice.productId}`);
      
      const deviceId = `usb-${usbDevice.vendorId}-${usbDevice.productId}`;
      const device: BiometricDevice = {
        id: deviceId,
        name: deviceName,
        type: 'fingerprint',
        connected: true
      };

      // Remove existing device with same ID and add new one
      this.devices = this.devices.filter(d => d.id !== device.id);
      this.devices.push(device);
      
      console.log('✅ Biometric device connected and ready:', device.name);
      
      // Start listening for fingerprint data
      await this.listenToDevice(usbDevice, device);
      
      // Notify all connection listeners
      this.notifyConnectionListeners(true);
      
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
            console.log('👆 Real fingerprint detected with quality:', reading.quality);
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

  static onConnectionChange(callback: (connected: boolean) => void): void {
    this.connectionListeners.push(callback);
  }

  static removeConnectionListener(callback: (connected: boolean) => void): void {
    const index = this.connectionListeners.indexOf(callback);
    if (index > -1) {
      this.connectionListeners.splice(index, 1);
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

  private static notifyConnectionListeners(connected: boolean): void {
    this.connectionListeners.forEach(listener => {
      try {
        listener(connected);
      } catch (error) {
        console.error('Error in connection listener:', error);
      }
    });
  }

  static async startDeviceMonitoring(): Promise<void> {
    if (!navigator.usb) return;

    navigator.usb.addEventListener('connect', async (event) => {
      if (this.isCompatibleDevice(event.device)) {
        console.log('🔌 Compatible USB device connected:', event.device.productName);
        await this.addDevice(event.device);
      }
    });

    navigator.usb.addEventListener('disconnect', (event) => {
      console.log('🔌 USB device disconnected:', event.device.productName);
      const deviceId = `usb-${event.device.vendorId}-${event.device.productId}`;
      this.devices = this.devices.filter(device => device.id !== deviceId);
      
      // Remove from connected USB devices
      this.connectedUSBDevices = this.connectedUSBDevices.filter(
        device => !(device.vendorId === event.device.vendorId && device.productId === event.device.productId)
      );
      
      // Notify disconnection
      this.notifyConnectionListeners(this.isDeviceConnected());
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
