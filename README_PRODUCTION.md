# Campus Attendance System - Production Edition

## 🎯 Status: Firebase-Only, Production Ready

All mock data and demo integrations have been removed. **This system is now 100% Firebase/Firestore-dependent.**

---

## ⚡ Quick Start

### Prerequisites
- Firebase project with Auth + Firestore enabled
- All environment variables configured (see `.env.example`)

### 1. Setup Environment
```bash
cp .env.example .env.local
# Fill in your Firebase credentials
```

### 2. Install & Build
```bash
npm install
npm run build
```

### 3. Run
```bash
npm run dev          # Development
npm run start        # Production
```

### 4. Access
- **URL**: http://localhost:3000/login
- **Auth**: Firebase credentials only (no demo mode)

---

## 🔐 Authentication

This system uses **Firebase Authentication** exclusively.

### User Flow
1. Navigate to `/login`
2. Choose a role (super_admin, campus_admin, facilitator, etc.)
3. Enter your Firebase credentials
4. Session cookie created
5. Redirected to role-based dashboard

### Demo/Test Accounts
- Create users in Firebase Console
- Add profile entry in Firestore `profiles` collection with the correct `role`

---

## 🗄️ Firestore Collections

All data comes from Firestore. Required collections:

| Collection | Purpose | Example |
|-----------|---------|---------|
| `profiles` | User accounts & roles | `{ email, name, role, department, avatarColor }` |
| `campuses` | Institutions | `{ name, location, students, status }` |
| `departments` | Academic departments | `{ name, faculty, students, attendanceRate }` |
| `buildings` | Campus locations | `{ name, campusId, capacity, occupancy }` |
| `sessions` | Active attendance sessions | `{ course, facilitator, status, present, total }` |
| `attendance` | Live event feed | `{ student, course, status, method, time }` |
| `meals` | Menu items | `{ meal, name, preference, served }` |
| `auditLogs` | Security events | `{ actor, action, severity, time }` |
| `notifications` | User notifications | `{ title, body, type, read }` |
| `students` | Student profiles | `{ name, studentId, department, attendanceRate }` |
| `weeklyAttendance` | Chart data | `{ day, present, absent, late }` |
| `hourlyOccupancy` | Chart data | `{ hour, occupancy }` |
| `departmentTrend` | Analytics | `{ department, rate }` |
| `aiInsights` | AI suggestions | `{ text, tag, tone }` |
| `mealSplit` | Meal preferences | `{ name, value, color }` |

**See [PRODUCTION_MIGRATION.md](PRODUCTION_MIGRATION.md) for complete schemas.**

---

## 🏗️ Architecture

### Frontend (Client-Side)
- Next.js App Router
- React 18 with hooks
- TailwindCSS styling
- Firestore React hooks in `src/lib/firebase/data.ts`

### Backend (Server-Side)
- Next.js API routes
- Firebase Admin SDK
- Session cookie auth
- Role-based access control

### Database
- Firebase/Firestore for all persistent data
- No local database or mock data

---

## 📊 Dashboard Roles

| Role | Access | Dashboard |
|------|--------|-----------|
| `super_admin` | Platform-wide | Global overview, all campuses |
| `campus_admin` | Single campus | Campus operations, live monitor |
| `facilitator` | Own classes | Attendance tracking, class schedule |
| `kitchen_manager` | Meal service | Menu, meal prep, distribution |
| `security_officer` | Security | Audit logs, fraud detection, heatmap |
| `student` | Self | (Not yet implemented) |

---

## 🚀 Deployment

### Vercel (Recommended)
```bash
vercel link
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
# ... add all other env vars
vercel deploy
```

### Docker / Self-Hosted
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm ci && npm run build
CMD ["npm", "run", "start"]
```

---

## 🔒 Production Checklist

- [ ] Firebase project created & configured
- [ ] Firestore collections populated
- [ ] All environment variables set
- [ ] Security rules enabled
- [ ] Test users created
- [ ] Build passes TypeScript check
- [ ] No console errors in dev/prod
- [ ] Sign in works with Firebase
- [ ] Dashboards load data correctly
- [ ] Session management works
- [ ] Role-based access verified

---

## 📚 Key Docs

- **[PRODUCTION_MIGRATION.md](PRODUCTION_MIGRATION.md)** - Complete setup & schema guide
- **[MIGRATION_COMPLETE.md](MIGRATION_COMPLETE.md)** - Summary of all changes
- **[package.json](package.json)** - Dependencies & scripts
- **[.env.example](.env.example)** - Environment template

---

## 🐛 Troubleshooting

### "Firebase is not configured"
Check `.env.local` has all `NEXT_PUBLIC_FIREBASE_*` variables.

### "Unauthorized" on dashboard
- Verify Firebase session cookie is set
- Check user has profile in Firestore `profiles` collection with valid `role`
- Ensure `FIREBASE_ADMIN_*` env vars are correct

### Collections appear empty
- Add test documents in Firestore Console
- Verify Firestore Security Rules allow reads for authenticated users
- Check API route returns data: `GET /api/admin/firestore?collection=campuses`

### Build fails
```bash
npm run build
# Check for TypeScript errors
# Ensure Firebase packages installed
npm install firebase firebase-admin
```

---

## 🎓 Development

### Add a New Collection

1. Create Firestore collection in Console
2. Add hook to `src/lib/firebase/data.ts`:
```javascript
export function useMyCollection() {
  return useFirestore<MyType>("myCollection");
}
```
3. Use in component:
```javascript
const { rows: myData = [] } = useMyCollection();
```

### Update Roles
Edit `src/lib/roles.tsx` to add new roles or modify existing ones.

### Database Security
Firestore Security Rules configured in Firebase Console (see PRODUCTION_MIGRATION.md).

---

## 📞 Support

- **Firebase Docs**: https://firebase.google.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Firestore Docs**: https://firebase.google.com/docs/firestore

---

**Last Updated**: June 3, 2026  
**Version**: 1.0.0 (Production Ready)  
**Status**: ✅ All mock data removed | ✅ Firebase-only | ✅ Production ready
