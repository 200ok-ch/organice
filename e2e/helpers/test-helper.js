class E2ETestHelper {
  constructor(page) {
    this.page = page;
  }

  async navigateTo(route) {
    await this.page.goto(route);
    await this.page.waitForLoadState('networkidle');
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
      fullPage: true
    });
  }

  async waitForOrgFileLoad() {
    await this.page.waitForSelector('[data-testid="org-file-container"]', {
      timeout: 10000
    });
  }
}

export default E2ETestHelper;
