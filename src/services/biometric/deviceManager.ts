import { BiometricDevice, COMPATIBLE_DEVICES } from './types';

export class DeviceManager {
  private static devices: BiometricDevice[] = [];
  private static connectedUSBDevices: USBDevice[] = [];

  static isCompatibleDevice(device: USBDevice): boolean {
    const isCompatible = COMPATIBLE_DEVICES.some(compatible => compatible.vendorId === device.vendorId);
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

      const filters = COMPATIBLE_DEVICES.map(device => ({ vendorId: device.vendorId }));

      console.log('🔍 Requesting access to biometric devices...');
      const device = await navigator.usb.requestDevice({ filters });
      
      if (device) {
        const deviceName = device.productName || `SecureGen Device (${device.vendorId}:${device.productId})`;
        console.log('📱 USB biometric device selected:', deviceName);
        await this.addDevice(device);
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

  static async addDevice(usbDevice: USBDevice): Promise<BiometricDevice | null> {
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
      
      return device;
    } catch (error) {
      console.error('Failed to add biometric device:', error);
      return null;
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

  static removeDevice(usbDevice: USBDevice): void {
    const deviceId = `usb-${usbDevice.vendorId}-${usbDevice.productId}`;
    this.devices = this.devices.filter(device => device.id !== deviceId);
    
    // Remove from connected USB devices
    this.connectedUSBDevices = this.connectedUSBDevices.filter(
      device => !(device.vendorId === usbDevice.vendorId && device.productId === usbDevice.productId)
    );
  }

  static getConnectedDevices(): BiometricDevice[] {
    return this.devices.filter(device => device.connected);
  }

  static isDeviceConnected(): boolean {
    return this.devices.some(device => device.connected);
  }

  static getDevices(): BiometricDevice[] {
    return this.devices;
  }

  static getConnectedUSBDevices(): USBDevice[] {
    return this.connectedUSBDevices;
  }
}
