import { Capacitor } from "@capacitor/core";

// API Configuration for mobile and web builds

// Default backend URL used only when running inside a native shell and no VITE_API_URL is provided
// For iOS simulator, localhost points to the Mac; for Android emulator, use 10.0.2.2 to reach host.
function getDefaultNativeBackend(): string {
  if (Capacitor?.getPlatform?.() === 'android') {
    // Android emulator: host machine is 10.0.2.2
    return 'http://10.0.2.2:3000';
  }
  // iOS simulator / other native: localhost is fine
  return 'http://localhost:3000';
}

// Production backend URL for mobile access (Capacitor). Must be HTTPS in production.
// Set VITE_API_URL to override the default when you deploy the API elsewhere.
const CONFIGURED_BACKEND = import.meta.env.VITE_API_URL;

// Detect if running in Capacitor (mobile app)
// Prefer Capacitor APIs so this works even when using live-reload over http://<dev-ip>
function isCapacitor(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  // Capacitor v5+ provides a reliable API to detect native platforms
  if (Capacitor?.isNativePlatform?.()) {
    return true;
  }

  // Fallback for older versions / dev servers
  const protocol = window.location.protocol;
  const hasCapacitor = !!(window as any).Capacitor;
  const isCapacitorProtocol = protocol === 'capacitor:' || protocol === 'ionic:';

  return hasCapacitor && isCapacitorProtocol;
}

export function getApiUrl(path: string): string {
  // Ensure path starts with /
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  // Determine base URL:
  // - For mobile apps (Capacitor), use full backend URL
  // - For web development and production, use relative URLs (same origin)
  //   This works because the server serves both API and client on the same port
  const isMobile = isCapacitor();
  
  let baseUrl = '';
  if (isMobile) {
    // Mobile: use configured backend URL or fall back to local dev server
    baseUrl = CONFIGURED_BACKEND || getDefaultNativeBackend();
  } else {
    // Web (dev and prod): baseUrl stays empty (relative URLs - same origin)
    // This avoids CORS issues since API and client are on the same origin
    baseUrl = '';
  }
  
  const fullUrl = `${baseUrl}${cleanPath}`;
  
  console.log('[Plattr API] Path:', path, '→ Full URL:', fullUrl, 'isMobile:', isMobile, 'window.location:', window.location.origin);
  
  return fullUrl;
}

