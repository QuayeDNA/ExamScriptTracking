# 📱 Mobile App Network Setup

## Quick Start

Your mobile app needs to connect to your backend server using your computer's IP address instead of localhost.

### 1. Configure Firewall (Windows - Run as Administrator)

```powershell
.\scripts\setup-firewall.ps1
```

### 2. Start Backend

```bash
npm run dev:backend
```

You'll see your network IP in the console output.

### 3. Start Mobile App

```bash
npm run dev:mobile
```

### 4. Verify Connection

From your phone's browser, visit: `http://192.168.43.153:3000/health`

## What Was Configured

✅ **Mobile .env file**: Set to use `http://192.168.43.153:3000/api`  
✅ **Backend CORS**: Allows requests from mobile devices  
✅ **Server binding**: Listens on all network interfaces (0.0.0.0)  
✅ **Firewall script**: Easy setup for Windows Firewall

## Important Notes

⚠️ **Same Network**: Your phone and computer MUST be on the same Wi-Fi network  
⚠️ **Firewall**: Windows Firewall must allow Node.js (use the setup script above)  
⚠️ **IP Changes**: If your IP changes, run `npm run update-ip`

## Troubleshooting

### Can't connect from phone?

1. Check same Wi-Fi network
2. Run firewall setup script as Administrator
3. Test from phone's browser: `http://192.168.43.153:3000/health`
4. Verify backend shows "Network: http://192.168.43.153:3000" in console

### IP Address Changed?

```bash
npm run update-ip
```

### Need detailed help?

See [MOBILE-NETWORK-SETUP.md](./MOBILE-NETWORK-SETUP.md) for comprehensive troubleshooting.

## Alternative: Use Expo Tunnel

If network access doesn't work:

```bash
cd mobile
npx expo start --tunnel
```

This is slower but works from anywhere.
