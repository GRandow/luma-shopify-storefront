import { expect, test } from '@playwright/test';

test.describe('Shopping', () => {
  test('a shopper finds a product, picks a colour and checks out', async ({ page }) => {
    await page.goto('./');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Fewer things. Better chosen.' }),
    ).toBeVisible();

    await page.getByRole('link', { name: 'Explore the collection' }).click();
    await expect(page.getByText('13 products')).toBeVisible();
    await page.getByRole('heading', { name: 'Stoneware Mug' }).getByRole('link').click();

    await expect(page.getByRole('heading', { level: 1, name: 'Stoneware Mug' })).toBeVisible();
    await page.getByRole('radio', { name: 'Charcoal' }).click();
    await expect(page.getByText('SKU LUMA-MUG-CHAR')).toBeVisible();
    await page.getByRole('button', { name: 'Add to bag' }).click();

    const bag = page.getByRole('dialog', { name: 'Shopping bag' });
    await expect(bag.getByRole('heading', { name: 'Your bag (1)' })).toBeVisible();
    await expect(bag.getByText('Charcoal', { exact: true })).toBeVisible();
    await bag.getByRole('button', { name: 'Increase quantity of Stoneware Mug' }).click();
    await expect(bag.getByRole('heading', { name: 'Your bag (2)' })).toBeVisible();
    await expect(bag).toContainText('$56.00');

    await bag.getByRole('link', { name: 'Checkout' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Customer' })).toBeVisible();

    // Each step validates before moving on.
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByText('Enter a valid email address')).toBeVisible();

    await page.getByLabel('Email', { exact: true }).fill('ana@example.com');
    await page.getByLabel('First name').fill('Ana');
    await page.getByLabel('Last name').fill('Souza');
    await page.getByLabel('Phone').fill('+1 416 555 0100');
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(page.getByRole('heading', { level: 1, name: 'Shipping' })).toBeVisible();
    await page.getByLabel('Street address').fill('100 Queen St W');
    await page.getByLabel('City').fill('Toronto');
    await page.getByLabel('State / region').fill('Ontario');
    await page.getByLabel('Postal code').fill('M5H 2N2');
    await page.getByLabel('Country').selectOption('Canada');
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(page.getByRole('heading', { level: 1, name: 'Payment' })).toBeVisible();
    await page.getByLabel('Name on card').fill('Ana Souza');
    await page.getByLabel('Card number').fill('4242 4242 4242 4242');
    await page.getByLabel('Expiry').fill('12/30');
    await page.getByLabel('Security code').fill('123');
    await page.getByRole('button', { name: /^Pay \$/ }).click();

    await expect(page.getByRole('heading', { level: 1, name: 'Thank you, Ana.' })).toBeVisible();
    await expect(page.getByText(/Order #LM-\d+ is confirmed/)).toBeVisible();
    // The Shopify cart is forgotten once the order is placed.
    await expect(page.getByRole('button', { name: 'Open bag, 0 items' })).toBeAttached();
  });

  test('sold-out combinations cannot be bought and low stock is flagged', async ({ page }) => {
    await page.goto('./#/products/linen-cushion-cover');
    await expect(page.getByRole('button', { name: 'Add to bag' })).toBeEnabled();

    await page.getByRole('radio', { name: '50 × 50 cm' }).click();
    await expect(page.getByRole('radio', { name: 'Rust (sold out)' })).toBeChecked();
    await expect(page.getByRole('button', { name: 'Sold out' })).toBeDisabled();

    await page.getByRole('radio', { name: 'Stone' }).click();
    await expect(page.getByRole('button', { name: 'Add to bag' })).toBeEnabled();
    await expect(page.getByText('SKU LUMA-CUSH-50-STONE')).toBeVisible();

    await page.goto('./#/products/ceramic-table-lamp');
    await expect(page.getByText('Only 2 left')).toBeVisible();
  });

  test('the bag page updates quantities and removes lines', async ({ page }) => {
    await page.goto('./#/products/walnut-serving-tray');
    await page.getByRole('button', { name: 'Add to bag' }).click();
    await page
      .getByRole('dialog', { name: 'Shopping bag' })
      .getByRole('link', { name: 'View bag' })
      .click();

    // The drawer is still sliding out; act on the page itself.
    const main = page.getByRole('main');
    await expect(main.getByRole('heading', { level: 1, name: 'Shopping bag (1)' })).toBeVisible();
    await main.getByRole('button', { name: 'Increase quantity of Walnut Serving Tray' }).click();
    await expect(main.getByRole('heading', { level: 1, name: 'Shopping bag (2)' })).toBeVisible();
    await expect(main).toContainText('$144.00');

    await main.getByRole('button', { name: 'Remove Walnut Serving Tray' }).click();
    await expect(
      page.getByRole('heading', { name: 'Your bag is beautifully empty' }),
    ).toBeVisible();
  });
});
