# Local Network Deployment Guide

**Deployment Type:** On-Premise / Local Network  
**Target Environment:** Windows PC with Hotspot/LAN  
**Purpose:** School Presentation & Campus Deployment  
**Last Updated:** December 9, 2025

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Network Setup](#network-setup)
4. [Database Setup](#database-setup)
5. [Backend Deployment](#backend-deployment)
6. [Web Dashboard Deployment](#web-dashboard-deployment)
7. [Mobile App Deployment](#mobile-app-deployment)
8. [Testing & Verification](#testing--verification)
9. [Presentation Day Checklist](#presentation-day-checklist)
10. [Troubleshooting](#troubleshooting)

---

## Overview

### Your Deployment Strategy

Your computer acts as the server hosting:

- **Backend API** (Express + PostgreSQL)
- **Web Dashboard** (Static files)
- **Mobile APK** (Download link)

Users connect to your WiFi hotspot/network to access the system.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                 Your Computer (Server)                   │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  PostgreSQL  │  │   Backend    │  │  Web Build   │ │
│  │   Database   │  │  (Port 5000) │  │(Static Files)│ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                           │                             │
│                    ┌──────┴──────┐                     │
│                    │  HTTP Server │                     │
│                    │  (Port 80)   │                     │
│                    └──────────────┘                     │
└─────────────────────────────────────────────────────────┘
                            │
                            │ WiFi Hotspot / LAN
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
  ┌─────▼─────┐      ┌─────▼─────┐      ┌─────▼─────┐
  │  Browser  │      │  Browser  │      │  Android  │
  │  (Admin)  │      │  (User)   │      │   Phone   │
  └───────────┘      └───────────┘      └───────────┘
```

### IP Address Strategy

When using Windows Mobile Hotspot, your PC typically gets:

- **Your PC IP:** `192.168.137.1` (standard Windows hotspot IP)
- **Backend API:** `http://192.168.137.1:5000`
- **Web Dashboard:** `http://192.168.137.1` (Port 80)
- **APK Download:** `http://192.168.137.1:8080/ExamTrack.apk`

> **Note:** Your actual IP may vary. Always verify with `ipconfig` command.

### Benefits of This Approach

✅ **Full Control** - Everything runs on your machine  
✅ **No Internet Required** - Works completely offline  
✅ **No Cloud Costs** - Free deployment  
✅ **Easy Demo** - Quick setup for presentations  
✅ **Campus Ready** - Same approach works on school network  
✅ **Data Privacy** - All data stays on your computer

---

## Prerequisites

### Software Requirements

#### 1. Node.js (Already Installed)

```powershell
# Verify installation
node --version  # Should be 18.x or higher
npm --version   # Should be 9.x or higher
```

#### 2. PostgreSQL Database

**Download:** https://www.postgresql.org/download/windows/

**Installation Steps:**

1. Download the Windows installer (version 15.x recommended)
2. Run installer as Administrator
3. Keep default installation directory: `C:\Program Files\PostgreSQL\15`
4. **IMPORTANT:** Set password for `postgres` user (write this down!)
5. Keep default port: `5432`
6. Select all components (PostgreSQL Server, pgAdmin, Command Line Tools)
7. Complete installation

**Verify Installation:**

```powershell
# Open Command Prompt
"C:\Program Files\PostgreSQL\15\bin\psql" --version
# Should display: psql (PostgreSQL) 15.x
```

#### 3. HTTP Server Tool

**Recommended: http-server (Simplest)**

```powershell
npm install -g http-server
```

**Alternative: NGINX for Windows**

- Download: https://nginx.org/en/download.html
- Extract to `C:\nginx`
- More powerful but requires configuration

#### 4. Process Manager (Optional but Recommended)

**PM2 - Keep servers running:**

```powershell
npm install -g pm2
pm2 --version
```

### Hardware Requirements

| Component   | Minimum          | Recommended      |
| ----------- | ---------------- | ---------------- |
| **RAM**     | 8GB              | 16GB             |
| **Storage** | 10GB free        | 20GB free        |
| **CPU**     | Dual-core        | Quad-core        |
| **WiFi**    | Built-in adapter | Built-in adapter |
| **Battery** | Keep plugged in  | Keep plugged in  |

### Network Requirements

- **Windows Mobile Hotspot** capability
- Or **LAN/WiFi router** on campus network
- Ability to modify Windows Firewall rules (requires Admin access)

---

## Network Setup

### Option 1: Windows Mobile Hotspot (Recommended for Presentation)

This creates a WiFi network that others can join.

#### Step 1: Enable Mobile Hotspot

```powershell
# Via Settings UI:
# 1. Press Win + I (opens Settings)
# 2. Go to: Network & Internet → Mobile hotspot
# 3. Configure settings:
```

**Hotspot Configuration:**

- **Share my Internet connection from:** WiFi (or Ethernet if available)
- **Share over:** WiFi
- **Network name (SSID):** `ExamTrack-Demo` (or your choice)
- **Network password:** Set a strong password (min 8 characters)
- **Network band:** 2.4 GHz (better range) or 5 GHz (faster speed)
- Toggle switch to **On**

#### Step 2: Find Your IP Address

```powershell
ipconfig
```

Look for section: **Wireless LAN adapter Local Area Connection\***

Example output:

```
Wireless LAN adapter Local Area Connection* 2:

   Connection-specific DNS Suffix  . :
   Link-local IPv6 Address . . . . . : fe80::xxxx:xxxx:xxxx:xxxx%17
   IPv4 Address. . . . . . . . . . . : 192.168.137.1    <-- THIS IS YOUR IP
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Default Gateway . . . . . . . . . :
```

**Write down your IPv4 Address!** You'll need it throughout the setup.

> **Common IPs for Windows Hotspot:**
>
> - `192.168.137.1` (most common)
> - `192.168.173.1` (alternative)

#### Step 3: Configure Windows Firewall

Allow incoming connections to your services:

```powershell
# Open PowerShell as Administrator
# Right-click PowerShell → Run as Administrator

# Allow Backend API (Port 5000)
New-NetFirewallRule -DisplayName "ExamTrack Backend API" `
    -Direction Inbound `
    -LocalPort 5000 `
    -Protocol TCP `
    -Action Allow

# Allow Web Dashboard (Port 80)
New-NetFirewallRule -DisplayName "ExamTrack Web Dashboard" `
    -Direction Inbound `
    -LocalPort 80 `
    -Protocol TCP `
    -Action Allow

# Allow APK Download Server (Port 8080)
New-NetFirewallRule -DisplayName "ExamTrack APK Download" `
    -Direction Inbound `
    -LocalPort 8080 `
    -Protocol TCP `
    -Action Allow

# Verify rules were created
Get-NetFirewallRule -DisplayName "ExamTrack*" | Select-Object DisplayName, Enabled
```

Expected output:

```
DisplayName                    Enabled
-----------                    -------
ExamTrack Backend API         True
ExamTrack Web Dashboard       True
ExamTrack APK Download        True
```

#### Step 4: Test Network Connectivity

From your computer:

```powershell
# Test if ports are listening (after starting servers)
netstat -ano | findstr :5000
netstat -ano | findstr :80
netstat -ano | findstr :8080
```

From another device connected to your hotspot:

```
# Open browser and try:
http://192.168.137.1
# Should show a page (after servers are running)
```

### Option 2: Campus LAN / Existing Network

If deploying on school network instead of hotspot:

#### Step 1: Get Network Information

Contact your school IT department:

- Request a **static IP address** for your computer
- Get **subnet mask** and **gateway** information
- Ensure ports 80, 5000, 8080 are not blocked by network firewall

#### Step 2: Configure Static IP

```powershell
# Via Control Panel:
# 1. Control Panel → Network and Sharing Center
# 2. Click your network adapter → Properties
# 3. Select "Internet Protocol Version 4 (TCP/IPv4)" → Properties
# 4. Select "Use the following IP address"
# 5. Enter:
#    - IP address: (provided by IT, e.g., 192.168.1.100)
#    - Subnet mask: (e.g., 255.255.255.0)
#    - Default gateway: (e.g., 192.168.1.1)
#    - Preferred DNS: (e.g., 8.8.8.8)
# 6. Click OK
```

#### Step 3: Configure Firewall (Same as Option 1)

Run the firewall commands from Option 1, Step 3.

#### Step 4: Router Port Forwarding (If Behind Router)

If your PC is behind a router:

```
1. Access router admin panel (usually http://192.168.1.1)
2. Login with admin credentials
3. Find "Port Forwarding" or "Virtual Servers" section
4. Add rules:
   - External Port 80 → Internal IP [Your PC IP] → Internal Port 80
   - External Port 5000 → Internal IP [Your PC IP] → Internal Port 5000
   - External Port 8080 → Internal IP [Your PC IP] → Internal Port 8080
5. Save settings
```

### Testing Network Setup

Run this test script after completing setup:

```powershell
# Save as test-network.ps1

Write-Host "🔍 Testing Network Configuration..." -ForegroundColor Cyan

# 1. Check IP Address
Write-Host "`n1️⃣ Your IP Address:" -ForegroundColor Yellow
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like "192.168.*"}).IPAddress
Write-Host "   $ip" -ForegroundColor Green

# 2. Check Firewall Rules
Write-Host "`n2️⃣ Firewall Rules:" -ForegroundColor Yellow
Get-NetFirewallRule -DisplayName "ExamTrack*" | Select-Object DisplayName, Enabled | Format-Table

# 3. Check if ports are available
Write-Host "`n3️⃣ Port Availability:" -ForegroundColor Yellow
$ports = @(80, 5000, 8080)
foreach ($port in $ports) {
    $result = Test-NetConnection -ComputerName localhost -Port $port -WarningAction SilentlyContinue
    if ($result.TcpTestSucceeded) {
        Write-Host "   Port $port`: IN USE (server running)" -ForegroundColor Green
    } else {
        Write-Host "   Port $port`: AVAILABLE (ready for server)" -ForegroundColor Yellow
    }
}

Write-Host "`n✅ Network configuration check complete!" -ForegroundColor Green
```

Run:

```powershell
.\test-network.ps1
```

---

## Database Setup

### Step 1: Start PostgreSQL Service

```powershell
# Check if PostgreSQL is running
Get-Service -Name postgresql*

# If not running, start it
Start-Service postgresql-x64-15

# Set to start automatically on boot (recommended)
Set-Service -Name postgresql-x64-15 -StartupType Automatic
```

### Step 2: Create Database

```powershell
# Open Command Prompt or PowerShell
cd "C:\Program Files\PostgreSQL\15\bin"

# Login to PostgreSQL (enter password when prompted)
.\psql -U postgres

# You're now in the PostgreSQL prompt (postgres=#)
```

In the PostgreSQL prompt:

```sql
-- Create the database
CREATE DATABASE examtrack;

-- Verify it was created
\l

-- Exit psql
\q
```

### Step 3: Configure Environment Variables

Create/edit `backend/.env` file:

```env
# Database Connection
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD_HERE@localhost:5432/examtrack"

# Server Configuration
PORT=5000
NODE_ENV=production
HOST=0.0.0.0

# JWT Secrets (GENERATE NEW ONES - see below)
JWT_SECRET=your_super_secret_jwt_key_here
REFRESH_TOKEN_SECRET=your_super_secret_refresh_token_key_here

# CORS Configuration (use YOUR IP address)
ALLOWED_ORIGINS=http://192.168.137.1,http://localhost,http://127.0.0.1

# File Upload Settings
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# Session Configuration
SESSION_SECRET=your_session_secret_here
```

**IMPORTANT: Generate Secure JWT Secrets**

Don't use the example values above! Generate your own:

```powershell
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Copy the output and paste as JWT_SECRET value

# Generate REFRESH_TOKEN_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Copy the output and paste as REFRESH_TOKEN_SECRET value

# Generate SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Copy the output and paste as SESSION_SECRET value
```

Example of generated secrets (yours will be different):

```env
JWT_SECRET=a3f5e8c9d2b4f6a8e1c3d5b7f9a2c4e6d8f0a3c5e7d9f2b4a6c8e0f3d5b7a9c1e3f5d7
REFRESH_TOKEN_SECRET=b4c6e8f0d2a4c6e8f1d3b5a7c9e1f3d5b7a9c2e4d6f8a0c3e5d7f9b2d4a6c8e0f2d4b6
SESSION_SECRET=c5d7e9f1a3c5e7d9f2b4a6c8e0f3d5b7
```

### Step 4: Install Dependencies

```powershell
cd backend
npm install
```

### Step 5: Run Database Migrations

```powershell
# Generate Prisma Client
npx prisma generate

# Run migrations to create tables
npx prisma migrate deploy
```

Expected output:

```
✔ Generated Prisma Client
Database migrations:
1 migration found in prisma/migrations
✔ Applied migration 20251202024757_init
✔ Applied migration 20251202220537_add_profile_picture_and_password_reset
✔ Applied migration 20251202235458_add_token_blacklist
```

### Step 6: Seed Database with Test Data

```powershell
npm run seed
```

This creates:

- **Super Admin User:**
  - Email: `admin@example.com`
  - Password: `Admin@123`
- **Sample Users:** 5 users with different roles
- **Sample Students:** 10 students with QR codes
- **Sample Exam Sessions:** 2 test exam sessions
- **Class Attendance User:**
  - Email: `attendance@examtrack.com`
  - Password: `Attendance@123`

**IMPORTANT:** Change the admin password after first login!

### Step 7: Verify Database Setup

```powershell
# Login to database
cd "C:\Program Files\PostgreSQL\15\bin"
.\psql -U postgres -d examtrack

# Check tables were created
\dt

# Check user count
SELECT COUNT(*) FROM "User";

# Check student count
SELECT COUNT(*) FROM "Student";

# Exit
\q
```

Expected tables:

```
 Schema |        Name         | Type  |  Owner
--------+---------------------+-------+----------
 public | AuditLog            | table | postgres
 public | BatchTransfer       | table | postgres
 public | BlacklistedToken    | table | postgres
 public | ExamAttendance      | table | postgres
 public | ExamSession         | table | postgres
 public | ExamSessionStudent  | table | postgres
 public | PasswordResetToken  | table | postgres
 public | RefreshToken        | table | postgres
 public | Student             | table | postgres
 public | User                | table | postgres
 public | AttendanceSession   | table | postgres
 public | ClassAttendanceRecord | table | postgres
 public | ClassAttendance     | table | postgres
```

---

## Backend Deployment

### Step 1: Update Server Configuration

The backend needs to listen on all network interfaces (not just localhost) so devices on your network can access it.

Edit `backend/src/server.ts` and find the `app.listen()` section:

**Before:**

```typescript
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

**After:**

```typescript
const PORT = process.env.PORT || 5000;
const HOST = "0.0.0.0"; // Listen on all network interfaces

app.listen(PORT, HOST, () => {
  const networkIP = "192.168.137.1"; // Replace with your actual IP
  console.log(`✅ Server running on http://${HOST}:${PORT}`);
  console.log(`🌐 Access from network: http://${networkIP}:${PORT}`);
  console.log(`🏠 Access from this PC: http://localhost:${PORT}`);
});
```

### Step 2: Update CORS Configuration

Ensure your server accepts requests from your network IP.

In `backend/src/server.ts`, find the CORS configuration:

```typescript
app.use(
  cors({
    origin: [
      "http://localhost",
      "http://localhost:5173", // Vite dev server
      "http://192.168.137.1", // Your network IP
      "http://192.168.137.1:5173",
    ],
    credentials: true,
  })
);
```

Or better, use environment variable from `.env`:

```typescript
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost"],
    credentials: true,
  })
);
```

### Step 3: Start Backend Server

You have three options for running the backend:

#### Option A: Development Mode (Simple, for Testing)

```powershell
cd backend
npm run dev
```

**Pros:**

- Quick to start
- Shows console logs
- Auto-restarts on code changes

**Cons:**

- Must keep terminal window open
- Stops when you close terminal
- Not suitable for long presentations

**Use for:** Quick testing and development

#### Option B: Using PM2 (Recommended for Presentation)

PM2 keeps your server running in the background and auto-restarts if it crashes.

```powershell
# Install PM2 globally (one-time)
npm install -g pm2

# Start backend with PM2
cd backend
pm2 start src/server.ts --name examtrack-backend --interpreter ts-node

# Useful PM2 commands:
pm2 status              # Check status
pm2 logs examtrack-backend  # View logs
pm2 restart examtrack-backend  # Restart
pm2 stop examtrack-backend     # Stop
pm2 delete examtrack-backend   # Remove from PM2

# Save PM2 configuration (so it remembers after restart)
pm2 save

# Make PM2 start on system boot
pm2 startup
# Follow the command it gives you (may require running as Admin)
```

**PM2 Configuration File (Optional but Recommended):**

Create `backend/ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: "examtrack-backend",
      script: "./src/server.ts",
      interpreter: "node",
      interpreter_args: "-r ts-node/register",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 5000,
        HOST: "0.0.0.0",
      },
      error_file: "./logs/error.log",
      out_file: "./logs/output.log",
      log_file: "./logs/combined.log",
      time: true,
      merge_logs: true,
    },
  ],
};
```

Then start with:

```powershell
pm2 start ecosystem.config.js
```

#### Option C: Using Windows Service (Advanced, for Permanent Deployment)

This runs the backend as a Windows service that starts automatically.

```powershell
# Install node-windows
npm install -g node-windows

