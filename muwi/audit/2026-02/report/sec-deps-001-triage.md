# SEC-DEPS-001 Dependency Triage (Day 2)

Source audit: `muwi/audit/2026-02/outputs/day1-audit-deps-json.txt`

Classification uses `package-lock.json` `packages[*].dev` flags across all matching lockfile paths, not just top-level `node_modules/<pkg>`.

## Summary

- Total vulnerable packages: 29
- Severity totals: high=23, moderate=5, low=1
- Direct classification: transitive=26, direct-runtime=1, direct-dev=2
- Install scope: dev=24, runtime=1, unknown=4
- Likely exposure: dev/build-tooling-likely=24, runtime-path-possible=1, needs-manual-triage=4

## Day 7 Refresh (2026-02-24)

Sources:

- `muwi/audit/2026-02/outputs/day7-audit-deps-json.txt`
- `muwi/audit/2026-02/outputs/day7-audit-deps-summary.md`
- `muwi/audit/2026-02/outputs/day7-audit-fix-dry-run.json`

Re-run result:

- Counts unchanged from Day 1/Day 2 baseline (`29` total; `23` high; `5` moderate; `1` low).
- No `Critical` vulnerabilities reported.
- High-severity findings remain concentrated in dev/build tooling chains (primarily `electron-builder` and `typescript-eslint` transitive paths).
- Runtime-path findings remain in the `moderate`/`low` range (`@excalidraw/excalidraw`, `@excalidraw/mermaid-to-excalidraw`, `markdown-it`, `nanoid`, `diff`), based on prior Day 2 lockfile + `npm ls` path analysis.

Dry-run remediation output (`npm audit fix --dry-run --json`) notes:

- The output includes peer dependency resolution warnings and a large proposed install-plan churn (many optional platform binaries and transitive package changes), which is not a safe blind patch for a release-closeout pass.
- The audit payload nested in the dry-run output still reports the same vulnerability totals (`29` total; `23` high; `5` moderate; `1` low).
- `electron-builder` fixes are still indicated as semver-major path changes in the advisory output.

### Residual Risk Statement (Day 7)

- `High` counts are currently assessed as dev/build-tooling exposure, not direct shipped runtime-path exposure, based on the Day 2 triage classification and unchanged Day 7 audit counts.
- Release/runtime residual risk remains from unresolved `moderate` runtime-path packages in the editor/diagram/document stack (notably Excalidraw/mermaid and markdown parsing paths).
- Recommended disposition for launch decision:
  - Do not treat `SEC-DEPS-001` as a stop-ship for local/private beta if the team explicitly accepts build-tooling high findings and moderate runtime findings with a dated remediation plan.
  - For public production launch, complete a dependency upgrade pass (or package-level mitigations/feature deferral) and re-run regression + packaging validation before sign-off.

## Day 7 Controlled Remediation Pass (2026-02-24)

Changes applied:

- `typescript-eslint` upgraded `8.56.0 -> 8.56.1` (direct dev dependency)
- Added `package.json` overrides for audited patch-level transitive updates:
  - `ajv@6.14.0`
  - `diff@5.2.2`
  - `markdown-it@14.1.1`

Validation inputs:

- Install log: `muwi/audit/2026-02/outputs/day7-sec-deps-001-controlled-install.txt`
- Post-upgrade audit JSON: `muwi/audit/2026-02/outputs/day7-audit-deps-after-controlled-upgrade-json.txt`
- Post-upgrade audit summary: `muwi/audit/2026-02/outputs/day7-audit-deps-after-controlled-upgrade-summary.md`

Outcome (post-upgrade):

- Vulnerabilities reduced from `29` to `20`
- Severity delta:
  - `High`: `23 -> 17`
  - `Moderate`: `5 -> 3`
  - `Low`: `1 -> 0`
- Resolved advisories/packages in this pass:
  - `typescript-eslint` + `@typescript-eslint/*` chain
  - `ajv`
  - `markdown-it`
  - `diff`

Current remaining set (20 packages):

- `High` (17): all in `electron-builder` / packaging toolchain dependency chain (`electron-builder`, `app-builder-lib`, `dmg-builder`, `@electron/*`, `glob`, `minimatch`, `node-gyp`, etc.)
- `Moderate` (3): Excalidraw runtime-path chain (`@excalidraw/excalidraw`, `@excalidraw/mermaid-to-excalidraw`, `nanoid`)

