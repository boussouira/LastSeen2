# Win C — initial implementation

Provisional product name; not a published app. Built from Shopify's official React Router template. This is a reviewable development scaffold, not a production-ready analytics platform or a Built for Shopify certified app.

## Implemented

- Embedded Shopify-authenticated App Home with App Bridge and Polaris web components.
- People list with search, anonymous/known filtering, typed custom-attribute equality filters and 25-row pagination.
- Person detail with latest 20 sessions, up to 100 events per session, UTC timestamps and per-contact attribute editing.
- Custom attribute definitions: text, number, boolean and date; stable lowercase keys, descriptions, server validation and duplicate detection.
- PostgreSQL/Prisma persistence, tenant-scoped queries and composite foreign keys to prevent cross-shop relationships.
- Identity policy unit functions and tests. These are not connected to a live verified authentication source.
- Both pixel and theme app embed integration foundations. See tracking.md for boundaries and consent rules.

No sample records are inserted in merchant data. Screenshots/demo use separate fictional data. Authentication remains required on all /app routes and mutations.

## Run locally

1. Install Node >=22.12 and dependencies: `npm ci`.
2. Copy `.env.example` to `.env`; provide a local PostgreSQL DATABASE_URL. Do not commit secrets.
3. Run `npm run setup` to generate Prisma and apply the PostgreSQL migration to your chosen database.
4. Use Shopify CLI to link/create your own development app and set client ID, app URL and auth settings. Supply Shopify credentials through your local secure environment, not source files.
5. Run `npm run dev` using Shopify CLI and a development store. No partner app, store, OAuth grant or deployment was created during this implementation.
6. Type checks: `npm run typecheck`; tests: `npm test`; lint: `npm run lint`; production bundle: `npm run build`.

The official template's broad product-write scope and demo product mutation were removed. Do not add customer or pixel permissions until their concrete integration is implemented and approved.

## Next production milestones

- Implement authenticated/rate-limited ingestion, payload allowlists, source deduplication, sessionization, bot handling and consent-aware retention/deletion. Current public collection is deliberately not enabled.
- Verify supported customer identity sources for classic/new accounts, account switching and logout. Browser data is untrusted; never merge customer histories based solely on a browser-supplied ID, email or theme flag.
- Configure app pixel activation and permissions through the official APIs, theme app embed activation and protected customer data access where required.
- Implement mandatory compliance webhooks (data requests/customer redaction/shop redaction), audit retention and uninstall lifecycle. Template compliance placeholders are NOT implemented handlers.
- Add transactional/concurrency integration tests and live PostgreSQL tests. Verify session storage and expiry, OAuth, merchant isolation, CSRF/session token behavior and idempotency in a development store.
- Complete App Home UX tests in Shopify admin: embedded navigation, mobile behavior, back/forward, error/empty/loading states, keyboard/screen reader accessibility, repeated submissions and interrupted auth.
- Evaluate all current Built for Shopify criteria: UI alone does not earn the status.
- Generic website installation shares the future ingestion/identity contract but is not shipped here.

## Official references checked

- https://github.com/Shopify/shopify-app-template-react-router
- https://shopify.dev/docs/api/shopify-app-react-router/v0/entrypoints/appprovider
- https://shopify.dev/docs/apps/build/app-home/migrate-from-polaris-react
- https://shopify.dev/docs/api/app-home/v1.1/patterns/compositions/index-table
- https://shopify.dev/docs/api/web-pixels-api/pixel-privacy
- https://shopify.dev/docs/api/web-pixels-api/standard-events
- https://shopify.dev/docs/apps/launch/built-for-shopify

The standard pixel event catalog does not provide generic storefront login/logout events. Treat any identity integration as a separately verified feature.
