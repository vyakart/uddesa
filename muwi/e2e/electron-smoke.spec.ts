import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { test, expect } from '@playwright/test';
import { _electron as electron } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRoot = path.resolve(__dirname, '..');

test('electron app launches with preload API and loads blackboard route', async () => {
  const launchEnv = { ...process.env };
  delete launchEnv.ELECTRON_RUN_AS_NODE;
  delete launchEnv.ELECTRON;
  delete launchEnv.MUWI_ELECTRON_BUILD;

  const electronApp = await electron.launch({
    args: ['.'],
    cwd: appRoot,
    env: launchEnv,
  });

  try {
    const page = await electronApp.firstWindow();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForURL(/file:.*\/dist\/index\.html/, { timeout: 30_000 });

    await expect
      .poll(
        async () =>
          page.evaluate(() => document.getElementById('root')?.childElementCount ?? 0),
        { timeout: 30_000 }
      )
      .toBeGreaterThan(0);

    const preloadShape = await page.evaluate(() => ({
      hasElectronAPI: typeof window.electronAPI === 'object' && window.electronAPI !== null,
      hasSelectBackupLocation: typeof window.electronAPI?.selectBackupLocation === 'function',
      hasSaveBackup: typeof window.electronAPI?.saveBackup === 'function',
      hasLoadBackup: typeof window.electronAPI?.loadBackup === 'function',
      platform: window.electronAPI?.platform,
    }));

    expect(preloadShape.hasElectronAPI).toBe(true);
    expect(preloadShape.hasSelectBackupLocation).toBe(true);
    expect(preloadShape.hasSaveBackup).toBe(true);
    expect(preloadShape.hasLoadBackup).toBe(true);
    expect(['darwin', 'win32', 'linux']).toContain(preloadShape.platform ?? '');

    await page.evaluate(() => {
      window.history.pushState({}, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    await expect(page.getByRole('heading', { name: 'MUWI' })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('button', { name: 'Settings' })).toBeVisible({ timeout: 30_000 });

    const smokeBackupDir = '/tmp/muwi-e2e-smoke-backups';
    await fs.mkdir(smokeBackupDir, { recursive: true });
    await electronApp.evaluate(({ dialog }) => {
      dialog.showOpenDialog = async (...args) => {
        const [, options] = args;
        if (options?.properties?.includes('openDirectory')) {
          return {
            canceled: false,
            filePaths: ['/tmp/muwi-e2e-smoke-backups'],
            bookmarks: [],
          };
        }

        return {
          canceled: true,
          filePaths: [],
          bookmarks: [],
        };
      };
    });

    await page.getByRole('button', { name: 'Settings' }).click();
    await expect(page.getByRole('dialog', { name: 'Settings' })).toBeVisible();
    await page.getByRole('tab', { name: 'Backup' }).click();
    await page.getByRole('button', { name: 'Choose' }).click();
    await expect(page.getByLabel('Backup Location')).toHaveValue(smokeBackupDir);

    await page.locator('[data-testid="modal-close-button"]').click();
    await expect(page.getByRole('dialog', { name: 'Settings' })).toBeHidden();

    await page.getByRole('button', { name: 'Open Blackboard' }).click();
    await expect(page.getByRole('toolbar', { name: 'Blackboard controls' })).toBeVisible();
    await expect(page.locator('[data-testid="blackboard-canvas-container"]')).toBeVisible();
    await expect(page.locator('[data-testid="excalidraw-wrapper-root"]')).toBeVisible({
      timeout: 60_000,
    });
  } finally {
    await electronApp.close();
  }
});
