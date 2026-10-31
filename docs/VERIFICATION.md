# Verification — October 25, 2026

Official template base: Shopify/shopify-app-template-react-router, commit `48b841a7746e1b08d1e6d8793b1208f3096e41d0`.

## Passed

- Dependency installation; package-lock.json retained for reproducibility.
- Prisma client generation, schema validation, and PostgreSQL migration SQL generation.
- `npm run typecheck` (entire project including demo and pixel).
- `npm run lint` (entire project).
- `npm test`: 10 tests passing. Typed values/invalid values; identity logout/account rotation policy; URL query stripping; theme consent gating and withdrawal; custom event limits; reset; insecure endpoints; pixel private-path redaction.
- `npm run build`: production client and server bundles.
- Shopify Polaris App Home validator: People list, contact detail and attributes routes passed.
- Shopify Liquid validator: theme app embed block passed.
- Pixel standalone TypeScript check passed.
- Independent source review: merchant-scoped queries and composite foreign keys, fake-data demo isolation, and pixel URL redaction. No remaining high-priority issue found within reviewed scaffold surface.

## Not verified / intentionally not implemented

- No PostgreSQL server was available: migration execution and live CRUD/database transaction behavior were not tested.
- No Shopify development app/store credentials: OAuth, embedded App Bridge behavior, installation, pixel activation, theme editor activation, permission grants, protected customer data, checkout collection and real customer accounts were not tested.
- No collector ingestion service or verified customer-identity bridge exists. Tracking is disabled by default. This is not an end-to-end analytics app yet.
- No production deployment, app listing, Built for Shopify application or certification.
- Mandatory public-app privacy webhook handlers, retention/export/redaction workflows and persistent authenticated ingestion are production blockers, not claimed features.
- Demo screenshots use fictional data and an isolated preview route, not a real Shopify admin/store.

Build emitted React Router v8 future-flag notices and empty server-only route chunk notices; the build exited successfully. Dependency installation reported inherited deprecations in the official template's toolchain. No claim of a full security audit or zero vulnerabilities.
