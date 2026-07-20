# Luma Storefront

Luma is a production-minded headless e-commerce storefront built with React 19 and the DummyJSON API. It provides a complete customer journey from product discovery through checkout in a premium, responsive interface.

The project demonstrates scalable frontend architecture, strict TypeScript, remote-data caching, persisted commerce state, accessible interactions, route-level code splitting, and focused automated testing.

## Demo

- Local URL: `http://localhost:5173`
- Username: `emilys`
- Password: `emilyspass`
- Promo code: `WELCOME10` for 10% off
- Promo code: `LUMA20` for 20% off orders of at least $150
- Payment: simulated; use any 16-digit card number and a future `MM/YY` expiry

## Features

### Storefront

- Editorial home page with hero, featured products, new arrivals, popular categories, promotional banner, newsletter, and footer
- Product listing with search, category filtering, price slider, rating filter, five sorting modes, pagination, and infinite browsing
- Product details with gallery, image zoom, price and discount, stock, reviews, quantity selection, sharing, and related recommendations
- Category index with product imagery and recently visited categories
- Responsive navigation, mobile menu, global search, dark mode, skeletons, toasts, and animated product grids

### Commerce

- Persisted cart with stock-aware quantities and undoable item removal
- Promo-code, shipping, tax, and order-total calculations
- Persisted wishlist and favorites
- Quick-view modal and three-product comparison tray
- Recently viewed, searched, purchased, and visited-category history
- Four-step checkout: customer, shipping, payment, and confirmation
- Order creation, saved addresses, and recently purchased products

### Account

- DummyJSON authentication with persisted login
- Protected checkout and profile routes
- User profile enrichment from the DummyJSON users endpoint
- Account overview, order history, saved addresses, and wishlist

### Engineering

- TanStack Query caching, retries, stale-time policy, and loading/error states
- Zustand stores with scoped local-storage persistence
- React Hook Form and Zod checkout validation
- Lazy route imports, Suspense, memoized product cards, memoized derived state, and lazy-loaded images
- Application error boundary and scroll restoration
- Semantic HTML, keyboard navigation, accessible labels, skip link, focus management, and reduced-motion support

## Tech Stack

| Area          | Technology                                                        |
| ------------- | ----------------------------------------------------------------- |
| UI            | React 19, TypeScript, Tailwind CSS 4, Framer Motion, Lucide React |
| Build         | Vite                                                              |
| Routing       | React Router                                                      |
| Server state  | TanStack Query, Axios                                             |
| Client state  | Zustand                                                           |
| Forms         | React Hook Form, Zod                                              |
| Notifications | Sonner                                                            |
| Testing       | Vitest, React Testing Library, Jest DOM, User Event               |
| Quality       | ESLint, TypeScript ESLint, Prettier                               |

## Getting Started

### Requirements

- Node.js 20 or newer
- npm 10 or newer

### Installation

```bash
npm install
```

The default API URL is already configured. To create a local environment file:

macOS or Linux:

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Start the development server:

```bash
npm run dev
```

Open `http://localhost:5173`.

## Environment Variables

| Variable       | Required | Default                 | Description            |
| -------------- | -------- | ----------------------- | ---------------------- |
| `VITE_API_URL` | No       | `https://dummyjson.com` | DummyJSON API base URL |

Only variables prefixed with `VITE_` are exposed to the browser. Do not place secrets in frontend environment variables.

## Available Scripts

```bash
npm run dev          # Start the Vite development server
npm run build        # Run strict TypeScript checks and create a production bundle
npm run preview      # Serve the production bundle locally
npm run lint         # Run typed ESLint rules with zero warnings allowed
npm run test         # Run all tests once with Vitest
npm run test:watch   # Run Vitest in watch mode
npm run format       # Format the repository with Prettier
npm run format:check # Verify formatting without changing files
```

## Application Routes

| Route                  | Page                      | Access        |
| ---------------------- | ------------------------- | ------------- |
| `/`                    | Home                      | Public        |
| `/products`            | Product listing           | Public        |
| `/products/:productId` | Product details           | Public        |
| `/categories`          | Category index            | Public        |
| `/cart`                | Shopping cart             | Public        |
| `/wishlist`            | Wishlist                  | Public        |
| `/login`               | Login                     | Public        |
| `/checkout`            | Multi-step checkout       | Authenticated |
| `/profile`             | Profile and order history | Authenticated |
| `*`                    | 404                       | Public        |

## Folder Structure

