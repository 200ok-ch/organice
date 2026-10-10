import { test as base, expect } from '@playwright/test';
import AppHelper from './helpers/app-helper.js';
import FirefoxHelper from './helpers/firefox-helper.js';

/**
 * Page object for the /sample route (sample.org).
 *
 * Wraps the interactions most specs repeat: finding a header, selecting it,
 * using the header action drawer, and closing the drawer again.
 */
class SampleFile {
  constructor(page) {
    this.page = page;
    this.firefoxHelper = new FirefoxHelper(page);
    this.actionDrawer = page.getByTestId('header-action-drawer');
    this.drawer = page.getByTestId('drawer-outer-container');
  }

  async open() {
    await this.page.goto('/sample', { waitUntil: 'domcontentloaded' });
    await new AppHelper(this.page).waitForAppReady();
  }

  // First header whose title contains `text`. Strings match case-insensitive
  // substrings ('Moving headers' matches 'Adding and removing headers'); pass
  // a RegExp such as /^Moving headers/ to be exact.
  header(text) {
    return this.page
      .locator('.header')
      .filter({ has: this.page.locator('.title-line-text', { hasText: text }) })
      .first();
  }

  // Title of every rendered header in document order, without the TODO
  // keyword, tags or the '...' marking collapsed content.
  titles() {
    return this.page
      .locator('.header .title-line-text')
      .evaluateAll((titles) => titles.map((title) => title.textContent.replace(/\.\.\.$/, '')));
  }

  // Nesting level of a header as rendered (Header indents 20px per level).
  async level(text) {
    const padding = await this.header(text).evaluate((header) => header.style.paddingLeft);
    return parseFloat(padding) / 20;
  }

  // Selects a header, which opens it and shows the header action drawer.
  // Clicks the title: the middle of an opened header may be its description.
  async select(text) {
    const header = this.header(text);
    await header.locator('.title-line-text').click();
    await expect(this.actionDrawer).toBeVisible();
    return header;
  }

  // Deselects the current header by tapping the title in the headerbar.
  async deselect() {
    await this.page.locator('.header-bar__title').click();
    await expect(this.actionDrawer).toHaveCount(0);
  }

  // Opens the given headers one after another, e.g. expand('Actions', 'Tags').
  async expand(...texts) {
    for (const text of texts) {
      await this.select(text);
      await this.deselect();
    }
  }

  // Waits until an open drawer has finished sliding in. Clicks into a drawer
  // that is still moving can miss their target.
  async settle() {
    await this.page.waitForFunction(() => {
      const drawer = document.querySelector('[data-testid="drawer"]');
      return !drawer || drawer.style.transform === 'translateY(0px)';
    });
  }

  // Clicks an icon in the header action drawer or the drawer action bar.
  async action(testId) {
    await this.firefoxHelper.clickClickCatcherButton(testId);
    await this.settle();
  }

  // Clicks a header action drawer icon that has no data-testid, by its title.
  async actionByTitle(title) {
    await this.page
      .locator(`.header-action-drawer__ff-click-catcher-container[title^="${title}"]`)
      .dispatchEvent('click');
    await this.settle();
  }

  // Closes an editor drawer. Switching to the title editor first commits the
  // edits of the tags, properties and timestamp editors.
  async closeDrawer({ commit = true } = {}) {
    if (commit) {
      await this.action('drawer-action-edit-title');
    }
    // Click the backdrop's corner: a tall drawer covers its middle
    await this.drawer.first().click({ position: { x: 5, y: 5 } });
    await expect(this.drawer).toHaveCount(0);
  }

  async openSearch(tab = 'Search') {
    await this.page.getByTitle('Show Search / Task List').click();
    await this.settle();
    await this.page.locator('.tab-buttons__btn', { hasText: tab }).first().click();
    return this.page.getByTestId('drawer');
  }
}

// Every test using this `test` starts on a freshly loaded /sample.
export const test = base.extend({
  sample: [
    async ({ page }, use) => {
      const sample = new SampleFile(page);
      await sample.open();
      await use(sample);
    },
    { auto: true },
  ],
});

export { expect };
