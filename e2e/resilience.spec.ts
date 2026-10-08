import { expect, test, type Page } from '@playwright/test';
import { failStorefrontCalls, waitForStorefrontCall } from './support/storefront';

async function searchFor(page: Page, term: string) {
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  const field = page
    .getByRole('dialog', { name: 'Search products' })
    .getByRole('textbox', { name: 'Search products' });
  await field.fill(term);
  await field.press('Enter');
}

test.describe('Search and failure states', () => {
  test('search finds products, including a new search from the catalog itself', async ({
    page,
  }) => {
    await page.goto('./');
    await searchFor(page, 'linen');
    await expect(page.getByText('2 products')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Linen Throw Blanket' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Linen Cushion Cover' })).toBeVisible();

    // Searching again from the header while the catalog is open must not be
    // overwritten by the previous search (a regression this test caught).
    await searchFor(page, 'teapot');
    await expect(page.getByRole('heading', { name: 'No products match' })).toBeVisible();
    await expect(page).toHaveURL(/q=teapot/);
  });

  test('when the catalog is down the shopper is told and can try again', async ({ page }) => {
    // The first request and both automatic retries fail.
    await failStorefrontCalls(page, 'Products', { status: 503, times: 3 });
    await page.goto('./#/products');

    await expect(
      page.getByRole('heading', { name: 'The collection is unavailable' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Try again' }).click();
    await expect(page.getByText('13 products')).toBeVisible();
  });

  test('an unknown product shows a way back to the collection', async ({ page }) => {
    await page.goto('./#/products/does-not-exist');
    await expect(page.getByRole('heading', { name: 'Product not found' })).toBeVisible();
    await page.getByRole('link', { name: 'Browse the collection' }).click();
    await expect(page.getByText('13 products')).toBeVisible();
  });

  test('an expired cart is replaced without the shopper noticing', async ({ page }) => {
    // Shopify drops carts after a while; the browser may still remember the id.
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'luma-cart',
        JSON.stringify({ state: { cartId: 'gid://shopify/Cart/expired?key=old' }, version: 2 }),
      );
    });
    await page.goto('./#/products/walnut-serving-tray');

    const cartCreated = waitForStorefrontCall(page, 'CartCreate');
    await page.getByRole('button', { name: 'Add to bag' }).click();
    await cartCreated;
    const bag = page.getByRole('dialog', { name: 'Shopping bag' });
    await expect(bag.getByRole('heading', { name: 'Your bag (1)' })).toBeVisible();
    await expect(bag.getByRole('link', { name: 'Walnut Serving Tray' }).last()).toBeVisible();
  });
});
