#!/usr/bin/env node

/**
 * Script to update mobile .env file with current local IP address
 * Run this script whenever your IP address changes
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();

  // Look for non-internal IPv4 addresses
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip over internal (i.e. 127.0.0.1) and non-IPv4 addresses
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }

  return "localhost";
}

function updateEnvFile() {
  const mobileEnvPath = path.join(__dirname, "..", "mobile", ".env");
  const backendPort = process.env.PORT || "3000";
  const localIp = getLocalIpAddress();

  console.log("🔍 Detected local IP address:", localIp);

  const envContent = `# API Configuration
# Use your computer's local IP address instead of localhost for Expo Go to work
# Your current IP: ${localIp}
# If you need to update this, run: npm run update-ip
EXPO_PUBLIC_API_URL=http://${localIp}:${backendPort}/api
`;

  try {
    fs.writeFileSync(mobileEnvPath, envContent, "utf8");
    console.log("✅ Updated mobile/.env with IP:", localIp);
    console.log("📱 You can now use Expo Go to connect to your backend!");
    console.log("");
    console.log(
      "⚠️  Important: Make sure your phone and computer are on the same Wi-Fi network"
    );
    console.log("");
    console.log("🔥 Firewall reminder:");
    console.log(
      "   If the app can't connect, you may need to allow Node.js through Windows Firewall"
    );
    console.log("");
  } catch (error) {
    console.error("❌ Error updating .env file:", error.message);
    process.exit(1);
  }
}

updateEnvFile();
