# Migration to Supabase-Only: Status Report

## ✅ Completed

### 1. Supabase Service Layer
- ✅ Created `client/src/lib/supabase-service.ts` with:
  - User profile operations
  - Address CRUD operations
  - Order fetching operations
  - Edge Functions interface

### 2. Frontend Pages Updated
- ✅ `ProfilePage.tsx` - Uses `userService.getProfile()`
- ✅ `EditProfile.tsx` - Uses `userService.updateProfile()` and Edge Functions for OTP
- ✅ `SavedAddresses.tsx` - Uses `addressService` for all operations
- ✅ `OrdersPage.tsx` - Uses `orderService.getAll()`

### 3. Edge Functions Created
- ✅ `supabase/functions/send-otp/index.ts` - Sends OTP via SMS
- ✅ `supabase/functions/verify-otp/index.ts` - Verifies OTP and authenticates
- ✅ `supabase/functions/create-payment-intent/index.ts` - Creates Stripe payment intent

### 4. RLS Policies
- ✅ Created `supabase/migrations/001_rls_policies.sql` with comprehensive security policies

### 5. Documentation
- ✅ `SUPABASE_MIGRATION.md` - Migration guide
- ✅ `supabase/DEPLOYMENT.md` - Edge Functions deployment guide

## 🔄 In Progress / Next Steps

### 1. Update Remaining Pages (Still using API routes)
- [ ] `PhoneScreen.tsx` - Update to use `edgeFunctions.sendOTP()`
- [ ] `VerificationScreen.tsx` - Update to use `edgeFunctions.verifyOTP()`
- [ ] `AuthPage.tsx` - Update to use Edge Functions
- [ ] `PaymentPage.tsx` - Update to use `edgeFunctions.createPaymentIntent()`
- [ ] `CheckoutPage.tsx` - Update to use Supabase directly for order creation
- [ ] `OrderDetailsPage.tsx` - Update to use `orderService.getById()`
- [ ] `CartDrawer.tsx` - Update to use Supabase directly for cart operations
- [ ] Other pages (CorporatePage, CateringPage, etc.)

### 2. Deploy Edge Functions
- [ ] Set environment variables in Supabase Dashboard
- [ ] Deploy `send-otp` function
- [ ] Deploy `verify-otp` function
- [ ] Deploy `create-payment-intent` function
- [ ] Test all functions

### 3. Apply RLS Policies
- [ ] Run migration SQL in Supabase Dashboard
- [ ] Test that RLS policies work correctly
- [ ] Verify users can only access their own data

### 4. Remove Express Server
- [ ] Update `package.json` to remove Express dependencies
- [ ] Remove `server/` directory
- [ ] Update build scripts
- [ ] Update Vite config if needed
- [ ] Test that everything still works

## 📋 Files Still Using API Routes

These files need to be updated to use Supabase directly or Edge Functions:

1. **Auth Pages:**
   - `client/src/pages/PhoneScreen.tsx`
   - `client/src/pages/VerificationScreen.tsx`
   - `client/src/pages/AuthPage.tsx`
   - `client/src/pages/NameScreen.tsx`

2. **Payment/Checkout:**
   - `client/src/pages/PaymentPage.tsx`
   - `client/src/pages/CheckoutPage.tsx`
   - `client/src/components/CartDrawer.tsx`

3. **Orders:**
   - `client/src/pages/OrderDetailsPage.tsx`

4. **Other:**
   - `client/src/pages/CorporatePage.tsx`
   - `client/src/pages/CateringPage.tsx`
   - `client/src/pages/ConciergeResultsPage.tsx`
   - `client/src/pages/ConciergeWizardPage.tsx`
   - `client/src/pages/CategoryPage.tsx`
   - `client/src/pages/AddOnsPage.tsx`
   - `client/src/pages/MealBoxPage.tsx`
   - `client/src/pages/PlannerDetailPage.tsx`

## 🎯 Priority Order

1. **High Priority** (Core functionality):
   - Auth pages (PhoneScreen, VerificationScreen)
   - Payment/Checkout pages
   - Order pages

2. **Medium Priority**:
   - Cart operations
   - Other order-related pages

3. **Low Priority**:
   - Corporate/Catering pages (can be done later)

## 📝 Notes

- All Edge Functions are ready to deploy
- RLS policies are ready to apply
- Core profile/address/order pages are already migrated
- Remaining work is mostly updating API calls to use Supabase client or Edge Functions

