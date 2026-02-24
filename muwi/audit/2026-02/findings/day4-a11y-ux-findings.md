### [A11Y-STATE-001] Backup/Export Outcome Messages Are Not Announced to Assistive Tech
- Status: Remediated (post-Day 4 follow-up fix on 2026-02-24)
- Area: Accessibility / Error-State UX
- Severity: Medium
- Files: `muwi/src/components/common/ExportPanel/ExportPanel.tsx:331`, `muwi/src/components/common/ExportPanel/ExportPanel.tsx:332`, `muwi/src/components/common/BackupPanel/BackupPanel.tsx:303`, `muwi/src/components/common/BackupPanel/BackupPanel.tsx:304`
- Summary: Backup/export success and error messages are rendered as plain `div` elements without `role="alert"` / `role="status"` or an `aria-live` region, so screen reader users may not be notified when critical actions succeed/fail.
- Evidence:
  - Command/Test: `npm run test:e2e -- accessibility-audit.spec.ts`
  - Output/Screenshot: `muwi/audit/2026-02/outputs/day4-accessibility-e2e.txt` (current automated coverage passes but does not exercise backup/export outcome announcements)
  - Code review: `ExportPanel` and `BackupPanel` message containers have no live-region semantics
- Reproduction:
  1. Open Export or Backup panel.
  2. Trigger a failure (cancel save dialog / invalid backup location / restore error) or successful completion.
  3. Observe visual message appears.
  4. Screen reader announcement is not guaranteed because message container is not a live region.
- Expected:
  - Success messages should be announced (`role="status"` / `aria-live="polite"`).
  - Error messages should be announced promptly (`role="alert"` / assertive live region where appropriate).
- Observed:
  - Visual-only feedback containers are used for both success and error messages.
- Recommended Fix:
  - Add semantic roles or shared live-region wrapper for panel messages.
  - Reuse a shared alert/status component to keep export/backup/error flows consistent.
- Regression Tests Needed:
  - Component tests asserting `role="alert"` for errors and `role="status"` for success messages in `ExportPanel` and `BackupPanel`.
- Remediation Notes:
  - Implemented live-region semantics in `muwi/src/components/common/ExportPanel/ExportPanel.tsx` and `muwi/src/components/common/BackupPanel/BackupPanel.tsx`.
  - Validation: targeted component tests pass (`muwi/audit/2026-02/outputs/day4-remediation-targeted-tests.txt`).

### [A11Y-NAV-001] Sidebar Overlay Mode Lacks Explicit Keyboard Focus Management
- Status: Remediated (post-Day 4 follow-up fix on 2026-02-24)
- Area: Accessibility / Keyboard Navigation
- Severity: Medium
- Files: `muwi/src/components/common/DiaryLayout/DiaryLayout.tsx:153`, `muwi/src/components/common/DiaryLayout/DiaryLayout.tsx:163`, `muwi/src/components/common/Sidebar/Sidebar.tsx:32`, `muwi/src/components/common/DiaryLayout/DiaryLayout.responsive.test.tsx:74`
- Summary: The `<800px` sidebar overlay flow renders a visual backdrop and open/close controls, but there is no explicit focus transfer, focus trap, or keyboard close handling for overlay mode. Existing responsive tests only validate click-backdrop closure.
- Evidence:
  - Automated a11y spec: `muwi/audit/2026-02/outputs/day4-accessibility-e2e.txt` (covers shelf/settings/palette/drafts, not sidebar overlay keyboard flow)
  - Responsive tests: `DiaryLayout.responsive.test.tsx` validates breakpoint rendering and mouse backdrop close only
  - Code review: no `useEffect`/keyboard handler tied to `isSidebarOverlay && isSidebarOpen` in `DiaryLayout`
- Reproduction:
  1. Resize to `<800px` and open a diary with sidebar.
  2. Open sidebar overlay.
  3. Continue keyboard navigation from current focus position.
  4. Focus behavior depends on previous element; overlay focus is not explicitly anchored or trapped.
