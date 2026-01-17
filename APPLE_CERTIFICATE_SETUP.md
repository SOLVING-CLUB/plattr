# How to Use a New Certificate from Apple Developer Account

This guide walks you through using a new certificate created in Apple Developer Portal for your iOS project.

## Prerequisites

- Apple Developer Account (Individual or Organization)
- Xcode installed on your Mac
- Access to Apple Developer Portal (developer.apple.com)

## Step 1: Download the Certificate from Apple Developer

### 1.1 Access Apple Developer Portal

1. Go to [developer.apple.com](https://developer.apple.com)
2. Sign in with your Apple Developer account
3. Navigate to **Certificates, Identifiers & Profiles**

### 1.2 Download the Certificate

1. Click on **Certificates** in the left sidebar
2. Find your certificate (Development or Distribution)
3. Click on the certificate name
4. Click **Download** button
5. The certificate file (`.cer`) will download to your Mac

**Note**: 
- **Development Certificate**: For development and testing on devices
- **Distribution Certificate**: For App Store and TestFlight builds

## Step 2: Install the Certificate in Keychain Access

### 2.1 Open Keychain Access

1. Open **Keychain Access** app on your Mac
   - Press `⌘ + Space` and type "Keychain Access"
   - Or go to **Applications** → **Utilities** → **Keychain Access**

### 2.2 Install the Certificate

1. Double-click the downloaded `.cer` file
2. Keychain Access will open automatically
3. The certificate will be installed in your **login** keychain
4. You should see it under **My Certificates** in Keychain Access

### 2.3 Verify Installation

1. In Keychain Access, select **My Certificates** from the left sidebar
2. Look for your certificate (it should show your name/team name)
3. Double-click it to view details
4. Verify it shows:
   - ✅ **Valid** status
   - Your Apple Developer Team ID
   - Expiration date

## Step 3: Create/Update Provisioning Profile

### 3.1 Create Provisioning Profile in Apple Developer Portal

1. Go back to Apple Developer Portal
2. Click on **Profiles** in the left sidebar
3. Click the **+** button to create a new profile

### 3.2 Configure the Profile

**For Development:**
1. Select **iOS App Development**
2. Click **Continue**
3. Select your **App ID** (`com.caterplanner.app`)
4. Select the **certificate** you just installed
5. Select **devices** you want to test on
6. Give it a name (e.g., "Plattr Development")
7. Click **Generate**
8. Click **Download**

**For Distribution (App Store/TestFlight):**
1. Select **App Store** or **Ad Hoc**
2. Click **Continue**
3. Select your **App ID** (`com.caterplanner.app`)
4. Select your **Distribution certificate**
5. (For Ad Hoc) Select devices
6. Give it a name (e.g., "Plattr Distribution")
7. Click **Generate**
8. Click **Download**

### 3.3 Install Provisioning Profile

1. Double-click the downloaded `.mobileprovision` file
2. Xcode will automatically install it
3. Or manually install:
   - Open **Xcode**
   - Go to **Xcode** → **Preferences** → **Accounts**
   - Select your Apple ID
   - Click **Download Manual Profiles**

## Step 4: Configure Xcode Project

### 4.1 Open Project in Xcode

```bash
cd /Users/bhanu/Desktop/Plattr/plattr
open ios/App/App.xcworkspace
```

**Important**: Always open `.xcworkspace`, not `.xcodeproj`

### 4.2 Configure Signing & Capabilities

1. In Xcode, select your **project** in the navigator (top item)
2. Select the **App** target
3. Go to **Signing & Capabilities** tab

### 4.3 Choose Signing Method

**Option A: Automatic Signing (Recommended for Development)**

1. Check ✅ **Automatically manage signing**
2. Select your **Team** from the dropdown
   - Should show: `P26XR79ACP (Your Team Name)`
3. Xcode will automatically:
   - Select the correct certificate
   - Create/update provisioning profiles
   - Handle signing

**Option B: Manual Signing (Current Setup)**

Your project is currently configured for **Manual Signing**:

1. Uncheck **Automatically manage signing**
2. Under **Signing Certificate**, select:
   - **Debug**: `Apple Development` or your development certificate name
   - **Release**: `Apple Distribution` or your distribution certificate name
3. Under **Provisioning Profile**, select:
   - **Debug**: Your development profile (e.g., "Plattr Development")
   - **Release**: Your distribution profile (e.g., "Plattr Distribution")

### 4.4 Verify Bundle Identifier

Ensure the **Bundle Identifier** matches your App ID:
- Should be: `com.caterplanner.app`
- Found in: **Signing & Capabilities** → **Bundle Identifier**

### 4.5 Verify Capabilities

Ensure these capabilities are enabled:
- ✅ **Push Notifications**
- ✅ **Background Modes** (with Remote notifications enabled)

## Step 5: Clean and Rebuild

### 5.1 Clean Build Folder

1. In Xcode, go to **Product** → **Clean Build Folder** (⇧⌘K)
2. This removes cached build artifacts

### 5.2 Update Provisioning Profiles in Xcode

1. Go to **Xcode** → **Preferences** → **Accounts**
2. Select your Apple ID
3. Click **Download Manual Profiles** (if using manual signing)
4. Or let Xcode automatically manage (if using automatic signing)

### 5.3 Build and Run

1. Connect your iOS device via USB
2. Select your device in Xcode's device selector
3. Click **Run** (▶️) or press **⌘R**

## Step 6: Verify Certificate is Working

### 6.1 Check Build Log

1. After building, check the build log in Xcode
2. Look for: `CodeSign` entries
3. Should show: `Signing Identity: "Apple Development: Your Name"` or `"Apple Distribution"`

### 6.2 Check Device Installation

1. The app should install on your device
2. If you see signing errors, check:
   - Certificate is valid and not expired
   - Provisioning profile matches the certificate
   - Device UDID is in the provisioning profile (for development)

## Troubleshooting

### Error: "No signing certificate found"

**Solution:**
1. Verify certificate is installed in Keychain Access
2. Check certificate hasn't expired
3. In Xcode, go to **Preferences** → **Accounts** → Select team → **Download Manual Profiles**

### Error: "Provisioning profile doesn't match"

**Solution:**
1. Ensure provisioning profile includes your certificate
2. Ensure Bundle ID matches (`com.caterplanner.app`)
3. Download and reinstall the provisioning profile

### Error: "Device not registered"

**Solution:**
1. Add device UDID to Apple Developer Portal
2. Update provisioning profile to include the device
3. Download and reinstall the updated profile

### Certificate Expired

**Solution:**
1. Create a new certificate in Apple Developer Portal
2. Download and install it
3. Create a new provisioning profile with the new certificate
4. Update Xcode to use the new profile

## Current Project Configuration

Your project is currently set to:
- **Code Sign Style**: Manual
- **Development Team**: `P26XR79ACP`
- **Provisioning Profile Specifier**: `Plattr`
- **Bundle Identifier**: `com.caterplanner.app`

## Quick Reference Commands

```bash
# Sync Capacitor and open Xcode
npm run ios:sync
open ios/App/App.xcworkspace

# Clean build
# In Xcode: Product → Clean Build Folder (⇧⌘K)

# View certificates in Keychain
open /Applications/Utilities/Keychain\ Access.app
```

## Additional Resources

- [Apple Developer Certificates Guide](https://developer.apple.com/support/certificates/)
- [Xcode Code Signing Guide](https://developer.apple.com/documentation/xcode/managing-your-app-s-signing-assets)
- [Provisioning Profiles Guide](https://developer.apple.com/documentation/xcode/managing-provisioning-profiles)
