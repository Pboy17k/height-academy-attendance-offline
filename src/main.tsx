
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { DatabaseService } from '@/lib/database'
import { generateSampleStaff } from '@/lib/sampleData'

// Enhanced initialization with better error handling
const initializeApp = async () => {
  try {
    console.log('Initializing Al\'asr Comprehensive Academy Attendance System...');
    
    // Initialize database with enhanced persistence
    await DatabaseService.initializeDefaultAdmin();
    
    // Generate sample staff if needed
    await generateSampleStaff();
    
    console.log('Application initialized successfully');
  } catch (error) {
    console.error('Application initialization failed:', error);
    // App will still load but may have limited functionality
  }
};

// Initialize app
initializeApp();

createRoot(document.getElementById("root")!).render(<App />);
