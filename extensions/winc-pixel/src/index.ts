import { register } from "@shopify/web-pixels-extension";
import { publicPagePath } from "./path";

register(({ analytics, settings, init, customerPrivacy }) => {
  let privacy = init.customerPrivacy;
  customerPrivacy.subscribe("visitorConsentCollected", (event) => {
    privacy = event.customerPrivacy;
  });
  let endpoint: URL;
  try {
    endpoint = new URL(String(settings.endpoint || ""));
    if (endpoint.protocol !== "https:" || endpoint.username || endpoint.password) return;
  } catch { return; }
  const siteKey = String(settings.siteKey || "");
  if (!siteKey) return;
  const seen = new Set<string>();
  const events = ["page_viewed", "product_viewed", "product_added_to_cart", "checkout_started", "checkout_completed"] as const;
  for (const name of events) {
    analytics.subscribe(name, (event) => {
      if (!privacy.analyticsProcessingAllowed || seen.has(event.id)) return;
      seen.add(event.id);
      if (seen.size > 500) seen.delete(seen.values().next().value!);
      const path = publicPagePath(event.context.document.location.href);
      // Avoid raw URLs, query strings, checkout payloads, email, customer IDs and order data.
      const body = JSON.stringify({
        version: 1, source: "pixel", sourceId: `pixel:${event.id}`, siteKey,
        kind: event.name, occurredAt: event.timestamp, path,
        // This is not a verified customer identity and must not merge customer profiles.
        anonymousId: event.clientId,
      });
      void fetch(endpoint.href, {
        method: "POST", headers: { "Content-Type": "application/json" }, body,
        credentials: "omit", keepalive: true,
      }).catch(() => {});
    });
  }
});
