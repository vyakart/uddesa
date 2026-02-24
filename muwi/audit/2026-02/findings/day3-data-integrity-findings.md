### [DATA-BACKUP-001] Restore Replace Flow Is Not Atomic Across Clear + Restore
- Area: Data Layer / Backup Integrity
- Severity: High
- Files: `muwi/src/utils/backup.ts:383`, `muwi/src/utils/backup.ts:413`, `muwi/src/utils/backup.ts:428`
- Summary: `restoreBackup(..., clearExisting=true)` clears all tables in one transaction and restores data in a second transaction, so a restore failure after a successful clear can leave the database empty.
- Evidence:
  - Command/Test: `npx vitest run src/db/queries/*.test.ts src/utils/backup.test.ts`
  - Output/Screenshot: `muwi/audit/2026-02/outputs/day3-data-backup-tests.txt`
- Reproduction:
  1. Call `restoreBackup(validBackup, true)`.
  2. Let the clear transaction succeed.
  3. Trigger a failure inside the subsequent restore `bulkPut` transaction.
- Expected:
  - Restore replacement should be atomic (all old data preserved on failure, or all new data applied).
- Observed:
  - Clear and restore happen in separate transactions, creating a data-loss window.
- Recommended Fix:
  - Execute clear + restore within a single Dexie transaction, or restore into a staging database and swap only on success.
- Regression Tests Needed:
  - Simulate `clearExisting=true` with clear success + restore failure and assert original records are still present.

### [DATA-QUERY-001] Multi-Table Query Mutations Are Mostly Not Transaction-Wrapped
- Area: Data Layer
- Severity: Medium
- Files: `muwi/src/db/queries/scratchpad.ts:26`, `muwi/src/db/queries/scratchpad.ts:45`, `muwi/src/db/queries/blackboard.ts:22`, `muwi/src/db/queries/blackboard.ts:30`, `muwi/src/db/queries/longDrafts.ts:22`, `muwi/src/db/queries/longDrafts.ts:30`, `muwi/src/db/queries/longDrafts.ts:73`, `muwi/src/db/queries/longDrafts.ts:93`, `muwi/src/db/queries/academic.ts:22`, `muwi/src/db/queries/academic.ts:31`, `muwi/src/db/queries/academic.ts:55`, `muwi/src/db/queries/academic.ts:98`, `muwi/src/db/queries/academic.ts:106`, `muwi/src/db/queries/academic.ts:130`, `muwi/src/db/queries/academic.ts:146`, `muwi/src/db/queries/academic.ts:170`
- Summary: Many parent/child mutations (add/delete + parent metadata/list updates) are split across multiple awaits without a transaction, which can produce referential drift on mid-operation failure.
- Evidence:
  - Command/Test: mutation scan (`rg`) + query tests
  - Output/Screenshot: `muwi/audit/2026-02/outputs/day3-query-mutation-scan.txt`
- Reproduction:
  1. Trigger an error between child write/delete and parent metadata update (or vice versa).
  2. Observe mismatched `sectionIds` / `elementIds` / `citationIds` / `figureIds` or partial cascades.
- Expected:
  - Cross-table mutations should commit or roll back together.
- Observed:
  - Most functions use sequential awaits without `db.transaction(...)`.
- Recommended Fix:
  - Wrap cross-table create/update/delete flows in Dexie transactions per aggregate root (`page`, `canvas`, `longDraft`, `paper`).
  - Include `reorderSections` parent update in the same transaction as section reordering.
- Regression Tests Needed:
  - Inject failures into parent update after child mutation (and reverse ordering cases) and assert rollback/no drift.

### [DATA-SCHEMA-001] No Dexie Migration Path Beyond Initial Schema Version
- Area: Data Layer / Migration Readiness
- Severity: Medium
- Files: `muwi/src/db/database.ts:54`
- Summary: The database defines only `version(1)` with no upgrade handlers, which increases risk for future schema/index changes and backup/restore compatibility drift.
- Evidence:
  - Command/Test: schema scan (`rg version(1)`)
  - Output/Screenshot: `muwi/src/db/database.ts:54`
- Reproduction:
  1. Introduce any schema/index change requiring a Dexie version bump.
  2. Existing installations have no established migration framework or upgrade tests to validate transitions.
- Expected:
  - Versioned schema evolution plan with migration functions and tests.
- Observed:
  - Single version schema only.
- Recommended Fix:
  - Add versioned migration strategy (`version(2).upgrade(...)`) and migration test fixtures.
- Regression Tests Needed:
  - Upgrade tests from seeded v1 databases to next schema version(s), including backup/restore round-trip after migration.
