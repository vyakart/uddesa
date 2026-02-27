import { expect, test } from '@playwright/test';
import { registerWebRuntimeGuards } from './support/webGuards';

registerWebRuntimeGuards();

test('academic flow: create paper, add reference, insert citation', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Open Academic Papers' }).click();

  const createPaperButton = page.getByRole('button', { name: 'Create Paper' });
  const newPaperButton = page.getByRole('button', { name: /New Paper/i }).first();

  if (await createPaperButton.isVisible().catch(() => false)) {
    await createPaperButton.click();
  } else {
    await expect(newPaperButton).toBeVisible();
    await newPaperButton.click();
  }

  await expect(page.getByRole('heading', { name: 'New Academic Paper' })).toBeVisible();
  await page.getByPlaceholder('Enter paper title...').fill('Playwright Academic Paper');
  await page.getByRole('button', { name: /IMRAD/i }).click();
  await page.getByRole('button', { name: 'Create Paper' }).last().click();

  await expect(page.locator('#academic-paper-select')).toContainText('Playwright Academic Paper');
  await expect(page.locator('.ProseMirror')).toBeVisible();

  await page.getByRole('button', { name: /open bibliography panel/i }).click();
  await expect(page.getByPlaceholder('Search references...')).toBeVisible();
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Add Reference' })).toBeVisible();

  await page.locator('label:has-text("Title *") + input').fill('Playwright Reference');
  await page.getByPlaceholder('Smith, John; Doe, Jane').fill('Tester, Pat');
  await page.getByRole('button', { name: 'Add Reference' }).click();
  await expect(page.getByText('Playwright Reference')).toBeVisible();

  await page.locator('button[title="Insert Citation (Ctrl+Shift+C)"]').click();
  await page.locator('[data-entry]').filter({ hasText: 'Playwright Reference' }).first().click();
  await page.getByRole('button', { name: 'Insert Citation', exact: true }).click();

  await expect(page.locator('.ProseMirror')).toContainText('Tester');
});
