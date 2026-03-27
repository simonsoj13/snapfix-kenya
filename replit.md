# FixIt — Repair Services Marketplace

## Overview
A full-stack service marketplace app that connects users with skilled repair workers (plumbers, electricians, welders, carpenters, HVAC techs, appliance techs). Users can upload a photo of their repair need, get AI-powered analysis, browse workers on a map or grid, and submit job requests.

## Tech Stack
- **Frontend**: React 18, Vite, TailwindCSS, Shadcn UI, TanStack Query, Wouter
- **Backend**: Express.js, Node.js (ESM)
- **AI**: OpenAI GPT-4o-mini (vision) for image-based repair analysis
- **Map**: React Leaflet + OpenStreetMap (free, no API key needed)
- **Storage**: In-memory (MemStorage) — easily swappable for PostgreSQL

## Architecture

### Frontend Pages
- `/` — Home: Hero with photo upload + AI analysis, category grid, worker grid/map
- `/search` — Search & Filter: Workers with live filters, grid/map toggle
- `/requests` — My Requests: Job request history and status tracking
- `/profile` — User Profile: Settings and personal info

### Key Components
- `WorkerCard` — Displays a worker with profile, rating, rate, distance
- `WorkerProfileModal` — Full worker profile + job request form in a dialog
- `WorkerMapView` — Interactive Leaflet map showing all workers with popups
- `PhotoUploadCard` — Camera/file upload trigger
- `AIAnalysisCard` — Shows AI-detected category + editable job description
- `ServiceCategoryCard` — Category filter tile
- `JobStatusBadge` — Status pill for pending/in-progress/completed/cancelled
- `TopNav` / `BottomNav` — Sticky navigation (bottom tabs on mobile)
- `ThemeProvider` / `ThemeToggle` — Dark/light mode support

### Backend Routes
- `POST /api/analyze-image` — Multer upload + OpenAI Vision analysis
- `GET /api/workers` — All workers
- `GET /api/workers/search` — Filter by specialty, distance, availability, verified
- `GET /api/workers/:id` — Single worker
- `POST /api/job-requests` — Create a job request
- `GET /api/job-requests/user/:userId` — Get requests for a user
- `PATCH /api/job-requests/:id/status` — Update request status

## Environment Variables
- `OPENAI_API_KEY` — Required for AI image analysis (gracefully degrades without it)
- `SESSION_SECRET` — Session secret

## Running the App
```bash
npm run dev
```
Starts Express on port 5000 serving both API and Vite frontend.

## Worker Data
Workers are seeded in memory with 6 profiles across specialties. Profile images are mapped client-side from the `specialty` field using `client/src/lib/workerImages.ts`.

## Future Improvements
- PostgreSQL persistence for users, workers, and job requests
- Real-time geolocation using browser's navigator API
- Payment processing (Stripe)
- In-app messaging between user and worker
- Worker onboarding and verification flow
