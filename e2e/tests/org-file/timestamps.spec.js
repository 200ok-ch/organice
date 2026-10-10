import { test, expect } from '../../fixtures.js';

// sample.org, "Timestamps" and "Editing planning items in organice": tapping
// a timestamp opens the editor; repeaters and delays each have a + button to
// add them and an X button to remove them.
test.describe('Timestamps', () => {
  test('tapping a timestamp opens the editor to add and remove a repeater and a delay', async ({
    page,
    sample,
  }) => {
    const header = await sample.select(/^Timestamps/);
    await header
      .locator('.attributed-string__timestamp-part', { hasText: '<2018-09-17 Sun>' })
      // The range <2018-09-17 Sun>--<2018-09-25 Tue> further down starts alike
      .first()
      .click();
    await sample.settle();

    const rendered = page.locator('.timestamp-editor__render');
    await expect(rendered).toHaveText('<2018-09-17 Sun>');

    const field = (title) =>
      page.locator('.timestamp-editor__field-container', {
        has: page.locator('.timestamp-editor__field-title', { hasText: title }),
      });

    await field('Repeater').locator('.timestamp-editor__icon--add').click();
    await expect(rendered).toHaveText('<2018-09-17 Sun +1h>');
    await field('Delay').locator('.timestamp-editor__icon--add').click();
    await expect(rendered).toHaveText('<2018-09-17 Sun +1h -1h>');

    await sample.closeDrawer({ commit: false });
    await expect(header).toContainText('<2018-09-17 Sun +1h -1h>');

    await header
      .locator('.attributed-string__timestamp-part', { hasText: '<2018-09-17 Sun +1h -1h>' })
      .click();
    await sample.settle();
    await field('Repeater').locator('.timestamp-editor__icon--remove').click();
    await field('Delay').locator('.timestamp-editor__icon--remove').click();
    await expect(rendered).toHaveText('<2018-09-17 Sun>');
  });
});
