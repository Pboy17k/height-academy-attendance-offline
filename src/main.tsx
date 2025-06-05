
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializeDefaultAdmin, clearAllSampleData } from '@/lib/db'

// Enhanced initialization with clean slate approach
const initializeApp = async () => {
  try {
    console.log('Initializing Al\'asr Comprehensive Academy Attendance System...');
    
    // Initialize IndexedDB with admin account only
    await initializeDefaultAdmin();
    
    // Clear all existing sample data to start fresh
    await clearAllSampleData();
    
    console.log('Application initialized successfully with clean database');
    console.log('Sample data generation is disabled - create your own staff data');
    console.log('All data changes will be permanently stored in IndexedDB and localStorage');
  } catch (error) {
    console.error('Application initialization failed:', error);
    // App will still load but may have limited functionality
  }
};

// Initialize app
initializeApp();

createRoot(document.getElementById("root")!).render(<App />);
