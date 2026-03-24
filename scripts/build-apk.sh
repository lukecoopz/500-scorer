#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting Android Build Process..."

# 1. Set Environment Variables (Adjusted for macOS Android Studio)
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH"

# 2. Build the Web App
echo "📦 Building web assets..."
npm run build

# 3. Sync with Capacitor
echo "🔄 Syncing with Capacitor..."
npx cap copy android

# 4. Build the APK
echo "🏗️  Building APK..."
cd android
./gradlew assembleDebug

echo "✅ Build Complete!"
echo "📍 APK Location: android/app/build/outputs/apk/debug/app-debug.apk"
