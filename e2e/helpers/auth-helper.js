class AuthHelper {
  constructor(page) {
    this.page = page;
  }

  async signInWithMock() {
    await this.page.goto('/sample');
    await this.page.waitForLoadState('networkidle');
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

    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');

    // Click on WebDAV section to expand
    await this.page.click('a[href="#webdav"]');
    await this.page.waitForSelector('#webdavLogin', { state: 'visible' });

    // Fill in the form
    await this.page.fill('#input-webdav-url', url);
    await this.page.fill('#input-webdav-user', username);
    await this.page.fill('#input-webdav-password', password);

    // Click sign in
    await this.page.click('#webdavLogin button[type="submit"]');

    // Wait for file browser to appear
    await this.page.waitForSelector('[data-testid="file-browser"]', { timeout: 10000 });
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

    // Navigate to base URL first
    await this.page.goto('/');
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
    await this.page.reload();
    await this.page.waitForLoadState('networkidle');

    // Wait for file browser to appear
    await this.page.waitForSelector('[data-testid="file-browser"]', { timeout: 10000 });
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
