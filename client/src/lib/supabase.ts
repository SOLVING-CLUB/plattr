// Supabase Storage URL Configuration (for image URLs only)
// Frontend doesn't need Supabase client - only backend connects to database
const SUPABASE_URL = 'https://leltckltotobsibixhqo.supabase.co';
const SUPABASE_STORAGE_PATH = '/storage/v1/object/public/dish_images';
const SUPABASE_RENDER_PATH = '/storage/v1/render/image/public/dish_images';

interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  resize?: 'cover' | 'contain' | 'fill';
}

/**
 * Get the full Supabase storage URL for a dish image with optional transformations
 * @param imageUrl - The image URL from the database (e.g., "dishes/D-0002/main.png" or "D-0001/main.png")
 * @param options - Optional image transformation parameters (width, height, quality)
 * @returns Full Supabase storage URL with optional transformations
 */
export function getSupabaseImageUrl(
  imageUrl: string | null | undefined,
  options?: ImageTransformOptions
): string {
  // If no image URL provided, return a placeholder
  if (!imageUrl) {
    return '/images/placeholder.jpg';
  }
  
  // If it's already a full URL (starts with http), return as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // If it starts with /images/, it's a local asset, return as is
  if (imageUrl.startsWith('/images/')) {
    return imageUrl;
  }
  
  // Remove leading slash if present to avoid double slashes
  const cleanImageUrl = imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl;
  
  // If no transformation options, return the standard URL
  if (!options || (!options.width && !options.height && !options.quality)) {
    return `${SUPABASE_URL}${SUPABASE_STORAGE_PATH}/${cleanImageUrl}`;
  }
  
  // Build transformation URL using Supabase's render endpoint
  const params = new URLSearchParams();
  if (options.width) params.append('width', options.width.toString());
  if (options.height) params.append('height', options.height.toString());
  if (options.quality) params.append('quality', options.quality.toString());
  if (options.resize) params.append('resize', options.resize);
  
  return `${SUPABASE_URL}${SUPABASE_RENDER_PATH}/${cleanImageUrl}?${params.toString()}`;
}

/**
 * Get an optimized thumbnail URL for dish cards (300px width, 75% quality)
 * @param imageUrl - The image URL from the database
 * @returns Optimized thumbnail URL
 */
export function getDishThumbnailUrl(imageUrl: string | null | undefined): string {
  return getSupabaseImageUrl(imageUrl, { width: 400, quality: 75, resize: 'cover' });
}

/**
 * Get an optimized full-size URL for dish detail views (800px width, 85% quality)
 * @param imageUrl - The image URL from the database
 * @returns Optimized full-size URL
 */
export function getDishFullImageUrl(imageUrl: string | null | undefined): string {
  return getSupabaseImageUrl(imageUrl, { width: 800, quality: 85, resize: 'cover' });
}

/**
 * Get category image URL from Supabase storage with optimized transformations
 * @param imageUrl - The image_url field from the categories table (e.g., "categories/starters.png")
 * @returns Optimized Supabase storage URL for category image
 */
export function getCategoryImageUrl(imageUrl: string | null | undefined): string {
  return getSupabaseImageUrl(imageUrl, { width: 400, quality: 80, resize: 'cover' });
}

/**
 * Get subcategory image URL from Supabase storage with optimized transformations
 * @param imageUrl - The image_url field from the subcategories table (e.g., "subcategories/fried-snacks.png")
 * @returns Optimized Supabase storage URL for subcategory image
 */
export function getSubcategoryImageUrl(imageUrl: string | null | undefined): string {
  return getSupabaseImageUrl(imageUrl, { width: 300, quality: 75, resize: 'cover' });
}

/**
 * Get cuisine image URL from Supabase storage with optimized transformations
 * @param imageUrl - The image_url field from the cuisines table (e.g., "cuisines/south-indian.png")
 * @returns Optimized Supabase storage URL for cuisine image
 */
export function getCuisineImageUrl(imageUrl: string | null | undefined): string {
  return getSupabaseImageUrl(imageUrl, { width: 400, quality: 80, resize: 'cover' });
}
