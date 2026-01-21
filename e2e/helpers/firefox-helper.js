/**
 * Firefox-specific helper for E2E tests.
 *
 * Provides methods to interact with Firefox-specific click-catcher wrapper
 * elements that don't respond to standard Playwright clicks.
 *
 * The organice app uses a special click-catcher pattern for Firefox:
 * <div class="header-action-drawer__ff-click-catcher-container" onClick={...}>
 *   <div class="header-action-drawer__ff-click-catcher" />
 *   <i className="fas fa-icon" data-testid="drawer-action-xyz" />
 * </div>
 *
 * Playwright cannot click the wrapper div because it reports as "not visible"
 * or "outside viewport". This helper dispatches click events directly.
 */
class FirefoxHelper {
  /**
   * Creates a new FirefoxHelper instance.
   *
   * @param {import('@playwright/test').Page} page - The Playwright page object
   */
  constructor(page) {
    this.page = page;
  }

  /**
   * Clicks on a click-catcher wrapper element by its inner data-testid.
   *
   * This method dispatches a click event directly via page.evaluate() to work
   * around Firefox click-catcher elements that don't respond to standard clicks.
   *
   * @param {string} dataTestId - The data-testid attribute of the inner icon element
   * @param {Object} options - Optional configuration
   * @param {number} options.timeout - Maximum time to wait in milliseconds (default: 5000)
   * @param {number} options.retry - Number of retry attempts (default: 3)
   * @returns {Promise<boolean>} True if click succeeded, false otherwise
   * @throws {Error} If the element cannot be clicked after all retries
   *
   * @example
   * await firefoxHelper.clickClickCatcherButton('drawer-action-tags');
   * await firefoxHelper.clickClickCatcherButton('drawer-action-edit-title', { retry: 5 });
   */
  async clickClickCatcherButton(dataTestId, options = {}) {
    const { timeout = 5000, retry = 3 } = options;

    const selector = `.header-action-drawer__ff-click-catcher-container:has([data-testid="${dataTestId}"])`;

    // First, ensure the element exists
    await this.page.waitForSelector(selector, { state: 'attached', timeout });

    for (let i = 0; i < retry; i++) {
      const clicked = await this.page.evaluate((testId) => {
        const element = document.querySelector(`[data-testid="${testId}"]`);
        if (element) {
          element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
          return true;
        }
        return false;
      }, dataTestId);

      if (clicked) {
        return true;
      }

      // Wait a bit before retrying
      await this.page.waitForTimeout(100);
    }

    throw new Error(
      `Failed to click element with data-testid="${dataTestId}" after ${retry} attempts`
    );
  }

  /**
   * Checks if a click-catcher element is visible and ready for interaction.
   *
   * @param {string} dataTestId - The data-testid attribute of the inner icon element
   * @returns {Promise<boolean>} True if the element is visible and ready
   */
  async isClickCatcherReady(dataTestId) {
    const selector = `.header-action-drawer__ff-click-catcher-container:has([data-testid="${dataTestId}"])`;
    return await this.page.isVisible(selector);
  }
}

export default FirefoxHelper;
