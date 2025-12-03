# Mobile App Network Configuration Guide

## Problem

Expo Go apps running on physical devices or emulators can't access `localhost` because localhost refers to the device itself, not your computer where the backend is running.

## Solution

Use your computer's local IP address instead of localhost. This allows the mobile app to access the backend server over your local network.

## Current Configuration

- **Your Local IP**: `192.168.43.153`
- **Backend API**: `http://192.168.43.153:3000/api`
- **Socket.io**: `http://192.168.43.153:3001`

## Setup Steps

### 1. Verify Network Configuration

Ensure both your computer and phone are on the **same Wi-Fi network**.

### 2. Update Mobile Environment Variables

The mobile `.env` file has been automatically configured with your IP address:

```bash
EXPO_PUBLIC_API_URL=http://192.168.43.153:3000/api
```

### 3. Configure Windows Firewall (Important!)

Windows Firewall may block incoming connections from your phone. You need to allow Node.js:

**Option A: Allow through Windows Defender Firewall**

1. Open Windows Defender Firewall
2. Click "Allow an app or feature through Windows Defender Firewall"
3. Click "Change settings"
4. Find "Node.js" in the list (or click "Allow another app" to add it)
5. Check both "Private" and "Public" network boxes
6. Click OK

**Option B: Quick PowerShell Command (Run as Administrator)**

```powershell
# Allow Node.js through firewall for port 3000 (backend) and 3001 (socket.io)
New-NetFirewallRule -DisplayName "Node.js Backend Server" -Direction Inbound -Program "C:\Program Files\nodejs\node.exe" -Action Allow
```

### 4. Start the Backend Server

The backend is now configured to listen on all network interfaces (0.0.0.0):

```bash
npm run dev:backend
```

You should see:

```
✅ Express server running on:
   - Local: http://localhost:3000
   - Network: http://192.168.43.153:3000
   (Use the Network URL for Expo Go app)
```

### 5. Start the Mobile App

```bash
npm run dev:mobile
```

### 6. Test Connection

In Expo Go, the app should now connect to your backend server.

## Troubleshooting

### IP Address Changed?

If your computer's IP address changes (common with DHCP), run:

```bash
npm run update-ip
```

This will automatically detect your new IP and update the mobile `.env` file.

### Can't Connect from Phone?

1. **Check same network**: Verify phone and computer are on the same Wi-Fi
2. **Ping test**: From your phone's browser, try accessing `http://192.168.43.153:3000/health`
3. **Firewall**: Ensure Windows Firewall allows Node.js (see step 3)
4. **Antivirus**: Some antivirus software may block connections
5. **VPN**: Disable any VPN on either device

### Check Your Current IP

**Windows (PowerShell):**

```powershell
(Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi*","Ethernet*" | Where-Object { $_.IPAddress -notlike "169.254.*" } | Select-Object -First 1).IPAddress
```

**Windows (Command Prompt):**

```cmd
ipconfig
```

Look for "IPv4 Address" under your active network adapter.

**Mac/Linux:**

```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

### Alternative: Using Expo Tunnel

If network access doesn't work, you can use Expo's tunnel feature:

```bash
cd mobile
npx expo start --tunnel
```

This creates a public URL that works from anywhere, but it's slower.

## Backend Changes Made

### 1. CORS Configuration

Updated to allow requests from mobile apps (no origin header) in development:

```typescript
// Allows any origin in development mode for Expo Go
if (process.env.NODE_ENV === "development") {
  return callback(null, true);
}
```

### 2. Server Binding

Changed from `localhost` to `0.0.0.0` to accept connections from all network interfaces:

```typescript
app.listen(PORT, "0.0.0.0", () => {
  // Server accessible from network
});
```

## Security Notes

⚠️ **Development Only**: The permissive CORS policy is only active when `NODE_ENV=development`. In production, CORS will be restricted to specific domains.

🔒 **Production**: Before deploying to production:

1. Remove the development CORS bypass
2. Set specific allowed origins in environment variables
3. Use HTTPS for all connections
4. Configure proper firewall rules

## Quick Reference

| Service     | Localhost URL             | Network URL                    |
| ----------- | ------------------------- | ------------------------------ |
| Backend API | http://localhost:3000/api | http://192.168.43.153:3000/api |
| Socket.io   | http://localhost:3001     | http://192.168.43.153:3001     |
| Web App     | http://localhost:5173     | http://192.168.43.153:5173     |

## Useful Commands

```bash
# Update IP address when it changes
npm run update-ip

# Check if backend is running (from phone's browser)
http://192.168.43.153:3000/health

# Start all services
npm run dev

# Start only mobile
npm run dev:mobile

# Start only backend
npm run dev:backend
```

## Additional Tips

1. **Static IP**: Consider setting a static IP address on your computer to avoid frequent updates
2. **Router Configuration**: Some routers may block device-to-device communication (AP Isolation). Check your router settings.
3. **Mobile Data**: Won't work if your phone is using mobile data - must be on same Wi-Fi
4. **Network Switches**: If you have multiple network adapters, ensure you're using the right one

## Support

If you continue to have issues:

1. Check firewall logs
2. Try disabling firewall temporarily (for testing only)
3. Ensure no proxy or VPN is interfering
4. Check your router's AP isolation settings
