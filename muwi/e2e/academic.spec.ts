import { expect, test } from '@playwright/test';

test('academic flow: create paper, add reference, insert citation', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Open Academic Papers' }).click();
  await expect(page.getByRole('button', { name: /New Academic Paper/i })).toBeVisible();

  await page.getByRole('button', { name: /New Academic Paper/i }).click();
  await page.getByPlaceholder('Enter paper title...').fill('Playwright Academic Paper');
  await page.getByRole('button', { name: /IMRAD/i }).click();
  await page.getByRole('button', { name: 'Create Paper' }).click();

  await expect(page.getByRole('button', { name: /Playwright Academic Paper/i })).toBeVisible();
  await expect(page.getByText('Introduction').first()).toBeVisible();

  await page.getByTitle('Toggle Bibliography Panel').click();
  await expect(page.getByText('Reference Library')).toBeVisible();
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Add Reference' })).toBeVisible();

  await page.locator('label:has-text("Title *") + input').fill('Playwright Reference');
  await page.getByPlaceholder('Smith, John; Doe, Jane').fill('Tester, Pat');
  await page.getByRole('button', { name: 'Add Reference' }).click();
  await expect(page.getByText('Playwright Reference')).toBeVisible();

  await page.locator('button[title="Insert Citation (Ctrl+Shift+C)"]').click();
  await page.getByText('Playwright Reference').first().click();
  await page.getByRole('button', { name: 'Insert Citation', exact: true }).click();

  await expect(page.locator('.ProseMirror')).toContainText('Tester');
});
