# Windows Firewall Configuration for Exam Script Tracking
# Run this script as Administrator to allow backend access from mobile devices

Write-Host "🔥 Configuring Windows Firewall for Exam Script Tracking Backend..." -ForegroundColor Cyan
Write-Host ""

# Find Node.js executable path
$nodePath = (Get-Command node.exe -ErrorAction SilentlyContinue).Source

if (-not $nodePath) {
    Write-Host "❌ Node.js not found. Please ensure Node.js is installed." -ForegroundColor Red
    exit 1
}

Write-Host "📍 Found Node.js at: $nodePath" -ForegroundColor Green
Write-Host ""

# Remove existing rules (if any)
Write-Host "🧹 Removing existing rules..." -ForegroundColor Yellow
Remove-NetFirewallRule -DisplayName "Exam Tracking - Backend API" -ErrorAction SilentlyContinue
Remove-NetFirewallRule -DisplayName "Exam Tracking - Socket.io" -ErrorAction SilentlyContinue

# Create new firewall rules for both ports
Write-Host "➕ Creating firewall rules..." -ForegroundColor Yellow

# Backend API (port 3000)
New-NetFirewallRule `
    -DisplayName "Exam Tracking - Backend API" `
    -Description "Allow incoming connections to Exam Script Tracking backend (port 3000)" `
    -Direction Inbound `
    -Program $nodePath `
    -Protocol TCP `
    -LocalPort 3000 `
    -Action Allow `
    -Profile Private,Public `
    -Enabled True | Out-Null

Write-Host "✅ Backend API (port 3000) firewall rule created" -ForegroundColor Green

# Socket.io (port 3001)
New-NetFirewallRule `
    -DisplayName "Exam Tracking - Socket.io" `
    -Description "Allow incoming connections to Exam Script Tracking Socket.io server (port 3001)" `
    -Direction Inbound `
    -Program $nodePath `
    -Protocol TCP `
    -LocalPort 3001 `
    -Action Allow `
    -Profile Private,Public `
    -Enabled True | Out-Null

Write-Host "✅ Socket.io (port 3001) firewall rule created" -ForegroundColor Green
Write-Host ""

# Display local IP
Write-Host "📱 Your local IP address:" -ForegroundColor Cyan
$localIP = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi*","Ethernet*" | Where-Object { $_.IPAddress -notlike "169.254.*" } | Select-Object -First 1).IPAddress
Write-Host "   $localIP" -ForegroundColor Yellow
Write-Host ""

Write-Host "✅ Firewall configuration complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📌 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Make sure your phone and computer are on the same Wi-Fi network"
Write-Host "   2. The mobile app is configured to use: http://${localIP}:3000/api"
Write-Host "   3. Start the backend server: npm run dev:backend"
Write-Host "   4. Start the mobile app: npm run dev:mobile"
Write-Host ""
Write-Host "🧪 Test connection from your phone's browser:" -ForegroundColor Cyan
Write-Host "   http://${localIP}:3000/health" -ForegroundColor Yellow
Write-Host ""
