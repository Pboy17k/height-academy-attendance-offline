
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializeDefaultAdmin } from '@/lib/db'
import { EnhancedStorageService } from '@/lib/enhancedStorage'

// Enhanced initialization with robust data protection
const initializeApp = async () => {
  try {
    console.log('Initializing Al\'asr Comprehensive Academy Attendance System...');
    
    // Initialize enhanced storage system first
    await EnhancedStorageService.initialize();
    
    // Only initialize IndexedDB and admin account - do not clear any data
    await initializeDefaultAdmin();
    
    console.log('Application initialized successfully with enhanced data protection');
    console.log('All data changes will be permanently stored with multiple backup layers');
    console.log('Database integrity monitoring active');
  } catch (error) {
    console.error('Application initialization failed:', error);
    // App will still load but may have limited functionality
  }
};

// Initialize app
initializeApp();

createRoot(document.getElementById("root")!).render(<App />);