Updated residual risk (after controlled pass):

- The remaining `High` findings are still dev/build-tooling exposure concentrated in the packaging chain.
- The remaining runtime-path exposure is now narrowed to the Excalidraw/Mermaid chain (`3` moderate packages).
- This materially improves release risk posture, but `SEC-DEPS-001` remains open until the team either:
  - performs a validated Excalidraw-path remediation/feature mitigation, or
  - records a formal risk acceptance (owner + review date) for the remaining moderate runtime findings and packaging-chain high findings.

### Decision Closure (2026-02-25)

Decision selected: `Formal risk acceptance (owner/date/review date)` for release gating.

Accepted disposition (effective `2026-02-25`):

- `GO` for local/private beta distribution only, with explicit residual risk acceptance covering:
  - `17` `High` dev/build-tooling findings in the `electron-builder` packaging chain
  - `3` `Moderate` runtime-path findings in the Excalidraw/Mermaid chain (`@excalidraw/excalidraw`, `@excalidraw/mermaid-to-excalidraw`, `nanoid`)
- `NO-GO` for public production launch under this acceptance alone. Public launch requires one of:
  - validated Excalidraw/Mermaid runtime-path remediation, or
  - validated feature-gate/disable of the affected Excalidraw Mermaid path(s), plus regression verification and a fresh audit re-run

Risk acceptance record:

- Risk ID: `SEC-DEPS-001`
- Owner: `MUWI maintainers` (release owner)
- Decision date: `2026-02-25`
- Review date (or before public launch, whichever comes first): `2026-03-11`
- Rationale:
  - Controlled remediation pass reduced vulnerabilities `29 -> 20` and removed prior `low` residuals.
  - Remaining `High` findings are concentrated in build/packaging tooling, not direct shipped runtime paths.
  - Remaining runtime-path exposure is limited to `3` moderate Excalidraw/Mermaid-chain packages with no validated low-risk upgrade path recorded yet (downgrade blocked by React peer mismatch; nested override no-go previously documented).
- Required follow-up before review date:
  - Re-evaluate Excalidraw/Mermaid mitigation options (upgrade, patch-package, or feature-gate)
  - Re-run dependency audit and update this record with current counts and decision

## Day 8 Dependency-Level Remediation Pass (2026-02-25)

Decision path selected and executed: `Remediate remaining Excalidraw/Mermaid runtime-path moderates`.

Implementation summary:

- Replaced transitive `@excalidraw/mermaid-to-excalidraw` with a commit-pinned GitHub fork in `muwi/package.json` overrides:
  - `git+https://github.com/vyakart/mermaid-to-excalidraw-fork-work.git#33201bbc1bc29e2d6dccaacc7d19f7e61fa53ed9`
- Fork patch updates:
  - `mermaid` `10.9.3 -> 10.9.5`
  - `nanoid` `4.0.2 -> 5.0.9`
- `npm install` regenerated `package-lock.json` and converged the Excalidraw chain without `ELSPROBLEMS`.

Evidence (before/after):

- Before (same remaining Excalidraw chain):
  - `muwi/audit/2026-02/outputs/day8-npm-ls-excalidraw-chain-before.txt`
  - `muwi/audit/2026-02/outputs/day8-audit-deps-before-excalidraw-fork-json.txt`
  - `muwi/audit/2026-02/outputs/day8-audit-deps-before-excalidraw-fork-json.txt.summary.md`
- After (runtime-path moderates cleared):
  - `muwi/audit/2026-02/outputs/day8-npm-ls-excalidraw-chain-after.txt`
  - `muwi/audit/2026-02/outputs/day8-audit-deps-after-excalidraw-fork-json.txt`
  - `muwi/audit/2026-02/outputs/day8-audit-deps-after-excalidraw-fork-json.txt.summary.md`

Outcome:

