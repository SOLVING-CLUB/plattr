// Delivery radius utilities (server-side)
// Computes distance between two coordinates and checks if within a given radius.

// Haversine formula to calculate distance between two lat/lon points in kilometers
export function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Restaurant location (Plattr kitchen) - replace with dynamic config if needed
export const RESTAURANT_COORDS = {
  lat: 12.850257,
  lng: 77.650970
} as const;

export function isWithinRadius(customerLat: number, customerLng: number, radiusKm: number = 5): boolean {
  const dist = haversineDistanceKm(RESTAURANT_COORDS.lat, RESTAURANT_COORDS.lng, customerLat, customerLng);
  return dist <= radiusKm;
}
