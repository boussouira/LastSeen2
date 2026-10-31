import { test } from "node:test";
import assert from "node:assert/strict";
import { parseAttribute, validateDefinition } from "../app/lib/attributes.ts";
import { transitionIdentity, safePagePath } from "../app/lib/identity.ts";
test("attribute types preserve false and zero", () => {
  assert.equal(parseAttribute("BOOLEAN", "false"), false);
  assert.equal(parseAttribute("NUMBER", "0"), 0);
  assert.equal(parseAttribute("TEXT", "Pro"), "Pro");
  assert.equal(parseAttribute("DATE", "2024-02-29"), "2024-02-29");
});
test("invalid typed values are rejected", () => {
  for (const raw of ["", "Infinity", "NaN"]) assert.throws(() => parseAttribute("NUMBER", raw));
  assert.throws(() => parseAttribute("BOOLEAN", "yes"));
  assert.throws(() => parseAttribute("DATE", "2025-02-29"));
  assert.throws(() => validateDefinition("Bad key", "Plan", "TEXT"));
  assert.throws(() => validateDefinition("plan", "Plan", "OBJECT"));
});
test("logout and account switching rotate identity", () => {
  const anonymous = { anonymousId: "a", customerId: null };
  assert.deepEqual(transitionIdentity(anonymous, "1", "unused"), { anonymousId: "a", customerId: "1" });
  assert.deepEqual(transitionIdentity({ anonymousId: "a", customerId: "1" }, null, "b"), { anonymousId: "b", customerId: null });
  assert.throws(() => transitionIdentity({ anonymousId: "a", customerId: "1" }, "2", "a"));
});
test("paths exclude query and fragment data", () => {
  assert.equal(safePagePath("https://store.example/products/shirt?email=private#token"), "/products/shirt");
  assert.throws(() => safePagePath("javascript:alert(1)"));
});
