
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { DatabaseService } from '@/lib/database'

// Initialize default admin on app start
DatabaseService.initializeDefaultAdmin().catch(console.error);

createRoot(document.getElementById("root")!).render(<App />);
