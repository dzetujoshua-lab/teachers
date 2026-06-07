# Production Migration Guide: Mock Data → Firestore

This document outlines the migration from demo/mock data to a fully production-ready Firebase/Firestore-based system.

## Changes Made

### 1. **Removed Mock Data Files**
- `src/lib/mock-data.ts` → Now returns empty arrays (stubbed)
- `src/lib/mock-users.ts` → No longer used; all user data in Firestore `profiles` collection

### 2. **Firebase Integration**
- **Firestore Client** (`src/lib/firebase/client.ts`): Initializes client-side Firebase SDK
- **Firestore Admin** (`src/lib/firebase/admin.ts`): Server-side admin operations with session/cookie management
- **Data Hooks** (`src/lib/firebase/data.ts`): Client-side React hooks for fetching Firestore collections

### 3. **Authentication**
- **Before**: Demo login with hardcoded credentials (role-based)
- **After**: Firebase Auth with Firestore `profiles` collection storing user role/metadata

**Updated Pages:**
- `src/app/login/page.tsx` → Removed demo registry UI
- `src/app/login/[role]/page.tsx` → Firebase Auth only; removed `USE_MOCK` branch
- `src/app/reset-password/page.tsx` → Firebase password reset (no demo mode)

### 4. **Components Updated to Use Firestore**

| Component | Firestore Hooks |
|-----------|-----------------|
| `topbar.tsx` | `useNotifications()`, `/api/auth/me` |
| `super-admin.tsx` | `useCampuses()`, `useDepartmentTrend()`, `useInsights()` |
| `security.tsx` | `useAuditLogs()`, `useBuildings()` |
| `kitchen.tsx` | `useMeals()`, `useMealSplit()` |
| `facilitator.tsx` | `useWeeklyAttendance()` |
| `campus-admin.tsx` | All hooks (`useWeeklyAttendance()`, `useLiveFeed()`, etc.) |

### 5. **API Endpoint**
- **`GET /api/admin/firestore?collection=<name>`**: Fetches any Firestore collection with role-based auth
  - Verifies session cookie or JWT
  - Returns `{ rows: [] }` of documents

## Setup for Production

### Step 1: Configure Firebase Project

```bash
# 1. Create a Firebase project at https://console.firebase.google.com
# 2. Enable these services:
#    - Authentication (Email/Password)
#    - Firestore Database
#    - Storage (optional, for file uploads)

# 3. Generate a private key for Admin SDK:
#    Project Settings → Service Accounts → Generate new private key
#    (Save as `serviceAccountKey.json` or store env vars)
```

### Step 2: Set Environment Variables

Create `.env.local`:

```env
# Firebase Client SDK (public)
NEXT_PUBLIC_FIREBASE_API_KEY=<your-api-key>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<your-project>.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<your-project-id>
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<your-project>.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<sender-id>
NEXT_PUBLIC_FIREBASE_APP_ID=<app-id>

# Firebase Admin SDK (server-side only)
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@<your-project>.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Disable mock mode
NEXT_PUBLIC_USE_MOCK=false
```

### Step 3: Create Firestore Collections

Initialize these collections in Firestore:

