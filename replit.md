# Plattr - Bangalore Catering & Bulk Meal Service

## Overview

Plattr is a mobile-first catering and bulk meal ordering application built for the Bangalore market. The application enables users to order traditional South Indian tiffins, snacks, lunch/dinner options, and various catering services. It features a modern React-based frontend with Capacitor for mobile deployment (Android/iOS), backed by Supabase for data persistence and authentication.

The project architecture has evolved from an Express-based backend to a serverless approach using Supabase Edge Functions, with direct client-to-Supabase communication for most operations. This shift reduces infrastructure complexity while maintaining security through Row Level Security (RLS) policies.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite (configured with custom plugins for meta images and runtime error handling)
- **Styling**: Tailwind CSS with custom theme configuration
- **UI Components**: Shadcn/ui (New York style) with Radix UI primitives
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state, React Context for auth state
- **Mobile Wrapper**: Capacitor 7 for Android/iOS native builds

**Key Design Decisions:**
1. **Client Directory Structure**: All frontend code lives in `client/` with Vite configured to use this as root. This separation keeps frontend code isolated from server/shared code.

2. **Path Aliases**: TypeScript path aliases simplify imports:
   - `@/` → `client/src/` (frontend code)
   - `@shared/` → `shared/` (shared types/schemas)
   - `@assets/` → `attached_assets/` (static assets)

3. **Component System**: Using Shadcn/ui provides a consistent design system with customizable components. The "New York" style variant was chosen for a modern, clean aesthetic.

4. **Custom Font**: Sweet Sans Pro font family with multiple weights (100-900) loaded via `@font-face` for brand consistency.

5. **Theme Configuration**: Light mode only (dark mode explicitly disabled) with custom HSL color variables for consistent theming across components.

6. **Mobile-First Approach**: Viewport meta tags configured for mobile web apps with status bar styling for native feel.

### Backend Architecture (Transitional State)

**Current State**: The project is in transition from Express-based backend to Supabase-only architecture.

**Legacy Express Server** (in `server/` directory):
- Express.js server with TypeScript
- Vite dev middleware integration for development
- Session-based authentication (being phased out)
- REST API routes (being migrated to Edge Functions)

**Target Architecture** (Supabase-based):
1. **Direct Supabase Client**: Frontend communicates directly with Supabase REST API
2. **Edge Functions**: Server-side operations (OTP, payments) run as Deno-based Edge Functions
3. **Row Level Security**: Database security enforced at the PostgreSQL level via RLS policies

**Authentication Flow**:
- **OTP-based**: Phone verification via 2Factor.in SMS service
- **Email/Password**: Standard Supabase Auth (optional)
- **Session Management**: Supabase handles sessions with automatic refresh
- **Demo Bypass**: Development mode allows bypassing OTP for faster testing

### Data Storage Solutions

**Primary Database**: Supabase (PostgreSQL)

**Schema Design** (defined in `shared/schema.ts`):
- **users**: User profiles with phone/email verification
- **addresses**: User delivery addresses
- **categories**: Meal categories (tiffins, snacks, lunch-dinner)
- **dishes**: Menu items with pricing, dietary info, spice levels
- **add_ons**: Optional add-ons for orders
- **cart_items**: Shopping cart persistence
- **orders**: Order records
- **order_items**: Individual items within orders
- **mealbox_orders**: Subscription-based meal box orders
- **bulk_meal_orders**: Large quantity orders
- **catering_orders**: Event catering orders
- **corporate_orders**: Corporate meal orders
- **concierge_preferences**: AI-powered menu recommendations
- **otp_verifications**: OTP verification tracking

**Database Access Patterns**:
1. **Drizzle ORM** (optional, legacy): Type-safe database queries via `server/db.ts`
2. **Supabase REST API** (preferred): Direct HTTP queries via `server/supabase-rest.ts`
3. **Client-Side Supabase SDK**: Direct database access from frontend with RLS protection

**Security**:
- Row Level Security (RLS) policies ensure users can only access their own data
- Service role key reserved for admin operations only
- Anon key used for client-side operations with RLS enforcement

### Authentication and Authorization

**Primary Method**: Supabase Auth with custom OTP flow

**OTP Flow**:
1. User enters phone number
2. Backend sends OTP via 2Factor.in SMS service
3. User enters OTP code
4. Backend verifies OTP and creates/authenticates Supabase session
5. Auto-creates user record in `users` table if first login

