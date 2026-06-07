# Attendance Draft System - Implementation Guide

## Overview

The attendance draft system enables admins to create attendance templates, assign them to facilitators, and track submissions with email notifications.

**Workflow:**
1. **Admin** creates a class with a list of students and assigns it to a facilitator → sends as draft
2. **Facilitator** receives the draft, marks attendance for each student, and submits
3. **Admin** reviews the submitted attendance and confirms

---

## API Endpoints

### 1. **List Drafts** `GET /api/attendance/drafts`
- **Auth:** Facilitator or Campus Admin
- **Response:**
  ```json
  {
    "rows": [
      {
        "id": "draft-123",
        "title": "Math 101 - Session 1",
        "facilitatorId": "fac-1",
        "members": [
          { "studentId": "STU-001", "name": "John Doe", "status": "present" },
          { "studentId": "STU-002", "name": "Jane Smith", "status": "absent" }
        ],
        "status": "draft",
        "createdAt": "2026-06-04T10:00:00Z",
        "updatedAt": "2026-06-04T10:00:00Z"
      }
    ]
  }
  ```

### 2. **Create Draft** `POST /api/attendance/drafts`
- **Auth:** Campus Admin only
- **Request Body:**
  ```json
  {
    "title": "Math 101 - Session 1",
    "classId": "class-123",
    "facilitatorId": "fac-1",
    "members": [
      { "studentId": "STU-001", "name": "John Doe" },
      { "studentId": "STU-002", "name": "Jane Smith" }
    ]
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "id": "draft-123",
    "draft": { ... }
  }
  ```

### 3. **Get Draft** `GET /api/attendance/drafts/[id]`
- **Auth:** Assigned facilitator or admin
- **Response:** Returns full draft object

### 4. **Update Draft** `PATCH /api/attendance/drafts/[id]`
- **Auth:** Facilitator (to mark & submit) or Admin (to reassign)
- **Facilitator Request:**
  ```json
  {
    "members": [
      { "studentId": "STU-001", "name": "John Doe", "status": "present" },
      { "studentId": "STU-002", "name": "Jane Smith", "status": "absent" }
    ],
    "status": "submitted"
  }
  ```
- **Admin Request:**
  ```json
  {
    "facilitatorId": "fac-2",
    "status": "confirmed"
  }
  ```
- **Email Trigger:** When `status` is set to `"submitted"`, an email is automatically sent to the admin

---

## Frontend Integration

### Admin Dashboard Component

Add to admin dashboard page (`src/app/dashboard/campus_admin/drafts/page.tsx`):

```tsx
import { AdminDraftsDashboard } from "@/components/dashboards/admin-drafts";

export const metadata = { title: "Attendance Drafts" };

export default function AdminDraftsPage() {
  return <AdminDraftsDashboard />;
}
```

**Features:**
- Create new drafts with title, facilitator, and member list
- View all drafts and their submission status
- Send drafts to facilitators (creates notification)

**Component:** [src/components/dashboards/admin-drafts.tsx](src/components/dashboards/admin-drafts.tsx)

### Facilitator Dashboard Component

Add to facilitator dashboard page (`src/app/dashboard/facilitator/drafts/page.tsx`):

```tsx
import { FacilitatorDraftsDashboard } from "@/components/dashboards/facilitator-drafts";

export const metadata = { title: "My Attendance Drafts" };

export default function FacilitatorDraftsPage() {
  return <FacilitatorDraftsDashboard />;
}
```

**Features:**
- View assigned drafts
- Mark attendance for each student (present, absent, late, excused)
- See real-time attendance statistics
- Submit to admin (triggers email notification)

**Component:** [src/components/dashboards/facilitator-drafts.tsx](src/components/dashboards/facilitator-drafts.tsx)

---

## Validation

All inputs are validated server-side using [src/lib/attendance-validation.ts](src/lib/attendance-validation.ts):

