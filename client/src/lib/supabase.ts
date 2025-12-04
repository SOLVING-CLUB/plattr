// Supabase Storage URL Configuration (for image URLs only)
// Frontend doesn't need Supabase client - only backend connects to database
const SUPABASE_URL = 'https://leltckltotobsibixhqo.supabase.co';
const SUPABASE_STORAGE_PATH = '/storage/v1/object/public/dish_images';

/**
 * Get the full Supabase storage URL for a dish image
 * @param imageUrl - The image URL from the database (e.g., "dishes/D-0002/main.png" or "D-0001/main.png")
 * @returns Full Supabase storage URL in format: https://leltckltotobsibixhqo.supabase.co/storage/v1/object/public/dish_images/<image_url_from_db>
 */
export function getSupabaseImageUrl(imageUrl: string | null | undefined): string {
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
  
  // Construct the full Supabase storage URL
  // Format: https://leltckltotobsibixhqo.supabase.co/storage/v1/object/public/dish_images/<image_url_from_db>
  return `${SUPABASE_URL}${SUPABASE_STORAGE_PATH}/${cleanImageUrl}`;
}

/**
 * Get category image URL from Supabase
 * @param categoryId - The category ID
 * @returns Supabase storage URL for category image
 */
export function getCategoryImageUrl(categoryId: string | null | undefined): string {
  if (!categoryId) {
    return '/images/placeholder.jpg';
  }
  
  return `${SUPABASE_URL}${SUPABASE_STORAGE_PATH}/categories/${categoryId}.jpg`;
}
