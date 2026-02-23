# Electron Builder Remediation Analysis (2026-02-23)

This documents the explicit go/no-go analysis for the remaining `electron-builder` audit chain after upgrading to the latest non-major release.

## Scope

- Package under review: `electron-builder` (direct dev dependency)
- Goal: decide whether to ship with current version + mitigations or force additional remediation (backlevel/override/migration)
- Date of analysis: 2026-02-23

## Local Evidence (Current Repo State)

### Installed packaging chain (from `npm ls`)

- `electron-builder@26.8.1`
- `app-builder-lib@26.8.1`
- `@electron/asar@3.4.1`
- `@develar/schema-utils@2.6.5 -> ajv@6.12.6`
- `@electron/asar@3.4.1 -> glob@7.2.3 -> minimatch@3.1.2`
- `app-builder-lib@26.8.1` also includes patched `minimatch@10.2.2` (not the vulnerable path reported by audit)

### Packaging entry points and config surface

- Packaging script: `npm run electron:build` -> `npm run build && electron-builder`
- No explicit `electron-builder` config file found in repo (`electron-builder.yml/json` absent)
- No checked-in CI workflow found in `.github/workflows/`
- Result: packaging behavior is mostly implicit/defaults and not yet CI-auditable in this repo

### Local toolchain observed during analysis

- Node: `v24.3.0`
- npm: `11.4.2`

### Audit evidence already captured in repo

- `security/reports/npm-audit-2026-02-20-post-lint-electron-builder-summary.md`
- `security/reports/npm-audit-2026-02-20-post-eslint10-summary.md`
- `security/reports/npm-audit-2026-02-20-live-eslint10-summary.md`

Observed pattern from stored audit summaries:

- The `electron-builder` chain remains a high-severity cluster via `app-builder-lib`, `@electron/asar`, and related packaging-time deps.
- `npm audit` "fix available" recommendations point to semver-major/backlevel `electron-builder` versions (for example `22.14.13`, and in another snapshot `25.1.8`), which vary across snapshots and do not represent a stable compatibility recommendation.

## Risk Framing

- This is a build/release pipeline exposure, not a renderer/main-process runtime exposure in normal app use.
- The highest-risk exploit preconditions are in packaging steps and artifact generation, not end-user interaction.
- The current repo has no explicit CI packaging isolation controls checked in yet, so residual risk acceptance without process controls is weakly documented.

## Packaging Risk Checks (Decision Gate)

Any semver-major/backlevel change or forced transitive major override should be treated as `NO-GO` until all checks below are green:

1. `npm run build` passes.
2. Packaging succeeds on each supported OS target (macOS, Windows, Linux).
3. Packaged app launch smoke test passes on each built target.
4. Installer/uninstaller smoke passes for Windows target (if Windows installers are shipped).
5. Artifact signing/notarization steps (if used) succeed on clean runners.
6. No invalid dependency tree state (`npm ls` must not report `ELSPROBLEMS`).
7. No packaging-only overrides introduce unsupported Node/toolchain requirements in CI.
8. Resulting packaging path is reproducible on pinned Node/npm/toolchain versions.

Current status in this repo:

- Checks 1 and runtime app build health are already covered elsewhere.
- Checks 2-8 are not yet codified as CI controls/workflows in-repo.

## Option Matrix (Go / No-Go)

### Option A: Stay on `electron-builder@26.8.1` and add CI containment controls

- Expected audit impact: residual high findings remain in packaging chain.
- Compatibility risk: low (current working state preserved).
- Operational risk reduction: high if CI isolation + signed clean-runner release gates are added.
- Decision: `GO` (recommended default).

Reasoning:

- Latest non-major is already in place.
- Audit "fix" suggestions are backlevel semver-major targets and vary between snapshots.
- Forcing risky packaging changes without a packaging matrix creates more release risk than current documented residuals.

### Option B: Follow `npm audit` semver-major/backlevel recommendation (e.g. `electron-builder@22.14.13`)

- Expected audit impact: may reduce the specific flagged chain, but not guaranteed to clear all highs.
- Compatibility risk: high (large version gap from current `26.8.1`, likely packaging behavior regressions; compatibility with current `electron@40` must be revalidated).
- Operational impact: high test matrix cost.
- Decision: `NO-GO` for production without full matrix parity.

Reasoning:

- The recommendation moves backwards in major versions.
- Stored audit outputs show inconsistent suggested versions (`22.14.13` vs `25.1.8`), which is a strong signal to treat audit output as triage input, not an execution plan.

### Option C: Force transitive major override(s) in builder chain (e.g. `@electron/asar@4.x`)

- Expected audit impact: could address some flagged subpaths if dependency graph accepts it.
- Compatibility risk: very high (major transitive override in packaging internals; may break artifact creation or platform-specific targets).
- Operational impact: requires experimental branch + full packaging matrix.
- Decision: `NO-GO` for production; `GO` only on experimental branch if "zero high" is mandatory.

Reasoning:

- This is the same failure mode category as the Excalidraw nested override experiment (graph may accept intent but not converge safely), except in the release pipeline where breakage cost is higher.

### Option D: Migrate off `electron-builder` to an alternative packaging pipeline

- Expected audit impact: potentially removes the flagged chain entirely (depends on chosen toolchain).
- Compatibility risk: medium/high (migration complexity, release process rewrite).
- Delivery impact: high (scope expansion).
- Decision: `NO-GO` for current sprint; contingency path only if policy mandates zero residual highs.

## Recommended Decision (2026-02-23)

Adopt `Option A` now:

1. Keep `electron-builder@26.8.1`.
2. Treat remaining `electron-builder` highs as upstream-blocked build-time risk.
3. Add explicit CI containment controls and release-gating evidence.
4. Re-scan on cadence and re-evaluate when upstream packages publish fixes.

## Required Follow-Up Actions (Next Work Items)

1. Add a packaging CI workflow with isolated clean runner jobs and pinned Node/npm versions.
2. Define supported packaging targets explicitly (macOS/Windows/Linux) and record required smoke checks.
3. Gate releases on signed artifacts from clean runners (and notarization/signing where applicable).
4. Add weekly upstream watch entries for `electron-builder`, `app-builder-lib`, and `@electron/asar`.
5. Only if policy requires "zero high": open an experimental branch for forced builder-chain overrides and run full packaging matrix validation.

## Commands Used for This Analysis

- `npm ls electron-builder app-builder-lib @electron/asar minimatch ajv --depth=4`
- `node -v && npm -v`
- Repo searches for packaging config/workflow presence (`rg`)
