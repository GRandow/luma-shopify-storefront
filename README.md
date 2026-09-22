# Luma Storefront

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite)
![Shopify Storefront API](https://img.shields.io/badge/Shopify-Storefront%20API-96BF48?logo=shopify&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-06B6D4?logo=tailwindcss)
![CI](https://github.com/GRandow/luma-shopify-storefront/actions/workflows/ci.yml/badge.svg)

A headless Shopify storefront built with React, TypeScript and Vite. Catalog, collections, search and the cart come from the **Shopify Storefront API (GraphQL)**; the UI is a custom React front end with wishlist, product comparison, quick view and a demo checkout.

🚀 **Live demo:** https://grandow.github.io/luma-shopify-storefront/

Out of the box the app talks to [mock.shop](https://mock.shop), Shopify's public Storefront API sandbox, so it runs without a store or an access token. Pointing it at a real (development) store is a matter of two environment variables.

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
- Demo multi-step checkout (React Hook Form + Zod) that can be swapped for Shopify's hosted checkout with one flag
- Dark mode, accessible dialogs and keyboard-friendly filters

## Tech stack

React 19 · TypeScript · Vite · React Router · TanStack Query · Zustand · Tailwind CSS · React Hook Form · Zod · Vitest + Testing Library

## Architecture

```
src/
├─ services/storefront/   GraphQL client, documents (fragments/queries/mutations), raw types and adapters
│  ├─ client.ts           storefrontRequest(): fetch wrapper, token header, GraphQL error handling
│  ├─ queries.ts          ProductFields / CartFields fragments and every operation the app uses
│  └─ adapters.ts         Storefront API payloads → app domain model (Product, Collection, Cart)
├─ services/              product-service.ts (catalog) · cart-service.ts (Cart API) · auth-service.ts (demo login)
├─ features/
│  ├─ products/           queries (TanStack), client-side filters, variant selection, cards, gallery
│  ├─ cart/               cart-queries.ts (useCart / useAddToCart / …) · cart-store.ts (persisted cart id) · CartDrawer
│  ├─ wishlist/ discovery/ theme/ auth/  Zustand stores
│  └─ checkout/           form schema for the demo checkout
├─ types/                 Domain model consumed by the UI (product.ts, cart.ts, user.ts)
└─ pages/                 Route components
```

A few decisions worth calling out:

- **Adapters between API and UI.** Components never see Storefront API payloads. `adapters.ts` turns them into a small domain model (money as numbers, flattened option values, a resolved compare-at price), so a schema change touches one file.
- **The cart lives in Shopify.** The browser only stores the cart id (`localStorage`). Reads and writes go through TanStack Query, and every mutation replaces the cached cart with the payload Shopify returns — no local price maths. An expired cart (Shopify drops them after inactivity) is detected from the `cartId` user error and transparently recreated.
- **Client-side refinement on top of server queries.** Search hits Shopify's `search` query and collections load through `collection(handle:)`; price ceiling, availability and sorting are refined locally because the catalog is small. Cursor-based pagination is the next step for larger stores.
- **Images.** `ProductImage` builds a `srcset` from Shopify CDN resizes (`?width=`), so a 4096px source is never shipped to a 300px card.
- **Products with options** open the quick view instead of silently adding a default variant; option combinations that do not exist as variants are disabled, sold-out ones are struck through.

## Getting started

Requires Node.js 22 or newer (`nvm use` picks the version from `.nvmrc`).

```bash
npm install
npm run dev
```

Other scripts: `npm run build`, `npm test`, `npm run lint`, `npm run typecheck`, `npm run format`.

Every push and pull request runs lint, formatting, typecheck, tests and the production build through GitHub Actions (`.github/workflows/ci.yml`); `main` is then deployed to GitHub Pages (`deploy.yml`).

## Connecting a Shopify store

By default `VITE_SHOPIFY_STOREFRONT_API_URL` points at `https://mock.shop/api`. To use your own development store:

1. Create a development store in the [Shopify Dev Dashboard](https://shopify.dev/docs/api/development-stores) — tick **Generate test data** to get products, collections, customers and orders without setting anything up.
2. Install the **Headless** sales channel (or create a custom app with the `unauthenticated_read_product_listings`, `unauthenticated_read_product_inventory`, `unauthenticated_write_checkouts` and `unauthenticated_read_checkouts` scopes) and copy the **public** Storefront access token.
3. Copy `.env.example` to `.env` and set:

   ```bash
   VITE_SHOPIFY_STOREFRONT_API_URL=https://<shop>.myshopify.com/api/2026-07/graphql.json
   VITE_SHOPIFY_STOREFRONT_TOKEN=<public storefront access token>
   VITE_HOSTED_CHECKOUT=true   # "Secure checkout" now opens Shopify's checkout (cart.checkoutUrl)
   ```

The GitHub Pages workflow reads the same values from repository variables, so the live demo can switch stores without a code change.

## Demo account

The customer area still uses a demo authentication backend (DummyJSON) while customer accounts move to Shopify's Customer Account API.

**Username:** `emilys` · **Password:** `emilyspass`

## Roadmap

- Customer accounts through the Customer Account API (login, addresses, order history)
- Cursor-based pagination and server-side filters (`products(query:)`, `filters` on collections)
- Predictive search in the header (`predictiveSearch`)
- Market/currency selection (`@inContext`)

## About

Built as part of my portfolio as a Shopify developer to show a real headless Shopify integration: Storefront API modelling, Cart API state management, responsive CDN images and a componentised React front end.
