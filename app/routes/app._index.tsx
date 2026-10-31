import type { LoaderFunctionArgs } from "react-router";
import { Form, useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { parseAttribute } from "../lib/attributes";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").slice(0, 100);
  const page = Math.max(1, Math.min(10000, Math.floor(Number(url.searchParams.get("page"))) || 1));
  const kind = url.searchParams.get("kind") || "all";
  const attribute = url.searchParams.get("attribute") || "";
  const value = url.searchParams.get("value") || "";
  const definitions = await db.attributeDefinition.findMany({ where: { shop: session.shop }, orderBy: { name: "asc" }, take: 100 });
  const definition = definitions.find(d => d.id === attribute);
  let attributeFilter = {};
  let filterError: string | null = null;
  if (attribute) {
    if (!definition) filterError = "Choose an existing attribute.";
    else try { attributeFilter = { attributes: { some: { definitionId: attribute, shop: session.shop, value: { equals: parseAttribute(definition.type, value) } } } }; }
    catch (error) { filterError = (error as Error).message; }
  }
  const where = { ...attributeFilter, shop: session.shop, ...(kind === "known" ? { externalId: { not: null } } : kind === "anonymous" ? { externalId: null } : {}), ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" as const } }, { email: { contains: q, mode: "insensitive" as const } }, { id: { contains: q } }] } : {}) };
  const [contacts, total] = filterError ? [[], 0] : await Promise.all([
    db.contact.findMany({ where, orderBy: [{ lastSeen: "desc" }, { id: "asc" }], skip: (page - 1) * 25, take: 25, include: { _count: { select: { sessions: true } } } }),
    db.contact.count({ where }),
  ]);
  return { contacts, total, q, page, kind, attribute, value, definitions, filterError };
}
export default function People() {
  const { contacts, total, q, page, kind, attribute, value, definitions, filterError } = useLoaderData<typeof loader>();
  const pageUrl = (p: number) => `/app?${new URLSearchParams({ q, kind, attribute, value, page: String(p) })}`;
  return <s-page heading="People">
    <s-banner heading="Tracking setup is not connected" tone="info">This development scaffold does not collect live storefront activity yet. Connect and validate tracking before installing on a merchant store.</s-banner>
    <s-section heading="Visitors and customers">
      <s-paragraph>Understand each person’s visits, browsing history, and custom attributes.</s-paragraph>
      <Form method="get"><s-stack gap="base"><s-grid gridTemplateColumns="1fr 1fr auto" gap="base" alignItems="end">
        <s-search-field label="Search people" name="q" value={q} placeholder="Name, email or visitor ID" />
        <s-select label="Identity" name="kind" value={kind}><s-option value="all">Everyone</s-option><s-option value="known">Known customers</s-option><s-option value="anonymous">Anonymous visitors</s-option></s-select>
        <s-button type="submit">Search</s-button>
      </s-grid><s-grid gridTemplateColumns="1fr 1fr" gap="base">
        <s-select label="Custom attribute" name="attribute" value={attribute}><s-option value="">Any attribute</s-option>{definitions.map(d => <s-option key={d.id} value={d.id}>{d.name} ({d.type.toLowerCase()})</s-option>)}</s-select>
        <s-text-field label="Equals" name="value" value={value} details="Exact typed match. Boolean: true or false. Date: YYYY-MM-DD." />
      </s-grid></s-stack></Form>{filterError && <s-banner tone="critical">{filterError}</s-banner>}
    </s-section>
    <s-section padding="none">
      {contacts.length ? <s-table>
        <s-table-header-row><s-table-header listSlot="primary">Person</s-table-header><s-table-header listSlot="inline">Identity</s-table-header><s-table-header listSlot="labeled">Sessions</s-table-header><s-table-header listSlot="labeled">Last seen (UTC)</s-table-header></s-table-header-row>
        <s-table-body>{contacts.map(contact => <s-table-row key={contact.id}>
          <s-table-cell><s-link href={`/app/people/${contact.id}`}>{contact.name || contact.email || `Visitor ${contact.id.slice(-8)}`}</s-link></s-table-cell>
          <s-table-cell><s-badge tone={contact.externalId ? "success" : "neutral"}>{contact.externalId ? "Known" : "Anonymous"}</s-badge></s-table-cell>
          <s-table-cell>{contact._count.sessions}</s-table-cell><s-table-cell>{new Date(contact.lastSeen).toISOString().replace("T", " ").slice(0,16)}</s-table-cell>
        </s-table-row>)}</s-table-body>
      </s-table> : <s-box padding="large"><s-heading>{q || kind !== "all" ? "No matching people" : "Your people will appear here"}</s-heading><s-paragraph>{q || kind !== "all" ? "Try another search or identity filter." : "After tracking is connected, visitors and known customers will appear with their activity. No sample customers have been mixed into your store data."}</s-paragraph></s-box>}
    </s-section>
    <s-stack direction="inline" gap="base"><s-text>{total} people</s-text>{page > 1 && <s-button href={pageUrl(page - 1)}>Previous</s-button>}{page * 25 < total && <s-button href={pageUrl(page + 1)}>Next</s-button>}</s-stack>
    <s-section slot="aside" heading="Setup checklist"><s-unordered-list><s-list-item>Define custom attributes</s-list-item><s-list-item>Connect PostgreSQL and run migrations</s-list-item><s-list-item>Validate consent-aware storefront tracking</s-list-item><s-list-item>Test identity changes and deletion requests</s-list-item></s-unordered-list><s-link href="/app/attributes">Manage custom attributes</s-link></s-section>
  </s-page>;
}
