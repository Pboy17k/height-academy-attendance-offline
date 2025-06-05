
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializeDefaultAdmin } from '@/lib/db'

// Enhanced initialization without clearing user data
const initializeApp = async () => {
  try {
    console.log('Initializing Al\'asr Comprehensive Academy Attendance System...');
    
    // Only initialize IndexedDB and admin account - do not clear any data
    await initializeDefaultAdmin();
    
    console.log('Application initialized successfully');
    console.log('All data changes will be permanently stored in IndexedDB and localStorage');
  } catch (error) {
    console.error('Application initialization failed:', error);
    // App will still load but may have limited functionality
  }
};

// Initialize app
initializeApp();

createRoot(document.getElementById("root")!).render(<App />);
