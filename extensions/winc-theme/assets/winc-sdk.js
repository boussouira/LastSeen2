/* Win C theme app embed. No storage or collection before analytics permission.
 * This SDK owns custom events/attributes and identity boundary hints. The app
 * pixel owns standard page and commerce events, preventing duplicate page views.
 */
(() => {
  "use strict";
  if (window.WinC) return;
  const config = document.getElementById("winc-tracking-config");
  if (!config) return;
  let endpoint;
  try {
    endpoint = new URL(config.dataset.endpoint);
    if (endpoint.protocol !== "https:" || endpoint.username || endpoint.password) return;
  } catch { return; }
  const siteKey = config.dataset.siteKey;
  if (!siteKey) return;
  const storageKey = "winc.segment.v1";
  let current = null;
  let allowed = false;
  const uuid = () => window.crypto.randomUUID();
  const hint = () => config.dataset.customerHint || "anonymous";
  const mayTrack = () => window.Shopify?.customerPrivacy?.analyticsProcessingAllowed() === true;
  const clear = () => {
    current = null;
    try { sessionStorage.removeItem(storageKey); } catch { /* Storage may be blocked. */ }
  };
  const segment = () => {
    if (current) return current;
    try {
      const cached = JSON.parse(sessionStorage.getItem(storageKey) || "null");
      if (cached?.hint === hint() && typeof cached.id === "string" && cached.expiresAt > Date.now()) current = cached;
    } catch { /* Use an in-memory segment if storage is unavailable. */ }
    if (!current) current = { id: uuid(), hint: hint(), expiresAt: Date.now() + 30 * 60 * 1000 };
    try { sessionStorage.setItem(storageKey, JSON.stringify(current)); } catch { /* No persistence. */ }
    return current;
  };
  const send = (kind, properties = {}) => {
    if (!allowed || !mayTrack()) return false;
    const active = segment();
    if (active.expiresAt <= Date.now()) { clear(); return send(kind, properties); }
    active.expiresAt = Date.now() + 30 * 60 * 1000;
    try { sessionStorage.setItem(storageKey, JSON.stringify(active)); } catch { /* No persistence. */ }
    // Customer ID stays local as a rotation hint; it is never authoritative identity.
    const body = JSON.stringify({
      version: 1, source: "theme", sourceId: `theme:${uuid()}`, siteKey,
      anonymousId: active.id, kind, occurredAt: new Date().toISOString(),
      authenticationHint: hint() === "anonymous" ? "anonymous" : "signed_in_unverified",
      properties,
    });
    if (body.length > 8192) return false;
    // Deliberately no pre-consent queue, persistent queue, retry or cookie credentials.
    void fetch(endpoint.href, { method: "POST", headers: { "Content-Type": "application/json" }, body, credentials: "omit", keepalive: true }).catch(() => {});
    return true;
  };
  const scalarProperties = (input) => {
    if (!input || typeof input !== "object" || Array.isArray(input)) throw new TypeError("Use an attribute object.");
    const entries = Object.entries(input);
    if (entries.length > 20) throw new TypeError("At most 20 attributes per update.");
    for (const [key, value] of entries) {
      if (!/^[a-z][a-z0-9_]{0,63}$/.test(key) || !["string", "number", "boolean"].includes(typeof value)
          || (typeof value === "number" && !Number.isFinite(value)) || (typeof value === "string" && value.length > 1000))
        throw new TypeError("Attributes must use valid keys and bounded scalar values.");
    }
    return Object.fromEntries(entries);
  };
  window.WinC = Object.freeze({
    // Merchant-defined fields must be allowlisted and typed again by the server.
    setAttributes: (attributes) => send("attributes_updated", scalarProperties(attributes)),
    track: (name, properties = {}) => {
      if (!/^[a-z][a-z0-9_]{0,63}$/.test(name) || ["page_viewed", "checkout_completed"].includes(name))
        throw new TypeError("Use a custom event name; standard events belong to the pixel.");
      return send(`custom:${name}`, scalarProperties(properties));
    },
    // Reset on custom AJAX logout. It does not authenticate or identify anyone.
    reset: () => { clear(); config.dataset.customerHint = ""; },
  });
  const refreshConsent = () => {
    allowed = mayTrack();
    if (!allowed) clear();
    else send("context_observed");
  };
  document.addEventListener("visitorConsentCollected", refreshConsent);
  // A restored page may contain stale Liquid account context: never reuse its segment.
  window.addEventListener("pageshow", (event) => { if (event.persisted) { clear(); config.dataset.customerHint = ""; refreshConsent(); } });
  if (window.Shopify?.customerPrivacy) refreshConsent();
  else window.Shopify?.loadFeatures?.([{ name: "consent-tracking-api", version: "0.2" }], (error) => { if (!error) refreshConsent(); });
})();
