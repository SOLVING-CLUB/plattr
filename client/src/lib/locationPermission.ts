/**
 * Location Permission Utility
 * Provides centralized location permission checking and handling
 * Supports both web (browser API) and native mobile apps (Capacitor Geolocation)
 */

import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

export type LocationPermissionStatus = 'granted' | 'denied' | 'prompt' | 'unsupported';

export interface LocationPermissionResult {
  status: LocationPermissionStatus;
  canRequest: boolean;
  message?: string;
}

export interface GetCurrentPositionOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export interface LocationResult {
  success: boolean;
  position?: GeolocationPosition;
  error?: {
    code: number;
    message: string;
    userFriendlyMessage: string;
  };
}

/**
 * Check location permission status using Permissions API (if available)
 * Falls back to checking via geolocation API if Permissions API is not supported
 * Uses Capacitor Geolocation for native apps
 */
export async function checkLocationPermission(): Promise<LocationPermissionResult> {
  // Use Capacitor Geolocation for native apps
  if (isNativePlatform()) {
    try {
      const status = await Geolocation.checkPermissions();
      
      switch (status.location) {
        case 'granted':
          return {
            status: 'granted',
            canRequest: true,
            message: 'Location access is granted',
          };
        case 'denied':
          return {
            status: 'denied',
            canRequest: false,
            message: 'Location access is denied. Please enable it in your device settings.',
          };
        case 'prompt':
        default:
          return {
            status: 'prompt',
            canRequest: true,
            message: 'Location permission will be requested',
          };
      }
    } catch (error) {
      console.warn('Capacitor permission check failed:', error);
      return {
        status: 'prompt',
        canRequest: true,
        message: 'Location permission can be requested',
      };
    }
  }

  // Use browser Permissions API for web
  // Check if geolocation is supported
  if (!navigator.geolocation) {
    return {
      status: 'unsupported',
      canRequest: false,
      message: 'Geolocation is not supported by your browser',
    };
  }

  // Try to use Permissions API (modern browsers)
  if ('permissions' in navigator) {
    try {
      const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      
      switch (result.state) {
        case 'granted':
          return {
            status: 'granted',
            canRequest: true,
            message: 'Location access is granted',
          };
        case 'denied':
          return {
            status: 'denied',
            canRequest: false,
            message: 'Location access is denied. Please enable it in your browser settings.',
          };
        case 'prompt':
          return {
            status: 'prompt',
            canRequest: true,
            message: 'Location permission will be requested',
          };
        default:
          return {
            status: 'prompt',
            canRequest: true,
            message: 'Location permission status unknown',
          };
      }
    } catch (error) {
      // Permissions API might not be fully supported, fall through to geolocation check
      console.warn('Permissions API query failed:', error);
    }
  }

  // Fallback: Assume we can request (prompt state)
  // We can't reliably check denied status without Permissions API
  return {
    status: 'prompt',
    canRequest: true,
    message: 'Location permission can be requested',
  };
}

/**
 * Check if running in Capacitor native environment
 */
function isNativePlatform(): boolean {
  return Capacitor?.isNativePlatform?.() ?? false;
}

/**
 * Get user's current position with improved error handling
 * Uses Capacitor Geolocation plugin for native apps, browser API for web
 */
