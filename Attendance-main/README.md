# SmartCampus Attend

Enterprise attendance & campus operations platform — Next.js 14 (App Router), TypeScript,
Tailwind, Framer Motion, Recharts, and Firebase.

Charcoal/amber/wine design system, dark-first with a light toggle, six role-aware
dashboards, an interactive attendance + meal-capture workflow, command palette, and a
marketing landing + auth flow.

## Run locally

```bash
npm install
npm run dev          # http://localhost:3000
```

Out of the box the app runs in **demo mode** (mock data, no backend) so every screen is
explorable. Open `/dashboard` to pick a role, or use the role switcher in the top bar.

## Connect Firebase (real backend)

1. Create a project at [firebase.google.com](https://firebase.google.com).
2. Enable **Authentication** (Email/Password) and **Cloud Firestore** in the Firebase console.
3. Copy `.env.example` → `.env.local` and fill in:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `FIREBASE_ADMIN_CLIENT_EMAIL`
   - `FIREBASE_ADMIN_PRIVATE_KEY`
4. Set `NEXT_PUBLIC_USE_MOCK=false` (or remove it). The app now uses real Firebase Auth
   (email/password + Google/Microsoft OAuth if enabled) and the middleware protects `/dashboard`.

For Google/Microsoft sign-in, enable those providers in **Firebase → Authentication →
Sign-in method** and add `http://localhost:3000/dashboard` as an authorized domain.

## Project structure

```
src/
  app/
    page.tsx                     Marketing landing
    login/                       Auth (email + OAuth, mock-aware)
    dashboard/
      page.tsx                   Role picker
      [role]/                    Role-aware shell + overview dashboards
        [section]/               Sub-modules (interactive session + scaffolds)
  components/
    shell/                       Sidebar, topbar, mobile nav
    dashboards/                  One component per role + facilitator session
    dashboard/                   Reusable widgets (stat card, charts, live feed, …)
    ui/                          Primitives (button, card, badge, input, avatar)
  lib/
    types.ts  roles.tsx  mock-data.ts  utils.ts
    firebase/                    Browser + server clients, config
```

## Roles

Super Admin · Campus Admin · Facilitator · Kitchen Manager · Student · Security Officer.
Each has a tailored navigation, accent, and dashboard. The **Facilitator → Take
Attendance** screen is a fully interactive workflow (method selection, live status
marking, and per-student meal preference capture).

## Build

```bash
npm run build && npm run start
```
