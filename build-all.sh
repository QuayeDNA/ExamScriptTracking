#!/bin/bash

# Comprehensive build script for all platforms
echo "🚀 Building all platforms..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if we're in the project root
if [ ! -d "web" ] || [ ! -d "mobile" ] || [ ! -d "backend" ]; then
    print_error "Run this script from the project root directory"
    exit 1
fi

# Build web app
echo "🔨 Building web app..."
cd web
if [ ! -d "node_modules" ]; then
    print_warning "Installing web dependencies..."
    npm install
fi

if npm run build; then
    print_status "Web app built successfully"
else
    print_error "Web app build failed"
    exit 1
fi
cd ..

# Build mobile web app
echo "📱 Building mobile web app..."
if [ ! -d "mobile/node_modules" ]; then
    print_warning "Installing mobile dependencies..."
    cd mobile && npm install && cd ..
fi

if ./build-mobile-web.sh; then
    print_status "Mobile web app built successfully"
else
    print_error "Mobile web app build failed"
    exit 1
fi

print_status "All builds completed successfully!"
echo ""
echo "📦 Build outputs:"
echo "   Web app: web/dist/"
echo "   Mobile web: web/public/mobile/"
echo ""
echo "🚀 Ready for deployment!"