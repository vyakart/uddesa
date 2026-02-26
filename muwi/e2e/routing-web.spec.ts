import { expect, test } from '@playwright/test';
import { registerWebRuntimeGuards } from './support/webGuards';

registerWebRuntimeGuards();

test('deep-link refresh works for academic and drafts item paths', async ({ page }) => {
  await page.goto('/academic');
  await expect(page.getByRole('button', { name: 'Back to shelf' })).toBeVisible();

  await page.goto('/drafts/draft-123');
  await expect(page.getByRole('button', { name: 'Back to shelf' })).toBeVisible();
});

test('unknown route falls back to shelf safely', async ({ page }) => {
  await page.goto('/not-a-route');

  await expect(page.getByRole('heading', { name: 'MUWI' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open Scratchpad' })).toBeVisible();
});
