# TODO — Performance / SEO / Accessibility Optimization

## Step 1: Baseline discovery
- [ ] Verify which app is production target (user said proceed; treat both as candidates).
- [ ] Run search for heavy client components (charts/live-feed/modals).
- [ ] Identify any missing SEO primitives (robots/sitemap/OpenGraph/twitter/canonical).

## Step 2: Performance (runtime)
- [ ] Remove `suppressHydrationWarning` if safe; otherwise fix hydration root cause.
- [ ] Convert unnecessary `