- `npm audit` reduced from `4` vulnerable packages (`1 high`, `3 moderate`) to `1` vulnerable package (`1 high`, `0 moderate`).
- The Excalidraw/Mermaid runtime-path chain (`@excalidraw/excalidraw`, `@excalidraw/mermaid-to-excalidraw`, nested `nanoid`) no longer appears in the audit report.
- `npm ls` confirms the resolved chain now contains:
  - `@excalidraw/mermaid-to-excalidraw@1.1.2` (commit-pinned GitHub fork; `npm` lockfile canonicalized as `git+ssh://git@github.com/...`)
  - nested `nanoid@5.0.9`
  - nested `mermaid@10.9.5`

Validation completed:

- `npm run lint` ✅
- `npm run test -- --run src/components/diaries/blackboard/ExcalidrawWrapper.test.tsx src/components/diaries/blackboard/Blackboard.test.tsx` ✅ (`9` tests)
- `npm run build` ✅

Updated release-risk disposition:

- Runtime-path `moderate` findings for the Excalidraw/Mermaid chain are remediated.
- Residual `SEC-DEPS-001` risk is now limited to the remaining build-tooling `high` (`minimatch` chain), which should continue to be handled under build-time risk acceptance/packaging controls.
- The earlier `2026-02-25` beta-only risk acceptance entry is superseded for the Excalidraw runtime-path portion by this remediation pass.

Important operational note:

- `muwi/package.json` pins the dependency via `git+https://` to a public GitHub fork commit SHA for reproducibility.
- `npm@11.4.2` canonicalized the lockfile `resolved` URL to `git+ssh://git@github.com/...` during install. If installs run on environments without GitHub SSH access, configure Git URL rewriting (`ssh://git@github.com/` -> `https://github.com/`) or use an internal package/tarball publication.

## Day 9 Dev / Build-Tooling Minimatch Remediation (2026-02-26)

Decision path selected and executed: `Lockfile-only remediation for remaining minimatch high (dev/build-tooling path)`.

Implementation summary:

- Confirmed `main` still had `1` remaining `high` (`minimatch`) and `0` `moderate` findings in a live `npm audit` re-run (`2026-02-25` snapshot).
- Captured a runtime-only (`--omit=dev`) audit on `main`, which reported `0` vulnerabilities (`2026-02-26`), confirming the remaining finding was dev/build-tooling scoped.
- Created a dedicated remediation branch: `sec-deps-001-minimatch-lockfile-only`.
- Applied `npm audit fix --package-lock-only` and regenerated only `muwi/package-lock.json` (no `package.json` changes).
- Verified and merged via GitHub PR `#2`:
  - remediation commit: `c033926` (`fix(security): remediate minimatch audit via lockfile refresh`)
  - merge commit on `main`: `dc00bdc` (`Merge pull request #2 from vyakart/sec-deps-001-minimatch-lockfile-only`)

Lockfile remediation notes:

- The lockfile refresh updated the vulnerable `minimatch` copies in the build-tooling chain and related transitive packages (notably `brace-expansion`/`balanced-match`).
- `npm` also refreshed `rollup` and its optional platform binaries to patch-level `4.59.0` during the lockfile-only pass.
- `npm audit fix --package-lock-only --json` reported an inconsistent `"changed": 0` despite a real lockfile diff; the embedded audit payload still reported `0` vulnerabilities.

Evidence (live verification artifacts):

- Pre-fix live audit on `main` (full audit):
  - `muwi/audit/2026-02/outputs/2026-02-25-audit-deps-main-live-json.txt`
  - `muwi/audit/2026-02/outputs/2026-02-25-audit-deps-main-live-json.txt.summary.md`
- Runtime-only proof on `main` (`--omit=dev`):
  - `muwi/audit/2026-02/outputs/2026-02-26-audit-deps-main-live-omit-dev-json.txt`
  - `muwi/audit/2026-02/outputs/2026-02-26-audit-deps-main-live-omit-dev-json.txt.summary.md`
- Lockfile-only remediation trial + verification:
  - `muwi/audit/2026-02/outputs/2026-02-26-audit-fix-package-lock-only-minimatch-trial.json`
  - `muwi/audit/2026-02/outputs/2026-02-26-audit-deps-minimatch-lockfile-trial-after-json.txt`
  - `muwi/audit/2026-02/outputs/2026-02-26-audit-deps-minimatch-lockfile-trial-after-json.txt.summary.md`
  - `muwi/audit/2026-02/outputs/2026-02-26-npm-ls-minimatch-lockfile-trial-after.txt`
  - `muwi/audit/2026-02/outputs/2026-02-26-minimatch-lockfile-trial-build.txt`

