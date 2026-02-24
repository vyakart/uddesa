# Dependency Audit Summary (npm audit)

- Generated: 2026-02-24T17:16:36.275Z
- Source: `/Users/ziksartin/tools/uddesa/muwi/audit/2026-02/outputs/day7-audit-deps-after-controlled-upgrade-json.txt`
- Total vulnerable packages: 20

## Severity Totals

| Severity | Count |
| --- | ---: |
| Critical | 0 |
| High | 17 |
| Moderate | 3 |
| Low | 0 |
| Info | 0 |
| Unknown | 0 |

## Package Findings

| Package | Severity | Direct | Fix available | Recommended action | Via | Range |
| --- | --- | --- | --- | --- | --- | --- |
| @electron/asar | high | no | yes (electron-builder@25.1.8 (semver-major)) | fix-now | glob; minimatch | 3.2.1 - 3.4.1 |
| @electron/rebuild | high | no | yes (electron-builder@25.1.8 (semver-major)) | fix-now | node-gyp | 3.2.10 - 3.6.2 \|\| >=4.0.1 |
| @electron/universal | high | no | yes (electron-builder@25.1.8 (semver-major)) | fix-now | @electron/asar; dir-compare; +1 more | >=1.0.1 |
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
| minimatch | high | no | yes (electron-builder@25.1.8 (semver-major)) | fix-now | https://github.com/advisories/GHSA-3ppc-4f35-3m26 (high) | <10.2.1 |
| node-gyp | high | no | yes (electron-builder@25.1.8 (semver-major)) | fix-now | make-fetch-happen | 8.0.0 - 11.5.0 |
| rimraf | high | no | yes (electron-builder@25.1.8 (semver-major)) | fix-now | glob | 2.3.0 - 3.0.2 \|\| 4.2.0 - 5.0.10 |
| temp | high | no | yes (electron-builder@25.1.8 (semver-major)) | fix-now | rimraf | >=0.8.4 |
| @excalidraw/excalidraw | moderate | yes | yes (@excalidraw/excalidraw@0.17.6 (semver-major)) | patch-this-sprint | @excalidraw/mermaid-to-excalidraw | 0.17.1-08b13f9 - 0.17.1-test \|\| >=0.18.0-6135548 |
| @excalidraw/mermaid-to-excalidraw | moderate | no | yes (@excalidraw/excalidraw@0.17.6 (semver-major)) | patch-this-sprint | nanoid | * |
| nanoid | moderate | no | yes (@excalidraw/excalidraw@0.17.6 (semver-major)) | patch-this-sprint | https://github.com/advisories/GHSA-mwcw-c2x4-8c55 (moderate) | 4.0.0 - 5.0.8 |

## Next Steps

1. Copy findings into `security/CVE_TRIAGE_TEMPLATE.md`.
2. Assign owner + target date for every critical/high finding.
3. Re-run `npm audit --json` after upgrades and attach both reports to the same triage entry.