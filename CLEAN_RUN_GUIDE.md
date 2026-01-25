# Clean Run Guide for Plattr App

## Quick Clean Run (Recommended)

```bash
# 1. Remove node_modules and lock files
rm -rf node_modules
rm -f package-lock.json yarn.lock pnpm-lock.yaml

# 2. Remove build artifacts
rm -rf dist
rm -rf server/public
rm -rf .vite
rm -rf client/dist

# 3. Clear Capacitor build artifacts
rm -rf android/app/build
rm -rf ios/App/build
rm -rf ios/Pods
rm -rf ios/Podfile.lock

# 4. Reinstall dependencies
npm install

# 5. Run the development server
npm run dev
```

## Step-by-Step Clean Run

### Option 1: Complete Clean (Most Thorough)

```bash
# Clean all dependencies and build artifacts
rm -rf node_modules
rm -rf dist
rm -rf server/public
rm -rf .vite
rm -rf android/app/build
rm -rf ios/App/build
rm -rf ios/Pods
rm -rf ios/Podfile.lock
rm -f package-lock.json

# Reinstall everything
npm install

# Start dev server
npm run dev
```

### Option 2: Quick Clean (Faster)

```bash
# Just remove build artifacts and reinstall
rm -rf dist server/public .vite
npm install
npm run dev
```

### Option 3: iOS Clean Build

```bash
# Clean iOS specific files
rm -rf ios/App/build
rm -rf ios/Pods
rm -rf ios/Podfile.lock

# Reinstall dependencies
npm install

# Sync iOS
npm run ios:sync

# Open in Xcode
npm run android:open  # Actually opens iOS if you have it configured
```

### Option 4: Android Clean Build

```bash
# Clean Android specific files
rm -rf android/app/build
rm -rf android/.gradle

# Reinstall dependencies
npm install

# Sync Android
npm run android:sync

# Open in Android Studio
npm run android:open
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run ios:sync` - Sync iOS Capacitor
- `npm run android:sync` - Sync Android Capacitor
- `npm run android:dev` - Run Android in dev mode
- `npm run android:dev:setup` - Full Android dev setup

## Troubleshooting

### If you encounter module errors:
```bash
rm -rf node_modules package-lock.json
npm install
```

### If build fails:
```bash
rm -rf dist .vite
npm run build
```

### If Capacitor sync fails:
```bash
npm run build
npm run cap:sync
```

## Notes

- The app uses Vite for bundling
- Capacitor is used for mobile (iOS/Android)
- Server runs on port defined in your `.env` file
- Client code is in `/client` directory
- Server code is in `/server` directory
