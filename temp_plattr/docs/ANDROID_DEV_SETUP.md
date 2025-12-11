# Android Emulator Development Setup

This guide shows you how to develop the splash screen (and other features) directly in the Android emulator with live reload.

## Quick Start

### 1. Start the Dev Server

In one terminal, start your development server:

```bash
npm run dev
```

This will start the server at `http://localhost:3000` (or your configured PORT).

### 2. Run on Android Emulator with Dev Server

In another terminal, run:

```bash
npm run android:dev
```

This will:
- Sync Capacitor config (pointing to dev server)
- Launch the app on the emulator
- Connect to your local dev server for live reload

## How It Works

The Android emulator uses a special IP address `10.0.2.2` that maps to your host machine's `localhost`. 

When you run `npm run android:dev`:
1. Capacitor config is set to connect to `http://10.0.2.2:3000`
2. The app loads from your dev server instead of bundled files
3. Changes to `SplashScreen.tsx` will hot-reload in the emulator!

## Development Workflow

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Edit your splash screen:**
   - Open `client/src/components/SplashScreen.tsx`
   - Make changes
   - Save the file

3. **See changes instantly:**
   - The emulator will automatically reload
   - Your changes appear immediately
   - No need to rebuild!

4. **To test splash screen:**
   - The splash screen stays open in dev mode (see `App.tsx`)
   - Click anywhere or press ESC to dismiss
   - Refresh the app to see it again

## Troubleshooting

### App shows blank screen
- Make sure `npm run dev` is running
- Check that the server is accessible at `http://localhost:3000`
- Verify the emulator is running

### Changes not appearing
- Make sure you're running `npm run android:dev` (not `android:run`)
- Check that `CAPACITOR_DEV=true` is set
- Try restarting the dev server

### Can't connect to dev server
- Verify your dev server is running: `npm run dev`
- Check the port (default is 3000)
- Make sure the emulator is running

## Switching Between Dev and Production

**Development mode (uses dev server):**
```bash
npm run android:dev
```

**Production mode (uses bundled files):**
```bash
npm run android:run
```

## For Physical Devices

If you want to test on a physical Android device:

1. Find your computer's local IP:
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

2. Update `capacitor.config.ts` to use your IP instead of `10.0.2.2`:
   ```typescript
   return `http://YOUR_LOCAL_IP:3000`;
   ```

3. Make sure your phone and computer are on the same WiFi network

4. Run `npm run android:dev`

## Files

- **Capacitor Config:** `capacitor.config.ts` - Controls dev server connection
- **Splash Screen:** `client/src/components/SplashScreen.tsx` - Edit this file
- **Splash Behavior:** `client/src/App.tsx` - Controls when splash shows/hides

