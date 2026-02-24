# Day 3 Backup/Restore Test Gap List

Date: 2026-02-24

## Existing Coverage (Observed)

- Query + backup tests passed: `33` tests total
- Evidence: `muwi/audit/2026-02/outputs/day3-data-backup-tests.txt`
- Existing backup coverage already includes:
  - invalid JSON / invalid format / size limit parsing
  - incompatible backup versions
  - clear transaction failure
  - restore transaction failure (`clearExisting=false`)
  - Electron API and web fallback branches
  - auto-backup scheduling/error branches

## High-Priority Gaps

1. Atomic replace failure when `clearExisting=true`
- Why it matters: current implementation clears existing data before restore in a separate transaction.
- Missing test: simulate clear success + restore failure and assert prior data is preserved (or intentionally document data-loss behavior if not fixed).

2. Cross-table transactional rollback in query modules
- Why it matters: many query functions update child rows and parent metadata arrays in separate awaits.
- Missing tests: inject failures between operations and assert no referential drift (`sectionIds`, `elementIds`, `citationIds`, `figureIds`, `textBlockIds`).

3. Corrupted-but-shape-valid backup rows
- Why it matters: `validateBackup` checks table arrays and plain-record rows, but not deep field types.
- Missing tests: rows with wrong field types (e.g., malformed dates/IDs/arrays) that pass validation but fail later in UI/query code.

## Medium-Priority Gaps

1. Duplicate primary keys inside a single backup table payload
- Validate expected behavior (upsert overwrite vs reject) and returned `recordsRestored` semantics.

2. Large-but-valid backup restore performance / responsiveness smoke
- Practical runtime check for near-limit file sizes and high record counts.

3. Round-trip restore invariants
- Create backup -> restore -> create backup again -> compare table counts and key invariants.

## Query-Specific Gap Targets (Suggested)

- `muwi/src/db/queries/scratchpad.ts`
  - `createTextBlock`, `deleteTextBlock`, `deletePage`
- `muwi/src/db/queries/blackboard.ts`
  - `createElement`, `deleteElement`, `deleteCanvas`
- `muwi/src/db/queries/longDrafts.ts`
  - `createSection`, `deleteSection`, `reorderSections`
- `muwi/src/db/queries/academic.ts`
  - `createAcademicSection`, `deleteAcademicSection`
  - `createCitation`, `deleteCitation`
  - `createFigure`, `deleteFigure`
  - `deletePaper`, `deleteBibliographyEntry`
