import { test, expect } from '@playwright/test';
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

// Helper to sign in with WebDAV by setting localStorage before page load
async function signInWithWebDAVMock(page, webdavMock) {
  const credentials = {
    url: 'https://example.com/webdav',
    username: 'testuser',
    password: 'testpass',
  };

  // Set up route interception
  await webdavMock.setupMocks();

  // Add test files to the mock
  webdavMock.addMockFile('/test.org', SAMPLE_ORG_CONTENT);

  // Set localStorage via addInitScript (runs before page loads)
  await page.context().addInitScript(({ url, username, password }) => {
    localStorage.setItem('authenticatedSyncService', 'WebDAV');
    localStorage.setItem('webdavEndpoint', url);
    localStorage.setItem('webdavUsername', username);
    localStorage.setItem('webdavPassword', password);
  }, credentials);

  // Navigate to the app - localStorage will already be set
  await page.goto('/');

  // Wait for page to load
  await page.waitForLoadState('networkidle');

  // The app should auto-connect with our mocks
  // Wait a bit for the sync to happen
  await page.waitForTimeout(2000);
}

test.describe('WebDAV Mock Tests', () => {
  let webdavMock;

  test.beforeEach(async ({ page }) => {
    webdavMock = new WebDAVMockHelper(page);
  });

  test.afterEach(async () => {
    // Clear mock files after each test
    if (webdavMock) {
      webdavMock.clearMockFiles();
    }
  });

  test.describe('Authentication', () => {
    test('1. should sign in via UI', async ({ page }) => {
      // Set up mocks BEFORE navigating
      await webdavMock.setupMocks();
      webdavMock.addMockFile('/test.org', SAMPLE_ORG_CONTENT);

      // Navigate to landing page
      await page.goto('/');

      // Click on WebDAV section to expand
      await page.click('a[href="#webdav"]');
      await page.waitForSelector('#webdavLogin', { state: 'visible' });

      // Fill in the form
      await page.fill('#input-webdav-url', 'https://example.com/webdav');
      await page.fill('#input-webdav-user', 'testuser');
      await page.fill('#input-webdav-password', 'testpass');

      // Click sign in
      await page.click('#webdavLogin button[type="submit"]');

      // Wait for file browser to appear (sync should complete)
      await expect(page.locator('.file-browser-container')).toBeVisible({
        timeout: 15000,
      });
    });

    test('2. should sign in via localStorage (direct)', async ({ page }) => {
      await signInWithWebDAVMock(page, webdavMock);

      // Verify file browser is visible
      await expect(page.locator('.file-browser-container')).toBeVisible();
    });

    test('6. should sign out', async ({ page }) => {
      // First sign in
      await signInWithWebDAVMock(page, webdavMock);
      await expect(page.locator('.file-browser-container')).toBeVisible();

      // Navigate to settings (where sign out button is)
      await page.click('a[href="/settings"]');
      await page.waitForSelector('.settings-container', { state: 'visible' });

      // Click sign out
      const signOutButton = page.locator('button:has-text("Sign out")');
      await signOutButton.click();

      // Confirm the dialog
      await page.on('dialog', (dialog) => dialog.accept());

      // Verify we're back on the landing page
      await expect(page).toHaveURL('/');
      await expect(page.locator('.file-browser-container')).not.toBeVisible();
    });
  });

  test.describe('File Operations', () => {
    test.beforeEach(async ({ page }) => {
      // Sign in before file operation tests
      await signInWithWebDAVMock(page, webdavMock);
    });

    test('3. should display file listing', async ({ page }) => {
      // Wait for file browser to be visible
      await expect(page.locator('.file-browser-container')).toBeVisible();

      // Verify the sample file appears in the listing
      await expect(page.locator('text=test.org')).toBeVisible();
    });

    test('4. should open file from WebDAV', async ({ page }) => {
      // Wait for file browser
      await expect(page.locator('.file-browser-container')).toBeVisible();

      // Click on the test file
      await page.click('text=test.org');

      // Wait for org file container to appear
      await expect(page.locator('.org-file-container')).toBeVisible({
        timeout: 10000,
      });

      // Verify content is loaded
      await expect(page.locator('text=Sample File')).toBeVisible();
      await expect(page.locator('text=Some task')).toBeVisible();
    });

    test('5. should save file changes', async ({ page }) => {
      // Wait for file browser and click on test file
      await expect(page.locator('.file-browser-container')).toBeVisible();
      await page.click('text=test.org');

      // Wait for org file to load
      await expect(page.locator('.org-file-container')).toBeVisible({
        timeout: 10000,
      });

      // Click on a header to select it
      const header = page.locator('.header').filter({ hasText: 'Sample File' }).first();
      await header.click();

      // Wait for action drawer
      await expect(page.locator('[data-testid="header-action-drawer"]')).toBeVisible();

      // Click edit title
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

      // File browser should not appear (auth failed)
      await page.waitForTimeout(2000);
      await expect(page.locator('.file-browser-container')).not.toBeVisible();
    });

    test('8. should handle network errors', async ({ page }) => {
      // Sign in first with working mocks
      await signInWithWebDAVMock(page, webdavMock);
      await expect(page.locator('.file-browser-container')).toBeVisible();

      // Now override the route to fail
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
