import { expect, test } from '@playwright/test';

test('shelf renders all diary cards', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'MUWI' })).toBeVisible();
  await expect(page.getByText('Multi-Utility Writing Interface')).toBeVisible();

  await expect(page.getByRole('button', { name: 'Open Scratchpad' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open Blackboard' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open Personal Diary' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open Drafts' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open Long Drafts' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open Academic Papers' })).toBeVisible();
});
