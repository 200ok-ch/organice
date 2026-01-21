import { test, expect } from '@playwright/test';
import AppHelper from '../../helpers/app-helper.js';

test.describe('Landing Page', () => {
  let appHelper;

  test.beforeEach(async ({ page }) => {
    appHelper = new AppHelper(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await appHelper.waitForLandingReady();
  });

  test.afterEach(async ({ page }) => {
    // Clear storage state after each test for isolation
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('should navigate to sample org file', async ({ page }) => {
    const liveDemoLink = page.locator('[data-testid="landing-live-demo-hero"]');
    await liveDemoLink.click();
    await page.waitForURL('/sample', { timeout: 10000 });
    expect(page.url()).toContain('/sample');

    // Verify sample.org content is displayed
    await expect(page.locator('text=This is an actual org file')).toBeVisible();
    await expect(page.locator('text=Tap on any header to open it')).toBeVisible();
    await expect(page.locator('text=Actions')).toBeVisible();
  });

  test('should navigate to sign in page', async ({ page }) => {
    // Use data-testid to target the hero section sign-in link
    const signInLink = page.locator('[data-testid="landing-sign-in-hero"]');
    await expect(signInLink).toBeVisible();
    await signInLink.click();
    await page.waitForURL('/sign_in', { timeout: 10000 });
    expect(page.url()).toContain('/sign_in');

    // Verify sign-in page content is displayed
    await expect(page.getByText('Sign in', { exact: true })).toBeVisible();
    await expect(page.getByText('organice syncs your files')).toBeVisible();
    await expect(page.getByRole('link', { name: 'WebDAV' })).toBeVisible();
  });

  test('should have working external GitHub link', async ({ page }) => {
    const githubLink = page.locator('[data-testid="landing-github-link"]');
    await expect(githubLink).toHaveAttribute('target', '_blank');
    await expect(githubLink).toHaveAttribute('rel', 'noreferrer noopener');
  });

  test('should have working external documentation link', async ({ page }) => {
    const docsLink = page.locator('[data-testid="landing-docs-link"]');
    await expect(docsLink).toHaveAttribute('target', '_blank');
    await expect(docsLink).toHaveAttribute('rel', 'noreferrer noopener');
  });
});