# Create service installer script
```

Create `backend/install-service.js`:

```javascript
const Service = require("node-windows").Service;
const path = require("path");

// Create a new service object
const svc = new Service({
  name: "ExamTrack Backend",
  description: "ExamTrack Backend API Server for Exam Script Tracking",
  script: path.join(__dirname, "src", "server.ts"),
  nodeOptions: ["-r", "ts-node/register"],
  env: {
    name: "NODE_ENV",
    value: "production",
  },
});

// Listen for the "install" event
svc.on("install", function () {
  console.log("✅ Service installed successfully!");
  svc.start();
});

// Listen for the "alreadyinstalled" event
svc.on("alreadyinstalled", function () {
  console.log("⚠️ Service is already installed.");
});

// Listen for the "start" event
svc.on("start", function () {
  console.log("✅ Service started!");
  console.log("🌐 Backend running at http://192.168.137.1:5000");
});

// Install the service
svc.install();
```

Run installation (as Administrator):

```powershell
cd backend
node install-service.js
```

**To uninstall service later:**

Create `backend/uninstall-service.js`:

```javascript
const Service = require("node-windows").Service;
const path = require("path");

const svc = new Service({
  name: "ExamTrack Backend",
  script: path.join(__dirname, "src", "server.ts"),
});

svc.on("uninstall", function () {
  console.log("✅ Service uninstalled");
});

