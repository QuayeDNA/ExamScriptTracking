# Development Mode Deployment Guide

**Deployment Type:** Local Network Development Mode  
**Target Environment:** Windows PC with Hotspot/LAN  
**Purpose:** Active Development + Network Testing  
**Last Updated:** December 9, 2025

---

## Overview

This guide sets up your ExamTrack system in **development mode** on your local network, allowing:

✅ **Code changes reflect instantly** (hot reload)  
✅ **Users can access via network** like a production app  
✅ **No rebuild/reinstall cycle** for quick iterations  
✅ **Full debugging and logging** capabilities  
✅ **Mobile app updates automatically** via Expo Go

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Prerequisites](#prerequisites)
3. [Network Setup](#network-setup)
4. [Database Setup](#database-setup)
5. [Backend Development Server](#backend-development-server)
6. [Web Development Server](#web-development-server)
7. [Mobile Development Access](#mobile-development-access)
8. [Automation Scripts](#automation-scripts)
9. [Daily Workflow](#daily-workflow)
10. [Troubleshooting](#troubleshooting)

---

## Quick Start

**TL;DR - Get everything running in 5 minutes:**

```powershell
# 1. Start Windows Mobile Hotspot
# Settings → Network & Internet → Mobile Hotspot → ON

# 2. Get your IP address
ipconfig
# Look for: Wireless LAN adapter Local Area Connection* X
# Note the IPv4 Address (e.g., 192.168.137.1)

# 3. Start all dev servers (from project root)
.\start-dev.ps1

# 4. Access URLs:
# Web:    http://192.168.137.1:5173
# Backend: http://192.168.137.1:5000
# Mobile: Use Expo Go app + scan QR code
```

---

## Prerequisites

### Required Software

1. **Node.js 18+**

   - Check: `node --version`
   - Download: https://nodejs.org/

2. **PostgreSQL 15+**

   - Check: `Get-Service postgresql*`
   - Download: https://www.postgresql.org/download/windows/

3. **Git** (optional but recommended)
   - Check: `git --version`
   - Download: https://git-scm.com/

### Required Mobile Apps

**For users testing the mobile app:**

- **ExamTrack Development Build** (APK you'll build once)
  - Install APK from your provided link
  - Auto-updates when you change code
  - No Expo Go needed
  - Works on Android 6.0+

### Optional but Recommended

- **Windows Terminal** (better terminal experience)
- **VS Code** (for code editing with integrated terminals)
- **Postman** (for API testing)

---

## Network Setup

### Step 1: Enable Windows Mobile Hotspot

```powershell
# Method 1: GUI
# 1. Open Settings (Win + I)
# 2. Network & Internet → Mobile Hotspot
# 3. Share my Internet connection from: Wi-Fi (or Ethernet)
# 4. Share over: Wi-Fi
# 5. Toggle "Share my Internet connection with other devices" → ON

# Method 2: PowerShell (requires Admin)
# Note: GUI method is more reliable
```

**Customize your hotspot:**

- Network name: `ExamTrack-Dev`
- Password: Choose something memorable (e.g., `ExamTrack2025`)

### Step 2: Find Your IP Address

```powershell
# Get all network adapters
ipconfig

# Look for section like:
# Wireless LAN adapter Local Area Connection* X:
#    IPv4 Address. . . . . . . . . . . : 192.168.137.1

# Or use this command to get just the IP:
(Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like "192.168.137.*"}).IPAddress
```

**Your IP will typically be:** `192.168.137.1` (Windows hotspot default)

### Step 3: Configure Windows Firewall

```powershell
# Run as Administrator
# Allow Node.js through firewall for all networks

New-NetFirewallRule -DisplayName "ExamTrack Dev - Backend" `
  -Direction Inbound -Protocol TCP -LocalPort 5000 `
  -Action Allow -Profile Any

New-NetFirewallRule -DisplayName "ExamTrack Dev - Web Vite" `
  -Direction Inbound -Protocol TCP -LocalPort 5173 `
  -Action Allow -Profile Any

New-NetFirewallRule -DisplayName "ExamTrack Dev - Expo Metro" `
  -Direction Inbound -Protocol TCP -LocalPort 8081 `
  -Action Allow -Profile Any

# Verify rules created
Get-NetFirewallRule -DisplayName "ExamTrack Dev*"
```

### Step 4: Test Network Connectivity

Create `test-network.ps1`:

```powershell
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like "192.168.137.*"}).IPAddress

Write-Host "🌐 Network Configuration" -ForegroundColor Cyan
Write-Host "IP Address: $ip"
Write-Host ""

Write-Host "📱 Share these URLs with users:" -ForegroundColor Green
Write-Host "Web Dashboard: http://${ip}:5173"
Write-Host "Backend API:   http://${ip}:5000"
Write-Host ""

Write-Host "Testing connectivity..." -ForegroundColor Yellow

# Test if ports are listening
$ports = @(5000, 5173, 8081)
foreach ($port in $ports) {
    $connection = Test-NetConnection -ComputerName $ip -Port $port -InformationLevel Quiet
    if ($connection) {
        Write-Host "✅ Port $port is accessible" -ForegroundColor Green
    } else {
        Write-Host "❌ Port $port is NOT accessible" -ForegroundColor Red
    }
}
```

---

## Database Setup

### Step 1: Ensure PostgreSQL is Running

```powershell
# Check status
Get-Service postgresql*

# If not running, start it
Start-Service postgresql-x64-15

# Set to start automatically
Set-Service postgresql-x64-15 -StartupType Automatic
```

### Step 2: Configure Database (One-Time Setup)

```powershell
cd backend

# Create .env file if not exists
if (!(Test-Path .env)) {
    Copy-Item .env.example .env
}
```

Edit `backend/.env`:

```env
# Database
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/examtrack?schema=public"

# JWT Secret (generate a secure one)
JWT_SECRET=your_generated_secret_here

# Server Configuration
PORT=5000
HOST=0.0.0.0

# Development Mode
NODE_ENV=development

# CORS - Allow network access
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,http://192.168.137.1:5173,http://192.168.137.1:3000
```

**Generate JWT Secret:**

```powershell
# Run this in PowerShell
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Copy the output and paste into .env as JWT_SECRET
```

### Step 3: Initialize Database

```powershell
cd backend

# Install dependencies
npm install

# Run migrations (creates tables)
npx prisma migrate dev

# Seed with test data
npm run seed
```

**Default users created:**

- Admin: `admin@example.com` / `Admin@123`
- Attendance: `attendance@examtrack.com` / `Attendance@123`

### Step 4: Verify Database

```powershell
# Open Prisma Studio (visual database browser)
npx prisma studio
# Opens in browser at http://localhost:5555

# Check that tables exist: User, ExamSession, Student, etc.
```

---

## Backend Development Server

### Step 1: Configure for Network Access

Verify `backend/src/server.ts` listens on all interfaces:

```typescript
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "0.0.0.0"; // Important!

app.listen(PORT, HOST, () => {
  console.log(`✅ Server running on http://${HOST}:${PORT}`);
  console.log(`🌐 Network access: http://192.168.137.1:${PORT}`);
});
```

### Step 2: Start Backend Dev Server

```powershell
cd backend

# Start with auto-reload on file changes
npm run dev

# Or with more verbose logging
npm run dev -- --watch
```

**What this does:**

- Starts Express server on port 5000
- Auto-reloads when you change code
- Shows detailed logs in console
- Accessible from network at `http://192.168.137.1:5000`

### Step 3: Verify Backend is Running

**From your PC:**

```powershell
# Test health endpoint
curl http://localhost:5000/health

# Expected response:
# {"status":"ok","timestamp":"2025-12-09T10:30:00.000Z"}
```

**From another device (on your network):**

```
Open browser → http://192.168.137.1:5000/health
Should see same JSON response
```

---

## Web Development Server

### Step 1: Configure for Network Access

Edit `web/.env.development`:

```env
# Backend API URL
VITE_API_URL=http://192.168.137.1:5000/api

# Socket.IO URL
VITE_SOCKET_URL=http://192.168.137.1:5000

# App Title
VITE_APP_TITLE=ExamTrack Dev
```

**Important:** Replace `192.168.137.1` with YOUR actual IP if different!

### Step 2: Start Web Dev Server

```powershell
cd web

# Install dependencies (first time)
npm install

# Start Vite dev server with network access
npm run dev -- --host 0.0.0.0

# Or add to package.json scripts:
# "dev": "vite --host 0.0.0.0"
```

**What this does:**

- Starts Vite dev server on port 5173
- Hot Module Replacement (HMR) - changes reflect instantly
- Accessible from network at `http://192.168.137.1:5173`
- Shows build errors in browser

### Step 3: Verify Web Dashboard

**From your PC:**

```
http://localhost:5173
```

**From another device:**

```
http://192.168.137.1:5173
```

**Test login:**

- Email: `admin@example.com`
- Password: `Admin@123`

---

## Mobile Development Access

### Option 1: Expo Go (Recommended for Development)

This is the **easiest and best** option while developing.

#### Step 1: Configure Mobile App

Edit `mobile/.env.development`:

```env
# Backend API URL (use YOUR IP!)
EXPO_PUBLIC_API_URL=http://192.168.137.1:5000/api

# Socket.IO URL
EXPO_PUBLIC_SOCKET_URL=http://192.168.137.1:5000

# Environment
EXPO_PUBLIC_ENV=development
```

#### Step 2: Start Expo Dev Server

```powershell
cd mobile

# Install dependencies (first time)
npm install

# Start Expo with tunnel (works across networks)
npx expo start --tunnel

# Or without tunnel (faster, requires same network)
npx expo start --lan
```

**Output will show:**

```
› Metro waiting on exp://192.168.137.1:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)

› Press a │ open Android
› Press w │ open web

› Press r │ reload app
› Press m │ toggle menu
```

#### Step 3: Users Connect via Expo Go

**On Android devices:**

1. Install **Expo Go** from Play Store
2. Open Expo Go app
3. Tap "Scan QR code"
4. Scan the QR code from your terminal
5. App loads and runs!

**Benefits:**

- ✅ App updates **instantly** when you change code
- ✅ No APK rebuild needed
- ✅ Shows errors and logs in real-time
- ✅ Shake device to access dev menu
- ✅ Can reload app anytime

#### Step 4: Test Mobile App

**Login credentials:**

- Email: `attendance@examtrack.com`
- Password: `Attendance@123`

**Test features:**

- Dashboard loads
- QR scanning works
- Real-time updates (test with web dashboard open)
- Script tracking
- Class attendance

---

### Option 2: Development Build (If Expo Go Has Limitations)

Some native features might not work in Expo Go. In that case, create a dev build:

```powershell
cd mobile

# Build development APK (one-time, ~15 minutes)
npx expo run:android

# Or using EAS
eas build --profile development --platform android
```

Then users install this APK once, and it **still auto-updates** via Expo's dev server!

---

## Automation Scripts

### 1. Start All Development Servers

Create `start-dev.ps1` in project root:

```powershell
# Start All ExamTrack Development Servers
# Run from project root directory

Write-Host "🚀 Starting ExamTrack Development Environment..." -ForegroundColor Green
Write-Host ""

# Get IP Address
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like "192.168.137.*"}).IPAddress
if (!$ip) {
    $ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -notlike "127.*"}).IPAddress | Select-Object -First 1
}

Write-Host "🌐 Network IP: $ip" -ForegroundColor Cyan
Write-Host ""

# Check if PostgreSQL is running
Write-Host "📊 Checking PostgreSQL..." -ForegroundColor Yellow
$pgService = Get-Service postgresql* -ErrorAction SilentlyContinue
if ($pgService.Status -ne "Running") {
    Write-Host "⚠️  PostgreSQL not running. Starting..." -ForegroundColor Yellow
    Start-Service postgresql-x64-15
    Start-Sleep -Seconds 3
}
Write-Host "✅ PostgreSQL running" -ForegroundColor Green

# Start Backend
Write-Host ""
Write-Host "🔧 Starting Backend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$PSScriptRoot\backend'; npm run dev"
) -WindowStyle Normal
Start-Sleep -Seconds 5

# Start Web
Write-Host "🌐 Starting Web Dashboard..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$PSScriptRoot\web'; npm run dev -- --host 0.0.0.0"
) -WindowStyle Normal
Start-Sleep -Seconds 5

# Start Mobile Dev Server
Write-Host "📱 Starting Mobile Dev Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$PSScriptRoot\mobile'; npx expo start --dev-client --lan"
) -WindowStyle Normal
Start-Sleep -Seconds 3Write-Host ""
Write-Host "✅ All servers started!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Access URLs:" -ForegroundColor Cyan
Write-Host "   Web Dashboard: http://$ip`:5173" -ForegroundColor White
Write-Host "   Backend API:   http://$ip`:5000" -ForegroundColor White
Write-Host "   Mobile Dev:    http://$ip`:8081" -ForegroundColor White
Write-Host "   APK Download:  http://$ip`:8080" -ForegroundColor White
Write-Host ""
Write-Host "🔐 Test Credentials:" -ForegroundColor Cyan
Write-Host "   Admin:      admin@example.com / Admin@123" -ForegroundColor White
Write-Host "   Attendance: attendance@examtrack.com / Attendance@123" -ForegroundColor White
Write-Host ""
Write-Host "💡 Tips:" -ForegroundColor Yellow
Write-Host "   - Keep these windows open while developing"
Write-Host "   - Changes auto-reload (no restart needed)"
Write-Host "   - Check logs in each window for errors"
Write-Host "   - Press Ctrl+C in any window to stop that server"
Write-Host ""
Write-Host "📖 View logs in the opened terminal windows" -ForegroundColor Magenta
```

**Usage:**

```powershell
.\start-dev.ps1
```

### 2. Stop All Development Servers

Create `stop-dev.ps1`:

```powershell
# Stop All ExamTrack Development Servers

Write-Host "🛑 Stopping ExamTrack Development Servers..." -ForegroundColor Yellow

# Find and stop Node processes
$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "Stopping Node.js processes..." -ForegroundColor Yellow
    $nodeProcesses | Stop-Process -Force
    Write-Host "✅ Node.js processes stopped" -ForegroundColor Green
} else {
    Write-Host "ℹ️  No Node.js processes found" -ForegroundColor Gray
}

# Find and stop Expo processes
$expoProcesses = Get-Process expo -ErrorAction SilentlyContinue
if ($expoProcesses) {
    Write-Host "Stopping Expo processes..." -ForegroundColor Yellow
    $expoProcesses | Stop-Process -Force
    Write-Host "✅ Expo processes stopped" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ All development servers stopped!" -ForegroundColor Green
Write-Host "💡 PostgreSQL is still running (use 'Stop-Service postgresql-x64-15' to stop)" -ForegroundColor Yellow
```

**Usage:**

```powershell
.\stop-dev.ps1
```

### 3. Quick Network Info

Create `network-info.ps1`:

```powershell
# Display Network Information for ExamTrack

$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like "192.168.137.*"}).IPAddress
if (!$ip) {
    $ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -notlike "127.*"}).IPAddress | Select-Object -First 1
}

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         EXAMTRACK DEVELOPMENT NETWORK INFO           ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 Your IP Address: " -NoNewline -ForegroundColor Yellow
Write-Host "$ip" -ForegroundColor White
Write-Host ""
Write-Host "📱 Share these URLs with users:" -ForegroundColor Green
Write-Host "   Web Dashboard:  http://$ip`:5173" -ForegroundColor White
Write-Host "   Backend API:    http://$ip`:5000" -ForegroundColor White
Write-Host "   Mobile:         Scan QR code from Expo" -ForegroundColor White
Write-Host ""
Write-Host "🔐 Test Credentials:" -ForegroundColor Cyan
Write-Host "   Admin:     admin@example.com / Admin@123" -ForegroundColor White
Write-Host "   Attendance: attendance@examtrack.com / Attendance@123" -ForegroundColor White
Write-Host ""
Write-Host "📡 Hotspot Information:" -ForegroundColor Yellow
Get-NetAdapter | Where-Object {$_.Status -eq "Up" -and $_.Name -like "*Wireless*"} |
    Select-Object Name, Status, LinkSpeed | Format-Table -AutoSize
Write-Host ""
Write-Host "🔌 Port Status:" -ForegroundColor Yellow
$ports = @(
    @{Port=5000; Name="Backend"},
    @{Port=5173; Name="Web (Vite)"},
    @{Port=8081; Name="Mobile (Expo)"}
)

foreach ($p in $ports) {
    $listening = Get-NetTCPConnection -LocalPort $p.Port -State Listen -ErrorAction SilentlyContinue
    if ($listening) {
        Write-Host "   ✅ Port $($p.Port) ($($p.Name)) - LISTENING" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Port $($p.Port) ($($p.Name)) - NOT LISTENING" -ForegroundColor Red
    }
}
Write-Host ""
```

**Usage:**

```powershell
.\network-info.ps1
```

### 4. Database Reset Script

Create `reset-database.ps1`:

```powershell
# Reset Database with Fresh Data

Write-Host "⚠️  This will DELETE all data and reseed the database!" -ForegroundColor Yellow
Write-Host "Are you sure? (y/N): " -NoNewline
$confirm = Read-Host

if ($confirm -ne "y") {
    Write-Host "Cancelled." -ForegroundColor Gray
    exit
}

Write-Host ""
Write-Host "🗑️  Resetting database..." -ForegroundColor Yellow

cd backend

# Reset database
npx prisma migrate reset --force

Write-Host ""
Write-Host "✅ Database reset complete!" -ForegroundColor Green
Write-Host "🔐 Default users recreated:" -ForegroundColor Cyan
Write-Host "   admin@example.com / Admin@123" -ForegroundColor White
Write-Host "   attendance@examtrack.com / Attendance@123" -ForegroundColor White
```

**Usage:**

```powershell
.\reset-database.ps1
```

---

## Daily Workflow

### Starting Your Day

```powershell
# 1. Enable Windows Mobile Hotspot
# Settings → Mobile Hotspot → ON

# 2. Start all dev servers
.\start-dev.ps1

# 3. Share network info with testers
.\network-info.ps1

# 4. Start coding!
```

### Making Changes

**Backend changes:**

```
1. Edit files in backend/src/
2. Server auto-reloads
3. Changes reflected immediately
4. Check terminal for errors
```

**Web changes:**

```
1. Edit files in web/src/
2. Vite auto-reloads (Hot Module Replacement)
3. Browser updates instantly
4. Check browser console for errors
```

**Mobile changes:**

```
1. Edit files in mobile/
2. Expo reloads automatically
3. Shake device → "Reload" if needed
4. Check Expo Dev Tools for errors
```

### Testing with Network Users

```powershell
# Share this with testers:
.\network-info.ps1

# They connect to:
# - Web: http://192.168.137.1:5173
# - Mobile: Scan QR from Expo (on your screen)
```

### End of Day

```powershell
# Stop all servers
.\stop-dev.ps1

# Optional: Stop PostgreSQL
Stop-Service postgresql-x64-15
```

---

## Troubleshooting

### Issue: "Cannot connect from other devices"

**Solution:**

```powershell
# 1. Check firewall rules
Get-NetFirewallRule -DisplayName "ExamTrack Dev*"

# 2. Test port accessibility
Test-NetConnection -ComputerName 192.168.137.1 -Port 5000

# 3. Verify servers are running
Get-Process node

# 4. Check IP address hasn't changed
ipconfig
```

### Issue: "Backend won't start - Port 5000 in use"

**Solution:**

```powershell
# Find what's using port 5000
Get-NetTCPConnection -LocalPort 5000 -State Listen

# Kill the process
Stop-Process -Id [PID] -Force

# Or change port in backend/.env
# PORT=5001
```

### Issue: "Web dashboard shows blank page"

**Solution:**

```powershell
# 1. Check backend is running
curl http://localhost:5000/health

# 2. Check .env.development has correct IP
cat web/.env.development

# 3. Clear browser cache and reload
# Ctrl+Shift+R (hard refresh)

# 4. Check browser console for errors
# F12 → Console tab
```

### Issue: "Mobile app won't connect to backend"

**Solution:**

```powershell
# 1. Verify IP in mobile/.env.development
cat mobile/.env.development

# 2. Test backend from mobile device browser
# Open: http://192.168.137.1:5000/health

# 3. Ensure mobile device is on same WiFi network

# 4. In Expo Go, shake device → "Reload"
```

### Issue: "Changes not reflecting"

**Backend:**

```powershell
# Check if dev server is still running
# Look for "Restarting..." in terminal

# If stuck, restart manually:
# Ctrl+C in backend terminal
npm run dev
```

**Web:**

```powershell
# Hard refresh browser: Ctrl+Shift+R

# If still stuck, restart Vite:
# Ctrl+C in web terminal
npm run dev -- --host 0.0.0.0
```

**Mobile:**

```powershell
# In Expo Go: Shake device → Reload

# Or restart Expo server:
# Ctrl+C in mobile terminal
npx expo start --lan
```

### Issue: "Database connection failed"

**Solution:**

```powershell
# 1. Check PostgreSQL is running
Get-Service postgresql*

# 2. Test database connection
cd backend
npx prisma studio

# 3. Check DATABASE_URL in .env
cat .env

# 4. Verify database exists
# psql -U postgres -l
```

### Issue: "Out of memory error"

**Solution:**

```powershell
# Increase Node memory limit
$env:NODE_OPTIONS="--max-old-space-size=4096"

# Then restart servers
.\stop-dev.ps1
.\start-dev.ps1
```

---

## Advanced Tips

### 1. Use VS Code Integrated Terminals

Instead of separate PowerShell windows:

```json
// .vscode/tasks.json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Start Backend Dev",
      "type": "shell",
      "command": "npm run dev",
      "options": {
        "cwd": "${workspaceFolder}/backend"
      },
      "isBackground": true,
      "problemMatcher": []
    },
    {
      "label": "Start Web Dev",
      "type": "shell",
      "command": "npm run dev -- --host 0.0.0.0",
      "options": {
        "cwd": "${workspaceFolder}/web"
      },
      "isBackground": true,
      "problemMatcher": []
    },
    {
      "label": "Start All Dev Servers",
      "dependsOn": ["Start Backend Dev", "Start Web Dev"]
    }
  ]
}
```

Then: `Ctrl+Shift+P` → `Tasks: Run Task` → `Start All Dev Servers`

### 2. Auto-Restart on Crash

Use `nodemon` with custom config:

```json
// backend/nodemon.json
{
  "watch": ["src"],
  "ext": "ts,js,json",
  "ignore": ["src/**/*.spec.ts"],
  "exec": "ts-node src/server.ts",
  "env": {
    "NODE_ENV": "development"
  }
}
```

### 3. Better Logging

Install `pino-pretty` for beautiful logs:

```powershell
cd backend
npm install --save-dev pino-pretty

# Update package.json:
# "dev": "nodemon | pino-pretty"
```

### 4. Mobile Debugging

```powershell
# View detailed mobile logs
npx expo start --lan --devClient

# Or use React Native Debugger
# Download: https://github.com/jhen0409/react-native-debugger
```

---

## Quick Reference

```
╔═══════════════════════════════════════════════════════════╗
║              EXAMTRACK DEV MODE QUICK REF                 ║
╠═══════════════════════════════════════════════════════════╣
║ START                                                     ║
║  .\start-dev.ps1                                         ║
║                                                           ║
║ STOP                                                      ║
║  .\stop-dev.ps1                                          ║
║                                                           ║
║ NETWORK INFO                                              ║
║  .\network-info.ps1                                      ║
║                                                           ║
║ URLS (share with testers)                                ║
║  Web:        http://192.168.137.1:5173                   ║
║  Backend:    http://192.168.137.1:5000                   ║
║  APK Download: http://192.168.137.1:8080                 ║
║  Mobile Dev:  http://192.168.137.1:8081                  ║
║                                                           ║
║ CREDENTIALS                                               ║
║  Admin:     admin@example.com / Admin@123                ║
║  Attendance: attendance@examtrack.com / Attendance@123   ║
║                                                           ║
║ RESET DATABASE                                            ║
║  .\reset-database.ps1                                    ║
║                                                           ║
║ MANUAL START                                              ║
║  Backend:  cd backend; npm run dev                       ║
║  Web:      cd web; npm run dev -- --host 0.0.0.0        ║
║  Mobile:   cd mobile; npx expo start --dev-client --lan ║
║  APK Host: cd C:/ExamTrack-Download; http-server -p 8080║
╚═══════════════════════════════════════════════════════════╝
```

---

## Summary

**You now have:**
✅ Development servers accessible from network  
✅ Auto-reload on code changes (no rebuilds!)  
✅ Mobile app via Expo Go (no APK needed!)  
✅ Automation scripts for easy start/stop  
✅ Full debugging capabilities  
✅ Production-like user experience

**Perfect for:**

- Active development and testing
- Quick iterations and bug fixes
- Network testing with real users
- Presentations with live coding

**When ready for production:**

- Use the `DEPLOYMENT_LOCAL.md` guide
- Build production APK
- Deploy to campus server

Happy coding! 🚀
