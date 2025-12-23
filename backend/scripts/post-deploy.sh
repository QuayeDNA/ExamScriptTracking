#!/bin/bash

# Production Deployment Script
# This script runs after deployment to seed essential data

echo "🚀 Running post-deployment setup..."

# Navigate to backend directory (if not already there)
cd backend 2>/dev/null || echo "Already in backend directory"

# Run database migrations
echo "📦 Running database migrations..."
npx prisma migrate deploy

# Seed production data
echo "🌱 Seeding production data..."
npm run seed:prod

echo "✅ Production deployment setup complete!"
echo ""
echo "🎉 Your ELMS application is ready!"
echo "   📧 Admin Email: superadmin@examtracking.com"
echo "   🔑 Admin Password: SuperAdmin123!"
echo "   📱 Attendance Email: attendance@examtrack.com"
echo "   🔑 Attendance Password: Attendance@123"
echo ""
echo "⚠️  IMPORTANT: Change the admin password after first login!"