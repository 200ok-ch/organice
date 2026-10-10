import { test, expect } from '../../fixtures.js';

// sample.org, "Automatic/Implicit links": web links, e-mail addresses and
// phone numbers become links although Emacs Org mode would not link them.
test.describe('Implicit links', () => {
  const phoneNumbers = [
    '123-456-7890',
    '(123) 456-7890',
    '123 456 7890',
    '123.456.7890',
    '+91 (123) 456-7890',
    '0783268674',
    '078 326 86 74',
    '041783268675',
    '0041783268674',
    '+41783268676',
    '+41783268677',
  ];

  test('renders web links, e-mail addresses and phone numbers as links', async ({ sample }) => {
    const header = await sample.select('Automatic/Implicit links');
    const link = (text) => header.getByRole('link', { name: text, exact: true });

    await expect(link('https://organice.200ok.ch')).toHaveAttribute(
      'href',
      'https://organice.200ok.ch'
    );
    await expect(link('www.200ok.ch')).toHaveAttribute('href', 'https://www.200ok.ch');
    await expect(link('info@200ok.ch')).toHaveAttribute('href', 'mailto:info@200ok.ch');

    for (const number of phoneNumbers) {
      await expect(link(number)).toHaveAttribute('href', `tel:${number}`);
    }
  });
});
