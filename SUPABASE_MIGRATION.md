# Migration to Supabase-Only Architecture

This document outlines the migration from Express backend to Supabase-only architecture.

## ✅ Completed

1. **Created Supabase Service Layer** (`client/src/lib/supabase-service.ts`)
   - User profile operations (get, update)
   - Address operations (get all, create, update, delete)
   - Order operations (get all, get by ID)
   - Edge Functions interface (for server-side operations)

2. **Updated Frontend Pages**
   - `ProfilePage.tsx` - Now uses `userService.getProfile()`
   - `EditProfile.tsx` - Uses `userService.updateProfile()` and `edgeFunctions` for OTP
   - `SavedAddresses.tsx` - Uses `addressService` for all CRUD operations
   - `OrdersPage.tsx` - Uses `orderService.getAll()`

## ✅ Edge Functions Created

All Edge Functions have been created in `supabase/functions/`:
- ✅ `send-otp` - Sends OTP via SMS
- ✅ `verify-otp` - Verifies OTP and creates/authenticates user
- ✅ `create-payment-intent` - Creates Stripe payment intent

See `supabase/DEPLOYMENT.md` for deployment instructions.

## 🔨 Next Steps

### 1. Deploy Edge Functions

Follow the deployment guide in `supabase/DEPLOYMENT.md` to:
- Set environment variables in Supabase Dashboard
- Deploy the functions
- Apply RLS policies

### 2. Apply RLS Policies

RLS policies have been created in `supabase/migrations/001_rls_policies.sql`.

Apply them by:
1. Running `supabase db push` (if using Supabase CLI)
2. Or copy the SQL and run it in Supabase Dashboard → SQL Editor

### 3. Remove Express Dependencies

Once Edge Functions are set up and tested:

1. Remove `server/` directory
2. Update `package.json` to remove Express dependencies
3. Update build scripts to remove server build
4. Update Vite config if needed

### 5. Update Remaining Pages

Pages that still use API routes:
- Cart operations (can use Supabase directly or localStorage)
- Order creation (may need Edge Function for business logic)
- Corporate/Catering orders (can use Supabase directly)

## 📝 Notes

- **Authentication**: Already using Supabase Auth, no changes needed
- **Database**: Already using Supabase, just need to ensure RLS policies are correct
- **File Storage**: If you need file uploads, use Supabase Storage
- **Real-time**: Can use Supabase Realtime subscriptions if needed

## 🚀 Benefits

1. **Simpler Architecture**: No Express server to maintain
2. **Better Scalability**: Edge Functions scale automatically
3. **Lower Costs**: Pay only for what you use
4. **Faster Development**: Direct database access from frontend
5. **Better Security**: RLS policies enforce data access at database level

