import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { registerWebRuntimeGuards } from './support/webGuards';

registerWebRuntimeGuards();

test('BackupPanel web fallbacks: download save, file-picker restore, and Electron-only auto-backup limitation', async ({
  page,
}, testInfo) => {
  await page.goto('/__e2e__/web-fallbacks');

  await page.getByRole('button', { name: 'Open Backup Panel' }).click();
  await expect(page.getByRole('heading', { name: 'Backup & Restore' })).toBeVisible();

  const [backupDownload] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Create Backup' }).click(),
  ]);

  expect(backupDownload.suggestedFilename()).toMatch(/^muwi-backup-\d{4}-\d{2}-\d{2}\.json$/);
  const backupDownloadPath = testInfo.outputPath(backupDownload.suggestedFilename());
  await backupDownload.saveAs(backupDownloadPath);
  const backupBytes = await readFile(backupDownloadPath);
  const backupJson = JSON.parse(backupBytes.toString('utf8')) as {
    metadata?: { totalRecords?: number; tableCount?: number };
  };

  expect(backupJson.metadata?.tableCount).toBeGreaterThan(0);
  await testInfo.attach('backup-fallback-download.json', {
    body: backupBytes,
    contentType: 'application/json',
  });

  await expect(page.getByRole('status')).toContainText('Backup created successfully!');

  await page.getByRole('button', { name: 'Restore Backup' }).click();
  await expect(page.getByRole('heading', { name: 'Restore Backup?' })).toBeVisible();

  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByRole('button', { name: 'Restore', exact: true }).click(),
  ]);

  await fileChooser.setFiles({
    name: backupDownload.suggestedFilename(),
    mimeType: 'application/json',
    buffer: backupBytes,
  });

  await expect(page.getByRole('status')).toContainText(/Restored \d+ records from \d+ tables\./);

  await page.getByRole('checkbox', { name: 'Enable automatic backups' }).check();
  await page.getByRole('button', { name: 'Browse' }).click();
  await expect(page.getByRole('alert')).toContainText('Location picker requires the desktop app.');
});

test('ExportPanel web fallback triggers browser download', async ({ page }, testInfo) => {
  await page.goto('/__e2e__/web-fallbacks');

  await page.getByRole('button', { name: 'Open Export Panel' }).click();
  await expect(page.getByRole('heading', { name: 'Export Document' })).toBeVisible();

  await page.getByRole('button', { name: 'TEX' }).click();

  const [exportDownload] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export TEX' }).click(),
  ]);

  expect(exportDownload.suggestedFilename()).toBe('harness-export-draft.tex');
  const exportDownloadPath = testInfo.outputPath(exportDownload.suggestedFilename());
  await exportDownload.saveAs(exportDownloadPath);
  const exportBytes = await readFile(exportDownloadPath);
  const exportText = exportBytes.toString('utf8');

  expect(exportText).toContain('\\documentclass');
  expect(exportText).toContain('Harness Export Draft');
  await testInfo.attach('export-fallback-download.tex', {
    body: exportBytes,
    contentType: 'application/x-tex',
  });

  await expect(page.getByRole('status')).toContainText('Successfully exported to harness-export-draft.tex');
});
