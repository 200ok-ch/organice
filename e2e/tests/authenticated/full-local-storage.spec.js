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
    id: 'startup-file',
    path: '/b.org',
    defaultOnStartup: false,
    loadOnStartup: true,
  },
];

const LONG_AGO = '2020-01-01T00:00:00.000Z';

// Sets up a signed-in session with local copies in the old localStorage
// format, as left behind by organice before local copies moved to
// IndexedDB. Then reloads, so the app starts from that state.
const startWithLegacyLocalCopies = async (page, { legacyFiles, fillLocalStorage = false }) => {
  await page.goto('/');
  await page.evaluate(
    ({ credentials, fileSettings, legacyFiles, fillLocalStorage }) => {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem('authenticatedSyncService', 'WebDAV');
      localStorage.setItem('webdavEndpoint', credentials.url);
      localStorage.setItem('webdavUsername', credentials.username);
      localStorage.setItem('webdavPassword', credentials.password);
      localStorage.setItem('fileSettings', JSON.stringify(fileSettings));

      const persistedFiles = {};
      const isDirty = {};
      legacyFiles.forEach(({ path, contents, lastSyncAt, dirty }) => {
        localStorage.setItem('files__' + path, contents);
        persistedFiles[path] = lastSyncAt;
        isDirty[path] = dirty;
      });
      localStorage.setItem('persistedFiles', JSON.stringify(persistedFiles));
      localStorage.setItem('isDirty', JSON.stringify(isDirty));

      if (fillLocalStorage) {
        // Fill localStorage up to its quota, minus a little headroom.
        const chunk = 'x'.repeat(100000);
        try {
          for (let i = 0; ; i++) localStorage.setItem(`padding_${i}`, chunk);
        } catch (e) {
          // Quota reached.
        }
        let low = 0;
        let high = chunk.length;
        while (low < high) {
          const middle = Math.ceil((low + high) / 2);
          try {
            localStorage.setItem('padding_tail', 'x'.repeat(middle));
            low = middle;
          } catch (e) {
            high = middle - 1;
          }
        }
        localStorage.setItem('padding_tail', 'x'.repeat(Math.max(0, low - 2000)));
      }
    },
    { credentials: DEFAULT_CREDENTIALS, fileSettings: FILE_SETTINGS, legacyFiles, fillLocalStorage }
  );
  await page.reload({ waitUntil: 'load' });
};

const readLocalCopy = (page, path) =>
  page.evaluate(
    (path) =>
      new Promise((resolve, reject) => {
        const request = indexedDB.open('organice');
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const database = request.result;
          const get = database.transaction('files', 'readonly').objectStore('files').get(path);
          get.onsuccess = () => {
            database.close();
            resolve(get.result || null);
          };
          get.onerror = () => reject(get.error);
        };
      }),
    path
  );

test.describe('Local copies of files', () => {
  let webdavMock;

  test.beforeEach(async ({ page }) => {
    webdavMock = new WebDAVMockHelper(page);
    await webdavMock.setupMocks();
    webdavMock.addMockFile('/a.org', '* Main\n');
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

  test('a grown startup file is stored although localStorage is full', async ({ page }) => {
    // The startup file has grown on the server since it was cached.
    webdavMock.addMockFile('/b.org', '* Inbox\n' + 'Grown content\n'.repeat(2000));

    await startWithLegacyLocalCopies(page, {
      fillLocalStorage: true,
      legacyFiles: [
        { path: '/a.org', contents: '* Main\n', lastSyncAt: LONG_AGO, dirty: false },
        { path: '/b.org', contents: '* Inbox\n', lastSyncAt: LONG_AGO, dirty: false },
      ],
    });

    await expect(page).toHaveURL(/\/file\/a\.org$/);
    await expect(page.locator('.org-file-container')).toContainText('Main');
    await expect
      .poll(async () => ((await readLocalCopy(page, '/b.org')) || {}).contents || '', {
        timeout: 10000,
      })
      .toContain('Grown content');
    await expect(page.locator('.error-message-container')).toHaveCount(0);
    expect(await page.evaluate(() => localStorage.getItem('files__/b.org'))).toBeNull();
  });

  test('unsynced edits survive the migration and are pushed', async ({ page }) => {
    webdavMock.addMockFile('/b.org', '* Inbox\n');

    await startWithLegacyLocalCopies(page, {
      legacyFiles: [
        { path: '/a.org', contents: '* Main\n', lastSyncAt: LONG_AGO, dirty: false },
        {
          path: '/b.org',
          contents: '* Inbox\n** Edited offline\n',
          // Synced after the server's last change: the edits get pushed.
          lastSyncAt: '2099-01-01T00:00:00.000Z',
          dirty: true,
        },
      ],
    });

    await expect(page.locator('.org-file-container')).toContainText('Main');
    await expect
      .poll(() => webdavMock.mockFiles.get('/b.org') || '', { timeout: 10000 })
      .toContain('Edited offline');
    expect(await page.evaluate(() => localStorage.getItem('files__/b.org'))).toBeNull();
    expect(await readLocalCopy(page, '/b.org')).toMatchObject({
      contents: expect.stringContaining('Edited offline'),
    });
  });

  test('a failing background file does not replace the open file with an error', async ({
    page,
  }) => {
    // No '/b.org' on the server: its startup sync fails.
    await startWithLegacyLocalCopies(page, {
      legacyFiles: [
        { path: '/a.org', contents: '* Main\n', lastSyncAt: LONG_AGO, dirty: false },
        { path: '/b.org', contents: '* Inbox\n', lastSyncAt: LONG_AGO, dirty: false },
      ],
    });

    await expect(page.locator('.org-file-container')).toContainText('Main');
    await expect(page.getByText('File /b.org not found')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.error-message-container')).toHaveCount(0);
  });

  test('a failed sync keeps the local copy of the open file visible', async ({ page }) => {
    webdavMock.addMockFile('/b.org', '* Inbox\n');
    // No network for the open file, e.g. in airplane mode while the
    // browser still reports being online. Registered after the mock, so
    // it takes precedence.
    await page.route(/example\.com\/webdav\/a\.org/, (route) =>
      route.abort('internetdisconnected')
    );

    const syncFailed = page.waitForEvent('console', (message) =>
      message.text().startsWith('Syncing /a.org failed')
    );
    await startWithLegacyLocalCopies(page, {
      legacyFiles: [
        { path: '/a.org', contents: '* Main\n', lastSyncAt: LONG_AGO, dirty: false },
        { path: '/b.org', contents: '* Inbox\n', lastSyncAt: LONG_AGO, dirty: false },
      ],
    });
    await syncFailed;

    await expect(page.locator('.org-file-container')).toContainText('Main');
    await expect(page.locator('.error-message-container')).toHaveCount(0);
  });
});
