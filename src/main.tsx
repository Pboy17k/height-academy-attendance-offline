
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializeDefaultAdmin } from '@/lib/database/index'
import { EnhancedStorageService } from '@/lib/enhancedStorage'

// Safe initialization that preserves existing data
const initializeApp = async () => {
  try {
    console.log('Initializing Al\'asr Comprehensive Academy Attendance System...');
    
    // Initialize enhanced storage system first
    await EnhancedStorageService.initialize();
    
    // ONLY initialize admin account if it doesn't exist - NEVER clear data
    await initializeDefaultAdmin();
    
    console.log('Application initialized successfully - all existing data preserved');
  } catch (error) {
    console.error('Application initialization failed:', error);
    // App will still load but may have limited functionality
  }
};

// Initialize app
initializeApp();

createRoot(document.getElementById("root")!).render(<App />);
