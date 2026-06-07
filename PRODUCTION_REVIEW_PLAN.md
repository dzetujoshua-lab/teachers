# Production-readiness review plan

## Information Gathered
- Reviewed key routing/data guard patterns in:
  - `Attendance-main/src/app/api/admin/firestore/route.ts` (collection allowlist + session-based auth)
  - `Attendance-main/src/app/api/admin/temp-password/route.ts` (role creation guardrails + validation)
  - `Attendance-main/src/app/api/admin/notifications/[id]/route.ts` (notification access control + read marking)
- Reviewed role-driven navigation and module scaffolding:
  - `Attendance-main/src/lib/roles.tsx` (role config, nav items)
  - `Attendance-main/src/app/dashboard/[role]/[section]/page.tsx` (section routing + facilitator live session special-case)
  - `Attendance-main/src/components/dashboard/section-shell.tsx` (placeholder UI)
  - `Attendance-main/src/components/shell/sidebar.tsx` (sidebar active-state + help/signout)

## Plan
1. **Inventory every “button section/session/analytics/reports/roles” module**
   - Find every route/page under `src/app/dashboard/[role]/**` and every component under `src/components/dashboards/**`.
   - Ensure each nav href has a matching page/component (no dead links).

2. **Production-grade routing + authorization**
   - Add/standardize auth guards at the page/component level (not only API), based on `getProfileBySession`.
   - Ensure each API route enforces:
     - role-based access (RBAC)
     - object-level authorization (audienceRole/facilitatorId/etc.)
     - input validation (zod/schema or explicit checks)
     - consistent error formats.
   - Ensure Next.js route handlers return correct status codes and do not leak internal details.

3. **Production-grade UI components and actions**
   - Replace scaffold placeholders (`SectionShell`) where needed, or clearly gate them behind feature flags.
   - Ensure `Button` usage is consistent:
     - correct `type="button"` where inside forms
     - disabled/loading states
     - aria labels for icon-only actions
   - Ensure modals/dialogs follow accessibility patterns.

4. **Sessions (facilitator live workflow)**
   - Audit `FacilitatorSession` and any attendance-taking workflow:
     - idempotency of write actions
     - race-condition handling
     - audit logs / notifications triggered reliably
     - safe retries and conflict handling.

5. **Analytics and reports**
   - Audit every analytics/report endpoint and UI:
     - server-side aggregation where appropriate
     - pagination
     - rate limiting (or at least request throttling)
     - caching/revalidation strategy.

6. **Roles**
   - Ensure role claim + profile role are consistent across:
     - session token/claims
     - `profiles` documents
     - nav config and permissions.
   - Add a single source of truth for role capabilities (e.g., allowed pages/actions map).

7. **Observability and reliability**
   - Add structured logging to all route handlers.
   - Add request correlation id (if feasible).
   - Ensure errors are handled gracefully in the UI.

8. **Hardening**
   - Remove any debug endpoints or ensure `USE_MOCK` gating is safe.
   - Validate all client-provided ids (no trusting doc ids blindly).
   - Ensure CORS is not overly permissive.

## Dependent Files to be edited
- `Attendance-main/src/app/dashboard/[role]/**/page.tsx`
- `Attendance-main/src/components/dashboards/**`
- `Attendance-main/src/components/dashboard/section-shell.tsx` (replace/gate scaffolds)
- `Attendance-main/src/components/shell/sidebar.tsx` (nav correctness + active logic)
- `Attendance-main/src/app/api/admin/**/route.ts`
- `Attendance-main/src/app/api/**` routes for attendance/sessions/analytics/reports
- `Attendance-main/src/lib/**` (RBAC helpers, validation schemas, shared API clients)

## Followup steps
1. Add automated checks:
   - `npm run lint`
   - `npm run typecheck` (or `tsc --noEmit`)
   - `npm test` if present
2. Manual QA:
   - login as each role
   - verify every nav link
   - create/mark notifications
   - run facilitator session end-to-end
3. Confirm production env settings:
   - `USE_MOCK` disabled
   - Firebase/Supabase env vars configured

<ask_followup_question>
I can start implementing production hardening, but I need permission to proceed. Should I focus first on: (A) completing all scaffolded dashboard sections (remove placeholder SectionShell), or (B) strengthening authorization/validation across API + pages before UI changes?
</ask_followup_question>

