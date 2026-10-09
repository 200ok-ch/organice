/* global process */

/**
 * Authentication helper for E2E tests.
 *
 * NOTE: This helper does NOT use `waitForLoadState('networkidle')` because
 * it is unreliable in CI environments. Service Workers, background sync requests,
 * and other persistent connections can cause 'networkidle' to timeout indefinitely.
 */
class AuthHelper {
  constructor(page) {
    this.page = page;
  }

  /**
   * Gets the default timeout based on environment.
   * CI environments get longer timeouts to account for resource constraints.
   *
   * @returns {number} Timeout in milliseconds
   * @private
   */
  _getDefaultTimeout() {
    return process.env.CI ? 60000 : 30000;
  }

  async signInWithMock() {
    const { timeout = this._getDefaultTimeout() } = {};

    await this.page.goto('/sample', { waitUntil: 'load', timeout });

    // Wait for org file container to indicate the sample file is loaded
    await this.page.waitForSelector('[data-testid="org-file-container"]', {
      state: 'attached',
      timeout,
    });
  }

  /**
   * Sign in with WebDAV using the UI form
   * @param {Object} credentials - { url, username, password }
   */
  async signInWithWebDAV(credentials = {}) {
    const {
      url = 'https://example.com/webdav',
      username = 'testuser',
      password = 'testpass',
    } = credentials;

    const { timeout = this._getDefaultTimeout() } = {};

    await this.page.goto('/', { waitUntil: 'load', timeout });

    // Wait for page to be ready
    await this.page.waitForSelector('body', { state: 'attached', timeout });

    // Click on WebDAV section to expand
    await this.page.click('a[href="#webdav"]');
    await this.page.waitForSelector('#webdavLogin', { state: 'visible' });

    // Fill in the form
    await this.page.fill('#input-webdav-url', url);
    await this.page.fill('#input-webdav-user', username);
    await this.page.fill('#input-webdav-password', password);

    // Click sign in
    await this.page.click('#webdavLogin button[type="submit"]');

    // Wait for file browser to appear (indicates successful authentication)
    await this.page.waitForSelector(
      '[data-testid="file-browser"], .component-browser-sync__file-list',
      {
        timeout: 10000,
      }
    );
  }

  /**
   * Sign in with WebDAV by setting localStorage directly
   * Faster than UI-based sign in, useful for tests where the sign-in flow itself isn't being tested
   * @param {Object} credentials - { url, username, password }
   */
  async signInWithWebDAVDirect(credentials = {}) {
    const {
      url = 'https://example.com/webdav',
      username = 'testuser',
      password = 'testpass',
    } = credentials;

    const { timeout = this._getDefaultTimeout() } = {};

    // Navigate to base URL first
    await this.page.goto('/', { waitUntil: 'load', timeout });

    await this.page.evaluate(
      ({ url, username, password }) => {
        localStorage.setItem('authenticatedSyncService', 'WebDAV');
        localStorage.setItem('webdavEndpoint', url);
        localStorage.setItem('webdavUsername', username);
        localStorage.setItem('webdavPassword', password);
      },
      { url, username, password }
    );

    // Reload to apply the authentication
    await this.page.reload({ waitUntil: 'load', timeout });

    // Wait for file browser or sync status to appear (indicates successful authentication)
    await this.page.waitForSelector(
      '[data-testid="file-browser"], .component-browser-sync__file-list, .component-browser-sync__status',
      { timeout: 10000 }
    );
  }

  async signOut() {
    const signOutButton = this.page.locator('[data-testid="sign-out-button"]');
    if (await signOutButton.isVisible()) {
      await signOutButton.click();
      await this.page.waitForURL('/');
    }
  }
}

export default AuthHelper;
