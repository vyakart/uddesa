# Day 3 Data Layer + Backup Integrity Review

Date: 2026-02-24

## Scope Reviewed

- Dexie schema and migration readiness (`muwi/src/db/database.ts`)
- Query modules and integrity-sensitive mutations (`muwi/src/db/queries/*.ts`)
- Backup/restore validation and restore behavior (`muwi/src/utils/backup.ts`)
- Existing tests for data + backup paths (`muwi/src/db/queries/*.test.ts`, `muwi/src/utils/backup.test.ts`)

## Evidence Collected

- Query + backup test run: `muwi/audit/2026-02/outputs/day3-data-backup-tests.txt`
- Query mutation scan: `muwi/audit/2026-02/outputs/day3-query-mutation-scan.txt`

## Summary

- Query and backup test coverage is healthy for standard CRUD and many validation/error branches (`33` tests passed).
- Backup input validation is strong (size checks, metadata/table counts, JSON parsing).
- Main Day 3 risk is transactional integrity under failure conditions:
  - backup restore replacement is non-atomic across clear + restore
  - many multi-table query mutations are not transaction-wrapped
- Migration readiness is limited to a single Dexie schema version with no upgrade path.

## Findings (Day 3)

- High: `DATA-BACKUP-001` non-atomic restore replacement flow (`muwi/src/utils/backup.ts:413`, `muwi/src/utils/backup.ts:428`)
- Medium: `DATA-QUERY-001` non-transactional multi-table query mutations across aggregates (`muwi/src/db/queries/*.ts`)
- Medium: `DATA-SCHEMA-001` no migration path beyond `version(1)` (`muwi/src/db/database.ts:54`)

Detailed entries: `muwi/audit/2026-02/findings/day3-data-integrity-findings.md`

## Positive Notes

- `validateBackup` enforces required tables, metadata consistency, and upper bounds before restore.
- `backup.test.ts` already covers many invalid-format/error branches and restore failure paths.
- Query tests include several “orphan/missing parent” cases (especially `longDrafts` and `academic`) to keep branch behavior explicit.
