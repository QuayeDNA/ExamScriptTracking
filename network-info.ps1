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
