import { BiometricDevice, BiometricReading } from './biometric/types';
import { DeviceManager } from './biometric/deviceManager';
import { DataProcessor } from './biometric/dataProcessor';
import { EventManager } from './biometric/eventManager';
import { DeviceCommunication } from './biometric/deviceCommunication';

export class BiometricService {
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
      
      // Automatically try to connect to existing devices
      await DeviceManager.autoConnectDevices();
      
      this.isInitialized = true;
      console.log('✅ Biometric service initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize biometric service:', error);
      return false;
    }
  }

  static async requestDeviceAccess(): Promise<void> {
    await DeviceManager.requestDeviceAccess();
    // Check if any device is now connected and notify
    if (DeviceManager.isDeviceConnected()) {
      EventManager.notifyConnectionListeners(true);
    }
  }

  static async startDeviceMonitoring(): Promise<void> {
    if (!navigator.usb) return;

    navigator.usb.addEventListener('connect', async (event) => {
      if (DeviceManager.isCompatibleDevice(event.device)) {
        console.log('🔌 Compatible USB device connected:', event.device.productName);
        const device = await DeviceManager.addDevice(event.device);
        
        if (device) {
          await DeviceCommunication.configureAndListenToDevice(event.device, device);
          EventManager.notifyConnectionListeners(true);
        }
      }
    });

    navigator.usb.addEventListener('disconnect', (event) => {
      console.log('🔌 USB device disconnected:', event.device.productName);
      DeviceManager.removeDevice(event.device);
      EventManager.notifyConnectionListeners(DeviceManager.isDeviceConnected());
    });
  }

  static getConnectedDevices(): BiometricDevice[] {
    return DeviceManager.getConnectedDevices();
  }

  static isDeviceConnected(): boolean {
    return DeviceManager.isDeviceConnected();
  }

  static simulateFingerprintScan(): BiometricReading {
    return DataProcessor.simulateFingerprintScan();
  }

  static onFingerprintDetected(callback: (reading: BiometricReading) => void): void {
    EventManager.onFingerprintDetected(callback);
  }

  static removeListener(callback: (reading: BiometricReading) => void): void {
    EventManager.removeListener(callback);
  }

  static onConnectionChange(callback: (connected: boolean) => void): void {
    EventManager.onConnectionChange(callback);
  }

  static removeConnectionListener(callback: (connected: boolean) => void): void {
    EventManager.removeConnectionListener(callback);
  }
}
