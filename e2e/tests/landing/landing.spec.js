import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
  });

  test('should navigate to sample org file', async ({ page }) => {
    const liveDemoLink = page.locator('a[href="/sample"]').first();
    await liveDemoLink.click();
    await page.waitForURL('/sample', { timeout: 10000 });
    expect(page.url()).toContain('/sample');

    // Verify sample.org content is displayed
    await expect(page.locator('text=This is an actual org file')).toBeVisible();
    await expect(page.locator('text=Tap on any header to open it')).toBeVisible();
    await expect(page.locator('text=Actions')).toBeVisible();
  });

  test('should navigate to sign in page', async ({ page }) => {
    // On mobile, the hero section sign-in link is always visible
    // Use page-header-ui-content to target hero section specifically
    const signInLink = page.locator('.page-header-ui-content a[href="/sign_in"]');
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
    const githubLink = page.locator('a[href*="github.com/200ok-ch/organice"]').first();
    await expect(githubLink).toHaveAttribute('target', '_blank');
    await expect(githubLink).toHaveAttribute('rel', 'noreferrer noopener');
  });

  test('should have working external documentation link', async ({ page }) => {
    const docsLink = page.locator('a[href*="organice.200ok.ch/documentation.html"]');
    await expect(docsLink).toHaveAttribute('target', '_blank');
    await expect(docsLink).toHaveAttribute('rel', 'noreferrer noopener');
  });
});
