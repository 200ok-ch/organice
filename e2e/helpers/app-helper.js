/* global process */

/**
 * Application-level helper for E2E tests.
 *
 * Provides methods to wait for the application to be fully loaded and ready
 * for interaction, reducing timing-related test failures.
 *
 * IMPORTANT: This helper does NOT use `waitForLoadState('networkidle')` because
 * it is unreliable in CI environments. Service Workers, background sync requests,
 * and other persistent connections can cause 'networkidle' to timeout indefinitely.
 * Instead, we use DOM-based detection with `waitForLoadState('load')` which is
 * more reliable across different environments.
 */
class AppHelper {
  /**
   * Creates a new AppHelper instance.
   *
   * @param {import('@playwright/test').Page} page - The Playwright page object
   */
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
    // Use longer timeout in CI (60s) vs local (30s) due to container resource constraints
    return process.env.CI ? 60000 : 30000;
  }

  /**
   * Waits for the organice application to be fully loaded and ready.
   *
   * This method ensures that:
   * - DOM load state is reached (not networkidle - more reliable)
   * - Either org-file-container is visible OR landing page content is visible
   *
   * Use this at the start of tests or after navigation to ensure the app
   * is ready before interacting with elements.
   *
   * @param {Object} options - Optional configuration
   * @param {number} options.timeout - Maximum time to wait in milliseconds (default: environment-aware)
   * @returns {Promise<void>}
   *
   * @example
   * await appHelper.waitForAppReady();
   * await appHelper.waitForAppReady({ timeout: 60000 });
   */
  async waitForAppReady(options = {}) {
    const { timeout = this._getDefaultTimeout() } = options;

    // Wait for page load (not networkidle - more reliable in CI)
    await this.page.waitForLoadState('load', { timeout });

    // Wait for either the org file container OR landing page content to be visible
    // This indicates the React app has rendered and is ready
    await this.page.waitForSelector('[data-testid="org-file-container"], a[href^="/"]', {
      state: 'attached',
      timeout,
    });
  }

  /**
   * Waits for an org file to be loaded and ready for interaction.
   * This is more specific than waitForAppReady() for org file tests.
   *
   * @param {Object} options - Optional configuration
   * @param {number} options.timeout - Maximum time to wait in milliseconds (default: environment-aware)
   * @returns {Promise<void>}
   */
  async waitForOrgFileReady(options = {}) {
    const { timeout = this._getDefaultTimeout() } = options;

    await this.page.waitForLoadState('load', { timeout });

    // Wait for the org file container to be present and visible
    await this.page.waitForSelector('[data-testid="org-file-container"]', {
      state: 'visible',
      timeout,
    });
  }

  /**
   * Waits for the authenticated state to be ready.
   * Use this for tests that require authentication (WebDAV, Dropbox, GitLab).
   *
   * @param {Object} options - Optional configuration
   * @param {number} options.timeout - Maximum time to wait in milliseconds (default: environment-aware)
   * @returns {Promise<void>}
   */
  async waitForAuthenticatedReady(options = {}) {
    const { timeout = this._getDefaultTimeout() } = options;

    await this.page.waitForLoadState('load', { timeout });

    // Wait for sync status or file list to indicate successful authentication
    await this.page.waitForSelector(
      '[data-testid="sync-status"], [data-testid="file-list"], .component-browser-sync__status',
      { state: 'attached', timeout }
    );
  }

  /**
   * Waits for the landing page to be ready.
   *
   * Similar to waitForAppReady but for the landing/login page which doesn't
   * have the org-file-container element.
   *
   * @param {Object} options - Optional configuration
   * @param {number} options.timeout - Maximum time to wait in milliseconds (default: environment-aware)
   * @returns {Promise<void>}
   */
  async waitForLandingReady(options = {}) {
    const { timeout = this._getDefaultTimeout() } = options;

    await this.page.waitForLoadState('load', { timeout });

    // Wait for landing page links or file list to be present
    await this.page.waitForSelector('a[href^="/"], .component-browser-sync__file-list', {
      state: 'attached',
      timeout,
    });
  }
}

export default AppHelper;