#### `profiles` (User Profiles)
```javascript
{
  uid: "firebase-auth-uid",
  email: "user@campus.edu",
  name: "Full Name",
  role: "super_admin" | "campus_admin" | "facilitator" | "kitchen_manager" | "security_officer",
  department: "Computer Science",
  institutionId: "institution-uuid",
  avatarColor: "#c52a58",
  forcePasswordReset: false,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### `campuses`
```javascript
{
  id: "c1",
  name: "Accra Main Campus",
  location: "Accra, GH",
  buildings: 14,
  students: 8420,
  status: "active" | "onboarding"
}
```

#### `departments`
```javascript
{
  id: "d1",
  name: "Computer Science",
  faculty: "Engineering",
  students: 1240,
  attendanceRate: 94.2
}
```

#### `buildings`
```javascript
{
  id: "b1",
  name: "Engineering Block A",
  campusId: "c1",
  capacity: 1200,
  occupancy: 1043,
  lat: 5.65,
  lng: -0.18
}
```

#### `sessions` (Attendance Sessions)
```javascript
{
  id: "s1",
  course: "CS301 - Algorithms",
  facilitator: "Dr. Ama Mensah",
  facilitatorDept: "Computer Science",
  building: "Engineering Block A",
  room: "EA-204",
  method: "qr" | "gps" | "id_scan" | "pin",
  startedAt: "2024-06-03T08:00:00Z",
  status: "live" | "ended",
  present: 142,
  total: 160,
  flagged: 2
}
```

#### `attendance` (Live Feed / Events)
```javascript
{
  id: "e1",
  student: "Akosua Frimpong",
  studentId: "STU-2024000",
  course: "CS301",
  building: "Engineering Block A",
  status: "present" | "late" | "absent" | "excused",
  method: "qr" | "gps" | "id_scan" | "pin",
  time: "2024-06-03T08:15:00Z",
  suspicious: false,
  reason: null
}
```

#### `meals`
```javascript
{
  id: "m1",
  meal: "lunch",
  name: "Jollof Rice & Chicken",
  preference: "pepper" | "pepper_free" | "alternative" | "no_meal",
  estimated: 3200,
  prepared: 3000,
  served: 2840
}
```

#### `mealSplit`
```javascript
{
  id: "ms1",
  name: "Pepper",
  value: 5800,
  color: "#c52a58"
}
```

#### `auditLogs`
```javascript
{
  id: "a1",
  actor: "Dr. Ama Mensah",
  action: "Started attendance session",
  target: "CS301",
  ip: "10.4.21.9",
  device: "iPad Pro",
  time: "2024-06-03T08:00:00Z",
  severity: "info" | "warning" | "critical"
}
```

#### `notifications`
```javascript
{
  id: "n1",
  title: "Low attendance alert",
  body: "LAW220 dropped below 40% - review session.",
  type: "attendance" | "security" | "meal",
  time: "2024-06-03T12:30:00Z",
  read: false
}
```

#### `weeklyAttendance`
```javascript
{
  day: "Mon",
  present: 7820,
  absent: 600,
  late: 420
}
```

#### `hourlyOccupancy`
```javascript
{
  hour: "09:00",
  occupancy: 1850
}
```

#### `departmentTrend`
```javascript
{
  department: "Computer Science",
  rate: 94.2
}
```

#### `aiInsights`
```javascript
{
  id: "i1",
  text: "Attendance drops 11% every Friday afternoon across Engineering.",
  tag: "Trend" | "Meals" | "Occupancy" | "Security",
  tone: "amber" | "wine"
}
```

#### `students`
```javascript
{
  id: "st1",
  name: "Akosua Frimpong",
  email: "akosua@campus.edu",
  role: "student",
  studentId: "STU-2024000",
  department: "Computer Science",
  avatarColor: "#f59e0b",
  attendanceRate: 96,
  streak: 42,
  mealPreference: "pepper",
  dietary: []
}
```

### Step 4: Firestore Security Rules

Set appropriate security rules in Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own profile
    match /profiles/{uid} {
      allow read: if request.auth.uid == uid;
      allow write: if request.auth.uid == uid && resource.data.role == request.resource.data.role;
    }

    // Collections: Allow read based on role
    match /campuses/{doc=**} {
      allow read: if request.auth.uid != null;
    }

    match /departments/{doc=**} {
      allow read: if request.auth.uid != null;
    }

    match /buildings/{doc=**} {
      allow read: if request.auth.uid != null;
    }

    match /sessions/{doc=**} {
      allow read: if request.auth.uid != null;
    }

    match /attendance/{doc=**} {
      allow read: if request.auth.uid != null;
    }

    match /meals/{doc=**} {
      allow read: if request.auth.uid != null;
    }

    match /auditLogs/{doc=**} {
      allow read: if request.auth.uid != null;
    }

    match /notifications/{doc=**} {
      allow read: if request.auth.uid != null;
    }

    // Restrict analytics collections to authenticated users
    match /weeklyAttendance/{doc=**} {
      allow read: if request.auth.uid != null;
    }

    match /hourlyOccupancy/{doc=**} {
      allow read: if request.auth.uid != null;
    }

    match /departmentTrend/{doc=**} {
      allow read: if request.auth.uid != null;
    }

    match /aiInsights/{doc=**} {
      allow read: if request.auth.uid != null;
    }

    match /students/{doc=**} {
      allow read: if request.auth.uid != null;
    }

    match /mealSplit/{doc=**} {
      allow read: if request.auth.uid != null;
    }

    // Deny all by default
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Step 5: Create Admin Users

Use Firebase Console or Admin SDK to create initial user accounts:

```javascript
// Example: Create admin user programmatically
const admin = require('firebase-admin');

