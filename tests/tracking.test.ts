import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
const sdk = readFileSync(new URL("../extensions/winc-theme/assets/winc-sdk.js", import.meta.url), "utf8");
function fixture(consent = false, endpoint = "https://collector.example/events") {
  const requests: Array<{ kind: string; authenticationHint: string; anonymousId: string }> = [];
  const data = new Map<string, string>();
  const listeners: Record<string, () => void> = {};
  let allowed = consent;
  let sequence = 0;
  const config = { dataset: { endpoint, siteKey: "public-site", customerHint: "123" } };
  const window: {
    crypto: { randomUUID: () => string };
    Shopify: { customerPrivacy: { analyticsProcessingAllowed: () => boolean } };
    addEventListener: () => void;
    WinC?: { track: (name: string) => boolean; setAttributes: (values: object) => boolean; reset: () => void };
  } = {
    crypto: { randomUUID: () => `id-${++sequence}` },
    Shopify: { customerPrivacy: { analyticsProcessingAllowed: () => allowed } },
    addEventListener: () => {},
  };
  runInNewContext(sdk, {
    window, document: { getElementById: () => config, addEventListener: (name: string, fn: () => void) => { listeners[name] = fn; } },
    sessionStorage: { getItem: (key: string) => data.get(key), setItem: (key: string, value: string) => data.set(key, value), removeItem: (key: string) => data.delete(key) },
    fetch: (_url: string, options: { body: string }) => { requests.push(JSON.parse(options.body)); return Promise.resolve({ ok: true }); },
    URL, Date,
  });
  return { window, requests, data, consent: (value: boolean) => { allowed = value; listeners.visitorConsentCollected(); } };
}
test("theme SDK does not collect or store before analytics permission", () => {
  const f = fixture();
  assert.equal(f.window.WinC!.track("button_clicked"), false);
  assert.equal(f.requests.length, 0);
  assert.equal(f.data.size, 0);
});
test("consent grant collects context; withdrawal clears local segment and stops sends", () => {
  const f = fixture();
  f.consent(true);
  assert.equal(f.requests[0].kind, "context_observed");
  assert.equal(f.requests[0].authenticationHint, "signed_in_unverified");
  assert.equal(JSON.stringify(f.requests).includes('"123"'), false);
  assert.equal(f.window.WinC!.setAttributes({ plan: "pro", score: 0 }), true);
  const count = f.requests.length;
  f.consent(false);
  assert.equal(f.data.size, 0);
  assert.equal(f.window.WinC!.track("button_clicked"), false);
  assert.equal(f.requests.length, count);
});
test("custom SDK does not emit duplicate standard page events and bounds data", () => {
  const f = fixture(true);
  assert.throws(() => f.window.WinC!.track("page_viewed"));
  assert.throws(() => f.window.WinC!.setAttributes({ nested: {} }));
  assert.throws(() => f.window.WinC!.setAttributes({ score: Infinity }));
});
test("reset rotates segment and removes authentication hint", () => {
  const f = fixture(true);
  const prior = f.requests[0].anonymousId;
  f.window.WinC!.reset();
  f.window.WinC!.track("after_logout");
  assert.notEqual(f.requests[1].anonymousId, prior);
  assert.equal(f.requests[1].authenticationHint, "anonymous");
});
test("insecure collectors are disabled", () => {
  const f = fixture(true, "http://collector.example/events");
  assert.equal(f.window.WinC, undefined);
  assert.equal(f.requests.length, 0);
});

import { publicPagePath } from "../extensions/winc-pixel/src/path.ts";
test("pixel keeps only public catalog path classes", () => {
  assert.equal(publicPagePath("https://store.example/products/shirt?email=private#secret"), "/products/shirt");
  assert.equal(publicPagePath("https://store.example/account/reset/123/token"), "/[redacted]");
  assert.equal(publicPagePath("https://store.example/checkouts/token"), "/[redacted]");
  assert.equal(publicPagePath("https://store.example/pages/private-name"), "/[redacted]");
  assert.equal(publicPagePath("javascript:alert(1)"), "/[redacted]");
});
