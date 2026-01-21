/**
 * Application-level helper for E2E tests.
 *
 * Provides methods to wait for the application to be fully loaded and ready
 * for interaction, reducing timing-related test failures.
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
   * Waits for the organice application to be fully loaded and ready.
   *
   * This method ensures that:
   * - DOM content is loaded
   * - Network requests are idle (no pending requests)
   * - Either org-file-container is visible OR landing page content is visible
   *
   * Use this at the start of tests or after navigation to ensure the app
   * is ready before interacting with elements.
   *
   * @param {Object} options - Optional configuration
   * @param {number} options.timeout - Maximum time to wait in milliseconds (default: 30000)
   * @returns {Promise<void>}
   *
   * @example
   * await appHelper.waitForAppReady();
   * await appHelper.waitForAppReady({ timeout: 60000 });
   */
  async waitForAppReady(options = {}) {
    const { timeout = 30000 } = options;

    // Wait for DOM content to be loaded
    await this.page.waitForLoadState('domcontentloaded', { timeout });

    // Wait for network to be idle (no pending requests)
    await this.page.waitForLoadState('networkidle', { timeout });

    // Wait for either the org file container OR landing page content to be visible
    // This indicates the React app has rendered and is ready
    await this.page.waitForFunction(
      () => {
        const orgContainer = document.querySelector('[data-testid="org-file-container"]');
        const landingContent = document.querySelector('a'); // Landing page has links
        return orgContainer !== null || landingContent !== null;
      },
      { timeout }
    );
  }

  /**
   * Waits for the landing page to be ready.
   *
   * Similar to waitForAppReady but for the landing/login page which doesn't
   * have the org-file-container element.
   *
   * @param {Object} options - Optional configuration
   * @param {number} options.timeout - Maximum time to wait in milliseconds (default: 30000)
   * @returns {Promise<void>}
   */
  async waitForLandingReady(options = {}) {
    const { timeout = 30000 } = options;

    await this.page.waitForLoadState('domcontentloaded', { timeout });
    await this.page.waitForLoadState('networkidle', { timeout });
  }
}

export default AppHelper;
