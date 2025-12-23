#!/bin/bash

# Build and export mobile app for web
echo "🚀 Building mobile app for web..."

cd mobile

# Export mobile app to web public directory
npx expo export --platform web --output-dir ../web/public/mobile

echo "✅ Mobile app exported to web/public/mobile"
echo "🌐 Access it at: /mobile"