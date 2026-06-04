# Stationery Shop

A React + Vite e-commerce application for stationery products, powered by **Clerk authentication** and **Supabase database**.

## Tech Stack

- **Frontend:** React 19 + TypeScript + Vite
- **Authentication:** Clerk (identity provider, OAuth, MFA)
- **Database:** Supabase (PostgreSQL with Row Level Security)
- **Routing:** React Router v7

## Setup Instructions

### 1. Create Accounts & Get API Keys

#### Clerk
1. Go to [clerk.com](https://clerk.com) and create an account
2. Create a new application
3. In the **API Keys** section, copy your **Publishable Key** (starts with `pk_`)
4. Go to **JWT Templates** → **New Template** → Select **Supabase**
5. Name the template `supabase` (important: must match the template name used in code)
6. Configure the claims as needed (default mapping is fine)
7. Save the template

#### Supabase
1. Go to [supabase.com](https://supabase.com) and create an account
2. Create a new project
3. In **Project Settings** → **API**, copy your **Project URL** and **anon public key**
4. In **Project Settings** → **API** → **JWT Settings**, paste the **JWT signing secret** from your Clerk Supabase template (this lets Supabase verify Clerk's tokens)

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in your keys:

```bash
cp .env.example .env
```

Edit `.env`:
```
VITE_CLERK_PUBLISHABLE_KEY=pk_your_clerk_key
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ_your_anon_key
```

### 3. Database Setup

1. Go to your Supabase Dashboard → **SQL Editor**
2. Open and run the SQL from `supabase-schema.sql`
3. This creates the `profiles` table, enables RLS, and sets up security policies

### 4. Webhook Setup (User Sync)

Clerk webhooks automatically sync users to your Supabase `profiles` table when they sign up.

#### Option A: Deploy as serverless function
Deploy `server/webhook.ts` to Vercel, Netlify, Cloudflare Workers, or any Node.js serverless platform. Set these environment variables on your deployment:
- `CLERK_WEBHOOK_SECRET` — from Clerk Dashboard → Webhooks → your endpoint → Signing Secret
- `VITE_SUPABASE_URL` — your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` — from Supabase Dashboard → Settings → API → `service_role` key

#### Option B: Local development with Express
```bash
cd server
npm install
npm run dev
```

Then use [ngrok](https://ngrok.com) to expose your local server:
```bash
ngrok http 3001
```

Add the ngrok URL to Clerk Dashboard → **Webhooks** → **Add Endpoint**:
- Endpoint URL: `https://your-ngrok-url.ngrok.io/api/webhooks/clerk`
- Events: Select `user.created`, `user.updated`, `user.deleted`
- Copy the Signing Secret and set it as `CLERK_WEBHOOK_SECRET`

### 5. Run the App

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Architecture

```
┌─────────────────┐     JWT Token      ┌─────────────────┐
│   React App     │ ──────────────────► │    Supabase      │
│  (Vite + Clerk) │                     │  (PostgreSQL)    │
│                 │◄────────────────── │  + RLS Policies  │
│  Clerk UI       │   Data + Auth       │                  │
│  Components     │                     │  profiles table  │
└────────┬────────┘                     └────────┬────────┘
         │                                       │
         │ User signs up                         │ Service role key
         ▼                                       │
┌─────────────────┐                              │
│   Clerk Auth    │                              │
│  (Identity Pro) │                              │
│                 │──── Webhook (user.created) ──►
└─────────────────┘                              │
                                                 │
                                    ┌────────────┴────────┐
                                    │  server/webhook.ts   │
                                    │  (Verifies Svix sig) │
                                    └─────────────────────┘
```

### Key Flows

1. **Sign Up:** User signs up via Clerk's UI → Clerk creates the user → Webhook event `user.created` → Server syncs user to Supabase `profiles` table
2. **Sign In:** User signs in via Clerk → Clerk issues JWT → App sends JWT to Supabase as `Authorization: Bearer <token>` → Supabase verifies JWT against Clerk's signing secret → RLS policies authorize the request
3. **Profile:** Authenticated user visits `/profile` → App gets JWT via `getToken({ template: 'supabase' })` → Fetches profile from Supabase → RLS ensures user can only see their own data

## Project Structure

```
stationary/
├── .env.example             # Environment variables template
├── supabase-schema.sql      # Database schema + RLS policies
├── server/
│   ├── package.json         # Server dependencies
│   ├── index.ts             # Express webhook server
│   └── webhook.ts           # Webhook handler (deployable)
├── src/
│   ├── main.tsx             # Entry point (ClerkProvider + BrowserRouter)
│   ├── App.tsx              # Routes
│   ├── index.css            # Global styles
│   ├── lib/
│   │   ├── supabase.ts      # Supabase client with Clerk JWT
│   │   └── database.types.ts # TypeScript types for Supabase
│   ├── components/
│   │   ├── Navbar.tsx       # Navigation with auth status
│   │   └── Layout.tsx       # App layout wrapper
│   └── pages/
│       ├── HomePage.tsx     # Landing page
│       ├── SignInPage.tsx   # Clerk Sign In
│       ├── SignUpPage.tsx   # Clerk Sign Up
│       └── ProfilePage.tsx  # Protected profile page
└── package.json
```