svc.uninstall();
```

### Step 4: Verify Backend is Running

**From your computer:**

```powershell
# Check if backend is listening
netstat -ano | findstr :5000

# Test health endpoint
curl http://localhost:5000/health
# Or open in browser: http://localhost:5000/health

# Test API endpoint
curl http://localhost:5000/api/health
```

Expected response:

```json
{
  "status": "ok",
  "timestamp": "2025-12-09T10:30:00.000Z",
  "database": "connected"
}
```

**From another device (connected to your hotspot):**

Open browser and go to:

```
http://192.168.137.1:5000/health
```

Should see the same JSON response.

### Step 5: Monitor Backend Logs

**If using npm run dev:**

- Logs appear in the terminal window

**If using PM2:**

```powershell
# View live logs
pm2 logs examtrack-backend

# View last 100 lines
pm2 logs examtrack-backend --lines 100

# Clear logs
pm2 flush
```

**If using Windows Service:**

- Logs are in the Windows Event Viewer
- Or configure logging to a file in your service script

### Common Backend Issues and Solutions

#### Issue: "Port 5000 is already in use"

**Solution:**

```powershell
# Find what's using port 5000
netstat -ano | findstr :5000

# Result will show PID (last column)
# Example: TCP  0.0.0.0:5000  0.0.0.0:0  LISTENING  12345

# Kill the process
taskkill /PID 12345 /F

# Or change port in .env file
# PORT=5001
```

#### Issue: "Database connection failed"

**Solution:**

```powershell
# Check if PostgreSQL is running
Get-Service postgresql*

# If stopped, start it
Start-Service postgresql-x64-15

# Test database connection
cd "C:\Program Files\PostgreSQL\15\bin"
.\psql -U postgres -d examtrack

# If password wrong, check .env file DATABASE_URL
```

#### Issue: "CORS error from frontend"

**Solution:**

- Verify your IP in CORS configuration matches actual IP
- Check `.env` file ALLOWED_ORIGINS includes your network IP
- Restart backend after changing CORS settings

---

## Web Dashboard Deployment

### Step 1: Update API Configuration

The web dashboard needs to know where your backend API is located.

Edit `web/.env.production`:

```env
# Backend API URL (use YOUR IP address)
VITE_API_URL=http://192.168.137.1:5000/api

# Socket.IO URL (use YOUR IP address)
VITE_SOCKET_URL=http://192.168.137.1:5000

# App Title
VITE_APP_TITLE=ExamTrack Dashboard
```

**CRITICAL:** Replace `192.168.137.1` with your actual IP address from `ipconfig`!

### Step 2: Build Web Dashboard for Production

```powershell
cd web

