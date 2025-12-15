# Build Release APK for ExamTrack
# This creates a properly signed APK that can be installed on any Android device

Write-Host "📱 Building ExamTrack Release APK..." -ForegroundColor Green
Write-Host ""

# Check if EAS CLI is installed
Write-Host "Checking EAS CLI..." -ForegroundColor Yellow
$easInstalled = Get-Command eas -ErrorAction SilentlyContinue
if (!$easInstalled) {
    Write-Host "Installing EAS CLI..." -ForegroundColor Yellow
    npm install -g eas-cli
}

# Login to Expo (if not logged in)
Write-Host "Ensuring EAS login..." -ForegroundColor Yellow
eas whoami 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Please login to Expo:" -ForegroundColor Yellow
    eas login
}

# Build the release APK
Write-Host ""
Write-Host "🌥️ Building release APK with EAS (this takes ~10-15 minutes)..." -ForegroundColor Yellow
Write-Host "This will create a properly signed APK for production use." -ForegroundColor Cyan
Write-Host ""

try {
    eas build --profile production --platform android --non-interactive

    Write-Host ""
    Write-Host "✅ Build submitted!" -ForegroundColor Green
    Write-Host "Monitor the build at: https://expo.dev/accounts/[your-account]/projects/ExamScriptTracking/builds" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Once the build completes:" -ForegroundColor Yellow
    Write-Host "  1. Download the APK from the Expo dashboard" -ForegroundColor White
    Write-Host "  2. Place it in: web/public/ExamTrack.apk" -ForegroundColor White
    Write-Host "  3. Commit and push the APK to the repo" -ForegroundColor White
    Write-Host ""
    Write-Host "The APK will be available for download from the web dashboard FAB button." -ForegroundColor Green

} catch {
    Write-Host ""
    Write-Host "❌ Build failed: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  • Ensure you have a production profile in eas.json" -ForegroundColor White
    Write-Host "  • Set up EAS credentials: eas credentials" -ForegroundColor White
    Write-Host "  • Configure keystore for signing" -ForegroundColor White
    exit 1
}