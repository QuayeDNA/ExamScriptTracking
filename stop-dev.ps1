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
