import { test, expect } from '@playwright/test';

test('homepage exposes primary navigation and demo walkthrough', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: /skip to main content/i })).toBeAttached();
  await expect(page.getByRole('navigation')).toBeVisible();

  await page.goto('/demo');
  await expect(page.getByRole('heading', { name: /2-minute product tour/i })).toBeVisible();
  await expect(page.getByRole('tablist', { name: /demo steps/i })).toBeVisible();
});

test('track page loads activity logging surface', async ({ page }) => {
  await page.goto('/track');
  await expect(page.getByRole('heading', { name: /carbon logger/i })).toBeVisible();
});
