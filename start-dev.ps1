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

# Start Mobile (optional - uncomment if needed)
Write-Host "📱 Starting Mobile Dev Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command", 
    "cd '$PSScriptRoot\mobile'; npx expo start --dev-client --lan"
) -WindowStyle Normal
Start-Sleep -Seconds 3

# Start APK Server (if download folder exists)
if (Test-Path "C:\ExamTrack-Download") {
    Write-Host "📦 Starting APK Download Server..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList @(
        "-NoExit",
        "-Command",
        "cd C:\ExamTrack-Download; http-server -p 8080 -a 0.0.0.0"
    ) -WindowStyle Normal
    Start-Sleep -Seconds 2
}

Write-Host ""
Write-Host "✅ All servers started!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Access URLs:" -ForegroundColor Cyan
Write-Host "   Web Dashboard: http://$ip`:5173" -ForegroundColor White
Write-Host "   Backend API:   http://$ip`:5000" -ForegroundColor White
Write-Host "   Mobile Dev:    http://$ip`:8081" -ForegroundColor White
if (Test-Path "C:\ExamTrack-Download") {
    Write-Host "   APK Download:  http://$ip`:8080" -ForegroundColor White
}
Write-Host ""
Write-Host "🔐 Test Credentials:" -ForegroundColor Cyan
Write-Host "   Admin:      admin@example.com / Admin@123" -ForegroundColor White
Write-Host "   Attendance: attendance@examtrack.com / Attendance@123" -ForegroundColor White
Write-Host ""
Write-Host "💡 Tips:" -ForegroundColor Yellow
Write-Host "   - Keep these windows open while developing"
Write-Host "   - Changes auto-reload (no restart needed)"
Write-Host "   - Development build APK auto-updates too!"
Write-Host "   - Check logs in each window for errors"
Write-Host "   - Press Ctrl+C in any window to stop that server"
Write-Host ""
Write-Host "📱 First time? Build dev APK:" -ForegroundColor Magenta
Write-Host "   cd mobile && eas build --profile development --platform android"
Write-Host ""
Write-Host "📖 View logs in the opened terminal windows" -ForegroundColor Magenta