# Install dependencies (if not done)
npm install

# Build for production
npm run build
```

This creates a `web/dist` folder containing optimized static files:

```
web/dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── [other assets]
├── favicon.ico
└── [other files]
```

Build process takes 30-60 seconds and optimizes:

- Minifies JavaScript
- Minifies CSS
- Optimizes images
- Creates source maps
- Generates manifest

### Step 3: Serve Web Dashboard

You have three options:

#### Option A: Using http-server (Simplest)

```powershell
# Install http-server globally (one-time)
npm install -g http-server

# Navigate to build folder
cd web/dist

# Start server on port 80 (requires Admin privileges)
http-server -p 80 -a 0.0.0.0
```

**If you get "Permission denied" error:**

```powershell
# Right-click PowerShell → Run as Administrator
cd C:\Users\Dave\OneDrive\Documents\Projects\ExamScriptTracking\web\dist
http-server -p 80 -a 0.0.0.0
```

**Alternative: Use port 3000 (no admin required):**

```powershell
http-server -p 3000 -a 0.0.0.0
# Access at: http://192.168.137.1:3000
```

**Useful http-server options:**

```powershell
# With caching disabled (for development)
http-server -p 80 -a 0.0.0.0 -c-1

# With CORS enabled
http-server -p 80 -a 0.0.0.0 --cors

# Silent mode (less logs)
http-server -p 80 -a 0.0.0.0 -s
```

#### Option B: Using NGINX (More Powerful)

NGINX is a professional web server with better performance.

**Install NGINX for Windows:**

1. Download from: https://nginx.org/en/download.html
2. Download the Windows version (e.g., nginx-1.25.3.zip)
3. Extract to `C:\nginx`

**Configure NGINX:**

Edit `C:\nginx\conf\nginx.conf`:

```nginx
worker_processes 1;

events {
    worker_connections 1024;
}

