# Mobile App - Installation & Setup

## Install Dependencies

```bash
cd mobile
npm install
```

This will install `expo-secure-store` and all other dependencies.

## Configure API URL

Create or update `.env` file in the mobile directory:

```
EXPO_PUBLIC_API_URL=http://localhost:5000/api
```

For testing on a physical device, use your computer's IP address:

```
EXPO_PUBLIC_API_URL=http://192.168.1.x:5000/api
```

## Run the App

```bash
npm start
```

Then choose your platform:

- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app for physical device

## Features Implemented

✅ **Authentication System**

- Login screen with email/password
- First-time password change screen
- Secure token storage using expo-secure-store
- Protected routes with auto-redirect
- Auth state management with Zustand

✅ **API Integration**

- Axios client with JWT token injection
- Automatic 401 handling
- Type-safe API methods
- Error handling with alerts

✅ **UI Components**

- NativeWind (Tailwind CSS) styling
- Responsive layouts
- Loading states
- Form validation

## Default Login

Use the same credentials as web:

- Email: `superadmin@examtrack.com`
- Password: `SuperAdmin@123`

Or any user created through the web dashboard.

## Project Structure

```
mobile/
├── api/              # API client methods
├── app/              # App screens (Expo Router)
│   ├── login.tsx
│   ├── change-password.tsx
│   └── (tabs)/       # Protected tab screens
├── lib/              # Utilities
├── store/            # Zustand state management
├── types/            # TypeScript types
└── utils/            # Helper functions (secure storage)
```

## Next Steps

- Implement QR code scanning for students
- Add exam session management screens
- Implement script transfer functionality
- Add real-time updates with Socket.IO
