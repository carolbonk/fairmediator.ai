/**
 * E2E Test: Complete Authentication Flow
 * Tests user journey from registration to login to logout
 */

const { test, expect } = require('@playwright/test');

test.describe('Authentication Flow', () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';

  test('should complete full registration and login flow', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');

    // Click on Register button
    await page.click('text=Register');

    // Fill registration form
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);
    await page.fill('input[name="name"]', 'Test User');

    // Submit registration
    await page.click('button[type="submit"]');

    // Should show success message
    await expect(page.locator('text=Registration successful')).toBeVisible();

    // Should redirect to email verification page
    await expect(page).toHaveURL(/\/verify-email/);

    // Navigate to login page
    await page.goto('/login');

    // Fill login form
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);

    // Submit login
    await page.click('button[type="submit"]');

    // Should redirect to dashboard after successful login
    await expect(page).toHaveURL(/\/dashboard/);

    // Should see user's name in header
    await expect(page.locator('text=Test User')).toBeVisible();

    // Logout
    await page.click('button:has-text("Logout")');

    // Should redirect to homepage
    await expect(page).toHaveURL('/');
  });

  test('should show validation errors for invalid input', async ({ page }) => {
    await page.goto('/register');

    // Try to submit with invalid email
    await page.fill('input[name="email"]', 'not-an-email');
    await page.fill('input[name="password"]', 'short');
    await page.click('button[type="submit"]');

    // Should show validation errors
    await expect(page.locator('text=Invalid email')).toBeVisible();
    await expect(page.locator('text=Password must be')).toBeVisible();
  });

  test('should prevent login with wrong credentials', async ({ page }) => {
    await page.goto('/login');

    // Try to login with wrong credentials
    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'WrongPassword123!');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible();

    // Should stay on login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('should lock account after failed login attempts', async ({ page }) => {
    await page.goto('/login');

    // Make 5 failed login attempts
    for (let i = 0; i < 5; i++) {
      await page.fill('input[name="email"]', testEmail);
      await page.fill('input[name="password"]', 'WrongPassword123!');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(500);
    }

    // 6th attempt should show account locked message
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Account locked')).toBeVisible();
  });
});

test.describe('Mediator Search Flow', () => {
  test('should search and view mediators', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    // Navigate to mediator search
    await page.goto('/mediators');

    // Should see list of mediators
    await expect(page.locator('.mediator-card')).toHaveCount({ min: 1 });

    // Use search filter
    await page.fill('input[placeholder*="Search"]', 'Family Law');
    await page.waitForTimeout(1000);

    // Should filter results
    const filteredResults = await page.locator('.mediator-card').count();
    expect(filteredResults).toBeGreaterThan(0);

    // Click on first mediator
    await page.locator('.mediator-card').first().click();

    // Should navigate to mediator detail page
    await expect(page).toHaveURL(/\/mediators\//);

    // Should see mediator details
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('text=Practice Areas')).toBeVisible();
    await expect(page.locator('text=Experience')).toBeVisible();
  });
});

test.describe('Subscription Flow', () => {
  test('should upgrade subscription', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    // Navigate to subscription page
    await page.goto('/subscription');

    // Should see subscription tiers
    await expect(page.locator('text=Free')).toBeVisible();
    await expect(page.locator('text=Basic')).toBeVisible();
    await expect(page.locator('text=Pro')).toBeVisible();

    // Click upgrade on Basic tier
    await page.locator('button:has-text("Upgrade to Basic")').click();

    // Should redirect to payment page or show payment modal
    await expect(
      page.locator('text=Payment').or(page.locator('text=Stripe'))
    ).toBeVisible();
  });
});
