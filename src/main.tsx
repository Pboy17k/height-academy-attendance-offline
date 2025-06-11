
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializeDefaultAdmin } from '@/lib/database/index'
import { persistentStorage } from '@/lib/persistentStorage'
import { BiometricService } from '@/services/biometricService'
import { FingerprintMatcher } from '@/services/fingerprintMatcher'

const initializeApp = async () => {
  try {
    console.log('🚀 Initializing Al\'asr Academy Attendance System (Electron Desktop App)...');
    
    // Initialize persistent storage first (this is bulletproof)
    await persistentStorage.initialize();
    console.log('✅ Persistent storage ready');
    
    // Initialize admin account safely
    await initializeDefaultAdmin();
    console.log('✅ Admin account ready');
    
    // Initialize biometric services with enhanced error handling for desktop
    try {
      console.log('🔍 Initializing biometric services for desktop environment...');
      const biometricReady = await BiometricService.initialize();
      if (biometricReady) {
        await FingerprintMatcher.initialize();
        console.log('✅ Biometric services ready - SecureGen Hamster support enabled');
      } else {
        console.log('⚠️ Biometric services not available - manual device connection required');
      }
    } catch (biometricError) {
      console.warn('⚠️ Biometric initialization failed, continuing without biometrics:', biometricError);
      console.log('💡 Connect your SecureGen Hamster device and use the "Connect Device" button');
    }
    
    console.log('🎉 Desktop application initialized successfully - ALL DATA IS STORED LOCALLY');
    console.log('📱 Connect SecureGen Hamster device for biometric attendance tracking');
  } catch (error) {
    console.error('❌ Critical initialization error:', error);
    // App will still load but with limited functionality
  }
};

// Initialize app
initializeApp();

createRoot(document.getElementById("root")!).render(<App />);
