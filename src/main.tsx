
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializeDefaultAdmin } from '@/lib/database/index'
import { persistentStorage } from '@/lib/persistentStorage'
import { BiometricService } from '@/services/biometricService'
import { FingerprintMatcher } from '@/services/fingerprintMatcher'

const initializeApp = async () => {
  try {
    console.log('🚀 Initializing Al\'asr Comprehensive Academy Attendance System...');
    
    // Initialize persistent storage first (this is bulletproof)
    await persistentStorage.initialize();
    console.log('✅ Persistent storage ready');
    
    // Initialize admin account safely
    await initializeDefaultAdmin();
    console.log('✅ Admin account ready');
    
    // Initialize biometric services
    try {
      const biometricReady = await BiometricService.initialize();
      if (biometricReady) {
        await FingerprintMatcher.initialize();
        console.log('✅ Biometric services ready');
      } else {
        console.log('⚠️ Biometric services not available (no device or not supported)');
      }
    } catch (biometricError) {
      console.warn('⚠️ Biometric initialization failed, continuing without biometrics:', biometricError);
    }
    
    console.log('🎉 Application initialized successfully - ALL DATA IS PERMANENT');
  } catch (error) {
    console.error('❌ Critical initialization error:', error);
    // App will still load but with limited functionality
  }
};

// Initialize app
initializeApp();

createRoot(document.getElementById("root")!).render(<App />);