Outcome:

- Post-fix full `npm audit` reported `0` vulnerabilities (including dev dependencies) on the remediation branch before merge.
- `npm ls minimatch` confirmed vulnerable versions were removed from the installed tree:
  - removed vulnerable set: `3.1.2`, `5.1.6`, `9.0.5`
  - observed post-fix set includes: `3.1.5`, `5.1.9`, `9.0.8`, `10.2.2`
- `npm run build` passed after applying the lockfile refresh (chunk-size warnings unchanged and non-blocking).

Updated release-risk disposition (Day 9):

- The Day 8 residual note that `SEC-DEPS-001` risk was limited to the `minimatch` build-tooling chain is superseded by this Day 9 remediation pass.
- `SEC-DEPS-001` Excalidraw/Mermaid runtime-path moderates remain remediated (Day 8), and the remaining dev/build-tooling `minimatch` high was remediated and merged on `2026-02-26`.
- Based on the captured `2026-02-26` evidence, dependency audit findings from this triage track are closed at this time (`0` runtime/prod findings and `0` total findings in the verified lockfile-remediation branch state).

## Runtime / Mixed-Scope Vulnerabilities (prioritize for release risk)

Historical snapshot retained from earlier triage passes; see `Day 8 Dependency-Level Remediation Pass (2026-02-25)` above for current Excalidraw-chain status (`0` moderate remaining in current audit).

| Package | Sev | Direct | Scope | Exposure | Top-level effects | Sample lock paths | Fix |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @excalidraw/excalidraw | moderate | direct-runtime | runtime | runtime-path-possible | n/a | node_modules/@excalidraw/excalidraw | @excalidraw/excalidraw@0.17.6 (major) |

## Dev / Build Tooling Vulnerabilities

Historical snapshot retained from earlier triage passes; see `Day 9 Dev / Build-Tooling Minimatch Remediation (2026-02-26)` above for the merged `minimatch` remediation and current status.

| Package | Sev | Direct | Scope | Exposure | Top-level effects | Sample lock paths | Fix |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @electron/asar | high | transitive | dev | dev/build-tooling-likely | n/a | node_modules/@electron/asar | electron-builder@25.1.8 (major) |
| @electron/rebuild | high | transitive | dev | dev/build-tooling-likely | n/a | node_modules/@electron/rebuild | electron-builder@25.1.8 (major) |
| @electron/universal | high | transitive | dev | dev/build-tooling-likely | n/a | node_modules/@electron/universal | electron-builder@25.1.8 (major) |
| @typescript-eslint/eslint-plugin | high | transitive | dev | dev/build-tooling-likely | n/a | node_modules/@typescript-eslint/eslint-plugin | true |
| @typescript-eslint/parser | high | transitive | dev | dev/build-tooling-likely | typescript-eslint | node_modules/@typescript-eslint/parser | typescript-eslint@8.36.0 (major) |
| @typescript-eslint/type-utils | high | transitive | dev | dev/build-tooling-likely | n/a | node_modules/@typescript-eslint/type-utils | true |
| @typescript-eslint/typescript-estree | high | transitive | dev | dev/build-tooling-likely | typescript-eslint | node_modules/@typescript-eslint/typescript-estree | typescript-eslint@8.36.0 (major) |
| @typescript-eslint/utils | high | transitive | dev | dev/build-tooling-likely | typescript-eslint | node_modules/@typescript-eslint/utils | typescript-eslint@8.36.0 (major) |
| app-builder-lib | high | transitive | dev | dev/build-tooling-likely | electron-builder | node_modules/app-builder-lib | electron-builder@25.1.8 (major) |
| cacache | high | transitive | dev | dev/build-tooling-likely | n/a | node_modules/cacache | electron-builder@25.1.8 (major) |
| dir-compare | high | transitive | dev | dev/build-tooling-likely | n/a | node_modules/dir-compare | electron-builder@25.1.8 (major) |
| dmg-builder | high | transitive | dev | dev/build-tooling-likely | electron-builder | node_modules/dmg-builder | electron-builder@25.1.8 (major) |
| electron-builder | high | direct-dev | dev | dev/build-tooling-likely | n/a | node_modules/electron-builder | electron-builder@25.1.8 (major) |
| electron-builder-squirrel-windows | high | transitive | dev | dev/build-tooling-likely | n/a | node_modules/electron-builder-squirrel-windows | electron-builder@25.1.8 (major) |
| electron-winstaller | high | transitive | dev | dev/build-tooling-likely | n/a | node_modules/electron-winstaller | electron-builder@25.1.8 (major) |
| filelist | high | transitive | dev | dev/build-tooling-likely | n/a | node_modules/filelist | true |
| glob | high | transitive | dev | dev/build-tooling-likely | n/a | node_modules/cacache/node_modules/glob<br>node_modules/glob | electron-builder@25.1.8 (major) |
| make-fetch-happen | high | transitive | dev | dev/build-tooling-likely | n/a | node_modules/make-fetch-happen | electron-builder@25.1.8 (major) |
| minimatch | high | transitive | dev | dev/build-tooling-likely | n/a | node_modules/@electron/universal/node_modules/minimatch<br>node_modules/@eslint/config-array/node_modules/minimatch<br>node_modules/@typescript-eslint/typescript-estree/node_modules/minimatch | typescript-eslint@8.36.0 (major) |
| node-gyp | high | transitive | dev | dev/build-tooling-likely | n/a | node_modules/node-gyp | electron-builder@25.1.8 (major) |
| rimraf | high | transitive | dev | dev/build-tooling-likely | n/a | node_modules/rimraf | electron-builder@25.1.8 (major) |
| temp | high | transitive | dev | dev/build-tooling-likely | n/a | node_modules/temp | electron-builder@25.1.8 (major) |
| typescript-eslint | high | direct-dev | dev | dev/build-tooling-likely | n/a | node_modules/typescript-eslint | typescript-eslint@8.36.0 (major) |
| ajv | moderate | transitive | dev | dev/build-tooling-likely | n/a | node_modules/ajv | true |