```text
src/
|-- app/          Application composition, providers, router, query policy, error boundary
|-- components/   Shared brand, layout, and accessible UI components
|-- features/     Domain modules for auth, cart, checkout, discovery, products, theme, wishlist
|-- hooks/        Reusable browser and lifecycle hooks
|-- layouts/      Route shells and global storefront composition
|-- pages/        Lazy route entry points that orchestrate feature modules
|-- services/     Typed Axios client and DummyJSON API adapters
|-- styles/       Tailwind entry point, design tokens, global styles, motion preferences
|-- test/         Test setup and reusable typed fixtures
|-- types/        Product, checkout, user, address, order, and API contracts
`-- utils/        Pure formatting, class-name, and pricing functions
```

### Folder Responsibilities

- `app/` is the composition root. It owns global providers, routing, query defaults, and unrecoverable error handling.
- `components/` contains application-wide visual building blocks. Shared UI components do not fetch remote data.
- `features/` owns business capabilities and their local components, hooks, schemas, queries, and stores.
- `hooks/` contains behavior reusable across unrelated features, such as route scroll restoration.
- `layouts/` composes persistent interface regions around routed pages.
- `pages/` contains thin route controllers. Pages coordinate features but avoid owning reusable domain rules.
- `services/` isolates HTTP configuration and endpoint-specific API calls from React.
- `styles/` owns design tokens, Tailwind configuration, global defaults, and accessibility-oriented motion behavior.
- `test/` configures the browser-like test runtime and centralizes fixtures.
- `types/` describes contracts shared across feature boundaries.
- `utils/` contains deterministic functions without React or network dependencies.

## Architecture Decisions

### Server State and Client State

TanStack Query owns remote API data, request deduplication, cache freshness, retries, and garbage collection. Zustand owns synchronous customer intent that must survive navigation or refresh: cart, session, wishlist, theme, comparison, and discovery history.

This split prevents server responses from being duplicated into a second client-side database.

### Feature-Based Boundaries

Business behavior is grouped by capability rather than file type. Product query keys and filters stay with products; checkout schemas stay with checkout; cart mutations stay with the cart store. Pages consume these public feature interfaces.

### Catalog Filtering

DummyJSON supports search, categories, sorting, and `limit/skip`. The catalog requests the complete matching remote result with `limit=0`, applies compound filters consistently, and then offers pagination or progressively revealed infinite browsing over the same filtered result.

A production search backend would move compound filtering, merchandising, and cursor pagination into a dedicated search service.

### Persistence and Security

Cart, wishlist, discovery state, theme, and the simulated session persist in local storage. This is appropriate for a demonstration API, but real authentication tokens should be managed by a backend-for-frontend through secure HTTP-only cookies.

Payment fields are validated in memory, never persisted, and discarded after simulated authorization.

### Accessibility

The storefront uses semantic landmarks, visible focus states, accessible names, keyboard-operable controls, form error associations, checkout-step focus management, a skip link, sufficient contrast, and reduced-motion overrides.

### Performance

- Every page is loaded through a lazy route chunk.
- Product cards use `React.memo`.
- Derived catalog lists and order totals use memoization.
- Product images below the fold use native lazy loading.
- TanStack Query avoids duplicate network work and caches reusable catalog data.
- Framer Motion animations run at the product-grid boundary and respect reduced-motion preferences.

## API Integration

The application uses these DummyJSON surfaces:

- `GET /products`
- `GET /products/:id`
- `GET /products/search?q=...`
- `GET /products/categories`
- `GET /products/category/:slug`
- `POST /auth/login`
- `GET /users/:id`

DummyJSON is a simulation API. Orders, addresses, cart changes, and discovery history are therefore modeled locally and are not written permanently to DummyJSON.

## Testing

The test suite covers:

- Cart item insertion, merging, stock caps, removal, and reset
- Subtotal, promotions, shipping, tax, and total calculations
- Product card semantics, cart action, and wishlist action
- Product filter interactions and reset behavior
- Customer, shipping, payment, and complete checkout validation

Run it with:

```bash
npm run test
```

Current result: 5 test files and 16 passing tests.

## Production Build

```bash
npm run build
npm run preview
```

The build performs a strict TypeScript project check before Vite generates the optimized, code-split bundle in `dist/`.

When deploying an SPA, configure the host to rewrite unknown paths to `/index.html` so direct navigation to routes such as `/products/1` works correctly.

## Screenshots

| Home                              | Catalog                              | Product                              |
| --------------------------------- | ------------------------------------ | ------------------------------------ |
| _Add `docs/screenshots/home.png`_ | _Add `docs/screenshots/catalog.png`_ | _Add `docs/screenshots/product.png`_ |

| Cart                              | Checkout                              | Profile                              |
| --------------------------------- | ------------------------------------- | ------------------------------------ |
| _Add `docs/screenshots/cart.png`_ | _Add `docs/screenshots/checkout.png`_ | _Add `docs/screenshots/profile.png`_ |

## Future Improvements

- Replace local order creation with a backend-for-frontend and idempotent payment intents
- Add a search index with facets, typo tolerance, cursors, and merchandising rules
- Add Playwright journeys, automated accessibility audits, visual regression tests, and performance budgets
- Support inventory reservations, product variants, multiple currencies, locale-aware taxes, and international addresses
- Serve responsive AVIF/WebP product media through an image CDN
- Add consent-aware analytics, experimentation hooks, and checkout observability

## License

This project is intended as an educational and portfolio reference. Product data and imagery are provided by DummyJSON.
