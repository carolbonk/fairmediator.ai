import { test, expect } from '@playwright/test';

// Smoke test for the 2-card landing page. Covers the visible bones of
// Path 1 and Path 3 entry — if either headline or its CTA disappears,
// the funnel is broken and this should fail loudly.

test.describe('Landing page', () => {
  test('renders the 2-card hierarchy with both product CTAs', async ({ page }) => {
    await page.goto('/');

    await expect(
      page.getByRole('heading', { name: /your case pipeline, client inbox/i })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /first mediator marketplace.*50 states/i })
    ).toBeVisible();

    await expect(page.getByRole('button', { name: /enter crm/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /^i'm a mediator$/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /^i'm a lawyer \/ party$/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /search mediators directly/i })).toBeVisible();
  });

  test('Mediator-side CTAs route into the marketplace apply page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /^i'm a mediator$/i }).click();
    await expect(page).toHaveURL(/\/mediators-marketplace\/apply$/);
  });
});
