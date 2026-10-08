import { expect, test } from '@playwright/test';
import { FAKE_KLAVIYO_LIST_ID, FAKE_KLAVIYO_PATH } from './fake-klaviyo/constants';
import { expectNoViolations } from './support/axe';
import { klaviyoCalls, trackedEvent, waitForKlaviyoCall } from './support/klaviyo';

test.describe('Email marketing (Klaviyo)', () => {
  test('the newsletter signs a shopper up, credited to the distributor who referred them', async ({
    page,
  }) => {
    await page.goto('./?ref=ana123#/');
    const footer = page.getByRole('contentinfo');

    const signup = waitForKlaviyoCall(page, '/client/subscriptions');
    await footer.getByLabel('Email address').fill('ana@example.com');
    await footer.getByRole('button', { name: 'Subscribe' }).click();

    const { status, body, detail } = await signup;
    expect(status, detail ?? undefined).toBe(202);
    expect(body).toMatchObject({
      data: {
        attributes: {
          custom_source: 'Luma storefront footer',
          profile: {
            data: {
              attributes: {
                email: 'ana@example.com',
                properties: { referral_code: 'ANA123' },
                subscriptions: { email: { marketing: { consent: 'SUBSCRIBED' } } },
              },
            },
          },
        },
        relationships: { list: { data: { type: 'list', id: FAKE_KLAVIYO_LIST_ID } } },
      },
    });
    await expect(footer.getByRole('status')).toHaveText(
      'Thanks for subscribing. Check your inbox.',
    );
    // The browser now belongs to the new profile, so later events reach it.
    await expect
      .poll(() => klaviyoCalls(page))
      .toContainEqual(['identify', { email: 'ana@example.com' }]);
  });

  test('a sold-out variant takes a back-in-stock request', async ({ page }) => {
    await page.goto('./#/products/linen-cushion-cover');
    await page.getByRole('radio', { name: '50 × 50 cm' }).click();
    await expect(page.getByRole('radio', { name: 'Rust (sold out)' })).toBeChecked();

    const notify = page.getByRole('region', { name: "Get an email when it's back" });
    await expect(notify).toContainText('50 × 50 cm / Rust is sold out.');
    await expectNoViolations(page);

    const request = waitForKlaviyoCall(page, '/client/back-in-stock-subscriptions');
    await notify.getByLabel('Email address').fill('ana@example.com');
    await notify.getByRole('button', { name: 'Notify me' }).click();

    const { status, body, detail } = await request;
    expect(status, detail ?? undefined).toBe(202);
    // Klaviyo's id for the variant in its Shopify catalog.
    expect(body).toMatchObject({
      data: {
        attributes: { channels: ['EMAIL'] },
        relationships: { variant: { data: { id: '$shopify:::$default:::100603' } } },
      },
    });
    await expect(notify.getByRole('status')).toContainText("We'll email you");

    // An available variant needs no alert.
    await page.getByRole('radio', { name: 'Stone' }).click();
    await expect(notify).toBeHidden();
  });

  test('product views and bag additions are tracked; klaviyo.js loads once the page is idle', async ({
    page,
  }) => {
    const script = page.waitForRequest((request) =>
      request.url().includes(`${FAKE_KLAVIYO_PATH}/onsite/js/`),
    );
    await page.goto('./#/products/stoneware-mug');
    await script;

    await expect
      .poll(() => trackedEvent(page, 'Viewed Product'))
      .toMatchObject({
        ProductName: 'Stoneware Mug',
        ProductID: '1001',
        SKU: 'LUMA-MUG-SAND',
        Price: 28,
        URL: expect.stringContaining('#/products/stoneware-mug'),
      });

    await page.getByRole('button', { name: 'Add to bag' }).click();
    await expect(
      page
        .getByRole('dialog', { name: 'Shopping bag' })
        .getByRole('heading', { name: 'Your bag (1)' }),
    ).toBeVisible();
    await expect
      .poll(() => trackedEvent(page, 'Added to Cart'))
      .toMatchObject({
        AddedItemProductName: 'Stoneware Mug',
        AddedItemQuantity: 1,
        $value: 28,
        CheckoutURL: expect.stringContaining('/cart/c/'),
        Items: [expect.objectContaining({ ProductName: 'Stoneware Mug', Quantity: 1 })],
      });
  });

  test('when Klaviyo cannot be reached the shopper is told and can try again', async ({ page }) => {
    await page.route(
      `**${FAKE_KLAVIYO_PATH}/client/subscriptions**`,
      (route) => route.fulfill({ status: 503 }),
      { times: 1 },
    );
    await page.goto('./');
    const footer = page.getByRole('contentinfo');

    await footer.getByLabel('Email address').fill('ana@example.com');
    await footer.getByRole('button', { name: 'Subscribe' }).click();
    await expect(footer.getByRole('alert')).toHaveText(
      "We couldn't sign you up just now. Please try again.",
    );

    await footer.getByRole('button', { name: 'Subscribe' }).click();
    await expect(footer.getByRole('status')).toHaveText(
      'Thanks for subscribing. Check your inbox.',
    );
  });
});
