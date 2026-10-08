import { expect, test, type Page } from '@playwright/test';
import { referralAttribute, waitForStorefrontCall } from './support/storefront';

/**
 * The buyer side of referral attribution: whatever way the distributor's code
 * arrives, it has to end up as the cart's `ref` attribute, because that is
 * what Shopify copies onto the order for the back office to read.
 */

async function addTrayToBag(page: Page) {
  await page.goto('./#/products/walnut-serving-tray');
  await page.getByRole('button', { name: 'Add to bag' }).click();
  await expect(page.getByRole('dialog', { name: 'Shopping bag' })).toBeVisible();
}

test.describe('Referral attribution', () => {
  test('a distributor link is remembered and travels with the new cart', async ({ page }) => {
    await page.goto('./?ref=ana123#/');
    // The code is kept, but no longer follows the shopper around in the URL.
    await expect(page).not.toHaveURL(/ref=/);

    const cartCreated = waitForStorefrontCall(page, 'CartCreate');
    await addTrayToBag(page);
    expect(referralAttribute((await cartCreated).variables)).toBe('ANA123');

    await page.getByRole('link', { name: 'View bag' }).click();
    const notice = page.getByRole('note').filter({ hasText: 'Referred by ANA123' });
    await expect(notice).toBeVisible();

    // Opting out removes the attribute from the cart, not just the notice.
    const attributesCleared = waitForStorefrontCall(
      page,
      'CartAttributesUpdate',
      (variables) => referralAttribute(variables) === null,
    );
    await notice.getByRole('button', { name: 'Remove' }).click();
    await attributesCleared;
    await expect(notice).toBeHidden();
    await expect(page.getByRole('textbox', { name: 'Distributor code' })).toBeVisible();
  });

  test('a link inside the hash route is captured too', async ({ page }) => {
    await page.goto('./#/products?ref=bruno77');
    await expect(page).not.toHaveURL(/ref=/);

    const cartCreated = waitForStorefrontCall(page, 'CartCreate');
    await addTrayToBag(page);
    expect(referralAttribute((await cartCreated).variables)).toBe('BRUNO77');
  });

  test('a code typed in the bag is checked, then written on the existing cart', async ({
    page,
  }) => {
    await addTrayToBag(page);
    await page.getByRole('link', { name: 'View bag' }).click();

    const codeField = page.getByRole('textbox', { name: 'Distributor code' });
    await codeField.fill('a');
    await page.getByRole('button', { name: 'Apply' }).first().click();
    await expect(page.getByRole('alert')).toHaveText(/Codes have 2 to 32 letters or numbers/);

    const attributesUpdated = waitForStorefrontCall(
      page,
      'CartAttributesUpdate',
      (variables) => referralAttribute(variables) === 'LEAD001',
    );
    await codeField.fill('lead001');
    await page.getByRole('button', { name: 'Apply' }).first().click();
    await attributesUpdated;
    await expect(page.getByRole('note').filter({ hasText: 'Referred by LEAD001' })).toBeVisible();
  });
});
