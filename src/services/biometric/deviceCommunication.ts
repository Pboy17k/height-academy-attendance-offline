
import { BiometricDevice, BiometricReading } from './types';
import { DataProcessor } from './dataProcessor';
import { EventManager } from './eventManager';

export class DeviceCommunication {
  static async configureAndListenToDevice(usbDevice: USBDevice, device: BiometricDevice): Promise<void> {
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
      throw error;
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
            template: DataProcessor.dataToTemplate(result.data),
            quality: DataProcessor.calculateQuality(result.data),
            timestamp: new Date()
          };

          // Only process high-quality readings
          if (reading.quality > 70) {
            console.log('👆 Real fingerprint detected with quality:', reading.quality);
            EventManager.notifyListeners(reading);
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
}