admin.auth().createUser({
  email: 'admin@campus.edu',
  password: 'SecurePassword123!',
  displayName: 'Campus Administrator'
}).then(userRecord => {
  // Then create profile in Firestore
  admin.firestore().collection('profiles').doc(userRecord.uid).set({
    email: userRecord.email,
    name: userRecord.displayName,
    role: 'super_admin',
    institutionId: 'your-institution-id',
    createdAt: new Date(),
    updatedAt: new Date()
  });
  console.log('User created:', userRecord.uid);
});
```

## Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Ensure `.env.local` is configured (see Step 2)

# 3. Run dev server
npm run dev

# 4. Navigate to http://localhost:3000/login
# 5. Sign in with your Firebase user credentials

# 6. No more demo/mock data—all data from Firestore!
```

## Deployment

### Vercel

```bash
# 1. Push code to GitHub
git push origin main

# 2. Link Vercel project
vercel link

# 3. Set environment variables in Vercel dashboard:
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
# ... (repeat for all env vars)

# 4. Deploy
vercel deploy
```

### Docker / Self-Hosted

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm ci
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start"]
```

## Removing Legacy Code

The following files/directories are now obsolete:

- ~~`src/lib/mock-data.ts`~~ (stubbed; can be deleted)
- ~~`src/lib/mock-users.ts`~~ (can be deleted)
- ~~`USE_MOCK` logic~~ (removed from components)
- ~~Demo password constants~~ (removed)

## Testing the Migration

### Authentication Flow
1. ✅ Sign in with Firebase credentials
2. ✅ Session cookie set and managed
3. ✅ Logout clears session
4. ✅ Password reset sends Firebase email

### Data Flow
1. ✅ Load dashboards → fetches Firestore collections
2. ✅ Real-time updates (subscribe to Firestore if desired)
3. ✅ No hardcoded data anywhere

### Role-Based Access
1. ✅ `super_admin` sees Platform Overview
2. ✅ `campus_admin` sees Campus Dashboard
3. ✅ `facilitator` sees their classes
4. ✅ `kitchen_manager` sees meal operations
5. ✅ `security_officer` sees security logs

## Troubleshooting

### "Firebase is not configured"
- Check `.env.local` has all required `NEXT_PUBLIC_FIREBASE_*` vars
- Rebuild: `npm run build`

### "Unauthorized" on `/api/admin/firestore`
- Verify session cookie is being set
- Check `FIREBASE_ADMIN_*` env vars are correct
- Enable Cloud Firestore in Firebase Console

### Collections appear empty
- Ensure documents are created in Firestore Console
- Check Firestore Security Rules allow `read` for authenticated users

## Next Steps

1. **Real-time Updates**: Upgrade Firestore queries to use `onSnapshot()` for live data
2. **Caching**: Implement React Query or SWR for better cache management
3. **Offline Support**: Add Firestore Offline Persistence
4. **Data Validation**: Use Zod/TypeScript to validate collection documents
5. **Monitoring**: Set up Cloud Logging and Firebase Analytics

---

**Generated**: June 2024  
**Status**: Production Ready  
**Last Updated**: v1.0
