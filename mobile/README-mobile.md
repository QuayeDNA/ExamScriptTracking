# Mobile App - Exam Script Tracking System

## Description

React Native + Expo + TypeScript mobile application for exam handlers (invigilators, lecturers, etc.) to scan QR codes, manage batch transfers, and track custody chains.

## Tech Stack

- **Framework:** React Native
- **Platform:** Expo
- **Language:** TypeScript
- **Styling:** NativeWind (Tailwind CSS for React Native)
- **Navigation:** Expo Router
- **Camera/QR:** expo-camera + react-native-qrcode-scanner
- **State Management:** Zustand
- **HTTP Client:** Axios
- **Real-time:** Socket.io Client
- **Notifications:** Expo Notifications

## Prerequisites

- Node.js 20+ LTS
- npm or yarn
- Expo CLI
- iOS Simulator (Mac) or Android Emulator

## Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your API URL
```

## Development

```bash
# Start Expo development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on web
npm run web
```

## Build

```bash
# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

## Environment Variables

See `.env.example` for required environment variables:

- `API_URL` - Backend API URL (default: http://localhost:3000)
- `SOCKET_URL` - Socket.io server URL (default: http://localhost:3001)

## Project Structure

```
mobile/
├── app/                     # Expo Router pages
│   ├── (tabs)/             # Tab navigation screens
│   ├── _layout.tsx         # Root layout
│   └── modal.tsx           # Modal screen
├── assets/                 # Static assets (images, fonts)
├── components/             # Reusable components
├── constants/              # App constants
├── hooks/                  # Custom React hooks
├── src/
│   └── screens/           # Screen components
├── app.json               # Expo configuration
├── babel.config.js        # Babel configuration
├── metro.config.js        # Metro bundler configuration
├── tailwind.config.js     # Tailwind/NativeWind configuration
├── global.css             # Global styles
├── nativewind-env.d.ts    # NativeWind TypeScript definitions
├── package.json
└── README.md
```

## Features

- QR code scanning for students and batches
- Session management (start/close exams)
- Student entry/exit tracking
- Batch transfer handshake system
- Real-time notifications for transfer requests
- Offline capability with sync
- Camera integration
- Push notifications

## Scripts

- `npm start` - Start Expo development server
- `npm run ios` - Run on iOS simulator
- `npm run android` - Run on Android emulator
- `npm run web` - Run on web
- `npm run lint` - Lint code

## Camera Permissions

The app requires camera permissions for QR code scanning. Make sure to grant permissions when prompted.

## License

ISC
