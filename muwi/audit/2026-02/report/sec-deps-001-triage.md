# SEC-DEPS-001 Dependency Triage (Day 2)

Source audit: `muwi/audit/2026-02/outputs/day1-audit-deps-json.txt`

Classification uses `package-lock.json` `packages[*].dev` flags across all matching lockfile paths, not just top-level `node_modules/<pkg>`.

## Summary

- Total vulnerable packages: 29
- Severity totals: high=23, moderate=5, low=1
- Direct classification: transitive=26, direct-runtime=1, direct-dev=2
- Install scope: dev=24, runtime=1, unknown=4
- Likely exposure: dev/build-tooling-likely=24, runtime-path-possible=1, needs-manual-triage=4

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
