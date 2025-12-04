## GRID Score Catering App – Comprehensive Project Documentation

### 1. Overview

- Purpose: A mobile-first catering/bulk-meal ordering app with Tiffins, Snacks, Lunch & Dinner, built with React (Vite) and an Express backend. Data is served directly from Supabase REST API; server provides auth, cart, orders, and payments with Stripe.
- Tech stack:
  - Frontend: React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui, Radix UI, Wouter, TanStack Query
  - Backend: Express, TypeScript, Drizzle ORM (optional path), session auth
  - Data: Supabase (Postgres + Storage + RLS), optional direct DB via Drizzle
  - Mobile: Capacitor (Android/iOS wrappers)
  - Payments: Stripe (optional, enabled when keys configured)

Directory layout:
- client/ – React app (Vite root)
- server/ – Express server, API routes, Vite dev integration
- shared/ – Database schema/types (Drizzle)
- attached_assets/ – Static images used by the app
- docs/ – Project documentation (this file)

Key environment variables (root .env):
- SUPABASE_URL
- SUPABASE_ANON_KEY
- Optional: SUPABASE_SERVICE_ROLE_KEY (server-only admin operations)
- Optional DB strings for sessions: SUPABASE_DATABASE_URL or DATABASE_URL
- Stripe: STRIPE_SECRET_KEY (server), Stripe publishable key (client) when wiring payments
- Demo bypass (optional, for local demos without OTP backend). Defaults to ON when `NODE_ENV`/`VITE_DEVMODE` indicate development:
  - Server: set `BYPASS_AUTH=true` (default for non-production) and optionally override `BYPASS_AUTH_PHONE` / `BYPASS_AUTH_USERNAME`
  - Client: set `VITE_BYPASS_AUTH=true` (default for `vite --dev`) plus optional `VITE_BYPASS_AUTH_PHONE`, `VITE_BYPASS_AUTH_USER_ID`, `VITE_BYPASS_AUTH_USERNAME`
  - Override either side with `BYPASS_AUTH=false` / `VITE_BYPASS_AUTH=false` to force the real OTP flow
  - When enabled, the server auto-creates a demo user and all routes treat requests as authenticated

Running locally:
- Development (server + Vite client via dev middleware):
  - npm install
  - npm run dev
- Production build:
  - npm run build
  - npm start

### 2. Frontend

Entry and build
- Vite root is `client/` (vite.config.ts sets root and outDir)
- Aliases: `@` → client/src, `@shared` → shared, `@assets` → attached_assets

State & data fetching
- TanStack Query centralizes data fetching/caching in `client/src/lib/queryClient.ts`
- USE_DIRECT_SUPABASE = true makes the client map logical API routes (e.g., `/api/dishes/...`) into direct Supabase REST queries via `mapApiRouteToSupabase`
- For guest carts, cart queries return null to trigger localStorage fallback (`client/src/lib/cartStorage.ts`)

