# Dependency Audit Summary (npm audit)

- Generated: 2026-02-23T15:07:06.506Z
- Source: `/Users/ziksartin/tools/uddesa/muwi/audit/2026-02/outputs/day1-audit-deps-json.txt`
- Total vulnerable packages: 29

## Severity Totals

| Severity | Count |
| --- | ---: |
| Critical | 0 |
| High | 23 |
| Moderate | 5 |
| Low | 1 |
| Info | 0 |
| Unknown | 0 |

## Package Findings

| Package | Severity | Direct | Fix available | Recommended action | Via | Range |
| --- | --- | --- | --- | --- | --- | --- |
| @electron/asar | high | no | yes (electron-builder@25.1.8 (semver-major)) | fix-now | glob; minimatch | 3.2.1 - 3.4.1 |
| @electron/rebuild | high | no | yes (electron-builder@25.1.8 (semver-major)) | fix-now | node-gyp | 3.2.10 - 3.6.2 \|\| >=4.0.1 |
| @electron/universal | high | no | yes (electron-builder@25.1.8 (semver-major)) | fix-now | @electron/asar; dir-compare; +1 more | >=1.0.1 |
| @typescript-eslint/eslint-plugin | high | no | yes | fix-now | @typescript-eslint/parser; @typescript-eslint/type-utils; +1 more | 6.16.0 - 8.56.1-alpha.2 |
| @typescript-eslint/parser | high | no | yes (typescript-eslint@8.36.0 (semver-major)) | fix-now | @typescript-eslint/typescript-estree | 6.16.0 - 8.56.1-alpha.2 |
| @typescript-eslint/type-utils | high | no | yes | fix-now | @typescript-eslint/typescript-estree; @typescript-eslint/utils | 6.16.0 - 8.56.1-alpha.2 |
| @typescript-eslint/typescript-estree | high | no | yes (typescript-eslint@8.36.0 (semver-major)) | fix-now | minimatch | 6.16.0 - 8.56.1-alpha.2 |
| @typescript-eslint/utils | high | no | yes (typescript-eslint@8.36.0 (semver-major)) | fix-now | @typescript-eslint/typescript-estree | 6.16.0 - 8.56.1-alpha.2 |
| app-builder-lib | high | no | yes (electron-builder@25.1.8 (semver-major)) | fix-now | @electron/asar; @electron/rebuild; +3 more | >=23.0.0-alpha.0 |
| cacache | high | no | yes (electron-builder@25.1.8 (semver-major)) | fix-now | glob | 6.1.1 - 19.0.1 |
| dir-compare | high | no | yes (electron-builder@25.1.8 (semver-major)) | fix-now | minimatch | * |
| dmg-builder | high | no | yes (electron-builder@25.1.8 (semver-major)) | fix-now | app-builder-lib | >=26.0.0-alpha.0 |
| electron-builder | high | yes | yes (electron-builder@25.1.8 (semver-major)) | fix-now | app-builder-lib; dmg-builder | 19.25.0 \|\| >=26.0.0-alpha.0 |
| electron-builder-squirrel-windows | high | no | yes (electron-builder@25.1.8 (semver-major)) | fix-now | app-builder-lib; electron-winstaller | >=26.0.0-alpha.0 |
| electron-winstaller | high | no | yes (electron-builder@25.1.8 (semver-major)) | fix-now | @electron/asar; temp | >=3.0.0 |
| filelist | high | no | yes | fix-now | minimatch | 0.0.2 - 1.0.4 |
| glob | high | no | yes (electron-builder@25.1.8 (semver-major)) | fix-now | minimatch | 3.0.0 - 10.5.0 |
| make-fetch-happen | high | no | yes (electron-builder@25.1.8 (semver-major)) | fix-now | cacache | <=14.0.3 |
| minimatch | high | no | yes (typescript-eslint@8.36.0 (semver-major)) | fix-now | https://github.com/advisories/GHSA-3ppc-4f35-3m26 (high) | <10.2.1 |
| node-gyp | high | no | yes (electron-builder@25.1.8 (semver-major)) | fix-now | make-fetch-happen | 8.0.0 - 11.5.0 |
| rimraf | high | no | yes (electron-builder@25.1.8 (semver-major)) | fix-now | glob | 2.3.0 - 3.0.2 \|\| 4.2.0 - 5.0.10 |
| temp | high | no | yes (electron-builder@25.1.8 (semver-major)) | fix-now | rimraf | >=0.8.4 |
| typescript-eslint | high | yes | yes (typescript-eslint@8.36.0 (semver-major)) | fix-now | @typescript-eslint/eslint-plugin; @typescript-eslint/parser; +2 more | <=8.56.1-alpha.2 |
| @excalidraw/excalidraw | moderate | yes | yes (@excalidraw/excalidraw@0.17.6 (semver-major)) | patch-this-sprint | @excalidraw/mermaid-to-excalidraw | 0.17.1-08b13f9 - 0.17.1-test \|\| >=0.18.0-6135548 |
| @excalidraw/mermaid-to-excalidraw | moderate | no | yes (@excalidraw/excalidraw@0.17.6 (semver-major)) | patch-this-sprint | nanoid | * |
| ajv | moderate | no | yes | patch-this-sprint | https://github.com/advisories/GHSA-2g4f-4pwh-qvx6 (moderate) | <6.14.0 |
| markdown-it | moderate | no | yes | patch-this-sprint | https://github.com/advisories/GHSA-38c4-r59v-3vqw (moderate) | 13.0.0 - 14.1.0 |
| nanoid | moderate | no | yes (@excalidraw/excalidraw@0.17.6 (semver-major)) | patch-this-sprint | https://github.com/advisories/GHSA-mwcw-c2x4-8c55 (moderate) | 4.0.0 - 5.0.8 |
| diff | low | no | yes | patch-when-touching | https://github.com/advisories/GHSA-73rr-hh4g-fpgx (low) | 5.0.0 - 5.2.1 |

## Next Steps

1. Copy findings into `security/CVE_TRIAGE_TEMPLATE.md`.
2. Assign owner + target date for every critical/high finding.
3. Re-run `npm audit --json` after upgrades and attach both reports to the same triage entry.