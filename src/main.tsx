
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializeDefaultAdmin } from '@/lib/db'
import { generateSampleStaff } from '@/lib/sampleData'

// Enhanced initialization with IndexedDB persistence
const initializeApp = async () => {
  try {
    console.log('Initializing Al\'asr Comprehensive Academy Attendance System...');
    
    // Initialize IndexedDB with enhanced persistence
    await initializeDefaultAdmin();
    
    // Generate sample staff if needed (only if no staff exists)
    await generateSampleStaff();
    
    console.log('Application initialized successfully with persistent IndexedDB storage');
  } catch (error) {
    console.error('Application initialization failed:', error);
    // App will still load but may have limited functionality
  }
};

// Initialize app
initializeApp();

createRoot(document.getElementById("root")!).render(<App />);
