# Festive Settings Management Guide

This guide explains how to control festive specials (like Sankranthi) through Supabase without code changes.

## Overview

The festive specials feature is now fully controlled through the `festive_settings` table in Supabase. You can:
- Change the festive name (e.g., "Sankranthi", "Diwali", "Christmas")
- Change the filter tag (must match tags in dishes table)
- Update the banner video
- Enable/disable festive specials
- Customize button text and colors

## Database Setup

1. **Run the migration** (if not already done):
   ```sql
   -- The migration file is at:
   -- supabase/migrations/20250126_create_festive_settings_table.sql
   ```

2. **Verify the table exists** in Supabase Dashboard → Table Editor → `festive_settings`

## Managing Festive Settings

### View Current Settings

1. Go to **Supabase Dashboard** → **Table Editor** → **festive_settings**
2. You'll see the current festive configuration

### Update Festive Name and Tag

1. Open the `festive_settings` table
2. Click on the row you want to edit
3. Update these fields:
   - **festive_name**: Display name (e.g., "Sankranthi", "Diwali")
   - **filter_tag**: Tag that matches dishes in the `dishes.tags` field (e.g., "Sankranthi", "Diwali")
   - **button_text**: Text on the banner button (e.g., "Sankranthi Special", "Diwali Special")
   - **show_cta_button**: Set to `true` to show the CTA button on the banner, `false` to hide it

### Change Banner Media (Image or Video)

The banner supports both images and videos. You have three options for storing banner media:

#### Option 1: Supabase Storage (Recommended)

1. **Create the storage bucket** (if not already created):
   - Go to **Supabase Dashboard** → **Storage**
   - Click **"New bucket"**
   - Name: `festive_banners`
   - Public: **Yes** (checked)
   - File size limit: 50 MB (or as needed)
   - Allowed MIME types: `video/*, image/*` (or leave empty for all)
   - Click **"Create bucket"**

2. **Upload your media file**:
   - Go to **Storage** → **festive_banners**
   - Click **"Upload file"**
   - Select your file:
     - For videos: `diwali-banner.mp4`, `sankranthi-banner.webm`
     - For images: `diwali-banner.jpg`, `sankranthi-banner.png`
   - Wait for upload to complete

3. **Get the public URL**:
   - Click on the uploaded file
   - Copy the **Public URL** (format: `https://YOUR_PROJECT.supabase.co/storage/v1/object/public/festive_banners/diwali-banner.mp4`)

4. **Update the database**:
   - Go to **Table Editor** → **festive_settings**
   - Update **banner_media_url** with the Supabase Storage URL
   - Set **banner_media_type** to:
     - `video` for video files (`.mp4`, `.webm`, `.mov`)
     - `image` for image files (`.jpg`, `.png`, `.webp`)

#### Option 2: External CDN/Hosting

1. Upload your media file to your CDN or hosting service
2. Get the public URL:
   - For videos: `https://cdn.example.com/videos/diwali-banner.mp4`
   - For images: `https://cdn.example.com/images/diwali-banner.jpg`
3. Update **banner_media_url** in the `festive_settings` table
4. Set **banner_media_type** to `video` or `image` accordingly

#### Option 3: Local Assets (Development Only)

1. Place media file in your `client/public` or `attached_assets` folder
2. Update **banner_media_url** with relative path:
   - `/videos/diwali-banner.mp4` (if in `client/public/videos/`)
   - `/images/diwali-banner.jpg` (if in `client/public/images/`)
   - `/stock_images/IMG_9929.MP4` (if in `attached_assets/stock_images/`)
3. Set **banner_media_type** to `video` or `image` accordingly

**Note**: For production, use Supabase Storage (Option 1) or a CDN (Option 2) for better performance and reliability.

**Supported Formats:**
- **Videos**: `.mp4`, `.webm`, `.mov` (recommended: `.mp4` for best compatibility)
- **Images**: `.jpg`, `.jpeg`, `.png`, `.webp` (recommended: `.jpg` or `.webp` for smaller file sizes)

