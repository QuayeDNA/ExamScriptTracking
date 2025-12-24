#!/bin/bash

# Build and export mobile app for web deployment
echo "🚀 Building mobile app for web..."

# Check if we're in the right directory
if [ ! -d "mobile" ]; then
    echo "❌ Error: mobile directory not found. Run from project root."
    exit 1
fi

cd mobile

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing mobile dependencies..."
    npm install
fi

# Export mobile app to web public directory
echo "📱 Exporting mobile app..."
if npx expo export --platform web --output-dir ../web/public; then
    echo "✅ Mobile app exported to web/public"

    echo "🌐 Access it at: /index.html"
    exit 0
else
    echo "❌ Mobile app export failed"
    exit 1
fi