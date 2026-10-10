import { test, expect } from '../../fixtures.js';
import { swipe } from '../../helpers/gestures.js';

// sample.org, "Todos": swiping right on a header advances its todo state.
test.describe('TODO cycling', () => {
  test('swiping right cycles TODO -> DONE -> none and updates the parent cookie', async ({
    page,
    sample,
  }) => {
    await sample.expand('Actions', 'Todos');
    const todosHeader = sample.header('Todos');
    const header = sample.header('Learn how to use TODOs in organice');
    const keyword = header.locator('.todo-keyword');

    await expect(todosHeader).toContainText('[3/7] [42%]');
    await expect(keyword).toHaveText('TODO');

    await swipe(page, header, 'right');
    await expect(keyword).toHaveText('DONE');
    await expect(todosHeader).toContainText('[4/7] [57%]');

    await swipe(page, header, 'right');
    await expect(keyword).toHaveCount(0);
    await expect(todosHeader).toContainText('[3/6] [50%]');

    await swipe(page, header, 'right');
    await expect(keyword).toHaveText('TODO');
    await expect(todosHeader).toContainText('[3/7] [42%]');
  });

  test('swiping right cycles through a custom todo keyword sequence', async ({ page, sample }) => {
    await sample.expand('Actions', 'Todos');
    const header = sample.header('Investigate custom TODO states');
    const keyword = header.locator('.todo-keyword');

    // #+TODO: START INPROGRESS STALLED | FINISHED
    for (const state of ['START', 'INPROGRESS', 'STALLED', 'FINISHED']) {
      await expect(keyword).toHaveText(state);
      await swipe(page, header, 'right');
    }
    await expect(keyword).toHaveCount(0);
  });

  test('completing a task with a repeater moves its deadline', async ({ page, sample }) => {
    await sample.expand('Planning');
    const header = await sample.select('An item with a repeater');
    await expect(header).toContainText('DEADLINE: <2019-01-10 Thu +1w>');
    await sample.deselect();

    await swipe(page, header, 'right');

    // The task stays open and its deadline moves by the +1w repeater. The
    // swipe also selects the header, so reselect it to show its content.
    await expect(header.locator('.todo-keyword')).toHaveText('TODO');
    await sample.deselect();
    await sample.select('An item with a repeater');
    await expect(header).toContainText('DEADLINE: <2019-01-17 Thu +1w>');
  });
});
