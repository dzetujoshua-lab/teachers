# SmartCampus Attend

Enterprise attendance and campus operations platform: Next.js 14 App Router, TypeScript,
Tailwind, Framer Motion, Recharts, and Firebase.

Charcoal/amber/wine design system, dark-first with a light toggle, role-aware dashboards,
an interactive attendance and meal-capture workflow, command palette, mock user registry,
and production-ready Firebase auth/profile wiring.

## Run Locally

```bash
npm install
npm run dev          # http://localhost:3000
```

Out of the box the app runs in demo mode, using the mock registry in `src/lib/mock-data.ts`.
Open `/login` to pick a registry user, or open `/dashboard` to choose a workspace.

## Connect Firebase

1. Create a Firebase project at <https://console.firebase.google.com>.
2. Enable Email/Password sign-in in Firebase Authentication.
3. Create a web app and copy its config into `.env.local`.
4. Create a Firebase service account and add its client email/private key to `.env.local`.
5. Store production profiles in Firestore at `profiles/{uid}` with at least:

```json
{
  "email": "user@campus.edu",
  "role": "campus_admin",
  "forcePasswordReset": false
}
```

Set `NEXT_PUBLIC_USE_MOCK=false` once Firebase values are present. The app then signs in
with Firebase Auth, stores profile data in Firestore, and protects dashboard routes with
the Firebase session cookie.

## Password Reset And Admin Temporary Passwords

- Users can request Firebase password reset emails from `/reset-password`.
- Super admins can create or reset temporary Firebase Auth credentials from settings.
- Temporary accounts are written to Firestore with `forcePasswordReset: true`.
- Every supported role has its own dedicated login page under `/login/[role]`.

## Project Structure

```text
src/
  app/
    page.tsx                     Marketing landing
    login/                       Firebase and demo-registry auth
    dashboard/
      page.tsx                   Workspace picker
      [role]/                    Role-aware shell + overview dashboards
        [section]/               Sub-modules
  components/
    shell/                       Sidebar, topbar, mobile nav
    dashboards/                  One component per role + facilitator session
    dashboard/                   Reusable widgets
    ui/                          Primitives
  lib/
    firebase/                    Client/Admin Firebase helpers
    mock-data.ts                 Demo data and user registry
    mock-users.ts                Demo user lookup helpers
    types.ts  roles.tsx  utils.ts
```

## Roles

Super Admin, Campus Admin, Facilitator, Kitchen Manager, and Security Officer each have
tailored navigation, accent styling, and dashboard workflows.

## Build

```bash
npm run build && npm run start
```
