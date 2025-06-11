
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Al\'asr Academy Attendance System in Electron...');

// Set environment variable for development
process.env.NODE_ENV = 'development';

// Enable USB and experimental features
process.env.ELECTRON_ENABLE_LOGGING = 'true';

// Start Vite dev server first
console.log('📦 Starting Vite development server...');
const viteProcess = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true,
  cwd: process.cwd(),
  env: {
    ...process.env,
    FORCE_COLOR: '1'
  }
});

// Wait for Vite to be ready, then start Electron
setTimeout(() => {
  console.log('⚡ Starting Electron application with USB support...');
  const electronProcess = spawn('npx', ['electron', 'public/electron.js'], {
    stdio: 'inherit',
    shell: true,
    cwd: process.cwd(),
    env: {
      ...process.env,
      ELECTRON_ENABLE_LOGGING: 'true',
      FORCE_COLOR: '1'
    }
  });

  // Handle process cleanup
  const cleanup = () => {
    console.log('🛑 Shutting down processes...');
    try {
      viteProcess.kill();
      electronProcess.kill();
    } catch (error) {
      console.log('Process cleanup completed');
    }
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  
  electronProcess.on('close', (code) => {
    console.log(`Electron process exited with code ${code}`);
    try {
      viteProcess.kill();
    } catch (error) {
      console.log('Vite process cleanup completed');
    }
    process.exit(0);
  });

  viteProcess.on('error', (error) => {
    console.error('Vite process error:', error);
  });

  electronProcess.on('error', (error) => {
    console.error('Electron process error:', error);
  });

}, 3000); // Wait 3 seconds for Vite to start
