import fs from 'fs/promises';
import path from 'path';
import { expect, test } from '@playwright/test';
import { registerWebRuntimeGuards } from './support/webGuards';

registerWebRuntimeGuards();

interface SwitchSample {
  label: string;
  durationMs: number;
  route: string;
  shellBreakpoint: string | null;
}

interface StartupSample {
  shelfVisibleMs: number;
  route: string;
  domContentLoadedMs: number | null;
  loadEventMs: number | null;
}

test.describe.configure({ mode: 'serial' });

test.skip(
  Boolean(process.env.CI) && process.env.MUWI_ENABLE_PERF_BASELINE_CI !== 'true',
  'Local baseline capture unless explicitly enabled in CI.'
);

test('performance baseline: startup and shelf-mediated diary switches', async ({ page }, testInfo) => {
  const startupStart = Date.now();

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'MUWI' })).toBeVisible();

  const startupSample: StartupSample = await page.evaluate(
    ({ shelfVisibleMs }) => {
      const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;

      return {
        shelfVisibleMs,
        route: window.location.pathname,
        domContentLoadedMs: navigationEntry
          ? Math.round(navigationEntry.domContentLoadedEventEnd - navigationEntry.startTime)
          : null,
        loadEventMs: navigationEntry ? Math.round(navigationEntry.loadEventEnd - navigationEntry.startTime) : null,
      };
    },
    { shelfVisibleMs: Date.now() - startupStart },
  );

  const switchSamples: SwitchSample[] = [];

  const backToShelf = async () => {
    await page.getByRole('button', { name: 'Back to shelf' }).click();
    await expect(page.getByRole('heading', { name: 'MUWI' })).toBeVisible();
  };

  const measureShelfToDiary = async (buttonName: string, label: string) => {
    const start = Date.now();

    await page.getByRole('button', { name: buttonName }).click();
    const shell = page.locator('[data-testid="diary-shell"]');
    await expect(shell).toBeVisible();
    await expect(page.getByRole('button', { name: 'Back to shelf' })).toBeVisible();

    const sample = await page.evaluate(
      ({ label, durationMs }) => {
        const shell = document.querySelector<HTMLElement>('[data-testid="diary-shell"]');

        return {
          label,
          durationMs,
          route: window.location.pathname,
          shellBreakpoint: shell?.getAttribute('data-shell-breakpoint') ?? null,
        };
      },
      { label, durationMs: Date.now() - start },
    );

    switchSamples.push(sample);
  };

  await measureShelfToDiary('Open Scratchpad', 'cold:scratchpad');
  await backToShelf();

  await measureShelfToDiary('Open Long Drafts', 'cold:long-drafts');
  await backToShelf();

  await measureShelfToDiary('Open Blackboard', 'cold:blackboard');
  await backToShelf();

  await measureShelfToDiary('Open Academic Papers', 'cold:academic');
  await backToShelf();

  await measureShelfToDiary('Open Academic Papers', 'warm:academic');
  await backToShelf();

  const summary = {
    capturedAt: new Date().toISOString(),
    browser: testInfo.project.name,
    startup: startupSample,
    switches: switchSamples,
  };

  const perfOutputPath = process.env.MUWI_PERF_OUTPUT;
  if (perfOutputPath) {
    await fs.mkdir(path.dirname(perfOutputPath), { recursive: true });
    await fs.writeFile(perfOutputPath, JSON.stringify(summary, null, 2), 'utf8');
  }

  // Printed intentionally so the values can be copied into PROGRESS.md/TASKS notes.
  console.log(`[phase7-7.15.1-baseline] ${JSON.stringify(summary)}`);

  expect(startupSample.shelfVisibleMs).toBeGreaterThan(0);
  expect(switchSamples).toHaveLength(5);
});
