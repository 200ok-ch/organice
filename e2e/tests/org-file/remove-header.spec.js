import { test, expect } from '@playwright/test';

test.describe('Header Removal', () => {
  test('should remove header by swiping left', async ({ page }) => {
    const isMobile =
      test.info().project.name === 'Mobile Chrome' || test.info().project.name === 'Mobile Safari';

    await page.goto('/sample', { waitUntil: 'domcontentloaded' });
    // Wait for the sample content to load by checking for specific text
    await expect(page.getByText('This is an actual org file')).toBeVisible();

    // Find a header that we can safely remove for testing
    // Using the "Tap on any header to open it" header as it's a simple top-level header
    const targetHeader = page
      .locator('.header')
      .filter({ hasText: 'Tap on any header to open it' })
      .first();

    // Verify the header exists before swiping
    await expect(targetHeader).toBeVisible();

    // Get the bounding box of the header to calculate swipe coordinates
    const box = await targetHeader.boundingBox();
    expect(box).toBeTruthy();

    // Perform swipe left gesture
    // The remove condition is: dragStartX >= 2 * currentDragX
    // If we start at x=300 and end at x=100, then 300 >= 200, which triggers removal
    const startX = box.x + box.width * 0.8; // Start at 80% of width
    const endX = box.x - 50; // Swipe past the left edge to ensure removal
    const y = box.y + box.height / 2; // Middle of the header vertically

    if (isMobile) {
      // Use touch events for mobile browsers
      // Playwright's Touchscreen API only supports tap(), so we manually dispatch touch events
      const touches = [{ identifier: 0, clientX: startX, clientY: y }];
      await targetHeader.dispatchEvent('touchstart', {
        touches,
        changedTouches: touches,
        targetTouches: touches,
      });

      const steps = 10;
      for (let i = 1; i <= steps; i++) {
        const currentX = startX + (endX - startX) * (i / steps);
        const touches = [{ identifier: 0, clientX: currentX, clientY: y }];
        await targetHeader.dispatchEvent('touchmove', {
          touches,
          changedTouches: touches,
          targetTouches: touches,
        });
      }

      await targetHeader.dispatchEvent('touchend', {
        touches: [],
        changedTouches: [{ identifier: 0, clientX: endX, clientY: y }],
        targetTouches: [],
      });
    } else {
      // Use mouse events for desktop browsers
      await page.mouse.move(startX, y);
      await page.mouse.down();
      await page.mouse.move(endX, y, { steps: 10 });
      await page.mouse.up();
    }

    // Wait for the remove animation to complete
    // The animation uses spring physics and the handleRest callback removes the header
    await page.waitForTimeout(800);

    // Verify the header is no longer visible after the animation
    await expect(targetHeader).not.toBeVisible({ timeout: 5000 });
  });
});
