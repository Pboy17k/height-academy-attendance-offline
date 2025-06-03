
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { DatabaseService } from '@/lib/database'
import { generateSampleStaff } from '@/lib/sampleData'

// Initialize default admin and sample data on app start
DatabaseService.initializeDefaultAdmin()
  .then(() => generateSampleStaff())
  .catch(console.error);

createRoot(document.getElementById("root")!).render(<App />);
