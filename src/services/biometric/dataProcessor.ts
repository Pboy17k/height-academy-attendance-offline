
import { BiometricReading } from './types';

export class DataProcessor {
  static dataToTemplate(data: DataView): string {
    // Convert raw fingerprint data to template string
    const bytes = new Uint8Array(data.buffer);
    return btoa(String.fromCharCode(...bytes));
  }

  static calculateQuality(data: DataView): number {
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

  static simulateFingerprintScan(): BiometricReading {
    return {
      deviceId: 'simulator',
      template: btoa('simulated_fingerprint_' + Math.random().toString(36).substr(2, 9)),
      quality: 85,
      timestamp: new Date()
    };
  }
}