export async function getCurrentPosition(
  options: GetCurrentPositionOptions = {}
): Promise<LocationResult> {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 0,
  } = options;

  // Use Capacitor Geolocation for native apps (Android/iOS)
  if (isNativePlatform()) {
    try {
      // Request permissions first (required for native apps)
      const permissionStatus = await Geolocation.checkPermissions();
      
      if (permissionStatus.location !== 'granted') {
        // Request permission if not granted
        const requestResult = await Geolocation.requestPermissions();
        
        if (requestResult.location !== 'granted') {
          return {
            success: false,
            error: {
              code: 1,
              message: 'Permission denied',
              userFriendlyMessage: 'Location permission was denied. Please enable location access in your device settings:\n\n' +
                '• Android: Settings → Apps → Plattr → Permissions → Location\n' +
                '• iOS: Settings → Privacy → Location Services → Plattr',
            },
          };
        }
      }

      // Get current position using Capacitor Geolocation
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy,
        timeout,
        maximumAge,
      });

      // Convert Capacitor position to browser GeolocationPosition format
      const browserPosition: GeolocationPosition = {
        coords: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          altitude: position.coords.altitude ?? null,
          accuracy: position.coords.accuracy,
          altitudeAccuracy: position.coords.altitudeAccuracy ?? null,
          heading: position.coords.heading ?? null,
          speed: position.coords.speed ?? null,
        },
        timestamp: position.timestamp,
      };

      return {
        success: true,
        position: browserPosition,
      };
    } catch (error: any) {
      console.error('Capacitor Geolocation error:', error);
      
      let userFriendlyMessage = 'Could not get your location. Please try again or enter your address manually.';
      let errorCode = 0;

      if (error.message?.includes('permission') || error.message?.includes('denied')) {
        errorCode = 1;
        userFriendlyMessage = 'Location permission was denied. Please enable location access in your device settings:\n\n' +
          '• Android: Settings → Apps → Plattr → Permissions → Location\n' +
          '• iOS: Settings → Privacy → Location Services → Plattr';
      } else if (error.message?.includes('unavailable')) {
        errorCode = 2;
        userFriendlyMessage = 'Location information is unavailable. Please check your device settings or enter your address manually.';
      } else if (error.message?.includes('timeout')) {
        errorCode = 3;
        userFriendlyMessage = 'Location request timed out. Please try again or enter your address manually.';
      }

      return {
        success: false,
        error: {
          code: errorCode,
          message: error.message || 'Unknown error',
          userFriendlyMessage,
        },
      };
    }
  }

  // Use browser Geolocation API for web
  // Check if geolocation is supported
  if (!navigator.geolocation) {
    return {
      success: false,
      error: {
        code: 0,
        message: 'Geolocation is not supported',
        userFriendlyMessage: 'Your browser does not support location services. Please use a modern browser or enter your address manually.',
      },
    };
  }

  // Check permission status first
  const permissionCheck = await checkLocationPermission();
  
  if (permissionCheck.status === 'denied') {
    return {
      success: false,
      error: {
        code: 1,
        message: 'Permission denied',
        userFriendlyMessage: 'Location access is denied. Please enable location permissions in your browser settings and try again.',
      },
    };
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          success: true,
          position,
        });
      },
      (error) => {
        let userFriendlyMessage = 'Could not get your location. Please try again or enter your address manually.';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            userFriendlyMessage = 'Location permission was denied. Please enable location access in your browser settings:\n\n' +
              '• Chrome/Edge: Settings → Privacy → Site Settings → Location\n' +
              '• Firefox: Preferences → Privacy → Permissions → Location\n' +
              '• Safari: Preferences → Websites → Location';
            break;
          case error.POSITION_UNAVAILABLE:
            userFriendlyMessage = 'Location information is unavailable. Please check your device settings or enter your address manually.';
            break;
          case error.TIMEOUT:
            userFriendlyMessage = 'Location request timed out. Please try again or enter your address manually.';
            break;
        }

        resolve({
          success: false,
          error: {
            code: error.code,
            message: error.message,
            userFriendlyMessage,
          },
        });
      },
      {
        enableHighAccuracy,
        timeout,
        maximumAge,
      }
    );
  });
}

/**
 * Request location permission explicitly (useful for showing user-friendly prompts)
 * This will trigger the browser's permission prompt
 */
export async function requestLocationPermission(): Promise<LocationPermissionResult> {
  const permissionCheck = await checkLocationPermission();
  
  if (permissionCheck.status === 'granted') {
    return permissionCheck;
  }

  if (permissionCheck.status === 'denied') {
    return {
      ...permissionCheck,
      message: 'Location permission is permanently denied. Please enable it manually in your browser settings.',
    };
  }

  // For 'prompt' status, we need to actually request it by calling getCurrentPosition
  // But we'll return the current status and let the caller handle the request
  return permissionCheck;
}

/**
 * Get instructions for enabling location permission based on platform
 */
export function getLocationPermissionInstructions(): string {
  // Check if running in native app
  if (isNativePlatform()) {
    const platform = Capacitor.getPlatform();
    
    if (platform === 'android') {
      return 'To enable location:\n1. Open Android Settings\n2. Go to Apps → Plattr → Permissions\n3. Enable Location permission\n4. Return to the app';
    } else if (platform === 'ios') {
      return 'To enable location:\n1. Open iOS Settings\n2. Go to Privacy → Location Services\n3. Find Plattr and select "While Using App"\n4. Return to the app';
    }
    
    return 'Please enable location permissions in your device settings';
  }

  // Browser instructions
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (userAgent.includes('chrome') || userAgent.includes('edge')) {
    return 'To enable location:\n1. Click the lock icon in the address bar\n2. Select "Location" → "Allow"\n3. Refresh the page';
  } else if (userAgent.includes('firefox')) {
    return 'To enable location:\n1. Click the shield icon in the address bar\n2. Select "Permissions" → "Allow" for Location\n3. Refresh the page';
  } else if (userAgent.includes('safari')) {
    return 'To enable location:\n1. Go to Safari → Preferences → Websites → Location\n2. Find this site and select "Allow"\n3. Refresh the page';
  }
  
  return 'Please enable location permissions in your browser settings and refresh the page';
}

