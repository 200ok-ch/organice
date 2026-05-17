import { test, expect } from '@playwright/test';
import WebDAVMockHelper from '../../helpers/webdav-mock-helper';

const DEFAULT_CREDENTIALS = {
  url: 'https://example.com/webdav',
  username: 'testuser',
  password: 'testpass',
};

const MAIN_FILE_SETTING = {
  id: 'main-file',
  path: '/a.org',
  defaultOnStartup: true,
  loadOnStartup: false,
  includeInAgenda: false,
  includeInSearch: false,
  includeInRefile: false,
  includeInTasklist: false,
};

test.describe('Capture template startup sync', () => {
  let webdavMock;

  test.beforeEach(async ({ page }) => {
    webdavMock = new WebDAVMockHelper(page);
    await webdavMock.setupMocks();
    webdavMock.addMockFile('/a.org', '* Main\n');
    webdavMock.addMockFile('/C.org', '* Capture Target\n');
  });

  test.afterEach(async ({ page }) => {
    if (webdavMock) {
      await webdavMock.clearAllRoutes();
      webdavMock.clearMockFiles();
    }
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('marks a capture template target file to sync on startup', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(
      ({ credentials, mainFileSetting }) => {
        const lastSyncAt = new Date().toISOString();

        localStorage.clear();
        sessionStorage.clear();
        localStorage.setItem('authenticatedSyncService', 'WebDAV');
        localStorage.setItem('webdavEndpoint', credentials.url);
        localStorage.setItem('webdavUsername', credentials.username);
        localStorage.setItem('webdavPassword', credentials.password);
        localStorage.setItem('fileSettings', JSON.stringify([mainFileSetting]));
        localStorage.setItem(
          'persistedFiles',
          JSON.stringify({ '/a.org': lastSyncAt, '/C.org': lastSyncAt })
        );
        localStorage.setItem('files__/a.org', '* Main\n');
        localStorage.setItem('files__/C.org', '* Capture Target\n');
      },
      { credentials: DEFAULT_CREDENTIALS, mainFileSetting: MAIN_FILE_SETTING }
    );

    await page.reload({ waitUntil: 'load' });
    await expect(page.locator('.org-file-container')).toBeVisible({ timeout: 20000 });
    await expect(page).toHaveURL(/\/file\/a\.org$/);

    await page.goto('/settings');
    await page.getByRole('button', { name: 'Capture templates' }).click();
    await page.locator('.new-capture-template-button-container button').click();
    await page.locator('.capture-template__field select').selectOption('/C.org');

    await expect
      .poll(() =>
        page.evaluate(() => {
          const fileSettings = JSON.parse(localStorage.getItem('fileSettings') || '[]');
          return fileSettings.find((setting) => setting.path === '/C.org')?.loadOnStartup;
        })
      )
      .toBe(true);
  });
});
