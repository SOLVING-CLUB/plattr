import type { CapacitorConfig } from '@capacitor/cli';

// Check if we're in development mode
// You can set CAPACITOR_DEV=true to enable dev server connection
const isDev = process.env.CAPACITOR_DEV === 'true' || process.env.NODE_ENV === 'development';

// Get local IP for Android emulator development
// Android emulator uses 10.0.2.2 to access host machine's localhost
const getDevServerUrl = () => {
  if (isDev) {
    const port = process.env.PORT || '3000';
    // For Android emulator, use 10.0.2.2 which maps to host's localhost
    // For physical devices, you'll need your actual local IP (e.g., 10.157.207.230)
    return `http://10.0.2.2:${port}`;
  }
  return undefined;
};

const config: CapacitorConfig = {
  appId: 'com.caterplanner.app',
  appName: 'Plattr',
  webDir: 'dist/public',
  server: isDev
    ? {
        url: getDevServerUrl(),
        androidScheme: 'http',
        cleartext: true, // Allow HTTP in development
      }
    : {
        androidScheme: 'https'
      }
};

export default config;
