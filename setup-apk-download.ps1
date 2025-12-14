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
        :root {
            --background: oklch(0.99 0 240);
            --foreground: oklch(0.18 0.01 240);
            --card: oklch(1 0 0);
            --card-foreground: oklch(0.18 0.01 240);
            --primary: oklch(0.62 0.25 255);
            --primary-foreground: oklch(1 0 0);
            --secondary: oklch(0.97 0 240);
            --secondary-foreground: oklch(0.18 0.01 240);
            --muted: oklch(0.97 0 240);
            --muted-foreground: oklch(0.52 0 240);
            --success: oklch(0.65 0.22 145);
            --success-foreground: oklch(1 0 0);
            --warning: oklch(0.72 0.18 70);
            --warning-foreground: oklch(0.18 0.01 240);
            --error: oklch(0.62 0.25 25);
            --error-foreground: oklch(1 0 0);
            --info: oklch(0.65 0.15 195);
            --info-foreground: oklch(1 0 0);
            --border: oklch(0.93 0 240);
            --radius: 0.375rem;
            --radius-lg: 0.75rem;
            --radius-xl: 1rem;
            --radius-full: 9999px;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            border-color: var(--border);
            transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
            background-color: var(--background);
            color: var(--foreground);
            height: 100vh;
            overflow: hidden;
            line-height: 1.6;
            font-feature-settings: "rlig" 1, "calt" 1;
            font-synthesis: none;
            text-rendering: optimizeLegibility;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }

        .container {
            height: 100vh;
            padding: 1rem;
            display: grid;
            grid-template-columns: repeat(12, 1fr);
            grid-template-rows: auto 1fr auto;
            gap: 1rem;
        }

        .header {
            grid-column: 1 / -1;
            text-align: center;
            padding: 1rem 0;
        }

        .header h1 {
            font-size: 2rem;
            font-weight: 700;
            color: var(--foreground);
            margin-bottom: 0.5rem;
        }

        .badge {
            display: inline-flex;
            align-items: center;
            padding: 0.5rem 1rem;
            background-color: var(--warning);
            color: var(--warning-foreground);
            border-radius: var(--radius-full);
            font-weight: 500;
            font-size: 0.875rem;
        }

        .bento-grid {
            display: grid;
            grid-template-columns: repeat(12, 1fr);
            grid-template-rows: repeat(8, 1fr);
            gap: 1rem;
            grid-column: 1 / -1;
        }

        .card {
            background-color: var(--card);
            color: var(--card-foreground);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
            padding: 1.5rem;
            display: flex;
            flex-direction: column;
            transition: all 0.2s ease;
        }

        .card:hover {
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            transform: translateY(-1px);
        }

        .card-header {
            margin-bottom: 1rem;
        }

        .card-title {
            font-size: 1.25rem;
            font-weight: 600;
            color: var(--foreground);
            margin-bottom: 0.5rem;
        }

        .card-description {
            color: var(--muted-foreground);
            font-size: 0.875rem;
        }

        .hero-card {
            grid-column: 1 / 9;
            grid-row: 1 / 4;
            background: linear-gradient(135deg, var(--primary) 0%, oklch(0.55 0.27 260) 100%);
            color: var(--primary-foreground);
        }

        .hero-card .card-title {
            color: var(--primary-foreground);
            font-size: 1.875rem;
        }

        .hero-card .card-description {
            color: oklch(0.95 0.05 240);
        }

        .download-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 1rem 2rem;
            background-color: var(--primary-foreground);
            color: var(--primary);
            border-radius: var(--radius-lg);
            text-decoration: none;
            font-weight: 600;
            font-size: 1.125rem;
            transition: all 0.2s ease;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
            border: none;
            cursor: pointer;
            margin-top: auto;
        }

        .download-btn:hover {
            background-color: oklch(0.95 0.05 240);
            transform: translateY(-1px);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .features-card {
            grid-column: 9 / 13;
            grid-row: 1 / 4;
        }

        .features-list {
            list-style: none;
            padding: 0;
        }

        .features-list li {
            display: flex;
            align-items: center;
            padding: 0.5rem 0;
            color: var(--muted-foreground);
            font-size: 0.875rem;
        }

        .features-list li:before {
            content: "✓";
            color: var(--success);
            font-weight: bold;
            margin-right: 0.75rem;
            font-size: 1rem;
        }

        .updates-card {
            grid-column: 1 / 5;
            grid-row: 4 / 6;
            background-color: var(--success);
            color: var(--success-foreground);
        }

        .updates-card .card-title {
            color: var(--success-foreground);
        }

        .updates-card .card-description {
            color: oklch(0.95 0.1 145);
        }

        .network-card {
            grid-column: 5 / 9;
            grid-row: 4 / 6;
            background-color: var(--info);
            color: var(--info-foreground);
        }

        .network-card .card-title {
            color: var(--info-foreground);
        }

        .network-card .card-description {
            color: oklch(0.95 0.05 195);
        }

        .network-info {
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 0.75rem;
            background-color: oklch(0.98 0.02 195);
            padding: 0.5rem;
            border-radius: var(--radius);
            margin-top: 0.5rem;
        }

        .instructions-card {
            grid-column: 9 / 13;
            grid-row: 4 / 8;
        }

        .instructions-list {
            list-style: none;
            padding: 0;
            counter-reset: step-counter;
        }

        .instructions-list li {
            counter-increment: step-counter;
            display: flex;
            align-items: flex-start;
            padding: 0.75rem 0;
            color: var(--muted-foreground);
            font-size: 0.875rem;
            border-bottom: 1px solid var(--border);
        }

        .instructions-list li:last-child {
            border-bottom: none;
        }

        .instructions-list li:before {
            content: counter(step-counter);
            background-color: var(--primary);
            color: var(--primary-foreground);
            width: 1.5rem;
            height: 1.5rem;
            border-radius: var(--radius-full);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            font-size: 0.75rem;
            margin-right: 0.75rem;
            flex-shrink: 0;
            margin-top: 0.125rem;
        }

        .footer {
            grid-column: 1 / -1;
            text-align: center;
            padding: 1rem 0;
            color: var(--muted-foreground);
            font-size: 0.875rem;
        }

        @media (max-width: 768px) {
            .container {
                grid-template-rows: auto 1fr auto;
                padding: 0.5rem;
                gap: 0.5rem;
            }

            .header h1 {
                font-size: 1.5rem;
            }

            .bento-grid {
                grid-template-rows: repeat(12, 1fr);
                gap: 0.5rem;
            }

            .hero-card {
                grid-column: 1 / -1;
                grid-row: 1 / 3;
            }

            .features-card {
                grid-column: 1 / -1;
                grid-row: 3 / 5;
            }

            .updates-card {
                grid-column: 1 / 7;
                grid-row: 5 / 7;
            }

            .network-card {
                grid-column: 7 / -1;
                grid-row: 5 / 7;
            }

            .instructions-card {
                grid-column: 1 / -1;
                grid-row: 7 / 12;
            }

            .card {
                padding: 1rem;
            }

            .card-title {
                font-size: 1.125rem;
            }

            .download-btn {
                padding: 0.875rem 1.5rem;
                font-size: 1rem;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📱 ExamTrack Development</h1>
            <div class="badge">🔄 AUTO-UPDATING DEV BUILD</div>
        </div>

        <div class="bento-grid">
            <!-- Hero Card -->
            <div class="card hero-card">
                <div class="card-header">
                    <h2 class="card-title">Download Development APK</h2>
                    <p class="card-description">
                        Get the latest ExamTrack development build with automatic updates.
                        No need to reinstall when developers make changes!
                    </p>
                </div>
                <a href="http://$ip`:8080/ExamTrack-Dev.apk" class="download-btn" download>
                    📥 Download APK
                </a>
            </div>

            <!-- Features Card -->
            <div class="card features-card">
                <div class="card-header">
                    <h3 class="card-title">✨ Features</h3>
                </div>
                <ul class="features-list">
                    <li>Auto-updating development build</li>
                    <li>No Expo Go required</li>
                    <li>Full native functionality</li>
                    <li>Shake for dev menu</li>
                    <li>Live error reporting</li>
                </ul>
            </div>

            <!-- Updates Card -->
            <div class="card updates-card">
                <div class="card-header">
                    <h4 class="card-title">🔄 Auto Updates</h4>
                    <p class="card-description">
                        This development build automatically updates when the developer makes changes.
                        Always stay on the latest version!
                    </p>
                </div>
            </div>

            <!-- Network Card -->
            <div class="card network-card">
                <div class="card-header">
                    <h4 class="card-title">🌐 Network Info</h4>
                    <p class="card-description">
                        Connect to the same WiFi network as the development server.
                    </p>
                </div>
                <div class="network-info">
                    IP: $ip<br>
                    WiFi: ExamTrack-Dev<br>
                    Updated: $(Get-Date -Format "yyyy-MM-dd HH:mm")
                </div>
            </div>

            <!-- Instructions Card -->
            <div class="card instructions-card">
                <div class="card-header">
                    <h4 class="card-title">📋 Installation Steps</h4>
                </div>
                <ol class="instructions-list">
                    <li><strong>Enable Unknown Sources:</strong> Settings → Security → "Install Unknown Apps"</li>
                    <li><strong>Download APK:</strong> Click the download button above</li>
                    <li><strong>Install:</strong> Open the downloaded file and tap "Install"</li>
                    <li><strong>Connect to Network:</strong> Join WiFi: <code>ExamTrack-Dev</code></li>
                    <li><strong>Launch App:</strong> It will automatically connect to the dev server</li>
                </ol>
            </div>
        </div>

        <div class="footer">
            <p>ExamTrack Development Environment • Built with ❤️ for seamless testing</p>
        </div>
    </div>
</body>
</html>
"@
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Download ExamTrack Dev App</title>
    <style>
        /* Design System Colors - Matching Web App */
        :root {
            /* Background & Foreground */
            --background: oklch(0.99 0 240);
            --foreground: oklch(0.18 0.01 240);

            /* Card */
            --card: oklch(1 0 0);
            --card-foreground: oklch(0.18 0.01 240);

            /* Primary (Academic Blue) */
            --primary: oklch(0.62 0.25 255);
            --primary-foreground: oklch(1 0 0);

            /* Secondary */
            --secondary: oklch(0.97 0 240);
            --secondary-foreground: oklch(0.18 0.01 240);

            /* Muted */
            --muted: oklch(0.97 0 240);
            --muted-foreground: oklch(0.52 0 240);

            /* Success */
            --success: oklch(0.65 0.22 145);
            --success-foreground: oklch(1 0 0);

            /* Warning */
            --warning: oklch(0.72 0.18 70);
            --warning-foreground: oklch(0.18 0.01 240);

            /* Border */
            --border: oklch(0.93 0 240);

            /* Border Radius */
            --radius: 0.375rem;
            --radius-lg: 0.75rem;
            --radius-xl: 1rem;
            --radius-full: 9999px;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            border-color: var(--border);
            transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
            background-color: var(--background);
            color: var(--foreground);
            min-height: 100vh;
            line-height: 1.6;
            font-feature-settings: "rlig" 1, "calt" 1;
            font-synthesis: none;
            text-rendering: optimizeLegibility;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }

        .container {
            max-width: 600px;
            margin: 2rem auto;
            padding: 2rem;
        }

        .card {
            background-color: var(--card);
            color: var(--card-foreground);
            border: 1px solid var(--border);
            border-radius: var(--radius-xl);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            overflow: hidden;
        }

        .card-header {
            padding: 2rem 2rem 1rem;
            text-align: center;
            border-bottom: 1px solid var(--border);
        }

        .logo {
            font-size: 4rem;
            margin-bottom: 1rem;
            display: block;
        }

        .card-title {
            font-size: 2rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
            line-height: 1.2;
        }

        .badge {
            display: inline-flex;
            align-items: center;
            padding: 0.5rem 1rem;
            background-color: var(--warning);
            color: var(--warning-foreground);
            border-radius: var(--radius-full);
            font-weight: 500;
            font-size: 0.875rem;
            margin-bottom: 1rem;
        }

        .card-content {
            padding: 2rem;
        }

        .description {
            color: var(--muted-foreground);
            margin-bottom: 2rem;
            font-size: 1rem;
        }

        .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 1rem 2rem;
            background-color: var(--primary);
            color: var(--primary-foreground);
            border-radius: var(--radius-lg);
            text-decoration: none;
            font-weight: 500;
            font-size: 1.125rem;
            transition: all 0.2s ease;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
            border: none;
            cursor: pointer;
            width: 100%;
            margin-bottom: 2rem;
        }

        .btn:hover {
            background-color: oklch(0.55 0.27 260);
            transform: translateY(-1px);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }

        .features {
            background-color: var(--muted);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            padding: 1.5rem;
            margin-bottom: 2rem;
        }

        .features h3 {
            color: var(--foreground);
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 1rem;
        }

        .features ul {
            list-style: none;
            padding: 0;
        }

        .features li {
            padding: 0.5rem 0;
            color: var(--muted-foreground);
            display: flex;
            align-items: center;
        }

        .features li:before {
            content: "✓";
            color: var(--success);
            font-weight: bold;
            margin-right: 0.75rem;
            font-size: 1.125rem;
        }

        .instructions {
            background-color: oklch(0.98 0.02 70);
            border: 1px solid var(--warning);
            border-left: 4px solid var(--warning);
            border-radius: var(--radius-lg);
            padding: 1.5rem;
            margin-bottom: 2rem;
        }

        .instructions h3 {
            color: oklch(0.38 0.12 50);
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 1rem;
        }

        .instructions ol {
            margin-left: 1.5rem;
            color: oklch(0.38 0.12 50);
        }

        .instructions li {
            margin-bottom: 0.5rem;
        }

        .network-info {
            background-color: var(--secondary);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            padding: 1rem;
            font-size: 0.875rem;
            color: var(--muted-foreground);
        }

        .network-info strong {
            color: var(--foreground);
        }

        @media (max-width: 640px) {
            .container {
                margin: 1rem auto;
                padding: 1rem;
            }

            .card-header,
            .card-content {
                padding: 1.5rem;
            }

            .card-title {
                font-size: 1.75rem;
            }

            .btn {
                padding: 0.875rem 1.5rem;
                font-size: 1rem;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <div class="card-header">
                <span class="logo">📱</span>
                <h1 class="card-title">ExamTrack Development</h1>
                <div class="badge">🔄 AUTO-UPDATING DEV BUILD</div>
            </div>

            <div class="card-content">
                <p class="description">
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
