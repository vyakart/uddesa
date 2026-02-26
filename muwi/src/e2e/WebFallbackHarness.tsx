import { useState } from 'react';
import { BackupPanel } from '@/components/common/BackupPanel/BackupPanel';
import { ExportPanel } from '@/components/common/ExportPanel/ExportPanel';

export function WebFallbackHarness() {
  const [backupOpen, setBackupOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  return (
    <main
      className="muwi-chrome-text min-h-screen p-6 [background-color:var(--color-bg-primary)] [color:var(--color-text-primary)]"
      data-testid="web-fallback-harness"
    >
      <div className="mx-auto max-w-3xl rounded-xl border p-6 shadow-sm [border-color:var(--color-border-default)] [background-color:var(--color-bg-canvas)]">
        <h1 className="text-xl font-semibold">Web Fallback Harness</h1>
        <p className="mt-2 text-sm [color:var(--color-text-secondary)]">
          Playwright-only route for validating browser fallback flows for backup/restore and export.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            className="muwi-button"
            data-variant="primary"
            onClick={() => {
              setExportOpen(false);
              setBackupOpen(true);
            }}
          >
            Open Backup Panel
          </button>
          <button
            type="button"
            className="muwi-button"
            data-variant="secondary"
            onClick={() => {
              setBackupOpen(false);
              setExportOpen(true);
            }}
          >
            Open Export Panel
          </button>
        </div>
      </div>

      <BackupPanel
        isOpen={backupOpen}
        onClose={() => setBackupOpen(false)}
      />

      <ExportPanel
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        documentType="draft"
        documentTitle="Harness Export Draft"
        content="<h1>Harness Export Draft</h1><p>Fallback export validation content.</p>"
      />
    </main>
  );
}
