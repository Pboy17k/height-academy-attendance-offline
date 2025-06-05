
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializeDefaultAdmin } from '@/lib/db'
import { generateSampleStaff } from '@/lib/sampleData'

// Enhanced initialization with persistent storage and user data tracking
const initializeApp = async () => {
  try {
    console.log('Initializing Al\'asr Comprehensive Academy Attendance System...');
    
    // Initialize IndexedDB with admin account
    await initializeDefaultAdmin();
    
    // Generate sample staff ONLY if user has never modified data
    // This prevents overriding user deletions and modifications
    await generateSampleStaff();
    
    console.log('Application initialized successfully with persistent storage');
    console.log('All data changes will be permanently stored in IndexedDB and localStorage');
    console.log('User data modifications are tracked to prevent sample data regeneration');
  } catch (error) {
    console.error('Application initialization failed:', error);
    // App will still load but may have limited functionality
  }
};

// Initialize app
initializeApp();

createRoot(document.getElementById("root")!).render(<App />);
