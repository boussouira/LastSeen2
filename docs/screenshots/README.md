# Mocked app page previews

These pages contain entirely fictional data and illustrate the People index, a person’s timeline, and custom attributes. They are not screenshots of a connected Shopify store or evidence of live tracking.

Source: `app/routes/demo.tsx`.

- `/demo?screen=people`
- `/demo?screen=person`
- `/demo?screen=attributes`

The demo route is separate from authenticated `/app` routes and never loads or changes merchant data. It loads Shopify's Polaris web component CDN directly, without App Bridge.

The `.html` files are static server-rendered copies, generated with `node scripts/render-preview-html.cjs`. Serve them using a local HTTP server; internet access is needed for the Shopify Polaris CDN and font. Their controls are illustrative, not connected to persistence.

## Capture screenshots locally

Install Playwright and its Chromium browser in your development environment (`npm install --no-save playwright` and `npx playwright install chromium`), launch the app on port 5173, then run:

```
node scripts/capture-previews.cjs
```

The helper uses Playwright’s installed Chromium by default. Set `CHROMIUM_PATH` only to use a specific local Chromium executable. The script outputs `people.png`, `person.png`, and `attributes.png` here.

No PNG files were generated in the initial restricted environment: its process sandbox prevented Chromium startup, and the available cloud browser could not connect to the local server. The HTML previews were generated and the demo passed TypeScript checks; visual rendering is not yet verified.
