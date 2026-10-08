import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * Automated WCAG 2.1 A/AA checks with axe-core on the main screens, in the
 * light and dark themes. Automated checks catch a fraction of accessibility
 * problems (contrast, names, labels, structure); they back up, not replace,
 * keyboard and screen-reader testing.
 */

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

/**
 * Waits until no finite animation or transition is running (fade-ins, the bag
 * drawer sliding in), so contrast is measured on the final frame rather than on a
 * half-faded one. Infinite animations, like skeleton pulses, are ignored.
 */
async function settleAnimations(page: Page) {
  await page.waitForFunction(() =>
    document
      .getAnimations()
      .every(
        (animation) =>
          animation.playState !== 'running' ||
          !Number.isFinite(animation.effect?.getComputedTiming().endTime),
      ),
  );
}

async function expectNoViolations(page: Page) {
  await settleAnimations(page);
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  const violations = results.violations.map((violation) => ({
    rule: violation.id,
    impact: violation.impact,
    help: violation.help,
    targets: violation.nodes.slice(0, 5).map((node) => node.target.join(' ')),
  }));
  expect(violations, 'axe-core violations').toEqual([]);
}

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
