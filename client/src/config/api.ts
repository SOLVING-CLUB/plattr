// API Configuration for mobile and web builds

// Production backend URL for mobile access (Capacitor). Must be HTTPS.
// Set VITE_API_URL in your env for builds; fallback is localhost for development.
const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Detect if running in Capacitor (mobile app)
// Proper detection: check for Capacitor object AND ensure we're not in a web browser
function isCapacitor(): boolean {
  // If we're on localhost in a browser, we're definitely not in a mobile app
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // In development, always use web mode (relative URLs) to avoid CORS
    return false;
  }
  
  // Check for Capacitor, but also verify we're not in a standard web browser
  const hasCapacitor = !!(window as any).Capacitor;
  const isWebProtocol = window.location.protocol === 'http:' || window.location.protocol === 'https:';
  const isCapacitorProtocol = window.location.protocol === 'capacitor:' || window.location.protocol === 'ionic:';
  
  // Only return true if Capacitor exists AND we're using a Capacitor protocol
  return hasCapacitor && (isCapacitorProtocol || !isWebProtocol);
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
    // Mobile: use full backend URL (must be HTTPS in production)
    baseUrl = BACKEND_URL;
  } else {
    // Web (dev and prod): baseUrl stays empty (relative URLs - same origin)
    // This avoids CORS issues since API and client are on the same origin
    baseUrl = '';
  }
  
  const fullUrl = `${baseUrl}${cleanPath}`;
  
  console.log('[Plattr API] Path:', path, '→ Full URL:', fullUrl, 'isMobile:', isMobile, 'window.location:', window.location.origin);
  
  return fullUrl;
}
