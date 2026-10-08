import { expect, test } from '@playwright/test';
import { expectNoViolations } from './support/axe';

/**
 * Automated WCAG 2.1 A/AA checks with axe-core on the main screens, in the
 * light and dark themes. Automated checks catch a fraction of accessibility
 * problems (contrast, names, labels, structure); they back up, not replace,
 * keyboard and screen-reader testing.
 */

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`Accessibility (${colorScheme} theme)`, () => {
    test.use({ colorScheme });

    test('home page', async ({ page }) => {
      await page.goto('./');
      await expect(
        page.getByRole('heading', { name: 'Objects people keep reaching for' }),
      ).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Stoneware Mug' }).first()).toBeVisible();
      await expectNoViolations(page);
    });

    test('catalog', async ({ page }) => {
      await page.goto('./#/products');
      await expect(page.getByText('13 products')).toBeVisible();
      await expectNoViolations(page);
    });

    test('product page', async ({ page }) => {
      await page.goto('./#/products/linen-cushion-cover');
      await expect(page.getByRole('button', { name: 'Add to bag' })).toBeEnabled();
      await expect(page.getByRole('heading', { name: 'More from this collection' })).toBeVisible();
      await expectNoViolations(page);
    });

    test('bag drawer and bag page', async ({ page }) => {
      await page.goto('./#/products/walnut-serving-tray');
      await page.getByRole('button', { name: 'Add to bag' }).click();
      const bag = page.getByRole('dialog', { name: 'Shopping bag' });
      await expect(bag.getByRole('heading', { name: 'Your bag (1)' })).toBeVisible();
      await expectNoViolations(page);

      await bag.getByRole('link', { name: 'View bag' }).click();
      await expect(page.getByRole('heading', { level: 1, name: 'Shopping bag (1)' })).toBeVisible();
      await expectNoViolations(page);
    });

    test('checkout', async ({ page }) => {
      await page.goto('./#/products/walnut-serving-tray');
      await page.getByRole('button', { name: 'Add to bag' }).click();
      await page
        .getByRole('dialog', { name: 'Shopping bag' })
        .getByRole('link', { name: 'Checkout' })
        .click();
      await expect(page.getByRole('heading', { level: 1, name: 'Customer' })).toBeVisible();
      // Error messages are part of the form a shopper sees; check them too.
      await page.getByRole('button', { name: 'Continue' }).click();
      await expect(page.getByText('Enter a valid email address')).toBeVisible();
      await expectNoViolations(page);
    });
  });
}