## Unknown Scope (manual review)

| Package | Sev | Direct | Scope | Exposure | Top-level effects | Sample lock paths | Fix |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @excalidraw/mermaid-to-excalidraw | moderate | transitive | unknown | needs-manual-triage | @excalidraw/excalidraw | node_modules/@excalidraw/mermaid-to-excalidraw | @excalidraw/excalidraw@0.17.6 (major) |
| markdown-it | moderate | transitive | unknown | needs-manual-triage | n/a | node_modules/markdown-it | true |
| nanoid | moderate | transitive | unknown | needs-manual-triage | n/a | node_modules/@excalidraw/mermaid-to-excalidraw/node_modules/nanoid<br>node_modules/docx/node_modules/nanoid<br>node_modules/nanoid | @excalidraw/excalidraw@0.17.6 (major) |
| diff | low | transitive | unknown | needs-manual-triage | n/a | node_modules/diff | true |

## Manual Resolution of Unknown-Scope Packages (`npm ls` Cross-Check)

Cross-check source: `muwi/audit/2026-02/outputs/day2-npm-ls-sec-deps.txt`

- `@excalidraw/mermaid-to-excalidraw`:
  - Runtime-path likely (`@excalidraw/excalidraw -> @excalidraw/mermaid-to-excalidraw`)
- `markdown-it`:
  - Runtime-path likely (`@tiptap/pm -> prosemirror-markdown -> markdown-it`)
- `diff`:
  - Runtime-path likely via Excalidraw mermaid dependency chain (`mermaid -> mdast-util-from-markdown -> uvu -> diff`)
- `nanoid`:
  - Mixed scope (runtime via Excalidraw/docx, dev via PostCSS/tooling path)

### Adjusted Prioritization (Practical)

- Runtime / mixed packages requiring release-risk review:
  - `@excalidraw/excalidraw`
  - `@excalidraw/mermaid-to-excalidraw`
  - `markdown-it`
  - `nanoid` (mixed)
  - `diff` (low severity, runtime path via mermaid chain)
- Dev/build-tooling backlog (mostly `electron-builder` and `typescript-eslint` chains):
  - High count, but lower immediate runtime exposure than the list above

### Important Triage Note

`npm audit` suggests `@excalidraw/excalidraw@0.17.6` as a fix path for the current advisory chain. This appears to be a non-trivial version change and should be manually validated (compatibility + feature impact) before applying.