**Implementation Files**:
- `client/src/hooks/useAuth.ts`: Auth state management hook
- `client/src/lib/supabase-auth.ts`: Supabase client configuration
- Edge Functions: `send-otp`, `verify-otp` handle OTP operations

**Session Management**:
- PKCE flow enabled for enhanced security
- Automatic token refresh via Supabase SDK
- Auth state listener (`onAuthStateChange`) for reactive updates
- Custom storage key to avoid conflicts

**Development Features**:
- Demo bypass mode (`BYPASS_AUTH=true`) for local development
- Test phone numbers configurable via environment variables
- Auto-creation of demo user when bypass enabled

### Mobile Architecture (Capacitor)

**Configuration** (`capacitor.config.ts`):
- App ID: `com.caterplanner.app`
- Web directory: `dist/public` (Vite build output)
- Development mode: Points to local dev server (`http://10.0.2.2:PORT` for Android emulator)
- Production mode: Uses bundled web assets with HTTPS scheme

**Development Workflow**:
- `npm run android:dev` - Live reload development on emulator
- `npm run android:sync` - Sync web assets to native projects
- `npm run android:run` - Build and run on emulator/device

**Platform-Specific Considerations**:
- Android emulator uses `10.0.2.2` to access host machine's localhost
- Physical devices require actual network IP address
- Status bar styled for native app experience

## External Dependencies

### Database and Backend Services

**Supabase** (Primary Infrastructure):
- **PostgreSQL Database**: Primary data store with RLS
- **Authentication**: Phone OTP and email/password auth
- **Storage**: File uploads (if needed)
- **Edge Functions**: Serverless functions for OTP and payments
- Configuration via: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

**NeonDB** (Optional Alternative):
- Serverless PostgreSQL alternative
- WebSocket support via `@neondatabase/serverless`
- Connection pooling for better performance

### Payment Processing

**Stripe**:
- Payment intents for order checkout
- Server-side: `stripe` npm package with secret key
- Client-side: `@stripe/stripe-js` and `@stripe/react-stripe-js`
- Configuration: `STRIPE_SECRET_KEY` (server), publishable key (client)
- Edge Function: `create-payment-intent` for secure payment creation

### SMS/OTP Service

**2Factor.in** (Primary SMS Provider):
- OTP delivery via SMS
- Template-based messaging (template name: "PLATTR")
- Configuration: `TWOFACTOR_API_KEY`, `TWOFACTOR_TEMPLATE_NAME`
- Fallback: `BULK_SMS_API_KEY` for alternative SMS provider

**BulkSMS** (Alternative Provider):
- Backup SMS gateway
- Same API interface as 2Factor

### UI Component Libraries

**Radix UI Primitives** (20+ components):
- Unstyled, accessible components
- Full suite: Accordion, Dialog, Dropdown, Select, Toast, etc.
- Styled via Tailwind with Shadcn/ui patterns

**Lucide Icons**:
- Icon library for consistent iconography
- Tree-shakeable for optimal bundle size

### Development Tools

**Replit Plugins** (when `REPL_ID` is set):
- `@replit/vite-plugin-cartographer`: Source code visualization
- `@replit/vite-plugin-dev-banner`: Development mode banner
- `@replit/vite-plugin-runtime-error-modal`: Better error display
- Only loaded in development, excluded from production builds

**Drizzle Kit**:
- Database schema migrations
- Type generation from schema
- Configuration: `drizzle.config.ts` with PostgreSQL dialect

### Build and Development

**Vite Ecosystem**:
- `@vitejs/plugin-react`: React Fast Refresh support
- `@tailwindcss/vite`: Tailwind CSS v4 integration
- Custom plugins: `vite-plugin-meta-images` for OG image handling

**TypeScript**:
- Strict mode enabled
- ESNext module system
- Incremental compilation for faster builds

### Mobile Platform

**Capacitor Plugins**:
- `@capacitor/core`: Core runtime
- `@capacitor/app`: App lifecycle events
- `@capacitor/android`: Android platform support
- `@capacitor/ios`: iOS platform support
- CLI: `@capacitor/cli` for build and sync operations

### Form Handling

**React Hook Form**:
- Form state management
- `@hookform/resolvers` for Zod schema validation
- Integration with Shadcn/ui form components

**Zod**:
- Runtime type validation
- Schema definitions shared between client and server
- `drizzle-zod` for automatic schema generation

### Utilities

**Date Handling**: `date-fns` for date manipulation
**Unique IDs**: `nanoid` for generating short unique identifiers
**Excel Export**: `xlsx` for data export features (if applicable)
**WebSocket**: `ws` for real-time features (if needed)