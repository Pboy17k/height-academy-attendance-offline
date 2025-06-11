
import { BiometricDevice, COMPATIBLE_DEVICES } from './types';

export class DeviceManager {
  private static devices: BiometricDevice[] = [];
  private static connectedUSBDevices: USBDevice[] = [];
  private static isAutoConnecting = false;

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

  static async scanAndAutoConnect(): Promise<boolean> {
    if (this.isAutoConnecting) return false;
    
    try {
      this.isAutoConnecting = true;
      console.log('🔍 Scanning for SecureGen Hamster devices...');
      
      if (!navigator.usb) {
        console.warn('WebUSB not supported in this browser');
        return false;
      }
      
      // Get all previously authorized devices
      const authorizedDevices = await navigator.usb.getDevices();
      console.log(`📱 Found ${authorizedDevices.length} previously authorized USB devices`);
      
      let connectedDevices = 0;
      
      for (const device of authorizedDevices) {
        if (this.isCompatibleDevice(device)) {
          console.log('🔗 Auto-connecting to SecureGen device:', device.productName || 'SecureGen Hamster');
          const addedDevice = await this.addDevice(device);
          if (addedDevice) {
            connectedDevices++;
          }
        }
      }
      
      if (connectedDevices > 0) {
        console.log(`✅ Successfully auto-connected to ${connectedDevices} SecureGen device(s)`);
        return true;
      } else {
        console.log('⚠️ No SecureGen Hamster devices found for auto-connection');
        return false;
      }
      
    } catch (error) {
      console.error('❌ Auto-connection scan failed:', error);
      return false;
    } finally {
      this.isAutoConnecting = false;
    }
  }

  static async autoConnectDevices(): Promise<void> {
    await this.scanAndAutoConnect();
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

  static getConnectionStatus(): 'connected' | 'scanning' | 'disconnected' {
    if (this.isDeviceConnected()) return 'connected';
    if (this.isAutoConnecting) return 'scanning';
    return 'disconnected';
  }
}
