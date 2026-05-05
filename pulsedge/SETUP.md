# Pulsedge Setup Guide

## 1. Install dependencies

```bash
cd pulsedge
npm install
```

## 2. Configure environment variables

Copy `.env.local.example` to `.env.local` and fill in all values:

```bash
cp .env.local.example .env.local
```

### Getting API keys

**Supabase** — [supabase.com](https://supabase.com)
1. Create a new project
2. Go to Project Settings → API
3. Copy `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
4. Copy `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Copy `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

**Twelve Data** — [twelvedata.com](https://twelvedata.com)
1. Sign up for free (800 requests/day free tier)
2. Copy API key → `TWELVE_DATA_API_KEY`

**Anthropic** — [console.anthropic.com](https://console.anthropic.com)
1. Create API key → `ANTHROPIC_API_KEY`

## 3. Set up Supabase database

Run the migration in your Supabase SQL editor:

```sql
-- Copy the contents of supabase/migrations/001_initial.sql
```

Or use the Supabase CLI:
```bash
supabase db push
```

## 4. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 5. Generate your first analysis

Once the app is running and env vars are set, trigger analysis generation:

```bash
curl -X POST http://localhost:3000/api/analysis/generate \
  -H "Authorization: Bearer your-cron-secret"
```

Or set `CRON_SECRET=` (empty) temporarily to skip auth for local testing.

## 6. Deploy to Vercel

```bash
npm install -g vercel
vercel --prod
```

Add all environment variables in the Vercel dashboard under Project → Settings → Environment Variables.

The `vercel.json` cron job will automatically call `/api/analysis/generate` at 06:00 UTC daily.

## Architecture

```
src/
├── app/                    # Next.js 14 App Router pages + API routes
│   ├── page.tsx            # Homepage
│   ├── dashboard/          # Market dashboard (charts + bias)
│   ├── analysis/           # Daily analysis archive
│   ├── calendar/           # Economic calendar
│   ├── auth/               # Login / signup / callback
│   └── api/
│       ├── analysis/       # GET analyses + POST generate
│       ├── chat/           # Streaming Claude AI chat
│       └── calendar/       # ForexFactory RSS proxy
├── components/
│   ├── layout/             # Header, ThemeToggle, AuthButton
│   ├── market/             # TradingView widget, MarketCard, MarketSection
│   ├── analysis/           # AnalysisCard, BiasIndicator
│   ├── calendar/           # CalendarEvent
│   ├── auth/               # AuthForm
│   └── chat/               # ChatWidget (floating)
├── lib/
│   ├── supabase/           # Supabase browser + server clients
│   ├── twelve-data.ts      # Twelve Data API wrapper
│   ├── claude.ts           # Anthropic SDK (analysis + chat stream)
│   └── markets.ts          # Symbol definitions
└── types/index.ts          # Shared TypeScript types
```
