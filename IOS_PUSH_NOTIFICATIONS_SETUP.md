# iOS Push Notifications Setup Guide

This guide walks through the complete setup for iOS push notifications using Firebase Cloud Messaging (FCM) in a Capacitor app.

## Prerequisites

- Apple Developer Account (paid membership required)
- Xcode installed
- Firebase project configured
- iOS device (push notifications don't work in simulator)

## Step 1: Apple Developer Account Setup

### 1.1 Create/Verify Bundle ID

1. Log in to [Apple Developer Portal](https://developer.apple.com/account)
2. Navigate to **Certificates, Identifiers & Profiles** → **Identifiers**
3. Click the **+** button and select **App IDs** → **App**
4. Enter your Bundle ID (e.g., `com.caterplanner.app`) - **must match your app's bundle ID**
5. Enable the **Push Notifications** capability
6. Click **Continue** and **Register**

**Important**: Your Firebase iOS app must use the same Bundle ID.

### 1.2 Generate APNs Authentication Key

1. In Apple Developer Portal, go to **Keys**
2. Click the **+** button to create a new key
3. Enter a key name (e.g., "Plattr FCM Key")
4. Enable **Apple Push Notification service (APNs)**
5. Click **Continue** and **Register**
6. **Download the key immediately** (`.p8` file) - you can only download it once!
7. **Note the Key ID** - you'll need it for Firebase

## Step 2: Firebase Configuration

### 2.1 Upload APNs Key to Firebase

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Project Settings** (gear icon) → **Cloud Messaging** tab
4. Scroll to **iOS app configuration**
5. Click **Upload** under "APNs Authentication Key"
6. Upload the `.p8` file you downloaded
7. Enter the **Key ID** you noted earlier
8. Enter your **Team ID** (found in Apple Developer Portal → **Account** → **Membership**)
9. Click **Upload**

### 2.2 Verify GoogleService-Info.plist

Ensure `plattr/ios/App/App/GoogleService-Info.plist` exists and contains your Firebase configuration. This file should have been downloaded from Firebase Console when you added the iOS app.

## Step 3: Xcode Configuration

### 3.1 Open Project in Xcode

```bash
cd plattr
npm run ios:sync
open ios/App/App.xcworkspace
```

**Important**: Always open `.xcworkspace`, not `.xcodeproj`

### 3.2 Enable Automatic Signing

1. Select your project in the navigator
2. Select the **App** target
3. Go to **Signing & Capabilities** tab
4. Enable **Automatically manage signing**
5. Select your **Team** (Apple Developer account)

### 3.3 Add Push Notifications Capability

1. In **Signing & Capabilities**, click **+ Capability**
2. Add **Push Notifications**
3. Verify it appears in the capabilities list

### 3.4 Add Background Modes

1. In **Signing & Capabilities**, click **+ Capability**
2. Add **Background Modes**
3. Enable:
   - ✅ **Remote notifications**
   - ✅ **Background fetch** (optional, for background sync)

### 3.5 Verify Entitlements

The project should have two entitlements files:

- **AppDebug.entitlements** (for Debug builds):
  ```xml
  <key>aps-environment</key>
  <string>development</string>
  ```

- **App.entitlements** (for Release/TestFlight builds):
  ```xml
  <key>aps-environment</key>
  <string>production</string>
  ```

These are automatically linked to the correct build configurations in `project.pbxproj`.

## Step 4: Code Implementation

### 4.1 Native iOS Code

The following files are already configured:

- **`AppDelegate.swift`**: Handles APNs registration, FCM token generation, and foreground notification presentation
- **`FCMTokenPlugin.swift`**: Custom Capacitor plugin that bridges FCM tokens to JavaScript
- **`SceneDelegate.swift`**: Handles scene lifecycle and deep links

### 4.2 JavaScript Code

The notification service (`client/src/lib/notifications/service.ts`) handles:
- Requesting permissions
- Registering for push notifications
- Receiving APNs token → fetching FCM token
- Storing FCM token in Supabase
- Handling notification taps and deep links

### 4.3 Capacitor Configuration

Ensure `ios/App/App/capacitor.config.json` includes `FCMTokenPlugin` in `packageClassList`:

```json
{
  "packageClassList": [
    "AppPlugin",
    "GeolocationPlugin",
    "LocalNotificationsPlugin",
    "PushNotificationsPlugin",
    "FCMTokenPlugin"
  ]
}
```

**Note**: The `npm run ios:sync` script automatically patches this file if needed.

## Step 5: Build and Test

### 5.1 Clean Build

```bash
cd plattr
npm run build
npm run ios:sync
```

### 5.2 Open in Xcode

```bash
open ios/App/App.xcworkspace
```

### 5.3 Clean Build Folder in Xcode

1. In Xcode, go to **Product** → **Clean Build Folder** (⇧⌘K)
2. This ensures no cached build artifacts interfere

### 5.4 Build for Device

1. Connect your iOS device via USB
2. Select your device in Xcode's device selector
3. Click **Run** (▶️) or press **⌘R**

**Important**: 
- Push notifications **do not work** in the iOS Simulator
- You **must** use a real device
- For TestFlight builds, use a **Distribution** provisioning profile with **production** APNs environment

### 5.5 Test Notification Registration

1. Launch the app on your device
2. Grant notification permissions when prompted
3. Check Xcode console for:
   - `[Plattr] FCM token: <token>`
   - `[Notifications] iOS FCM token received: <token>`
   - `[Notifications] ✅ Token inserted successfully`

### 5.6 Send Test Notification

1. Log in to the app
2. Go to **Notification Settings**
3. Tap **Send Test Notification**
4. You should see the notification appear in the notification tray

## Step 6: TestFlight Setup

### 6.1 Create Distribution Provisioning Profile

1. In Apple Developer Portal, go to **Profiles**
2. Create a new **App Store** or **Ad Hoc** profile
3. Select your App ID (with Push Notifications enabled)
4. Select your distribution certificate
5. Download and install the profile

### 6.2 Configure Xcode for Distribution

1. In Xcode, select **Any iOS Device** or your connected device
2. Go to **Product** → **Archive**
3. Once archived, click **Distribute App**
4. Select **TestFlight & App Store**
5. Follow the prompts to upload

### 6.3 Important Notes for TestFlight

- Use **production** APNs environment (`App.entitlements`)
- Ensure Firebase has your **production** APNs key uploaded
- TestFlight builds use **production** APNs, not development
- You may need to wait a few minutes after uploading for TestFlight to process

## Troubleshooting

### Token Not Received

**Symptoms**: No FCM token in console logs

**Solutions**:
1. Verify `GoogleService-Info.plist` exists and is correct
2. Check that Firebase is configured with the correct Bundle ID
3. Ensure APNs key is uploaded to Firebase
4. Verify entitlements are correct (`aps-environment`)
5. Check Xcode console for Firebase initialization errors

### Notifications Not Appearing

**Symptoms**: Token received but notifications don't show

**Solutions**:
1. Verify notification permissions are granted (Settings → Plattr → Notifications)
2. Check that `AppDelegate` implements `UNUserNotificationCenterDelegate`
3. Ensure `willPresent` delegate method returns `.banner` or `.alert`
4. Verify notification payload includes `apns-push-type: alert` and `aps.alert`
5. Check Supabase `device_tokens` table has the correct FCM token

### "Invalid Token" Errors

**Symptoms**: FCM API returns "INVALID" or "UNREGISTERED" errors

**Solutions**:
1. Ensure you're using **FCM token**, not APNs token
2. Verify token is stored correctly in Supabase
3. Check that Firebase project ID matches in Edge Function
4. Ensure APNs key in Firebase matches your app's provisioning profile

### Build Errors

**Symptoms**: Xcode build fails

**Common fixes**:
1. Run `pod install` in `ios/App` directory
2. Clean build folder (⇧⌘K)
3. Delete `DerivedData` folder
4. Verify all Swift files compile without errors
5. Check that `FCMTokenPlugin` is in `packageClassList`

## Architecture Overview

### Token Flow

```
iOS Device
  ↓
APNs Registration (Apple)
  ↓
APNs Token → AppDelegate.swift
  ↓
Firebase Messaging SDK
  ↓
FCM Token → FCMTokenPlugin.swift
  ↓
JavaScript (service.ts)
  ↓
Supabase (device_tokens table)
  ↓
Edge Function (send-notification)
  ↓
FCM v1 API
  ↓
iOS Device (Notification appears)
```

### Key Components

1. **AppDelegate.swift**: 
   - Registers for APNs
   - Forwards APNs token to Firebase
   - Receives FCM token from Firebase
   - Shows foreground notifications

2. **FCMTokenPlugin.swift**:
   - Bridges FCM token from native to JavaScript
   - Listens for FCM token updates
   - Exposes `getToken()` method

3. **service.ts**:
   - Requests permissions
   - Registers for push notifications
   - Receives APNs token → fetches FCM token
   - Stores FCM token in Supabase
   - Handles notification taps and deep links

4. **send-notification Edge Function**:
   - Fetches FCM tokens from Supabase
   - Sends notifications via FCM v1 API
   - Formats payload for iOS (APNs) and Android

## Additional Resources

- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [Apple Push Notification Service](https://developer.apple.com/documentation/usernotifications)
- [Capacitor Push Notifications Plugin](https://capacitorjs.com/docs/apis/push-notifications)
- [FCM v1 API Reference](https://firebase.google.com/docs/reference/fcm/rest/v1/projects.messages)
