# Add Firewall Rules for ExamTrack Development
# RUN THIS AS ADMINISTRATOR

Write-Host "🔥 Adding Windows Firewall Rules for ExamTrack..." -ForegroundColor Yellow
Write-Host ""

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Right-click PowerShell and select 'Run as Administrator', then run this script again." -ForegroundColor Yellow
    exit 1
}

# Remove existing rules if they exist
Write-Host "Removing old rules (if any)..." -ForegroundColor Gray
Remove-NetFirewallRule -DisplayName "ExamTrack Dev*" -ErrorAction SilentlyContinue

# Add new rules
Write-Host "Adding firewall rules..." -ForegroundColor Yellow

try {
    # Backend API (Port 5000)
    New-NetFirewallRule -DisplayName "ExamTrack Dev - Backend" `
        -Direction Inbound `
        -Protocol TCP `
        -LocalPort 5000 `
        -Action Allow `
        -Profile Any `
        -ErrorAction Stop
    Write-Host "  ✅ Backend (Port 5000)" -ForegroundColor Green

    # Web Dashboard (Port 5173)
    New-NetFirewallRule -DisplayName "ExamTrack Dev - Web" `
        -Direction Inbound `
        -Protocol TCP `
        -LocalPort 5173 `
        -Action Allow `
        -Profile Any `
        -ErrorAction Stop
    Write-Host "  ✅ Web (Port 5173)" -ForegroundColor Green

    # Mobile Expo (Port 8081)
    New-NetFirewallRule -DisplayName "ExamTrack Dev - Mobile" `
        -Direction Inbound `
        -Protocol TCP `
        -LocalPort 8081 `
        -Action Allow `
        -Profile Any `
        -ErrorAction Stop
    Write-Host "  ✅ Mobile (Port 8081)" -ForegroundColor Green

    # APK Download (Port 8080)
    New-NetFirewallRule -DisplayName "ExamTrack Dev - APK Server" `
        -Direction Inbound `
        -Protocol TCP `
        -LocalPort 8080 `
        -Action Allow `
        -Profile Any `
        -ErrorAction Stop
    Write-Host "  ✅ APK Server (Port 8080)" -ForegroundColor Green

    Write-Host ""
    Write-Host "✅ All firewall rules added successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your servers should now be accessible from other devices on the network." -ForegroundColor Cyan

} catch {
    Write-Host ""
    Write-Host "❌ Error adding firewall rules: $_" -ForegroundColor Red
    exit 1
}

# Verify rules were created
Write-Host ""
Write-Host "📋 Verifying rules..." -ForegroundColor Yellow
Get-NetFirewallRule -DisplayName "ExamTrack Dev*" | Select-Object DisplayName, Enabled, Direction | Format-Table -AutoSize
