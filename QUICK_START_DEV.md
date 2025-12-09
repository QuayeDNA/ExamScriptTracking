# ExamTrack Development Setup - Quick Start

This guide gets you up and running with ExamTrack in development mode on your local network.

## 🚀 One-Time Setup (First Time Only)

### 1. Build Development APK

```powershell
.\build-dev-apk.ps1
```

This creates a development APK that **auto-updates** when you change code!

**Choose:**

- **Option 1:** EAS Build (easier, requires Expo account)
- **Option 2:** Local Build (requires Android SDK)

### 2. Setup Download Page

```powershell
.\setup-apk-download.ps1
```

Creates a download page at `http://192.168.137.1:8080`

## 🎯 Daily Workflow

### Starting Your Dev Environment

```powershell
# 1. Enable Windows Mobile Hotspot
# Settings → Mobile Hotspot → ON

# 2. Start all servers
.\start-dev.ps1
```

This opens 4 terminal windows:

- **Backend** - Express API (Port 5000)
- **Web** - Vite dev server (Port 5173)
- **Mobile** - Expo dev server (Port 8081)
- **APK Server** - HTTP server (Port 8080)

### Sharing with Users

```powershell
# Get network information
.\network-info.ps1
```

**Share these URLs:**

- 📱 **Mobile App Download:** `http://192.168.137.1:8080`
- 🌐 **Web Dashboard:** `http://192.168.137.1:5173`

**Test Credentials:**

- Admin: `admin@example.com` / `Admin@123`
- Attendance: `attendance@examtrack.com` / `Attendance@123`

### Making Code Changes

Just edit files and save - changes reflect automatically:

- **Backend:** Auto-reloads when you save
- **Web:** Hot Module Replacement (instant update in browser)
- **Mobile:** Auto-updates on devices (no reinstall!)

### Stopping Servers

```powershell
.\stop-dev.ps1
```

## 📱 For Users (Installing Mobile App)

1. Connect to WiFi: **ExamTrack-Dev**
2. Open browser → `http://192.168.137.1:8080`
3. Download and install APK
4. Enable "Unknown Sources" if prompted
5. Launch ExamTrack app
6. Login and use!

**Note:** Once installed, the app **automatically updates** when the developer changes code!

## 🔧 Maintenance

### Reset Database

```powershell
.\reset-database.ps1
```

Deletes all data and recreates default users.

### Rebuild APK (if needed)

```powershell
.\build-dev-apk.ps1
```

Only needed if:

- You change native dependencies
- You want to update app icon/name
- Development build gets corrupted

### Check Network Status

```powershell
.\network-info.ps1
```

Shows IP, port status, and access URLs.

## 📚 Full Documentation

- **DEPLOYMENT_DEV_MODE.md** - Complete development deployment guide
- **DEPLOYMENT_LOCAL.md** - Production deployment guide (for later)
- **USER_MANUAL.md** - End-user documentation

## 🆘 Troubleshooting

### "Can't connect from devices"

```powershell
# Check firewall
Get-NetFirewallRule -DisplayName "ExamTrack Dev*"

# Re-add rules (as Admin)
New-NetFirewallRule -DisplayName "ExamTrack Dev - Backend" `
  -Direction Inbound -Protocol TCP -LocalPort 5000 -Action Allow -Profile Any
```

### "Port already in use"

```powershell
# Find and kill the process
netstat -ano | findstr :5000
Stop-Process -Id [PID] -Force
```

### "Mobile app won't update"

```powershell
# On device: Shake → Reload
# Or restart Expo server
cd mobile
npx expo start --dev-client --lan --clear
```

### "Database connection failed"

```powershell
# Check PostgreSQL
Get-Service postgresql*

# Start if stopped
Start-Service postgresql-x64-15
```

## 💡 Tips

- Keep terminal windows open while developing
- Check logs for errors (they're in the terminal windows)
- Use `.\network-info.ps1` to quickly share URLs
- Mobile dev menu: Shake device
- Web dev tools: F12 in browser
- Backend logs show all API requests

## 🎬 Demo Workflow

Perfect for presentations:

1. **Setup** (once): Build APK, setup download page
2. **Start**: Run `.\start-dev.ps1`
3. **Share**: Show `.\network-info.ps1` output
4. **Demo**:
   - Users download APK from download page
   - Admin uses web dashboard
   - Handlers use mobile app
   - Show real-time sync between them
5. **Live Coding**: Make a change, save, watch it update everywhere!
6. **Stop**: Run `.\stop-dev.ps1`

## 📊 System Requirements

**Your PC:**

- Windows 10/11
- Node.js 18+
- PostgreSQL 15+
- 8GB+ RAM recommended

**User Devices:**

- Android 6.0+ (for mobile app)
- Any modern browser (for web dashboard)
- WiFi connectivity

## 🚀 Next Steps

Ready to deploy? See **DEPLOYMENT_LOCAL.md** for production deployment to campus server.

---

**Need help?** Check the full guides in:

- `DEPLOYMENT_DEV_MODE.md`
- `USER_MANUAL.md`
- `PROJECT_STATUS.md`
