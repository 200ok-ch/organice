/* global process */

/**
 * General-purpose E2E test helper.
 *
 * NOTE: This helper does NOT use `waitForLoadState('networkidle')` because
 * it is unreliable in CI environments. Service Workers, background sync requests,
 * and other persistent connections can cause 'networkidle' to timeout indefinitely.
 */
class E2ETestHelper {
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

  /**
   * Navigates to a route and waits for the page to be ready.
   *
   * @param {string} route - The route to navigate to
   * @param {Object} options - Optional configuration
   * @param {number} options.timeout - Maximum time to wait in milliseconds (default: environment-aware)
   * @returns {Promise<void>}
   */
  async navigateTo(route, options = {}) {
    const { timeout = this._getDefaultTimeout() } = options;

    await this.page.goto(route, { waitUntil: 'load', timeout });

    // Wait for basic DOM elements to indicate page is ready
    // This is more reliable than networkidle which can hang indefinitely
    await this.page.waitForSelector('body', { state: 'attached', timeout });
  }

  async isElementVisible(selector) {
    return await this.page.isVisible(selector);
  }

  async getText(selector) {
    return await this.page.textContent(selector);
  }

  async clickElement(selector) {
    await this.page.waitForSelector(selector);
    await this.page.click(selector);
  }

  async fillInput(selector, text) {
    await this.page.waitForSelector(selector);
    await this.page.fill(selector, text);
  }

  async waitForModal(modalSelector) {
    await this.page.waitForSelector(modalSelector, { state: 'visible' });
  }

  async closeModal(closeButtonSelector) {
    await this.page.click(closeButtonSelector);
    await this.page.waitForSelector(closeButtonSelector, { state: 'hidden' });
  }

  async captureScreenshot(testName) {
    await this.page.screenshot({
      path: `e2e/screenshots/${testName}.png`,
      fullPage: true,
    });
  }

  /**
   * Waits for the org file container to be loaded and visible.
   * This is more robust than just checking for attached state.
   *
   * @param {Object} options - Optional configuration
   * @param {number} options.timeout - Maximum time to wait in milliseconds (default: environment-aware)
   * @returns {Promise<void>}
   */
  async waitForOrgFileLoad(options = {}) {
    const { timeout = this._getDefaultTimeout() } = options;

    await this.page.waitForSelector('[data-testid="org-file-container"]', {
      state: 'visible',
      timeout,
    });
  }

  /**
   * Waits for any of the provided selectors to match an element.
   * This is useful when multiple different elements can indicate the app is ready.
   *
   * @param {string[]} selectors - Array of CSS selectors to check
   * @param {Object} options - Optional configuration
   * @param {number} options.timeout - Maximum time to wait in milliseconds (default: environment-aware)
   * @returns {Promise<void>}
   */
  async waitForAnySelector(selectors, options = {}) {
    const { timeout = this._getDefaultTimeout() } = options;

    // Wait for at least one of the selectors to be attached
    await this.page.waitForFunction(
      (selectorList) => {
        return selectorList.some((selector) => document.querySelector(selector) !== null);
      },
      selectors,
      { timeout }
    );
  }

  /**
   * Resets the application state to ensure test isolation.
   *
   * Clears localStorage and sessionStorage, then navigates to the root path.
   * Use this in beforeEach hooks to ensure each test starts with a clean state.
   *
   * @returns {Promise<void>}
   */
  async resetAppState() {
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await this.page.goto('/', { waitUntil: 'load' });
  }
}

export default E2ETestHelper;