- Expected:
  - Opening overlay should move focus to the overlay/sidebar (or a deterministic first control).
  - Escape key should close the overlay.
  - Optional: focus should restore to the opener after close.
- Observed:
  - Overlay open state renders backdrop/button visually, but no overlay-specific keyboard focus management is implemented or tested.
- Recommended Fix:
  - Add overlay-mode focus handoff + focus restore in `DiaryLayout`/`Sidebar`.
  - Add `Escape` support for overlay close.
  - Add keyboard-focused tests for overlay open/close and focus restoration.
- Regression Tests Needed:
  - `DiaryLayout.responsive.test.tsx` coverage for focus placement on open, `Escape` close, and focus restoration to the sidebar toggle.
- Remediation Notes:
  - Implemented overlay focus handoff, `Escape` close, focus trap behavior, and focus restore fallback in `muwi/src/components/common/DiaryLayout/DiaryLayout.tsx`.
  - Validation: responsive keyboard/focus test added and passing (`muwi/audit/2026-02/outputs/day4-remediation-targeted-tests.txt`).

### [UX-THEME-001] Footnote Extension Uses Hardcoded Colors Outside Theme Tokens
- Status: Open
- Area: UX/UI / Design Token Consistency
- Severity: Medium
- Files: `muwi/src/extensions/footnote.ts:135`, `muwi/src/extensions/footnote.ts:324`, `muwi/src/extensions/footnote.ts:326`
- Summary: The footnote marker and generated footnote list widget inject fixed hex colors via inline styles (`#4A90A4`, `#E5E7EB`, `#4B5563`) instead of theme tokens, creating dark-mode inconsistency and potential contrast drift.
- Evidence:
  - Command/Scan: hardcoded color sweep (`rg`)
  - Output/Screenshot: `muwi/audit/2026-02/outputs/day4-ux-hardcoded-colors.txt`
  - Code review: TipTap footnote extension writes inline style strings directly to DOM nodes
- Reproduction:
  1. Insert footnotes in an editor using the footnote extension.
  2. Switch between light/dark themes.
  3. Compare footnote marker/list colors vs the rest of the themed UI.
- Expected:
  - Footnote UI styling should derive from theme CSS variables/tokens and follow global theme changes.
- Observed:
  - Extension-generated footnote UI uses hardcoded hex colors and bypasses tokenized theme styling.
- Recommended Fix:
  - Replace hardcoded inline colors with CSS classes + CSS variables (or inject tokenized values).
  - Add dark/light visual checks for footnote marker/list readability.
- Regression Tests Needed:
  - Theme-aware rendering snapshot or DOM-style assertions for footnote marker/list color hooks.

### [UX-FLOW-001] Settings Passkey Save Silently Ignores Empty Input
- Status: Open
- Area: UX/UI / Primary Flow Validation (Privacy)
- Severity: Low
- Files: `muwi/src/components/shelf/SettingsPanel.tsx:250`, `muwi/src/components/shelf/SettingsPanel.tsx:252`
- Summary: The Settings panel `Save Passkey` action returns early on empty input without showing validation feedback, which creates a silent no-op in a core privacy configuration flow.
- Evidence:
  - Code review: empty passkey branch exits without message/toast/inline error
- Reproduction:
  1. Open Settings -> Privacy.
  2. Leave passkey blank and click `Save Passkey`.
  3. No visible validation feedback is shown.
- Expected:
  - User should get immediate validation feedback (inline error or toast) when attempting to save an empty passkey.
- Observed:
  - Action no-ops silently.
- Recommended Fix:
  - Reuse form error styling (or toast) to surface validation feedback for blank passkey submissions.
- Regression Tests Needed:
  - SettingsPanel test covering empty `Save Passkey` click and expected error/announcement.
