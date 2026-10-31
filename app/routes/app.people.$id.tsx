import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useFetcher, useLoaderData } from "react-router";
import db from "../db.server";
import { authenticate } from "../shopify.server";
import { parseAttribute } from "../lib/attributes";
export async function loader({ request, params }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const contact = await db.contact.findFirst({ where: { id: params.id, shop: session.shop }, include: { attributes: { include: { definition: true } }, sessions: { orderBy: { startedAt: "desc" }, take: 20, include: { events: { orderBy: { occurredAt: "desc" }, take: 100 } } } } });
  if (!contact) throw new Response("Person not found", { status: 404 });
  return { contact, definitions: await db.attributeDefinition.findMany({ where: { shop: session.shop }, orderBy: { name: "asc" }, take: 100 }) };
}
export async function action({ request, params }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const form = await request.formData();
  const contact = await db.contact.findFirst({ where: { id: params.id, shop: session.shop }, select: { id: true } });
  const definition = await db.attributeDefinition.findFirst({ where: { id: String(form.get("definitionId") || ""), shop: session.shop } });
  if (!contact || !definition) throw new Response("Not found", { status: 404 });
  let value;
  try { value = parseAttribute(definition.type, String(form.get("value") ?? "")); }
  catch (error) { return { error: (error as Error).message, saved: false }; }
  await db.attributeValue.upsert({ where: { shop_contactId_definitionId: { shop: session.shop, contactId: contact.id, definitionId: definition.id } }, create: { shop: session.shop, contactId: contact.id, definitionId: definition.id, value }, update: { value } });
  return { saved: true, error: null };
}
const time = (d: string | Date) => new Date(d).toISOString().replace("T", " ").slice(0, 19) + " UTC";
export default function Person() {
  const { contact, definitions } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  return <s-page heading={contact.name || contact.email || `Visitor ${contact.id.slice(-8)}`}>
    <s-link slot="breadcrumb-actions" href="/app">People</s-link>
    <s-section heading="Activity timeline"><s-paragraph>Latest 20 sessions, up to 100 events per session. Timestamps are UTC.</s-paragraph>
      {contact.sessions.length ? contact.sessions.map(visit => <s-section key={visit.id} heading={`Visit · ${time(visit.startedAt)}`}>
        {visit.events.length ? <s-ordered-list>{visit.events.map(event => <s-list-item key={event.id}><s-text type="strong">{event.kind}</s-text>{event.path ? ` · ${event.path}` : ""}<s-paragraph color="subdued">{time(event.occurredAt)}</s-paragraph></s-list-item>)}</s-ordered-list> : <s-paragraph>No events in this visit.</s-paragraph>}
      </s-section>) : <s-paragraph>No activity recorded yet.</s-paragraph>}
    </s-section>
    <s-section slot="aside" heading="Profile"><s-badge tone={contact.externalId ? "success" : "neutral"}>{contact.externalId ? "Known customer" : "Anonymous visitor"}</s-badge><s-paragraph>{contact.email || "No email collected"}</s-paragraph><s-paragraph>First seen: {time(contact.firstSeen)}</s-paragraph><s-paragraph>Last seen: {time(contact.lastSeen)}</s-paragraph></s-section>
    <s-section slot="aside" heading="Attributes">{contact.attributes.map(a => <s-paragraph key={a.id}><s-text type="strong">{a.definition.name}: </s-text>{String(a.value)}</s-paragraph>)}
      {fetcher.data?.error && <s-banner tone="critical">{fetcher.data.error}</s-banner>}{fetcher.data?.saved && <s-banner tone="success">Attribute saved.</s-banner>}
      {definitions.length ? <fetcher.Form method="post"><s-stack gap="base"><s-select label="Attribute" name="definitionId">{definitions.map(d => <s-option key={d.id} value={d.id}>{d.name} ({d.type.toLowerCase()})</s-option>)}</s-select><s-text-field label="Value" name="value" details="Boolean: true or false. Date: YYYY-MM-DD." /><s-button type="submit" loading={fetcher.state !== "idle"} disabled={fetcher.state !== "idle"}>Save value</s-button></s-stack></fetcher.Form> : <s-link href="/app/attributes">Create an attribute</s-link>}
    </s-section>
  </s-page>;
}
