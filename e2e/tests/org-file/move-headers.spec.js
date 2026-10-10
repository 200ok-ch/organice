import { test, expect } from '../../fixtures.js';

// sample.org, "Moving headers": the four-way arrows button shows 6 buttons.
// The center 4 move the header, the outer 2 move it with its subtree.
test.describe('Moving headers', () => {
  test.beforeEach(async ({ sample }) => {
    await sample.expand('Actions', /^Moving headers/, 'A few of my favorite things', 'Food');
  });

  const move = async (page, title) => {
    const showButtons = page.getByTitle('Show movement buttons');
    if (await showButtons.isVisible()) {
      await showButtons.click();
    }
    await page.getByTitle(title).click();
  };

  test('up and down move a header among its siblings', async ({ page, sample }) => {
    const order = async () => {
      const titles = await sample.titles();
      return titles.filter((title) => ['Food', 'Text editors'].includes(title));
    };
    expect(await order()).toEqual(['Food', 'Text editors']);

    await sample.select('Text editors');
    await move(page, 'Move header up');
    await expect.poll(order).toEqual(['Text editors', 'Food']);

    await move(page, 'Move header down');
    await expect.poll(order).toEqual(['Food', 'Text editors']);
  });

  test('left and right change the nesting level of a header', async ({ page, sample }) => {
    expect(await sample.level('Mangoes')).toBe(5);

    await sample.select('Mangoes');
    await move(page, 'Move header right');
    await expect.poll(() => sample.level('Mangoes')).toBe(6);

    await move(page, 'Move header left');
    await expect.poll(() => sample.level('Mangoes')).toBe(5);
  });

  test('the outer buttons move a header together with its subtree', async ({ page, sample }) => {
    await sample.select('Chocolate');
    expect(await sample.level('Chocolate')).toBe(5);
    expect(await sample.level('Dark chocolate')).toBe(6);

    await move(page, 'Move entire subtree left');
    await expect.poll(() => sample.level('Chocolate')).toBe(4);
    expect(await sample.level('Dark chocolate')).toBe(5);

    await move(page, 'Move entire subtree right');
    await expect.poll(() => sample.level('Chocolate')).toBe(5);
    expect(await sample.level('Dark chocolate')).toBe(6);
  });
});