Supabase client (frontend)
- `client/src/lib/supabase-client.ts`
  - Pulls `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (or uses defaults)
  - Thin wrapper around REST with PostgREST filters (select, filter, order, limit)
  - mapApiRouteToSupabase(route: string[]) implements the URL → table/options mapping
  - Dishes meal type: CSV and DB use text[] with values: "breakfast", "snacks", "lunch-dinner"
    - UI routes: `tiffins` maps to `breakfast` for dishes queries
  - Category filtering logic avoids conflicting meal_type filters when a specific category id is selected

Main pages (high level)
- `client/src/pages/HomePage.tsx` – Landing and navigation into meal types
- `client/src/pages/CategoryPage.tsx` – Core catalog page; loads categories, dishes, dish types, manages filters, cart affordances, and platter planner
- Checkout/Orders: `CheckoutPage.tsx`, `OrderConfirmationPage.tsx`, `OrdersPage.tsx`, `OrderDetailsPage.tsx`
- Auth & Profile: `AuthPage.tsx`, `ProfilePage.tsx`

UI components
- `client/src/components/ui/*` – shadcn/radix primitives (button, card, input, dialog, etc.)
- App shell: `AppHeader.tsx`, `BottomNav.tsx`, `FloatingCartButton.tsx`, etc.
- Domain-specific: `CategoryCard.tsx`, `DishCard.tsx`, `PlatterVisualization.tsx`

Notable frontend logic
- Category pipeline:
  - Categories load by `meal_type` (for tabs like tiffins/snacks/lunch-dinner)
  - Dishes query for either all categories under the meal type or a selected category id
  - Dietary filters: veg/non-veg are applied in the Supabase query; egg is filtered client-side by dish name
- Images: `client/src/lib/supabase.ts` builds Supabase storage URLs for dish/category images
- Guest carts: localStorage fallback if `/api/cart` returns 401 (not logged in)

### 3. Backend

Server bootstrap
- `server/index.ts`
  - CORS: open in development; allowlisted in production (including `capacitor://localhost`)
  - Sessions: express-session + `connect-pg-simple`; cookie secured in production
  - Vite dev middleware in development; static serving from `dist/public` in production
  - Port: `PORT` or 5000; Windows compatibility handled (no reusePort)

Routes
- `server/routes.ts` – single module wiring all APIs
  - Auth via OTP:
    - POST `/api/auth/send-otp` – stores OTP (10 min), sends via `smsService`
    - POST `/api/auth/verify-otp` – verifies OTP, creates/logs-in user, sets session
    - POST `/api/auth/check-phone` – checks phone existence and returns username
  - Catalog:
    - GET `/api/categories/:mealType` – categories by meal type (maps `tiffins` → `breakfast`)
    - GET `/api/dish-types/:categoryId` – distinct dish_type values for a category
    - GET `/api/dishes/:mealType` – dishes for meal type
    - GET `/api/dishes/:mealType/:categoryId` – dishes for meal type & category or plan type
    - REST path uses Supabase by default when `SUPABASE_URL`/keys exist
  - Cart (session-auth where applicable):
    - GET `/api/cart` – 401 if guest; else returns user’s cart with dish and category
    - POST `/api/cart` – adds item; if guest, returns success (frontend handles localStorage)
    - PUT `/api/cart/:id` – updates item; guest returns success
    - DELETE `/api/cart/:id` – removes item; guest returns success
  - Orders (session-auth):
    - POST `/api/orders` – creates order: calculates subtotal, fees/taxes, generates 8-digit order number, persists items, clears cart
    - GET `/api/orders/:orderId` – returns order with address and items
  - Payments (optional):
    - POST `/api/create-payment-intent` – calculates total from server-side cart and creates Stripe intent
  - Account deletion (Apple compliance):
    - DELETE `/api/account` – purges user data in a safe order and destroys session

Vite integration
- `server/vite.ts` – attaches Vite dev middleware (dev) or serves static build (prod)

### 4. Data Model (shared/schema.ts)

Tables (Drizzle definitions mirror Supabase):
- users(id, username, password?, email?, phone?, is_verified)
- otp_verifications(id, phone, otp, expires_at, is_used, created_at)
- categories(id, name, meal_type, display_order, image_url)
- dishes(id, name, description, price, image_url, meal_type text[], category_id, is_available, spice_level?, dietary_type?, dish_type?)
- addresses(id, user_id, label, address, landmark?, is_default)
- orders(id, order_number unique int, user_id, address_id, subtotal, delivery_fee, tax, total, delivery_date, delivery_time, status, created_at)
- order_items(id, order_id, dish_id, quantity, price)
- cart_items(id, user_id, dish_id, quantity, created_at)
- add_ons(id, name, description, price, is_available, category)

Types & zod insert schemas are exported for strong typing.

### 5. Supabase Usage

REST client (server)
- `server/supabase-rest.ts` – environment-driven client that sends PostgREST queries with operators:
  - Equality: `column=eq.value`
  - Contains (arrays): `column=cs.{value}` (server-side endpoints use this)
  - IN list: `column=in.(v1,v2)`
  - Sorting: `order=column.asc`

REST client (frontend)
- `client/src/lib/supabase-client.ts`
  - Same operator syntax, mapped from logical routes in `mapApiRouteToSupabase`
  - Dishes meal type mapping ensures UI route `tiffins` → DB `breakfast`
  - When a specific category is selected, meal_type filter is dropped to avoid conflicts and ensure results show

RLS & Policies
- Project expects anon read on `dishes`, `categories`, `add_ons` (your snapshot had permissive policies). Enable write only for server where needed.

Storage
- Bucket `dish_images` is public; images referenced by `image_url` are composed into full URLs by `client/src/lib/supabase.ts` helpers

### 6. Authentication & Sessions

- OTP flow stores and validates codes in `otp_verifications` with 10-minute expiry and single-use flag
- On OTP verification, user is created (if not exists) and marked verified, then session is established
- Sessions are cookie-based, stored in Postgres via `connect-pg-simple`
- Frontend detects guest via 401 on `/api/cart` and falls back to localStorage cart
- Development bypass: when `NODE_ENV !== "production"` the server automatically sets a demo user session (no OTP/API calls required). Override with `BYPASS_AUTH=false` to disable or `BYPASS_AUTH=true` plus `BYPASS_AUTH_PHONE` / `BYPASS_AUTH_USERNAME` to customize the seeded user.

### 7. Payments (Stripe)

- Enabled when `STRIPE_SECRET_KEY` is set
- Server calculates totals from authenticated user’s cart to avoid client tampering
- Returns client secret for client-side confirmation

### 8. Build, Packaging, Mobile

- Build: `vite build` emits to `dist/public`; server bundle via esbuild to `dist/index.js`
- Mobile: Capacitor projects exist under `android/` and `ios/`; after `npm run build`, run `npx cap sync <platform>`

### 9. File-by-File Highlights

- package.json – scripts (dev/build/start), dependencies, TypeScript versions
- vite.config.ts – Vite root, aliases, dev overlays (Replit plugins guarded), outDir, server fs guard
- tsconfig.json – strict TS, path aliases for `@` and `@shared`
- server/index.ts – app bootstrap, CORS, sessions, Vite wiring, server listen
- server/routes.ts – all API routes: auth, catalog, cart, orders, payments, account deletion
- server/supabase-rest.ts – server Supabase REST client
- server/db.ts – Drizzle DB bootstrap (used when connecting directly)
- server/sms.ts – OTP generator/sender abstraction
- client/src/lib/queryClient.ts – TanStack Query configuration and logical route dispatcher
- client/src/lib/supabase-client.ts – REST wrapper and route-to-table mapper
- client/src/lib/cartStorage.ts – guest cart in localStorage
- client/src/lib/supabase.ts – image URL helpers for Supabase storage
- client/src/pages/* – feature pages (home, categories, checkout, orders, profile, etc.)
- client/src/components/* – UI building blocks (shadcn/radix), domain cards, platter UI
- shared/schema.ts – typed schema for categories/dishes/users/addresses/orders/cart/add_ons + zod insert schemas

### 10. Operational Notes & Troubleshooting

- Env variables
  - Frontend must have `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for client REST calls (or the defaults are used)
  - Server requires `SUPABASE_URL` and `SUPABASE_ANON_KEY` to use REST mode; otherwise Drizzle path expects a DB connection string for sessions and queries
- Meal type mapping
  - UI uses `tiffins`, DB uses `breakfast` in dishes.meal_type[]; categories.meal_type is text and uses `tiffins|snacks|lunch-dinner`
- Empty dishes for category
  - The client removes meal_type filter when category id is present and filters on `category_id` only to avoid array/operator mismatches
- 400 from Supabase
  - Verify PostgREST filter syntax; use `cs.{value}` for array contains (server) or valid JSON array with `cs.["value"]` in contexts where needed
- Images
  - Ensure bucket `dish_images` is public and paths in `image_url` are correct; helper composes full URLs

### 11. Security

- Session cookies: httpOnly, secure in production, SameSite strict in prod
- Backend recalculates totals server-side for payment intents
- No client-provided user IDs are trusted for cart/order flows
- CORS locked down in production with allowlist + Capacitor schemes

### 12. Extensibility

- Add new meal types/categories by extending `categories` and tagging dishes
- Add new pages/components following existing patterns; use TanStack Query and `mapApiRouteToSupabase`
- Toggle direct REST vs Drizzle by providing/removing Supabase REST env vars

---
This document reflects the actual codebase (frontend, backend, database, and services) and the latest logic for category/dish fetching and guest cart handling.


