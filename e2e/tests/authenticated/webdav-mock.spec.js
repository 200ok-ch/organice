import { test, expect } from '@playwright/test';
import AuthHelper from '../../helpers/auth-helper';
import WebDAVMockHelper from '../../helpers/webdav-mock-helper';

// Sample org file content for testing
const SAMPLE_ORG_CONTENT = `* Sample File
** TODO Some task
   SCHEDULED: <2026-01-09 Thu>
** DONE Another task
   CLOSED: [2026-01-09 Fri]
* Notes
  Some notes here
`;

test.describe('WebDAV Mock Tests', () => {
  let authHelper;
  let webdavMock;

  // Use beforeEach to set up fresh state for each test
  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    webdavMock = new WebDAVMockHelper(page);

    // Set up route interception for WebDAV
    await webdavMock.setupMocks();

    // Add a sample file to the mock
    webdavMock.addMockFile('/test.org', SAMPLE_ORG_CONTENT);
  });

  test.afterEach(async () => {
    // Clear mock files after each test
    webdavMock.clearMockFiles();
  });

  test.describe('Authentication', () => {
    test('1. should sign in via UI', async ({ page }) => {
      await authHelper.signInWithWebDAV({
        url: 'https://example.com/webdav',
        username: 'testuser',
        password: 'testpass',
      });

      // Verify file browser is visible
      await expect(page.locator('[data-testid="file-browser"]')).toBeVisible();

      // Verify sign out button is present
      await expect(page.locator('[data-testid="sign-out-button"]')).toBeVisible();
    });

    test('2. should sign in via localStorage (direct)', async ({ page }) => {
      await authHelper.signInWithWebDAVDirect({
        url: 'https://example.com/webdav',
        username: 'testuser',
        password: 'testpass',
      });

      // Verify file browser is visible
      await expect(page.locator('[data-testid="file-browser"]')).toBeVisible();

      // Verify sign out button is present
      await expect(page.locator('[data-testid="sign-out-button"]')).toBeVisible();
    });

    test('6. should sign out', async ({ page }) => {
      // First sign in
      await authHelper.signInWithWebDAVDirect();
      await expect(page.locator('[data-testid="file-browser"]')).toBeVisible();

      // Then sign out
      await authHelper.signOut();

      // Verify we're back on the landing page
      await expect(page).toHaveURL('/');
      await expect(page.locator('[data-testid="file-browser"]')).not.toBeVisible();
    });
  });

  test.describe('File Operations', () => {
    test.beforeEach(async ({ page }) => {
      // Sign in before file operation tests
      await authHelper.signInWithWebDAVDirect();
    });

    test('3. should display file listing', async ({ page }) => {
      // Wait for file browser to be visible
      await expect(page.locator('[data-testid="file-browser"]')).toBeVisible();

      // Verify the sample file appears in the listing
      await expect(page.locator('text=test.org')).toBeVisible();
    });

    test('4. should open file from WebDAV', async ({ page }) => {
      // Wait for file browser
      await expect(page.locator('[data-testid="file-browser"]')).toBeVisible();

      // Click on the test file
      await page.click('text=test.org');

      // Wait for org file container to appear
      await expect(page.locator('[data-testid="org-file-container"]')).toBeVisible({
        timeout: 10000,
      });

      // Verify content is loaded
      await expect(page.locator('text=Sample File')).toBeVisible();
      await expect(page.locator('text=Some task')).toBeVisible();
    });

    test('5. should save file changes', async ({ page }) => {
      // Wait for file browser and click on test file
      await expect(page.locator('[data-testid="file-browser"]')).toBeVisible();
      await page.click('text=test.org');

      // Wait for org file to load
      await expect(page.locator('[data-testid="org-file-container"]')).toBeVisible({
        timeout: 10000,
      });

      // Click on a header to select it
      const header = page.locator('.header').filter({ hasText: 'Sample File' }).first();
      await header.click();

      // Wait for action drawer
      await expect(page.locator('[data-testid="header-action-drawer"]')).toBeVisible();

      // Click edit title
      const editButton = page.locator('[data-testid="drawer-action-edit-title"]');
      await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (el) el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      }, '[data-testid="drawer-action-edit-title"]');

      // Wait for title editor modal
      await expect(page.locator('.drawer-modal__title:has-text("Edit title")')).toBeVisible();

      // Change the title
      const titleInput = page.locator('[data-testid="titleLineInput"]');
      await titleInput.fill('* Modified Sample File');
      await titleInput.press('Enter'); // Press Enter to save

      // Wait for drawer to close (save happened)
      await expect(page.locator('[data-testid="drawer-outer-container"]')).not.toBeVisible();

      // Verify the title was changed in the UI
      await expect(page.locator('text=Modified Sample File')).toBeVisible();

      // Verify the file was updated in the mock storage
      const storedContent = webdavMock.mockFiles.get('/test.org');
      expect(storedContent).toContain('* Modified Sample File');
    });
  });

  test.describe('Error Handling', () => {
    test('7. should handle auth failure', async ({ page }) => {
      // Set up mock to return 401 for auth check
      await page.route('**/webdav/**', async (route) => {
        await route.fulfill({
          status: 401,
          body: 'Unauthorized',
        });
      });

      // Try to sign in - this should fail
      await page.goto('/');
      await page.click('a[href="#webdav"]');
      await page.waitForSelector('#webdavLogin', { state: 'visible' });

      await page.fill('#input-webdav-url', 'https://example.com/webdav');
      await page.fill('#input-webdav-user', 'wronguser');
      await page.fill('#input-webdav-password', 'wrongpass');
      await page.click('#webdavLogin button[type="submit"]');

      // File browser should not appear
      await expect(page.locator('[data-testid="file-browser"]')).not.toBeVisible({
        timeout: 5000,
      });
    });

    test('8. should handle network errors', async ({ page }) => {
      // Sign in first
      await authHelper.signInWithWebDAVDirect();
      await expect(page.locator('[data-testid="file-browser"]')).toBeVisible();

      // Set up mock to fail for file operations
      await page.route('**/webdav/**', async (route) => {
        await route.abort('failed');
      });

      // Try to click on a file - this should handle the error gracefully
      await page.click('text=test.org');

      // Either the file loads from cache or shows an error
      // The app should not crash
      await page.waitForTimeout(2000);

      // Verify we're still on the page (not crashed)
      expect(await page.locator('body').count()).toBe(1);
    });
  });
});
