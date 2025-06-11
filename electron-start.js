
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Al\'asr Academy Attendance System in Electron...');

// Set environment variable for development
process.env.NODE_ENV = 'development';

// Start Vite dev server first
console.log('📦 Starting Vite development server...');
const viteProcess = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true,
  cwd: process.cwd()
});

// Wait for Vite to be ready, then start Electron
setTimeout(() => {
  console.log('⚡ Starting Electron application...');
  const electronProcess = spawn('npx', ['electron', 'public/electron.js'], {
    stdio: 'inherit',
    shell: true,
    cwd: process.cwd()
  });

  // Handle process cleanup
  const cleanup = () => {
    console.log('🛑 Shutting down processes...');
    viteProcess.kill();
    electronProcess.kill();
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  
  electronProcess.on('close', () => {
    viteProcess.kill();
    process.exit(0);
  });

}, 3000); // Wait 3 seconds for Vite to start
