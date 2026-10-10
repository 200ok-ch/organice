import { test, expect } from '../../fixtures.js';
import { swipe } from '../../helpers/gestures.js';

test.describe('Header Removal', () => {
  test('should remove header by swiping left', async ({ page, sample }) => {
    const targetHeader = sample.header('Tap on any header to open it');
    await expect(targetHeader).toBeVisible();
    const targetHeaderId = await targetHeader.getAttribute('data-header-id');
    expect(targetHeaderId).toBeTruthy();

    await swipe(page, targetHeader, 'left');

    // The header is removed once the remove animation comes to rest.
    await expect(page.locator(`.header[data-header-id="${targetHeaderId}"]`)).toHaveCount(0);
  });
});
