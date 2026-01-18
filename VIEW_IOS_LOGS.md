# How to View iOS Logs on Real Device

## ⚠️ Important: Use Real Device, Not Simulator

**Push notifications DO NOT work in iOS Simulator.** You **must** use a real iOS device for testing APNs/FCM notifications.

---

## Method 1: Xcode Console (Recommended for Native Logs)

### Setup:
1. Connect your iOS device via USB to your Mac
2. Open Xcode workspace:
   ```bash
   open ios/App/App.xcworkspace
   ```
3. Select your device in Xcode's device selector (top toolbar)
4. Run the app from Xcode (⌘R) or build and install

### View Logs:
1. In Xcode, open the **Debug Area**:
   - **View** → **Debug Area** → **Show Debug Area**
   - Or press **⇧⌘Y** (Shift + Command + Y)
2. The console will show all `print()` statements from Swift code
3. Look for logs like:
   - `[Plattr] 📨 Notification received in foreground`
   - `[Plattr] ✅ APNs device token received`
   - `[Plattr] 🔔 FCM token received`

### Filter Logs:
- Click the filter box at the bottom of the console
- Type `[Plattr]` to see only your app's logs

---

## Method 2: Safari Web Inspector (For JavaScript Logs)

### Setup:
1. **On Mac**: Safari → **Preferences** → **Advanced** → Enable **"Show Develop menu"**
2. **On iOS Device**: Settings → **Safari** → **Advanced** → Enable **"Web Inspector"**
3. Connect device via USB
4. Run the app on device

### View Logs:
1. In Safari: **Develop** → **[Your Device Name]** → **[Your App]**
2. This opens a new window with:
   - **Console tab**: JavaScript console logs
   - **Network tab**: API requests
   - **Sources tab**: Debug JavaScript code
3. Look for logs like:
   - `[Notifications] ✅ Token inserted successfully`
   - `[Notifications] iOS FCM token received`
   - `[Test Notification] 📤 Calling Edge Function...`

---

## Method 3: Device Console (System-Level Logs)

### Setup:
1. Connect device via USB
2. Open **Console.app** (Applications → Utilities → Console)

### View Logs:
1. Select your device from the sidebar
2. Filter by your app name or search for `[Plattr]`
3. This shows system-level logs including crash reports

---

## Quick Test Checklist

1. ✅ Connect device via USB
2. ✅ Open Xcode: `open ios/App/App.xcworkspace`
3. ✅ Select device and run (⌘R)
4. ✅ Keep Xcode open, watch console
5. ✅ In app, tap "Send Test Notification"
6. ✅ Look for: `[Plattr] 📨 Notification received in foreground`

### What to Look For:

**✅ Good Signs:**
- `[Plattr] 📨 Notification received in foreground` → Notification reached the app
- `[Plattr] ✅ Notification will be displayed` → iOS will show it
- `[Notifications] ✅ Token inserted successfully` → Token registered

**❌ Bad Signs:**
- No `[Plattr] 📨 Notification received` → APNs not delivering (check Firebase APNs config)
- `[Plattr] ❌ Failed to register` → APNs registration failed (check entitlements)
- `[Notifications] ❌ Token registration failed` → Backend issue (check Supabase)

---

## Troubleshooting

### No Logs Appearing?
- Make sure device is connected via USB (not just WiFi)
- Check that Xcode recognizes your device (should show in device selector)
- Try unplugging and replugging USB cable
- Restart Xcode

### Can't See JavaScript Logs?
- Make sure Web Inspector is enabled on device (Settings → Safari → Advanced)
- Make sure Develop menu is enabled in Safari (Preferences → Advanced)
- Try closing and reopening Safari

### Logs Too Noisy?
- Use Xcode console filter: Type `[Plattr]` in the filter box
- Or use Safari console filter: Type your search term in the filter box

---

## Pro Tips

1. **Keep Xcode Console Open**: It's the easiest way to see native logs
2. **Use Both Methods**: Xcode for Swift logs, Safari for JavaScript logs
3. **Filter is Your Friend**: Use `[Plattr]` to filter your app's logs
4. **Watch for Errors**: Red text in Xcode console = errors to investigate
