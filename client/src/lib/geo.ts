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

export async function checkExploreMenuAccess(): Promise<{
  status: GeoStatus;
  distance?: number;
  error?: string;
}> {
  if (!navigator.geolocation) {
    return { status: 'unavailable', error: 'Geolocation not supported' };
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
        
        if (distance <= EXPLORE_MENU_RADIUS_KM) {
          resolve({ status: 'in-range', distance });
        } else {
          resolve({ status: 'out-of-range', distance });
        }
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          resolve({ status: 'denied', error: 'Location permission denied' });
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          resolve({ status: 'unavailable', error: 'Location unavailable' });
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
