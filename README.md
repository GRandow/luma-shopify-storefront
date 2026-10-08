# Luma Storefront

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite)
![Shopify Storefront API](https://img.shields.io/badge/Shopify-Storefront%20API-96BF48?logo=shopify&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-06B6D4?logo=tailwindcss)
![Playwright](https://img.shields.io/badge/tested%20with-Playwright-2EAD33?logo=playwright)
![CI](https://github.com/GRandow/luma-shopify-storefront/actions/workflows/ci.yml/badge.svg)

A headless Shopify storefront built with React, TypeScript and Vite. Catalog, collections, search and the cart come from the **Shopify Storefront API (GraphQL)**, customer sign-in, addresses and order history from the **Customer Account API**; the UI is a custom React front end with wishlist, product comparison, quick view and a demo checkout.

🚀 **Live demo:** https://grandow.github.io/luma-shopify-storefront/

The live demo runs against a Shopify **development store** with Shopify's hosted checkout in test mode: add something to the bag, go to "Secure checkout" and pay with the Bogus Gateway test card (card number `1`, any future expiry date, any CVV). Card `2` simulates a declined payment and `3` a gateway error. Development stores keep a storefront password that Shopify's checkout asks for once per browser; the demo store's password is **`luma`**, and the app shows it next to the checkout button.

Sign in from the account icon with any email address you can read: Shopify sends a one-time code, and the account area then shows your profile and the orders you place — the cart is tied to the customer, so checkout opens already signed in and the order lands on the account.

Out of the box (no `.env`) the app talks to [mock.shop](https://mock.shop), Shopify's public Storefront API sandbox, so it runs without a store or an access token. Pointing it at your own development store is a matter of a few environment variables.

## Features

- Catalog, collections and full-text search through the Storefront API (`products`, `collection`, `search`)
- Product pages with option/variant selection (size, colour…), variant images, stock-aware quantity and compare-at pricing
- Shopify **Cart API**: `cartCreate`, `cartLinesAdd/Update/Remove`, discount codes, persisted cart id and `checkoutUrl`
- Slide-in bag (cart drawer) that opens from the header and after every add-to-bag, with quantity controls and direct checkout
- Responsive images from Shopify's CDN (`srcset` built from on-the-fly resizes)
- Product recommendations (`productRecommendations`) with a collection-based fallback
- Quick view dialog with the same variant selector as the product page
- Product comparison tray (up to three products: price, availability, brand, collection)
- Persistent wishlist and recently viewed products (browser storage, survives reloads)
- **Customer accounts** through the Customer Account API: OAuth 2.0 + PKCE sign-in with Shopify's passwordless login, profile, saved addresses and paginated order history; `cartBuyerIdentityUpdate` ties the cart to the customer so checkout is pre-authenticated
- **Referral attribution** for direct-sales brands: `/?ref=CODE` links are remembered (or the code is typed in the bag) and written on the cart as an attribute (`cartCreate` / `cartAttributesUpdate`), which Shopify copies onto the order for back-office systems to read
- **Email marketing with Klaviyo**: onsite tracking (Viewed Product, Added to Cart), signed-in customers identified, a footer newsletter through Klaviyo's client API (the distributor code becomes a profile property) and back-in-stock alerts on sold-out variants
- Demo multi-step checkout (React Hook Form + Zod) that can be swapped for Shopify's hosted checkout with one flag
- Dark mode, accessible dialogs and keyboard-friendly filters, with WCAG 2.1 AA colour contrast in both themes

## Tech stack

React 19 · TypeScript · Vite · React Router · TanStack Query · Zustand · Tailwind CSS · React Hook Form · Zod · Klaviyo · Vitest + Testing Library · Playwright · axe-core · Lighthouse CI

## Architecture

```
src/
├─ services/storefront/   GraphQL client, documents (fragments/queries/mutations), raw types and adapters
│  ├─ client.ts           storefrontRequest(): fetch wrapper, token header, GraphQL error handling
│  ├─ queries.ts          ProductFields / CartFields fragments and every operation the app uses
│  └─ adapters.ts         Storefront API payloads → app domain model (Product, Collection, Cart)
├─ services/customer-account/  Customer Account API: OAuth/PKCE flow (oauth.ts, pkce.ts), endpoints derived
│                          from the shop id (config.ts), authenticated GraphQL client, queries, adapters
├─ services/klaviyo/      Klaviyo: config.ts (public key, list) · onsite.ts (klaviyo.js queue, idle loading) ·
│                          events.ts (Viewed Product / Added to Cart payloads) · client-api.ts (newsletter, back in stock)
├─ services/              product-service.ts (catalog) · cart-service.ts (Cart API) · customer-service.ts (account)
├─ features/
│  ├─ products/           queries (TanStack), client-side filters, variant selection, cards, gallery
│  ├─ cart/               cart-queries.ts (useCart / useAddToCart / …) · cart-store.ts (persisted cart id) · CartDrawer
│  ├─ auth/               auth-store.ts (persisted session) · session.ts (token refresh, sign-out) ·
│  │                      customer-queries.ts (profile, orders) · AuthCallbackGate (finishes the OAuth redirect)
│  ├─ referral/           referral-store.ts (persisted code) · referral-capture.ts (?ref= capture, cart sync) ·
│  │                      ReferralNotice / ReferralCodeForm (who the order is credited to, code typed by hand)
│  ├─ marketing/          NewsletterSignup · BackInStockForm · use-klaviyo-identify.ts (signed-in customers)
│  ├─ wishlist/ discovery/ theme/  Zustand stores
│  └─ checkout/           form schema for the demo checkout
├─ types/                 Domain model consumed by the UI (product.ts, cart.ts, user.ts)
└─ pages/                 Route components
```

A few decisions worth calling out:

- **Adapters between API and UI.** Components never see Storefront API payloads. `adapters.ts` turns them into a small domain model (money as numbers, flattened option values, a resolved compare-at price), so a schema change touches one file.
- **The cart lives in Shopify.** The browser only stores the cart id (`localStorage`). Reads and writes go through TanStack Query, and every mutation replaces the cached cart with the payload Shopify returns — no local price maths. An expired cart (Shopify drops them after inactivity) is detected from the `cartId` user error and transparently recreated.
- **Client-side refinement on top of server queries.** Search hits Shopify's `search` query and collections load through `collection(handle:)`; price ceiling, availability and sorting are refined locally because the catalog is small. Cursor-based pagination is the next step for larger stores.
- **Customer accounts are a public OAuth client.** There is no server to keep a secret, so sign-in uses the authorization-code flow with PKCE (`S256`), a `state` check against the stored attempt and a `nonce` check on the id token. Shopify's hosted login handles the one-time code; the app only ever holds the tokens, refreshes the access token a minute before it expires (one refresh shared by concurrent requests) and signs out through Shopify's end-session endpoint. The token endpoint checks the browser's `Origin`, which is why the request is made from the page itself. After sign-in the cart gets the customer's token (`cartBuyerIdentityUpdate`), and carts created while signed in are theirs from `cartCreate`.
- **Images.** `ProductImage` builds a `srcset` from Shopify CDN resizes (`?width=`), so a 4096px source is never shipped to a 300px card.
- **Products with options** open the quick view instead of silently adding a default variant; option combinations that do not exist as variants are disabled, sold-out ones are struck through.

## Getting started

Requires Node.js 22 or newer (`nvm use` picks the version from `.nvmrc`).

```bash
npm install
npm run dev
```

Other scripts: `npm run dev:https` (the dev server over https, needed to try Klaviyo's onsite tracking; see [Email marketing](#email-marketing-klaviyo)), `npm run build`, `npm test`, `npm run lint`, `npm run typecheck`, `npm run format`, and `npm run test:e2e` / `npm run lighthouse` (see [Quality](#quality)).

Every push and pull request runs lint, formatting, typecheck, unit tests, the production build, the end-to-end suite and the Lighthouse budgets through GitHub Actions (`.github/workflows/ci.yml`); `main` is then deployed to GitHub Pages (`deploy.yml`).

## Quality

| Layer                    | Tooling                                     | What it checks                                                      |
| ------------------------ | ------------------------------------------- | ------------------------------------------------------------------- |
| Unit and component tests | Vitest + Testing Library                    | adapters, stores, the OAuth/PKCE flow, components                   |
| End-to-end tests         | Playwright, on desktop Chrome and a Pixel 7 | real shopper journeys, in the production build                      |
| Accessibility            | axe-core, inside the Playwright run         | WCAG 2.1 A/AA on the main screens, in the light and the dark theme  |
| Lighthouse CI            | `@lhci/cli`                                 | budgets for performance, accessibility, best practices, SEO and CLS |

### End-to-end tests against a fake Storefront API

The end-to-end suite does not call mock.shop, a real store or Klaviyo. `e2e/fake-storefront/` is a small in-memory implementation of the Storefront API operations the app uses (catalog, search, recommendations and the Cart API, user errors included, such as an expired cart or a sold-out line), and `e2e/fake-klaviyo/` stands in for klaviyo.js and Klaviyo's client API, checking each request the way Klaviyo does. Vite plugins mount both on the `vite preview` server that serves the production build, and `vite.e2e.config.ts` pins every `VITE_*` variable, so the build under test is the same on every machine whatever its `.env` says.

That makes the run deterministic (a fixed catalog of 13 products with known stock and prices), fast and independent of a third-party sandbox, and failures can be injected: `page.route` answers chosen operations with a 503. Elements are found by role, label and visible text, the way a shopper or a screen reader finds them, and requests are checked by GraphQL operation name and variables.

Journeys covered, on desktop and mobile:

- browse, pick a colour, adjust the bag and go through the three-step checkout (with validation) to the confirmation
- sold-out combinations cannot be bought, low stock is flagged
- the bag page changes quantities and removes lines
- referral links (`/?ref=`, also inside a hash route) reach the cart as an attribute; the code can be removed or typed by hand
- search, including a new search started from the catalog itself
- the catalog API is down (error state, then a retry), an unknown product, an expired cart replaced without the shopper noticing
- the newsletter and back-in-stock requests reach Klaviyo with the payload its API expects (list, consent, distributor code, catalog variant id), product views and bag additions are tracked, and a Klaviyo outage leaves the form usable

What the suite caught, now fixed:

- After a validation error in checkout, the next click on "Continue" was lost: the error disappeared on blur, the button moved up under the cursor and the click landed on nothing.
- A search typed in the header while the catalog was open was overwritten by the previous search.
- Grey secondary text failed WCAG AA contrast in both themes (axe found it on every page). It now uses one theme-aware colour, `ink-muted`, with at least 4.5:1 on every surface it sits on.
- Lighthouse flagged a layout shift on product pages (the footer flashed into view while the page loaded; CLS went from 0.20 to about 0.02), a skipped heading level in the catalog and a render-blocking Google Fonts stylesheet; the fonts are now bundled with the app (Fontsource).

On CI a failing test is retried once and keeps a trace (DOM snapshots, network, console) in the Playwright report uploaded with the run.

### Lighthouse budgets

Lighthouse CI audits the home page, the catalog and a product page, three runs each, in mobile emulation on a simulated slow 4G connection, against the same build as the end-to-end suite. The job fails if accessibility, best practices or SEO score below 100, performance below 80 (medians were 86 to 91 when the budget was set) or CLS goes above 0.1. Links to the reports are printed in the job log.

### Running the checks locally

```bash
npx playwright install chromium   # once
npm run test:e2e                  # builds with the fake API, then runs Playwright on desktop and mobile
npm run test:e2e:ui               # the same in Playwright's UI mode
npm run lighthouse                # Lighthouse CI with the same budgets; reports land in .lighthouseci/reports
```

## Connecting a Shopify store

By default `VITE_SHOPIFY_STOREFRONT_API_URL` points at `https://mock.shop/api`. To use your own development store:

1. Create a development store in the [Shopify Dev Dashboard](https://shopify.dev/docs/api/development-stores) — tick **Generate test data** to get products, collections, customers and orders without setting anything up.
2. Install the **Headless** sales channel (or create a custom app with the `unauthenticated_read_product_listings`, `unauthenticated_read_product_inventory`, `unauthenticated_write_checkouts` and `unauthenticated_read_checkouts` scopes) and copy the **public** Storefront access token.
3. Copy `.env.example` to `.env` and set:

   ```bash
   VITE_SHOPIFY_STOREFRONT_API_URL=https://<shop>.myshopify.com/api/2026-07/graphql.json
   VITE_SHOPIFY_STOREFRONT_TOKEN=<public storefront access token>
   VITE_HOSTED_CHECKOUT=true   # "Secure checkout" now opens Shopify's checkout (cart.checkoutUrl)
   VITE_STORE_PASSWORD_HINT=   # optional: your dev store's password, shown next to the checkout button
   ```

4. For customer accounts, open the Headless channel → your storefront → **Customer Account API** and, under _Application setup_, register where Shopify may send customers back:

   | Setting              | Value                                                                                                           |
   | -------------------- | --------------------------------------------------------------------------------------------------------------- |
   | Callback URI(s)      | `https://<host>/luma-shopify-storefront/` (and `http://localhost:5173/luma-shopify-storefront/` for local work) |
   | JavaScript origin(s) | `https://<host>` (and `http://localhost:5173`)                                                                  |
   | Logout URI           | `https://<host>/luma-shopify-storefront/`                                                                       |

   Then add the shop id (the number in the API endpoints shown on that page) and the client id to `.env`:

   ```bash
   VITE_SHOPIFY_SHOP_ID=<shop id>
   VITE_SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID=<client id>
   ```

   The store must use **new customer accounts** (Settings → Customer accounts), which is the default for development stores. Without these two variables the account area simply hides sign-in.

The GitHub Pages workflow reads the same values from repository variables, so the live demo can switch stores without a code change.

## Referral attribution (direct sales)

Direct-sales and MLM brands need every order attributed to the distributor who made the sale. The storefront handles the buyer side of that: a link such as `https://grandow.github.io/luma-shopify-storefront/?ref=ANA123` stores the code in the browser (`features/referral`), the cart carries it as the `ref` attribute — set at `cartCreate` for new carts, or with `cartAttributesUpdate` when the code arrives after the cart exists — and Shopify copies cart attributes onto the order as note attributes. The shopper sees who the order is credited to in the bag and can remove it, and a shopper who was given the code but not the link can type it in the bag (`ReferralCodeForm`). The storefront only checks the code's format; whether it belongs to an active distributor is decided by the back office, so nothing about distributors is exposed publicly.

The merchant side lives in a companion custom app, [luma-commission-bridge](https://github.com/GRandow/luma-commission-bridge): it receives `orders/paid` webhooks, resolves the distributor (a metaobject with their own rate), calculates the commission, writes it back to the order through the Admin GraphQL API and hands it to a commission engine with retries.

## Email marketing (Klaviyo)

Klaviyo's Shopify integration syncs customers, orders, checkouts and the catalog on the server side, so flows such as abandoned checkout work with this storefront unchanged. What a headless storefront has to add is the browsing side, which a Shopify theme gets from Klaviyo's app embed. `services/klaviyo` and `features/marketing` provide it:

- **Onsite tracking.** klaviyo.js ("Active on Site") with **Viewed Product** and recently viewed items on product pages, and **Added to Cart** after every successful add, built from the cart Shopify returns (`$value`, the added item, every line). Property names follow Klaviyo's guides, so its browse-abandonment and added-to-cart flow templates work as published. Calls go through the same queue Klaviyo's install snippet creates, and the script itself is only requested once the page has loaded and the browser is idle, which keeps it off the critical rendering path.
- **Identification.** Signed-in customers are identified from the ID token Shopify issues at sign-in (no extra request), and newsletter or back-in-stock sign-ups identify the browser, so later events land on the right profile.
- **Newsletter.** The footer form subscribes through the client API (`POST /client/subscriptions`) with email marketing consent and the list id; the list decides single or double opt-in. A remembered distributor code is saved as the `referral_code` profile property, so subscribers can be segmented by the distributor who brought them.
- **Back in stock.** Sold-out variants offer an email alert (`POST /client/back-in-stock-subscriptions`) for the variant in Klaviyo's Shopify catalog (`$shopify:::$default:::<variant id>`); a Back in Stock flow in Klaviyo sends the email once Shopify reports stock again.

Only Klaviyo's **public** API key (the six-character site id) is used, together with the list id; both are meant for browsers. The private key never belongs in a frontend bundle. Without a public key the integration is switched off and the storefront renders as before.

To connect an account:

1. In Klaviyo, connect the Shopify store (Integrations → Shopify) and create the list for the newsletter.
2. Set `VITE_KLAVIYO_PUBLIC_KEY` (Settings → API keys) and `VITE_KLAVIYO_LIST_ID` (the list's Settings tab) in `.env`, and as repository variables for the GitHub Pages build.
3. Build the flows in Klaviyo: Welcome Series (the list), Browse Abandonment (Viewed Product), Added to Cart, Abandoned Checkout (Shopify's Checkout Started) and Back in Stock (Subscribed to Back in Stock). Klaviyo-hosted sign-up forms can be published on the site too, since klaviyo.js renders them.

**Trying it locally.** Onsite tracking needs an https page: klaviyo.js calls Klaviyo's API with the page's own protocol, and over http `a.klaviyo.com` answers with a redirect that browsers refuse for these cross-origin requests, so the browser is never identified and its events are dropped. `npm run dev:https` serves the app at `https://localhost:5173/luma-shopify-storefront/` with a self-signed certificate (accept the browser's warning once), and the development build says so in the console when it runs on http. The newsletter and back-in-stock forms call the client API over https themselves, so they work either way.

This demo loads klaviyo.js for every visitor. A store selling into regions that require consent for marketing cookies should load it only after consent (Shopify's Customer Privacy API or a consent banner).

## Roadmap

- Address book editing (`customerAddressCreate` / `customerAddressUpdate` on the Customer Account API)
- Cursor-based pagination and server-side filters (`products(query:)`, `filters` on collections)
- Predictive search in the header (`predictiveSearch`)
- Market/currency selection (`@inContext`)
- Load Framer Motion lazily (`LazyMotion`): it is a large share of the main bundle, and the next step to lift mobile Lighthouse performance above 90

## About

Built as part of my portfolio as a Shopify developer to show a real headless Shopify integration: Storefront API modelling, Cart API state management, a Customer Account API sign-in done by the book (OAuth 2.0 + PKCE), the buyer side of referral attribution for direct-sales brands, email marketing with Klaviyo through its client APIs, responsive CDN images and a componentised React front end, tested end to end with Playwright, axe-core and Lighthouse CI.
