import { useCallback, useState, useEffect } from "react";
import { useLocation } from "wouter";
import BulkMeals from "@/pages/BulkMeal";
import MealBox from "@/pages/MealBoxPage";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, AlertCircle, ArrowLeft } from "lucide-react";
import ServiceCardSection from "@/pages/ServiceCard";
import mealBoxImage from "@assets/Tiffin_1764989484948.png";
import cateringImage from "@assets/Tiffin5_1764990291688.png";
import bulkMealImage from "@assets/Tiffin8_1764990094179.png";
import corporateImage from "@assets/Tiffin10_1764990422090.png";
import snackboxCardImage from "@assets/snackbox_card.png";
import backgroundImage from "../../../attached_assets/stock_images/house_party_background.png";

type ExploreService = "bulk-meals" | "mealbox";

const SIXTY_MIN_ORDER_FLAG = "isSixtyMinOrder";
const LOCATION_STORAGE_KEY = "activeLocation";
const RECENT_LOCATIONS_KEY = "recentLocations";

// Service area center coordinates
const SERVICE_CENTER_LAT = 12.850257;
const SERVICE_CENTER_LNG = 77.650970;
const SERVICE_RADIUS_KM = 5; // 5km radius

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  // Validate inputs
  if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
    console.error('[calculateDistance] Invalid coordinates:', { lat1, lon1, lat2, lon2 });
    return Infinity; // Return large value to fail validation
  }

  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers

  console.log('[calculateDistance] Calculation:', {
    point1: { lat: lat1, lon: lon1 },
    point2: { lat: lat2, lon: lon2 },
    distanceKm: distance.toFixed(6),
    distanceMeters: (distance * 1000).toFixed(2)
  });

  return distance;
}

