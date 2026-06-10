# TODO - Fix Admin Draft "New Draft" table UI

## Steps
- [ ] Update `src/components/dashboards/admin-drafts.tsx`: replace the placeholder bulk UI + checkbox list with a table-like bulk entry area (paste lines: studentId, classCode/class, name, email) and parse into draft members.
- [ ] Wire parsed rows into the create handler so `members` are created from the table input.
- [ ] Remove/ignore unused placeholder sections that claim "Use New Draft" but show no table.
- [ ] Run typecheck/lint/build if available.

