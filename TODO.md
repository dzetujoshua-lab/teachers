- [x] Inspect `teachers/src/lib/firebase/admin.ts` for current quota handling + caching behavior
- [x] Implement mitigation: broaden quota cooldown, improve token/profile caching (including null), and dedupe in-flight lookups
- [x] Fix TypeScript errors introduced during edits
- [ ] Restart Next dev server and verify `RESOURCE_EXHAUSTED` no longer triggers repeatedly

