import { test, expect } from '@playwright/test';
import WebDAVMockHelper from '../../helpers/webdav-mock-helper';

const DEFAULT_CREDENTIALS = {
  url: 'https://example.com/webdav',
  username: 'testuser',
  password: 'testpass',
};

const FILE_SETTINGS = [
  {
    id: 'main-file',
    path: '/a.org',
    defaultOnStartup: true,
    loadOnStartup: false,
  },
  {
    id: 'startup-sync-target',
    path: '/b.org',
    defaultOnStartup: false,
    loadOnStartup: true,
  },
];

const CAPTURE_TEMPLATES = [
  {
    description: 'Inbox to B',
    headerPaths: ['Inbox'],
    iconName: 'inbox',
    id: 'inbox-to-b',
    isAvailableInAllOrgFiles: false,
    letter: '',
    file: '/b.org',
    orgFilesWhereAvailable: ['/a.org'],
    shouldPrepend: false,
    template: '* TODO %?',
  },
];

test.describe('Capture target sync', () => {
  let webdavMock;

  test.beforeEach(async ({ page }) => {
    webdavMock = new WebDAVMockHelper(page);
    await webdavMock.setupMocks();
    webdavMock.addMockFile('/a.org', '* Main\n');
    webdavMock.addMockFile('/b.org', '* Inbox\n');
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

  test('saves capture entries into a startup-synced target file while viewing another file', async ({
    page,
  }) => {
    await page.goto('/');
    await page.evaluate(
      ({ credentials, fileSettings, captureTemplates }) => {
        localStorage.clear();
        sessionStorage.clear();
        localStorage.setItem('authenticatedSyncService', 'WebDAV');
        localStorage.setItem('webdavEndpoint', credentials.url);
        localStorage.setItem('webdavUsername', credentials.username);
        localStorage.setItem('webdavPassword', credentials.password);
        localStorage.setItem('fileSettings', JSON.stringify(fileSettings));
        localStorage.setItem('captureTemplates', JSON.stringify(captureTemplates));
      },
      {
        credentials: DEFAULT_CREDENTIALS,
        fileSettings: FILE_SETTINGS,
        captureTemplates: CAPTURE_TEMPLATES,
      }
    );

    await page.reload({ waitUntil: 'load' });
    await expect(page.locator('.org-file-container')).toBeVisible({ timeout: 20000 });
    await expect(page).toHaveURL(/\/file\/a\.org$/);

    await page.waitForFunction(
      () => localStorage.getItem('files__/b.org')?.includes('* Inbox'),
      null,
      { timeout: 10000 }
    );

    const captureUrl = new URL('/', 'http://localhost:3000');
    captureUrl.searchParams.set('captureTemplateName', 'Inbox to B');
    captureUrl.searchParams.set('captureContent', 'Saved from capture');
    captureUrl.searchParams.set('captureFile', '/a.org');

    await page.goto(`${captureUrl.pathname}${captureUrl.search}`, { waitUntil: 'load' });

    await expect(page.locator('.org-file-container')).toBeVisible({ timeout: 20000 });
    await page.waitForFunction(
      () => localStorage.getItem('files__/b.org')?.includes('Saved from capture'),
      null,
      { timeout: 10000 }
    );

    await expect
      .poll(() => webdavMock.mockFiles.get('/b.org') || '', { timeout: 10000 })
      .toContain('Saved from capture');
    expect(webdavMock.mockFiles.get('/a.org')).not.toContain('Saved from capture');
  });
});
