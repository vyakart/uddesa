# MUWI Web Data Migration Strategy (Dexie / IndexedDB)

MUWI stores user data locally in IndexedDB via Dexie. For web launch stability, schema changes must be versioned and migration-tested.

## Rules

1. Every schema/index change must increment the Dexie version in `muwi/src/db/database.ts`.
2. Add an explicit `.upgrade(...)` handler for the new version (no-op is acceptable only when establishing scaffolding).
3. Add/extend a migration regression test that opens a prior-version database and verifies the current DB opens successfully and preserves critical records.
4. Treat migration failures as launch blockers for web deployments.

## Current State

- `version(2)` migration scaffold exists in `muwi/src/db/database.ts` (no-op upgrade).
- Regression coverage exists in `muwi/src/db/database.migration.test.ts`.

## Future Migration Checklist (Per Version Bump)

- Define new schema/index map
- Implement upgrade handler
- Test upgrade from previous version
- Test backup export/import after upgrade (recommended)
- Document any irreversible changes and recovery paths