- **Draft Creation:** Validates facilitatorId, members array, and required fields
- **Attendance Marking:** Validates status values (present, absent, late, excused)
- **Empty Checks:** Ensures non-empty member lists and valid IDs

**Validation Functions:**
```typescript
validateDraftInput(data)       // Validates new draft data
validateMemberStatus(status)   // Validates attendance status
validateAttendanceMarks(members) // Validates marked attendance
```

---

## Firestore Security Rules

Security rules are defined in [firestore.rules](firestore.rules) and enforce:

✅ **Facilitators:**
- Can read only their assigned drafts (status: "draft")
- Can update members and submit (status: "submitted")
- Cannot access other facilitators' drafts

✅ **Campus Admins:**
- Can create, read, and update all drafts in their institution
- Can reassign drafts to different facilitators
- Can delete their own drafts

✅ **Super Admins:**
- Full access to all data

**To Deploy Rules:**
```bash
firebase deploy --only firestore:rules
```

---

## Email Notifications

When a facilitator submits a draft:

1. **Trigger:** `status` set to `"submitted"` via `PATCH /api/attendance/drafts/[id]`
2. **Email Sent To:** Admin who created the draft
3. **Provider:** Resend (configured via `RESEND_API_KEY`)
4. **Content:**
   - Facilitator name and draft title
   - Link to dashboard for review

**Environment Variables Required:**
```env
RESEND_API_KEY=your_resend_api_key
NEXT_PUBLIC_BASE_URL=https://yourdomain.com  # For email links
```

---

## Data Model

**Collection:** `attendanceDrafts`

```typescript
{
  id: string;
  title: string;
  classId?: string;
  facilitatorId: string;
  members: {
    studentId: string;
    name: string;
    status?: "present" | "absent" | "late" | "excused";
  }[];
  status: "draft" | "submitted" | "confirmed";
  createdBy: string;    // Admin ID
  institutionId: string;
  createdAt: string;    // ISO timestamp
  updatedAt: string;    // ISO timestamp
  submittedAt?: string; // Set when status = "submitted"
}
```

---

## Usage Examples

### Admin: Create and Send Draft
```bash
curl -X POST http://localhost:3000/api/attendance/drafts \
  -H "Content-Type: application/json" \
  -H "Cookie: session=..." \
  -d '{
    "title": "Biology 101 - Lab Session",
    "facilitatorId": "fac-42",
    "members": [
      { "studentId": "S001", "name": "Alice Johnson" },
      { "studentId": "S002", "name": "Bob Smith" }
    ]
  }'
```

### Facilitator: Submit Attendance
```bash
curl -X PATCH http://localhost:3000/api/attendance/drafts/draft-123 \
  -H "Content-Type: application/json" \
  -H "Cookie: session=..." \
  -d '{
    "members": [
      { "studentId": "S001", "name": "Alice Johnson", "status": "present" },
      { "studentId": "S002", "name": "Bob Smith", "status": "late" }
    ],
    "status": "submitted"
  }'
```

---

## Database Setup

Run the following Firestore initialization (if needed):

```sql
-- Create indexes for efficient queries
-- attendanceDrafts.facilitatorId + attendanceDrafts.status
-- attendanceDrafts.institutionId + attendanceDrafts.status
-- attendanceDrafts.createdBy + attendanceDrafts.status
```

Or use Firebase Console to create composite indexes on demand.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Email not sent | Check `RESEND_API_KEY` is set and valid |
| "Forbidden" error | Ensure correct role and draft assignment |
| Validation fails | Check member format: `{ studentId, name, status? }` |
| Drafts not showing | Verify `institutionId` matches admin's institution |

---

## Future Enhancements

- [ ] Bulk upload CSV of students
- [ ] Email reminders to facilitators with pending drafts
- [ ] Attendance report generation (PDF/Excel)
- [ ] Integration with student email notifications
- [ ] Recurring draft templates for classes
- [ ] Analytics dashboard for attendance trends