http {
    include       mime.types;
    default_type  application/octet-stream;

    sendfile        on;
    keepalive_timeout  65;

    # Gzip compression
    gzip  on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    server {
        listen       80;
        server_name  192.168.137.1 localhost;

        # Web Dashboard
        location / {
            root   C:/Users/Dave/OneDrive/Documents/Projects/ExamScriptTracking/web/dist;
            index  index.html;
            try_files $uri $uri/ /index.html;  # SPA routing
        }

        # Mobile APK Download
        location /download {
            alias   C:/ExamTrack-Download/;
            autoindex on;
            add_header Content-Disposition 'attachment';
        }

        # Proxy API requests to backend
        location /api {
            proxy_pass http://localhost:5000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_cache_bypass $http_upgrade;
        }

        # Proxy Socket.IO
        location /socket.io {
            proxy_pass http://localhost:5000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "Upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # Error pages
        error_page   500 502 503 504  /50x.html;
        location = /50x.html {
            root   html;
        }
    }
}
```

**Start NGINX:**

```powershell
cd C:\nginx

# Start NGINX
start nginx

# Or run in foreground (to see logs)
nginx

# Reload configuration (after changes)
nginx -s reload

# Stop NGINX gracefully
nginx -s quit

# Stop NGINX immediately
nginx -s stop

# Test configuration
nginx -t
```

**NGINX as Windows Service:**

```powershell
# Download NSSM (Non-Sucking Service Manager)
# From: https://nssm.cc/download

# Install NGINX as service
nssm install nginx "C:\nginx\nginx.exe"
nssm set nginx AppDirectory "C:\nginx"
nssm start nginx

# Set to start automatically
nssm set nginx Start SERVICE_AUTO_START
```

#### Option C: Using Vite Dev Server (Only for Development)

**Not recommended for presentation**, but useful for development:

```powershell
cd web
npm run dev -- --host 0.0.0.0
# Access at: http://192.168.137.1:5173
```

### Step 4: Verify Web Dashboard

**From your computer:**

Open browser:

```
http://localhost
# Or
http://192.168.137.1
```

You should see the ExamTrack login page.

**From another device (on your hotspot):**

Open browser:

```
http://192.168.137.1
```

Should see the same login page.

**Test login:**

- Email: `admin@example.com`
- Password: `Admin@123`

### Step 5: Create Download Landing Page

Users need an easy way to get the mobile APK. Let's create a download page.

Create `web/dist/download.html`:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Download ExamTrack Mobile App</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      body {
        font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
      }
      .container {
        background: white;
        padding: 3rem;
        border-radius: 20px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        text-align: center;
        max-width: 600px;
        width: 100%;
      }
      .logo {
        font-size: 5rem;
        margin-bottom: 1rem;
        animation: bounce 2s infinite;
      }
      @keyframes bounce {
        0%,
        100% {
          transform: translateY(0);
        }
        50% {
          transform: translateY(-10px);
        }
      }
      h1 {
        color: #333;
        margin-bottom: 0.5rem;
        font-size: 2rem;
      }
      .subtitle {
        color: #666;
        margin-bottom: 2rem;
        font-size: 1.1rem;
      }
      p {
        color: #666;
        margin-bottom: 2rem;
        line-height: 1.6;
      }
      .btn {
        display: inline-block;
        background: #667eea;
        color: white;
        padding: 1.2rem 3rem;
        border-radius: 50px;
        text-decoration: none;
        font-size: 1.3rem;
        font-weight: bold;
        transition: all 0.3s;
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        margin: 10px;
      }
      .btn:hover {
        background: #764ba2;
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
      }
      .btn-secondary {
        background: #48bb78;
      }
      .btn-secondary:hover {
        background: #38a169;
      }
      .instructions {
        background: #fff3cd;
        border: 1px solid #ffc107;
        border-left: 4px solid #ffc107;
        border-radius: 10px;
        padding: 1.5rem;
        margin-top: 2rem;
        text-align: left;
      }
      .instructions h3 {
        color: #856404;
        margin-bottom: 1rem;
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .instructions ol {
        margin-left: 1.5rem;
        color: #856404;
      }
      .instructions li {
        margin-bottom: 0.5rem;
      }
      .web-link {
        margin-top: 2rem;
        padding: 1.5rem;
        background: #e6f3ff;
        border-radius: 10px;
        border: 1px solid #3b82f6;
      }
      .web-link a {
        color: #3b82f6;
        text-decoration: none;
        font-weight: bold;
        font-size: 1.1rem;
      }
      .web-link a:hover {
        text-decoration: underline;
      }
      .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin-top: 2rem;
      }
      .info-card {
        background: #f8f9fa;
        padding: 1rem;
        border-radius: 10px;
        border: 1px solid #e9ecef;
      }
      .info-card strong {
        display: block;
        color: #667eea;
        margin-bottom: 0.5rem;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="logo">📱</div>
      <h1>ExamTrack Mobile App</h1>
      <p class="subtitle">
        Scan QR Codes · Record Attendance · Manage Transfers
      </p>

      <p>
        Download the ExamTrack mobile app for handlers to manage exam scripts,
        record student attendance, and track custody transfers on the go.
      </p>

      <div>
        <a href="http://192.168.137.1:8080/ExamTrack.apk" class="btn" download>
          📥 Download APK (Android)
        </a>
      </div>

      <div class="web-link">
        <strong>👨‍💼 Administrators & Staff</strong><br />
        Access the full web dashboard with analytics and reporting<br />
        <a href="http://192.168.137.1">🌐 Open Web Dashboard →</a>
      </div>

      <div class="info-grid">
        <div class="info-card">
          <strong>📱 Requirements</strong>
          Android 6.0 or higher<br />
          50 MB storage
        </div>
        <div class="info-card">
          <strong>🔒 Permissions</strong>
          Camera (QR scanning)<br />
          Storage (photos)
        </div>
        <div class="info-card">
          <strong>📶 Network</strong>
          Connect to:<br />
          <code>ExamTrack-Demo</code>
        </div>
      </div>

      <div class="instructions">
        <h3>
          <span>⚠️</span>
          <span>Installation Instructions</span>
        </h3>
        <ol>
          <li>
            <strong>Enable Unknown Sources:</strong> Go to Settings → Security →
            Enable "Install Unknown Apps" or "Unknown Sources"
          </li>
          <li>
            <strong>Download APK:</strong> Click the download button above
          </li>
          <li>
            <strong>Open Downloaded File:</strong> Find the APK in your
            Downloads folder
          </li>
          <li>
            <strong>Install:</strong> Tap "Install" and wait for completion
          </li>
          <li>
            <strong>Open App:</strong> Tap "Open" or find ExamTrack in your app
            drawer
          </li>
          <li>
            <strong>Login:</strong> Use credentials provided by your
            administrator
          </li>
        </ol>
      </div>
    </div>
  </body>
</html>
```

**Update the IP address in the HTML file to match yours!**

Access the download page at:

```
http://192.168.137.1/download.html
```

---

## Mobile App Deployment

### Overview

You have two main approaches to build the mobile app:

1. **Cloud Build (EAS Build)** - Easier but requires Expo account
2. **Local Build (Gradle)** - More complex but no external dependencies

Both produce an APK file that you'll host on your computer for download.

### Option A: Cloud Build with EAS (Recommended)

#### Step 1: Install EAS CLI

```powershell
npm install -g eas-cli
```

#### Step 2: Login to Expo

```powershell
eas login
```

If you don't have an account:

```powershell
eas register
```

#### Step 3: Configure Mobile App

Edit `mobile/.env.production`:

```env
# Backend API URL (use YOUR IP address!)
EXPO_PUBLIC_API_URL=http://192.168.137.1:5000/api

# Socket.IO URL
EXPO_PUBLIC_SOCKET_URL=http://192.168.137.1:5000

# App Environment
EXPO_PUBLIC_ENV=production
```

**CRITICAL:** Replace `192.168.137.1` with your actual IP!

#### Step 4: Configure EAS Build

Check `mobile/eas.json` exists and has APK build config:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

#### Step 5: Build APK

```powershell
cd mobile

# Build production APK
eas build --platform android --profile production

# Or build preview APK (faster, good for testing)
eas build --platform android --profile preview
```

The build process:

1. Uploads your code to EAS servers
2. Builds the APK in the cloud (10-15 minutes)
3. Provides download link when complete

**Example output:**

```
✔ Build complete!
  https://expo.dev/accounts/yourname/projects/examtrack/builds/abc123

  Download: https://expo.dev/artifacts/eas/abc123.apk
```

#### Step 6: Download the APK

Click the download link in the terminal or:

```powershell
# Download using curl (if available)
curl -L "https://expo.dev/artifacts/eas/abc123.apk" -o ExamTrack.apk

# Or download using browser and save as ExamTrack.apk
```

### Option B: Local Build with Gradle (Advanced)

This builds the APK directly on your computer without cloud services.

#### Step 1: Install Prerequisites

1. **Java Development Kit (JDK) 17:**

   - Download from: https://adoptium.net/
   - Install and verify:

   ```powershell
   java -version
   # Should show: openjdk version "17.x.x"
   ```

2. **Android Studio** (for Android SDK):

   - Download from: https://developer.android.com/studio
   - Install with default settings
   - Open Android Studio → More Actions → SDK Manager
   - Install:
     - Android SDK Platform 34
     - Android SDK Build-Tools 34.0.0
     - Android SDK Command-line Tools

3. **Set Environment Variables:**

   ```powershell
   # Add to System Environment Variables
   ANDROID_HOME=C:\Users\YourName\AppData\Local\Android\Sdk
   JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.9.9-hotspot

   # Add to PATH:
   %ANDROID_HOME%\platform-tools
   %ANDROID_HOME%\tools
   %JAVA_HOME%\bin
   ```

   Verify:

   ```powershell
   $env:ANDROID_HOME
   adb --version
   java -version
   ```

#### Step 2: Configure Mobile App

Same as Option A - update `mobile/.env.production` with your IP.

#### Step 3: Generate Android Project

```powershell
cd mobile

# Install dependencies
npm install

# Pre-build to generate android folder (if not exists)
npx expo prebuild --platform android
```

This creates/updates `mobile/android/` folder with native Android code.

#### Step 4: Create Keystore for Signing

Android requires APKs to be signed. Create a keystore:

```powershell
cd mobile/android/app

# Generate keystore
keytool -genkeypair -v -storetype PKCS12 `
  -keystore examtrack-release.keystore `
  -alias examtrack `
  -keyalg RSA `
  -keysize 2048 `
  -validity 10000 `
  -dname "CN=ExamTrack, OU=IT, O=School, L=City, S=State, C=Country"
```

**When prompted:**

- Keystore password: Choose a strong password (e.g., `ExamTrack2025!`)
- Key password: Press Enter to use same password

**IMPORTANT:** Save this keystore file and remember the password! Without it, you can't update the app later.

#### Step 5: Configure Gradle Signing

Create `mobile/android/gradle.properties` (or update if exists):

```properties
# Keystore configuration
EXAMTRACK_UPLOAD_STORE_FILE=examtrack-release.keystore
EXAMTRACK_UPLOAD_KEY_ALIAS=examtrack
EXAMTRACK_UPLOAD_STORE_PASSWORD=ExamTrack2025!
EXAMTRACK_UPLOAD_KEY_PASSWORD=ExamTrack2025!
```

Update `mobile/android/app/build.gradle` to use the keystore:

Find the `android { ... }` section and add:

```gradle
android {
    // ... existing config

    signingConfigs {
        release {
            if (project.hasProperty('EXAMTRACK_UPLOAD_STORE_FILE')) {
                storeFile file(EXAMTRACK_UPLOAD_STORE_FILE)
                storePassword EXAMTRACK_UPLOAD_STORE_PASSWORD
                keyAlias EXAMTRACK_UPLOAD_KEY_ALIAS
                keyPassword EXAMTRACK_UPLOAD_KEY_PASSWORD
            }
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            // ... existing release config
        }
    }
}
```

#### Step 6: Build APK

```powershell
cd mobile/android

# Clean previous builds
.\gradlew clean

# Build release APK
.\gradlew assembleRelease

# This takes 5-10 minutes on first build
```

**Output location:**

```
mobile/android/app/build/outputs/apk/release/app-release.apk
```

#### Step 7: Rename and Copy APK

```powershell
# Copy to easier location
Copy-Item `
  mobile/android/app/build/outputs/apk/release/app-release.apk `
  C:/ExamTrack-Download/ExamTrack.apk
```

### Step 8: Host APK for Download

Create a folder for downloads and use http-server:

```powershell
# Create download folder
New-Item -Path C:/ExamTrack-Download -ItemType Directory -Force

# Copy APK there
Copy-Item [your-apk-location] C:/ExamTrack-Download/ExamTrack.apk

# Start HTTP server on port 8080 (requires Admin)
cd C:/ExamTrack-Download
http-server -p 8080 -a 0.0.0.0 --cors
```

**Alternative: Serve via NGINX**

If you're using NGINX for the web dashboard, add this to `nginx.conf`:

```nginx
# Inside the server { ... } block:
location /apk {
    alias C:/ExamTrack-Download/;
    autoindex on;
    add_header Content-Disposition 'attachment; filename="ExamTrack.apk"';
    add_header Content-Type 'application/vnd.android.package-archive';
}
```

Then reload NGINX:

```powershell
nginx -s reload
```

APK available at: `http://192.168.137.1/apk/ExamTrack.apk`

### Step 9: Update Download Page

Update the download link in `web/dist/download.html`:

**If using http-server:**

```html
<a href="http://192.168.137.1:8080/ExamTrack.apk" class="btn" download>
  📥 Download APK (Android)
</a>
```

**If using NGINX:**

```html
<a href="http://192.168.137.1/apk/ExamTrack.apk" class="btn" download>
  📥 Download APK (Android)
</a>
```

### Step 10: Test APK Installation

**On an Android device connected to your hotspot:**

1. Open browser and go to: `http://192.168.137.1/download.html`
2. Click "Download APK"
3. Open the downloaded file
4. If prompted about "Install Unknown Apps":
   - Settings → Security → Unknown Sources → Enable
5. Tap "Install"
6. Open the app
7. It should connect to your backend at `http://192.168.137.1:5000`

### Common Mobile Build Issues

#### Issue: "Could not determine Java version"

**Solution:**

```powershell
# Verify JAVA_HOME
$env:JAVA_HOME
java -version

# Should show Java 17

# If not, set it:
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.9.9-hotspot"
```

#### Issue: "SDK location not found"

**Solution:**
Create `mobile/android/local.properties`:

```properties
sdk.dir=C:\\Users\\YourName\\AppData\\Local\\Android\\Sdk
```

#### Issue: "Build failed: ENOSPC"

**Solution:**

```powershell
# Increase Node memory
$env:NODE_OPTIONS="--max-old-space-size=4096"

# Then rebuild
.\gradlew assembleRelease
```

#### Issue: "APK won't install on device"

**Solution:**

- Check Android version (minimum 6.0 required)
- Enable "Unknown Sources" in Settings
- Uninstall old version first if exists
- Check if device storage is full

#### Issue: "App crashes on startup"

**Solution:**

- Check if backend is running and accessible
- Verify IP address in `.env.production` matches your actual IP
- Check mobile app logs:
  ```powershell
  # Connect device via USB
  adb logcat *:E
  ```

---

## Testing & Verification

### Pre-Deployment Checklist

Before your presentation, verify EVERYTHING works:

#### 1. Network Connectivity Test

**Start your hotspot:**

```powershell
# Windows Settings → Network & Internet → Mobile Hotspot
# Enable and note the SSID and password
```

**Test from another device:**

```powershell
# On the connected device, open browser:
http://192.168.137.1/health
http://192.168.137.1:5000/health

# Should return JSON with status: "ok"
```

#### 2. Database Test

```powershell
cd backend

# Check connection
npm run prisma studio

# Verify test data exists:
# - Admin user (admin@example.com)
# - Attendance user (attendance@examtrack.com)
# - Sample exam sessions
# - Sample students
```

#### 3. Backend API Test

```powershell
# Health check
curl http://192.168.137.1:5000/health

# Test login API
curl -X POST http://192.168.137.1:5000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"admin@example.com","password":"Admin@123"}'

# Should return token
```

#### 4. Web Dashboard Test

**From your PC:**

```
http://localhost
http://192.168.137.1
```

**From another device:**

```
http://192.168.137.1
```

**Test login:**

- Email: `admin@example.com`
- Password: `Admin@123`

**Verify all pages work:**

- ✅ Dashboard (shows statistics)
- ✅ Exam Sessions (lists sessions)
- ✅ Students (shows student list)
- ✅ Handlers (shows handler list)
- ✅ Reports (shows filters and export)
- ✅ Users (admin management)
- ✅ Class Attendance (lists classes and sessions)

#### 5. Mobile App Test

**Install APK on test device:**

```
http://192.168.137.1/download.html
```

**Test login:**

- Email: `attendance@examtrack.com`
- Password: `Attendance@123`

**Test features:**

- ✅ Login/Logout
- ✅ Dashboard shows exam sessions
- ✅ QR code scanning works
- ✅ Script tracking records work
- ✅ Transfer initiation works
- ✅ Class attendance recording works
- ✅ Real-time updates (test with web dashboard open)

#### 6. Real-Time Sync Test

**Setup:**

1. Open web dashboard on your PC
2. Open mobile app on test device
3. Login to both

**Test:**

1. **Mobile:** Record attendance for a student
2. **Web:** Should see attendance appear immediately (no refresh needed)
3. **Mobile:** Initiate a batch transfer
4. **Web:** Should see transfer appear in pending transfers
5. **Web:** Confirm the transfer
6. **Mobile:** Should see notification

#### 7. Performance Test

**Load testing:**

```powershell
# Simulate multiple API requests
for ($i=0; $i -lt 50; $i++) {
    curl http://192.168.137.1:5000/api/exam-sessions
}

# Check if backend responds quickly
# Expected: <100ms per request
```

**Check system resources:**

```powershell
# Open Task Manager (Ctrl+Shift+Esc)
# Monitor while using app:
# - CPU: Should stay under 50%
# - RAM: Should stay under 4GB
# - Network: Should show activity
```

---

## Presentation Day Checklist

### Day Before

- [ ] Full system test with checklist above
- [ ] Charge laptop fully
- [ ] Prepare backup laptop (optional)
- [ ] Download APK to USB drive (backup)
- [ ] Note down all credentials
- [ ] Test with 3+ devices simultaneously
- [ ] Prepare demo script/flow

### Morning Of

- [ ] Start laptop early
- [ ] Enable Windows Mobile Hotspot
- [ ] Note hotspot SSID and password
- [ ] Start PostgreSQL service
- [ ] Start backend (PM2 or service)
- [ ] Start web server (http-server or NGINX)
- [ ] Start APK server (if separate)
- [ ] Verify all services running

### Quick Start Script

Create `start-all.ps1`:

```powershell
# ExamTrack Quick Start Script
# Run as Administrator

Write-Host "🚀 Starting ExamTrack System..." -ForegroundColor Green

# 1. Start PostgreSQL
Write-Host "📊 Starting PostgreSQL..." -ForegroundColor Yellow
Start-Service postgresql-x64-15
Start-Sleep -Seconds 3

# 2. Start Backend
Write-Host "🔧 Starting Backend..." -ForegroundColor Yellow
cd C:\Users\Dave\OneDrive\Documents\Projects\ExamScriptTracking\backend
pm2 start ecosystem.config.js
Start-Sleep -Seconds 3

# 3. Start Web Server
Write-Host "🌐 Starting Web Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-Command", "cd C:\Users\Dave\OneDrive\Documents\Projects\ExamScriptTracking\web\dist; http-server -p 80 -a 0.0.0.0"
Start-Sleep -Seconds 2

# 4. Start APK Server
Write-Host "📱 Starting APK Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-Command", "cd C:\ExamTrack-Download; http-server -p 8080 -a 0.0.0.0"
Start-Sleep -Seconds 2

# 5. Get Network Info
Write-Host "`n✅ All Services Started!" -ForegroundColor Green
Write-Host "`n📱 Mobile Hotspot Information:" -ForegroundColor Cyan
Get-NetAdapter | Where-Object {$_.Status -eq "Up"} | Select-Object Name, Status, LinkSpeed

Write-Host "`n🌐 Access URLs:" -ForegroundColor Cyan
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like "192.168.*"}).IPAddress
Write-Host "   Web Dashboard: http://$ip"
Write-Host "   Backend API:   http://$ip:5000"
Write-Host "   APK Download:  http://$ip:8080/ExamTrack.apk"
Write-Host "   Download Page: http://$ip/download.html"

