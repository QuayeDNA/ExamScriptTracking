# Build Development APK for ExamTrack
# This APK auto-updates when you change code!

Write-Host "📱 Building ExamTrack Development APK..." -ForegroundColor Green
Write-Host ""

# Get IP for configuration
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like "192.168.137.*"}).IPAddress
if (!$ip) {
    $ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -notlike "127.*"}).IPAddress | Select-Object -First 1
}

Write-Host "🌐 Your IP: $ip" -ForegroundColor Cyan
Write-Host ""

# Check if mobile/.env.development exists and has correct IP
$envPath = "mobile/.env.development"
if (Test-Path $envPath) {
    $envContent = Get-Content $envPath -Raw
    if ($envContent -notmatch $ip) {
        Write-Host "⚠️  Warning: mobile/.env.development may not have your current IP!" -ForegroundColor Yellow
        Write-Host "Current IP: $ip" -ForegroundColor Yellow
        Write-Host "Update the file before building? (y/N): " -NoNewline
        $update = Read-Host
        
        if ($update -eq "y") {
            $newEnv = @"
# Backend API URL
EXPO_PUBLIC_API_URL=http://$ip`:5000/api

# Socket.IO URL
EXPO_PUBLIC_SOCKET_URL=http://$ip`:5000

# Environment
EXPO_PUBLIC_ENV=development
"@
            Set-Content -Path $envPath -Value $newEnv
            Write-Host "✅ Updated .env.development" -ForegroundColor Green
        }
    }
} else {
    Write-Host "Creating mobile/.env.development..." -ForegroundColor Yellow
    $newEnv = @"
# Backend API URL
EXPO_PUBLIC_API_URL=http://$ip`:5000/api

# Socket.IO URL
EXPO_PUBLIC_SOCKET_URL=http://$ip`:5000

# Environment
EXPO_PUBLIC_ENV=development
"@
    Set-Content -Path $envPath -Value $newEnv
    Write-Host "✅ Created .env.development" -ForegroundColor Green
}

Write-Host ""
Write-Host "Choose build method:" -ForegroundColor Cyan
Write-Host "  1. EAS Build (Cloud - Easier, requires Expo account)"
Write-Host "  2. Local Build (Requires Android SDK setup)"
Write-Host ""
Write-Host "Enter choice (1 or 2): " -NoNewline
$choice = Read-Host

cd mobile

if ($choice -eq "1") {
    Write-Host ""
    Write-Host "🌥️  Building with EAS (this takes ~10-15 minutes)..." -ForegroundColor Yellow
    Write-Host ""
    
    # Check if logged in
    Write-Host "Checking EAS CLI..." -ForegroundColor Yellow
    $easInstalled = Get-Command eas -ErrorAction SilentlyContinue
    if (!$easInstalled) {
        Write-Host "Installing EAS CLI..." -ForegroundColor Yellow
        npm install -g eas-cli
    }
    
    Write-Host "Logging in to Expo (if not logged in)..." -ForegroundColor Yellow
    eas whoami
    
    Write-Host ""
    Write-Host "Starting build..." -ForegroundColor Green
    eas build --profile development --platform android
    
    Write-Host ""
    Write-Host "✅ Build complete!" -ForegroundColor Green
    Write-Host "📥 Download the APK from the link above" -ForegroundColor Cyan
    Write-Host "📦 Then copy it to C:\ExamTrack-Download\ExamTrack-Dev.apk" -ForegroundColor Cyan
    
} elseif ($choice -eq "2") {
    Write-Host ""
    Write-Host "🔨 Building locally (this takes ~5-10 minutes)..." -ForegroundColor Yellow
    Write-Host ""
    
    # Check if Android SDK is available
    if (!$env:ANDROID_HOME) {
        Write-Host "❌ ANDROID_HOME not set!" -ForegroundColor Red
        Write-Host "Please install Android Studio and set ANDROID_HOME" -ForegroundColor Yellow
        Write-Host "See DEPLOYMENT_DEV_MODE.md for setup instructions" -ForegroundColor Yellow
        exit
    }
    
    Write-Host "Prebuild native project..." -ForegroundColor Yellow
    npx expo prebuild
    
    Write-Host ""
    Write-Host "Building APK..." -ForegroundColor Yellow
    npx expo run:android --variant debug
    
    $apkPath = "android/app/build/outputs/apk/debug/app-debug.apk"
    
    if (Test-Path $apkPath) {
        Write-Host ""
        Write-Host "✅ Build complete!" -ForegroundColor Green
        Write-Host "📱 APK location: $apkPath" -ForegroundColor Cyan
        
        # Copy to download folder
        Write-Host ""
        Write-Host "Copy to download folder? (y/N): " -NoNewline
        $copy = Read-Host
        
        if ($copy -eq "y") {
            New-Item -Path "C:\ExamTrack-Download" -ItemType Directory -Force
            Copy-Item $apkPath "C:\ExamTrack-Download\ExamTrack-Dev.apk"
            Write-Host "✅ Copied to C:\ExamTrack-Download\ExamTrack-Dev.apk" -ForegroundColor Green
        }
    } else {
        Write-Host "❌ Build failed! Check errors above." -ForegroundColor Red
    }
    
} else {
    Write-Host "Invalid choice. Exiting." -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Ensure APK is at: C:\ExamTrack-Download\ExamTrack-Dev.apk"
Write-Host "2. Start dev servers: .\start-dev.ps1"
Write-Host "3. Users download from: http://$ip`:8080"
Write-Host "4. Users install and launch the app"
Write-Host "5. App auto-updates when you change code! 🎉"
