import { test, expect } from '../../fixtures.js';

// sample.org, "Lists and checkboxes":
//
// - [-] 1 [1/2]
//   - [ ] 1.1 [0%]
//     - [ ] 1.1.1
//   - [X] 1. 2
// - [X] 2
test.describe('Checkboxes', () => {
  test('ticking a leaf checkbox updates its parents and their cookies', async ({
    page,
    sample,
  }) => {
    await sample.select('Lists and checkboxes');

    const item = (title) => page.locator('.list-part__checkbox-container', { hasText: title });
    const state = (title) => item(title).locator('.checkbox i');
    const one = item(/^1 \[/);
    const oneOne = item(/^1\.1 \[/);
    const leaf = item(/^1\.1\.1$/);

    await expect(state(/^1 \[/)).toHaveClass(/fa-minus/);
    await expect(one).toContainText('[1/2]');
    await expect(state(/^1\.1 \[/)).toHaveClass(/fa-square/);
    await expect(oneOne).toContainText('[0%]');

    await leaf.locator('.checkbox').click();

    await expect(state(/^1\.1\.1$/)).toHaveClass(/fa-check/);
    await expect(state(/^1\.1 \[/)).toHaveClass(/fa-check/);
    await expect(oneOne).toContainText('[100%]');
    await expect(state(/^1 \[/)).toHaveClass(/fa-check/);
    await expect(one).toContainText('[2/2]');

    await leaf.locator('.checkbox').click();

    await expect(state(/^1\.1\.1$/)).toHaveClass(/fa-square/);
    await expect(state(/^1\.1 \[/)).toHaveClass(/fa-square/);
    await expect(oneOne).toContainText('[0%]');
    await expect(state(/^1 \[/)).toHaveClass(/fa-minus/);
    await expect(one).toContainText('[1/2]');
  });
});
