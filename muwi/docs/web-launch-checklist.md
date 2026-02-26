# MUWI Web Launch Checklist (Netlify)

Status values: `PASS`, `FAIL`, `N/A`

For every checklist line, record:
- status
- owner
- date
- evidence (artifact path / CI URL / screenshot)
- notes

## Build + Unit Coverage

- [ ] `npm run lint`
- [ ] `npm run test:coverage`
- [ ] `npm run build`

## Multi-Browser E2E

- [ ] Chromium web E2E
- [ ] Firefox web E2E
- [ ] WebKit web E2E

## Web Fallback Flows

- [ ] Backup save (browser download fallback)
- [ ] Backup load (file picker fallback)
- [ ] Export save (browser download fallback)
- [ ] Auto-backup Electron-only limitation fails gracefully

## Deep-Link / Routing Checks

- [ ] `/` loads
- [ ] `/academic` refresh works
- [ ] `/drafts/draft-123` refresh works
- [ ] Unknown route safely falls back to shelf

## Bundle / Performance Regression Gates

- [ ] Bundle budget checker passes
- [ ] Perf baseline budget checker passes

## Manual Evidence (Blocking)

- [ ] React Profiler capture (Long Drafts)
- [ ] React Profiler capture (Academic)
- [ ] React Profiler capture (TOC reorder)
- [ ] Blackboard large-canvas runtime profile (500+ elements)
- [ ] Lighthouse accessibility audit artifacts
- [ ] Screen reader pass notes (VoiceOver minimum)

## Netlify Config / Deploy / Rollback

- [ ] `netlify.toml` matches live settings
- [ ] SPA rewrite verified on production URL
- [ ] Rollback procedure documented
- [ ] Rollback verification smoke documented

## Share Readiness

- [ ] `muwi/README.md` updated for web demo + browser/Electron differences
- [ ] Feedback path (GitHub Issues and/or form) documented
