#!/bin/bash
# Setup script for Android development environment
# This sets up JAVA_HOME and ANDROID_HOME for Android development

export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/tools:$PATH"

echo "✅ Android environment configured:"
echo "   JAVA_HOME: $JAVA_HOME"
echo "   ANDROID_HOME: $ANDROID_HOME"
echo ""
echo "You can now run: npm run android:run"

