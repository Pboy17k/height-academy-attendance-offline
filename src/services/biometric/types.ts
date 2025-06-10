
export interface BiometricDevice {
  id: string;
  name: string;
  type: 'fingerprint' | 'face' | 'iris';
  connected: boolean;
}

export interface BiometricReading {
  deviceId: string;
  template: string;
  quality: number;
  timestamp: Date;
}

export interface BiometricMatch {
  staffId: string;
  confidence: number;
  template: string;
}

export interface CompatibleDevice {
  vendorId: number;
  name: string;
}

export const COMPATIBLE_DEVICES: CompatibleDevice[] = [
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
