export const EXPLORE_MENU_CENTER = {
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

export function isWithinExploreMenuRadius(lat: number, lng: number): boolean {
  const distance = haversineDistance(
    lat,
    lng,
    EXPLORE_MENU_CENTER.lat,
    EXPLORE_MENU_CENTER.lng
  );
  return distance <= EXPLORE_MENU_RADIUS_KM;
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

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=in&limit=1`
    );
    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    }
  } catch (e) {
    console.error('Geocoding failed:', e);
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
      const addressToGeocode = savedData.addressLine || savedData.label || '';
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

  if (!navigator.geolocation) {
    return { status: 'unavailable', error: 'Please select a delivery address first' };
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const distance = haversineDistance(
          latitude,
          longitude,
          EXPLORE_MENU_CENTER.lat,
          EXPLORE_MENU_CENTER.lng
        );
        
        console.log('Checking browser geolocation:', { latitude, longitude }, 'Distance:', distance);
        
        if (distance <= EXPLORE_MENU_RADIUS_KM) {
          resolve({ status: 'in-range', distance });
        } else {
          resolve({ status: 'out-of-range', distance });
        }
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          resolve({ status: 'denied', error: 'Please select a delivery address or enable location access' });
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          resolve({ status: 'unavailable', error: 'Please select a delivery address' });
        } else {
          resolve({ status: 'error', error: error.message });
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  });
}
