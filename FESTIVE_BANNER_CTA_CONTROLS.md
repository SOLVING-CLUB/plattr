# Festive Banner CTA Controls

This document explains the new CTA button positioning and action method controls for the festive banner.

## Features

### 1. CTA Button Position Control

You can now control where the CTA button appears on the festive banner.

#### Predefined Positions

Set `cta_position` to one of these values:
- `top-left` - Top left corner
- `top-center` - Top center
- `top-right` - Top right corner
- `center-left` - Center left
- `center` - Center (default)
- `center-right` - Center right
- `bottom-left` - Bottom left
- `bottom-center` - Bottom center
- `bottom-right` - Bottom right

#### Custom Position

For pixel-perfect positioning:
1. Set `cta_position` to `'custom'`
2. Set `cta_position_x` to horizontal position (e.g., `'20%'`, `'100px'`, `'10rem'`)
3. Set `cta_position_y` to vertical position (e.g., `'30%'`, `'200px'`, `'5rem'`)

**Note:** Custom positions use CSS `left` and `top` properties with `transform: translate(-50%, -50%)` for centering.

### 2. CTA Action Methods

You can choose between two action methods when the CTA button (or banner) is clicked.

#### Method 1: Filter Method (Default)

**Behavior:**
- Sets `festiveFilter` in localStorage with the festive `filter_tag`
- Redirects to `/bulk-meals` page
- Shows only dishes that have the festive tag in their `tags` field

**Use Case:** When you want to show festive-specific dishes with filtering enabled.

**Database Setup:**
```sql
UPDATE festive_settings
SET cta_action_method = 1
WHERE festive_name = 'Sankranthi';
```

#### Method 2: Direct Redirect Method

**Behavior:**
- Directly redirects to a specified page
- No filter is applied
- User sees the full menu of the target page

**Use Case:** When you want to redirect users to a specific service page without filtering.

**Database Setup:**
```sql
UPDATE festive_settings
SET 
  cta_action_method = 2,
  cta_target_page = 'mealbox'  -- Options: 'bulk-meals', 'mealbox', 'snack-box', 'corporate', 'catering'
WHERE festive_name = 'Sankranthi';
```

**Available Target Pages:**
- `bulk-meals` → `/bulk-meals`
- `mealbox` → `/mealbox`
- `snack-box` → `/snack-box`
- `corporate` → `/corporate`
- `catering` → `/catering`

## Database Schema

### New Columns

```sql
-- Action method (1 or 2)
cta_action_method INTEGER DEFAULT 1 CHECK (cta_action_method IN (1, 2))

-- Target page for method 2
cta_target_page TEXT CHECK (cta_target_page IN ('bulk-meals', 'mealbox', 'snack-box', 'corporate', 'catering'))

-- Position (predefined or 'custom')
cta_position TEXT DEFAULT 'center'

-- Custom X position (used when cta_position = 'custom')
cta_position_x TEXT

-- Custom Y position (used when cta_position = 'custom')
cta_position_y TEXT
```

## Examples

### Example 1: Top-right CTA with Filter Method

```sql
UPDATE festive_settings
SET 
  cta_action_method = 1,
  cta_position = 'top-right'
WHERE festive_name = 'Sankranthi';
```

### Example 2: Bottom-center CTA Redirecting to MealBox

```sql
UPDATE festive_settings
SET 
  cta_action_method = 2,
  cta_target_page = 'mealbox',
  cta_position = 'bottom-center'
WHERE festive_name = 'Sankranthi';
```

### Example 3: Custom Position (20% from left, 30% from top)

```sql
UPDATE festive_settings
SET 
  cta_action_method = 1,
  cta_position = 'custom',
  cta_position_x = '20%',
  cta_position_y = '30%'
WHERE festive_name = 'Sankranthi';
```

### Example 4: Custom Position with Pixels

```sql
UPDATE festive_settings
SET 
  cta_action_method = 2,
  cta_target_page = 'catering',
  cta_position = 'custom',
  cta_position_x = '150px',
  cta_position_y = '100px'
WHERE festive_name = 'Sankranthi';
```

## Migration

Run the migration to add the new columns:

```bash
# The migration file is located at:
supabase/migrations/20250126_add_cta_position_and_action_method.sql
```

Or apply it directly in Supabase Dashboard → SQL Editor.

## Real-time Updates

Changes to festive settings now reflect **instantly** in the app without requiring a page refresh.

### How It Works

1. **Realtime Subscription**: The app subscribes to changes in the `festive_settings` table
2. **Instant Invalidation**: When any change is detected (INSERT, UPDATE, DELETE), the cache is invalidated
3. **Automatic Refetch**: React Query automatically refetches the latest data
4. **Fallback Polling**: If Realtime fails, the app falls back to polling every 30 seconds

### Enable Realtime in Supabase

1. **Run the migration**:
   ```sql
   -- File: supabase/migrations/20250126_enable_realtime_festive_settings.sql
   ALTER PUBLICATION supabase_realtime ADD TABLE public.festive_settings;
   ```

2. **Or enable via Dashboard**:
   - Go to **Supabase Dashboard** → **Database** → **Replication**
   - Find `festive_settings` table
   - Toggle **Realtime** to enabled

3. **Verify**: The table should show as "Realtime enabled" in the Replication section

### Testing Real-time Updates

1. Open your app in the browser
2. Open Supabase Dashboard → Table Editor → `festive_settings`
3. Make a change (e.g., update `button_text` or `cta_position`)
4. The change should appear in your app **instantly** (within 1-2 seconds)

**Note**: If Realtime is not enabled, the app will fall back to polling every 30 seconds.

## Backward Compatibility

- If `cta_action_method` is not set, it defaults to `1` (Filter Method)
- If `cta_position` is not set, it defaults to `'center'`
- Existing festive banners will continue to work with their current behavior

## UI/UX Notes

- The CTA button maintains its styling (colors, font, hover effects) regardless of position
- The entire banner is still clickable and uses the same action method
- Position changes are applied immediately (cached for 5 minutes like other settings)
