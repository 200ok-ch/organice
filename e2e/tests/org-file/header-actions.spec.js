/* eslint jest/expect-expect: ["warn", { "assertFunctionNames": ["expect", "expectSharedSubtree"] }] */

import { test, expect } from '../../fixtures.js';

// sample.org, "Editing headers" and "All icons in the header action bar".
test.describe('Header actions', () => {
  test('tapping the headerbar title deselects the header', async ({ sample }) => {
    await sample.select('Tables');
    await expect(sample.actionDrawer).toBeVisible();

    await sample.deselect();
    await expect(sample.actionDrawer).toHaveCount(0);
  });

  test('long-pressing plus duplicates the header and its subtree', async ({ page, sample }) => {
    await sample.expand('Actions', /^Moving headers/, 'A few of my favorite things');
    await sample.select('Text editors');
    const count = async (title) => (await sample.titles()).filter((t) => t === title).length;
    await expect.poll(() => count('Text editors')).toBe(1);
    await expect.poll(() => count('Emacs')).toBe(1);

    const plus = page.getByTestId('header-action-plus');
    // Keep the icon clear of the sticky header bar
    await plus.evaluate((icon) => icon.scrollIntoView({ block: 'center' }));
    // hover() waits until the icon stops moving: if it moved away from under
    // the pointer, mouseleave would cancel the long-press
    // The click catcher overlays the icon, so hover that
    await page
      .locator('.header-action-drawer__ff-click-catcher-container', { has: plus })
      .locator('.header-action-drawer__ff-click-catcher')
      .hover();
    await page.mouse.down();
    // The header is duplicated after 600ms while the icon is still held
    await expect.poll(() => count('Text editors')).toBe(2);
    await page.mouse.up();

    // The copy follows the original subtree; a long-press adds no empty header
    const titles = await sample.titles();
    const original = titles.indexOf('Text editors');
    expect(titles.slice(original, original + 3)).toEqual(['Text editors', 'Emacs', 'Text editors']);
    await expect(page.getByTestId('titleLineInput')).toHaveCount(0);
  });

  test('add a note adds a time-stamped note to the header', async ({ page, sample }) => {
    const header = await sample.select('Tables');
    await sample.actionByTitle('Add a note');
    await expect(page.locator('.drawer-modal__title', { hasText: 'Add note' })).toBeVisible();

    const note = page.getByTestId('titleLineInput');
    await note.fill('Remember the dogs');
    await expect(note).toHaveValue('Remember the dogs');
    await page.getByRole('button', { name: 'Add' }).click();
    // The editor clears the textarea once the note is added
    await expect(note).toHaveValue('');
    await sample.closeDrawer({ commit: false });

    await expect(header).toContainText(
      /Note taken on \[\d{4}-\d{2}-\d{2} \w{3} \d{2}:\d{2}\] \\\\\s*Remember the dogs/
    );
  });

  test.describe('sharing', () => {
    const shareTodoHeader = async (sample) => {
      await sample.expand('Actions', 'Todos');
      await sample.select('Learn how to use TODOs in organice');
      await sample.action('share');
    };

    const expectSharedSubtree = (title, text) => {
      expect(title).toBe('TODO Learn how to use TODOs in organice');
      expect(text).toMatch(/^\*+ TODO Learn how to use TODOs in organice$/m);
      expect(text).toContain('swipe right on it until the background turns green');
      expect(text).toMatch(/^\*+ There's also a setting/m);
    };

    test('uses the Web Share API when the browser supports it', async ({ page, sample }) => {
      await page.evaluate(() => {
        Object.defineProperty(navigator, 'share', {
          configurable: true,
          value: (data) => {
            window.sharedData = data;
            return Promise.resolve();
          },
        });
      });

      await shareTodoHeader(sample);

      const shared = await page.waitForFunction(() => window.sharedData);
      const { title, text } = await shared.jsonValue();
      expectSharedSubtree(title, text);
    });

    test('falls back to an email draft without the Web Share API', async ({ page, sample }) => {
      await page.evaluate(() => {
        Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
        window.open = (url) => {
          window.openedUrl = url;
        };
      });

      await shareTodoHeader(sample);

      const opened = await page.waitForFunction(() => window.openedUrl);
      const url = new URL(await opened.jsonValue());
      expect(url.protocol).toBe('mailto:');
      expectSharedSubtree(url.searchParams.get('subject'), url.searchParams.get('body'));
    });
  });
});
