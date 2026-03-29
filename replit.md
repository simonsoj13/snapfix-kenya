# FixIt — Repair Services Marketplace

## Overview
A full-stack service marketplace app connecting users with skilled repair workers (plumbers, electricians, welders, carpenters, HVAC techs, appliance techs). Features full auth, multi-step booking with AI quotes, M-Pesa STK push simulation, ratings & tips, and an Uber-style admin dashboard.

## Tech Stack
- **Frontend**: React 18, Vite, TailwindCSS, Shadcn UI, TanStack Query, Wouter
- **Backend**: Express.js, Node.js (ESM)
- **AI**: OpenAI GPT-4o-mini (vision) for image-based repair analysis; fake AI quotation engine
- **Map**: React Leaflet + OpenStreetMap (free, no API key needed)
- **Storage**: In-memory (MemStorage) — easily swappable for PostgreSQL
- **Charts**: Recharts (admin dashboard)

## Architecture

### Frontend Pages
- `/login` — Login / Register with email + phone, role selection (customer/worker)
- `/` — Home: Hero + "Book a Repair Now" CTA, category grid, worker grid/map
- `/book` — Multi-step Booking Flow (7 steps)
- `/search` — Search & Filter: Workers with live filters, grid/map toggle
- `/requests` — My Requests: Job history with quote/deposit/status info
- `/profile` — User Profile: Real auth info + logout
- `/admin` — Admin Dashboard: Analytics, live map, worker/request management

### Multi-Step Booking Flow (/book)
1. **Photo** — Upload/take a photo; AI detects repair category
2. **Describe** — Select area (bathroom/kitchen/sitting-room/bedroom/compound) + describe problem + location
3. **Quote** — Fake AI generates quote (KES), breakdown, deposit (30%)
4. **Worker** — Browse and select a worker for the detected category
5. **Schedule** — "Right Now" or pick date+time; confirm deposit payment
6. **Booked** — Worker contact (phone + email) revealed; "Worker Deployed" status
7. **Payment** — M-Pesa STK Push simulation for balance; star rating + tip

### Key Components
- `BookingFlow` — 7-step wizard (photo → describe → quote → worker → schedule → booked → pay+rate)
- `LoginPage` — Auth with email/phone + password, role picker
- `AuthContext` — Global auth state persisted to localStorage
- `WorkerCard` — Displays a worker with profile, rating, rate, distance
- `WorkerProfileModal` — Full worker profile in a dialog
- `WorkerMapView` — Interactive Leaflet map showing all workers with popups
- `PhotoUploadCard` — Camera/file upload trigger
- `ServiceCategoryCard` — Category filter tile
- `JobStatusBadge` — Status pill (pending/deposit-paid/in-progress/completed/cancelled)
- `TopNav` / `BottomNav` — Sticky navigation (bottom tabs on mobile, admin icon in top nav)

### Backend Routes
**Auth**
- `POST /api/auth/register` — Register with name, email, phone, password, role
- `POST /api/auth/login` — Login with email or phone + password

**AI**
- `POST /api/analyze-image` — Multer upload + OpenAI Vision analysis
- `POST /api/quote` — AI quotation based on category + area + description

**Workers**
- `GET /api/workers` — All workers
- `GET /api/workers/search` — Filter by specialty, distance, availability, verified
- `GET /api/workers/:id` — Single worker

**Job Requests**
- `POST /api/job-requests` — Create a job request
- `GET /api/job-requests/user/:userId` — Get requests for a user
- `PATCH /api/job-requests/:id/status` — Update status
- `PATCH /api/job-requests/:id` — Update any fields

**Admin**
- `GET /api/admin/stats` — Platform-wide KPIs
- `GET /api/admin/requests-trend` — 7-day time-series
- `GET /api/admin/category-breakdown` — Category pie data
- `GET /api/admin/requests` — All requests
- `GET /api/admin/workers` — All workers
- `PATCH /api/admin/workers/:id/toggle-availability` — Toggle worker status

## Environment Variables
- `OPENAI_API_KEY` — Required for AI image analysis (gracefully degrades without it)
- `SESSION_SECRET` — Session secret

## Running the App
```bash
npm run dev
```
Starts Express on port 5000 serving both API and Vite frontend.

## Worker Data
6 workers seeded in memory with Nairobi-based locations, phone/email contacts, across all specialties. Profile images mapped client-side via `workerImages.ts`.

## Schema
- **users**: id, name, email, phone, password, role (customer|worker)
- **workers**: + phone, email fields
- **jobRequests**: + area, quotedAmount, depositAmount, isNow, workerContactShown
