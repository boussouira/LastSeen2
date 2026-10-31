# Tracking architecture: two installation paths, one future collector

Status: reviewable development scaffold, not production tracking. No extension has been registered, installed, activated or deployed. No collector URL or public site key is configured. Do not enable these extensions against real shoppers yet.

## Implemented

- `extensions/winc-theme`: Shopify theme app extension with a merchant-controlled app embed (`target: body`). Uses a deferred theme asset, no theme-file modification. The block is disabled by default. `window.WinC.track(name, properties)`, `setAttributes(values)` and `reset()` form the initial JS SDK.
- `extensions/winc-pixel`: app web pixel in Shopify's strict sandbox. Requires analytics permission, not marketing permission. Observes page views, product views, add-to-cart, checkout started and checkout completed without forwarding raw checkout/product payloads.
- Theme code loads Shopify's Customer Privacy API if necessary and fails closed if it is unavailable. No identifier is read/written to session storage and no network event is sent until analytics processing is allowed. On withdrawal it deletes its own segment and stops subsequent events. No pre-consent replay queue exists.
- Pixel code also checks current analytics permission on every event and updates it via `visitorConsentCollected`.
- HTTPS collectors only, no cookie credentials, no authentication secrets in HTML or extension settings. Query strings and fragments are not sent by the pixel. Only root, cart and bounded product/collection paths are retained; account, checkout and all other paths become `/[redacted]`.

## Ownership and duplicates

The pixel is the sole source of standard page/commerce events. The theme SDK sends context observations, merchant custom events and custom attribute updates; it does not auto-send a second page view. Its custom API rejects reserved page and purchase event names. Every event carries a source-prefixed `sourceId`. The collector must enforce a unique `(shop, sourceId)` constraint. The pixel also has bounded in-memory suppression; that is not a substitute for server deduplication.

The theme SDK sends directly to the configured collector, not through Shopify's custom event bus. Shopify documents that custom events are visible to all subscribed pixels; publishing private custom attribute values on that shared bus would unnecessarily expose them.

The two browser identifiers are deliberately not silently merged. Pixel `clientId` and theme segment ID are different namespaces. A server-side, consent-aware linking protocol is still required. Until it exists, do not present them as a single verified person or double-count them in a combined unique-visitor metric.

## Identity limitations

Liquid's customer ID is used only as a local, untrusted account-context hint to rotate the theme segment when a later page renders a different account or logged-out state. The ID is not sent to the collector. Network events report only `anonymous` or `signed_in_unverified`. A boolean observation is not proof of customer identity. The SDK resets after 30 minutes of inactivity; storage is per tab. It does not promise cross-device recognition.

Call `WinC.reset()` after custom AJAX logout. Standard Shopify page navigation reads the new Liquid context. Back/forward-cache restoration clears stale identity hints. Account changes in another tab or custom client-side account flows are not reliably detected. There are no general login/logout events in the documented standard pixel event list. Verified identity linking needs a separately designed authenticated flow; never accept a browser-supplied customer ID as authorization. Historical anonymous segments must not be globally merged just because the same browser signs in.

## Before live activation

1. Provision and validate a collector. It must map public site keys to installations server-side, distinguish source namespaces, enforce origin allowlists where available, treat every client field as untrusted, apply request/body/rate limits, validate timestamps and defined custom attribute types, and implement deduplication. A public site key is not a secret and cannot authenticate a shopper or stop all forged analytics.
2. Add privacy controls: retention, deletion/export fulfillment, mandatory Shopify privacy webhooks, consent withdrawal behavior, documented processing purposes and minimal permitted payloads. Do not put secrets, payment data or unnecessary personal data in attributes.
3. Implement verified identity and cross-source linking separately. Keep post-logout events anonymous until new verified authentication.
4. Link the app to a development store and generate/register extension UIDs using Shopify CLI. Confirm current CLI config validation. The scaffold omits UIDs because no app account was created.
5. Review and request only required scopes. Activating an app pixel requires `write_pixels` and `read_customer_events`; these are not silently added to the app config. Review protected customer data requirements before accessing protected fields.
6. Activate the pixel via an authorized Admin API flow, and have the merchant enable the app embed in the theme editor. Test grant/deny/revoke consent, reloads, back/forward restoration, logout/account switching, checkout coverage, blocked storage/network, duplicates and multiple tabs on a real development store.
7. Add explicit retry/backoff and observability only after consent-safe queueing is designed. The current SDK is best-effort and drops failed network deliveries; no live delivery is claimed.

Generic non-Shopify installation remains future work. Do not copy this theme asset to another site and assume consent works: it currently depends on Shopify's privacy API.

## Checks performed

- JavaScript syntax check for theme asset.
- Shopify AI Toolkit Liquid/app-block validation passed for `tracking.liquid`.
- Six Node tests covering pre-consent behavior, consent withdrawal, bounded attributes, standard page-event exclusion, logout reset and insecure collector rejection.
- Standalone TypeScript check of pixel source against `@shopify/web-pixels-extension` 2.18.0.
- No dev-store execution, Shopify CLI extension registration, deployment or collector end-to-end test performed.

## Official references checked 2026-10-25

- [Theme app extension configuration](https://shopify.dev/docs/apps/build/online-store/theme-app-extensions/configuration)
- [Customer Privacy API](https://shopify.dev/docs/api/customer-privacy)
- [Pixel privacy](https://shopify.dev/docs/api/web-pixels-api/pixel-privacy)
- [Pixel customerPrivacy API](https://shopify.dev/docs/api/web-pixels-api/standard-api/customerprivacy)
- [Build app web pixels and required scopes](https://shopify.dev/docs/apps/build/marketing/build-web-pixels)
- [Standard pixel events](https://shopify.dev/docs/api/web-pixels-api/standard-events)
- [Custom event publishing and shared subscriber access](https://shopify.dev/docs/api/web-pixels-api/emitting-data)
