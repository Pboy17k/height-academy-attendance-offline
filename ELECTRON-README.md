
# Al'asr Academy Attendance System - Electron Desktop App

## Overview
This is an offline biometric attendance system built with React, TypeScript, and Electron, designed to work with SecureGen Hamster fingerprint scanners.

## Features
- ✅ Automatic USB biometric device detection
- ✅ Offline-first data storage with IndexedDB
- ✅ Real-time fingerprint scanning
- ✅ Admin dashboard with attendance reports
- ✅ Dark/Light theme switcher
- ✅ Persistent data storage
- ✅ Windows desktop application

## Development Setup

### Prerequisites
- Node.js 18+ 
- Windows 10/11 (for USB device support)
- SecureGen Hamster fingerprint scanner

### Installation
```bash
# Install dependencies
npm install

# Start development mode (Vite + Electron)
npm run electron

# Or manually:
npm run dev  # Start Vite dev server
npx electron public/electron.js  # Start Electron (in another terminal)
```

### Building for Production
```bash
# Build the React app and Electron package
npm run build-electron

# The built application will be in the dist/ folder
```

## USB Device Support
The app automatically detects and connects to SecureGen Hamster devices via WebUSB API. Supported devices:
- SecureGen Hamster series
- Compatible biometric scanners with vendor IDs: 0x2109, 0x1162, 0x16d1

## Usage

### First Launch
1. Connect your SecureGen Hamster fingerprint scanner
2. Launch the application
3. The device status will show "Device Connected" when ready
4. Register staff members with their fingerprints
5. Start taking attendance

### Admin Access
- Default login: `admin` / `admin123`
- Access reports, staff management, and system settings

## Data Storage
All data is stored locally in IndexedDB for complete offline functionality:
- Staff records with fingerprint templates
- Attendance logs with timestamps
- System settings and admin accounts
- Automatic backup and restore capabilities

## Troubleshooting

### Device Not Detected
1. Ensure the USB device is properly connected
2. Check Windows Device Manager for the scanner
3. Try disconnecting and reconnecting the device
4. Restart the application

### Performance Issues
1. Close other USB-intensive applications
2. Ensure adequate system resources
3. Check for Windows updates
4. Restart the computer if needed

## Technical Architecture
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Desktop**: Electron with WebUSB support
- **Database**: IndexedDB with redundant backup systems
- **Biometric**: WebUSB API integration
- **State**: React Context + Custom Hooks

## Security
- Local-only data storage (no external servers)
- Encrypted biometric templates
- Admin role-based access control
- Secure USB device communication

---

## Development Commands

```bash
# Development
npm run dev          # Start Vite dev server only
npm run electron     # Start full Electron app in dev mode

# Building
npm run build        # Build React app for production
npm run build-electron # Build complete Electron package

# Utilities
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## Support
For technical support, check the device logs in the developer console (Ctrl+Shift+I) for detailed error messages.
