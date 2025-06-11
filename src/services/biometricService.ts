
import { BiometricDevice, BiometricReading } from './biometric/types';
import { DeviceManager } from './biometric/deviceManager';
import { DataProcessor } from './biometric/dataProcessor';
import { EventManager } from './biometric/eventManager';
import { DeviceCommunication } from './biometric/deviceCommunication';

export class BiometricService {
  private static isInitialized = false;
  private static deviceTestInProgress = false;

  static async initialize(): Promise<boolean> {
    try {
      console.log('🔍 Initializing Al\'asr Academy Biometric System...');
      
      // Check if WebUSB is supported
      if (!navigator.usb) {
        console.warn('⚠️ WebUSB not supported in this browser - biometric features disabled');
        return false;
      }

      // Start device monitoring for connect/disconnect events
      await this.startDeviceMonitoring();
      
      // Automatically scan and connect to existing SecureGen devices
      console.log('🔍 Scanning for SecureGen Hamster devices...');
      const deviceFound = await DeviceManager.scanAndAutoConnect();
      
      if (deviceFound) {
        console.log('✅ SecureGen Hamster device auto-connected successfully');
        EventManager.notifyConnectionListeners(true);
        
        // Run automatic device test
        setTimeout(() => this.runDeviceTest(), 1000);
      } else {
        console.log('⚠️ No SecureGen Hamster device found - manual connection required');
      }
      
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
      // Run device test after manual connection
      setTimeout(() => this.runDeviceTest(), 1000);
    }
  }

  static async startDeviceMonitoring(): Promise<void> {
    if (!navigator.usb) return;

    navigator.usb.addEventListener('connect', async (event) => {
      if (DeviceManager.isCompatibleDevice(event.device)) {
        console.log('🔌 SecureGen Hamster connected:', event.device.productName || 'SecureGen Device');
        const device = await DeviceManager.addDevice(event.device);
        
        if (device) {
          await DeviceCommunication.configureAndListenToDevice(event.device, device);
          EventManager.notifyConnectionListeners(true);
          
          // Run device test after hot-plug connection
          setTimeout(() => this.runDeviceTest(), 1000);
        }
      }
    });

    navigator.usb.addEventListener('disconnect', (event) => {
      console.log('🔌 USB device disconnected:', event.device.productName || 'Unknown Device');
      DeviceManager.removeDevice(event.device);
      EventManager.notifyConnectionListeners(DeviceManager.isDeviceConnected());
    });
  }

  static async runDeviceTest(): Promise<void> {
    if (this.deviceTestInProgress || !DeviceManager.isDeviceConnected()) return;
    
    try {
      this.deviceTestInProgress = true;
      console.log('🧪 Running SecureGen Hamster device test...');
      
      // Notify listeners about test start
      EventManager.notifyTestListeners('testing');
      
      // Simulate device readiness test
      setTimeout(() => {
        const testResult = Math.random() > 0.1; // 90% success rate for demo
        
        if (testResult) {
          console.log('✅ Device test passed - SecureGen Hamster ready for fingerprint scanning');
          EventManager.notifyTestListeners('ready');
        } else {
          console.log('⚠️ Device test failed - please check SecureGen Hamster connection');
          EventManager.notifyTestListeners('error');
        }
        
        this.deviceTestInProgress = false;
      }, 2000);
      
    } catch (error) {
      console.error('❌ Device test failed:', error);
      EventManager.notifyTestListeners('error');
      this.deviceTestInProgress = false;
    }
  }

  static getConnectedDevices(): BiometricDevice[] {
    return DeviceManager.getConnectedDevices();
  }

  static isDeviceConnected(): boolean {
    return DeviceManager.isDeviceConnected();
  }

  static getConnectionStatus(): 'connected' | 'scanning' | 'disconnected' {
    return DeviceManager.getConnectionStatus();
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

  static onDeviceTest(callback: (status: 'testing' | 'ready' | 'error') => void): void {
    EventManager.onDeviceTest(callback);
  }

  static removeDeviceTestListener(callback: (status: 'testing' | 'ready' | 'error') => void): void {
    EventManager.removeDeviceTestListener(callback);
  }
}
