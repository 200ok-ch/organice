import { test, expect } from '@playwright/test';

const isMobileProject = () => ['Mobile Chrome', 'Mobile Safari'].includes(test.info().project.name);

/**
 * Swipes a header horizontally.
 *
 * The header compares absolute x coordinates: a swipe right advances the TODO
 * state when the end is at least twice the start, a swipe left removes the
 * header when the start is at least twice the end
 * (src/components/OrgFile/components/Header/index.js, handleDragEnd).
 *
 * Mobile projects get touch events; Playwright's touchscreen only supports
 * tap(), so they are dispatched directly. Desktop projects use the mouse.
 */
export const swipe = async (page, locator, direction) => {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  expect(box).toBeTruthy();

  const y = box.y + box.height / 2;
  const [startX, endX] =
    direction === 'right'
      ? [box.x + box.width * 0.1, box.x + box.width * 0.9]
      : [box.x + box.width * 0.8, box.x - 50];

  if (isMobileProject()) {
    const touchAt = (x) => [{ identifier: 0, clientX: x, clientY: y }];
    await locator.dispatchEvent('touchstart', {
      touches: touchAt(startX),
      changedTouches: touchAt(startX),
      targetTouches: touchAt(startX),
    });
    const steps = 10;
    for (let i = 1; i <= steps; i++) {
      const x = startX + (endX - startX) * (i / steps);
      await locator.dispatchEvent('touchmove', {
        touches: touchAt(x),
        changedTouches: touchAt(x),
        targetTouches: touchAt(x),
      });
    }
    await locator.dispatchEvent('touchend', {
      touches: [],
      changedTouches: touchAt(endX),
      targetTouches: [],
    });
  } else {
    await page.mouse.move(startX, y);
    await page.mouse.down();
    await page.mouse.move(endX, y, { steps: 10 });
    await page.mouse.up();
  }
};
