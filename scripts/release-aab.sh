#!/bin/bash

# Builds a signed Android App Bundle (.aab) for Play Store upload.
# Reuses Android Studio's bundled JRE so a separate JDK install isn't required.

set -e

echo "🚀 Starting Android Release Build..."

# 1. Set Environment Variables (Adjusted for macOS Android Studio)
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH"

if [ ! -x "$JAVA_HOME/bin/java" ]; then
  echo "❌ Android Studio's bundled JRE not found at:"
  echo "   $JAVA_HOME"
  echo "   Install Android Studio, or set JAVA_HOME to a JDK 17+ install yourself."
  exit 1
fi

if [ ! -f "android/keystore.properties" ]; then
  echo "❌ android/keystore.properties not found - release signing isn't configured on this machine."
  exit 1
fi

# 2. Build the Web App
echo "📦 Building web assets..."
npm run build

# 3. Sync with Capacitor
echo "🔄 Syncing with Capacitor..."
npx cap sync android

# 4. Build the signed release AAB
echo "🏗️  Building release bundle..."
cd android
./gradlew bundleRelease

echo "✅ Build Complete!"
echo "📍 AAB Location: android/app/build/outputs/bundle/release/app-release.aab"
echo "   Upload this file to Play Console > Release > (track) > Create new release."
