# TODO - Attendance App Updates

## Planned changes
- [ ] Blank “Roster” for facilitator when there are no student rosters/session roster created yet.
- [ ] Add “Save & Publish attendance” button on facilitator take-attendance UI.
- [ ] Publish triggers: when facilitator publishes, send message/notification to Admin, Security Officer, and Kitchen Manager.
- [ ] Ensure published attendance is viewable in the UI message/chat dropdown (Topbar).

## Implementation approach
1) Inspect `src/lib/firebase/data.ts` for `useStudents()` and `useNotifications()`.
2) Inspect attendance API routes under `src/app/api/attendance/` (submit/publish/drafts/notify...).
3) Update `facilitator-session.tsx` to wire marks -> API and blank roster state.
4) Update/extend notification payloads to include readable message body.
5) Run Next build/typecheck.

