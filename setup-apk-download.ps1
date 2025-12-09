# Setup APK Download Page for ExamTrack

Write-Host "📦 Setting up APK Download Server..." -ForegroundColor Green
Write-Host ""

# Get IP
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like "192.168.137.*"}).IPAddress
if (!$ip) {
    $ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -notlike "127.*"}).IPAddress | Select-Object -First 1
}

# Create download folder
$downloadPath = "C:\ExamTrack-Download"
New-Item -Path $downloadPath -ItemType Directory -Force | Out-Null
Write-Host "✅ Created folder: $downloadPath" -ForegroundColor Green

# Create download page
$htmlContent = @"
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Download ExamTrack Dev App</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
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
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
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
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
        h1 {
            color: #333;
            margin-bottom: 0.5rem;
            font-size: 2rem;
        }
        .badge {
            display: inline-block;
            background: #fbbf24;
            color: #78350f;
            padding: 0.5rem 1rem;
            border-radius: 50px;
            font-weight: bold;
            margin-bottom: 1rem;
            font-size: 0.9rem;
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
        }
        .btn:hover {
            background: #764ba2;
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
        }
        .features {
            background: #f0f9ff;
            border-radius: 10px;
            padding: 1.5rem;
            margin-top: 2rem;
            text-align: left;
        }
        .features h3 {
            color: #1e40af;
            margin-bottom: 1rem;
        }
        .features ul {
            list-style: none;
            padding: 0;
        }
        .features li {
            padding: 0.5rem 0;
            color: #1e40af;
        }
        .features li:before {
            content: "✅ ";
            margin-right: 0.5rem;
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
        }
        .instructions ol {
            margin-left: 1.5rem;
            color: #856404;
        }
        .instructions li {
            margin-bottom: 0.5rem;
        }
        .network-info {
            background: #f3f4f6;
            border-radius: 10px;
            padding: 1rem;
            margin-top: 2rem;
            font-size: 0.9rem;
            color: #6b7280;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🚀</div>
        <h1>ExamTrack Development</h1>
        <div class="badge">🔄 AUTO-UPDATING DEV BUILD</div>
        
        <p>
            Download the ExamTrack development app. This special version
            <strong>auto-updates</strong> when the developer makes changes - 
            no need to reinstall!
        </p>
        
        <a href="http://$ip`:8080/ExamTrack-Dev.apk" class="btn" download>
            📥 Download Development APK
        </a>
        
        <div class="features">
            <h3>🌟 Development Build Features</h3>
            <ul>
                <li>Install once, updates automatically</li>
                <li>No Expo Go app needed</li>
                <li>Full native functionality</li>
                <li>Shake device for dev menu</li>
                <li>Live error reporting</li>
            </ul>
        </div>
        
        <div class="instructions">
            <h3>📱 Installation Instructions</h3>
            <ol>
                <li><strong>Enable Unknown Sources:</strong> Settings → Security → "Install Unknown Apps"</li>
                <li><strong>Download APK:</strong> Click the download button above</li>
                <li><strong>Install:</strong> Open the downloaded file and tap "Install"</li>
                <li><strong>Connect to Network:</strong> Join WiFi: <code>ExamTrack-Dev</code></li>
                <li><strong>Launch App:</strong> It will automatically connect to the dev server</li>
            </ol>
        </div>
        
        <div class="network-info">
            <strong>Network Info:</strong><br>
            Server IP: $ip<br>
            WiFi Network: ExamTrack-Dev<br>
            Last Updated: $(Get-Date -Format "yyyy-MM-dd HH:mm")
        </div>
    </div>
</body>
</html>
"@

$htmlPath = "$downloadPath\index.html"
Set-Content -Path $htmlPath -Value $htmlContent
Write-Host "✅ Created download page: $htmlPath" -ForegroundColor Green

# Check if APK exists
$apkPath = "$downloadPath\ExamTrack-Dev.apk"
if (Test-Path $apkPath) {
    Write-Host "✅ APK found: $apkPath" -ForegroundColor Green
} else {
    Write-Host "⚠️  APK not found at: $apkPath" -ForegroundColor Yellow
    Write-Host "Run .\build-dev-apk.ps1 to create it" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📋 Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Access URLs:" -ForegroundColor Cyan
Write-Host "  Download Page: http://$ip`:8080" -ForegroundColor White
Write-Host "  Direct APK:    http://$ip`:8080/ExamTrack-Dev.apk" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Build APK: .\build-dev-apk.ps1"
Write-Host "  2. Start servers: .\start-dev.ps1"
Write-Host "  3. Share URL with users: http://$ip`:8080"
