# Android Build Guide

## Previous Build Commands

Based on the project history, here are the commands that were used for Android builds:

### 1. **Development Build (Debug APK)**
```bash
# Build web app first
npm run build

# Sync Capacitor
npm run android:sync

# Build debug APK
cd android
./gradlew assembleDebug
```

The APK will be at: `android/app/build/outputs/apk/debug/app-debug.apk`

### 2. **Release Build (Signed APK)**
```bash
# Build web app first
npm run build

# Sync Capacitor
npm run android:sync

# Build release APK (requires keystore)
cd android
./gradlew assembleRelease
```

The APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

### 3. **Previous Build Command (from GitHub Actions)**
```bash
# Install dependencies
npm ci

# Build web app
npm run build

# Sync Capacitor
npx cap sync android

# Make gradlew executable
chmod +x android/gradlew

# Build Android APK
cd android
./gradlew assembleDebug
```

### 4. **With Java 17 (Required)**
```bash
# Set Java home (macOS)
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"

# Build web app
npm run build

# Sync Capacitor
JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" npx cap sync android

# Build APK
cd android
JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" ./gradlew assembleDebug
```

---

## Quick Build Scripts

### Debug Build (Quick)
```bash
npm run build && npm run android:sync && cd android && ./gradlew assembleDebug
```

### Release Build (Quick)
```bash
npm run build && npm run android:sync && cd android && ./gradlew assembleRelease
```

---

## Step-by-Step Build Process

### Step 1: Build Web App
```bash
npm run build
```
This creates the production build in `dist/public/`

### Step 2: Sync Capacitor
```bash
npm run android:sync
```
This copies the web build to Android and updates native configs.

**Or manually:**
```bash
JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" npx cap sync android
```

### Step 3: Build Android APK

**For Debug APK:**
```bash
cd android
./gradlew assembleDebug
```

**For Release APK (Signed):**
```bash
cd android
./gradlew assembleRelease
```

**Note:** Release builds require:
- Keystore file: `android/app/plattr-release-key.jks`
- Keystore password (from `keystore.properties` or `PLATTR_KEYSTORE_PASSWORD` env var)
- Key password (from `keystore.properties` or `PLATTR_KEY_PASSWORD` env var)

### Step 4: Find Your APK

**Debug APK:**
```
android/app/build/outputs/apk/debug/app-debug.apk
```

**Release APK:**
```
android/app/build/outputs/apk/release/app-release.apk
```

---

## Complete Build Command (All-in-One)

### Debug Build:
```bash
npm run build && \
npm run android:sync && \
cd android && \
./gradlew assembleDebug && \
echo "✅ APK built: android/app/build/outputs/apk/debug/app-debug.apk"
```

### Release Build:
```bash
npm run build && \
npm run android:sync && \
cd android && \
./gradlew assembleRelease && \
echo "✅ APK built: android/app/build/outputs/apk/release/app-release.apk"
```

---

## Troubleshooting

### Java Version Issues
If you get Java version errors, ensure Java 17 is used:
```bash
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
```

### Gradle Permission Issues
```bash
chmod +x android/gradlew
```

### Clean Build
If you encounter build issues, try a clean build:
```bash
cd android
./gradlew clean
./gradlew assembleDebug
```

### Check APK Size
```bash
ls -lh android/app/build/outputs/apk/debug/app-debug.apk
```

---

## Build Configuration

- **Application ID:** `com.caterplanner.app`
- **Version Code:** 1
- **Version Name:** 1.0
- **Min SDK:** 24
- **Target SDK:** 34
- **Compile SDK:** 34
- **Java Version:** 17

---

## Next Steps

After building, you can:
1. Install on device: `adb install android/app/build/outputs/apk/debug/app-debug.apk`
2. Share the APK file
3. Upload to Google Play Store (requires release build)

