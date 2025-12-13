/**
 * Validates if an address is within Bangalore service area
 * @param address - The address string to validate
 * @returns true if the address is in Bangalore, false otherwise
 */
export function validateBangaloreAddress(address: string): boolean {
  if (!address || typeof address !== 'string') {
    return false;
  }
  
  const addressText = address.toLowerCase().trim();
  
  // Check for Bangalore city names
  if (addressText.includes('bangalore') || addressText.includes('bengaluru')) {
    return true;
  }
  
  // Check for Karnataka state
  if (addressText.includes('karnataka')) {
    return true;
  }
  
  // Check for Bangalore pincodes (560xxx pattern)
  if (/\b56\d{4}\b/.test(addressText)) {
    return true;
  }
  
  // Check for common Bangalore area names
  const bangaloreAreas = [
    'btm', 'koramangala', 'whitefield', 'indiranagar', 'jayanagar',
    'hsr', 'electronic city', 'marathahalli', 'hebbal', 'yelahanka',
    'jp nagar', 'banashankari', 'malleswaram', 'rajajinagar', 'basavanagudi',
    'sadashivanagar', 'benson town', 'richmond', 'shivajinagar', 'ulsoor',
    'mg road', 'brigade road', 'church street', 'commercial street',
    'cunningham road', 'residency road', 'lavelle road', 'vittal mallya',
    'domlur', 'hal', 'old airport road', 'cv raman nagar', 'kr puram',
    'mahadevapura', 'bellandur', 'sarjapur', 'bommanahalli', 'begur',
    'hulimavu', 'arekere', 'bannerghatta', 'gottigere', 'kanakapura',
    'uttarahalli', 'padmanabhanagar', 'kumaraswamy layout', 'vijayanagar',
    'nagarbhavi', 'kengeri', 'rajarajeshwari nagar', 'mysore road',
    'tumkur road', 'yeshwanthpur', 'peenya', 'nagasandra', 'dasarahalli',
    'jalahalli', 'mathikere', 'rt nagar', 'sanjaynagar', 'ramamurthy nagar',
    'hennur', 'banaswadi', 'kammanahalli', 'kalyan nagar', 'sahakara nagar',
    'thanisandra', 'horamavu', 'geddalahalli', 'nagawara', 'jakkur',
    'devanahalli', 'airport', 'kempegowda', 'vidyaranyapura', 'yelachenahalli',
    'silk board', 'outer ring road', 'hosur road', 'old madras road'
  ];
  
  for (const area of bangaloreAreas) {
    if (addressText.includes(area)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Error message to display when address is not in Bangalore
 */
export const BANGALORE_VALIDATION_ERROR = {
  title: "Service Unavailable",
  description: "We currently only deliver within Bangalore. Please update your delivery address."
};
