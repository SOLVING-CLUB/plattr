import { getCurrentPosition } from './locationPermission';

// 60-minute delivery service area coordinates
// Each coordinate represents a service center with a 5km radius
// TODO: Add more coordinates as service areas expand
export const SIXTY_MIN_SERVICE_COORDINATES: Array<{ lat: number; lng: number }> = [
  // Sample coordinate - replace with actual coordinates
  { lat: 12.850257, lng: 77.650970 },
  // Add more coordinates here as needed:
  // { lat: 12.XXXXX, lng: 77.XXXXX },
  // { lat: 12.XXXXX, lng: 77.XXXXX },
];

// Legacy single coordinate (kept for backward compatibility)
export const EXPLORE_MENU_CENTER = SIXTY_MIN_SERVICE_COORDINATES[0] || {
  lat: 12.850257,
  lng: 77.650970,
};

export const EXPLORE_MENU_RADIUS_KM = 5;

export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Check if a location is within 5km radius of any 60-minute service coordinate
 * @param lat Latitude of the location to check
 * @param lng Longitude of the location to check
 * @returns true if within 5km of any service coordinate, false otherwise
 */
export function isWithinExploreMenuRadius(lat: number, lng: number): boolean {
  // Check against all service coordinates
  for (const center of SIXTY_MIN_SERVICE_COORDINATES) {
    const distance = haversineDistance(
      lat,
      lng,
      center.lat,
      center.lng
    );
    if (distance <= EXPLORE_MENU_RADIUS_KM) {
      return true;
    }
  }
  return false;
}

/**
 * Get the minimum distance from a location to any 60-minute service coordinate
 * @param lat Latitude of the location to check
 * @param lng Longitude of the location to check
 * @returns Minimum distance in kilometers
 */
export function getMinDistanceToServiceArea(lat: number, lng: number): number {
  if (SIXTY_MIN_SERVICE_COORDINATES.length === 0) {
    return Infinity;
  }
  
  let minDistance = Infinity;
  for (const center of SIXTY_MIN_SERVICE_COORDINATES) {
    const distance = haversineDistance(
      lat,
      lng,
      center.lat,
      center.lng
    );
    if (distance < minDistance) {
      minDistance = distance;
    }
  }
  return minDistance;
}

export type GeoStatus = 
  | 'pending'
  | 'checking'
  | 'in-range'
  | 'out-of-range'
  | 'denied'
  | 'unavailable'
  | 'error';

interface SavedLocation {
  lat?: number;
  lng?: number;
  addressLine?: string;
  label?: string;
}

function getSavedAddressData(): SavedLocation | null {
  try {
    const activeLocation = localStorage.getItem('activeLocation');
    if (activeLocation) {
      const parsed = JSON.parse(activeLocation);
      console.log('Active location data:', parsed);
      return parsed;
    }
  } catch (e) {
    console.error('Error parsing saved address:', e);
  }
  return null;
}

/**
 * Geocode an address string to get latitude and longitude coordinates
 * @param address The address string to geocode
 * @returns Coordinates object with lat and lng, or null if geocoding fails
 */
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  // Try multiple search strategies
  const searchQueries = [
    address,
    // Try extracting key parts - look for area name + city
    address.replace(/\d+[-/]?\d*[-/]?\d*/g, '').trim(), // Remove house numbers
    address.split(',').slice(-3).join(',').trim(), // Last 3 parts (area, city, state)
  ];
  
  for (const query of searchQueries) {
    if (!query || query.length < 5) continue;
    
    try {
      console.log('Trying geocode query:', query);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=1`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        console.log('Geocoding successful:', { lat: data[0].lat, lon: data[0].lon });
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        };
      }
    } catch (e) {
      console.error('Geocoding attempt failed:', e);
    }
  }
  
  return null;
}

export async function checkExploreMenuAccess(): Promise<{
  status: GeoStatus;
  distance?: number;
  error?: string;
}> {
  const savedData = getSavedAddressData();
  
  if (savedData) {
    let coords: { lat: number; lng: number } | null = null;
    
    if (savedData.lat && savedData.lng) {
      coords = { lat: savedData.lat, lng: savedData.lng };
    } else if (savedData.addressLine || savedData.label) {
      // Use label first (shorter and cleaner), fallback to first part of addressLine
      let addressToGeocode = savedData.label || '';
      if (!addressToGeocode && savedData.addressLine) {
        // Take only the first occurrence if address is duplicated
        addressToGeocode = savedData.addressLine.split(',').slice(0, 5).join(',');
      }
      console.log('Geocoding address:', addressToGeocode);
      coords = await geocodeAddress(addressToGeocode);
    }
    
    if (coords) {
      const distance = haversineDistance(
        coords.lat,
        coords.lng,
        EXPLORE_MENU_CENTER.lat,
        EXPLORE_MENU_CENTER.lng
      );
      
      console.log('Checking address coordinates:', coords, 'Distance:', distance);
      
      if (distance <= EXPLORE_MENU_RADIUS_KM) {
        return { status: 'in-range', distance };
      } else {
        return { status: 'out-of-range', distance };
      }
    }
  }

  // Try to get current position using improved permission handling
  const result = await getCurrentPosition({
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 60000,
  });

  if (result.success && result.position) {
    const { latitude, longitude } = result.position.coords;
    const distance = getMinDistanceToServiceArea(latitude, longitude);
    
    console.log('Checking browser geolocation:', { latitude, longitude }, 'Min distance:', distance);
    
    if (distance <= EXPLORE_MENU_RADIUS_KM) {
      return { status: 'in-range', distance };
    } else {
      return { status: 'out-of-range', distance };
    }
  } else {
    // Handle errors
    if (result.error?.code === 1) {
      return { status: 'denied', error: 'Please select a delivery address or enable location access' };
    } else if (result.error?.code === 2) {
      return { status: 'unavailable', error: 'Please select a delivery address' };
    } else {
      return { status: 'error', error: result.error?.message || 'Location access failed' };
    }
  }
}