Write-Host "`n🔐 Test Credentials:" -ForegroundColor Cyan
Write-Host "   Admin:     admin@example.com / Admin@123"
Write-Host "   Attendance: attendance@examtrack.com / Attendance@123"

Write-Host "`n📝 Service Status:" -ForegroundColor Cyan
pm2 status

Write-Host "`nPress any key to check service health..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Health checks
Write-Host "`n🏥 Health Checks:" -ForegroundColor Cyan
Write-Host "Backend API:"
curl http://localhost:5000/health

Write-Host "`nAll systems ready! 🎉" -ForegroundColor Green
```

**Run it:**

```powershell
# Right-click PowerShell → Run as Administrator
.\start-all.ps1
```

### During Presentation

**Have these open:**

- Web dashboard (admin view)
- 2-3 mobile devices (handler view)
- Task Manager (show it's running locally)
- PowerShell with logs (shows real-time activity)

**Demo flow:**

1. Show network setup (hotspot settings)
2. Show attendees how to connect to WiFi
3. Navigate to download page on their devices
4. Install APK (pre-installed on demo devices)
5. Login with handler credentials
6. Admin creates exam session (web)
7. Handlers see it appear (mobile - real-time)
8. Record attendance (mobile)
9. Show it appear on web dashboard
10. Initiate transfer (mobile)
11. Confirm transfer (web)
12. Show analytics and reports

### Shutdown Script

Create `stop-all.ps1`:

```powershell
# ExamTrack Shutdown Script
# Run as Administrator