export default function ExploreMenuPage() {
  const [, setLocation] = useLocation();

  // Check if navigated from 60-minute delivery CTA
  const [fromSixtyMinCTA, setFromSixtyMinCTA] = useState(false);

  // Effect to handle full-page background visibility
  useEffect(() => {
    const main = document.querySelector('main');
    const layout = document.querySelector('.min-h-screen.bg-gray-50');

    if (main) {
      main.style.backgroundColor = 'transparent';
    }
    if (layout) {
      (layout as HTMLElement).style.backgroundColor = 'transparent';
    }

    return () => {
      if (main) main.style.backgroundColor = '';
      if (layout) (layout as HTMLElement).style.backgroundColor = '';
    };
  }, []);

  // Check if navigated from 60-minute CTA
  useEffect(() => {
    const flag = localStorage.getItem('fromSixtyMinCTA');
    if (flag === 'true') {
      setFromSixtyMinCTA(true);
      // Clear the flag after reading it
      localStorage.removeItem('fromSixtyMinCTA');
    }
  }, []);

  const [selectedService, setSelectedService] = useState<ExploreService>("bulk-meals");
  const [isLocationValid, setIsLocationValid] = useState<boolean | null>(null);
  const [isCheckingLocation, setIsCheckingLocation] = useState(true);
  const [calculatedDistance, setCalculatedDistance] = useState<number | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [forceProceed, setForceProceed] = useState(false);

  // Check if location is within service area
  useEffect(() => {
    const checkLocation = async () => {
      setIsCheckingLocation(true);
      setCalculatedDistance(null);
      setForceProceed(false); // Reset on location change

      try {
        // IF location exists in localStorage
        const savedLocation = localStorage.getItem(LOCATION_STORAGE_KEY);

        if (!savedLocation) {
          console.log('[ExploreMenu] No location found in localStorage');
          setIsLocationValid(false);
          setIsCheckingLocation(false);
          return;
        }

        const locationData = JSON.parse(savedLocation);
        console.log('[ExploreMenu] Location data from storage:', locationData);
        console.log('[ExploreMenu] Raw coordinates:', {
          lat: locationData.lat,
          lng: locationData.lng,
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          latType: typeof locationData.lat,
          lngType: typeof locationData.lng
        });

        // Normalize coordinate property names (support both lat/lng and latitude/longitude)
        let userLat: number | undefined = locationData.lat || locationData.latitude;
        let userLng: number | undefined = locationData.lng || locationData.longitude;
        let coordinatesFound = false; // Flag to track if we found valid coordinates

        console.log('[ExploreMenu] After normalization:', { userLat, userLng });

        // Convert to numbers if they're strings
        if (userLat !== undefined && userLat !== null) {
          userLat = typeof userLat === 'string' ? parseFloat(userLat) : userLat;
        }
        if (userLng !== undefined && userLng !== null) {
          userLng = typeof userLng === 'string' ? parseFloat(userLng) : userLng;
        }

        console.log('[ExploreMenu] After conversion:', { userLat, userLng, latType: typeof userLat, lngType: typeof userLng });

        // IF coordinates exist and valid
        const hasValidCoordinates =
          userLat !== null && userLat !== undefined &&
          userLng !== null && userLng !== undefined &&
          !isNaN(userLat) && !isNaN(userLng) &&
          userLat !== 0 && userLng !== 0 &&
          userLat > -90 && userLat < 90 &&
          userLng > -180 && userLng < 180;

        // Type guard: ensure coordinates are numbers before logging
        const latForLog = userLat !== undefined && userLat !== null ? userLat : null;
        const lngForLog = userLng !== undefined && userLng !== null ? userLng : null;

        console.log('[ExploreMenu] Coordinate validation:', {
          hasValidCoordinates,
          checks: {
            notNull: userLat !== null && userLat !== undefined && userLng !== null && userLng !== undefined,
            notNaN: latForLog !== null && lngForLog !== null && !isNaN(latForLog) && !isNaN(lngForLog),
            notZero: latForLog !== null && lngForLog !== null && latForLog !== 0 && lngForLog !== 0,
            validLatRange: latForLog !== null && latForLog > -90 && latForLog < 90,
            validLngRange: lngForLog !== null && lngForLog > -180 && lngForLog < 180
          }
        });

        if (!hasValidCoordinates) {
          console.warn('[ExploreMenu] Invalid or missing coordinates, checking recent locations first...', {
            userLat,
            userLng,
            latType: typeof userLat,
            lngType: typeof userLng,
            locationLabel: locationData.label,
            locationAddress: locationData.addressLine
          });

          // First, check recent locations for matching address with coordinates
          const savedRecents = localStorage.getItem(RECENT_LOCATIONS_KEY);
          if (savedRecents) {
            try {
              const recentLocations: Array<{ label?: string; addressLine?: string; lat?: number; lng?: number; id?: string; type?: string }> = JSON.parse(savedRecents);
              const addressLineToMatch = locationData.addressLine || locationData.label || '';

              // Try to find a matching recent location with more flexible matching
              const matchingRecent = recentLocations.find((loc) => {
                // Strategy 1: Exact match on addressLine
                if (loc.addressLine && addressLineToMatch && loc.addressLine === addressLineToMatch) {
                  console.log('[ExploreMenu] Found exact addressLine match in recent locations');
                  return true;
                }

                // Strategy 2: Exact match on label
                if (loc.label && locationData.label && loc.label === locationData.label) {
                  console.log('[ExploreMenu] Found exact label match in recent locations');
                  return true;
                }

                // Strategy 3: Match by saved address ID
                if (loc.id && locationData.id && loc.id === locationData.id && loc.type === 'saved') {
                  console.log('[ExploreMenu] Found match by saved address ID in recent locations');
                  return true;
                }

                // Strategy 4: Partial match on address line (more flexible)
                if (loc.addressLine && addressLineToMatch) {
                  const normalizedAddress = addressLineToMatch.toLowerCase().replace(/\s+/g, ' ').trim();
                  const normalizedRecent = loc.addressLine.toLowerCase().replace(/\s+/g, ' ').trim();

                  // Check if one contains the other
                  if (normalizedAddress.includes(normalizedRecent) || normalizedRecent.includes(normalizedAddress)) {
                    console.log('[ExploreMenu] Found partial address match in recent locations');
                    return true;
                  }

                  // Check if they share key words (like "Electronic City", "Phase 1", etc.)
                  const addressWords: string[] = normalizedAddress.split(/[,\s]+/).filter((w: string) => w.length > 3);
                  const recentWords: string[] = normalizedRecent.split(/[,\s]+/).filter((w: string) => w.length > 3);
                  const commonWords: string[] = addressWords.filter((w: string) => recentWords.includes(w));
                  if (commonWords.length >= 2) {
                    console.log('[ExploreMenu] Found match by common words in recent locations:', commonWords);
                    return true;
                  }
                }

                // Strategy 5: Match by label similarity
                if (loc.label && locationData.label) {
                  const normalizedLabel = locationData.label.toLowerCase().trim();
                  const normalizedRecentLabel = loc.label.toLowerCase().trim();
                  if (normalizedLabel === normalizedRecentLabel ||
                    normalizedLabel.includes(normalizedRecentLabel) ||
                    normalizedRecentLabel.includes(normalizedLabel)) {
                    console.log('[ExploreMenu] Found label similarity match in recent locations');
                    return true;
                  }
                }

                return false;
              });

              if (matchingRecent) {
                console.log('[ExploreMenu] Found matching recent location:', {
                  label: matchingRecent.label,
                  addressLine: matchingRecent.addressLine,
                  hasLat: !!matchingRecent.lat,
                  hasLng: !!matchingRecent.lng,
                  lat: matchingRecent.lat,
                  lng: matchingRecent.lng
                });
              }

              if (matchingRecent && matchingRecent.lat && matchingRecent.lng &&
                !isNaN(matchingRecent.lat) && !isNaN(matchingRecent.lng) &&
                matchingRecent.lat !== 0 && matchingRecent.lng !== 0) {
                console.log('[ExploreMenu] Matching recent location has valid coordinates:', { lat: matchingRecent.lat, lng: matchingRecent.lng });

                // Update location data with coordinates from recent location
                const updatedLocationData = {
                  ...locationData,
                  lat: matchingRecent.lat,
                  lng: matchingRecent.lng
                };
                localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(updatedLocationData));

                // Use coordinates from recent location
                userLat = matchingRecent.lat;
                userLng = matchingRecent.lng;

                // Re-validate with new coordinates
                const nowHasValidCoordinates =
                  userLat !== null && userLat !== undefined &&
                  userLng !== null && userLng !== undefined &&
                  !isNaN(userLat) && !isNaN(userLng) &&
                  userLat !== 0 && userLng !== 0 &&
                  userLat > -90 && userLat < 90 &&
                  userLng > -180 && userLng < 180;

                if (nowHasValidCoordinates) {
                  console.log('[ExploreMenu] Coordinates from recent location are valid, continuing...');
                  coordinatesFound = true; // Mark that we found valid coordinates
                  // Continue with distance calculation below (skip geocoding)
                } else {
                  console.warn('[ExploreMenu] Matching recent location found but coordinates are invalid:', {
                    lat: matchingRecent.lat,
                    lng: matchingRecent.lng,
                    isNaNLat: isNaN(matchingRecent.lat),
                    isNaNLng: isNaN(matchingRecent.lng),
                    latIsZero: matchingRecent.lat === 0,
                    lngIsZero: matchingRecent.lng === 0
                  });
                  // Fall through to geocoding below
                }
              } else if (matchingRecent) {
                console.warn('[ExploreMenu] Matching recent location found but missing coordinates:', {
                  label: matchingRecent.label,
                  addressLine: matchingRecent.addressLine,
                  hasLat: !!matchingRecent.lat,
                  hasLng: !!matchingRecent.lng
                });
                // Even though we found a matching recent location, if it's a saved address,
                // try fetching coordinates from database before falling back to geocoding
                if (locationData.id && locationData.type === 'saved') {
                  console.log('[ExploreMenu] Saved address found in recent locations but missing coordinates, trying database...');
                  try {
                    const { addressService } = await import('@/lib/supabase-service');
                    const addresses = await addressService.getAll();
                    const savedAddress = addresses.find(addr => addr.id === locationData.id);
                    if (savedAddress && savedAddress.latitude && savedAddress.longitude) {
                      console.log('[ExploreMenu] Found coordinates in database for saved address:', {
                        lat: savedAddress.latitude,
                        lng: savedAddress.longitude
                      });
                      // Update location data with coordinates from database
                      const updatedLocationData = {
                        ...locationData,
                        lat: savedAddress.latitude,
                        lng: savedAddress.longitude
                      };
                      localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(updatedLocationData));
                      userLat = savedAddress.latitude;
                      userLng = savedAddress.longitude;
                      // Re-validate
                      const nowHasValidCoordinates =
                        userLat !== null && userLat !== undefined &&
                        userLng !== null && userLng !== undefined &&
                        !isNaN(userLat) && !isNaN(userLng) &&
                        userLat !== 0 && userLng !== 0 &&
                        userLat > -90 && userLat < 90 &&
                        userLng > -180 && userLng < 180;
                      if (nowHasValidCoordinates) {
                        console.log('[ExploreMenu] Coordinates from database are valid, continuing...');
                        coordinatesFound = true; // Mark that we found valid coordinates
                        // Continue with distance calculation below (skip geocoding)
                      } else {
                        console.warn('[ExploreMenu] Coordinates from database are invalid, will try geocoding');
                        // Fall through to geocoding below
                      }
                    } else {
                      console.warn('[ExploreMenu] Saved address found in database but missing coordinates:', {
                        found: !!savedAddress,
                        hasLat: savedAddress?.latitude !== null && savedAddress?.latitude !== undefined,
                        hasLng: savedAddress?.longitude !== null && savedAddress?.longitude !== undefined
                      });
                      // Fall through to geocoding below
                    }
                  } catch (dbError: any) {
                    // Handle authentication errors gracefully
                    if (dbError?.message?.includes('Not authenticated') || dbError?.message?.includes('authenticated')) {
                      console.warn('[ExploreMenu] User not authenticated, cannot fetch saved address from database. Will try geocoding.');
                    } else {
                      console.warn('[ExploreMenu] Error fetching saved address from database:', dbError);
                    }
                    // Fall through to geocoding below
                  }
                } else {
                  // Fall through to geocoding below
                }
              } else {
                console.warn('[ExploreMenu] No matching recent location found, will try database or geocoding');
                // If this is a saved address (has id), try fetching coordinates from database
                if (locationData.id && locationData.type === 'saved') {
                  try {
                    const { addressService } = await import('@/lib/supabase-service');
                    const addresses = await addressService.getAll();
                    const savedAddress = addresses.find(addr => addr.id === locationData.id);
                    if (savedAddress && savedAddress.latitude && savedAddress.longitude) {
                      console.log('[ExploreMenu] Found coordinates in database for saved address:', {
                        lat: savedAddress.latitude,
                        lng: savedAddress.longitude
                      });
                      // Update location data with coordinates from database
                      const updatedLocationData = {
                        ...locationData,
                        lat: savedAddress.latitude,
                        lng: savedAddress.longitude
                      };
                      localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(updatedLocationData));
                      userLat = savedAddress.latitude;
                      userLng = savedAddress.longitude;
                      // Re-validate
                      const nowHasValidCoordinates =
                        userLat !== null && userLat !== undefined &&
                        userLng !== null && userLng !== undefined &&
                        !isNaN(userLat) && !isNaN(userLng) &&
                        userLat !== 0 && userLng !== 0 &&
                        userLat > -90 && userLat < 90 &&
                        userLng > -180 && userLng < 180;
                      if (nowHasValidCoordinates) {
                        console.log('[ExploreMenu] Coordinates from database are valid, continuing...');
                        coordinatesFound = true; // Mark that we found valid coordinates
                        // Continue with distance calculation below (skip geocoding)
                      } else {
                        console.warn('[ExploreMenu] Coordinates from database are invalid, will try geocoding');
                        // Fall through to geocoding below
                      }
                    } else {
                      console.warn('[ExploreMenu] Saved address found in database but missing coordinates:', {
                        found: !!savedAddress,
                        hasLat: savedAddress?.latitude !== null && savedAddress?.latitude !== undefined,
                        hasLng: savedAddress?.longitude !== null && savedAddress?.longitude !== undefined
                      });
                      // Fall through to geocoding below
                    }
                  } catch (dbError: any) {
                    // Handle authentication errors gracefully
                    if (dbError?.message?.includes('Not authenticated') || dbError?.message?.includes('authenticated')) {
                      console.warn('[ExploreMenu] User not authenticated, cannot fetch saved address from database. Will try geocoding.');
                    } else {
                      console.warn('[ExploreMenu] Error fetching saved address from database:', dbError);
                    }
                    // Fall through to geocoding below
                  }
                } else {
                  // Fall through to geocoding below
                }
              }
            } catch (e) {
              console.warn('[ExploreMenu] Error parsing recent locations:', e);
              // Fall through to geocoding below
            }
          }

          // Check if we now have valid coordinates (from recent locations or database)
          const hasValidCoordinatesNow =
            userLat !== null && userLat !== undefined &&
            userLng !== null && userLng !== undefined &&
            !isNaN(userLat) && !isNaN(userLng) &&
            userLat !== 0 && userLng !== 0 &&
            userLat > -90 && userLat < 90 &&
            userLng > -180 && userLng < 180;

          // If we found valid coordinates from recent locations or database, skip geocoding
          if (coordinatesFound && hasValidCoordinatesNow) {
            console.log('[ExploreMenu] Valid coordinates found, skipping geocoding and proceeding with distance calculation');
            // Continue to distance calculation below
          }
          // If we still don't have valid coordinates, try geocoding
          else if (!hasValidCoordinatesNow) {
            console.warn('[ExploreMenu] Still missing coordinates, attempting to geocode address...');

            // Try to geocode the address to get coordinates
            // Clean up address: remove leading commas, trim, and remove duplicate parts
            let addressToGeocode = locationData.addressLine || locationData.label || '';
            if (addressToGeocode) {
              // Remove leading/trailing commas and whitespace
              addressToGeocode = addressToGeocode.replace(/^[,\s]+|[,\s]+$/g, '').trim();
              // Remove duplicate consecutive parts (simple deduplication)
              const parts: string[] = addressToGeocode.split(',').map((p: string) => p.trim()).filter((p: string) => p.length > 0);
              const uniqueParts: string[] = [];
              const seen = new Set<string>();
              for (const part of parts) {
                const normalized = part.toLowerCase();
                if (!seen.has(normalized)) {
                  seen.add(normalized);
                  uniqueParts.push(part);
                }
              }
              addressToGeocode = uniqueParts.join(', ');
            }

            if (addressToGeocode && addressToGeocode.trim().length > 0) {
              try {
                // Simplify address for better geocoding results
                // Extract key parts: street name, area, city
                const addressParts = addressToGeocode.split(',').map(p => p.trim()).filter(p => p.length > 0);
                // Take first 3-4 parts (usually street, area, city) and add Bangalore
                const simplifiedAddress = addressParts.slice(0, Math.min(4, addressParts.length)).join(', ') + ', Bangalore, Karnataka';
                console.log('[ExploreMenu] Geocoding address:', { original: addressToGeocode, simplified: simplifiedAddress });
                
                // Try Edge Function first (most reliable)
                const { supabaseAuth } = await import('@/lib/supabase-auth');
                const { data: { session } } = await supabaseAuth.auth.getSession();
                const token = session?.access_token;
                const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
                
                const edgeFunctionUrl = new URL(`${supabaseAuth.supabaseUrl}/functions/v1/geocode`);
                edgeFunctionUrl.searchParams.set('type', 'search');
                edgeFunctionUrl.searchParams.set('q', simplifiedAddress);
                edgeFunctionUrl.searchParams.set('limit', '5'); // Get more results to find a match
                edgeFunctionUrl.searchParams.set('countrycodes', 'in');
                edgeFunctionUrl.searchParams.set('addressdetails', '1');
                edgeFunctionUrl.searchParams.set('bounded', '1');
                edgeFunctionUrl.searchParams.set('viewbox', '77.35,13.2,77.85,12.7');

                let data: any = null;
                let lastError: any = null;

                // Try Edge Function first
                try {
                  const headers: HeadersInit = {
                    'Content-Type': 'application/json',
                  };
                  if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                  } else if (anonKey) {
                    headers['Authorization'] = `Bearer ${anonKey}`;
                  }

                  const controller = new AbortController();
                  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

                  console.log('[ExploreMenu] Calling Edge Function with URL:', edgeFunctionUrl.toString());
                  const response = await fetch(edgeFunctionUrl.toString(), {
                    headers,
                    signal: controller.signal
                  });

                  clearTimeout(timeoutId);

                  if (response.ok) {
                    data = await response.json();
                    console.log('[ExploreMenu] Edge Function response:', { 
                      isArray: Array.isArray(data), 
                      length: Array.isArray(data) ? data.length : 'not array',
                      data: data 
                    });
                    
                    if (Array.isArray(data) && data.length > 0) {
                      console.log('[ExploreMenu] Successfully geocoded using Edge Function, found', data.length, 'results');
                    } else {
                      console.warn('[ExploreMenu] Edge Function returned empty results, will try fallback');
                      // Don't throw error yet - try with simplified address or fallback
                      data = null;
                    }
                  } else {
                    throw new Error(`Edge Function returned ${response.status}`);
                  }
                } catch (edgeError: any) {
                  lastError = edgeError;
                  console.warn('[ExploreMenu] Edge Function geocoding failed, trying CORS proxies...', edgeError.message);
                  
                  // Fallback to CORS proxies if Edge Function fails or returns no results
                  // Use simplified address for better results
                  const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(simplifiedAddress)}&limit=5&countrycodes=in&addressdetails=1&bounded=1&viewbox=77.35,13.2,77.85,12.7`;

                  const proxies = [
                    `https://corsproxy.io/?${encodeURIComponent(geocodeUrl)}`,
                    `https://api.allorigins.win/raw?url=${encodeURIComponent(geocodeUrl)}`,
                    `https://cors-anywhere.herokuapp.com/${geocodeUrl}`
                  ];

                  // Try each proxy until one works
                  for (const proxyUrl of proxies) {
                    try {
                      const controller = new AbortController();
                      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

                      const response = await fetch(proxyUrl, {
                        method: 'GET',
                        headers: { 'Accept': 'application/json' },
                        signal: controller.signal
                      });

                      clearTimeout(timeoutId);

                      if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                      }

                      let responseData = await response.json();

                      // Handle proxy response - it might wrap the JSON
                      if (typeof responseData === 'string') {
                        try {
                          responseData = JSON.parse(responseData);
                        } catch (e) {
                          console.warn('[ExploreMenu] Failed to parse proxy response, trying next proxy...');
                          continue; // Try next proxy
                        }
                      }

                      data = responseData;
                      break; // Success, exit loop
                    } catch (error: any) {
                      lastError = error;
                      if (error.name === 'AbortError') {
                        console.warn('[ExploreMenu] Geocoding timeout, trying next proxy...');
                      } else {
                        console.warn('[ExploreMenu] Geocoding failed with proxy, trying next...', error.message);
                      }
                      continue; // Try next proxy
                    }
                  }
                }

                // If Edge Function returned empty results, try with even simpler address
                if (!data || !Array.isArray(data) || data.length === 0) {
                  console.log('[ExploreMenu] Trying with simpler address format...');
                  // Try with just the first 2 parts (street + area)
                  const verySimpleAddress = addressParts.slice(0, 2).join(', ') + ', Bangalore';
                  console.log('[ExploreMenu] Simplified address:', verySimpleAddress);
                  
                  try {
                    const { supabaseAuth } = await import('@/lib/supabase-auth');
                    const { data: { session } } = await supabaseAuth.auth.getSession();
                    const token = session?.access_token;
                    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
                    
                    const simpleEdgeFunctionUrl = new URL(`${supabaseAuth.supabaseUrl}/functions/v1/geocode`);
                    simpleEdgeFunctionUrl.searchParams.set('type', 'search');
                    simpleEdgeFunctionUrl.searchParams.set('q', verySimpleAddress);
                    simpleEdgeFunctionUrl.searchParams.set('limit', '5');
                    simpleEdgeFunctionUrl.searchParams.set('countrycodes', 'in');
                    
                    const headers: HeadersInit = {
                      'Content-Type': 'application/json',
                    };
                    if (token) {
                      headers['Authorization'] = `Bearer ${token}`;
                    } else if (anonKey) {
                      headers['Authorization'] = `Bearer ${anonKey}`;
                    }
                    
                    const response = await fetch(simpleEdgeFunctionUrl.toString(), { headers });
                    if (response.ok) {
                      const simpleData = await response.json();
                      if (Array.isArray(simpleData) && simpleData.length > 0) {
                        console.log('[ExploreMenu] Found results with simplified address');
                        data = simpleData;
                      }
                    }
                  } catch (e) {
                    console.warn('[ExploreMenu] Simplified address geocoding also failed:', e);
                  }
                }

                if (data && Array.isArray(data) && data.length > 0) {
                  const result = data[0];
                  const geocodedLat = parseFloat(result.lat);
                  const geocodedLng = parseFloat(result.lon);

                  if (!isNaN(geocodedLat) && !isNaN(geocodedLng) && geocodedLat !== 0 && geocodedLng !== 0) {
                    console.log('[ExploreMenu] Successfully geocoded address:', { lat: geocodedLat, lng: geocodedLng });

                    // Update location data with geocoded coordinates
                    const updatedLocationData = {
                      ...locationData,
                      lat: geocodedLat,
                      lng: geocodedLng
                    };
                    localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(updatedLocationData));

                    // If this is a saved address, update the database with coordinates for future use
                    if (locationData.id && locationData.type === 'saved') {
                      try {
                        const { addressService } = await import('@/lib/supabase-service');
                        await addressService.update(locationData.id, {
                          latitude: geocodedLat,
                          longitude: geocodedLng
                        });
                        console.log('[ExploreMenu] Updated saved address coordinates in database');
                      } catch (updateError: any) {
                        // Non-critical error - log but don't block
                        console.warn('[ExploreMenu] Could not update saved address coordinates in database:', updateError);
                      }
                    }

                    // Use geocoded coordinates
                    userLat = geocodedLat;
                    userLng = geocodedLng;

                    // Re-validate with new coordinates
                    const nowHasValidCoordinates =
                      userLat !== null && userLat !== undefined &&
                      userLng !== null && userLng !== undefined &&
                      !isNaN(userLat) && !isNaN(userLng) &&
                      userLat !== 0 && userLng !== 0 &&
                      userLat > -90 && userLat < 90 &&
                      userLng > -180 && userLng < 180;

                    if (nowHasValidCoordinates) {
                      // Continue with distance calculation below
                      console.log('[ExploreMenu] Geocoded coordinates are valid, continuing...');
                    } else {
                      console.error('[ExploreMenu] Geocoded coordinates are invalid');
                      setIsLocationValid(false);
                      setIsCheckingLocation(false);
                      return;
                    }
                  } else {
                    console.error('[ExploreMenu] Geocoding returned invalid coordinates');
                    setIsLocationValid(false);
                    setIsCheckingLocation(false);
                    return;
                  }
                } else {
                  console.error('[ExploreMenu] Geocoding returned no results', { data, lastError });
                  // All geocoding attempts failed - try using approximate coordinates for known areas
                  console.warn('[ExploreMenu] All geocoding attempts failed, trying approximate coordinates for known areas...');

                  // Try to use approximate coordinates for known areas in Bangalore
                  const addressLower = addressToGeocode.toLowerCase();
                  let approximateLat: number | null = null;
                  let approximateLng: number | null = null;

                  // Electronic City area approximate coordinates
                  if (addressLower.includes('electronic city') || addressLower.includes('electronics')) {
                    approximateLat = 12.8474; // Electronic City Phase 1 approximate center
                    approximateLng = 77.6645;
                    console.log('[ExploreMenu] Using approximate coordinates for Electronic City area');
                  }
                  // Chikkathogur area approximate coordinates (near Electronic City)
                  else if (addressLower.includes('chikkathogur') || addressLower.includes('chikkathoguru')) {
                    approximateLat = 12.8400; // Chikkathogur approximate center
                    approximateLng = 77.6600;
                    console.log('[ExploreMenu] Using approximate coordinates for Chikkathogur area');
                  }
                  // Doddathoguru area approximate coordinates
                  else if (addressLower.includes('doddathogur') || addressLower.includes('doddathoguru')) {
                    approximateLat = 12.8450; // Doddathoguru approximate center
                    approximateLng = 77.6550;
                    console.log('[ExploreMenu] Using approximate coordinates for Doddathoguru area');
                  }

                  if (approximateLat && approximateLng) {
                    console.log('[ExploreMenu] Using approximate coordinates:', { lat: approximateLat, lng: approximateLng });

                    // Update location data with approximate coordinates
                    const updatedLocationData = {
                      ...locationData,
                      lat: approximateLat,
                      lng: approximateLng
                    };
                    localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(updatedLocationData));

                    // Use approximate coordinates
                    userLat = approximateLat;
                    userLng = approximateLng;

                    // Re-validate with approximate coordinates
                    const nowHasValidCoordinates =
                      userLat !== null && userLat !== undefined &&
                      userLng !== null && userLng !== undefined &&
                      !isNaN(userLat) && !isNaN(userLng) &&
                      userLat !== 0 && userLng !== 0 &&
                      userLat > -90 && userLat < 90 &&
                      userLng > -180 && userLng < 180;

                    if (nowHasValidCoordinates) {
                      console.log('[ExploreMenu] Approximate coordinates are valid, continuing with validation...');
                      // Continue with distance calculation below
                    } else {
                      console.error('[ExploreMenu] Approximate coordinates are invalid');
                      setLocationError('Could not verify location coordinates. Please confirm your location on the map.');
                      setIsLocationValid(false);
                      setIsCheckingLocation(false);
                      return;
                    }
                  } else {
                    // No approximate coordinates available - show error message
                    console.warn('[ExploreMenu] No approximate coordinates available for this area');
                    setLocationError('Could not verify location coordinates. Please confirm your location on the map.');
                    setIsLocationValid(false);
                    setIsCheckingLocation(false);
                    return;
                  }
                }
              } catch (geocodeError) {
                console.error('[ExploreMenu] Geocoding error:', geocodeError);
                // All geocoding attempts failed - try using approximate coordinates for known areas
                console.warn('[ExploreMenu] Geocoding error occurred, trying approximate coordinates for known areas...');

                // Try to use approximate coordinates for known areas in Bangalore
                const addressLower = (locationData.addressLine || locationData.label || '').toLowerCase();
                let approximateLat: number | null = null;
                let approximateLng: number | null = null;

                // Electronic City area approximate coordinates
                if (addressLower.includes('electronic city') || addressLower.includes('electronics')) {
                  approximateLat = 12.8474; // Electronic City Phase 1 approximate center
                  approximateLng = 77.6645;
                  console.log('[ExploreMenu] Using approximate coordinates for Electronic City area');
                }
                // Chikkathogur area approximate coordinates (near Electronic City)
                else if (addressLower.includes('chikkathogur') || addressLower.includes('chikkathoguru')) {
                  approximateLat = 12.8400; // Chikkathogur approximate center
                  approximateLng = 77.6600;
                  console.log('[ExploreMenu] Using approximate coordinates for Chikkathogur area');
                }
                // Doddathoguru area approximate coordinates
                else if (addressLower.includes('doddathogur') || addressLower.includes('doddathoguru')) {
                  approximateLat = 12.8450; // Doddathoguru approximate center
                  approximateLng = 77.6550;
                  console.log('[ExploreMenu] Using approximate coordinates for Doddathoguru area');
                }

                if (approximateLat && approximateLng) {
                  console.log('[ExploreMenu] Using approximate coordinates:', { lat: approximateLat, lng: approximateLng });

                  // Update location data with approximate coordinates
                  const updatedLocationData = {
                    ...locationData,
                    lat: approximateLat,
                    lng: approximateLng
                  };
                  localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(updatedLocationData));

                  // Use approximate coordinates
                  userLat = approximateLat;
                  userLng = approximateLng;

                  // Re-validate with approximate coordinates
                  const nowHasValidCoordinates =
                    userLat !== null && userLat !== undefined &&
                    userLng !== null && userLng !== undefined &&
                    !isNaN(userLat) && !isNaN(userLng) &&
                    userLat !== 0 && userLng !== 0 &&
                    userLat > -90 && userLat < 90 &&
                    userLng > -180 && userLng < 180;

                  if (nowHasValidCoordinates) {
                    console.log('[ExploreMenu] Approximate coordinates are valid, continuing with validation...');
                    // Continue with distance calculation below
                  } else {
                    console.error('[ExploreMenu] Approximate coordinates are invalid');
                    setLocationError('Could not verify location coordinates. Please confirm your location on the map.');
                    setIsLocationValid(false);
                    setIsCheckingLocation(false);
                    return;
                  }
                } else {
                  // No approximate coordinates available - show error message
                  console.warn('[ExploreMenu] No approximate coordinates available for this area');
                  setLocationError('Could not verify location coordinates. Please confirm your location on the map.');
                  setIsLocationValid(false);
                  setIsCheckingLocation(false);
                  return;
                }
              }
            } else {
              console.error('[ExploreMenu] No address to geocode');
              // No address available - show error message instead of redirecting
              console.warn('[ExploreMenu] No address available, location needs manual confirmation');
              setLocationError('Location address is missing. Please select a location.');
              setIsLocationValid(false);
              setIsCheckingLocation(false);
              return;
            }
          } else {
            // We have valid coordinates from recent locations, continue with validation
            console.log('[ExploreMenu] Using coordinates from recent location, skipping geocoding');
          }
        }

        // Final validation: ensure we have valid coordinates before calculating distance
        if (!userLat || !userLng || isNaN(userLat) || isNaN(userLng) || userLat === 0 || userLng === 0) {
          console.error('[ExploreMenu] ⛔ CRITICAL: Reached distance calculation without valid coordinates!', {
            userLat,
            userLng,
            latType: typeof userLat,
            lngType: typeof userLng
          });
          setLocationError('Location coordinates are invalid. Please select a location on the map.');
          setIsLocationValid(false);
          setIsCheckingLocation(false);
          return;
        }

        // At this point, we know coordinates are valid numbers
        // TypeScript needs explicit assertion since validation is complex
        const finalLat = userLat as number;
        const finalLng = userLng as number;

        // Calculate distance from service center
        const distance = calculateDistance(
          finalLat,
          finalLng,
          SERVICE_CENTER_LAT,
          SERVICE_CENTER_LNG
        );

        // Store calculated distance for display
        setCalculatedDistance(distance);

        // Strict validation: distance must be <= 5km to access menu
        const isValid = distance <= SERVICE_RADIUS_KM;
        setIsLocationValid(isValid);

        console.log(`[ExploreMenu] Location validation result:`, {
          userLocation: { lat: finalLat, lng: finalLng },
          serviceCenter: { lat: SERVICE_CENTER_LAT, lng: SERVICE_CENTER_LNG },
          distanceKm: distance.toFixed(4),
          distanceMeters: (distance * 1000).toFixed(2),
          radiusKm: SERVICE_RADIUS_KM,
          isValid: isValid,
          comparison: `${distance.toFixed(4)}km <= ${SERVICE_RADIUS_KM}km = ${isValid}`,
          willBlockAccess: !isValid
        });

        if (!isValid) {
          console.warn(`[ExploreMenu] ⛔ Location is OUTSIDE service area - ACCESS BLOCKED:`, {
            distance: `${distance.toFixed(4)}km`,
            required: `${SERVICE_RADIUS_KM}km`,
            difference: `${(distance - SERVICE_RADIUS_KM).toFixed(4)}km over limit`,
            action: 'User will see "Not Serving From This Location" message'
          });
        } else {
          console.log(`[ExploreMenu] ✅ Location is WITHIN service area - ACCESS GRANTED:`, {
            distance: `${distance.toFixed(4)}km`,
            limit: `${SERVICE_RADIUS_KM}km`,
            remaining: `${(SERVICE_RADIUS_KM - distance).toFixed(4)}km within limit`
          });
        }
      } catch (error) {
        console.error('[ExploreMenu] Error checking location:', error);
        setIsLocationValid(false);
      } finally {
        setIsCheckingLocation(false);
      }
    };

    checkLocation();

    // Listen for location changes
    const handleLocationChange = () => {
      checkLocation();
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === LOCATION_STORAGE_KEY) {
        checkLocation();
      }
    };

    // Also check when page becomes visible (user navigates back)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkLocation();
      }
    };

    window.addEventListener('locationchange', handleLocationChange);
    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('locationchange', handleLocationChange);
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Set flag when entering this page - orders from here are 60-min delivery
  useEffect(() => {
    if (isLocationValid && !forceProceed) {
      localStorage.setItem(SIXTY_MIN_ORDER_FLAG, "true");
    } else {
      localStorage.removeItem(SIXTY_MIN_ORDER_FLAG);
    }
  }, [isLocationValid, forceProceed]);

  const handleNavigate = useCallback(
    (path: string, options?: { replace?: boolean }) => {
      if (path === "/bulk-meals") {
        setSelectedService("bulk-meals");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      if (path === "/mealbox") {
        setSelectedService("mealbox");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      setLocation(path, options);
    },
    [setLocation]
  );

  // Only render menu if location is explicitly valid (within 5km) or user forced proceed
  // Block access if validation hasn't completed (null) or location is invalid (false)
  if (isLocationValid !== true && !forceProceed) {
    // Show loading if still checking
    if (isCheckingLocation || isLocationValid === null) {
      return (
        <div className="min-h-screen bg-[#FDF8F3]">
          {/* Back Button - Minimal with safe area support */}
          <div 
            className="absolute left-4 z-50"
            style={{ 
              top: '1rem'
            }}
          >
            <Button
              variant="ghost"
              size="sm"
              className="text-[#06352A] hover:text-[#06352A] hover:bg-white/80 bg-white/60 backdrop-blur-sm"
              onClick={() => setLocation("/")}
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
          <div className="flex items-center justify-center min-h-screen">
            <Card className="max-w-md mx-4">
              <CardContent className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Checking location...</p>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    // Show error message if location is not within service area
    return (
      <div
        className="min-h-screen flex flex-col items-center pt-8 pb-20 px-4 font-['Sweet_Sans_Pro'] relative"
        style={{
          backgroundImage: `linear-gradient(rgba(253, 248, 243, 0.4), rgba(253, 248, 243, 0.4)), url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
          width: '100%'
        }}
      >
        {/* Back Button - Minimal, positioned absolutely with safe area support */}
        <div 
          className="absolute left-4 z-50"
          style={{ 
            top: '1rem'
          }}
        >
          <Button
            variant="ghost"
            size="sm"
            className="text-[#06352A] hover:text-[#06352A] hover:bg-white/80 bg-white/60 backdrop-blur-sm"
            onClick={() => setLocation("/")}
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
        <div className="max-w-md w-full space-y-8 relative z-10 mt-8">
          <div className="w-full text-center p-6 backdrop-blur-sm bg-white/10 rounded-2xl">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center shadow-lg">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-[#06352A]">
              {locationError ? 'Location Confirmation Needed' : 'Good news — we serve your area!'}
            </h2>
            <p className="text-[#06352A] font-medium mb-4">
              {locationError || (
                <>
                  However, 60-minute delivery is not available here yet.
                  <br />Please order 6 hours in advance 😊
                </>
              )}
            </p>
            {/* Commented out when navigated from 60-minute delivery CTA */}
            {calculatedDistance !== null && !locationError && !fromSixtyMinCTA && (
              <p className="text-sm text-[#06352A]/80 mb-6 bg-white/20 py-1 rounded-full">
                Your location is {calculatedDistance.toFixed(2)}km ({Math.round(calculatedDistance * 1000)} meters) away from our service center.
              </p>
            )}

            <div className="space-y-4">
              {!locationError && (
                <Button
                  onClick={() => setForceProceed(true)}
                  className="w-full bg-[#06352A] hover:bg-[#06352A]/90 text-white h-12 text-lg rounded-xl shadow-lg"
                >
                  Explore Menu
                </Button>
              )}

              <Button
                onClick={() => {
                  if (locationError && locationError.includes('Could not verify location coordinates')) {
                    setLocation("/location/map");
                  } else {
                    setLocation("/location");
                  }
                }}
                variant="outline"
                className="w-full h-12 text-lg rounded-xl border-2 border-[#06352A] text-[#06352A] bg-white/80 hover:bg-white"
              >
                <MapPin className="w-5 h-5 mr-2" />
                {locationError ? 'Confirm Location on Map' : 'Change Location'}
              </Button>
            </div>
          </div>

          {/* Services Section */}
          <div className="space-y-4 max-w-7xl mx-auto w-full">
            <h3 className="text-lg font-bold text-[#06352A]">Choose from our other services</h3>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <ServiceCardSection
                serviceId="mealbox"
                title="MealBox"
                description="Custom-packed meals"
                onClick={() => setLocation("/mealbox")}
                className="h-[160px] lg:h-[220px]"
                backgroundImage={mealBoxImage}
              />
              <ServiceCardSection
                serviceId="bulk"
                title="Bulk Meal Delivery"
                description="Order large portions"
                onClick={() => setLocation("/bulk-meals")}
                className="row-span-2 h-[328px] lg:row-span-1 lg:h-[220px]"
                backgroundImage={bulkMealImage}
              />
              <ServiceCardSection
                serviceId="snack-box"
                title="Snack-box"
                description="Everyday snack packs"
                onClick={() => setLocation("/snack-box")}
                className="h-[160px] lg:h-[220px]"
                backgroundImage={snackboxCardImage}
              />
              <ServiceCardSection
                serviceId="catering"
                title="Catering"
                description="End-to-end service"
                onClick={() => setLocation("/catering")}
                className="h-[160px] lg:h-[220px] col-span-2 lg:col-span-1"
                backgroundImage={cateringImage}
              />
              <ServiceCardSection
                serviceId="corporate"
                title="Daily Corporate"
                description="Customizations & more"
                onClick={() => setLocation("/corporate")}
                className="h-[160px] lg:h-[220px] col-span-2 lg:col-span-1"
                backgroundImage={corporateImage}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-[calc(100vh-64px)]"
      style={{
        backgroundImage: `linear-gradient(rgba(253, 248, 243, 0.8), rgba(253, 248, 243, 0.8)), url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        width: '100%'
      }}
    >
      <div key={selectedService} className="min-h-screen">
        {selectedService === "bulk-meals" ? (
          <BulkMeals onNavigate={handleNavigate} />
        ) : (
          <MealBox onNavigate={handleNavigate} />
        )}
      </div>
    </div>
  );
}
