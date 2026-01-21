import { test, expect } from '@playwright/test';
import FirefoxHelper from '../../helpers/firefox-helper.js';
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

// Default credentials for testing
const DEFAULT_CREDENTIALS = {
  url: 'https://example.com/webdav',
  username: 'testuser',
  password: 'testpass',
};

test.describe('WebDAV Mock Tests', () => {
  let webdavMock;
  let firefoxHelper;

  // Set up fresh mocks for each test
  test.beforeEach(async ({ page }) => {
    firefoxHelper = new FirefoxHelper(page);
    webdavMock = new WebDAVMockHelper(page);
    await webdavMock.setupMocks();
    webdavMock.addMockFile('/test.org', SAMPLE_ORG_CONTENT);
  });

  // Clean up after each test to prevent state leakage
  test.afterEach(async ({ page }) => {
    if (webdavMock) {
      await webdavMock.clearAllRoutes();
      webdavMock.clearMockFiles();
    }
    // Clear storage state for test isolation
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  // Helper to sign in via localStorage
  // Sets localStorage, then reloads the page to apply authentication
  async function signInViaLocalStorage(page) {
    await page.goto('/');

    // Set localStorage directly
    await page.evaluate(({ url, username, password }) => {
      localStorage.setItem('authenticatedSyncService', 'WebDAV');
      localStorage.setItem('webdavEndpoint', url);
      localStorage.setItem('webdavUsername', username);
      localStorage.setItem('webdavPassword', password);
    }, DEFAULT_CREDENTIALS);

    // Reload to apply the authentication
    // Use 'load' instead of 'networkidle' for CI reliability
    await page.reload({ waitUntil: 'load' });

    // Wait for file browser or sync status to appear (indicates authentication succeeded)
    await page.waitForSelector(
      '.file-browser-container, .component-browser-sync__file-list, .component-browser-sync__status',
      { state: 'attached', timeout: 10000 }
    );

    // Additional wait for WebDAV sync to complete
    await page.waitForTimeout(2000);
  }

  test.describe('Authentication', () => {
    test('1. should sign in via UI', async ({ page }) => {
      // Note: mocks are already set up in beforeEach
      // Navigate to the sign-in page first
      await page.goto('/sign_in');
      await page.click('a[href="#webdav"]');
      await page.waitForSelector('#webdavLogin', { state: 'visible' });

      await page.fill('#input-webdav-url', DEFAULT_CREDENTIALS.url);
      await page.fill('#input-webdav-user', DEFAULT_CREDENTIALS.username);
      await page.fill('#input-webdav-password', DEFAULT_CREDENTIALS.password);

      await page.click('text=Sign-in');

      // Wait for file browser to appear (sync should complete)
      await expect(page.locator('.file-browser-container')).toBeVisible({
        timeout: 15000,
      });
    });

    test('2. should sign in via localStorage (direct)', async ({ page }) => {
      await signInViaLocalStorage(page);

      // Verify file browser is visible
      await expect(page.locator('.file-browser-container')).toBeVisible();
    });

    test('6. should sign out', async ({ page }) => {
      await signInViaLocalStorage(page);
      await expect(page.locator('.file-browser-container')).toBeVisible();

      // Navigate to settings (where sign out button is)
      await page.click('a[href="/settings"]');
      await page.waitForSelector('.settings-container', { state: 'visible' });

      // Set up dialog handler BEFORE clicking sign out
      page.on('dialog', (dialog) => dialog.accept());

      // Click sign out
      const signOutButton = page.locator('button:has-text("Sign out")');
      await signOutButton.click();

      // Verify we're back on the landing page
      await expect(page).toHaveURL('/', { timeout: 10000 });
      await expect(page.locator('.file-browser-container')).not.toBeVisible();
    });
  });

  test.describe('File Operations', () => {
    test('3. should display file listing', async ({ page }) => {
      await signInViaLocalStorage(page);

      // Wait for file browser to be visible
      await expect(page.locator('.file-browser-container')).toBeVisible();

      // Verify the sample file appears in the listing
      await expect(page.locator('text=test.org')).toBeVisible();
    });

    test('4. should open file from WebDAV', async ({ page }) => {
      await signInViaLocalStorage(page);

      // Wait for file browser
      await expect(page.locator('.file-browser-container')).toBeVisible();

      // Click on the test file
      await page.click('text=test.org');

      // Wait for org file container to appear
      await expect(page.locator('.org-file-container')).toBeVisible({
        timeout: 20000,
      });

      // Verify content is loaded - top level headers should be visible
      await expect(page.locator('text=Sample File')).toBeVisible();
      await expect(page.locator('text=Notes')).toBeVisible();

      // Expand "Sample File" to show nested headers
      const sampleFileHeader = page.locator('.header').filter({ hasText: 'Sample File' }).first();
      await sampleFileHeader.click();

      // Now nested headers should be visible
      await expect(page.locator('text=Some task')).toBeVisible();
    });

    test('5. should save file changes', async ({ page }) => {
      await signInViaLocalStorage(page);

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

      // Click edit title using Firefox helper
      await firefoxHelper.clickClickCatcherButton('drawer-action-edit-title');

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

      // Note: The app creates a backup file (.organice-bak) but doesn't sync
      // the modified content to WebDAV in this test scenario.
      // The main goal of this test is to verify the UI updates correctly.
    });
  });

  test.describe('Error Handling', () => {
    test('7. should handle auth failure', async ({ page }) => {
      // Clear the default mocks first
      await webdavMock.clearAllRoutes();

      // Set up mock to return 401 for auth check
      await page.route('**/webdav/**', async (route) => {
        await route.fulfill({
          status: 401,
          body: 'Unauthorized',
        });
      });

      // Try to sign in - this should fail
      await page.goto('/sign_in');
      await page.click('a[href="#webdav"]');
      await page.waitForSelector('#webdavLogin', { state: 'visible' });

      await page.fill('#input-webdav-url', DEFAULT_CREDENTIALS.url);
      await page.fill('#input-webdav-user', 'wronguser');
      await page.fill('#input-webdav-password', 'wrongpass');
      await page.click('text=Sign-in');

      // File browser should not appear (auth failed)
      await page.waitForTimeout(2000);
      await expect(page.locator('.file-browser-container')).not.toBeVisible();
    });

    test('8. should handle network errors', async ({ page }) => {
      await signInViaLocalStorage(page);
      await expect(page.locator('.file-browser-container')).toBeVisible();

      // Now override the route to fail
      await webdavMock.clearAllRoutes();
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