Write-Host "🛑 Stopping ExamTrack System..." -ForegroundColor Yellow

# Stop PM2 processes
Write-Host "Stopping Backend..." -ForegroundColor Yellow
pm2 stop all

# Find and kill http-server processes
Write-Host "Stopping Web Servers..." -ForegroundColor Yellow
Get-Process -Name "node" | Where-Object {$_.Path -like "*http-server*"} | Stop-Process -Force

Write-Host "`n✅ All services stopped!" -ForegroundColor Green
Write-Host "PostgreSQL is still running (use 'Stop-Service postgresql-x64-15' to stop)"
```

---

## Troubleshooting

### Services Not Starting

#### PostgreSQL won't start

```powershell
# Check service status
Get-Service postgresql*

# Check logs
Get-Content "C:\Program Files\PostgreSQL\15\data\log\postgresql-*.log" -Tail 50

# Common fix: Port 5432 in use
netstat -ano | findstr :5432
# Kill the process using the PID shown

# Restart service
Restart-Service postgresql-x64-15
```

#### Backend API not responding

```powershell
# Check if running
pm2 status

# Check logs
pm2 logs examtrack-backend --lines 50

# Common issues:
# 1. Database not connected - check DATABASE_URL in .env
# 2. Port 5000 in use - check: netstat -ano | findstr :5000
# 3. Environment variables not loaded - restart PM2

# Restart backend
pm2 restart examtrack-backend
```

#### Web server not accessible

```powershell
# Check if http-server is running
Get-Process -Name "node"

# Check if port 80 is open
netstat -ano | findstr :80

# Check firewall
Get-NetFirewallRule -DisplayName "*ExamTrack*"

# Restart web server (as Admin)
cd C:\Users\Dave\OneDrive\Documents\Projects\ExamScriptTracking\web\dist
http-server -p 80 -a 0.0.0.0
```

### Network Issues

#### Can't connect from other devices

```powershell
# 1. Check hotspot is enabled
# Windows Settings → Mobile Hotspot

# 2. Check firewall rules
Get-NetFirewallRule -DisplayName "ExamTrack*"

# 3. Verify IP address
ipconfig | findstr "192.168"

# 4. Test connectivity from device
# On device browser: http://192.168.137.1/health

# 5. Check if Windows Firewall is blocking
# Control Panel → Windows Defender Firewall
# → Allow an app → Ensure Node.js is allowed for Public networks
```

#### IP address changed

Your hotspot IP might change. Update all configs:

```powershell
# 1. Find new IP
ipconfig

# 2. Update backend .env
# Edit: ALLOWED_ORIGINS

# 3. Rebuild web
cd web
# Update .env.production
npm run build

# 4. Rebuild mobile
cd mobile
# Update .env.production
# Rebuild APK

# 5. Restart all services
pm2 restart all
```

### Mobile App Issues

#### App won't install

**Solution:**

- Enable "Unknown Sources" (Settings → Security)
- Check Android version (6.0+ required)
- Check storage space
- Download APK again (might be corrupted)

#### App crashes on launch

**Solution:**

```powershell
# Check device logs (connect via USB)
adb devices
adb logcat *:E

# Common causes:
# 1. Wrong backend IP in .env.production
# 2. Backend not accessible from device
# 3. Missing permissions (camera, storage)
```

#### App can't connect to backend

**Solution:**

1. Test backend from device browser: `http://192.168.137.1:5000/health`
2. If fails, check firewall and network
3. If succeeds, check app `.env.production` has correct IP
4. Rebuild APK with correct IP

#### QR code scanning doesn't work

**Solution:**

- Grant camera permission (Settings → Apps → ExamTrack → Permissions)
- Ensure good lighting
- Try restarting app
- Check if camera works in other apps

### Performance Issues

#### System running slow

```powershell
# Check resource usage
Get-Process | Sort-Object CPU -Descending | Select-Object -First 10

# Check database size
cd "C:\Program Files\PostgreSQL\15\bin"
.\psql -U postgres -d examtrack -c "SELECT pg_size_pretty(pg_database_size('examtrack'));"

# Optimize database
.\psql -U postgres -d examtrack -c "VACUUM ANALYZE;"

# Check PM2 memory
pm2 status

# If backend using too much memory, restart
pm2 restart examtrack-backend
```

#### Many simultaneous users

**Current setup handles:** 20-30 simultaneous users comfortably

**If you need more:**

