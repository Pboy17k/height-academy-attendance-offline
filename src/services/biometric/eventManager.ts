
import { BiometricReading } from './types';

export class EventManager {
  private static listeners: ((reading: BiometricReading) => void)[] = [];
  private static connectionListeners: ((connected: boolean) => void)[] = [];

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

  static notifyListeners(reading: BiometricReading): void {
    this.listeners.forEach(listener => {
      try {
        listener(reading);
      } catch (error) {
        console.error('Error in biometric listener:', error);
      }
    });
  }

  static notifyConnectionListeners(connected: boolean): void {
    this.connectionListeners.forEach(listener => {
      try {
        listener(connected);
      } catch (error) {
        console.error('Error in connection listener:', error);
      }
    });
  }
}