### Enable/Disable Festive Specials

1. Set **is_active** to:
   - `true` - Festive banner and filter will appear
   - `false` - Festive banner and filter will be hidden

### Customize Colors

- **banner_bg_color**: Background color of the button (e.g., "#06352A")
- **banner_text_color**: Text color of the button (e.g., "#F5E9DB")

### Show/Hide CTA Button

- **show_cta_button**: 
  - `true` - Shows the CTA button (e.g., "Sankranthi Special") on the banner
  - `false` - Hides the CTA button (banner is still clickable, but no button overlay)

### Multiple Festives

If you have multiple active festives:
- Set **display_order** to control which one appears first (lower number = higher priority)
- Only the first active festive (by display_order) will be shown

## Tagging Dishes

For dishes to appear in the festive filter:

1. Go to **Supabase Dashboard** → **Table Editor** → **dishes**
2. Edit the dish you want to include
3. In the **tags** field, add the festive tag (e.g., "Sankranthi", "Diwali")
   - Tags are case-insensitive
   - You can have multiple tags separated by commas: "Sankranthi, Popular, Spicy"

## Example: Changing from Sankranthi to Diwali

1. **Upload Diwali banner media to Supabase Storage**:
   - Go to **Storage** → **festive_banners**
   - Upload `diwali-banner.mp4` (or `diwali-banner.jpg` for image)
   - Copy the public URL: `https://YOUR_PROJECT.supabase.co/storage/v1/object/public/festive_banners/diwali-banner.mp4`

2. **Update festive_settings**:
   ```sql
   UPDATE festive_settings
   SET 
     festive_name = 'Diwali',
     filter_tag = 'Diwali',
     button_text = 'Diwali Special',
     banner_media_url = 'https://YOUR_PROJECT.supabase.co/storage/v1/object/public/festive_banners/diwali-banner.mp4',
     banner_media_type = 'video', -- or 'image' if using an image
     is_active = true
   WHERE festive_name = 'Sankranthi';
   ```

2. **Tag dishes for Diwali**:
   ```sql
   UPDATE dishes
   SET tags = CONCAT(COALESCE(tags, ''), ', Diwali')
   WHERE id IN ('dish-id-1', 'dish-id-2', ...);
   ```

3. **The changes will appear immediately** (cached for 5 minutes)

## Example: Creating a New Festive

1. **Upload Christmas banner media to Supabase Storage**:
   - Go to **Storage** → **festive_banners**
   - Upload `christmas-banner.mp4` (or `christmas-banner.jpg` for image)
   - Copy the public URL

2. **Insert new festive setting**:
   ```sql
   INSERT INTO festive_settings (
     festive_name,
     filter_tag,
     banner_media_url,
     banner_media_type,
     is_active,
     display_order,
     button_text,
     banner_bg_color,
     banner_text_color
   ) VALUES (
     'Christmas',
     'Christmas',
     'https://YOUR_PROJECT.supabase.co/storage/v1/object/public/festive_banners/christmas-banner.mp4',
     'video', -- or 'image' if using an image
     true,
     1,
     'Christmas Special',
     '#1a1a1a',
     '#ffffff'
   );
   ```

2. **Tag dishes** with "Christmas" in the tags field

3. **Set display_order** lower than other active festives to show this one first

## Troubleshooting

### Banner not showing
- Check `is_active` is `true`
- Verify `display_order` is the lowest among active festives
- Check browser console for errors loading the video

### Dishes not filtering
- Verify `filter_tag` in `festive_settings` matches tags in `dishes.tags`
- Tags are case-insensitive, but spelling must match exactly
- Check that dishes have `is_available = true`

### Changes not appearing
- The settings are cached for 5 minutes
- Refresh the page or wait a few minutes
- Check browser console for API errors

## API Reference

The festive settings are fetched using:
- **Table**: `festive_settings`
- **Query**: Active festives sorted by `display_order`
- **Cache**: 5 minutes
- **Hook**: `useFestiveSettings()` in `client/src/hooks/useFestiveSettings.ts`
