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

## Runtime / Mixed-Scope Vulnerabilities (prioritize for release risk)

| Package | Sev | Direct | Scope | Exposure | Top-level effects | Sample lock paths | Fix |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @excalidraw/excalidraw | moderate | direct-runtime | runtime | runtime-path-possible | n/a | node_modules/@excalidraw/excalidraw | @excalidraw/excalidraw@0.17.6 (major) |

## Dev / Build Tooling Vulnerabilities

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
