# Reset Database with Fresh Data

Write-Host "⚠️  This will DELETE all data and reseed the database!" -ForegroundColor Yellow
Write-Host "Are you sure? (y/N): " -NoNewline
$confirm = Read-Host

if ($confirm -ne "y") {
    Write-Host "Cancelled." -ForegroundColor Gray
    exit
}

Write-Host ""
Write-Host "🗑️  Resetting database..." -ForegroundColor Yellow

cd backend

# Reset database
npx prisma migrate reset --force

Write-Host ""
Write-Host "✅ Database reset complete!" -ForegroundColor Green
Write-Host "🔐 Default users recreated:" -ForegroundColor Cyan
Write-Host "   admin@example.com / Admin@123" -ForegroundColor White
Write-Host "   attendance@examtrack.com / Attendance@123" -ForegroundColor White
