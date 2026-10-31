/** Pure proposed identity policy, not a live Shopify login/logout integration.
 * A trusted server must verify identity; browser-supplied customer IDs are not proof.
 * Never merge all historical visits on a shared browser. Only link the active
 * anonymous segment after verified authentication and consent.
 */
export type Identity = { anonymousId: string; customerId: string | null };
export function transitionIdentity(current: Identity, customerId: string | null, freshAnonymousId: string): Identity {
  if (current.customerId === customerId) return current;
  if (current.customerId !== null && freshAnonymousId === current.anonymousId)
    throw new Error("Logout or account switching must rotate the anonymous identifier.");
  return { anonymousId: current.customerId === null ? current.anonymousId : freshAnonymousId, customerId };
}
export function safePagePath(url: string): string {
  const parsed = new URL(url);
  if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("Unsupported URL.");
  // Do not retain query strings, fragments or tokens; further path allowlisting is needed before ingestion.
  return parsed.pathname;
}