- Increase Node.js memory: `NODE_OPTIONS=--max-old-space-size=4096`
- Use NGINX instead of http-server
- Configure PM2 cluster mode
- Optimize PostgreSQL settings

### Database Issues

#### Database locked / can't connect

```powershell
# Check active connections
cd "C:\Program Files\PostgreSQL\15\bin"
.\psql -U postgres -d examtrack -c "SELECT * FROM pg_stat_activity;"

# Kill connections
.\psql -U postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='examtrack';"

# Restart PostgreSQL
Restart-Service postgresql-x64-15
```

#### Lost admin password

```powershell
# Reset admin password
cd backend
npx prisma studio

# Or via SQL
cd "C:\Program Files\PostgreSQL\15\bin"
.\psql -U postgres -d examtrack

# Hash the password first (use bcrypt)
# Then update: UPDATE "User" SET password='$2b$10$...' WHERE email='admin@example.com';
```

### Emergency Recovery

#### Complete system reset

```powershell
# Stop all services
pm2 stop all
Stop-Service postgresql-x64-15

# Backup database
cd "C:\Program Files\PostgreSQL\15\bin"
.\pg_dump -U postgres -d examtrack > C:\backup-examtrack.sql

# Drop and recreate database
.\psql -U postgres -c "DROP DATABASE examtrack;"
.\psql -U postgres -c "CREATE DATABASE examtrack;"

# Run migrations
cd C:\Users\Dave\OneDrive\Documents\Projects\ExamScriptTracking\backend
npm run prisma:migrate

# Seed data
npm run seed

# Start services
Start-Service postgresql-x64-15
pm2 restart all
```

---

## Quick Reference Card

**Print this and keep it handy during presentation:**

```
╔══════════════════════════════════════════════════════════════╗
║                    EXAMTRACK QUICK REFERENCE                  ║
╠══════════════════════════════════════════════════════════════╣
║ NETWORK                                                       ║
║  Hotspot SSID: ExamTrack-Demo                                ║
║  Password: [Your Password]                                    ║
║  Your IP: 192.168.137.1                                      ║
║                                                              ║
║ ACCESS URLS                                                  ║
║  📱 Download Page:  http://192.168.137.1/download.html       ║
║  🌐 Web Dashboard:  http://192.168.137.1                     ║
║  🔧 Backend API:    http://192.168.137.1:5000                ║
║  📥 APK Download:   http://192.168.137.1:8080/ExamTrack.apk  ║
║                                                              ║
║ CREDENTIALS                                                  ║
║  👨‍💼 Admin:                                                   ║
║     Email: admin@example.com                                 ║
║     Password: Admin@123                                      ║
║                                                              ║
║  📱 Handler/Attendance:                                       ║
║     Email: attendance@examtrack.com                          ║
║     Password: Attendance@123                                 ║
║                                                              ║
║ QUICK COMMANDS                                               ║
║  Start All:    .\start-all.ps1                              ║
║  Stop All:     .\stop-all.ps1                               ║
║  View Logs:    pm2 logs                                     ║
║  Check Status: pm2 status                                   ║
║                                                              ║
║ EMERGENCY CONTACTS                                           ║
║  Your Phone: [Your Number]                                   ║
║  IT Support: [Support Number]                                ║
╚══════════════════════════════════════════════════════════════╝
```

---

## Appendix: Advanced Configuration

### A. Using NGINX as Reverse Proxy

Full NGINX configuration combining everything:

```nginx
# C:\nginx\conf\nginx.conf

worker_processes  1;

events {
    worker_connections  1024;
}

http {
    include       mime.types;
    default_type  application/octet-stream;

    sendfile        on;
    keepalive_timeout  65;

    gzip  on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    upstream backend {
        server 127.0.0.1:5000;
    }

    server {
        listen       80;
        server_name  192.168.137.1 localhost;

        # Web Dashboard
        location / {
            root   C:/Users/Dave/OneDrive/Documents/Projects/ExamScriptTracking/web/dist;
            index  index.html;
            try_files $uri $uri/ /index.html;
        }

        # Download page
        location = /download.html {
            root   C:/Users/Dave/OneDrive/Documents/Projects/ExamScriptTracking/web/dist;
        }

        # APK Downloads
        location /apk {
            alias   C:/ExamTrack-Download/;
            autoindex on;
            add_header Content-Disposition 'attachment; filename="ExamTrack.apk"';
        }

        # Backend API
        location /api {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_cache_bypass $http_upgrade;
        }

        # Socket.IO
        location /socket.io {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "Upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # Health check
        location /health {
            proxy_pass http://backend/health;
        }
    }
}
```

### B. PM2 Ecosystem File (Full)

```javascript
// backend/ecosystem.config.js

module.exports = {
  apps: [
    {
      name: "examtrack-backend",
      script: "./src/server.ts",
      interpreter: "node",
      interpreter_args: "-r ts-node/register",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 5000,
        HOST: "0.0.0.0",
      },
      error_file: "./logs/error.log",
      out_file: "./logs/output.log",
      log_file: "./logs/combined.log",
      time: true,
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",

      // Restart on high memory
      max_restarts: 10,
      min_uptime: "10s",

      // Cron restart (optional - restart daily at 3 AM)
      cron_restart: "0 3 * * *",
    },
  ],
};
```

### C. Database Backup Script

Create `backup-database.ps1`:

```powershell
# Database Backup Script
# Schedule this to run daily

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm"
$backupDir = "C:\ExamTrack-Backups"
$backupFile = "$backupDir\examtrack-$timestamp.sql"

# Create backup directory if not exists
New-Item -ItemType Directory -Force -Path $backupDir

# Run backup
cd "C:\Program Files\PostgreSQL\15\bin"
.\pg_dump -U postgres -d examtrack -f $backupFile

Write-Host "✅ Backup created: $backupFile"

# Keep only last 7 days of backups
Get-ChildItem $backupDir -Filter "examtrack-*.sql" |
  Sort-Object CreationTime -Descending |
  Select-Object -Skip 7 |
  Remove-Item -Force

Write-Host "✅ Old backups cleaned up"
```

Schedule it:

```powershell
# Run as Administrator
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-File C:\path\to\backup-database.ps1"
$trigger = New-ScheduledTaskTrigger -Daily -At 3am
Register-ScheduledTask -Action $action -Trigger $trigger -TaskName "ExamTrack Database Backup" -Description "Daily backup of ExamTrack database"
```

---

## Conclusion

Your ExamTrack system is now fully deployed on your local network! 🎉

**What you have:**

- ✅ Backend API running on your PC
- ✅ Web Dashboard accessible via browser
- ✅ Mobile APK downloadable and installable
- ✅ PostgreSQL database with test data
- ✅ Real-time synchronization via Socket.IO
- ✅ Complete exam tracking and attendance system

**For your presentation:**

1. Start all services with `start-all.ps1`
2. Enable Windows Mobile Hotspot
3. Share WiFi credentials with attendees
4. Direct them to download page
5. Demo the complete workflow

**Support:**

- Keep this guide handy during presentation
- Use troubleshooting section for common issues
- Have Task Manager open to monitor performance
- Keep PM2 logs visible to show real-time activity

Good luck with your presentation! 🚀
