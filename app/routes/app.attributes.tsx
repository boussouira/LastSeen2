import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useFetcher, useLoaderData } from "react-router";
import { Prisma } from "@prisma/client";
import db from "../db.server";
import { authenticate } from "../shopify.server";
import { attributeTypes, validateDefinition, type AttributeType } from "../lib/attributes";
export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  return { definitions: await db.attributeDefinition.findMany({ where: { shop: session.shop }, orderBy: { name: "asc" }, take: 100 }) };
}
export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const data = await request.formData();
  const key = String(data.get("key") || "").trim();
  const name = String(data.get("name") || "").trim();
  const type = String(data.get("type") || "");
  const description = String(data.get("description") || "").trim();
  try { validateDefinition(key, name, type); if(description.length > 500) throw new Error("Description must be 500 characters or fewer."); }
  catch (error) { return { error: (error as Error).message, saved: false }; }
  try {
    await db.attributeDefinition.create({ data: { shop: session.shop, key, name, type: type as AttributeType, description } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && (error as { code?: string }).code === "P2002") return { error: "This attribute key already exists.", saved: false };
    throw error;
  }
  return { saved: true, error: null };
}
export default function Attributes() {
  const { definitions } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const busy = fetcher.state !== "idle";
  return <s-page heading="Custom attributes">
    <s-section heading="Contact fields"><s-paragraph>Attributes describe a person’s current state, such as their plan or VIP status. Events record what happened and when.</s-paragraph>
      {definitions.length ? <s-table><s-table-header-row><s-table-header listSlot="primary">Name</s-table-header><s-table-header listSlot="labeled">Key</s-table-header><s-table-header listSlot="inline">Type</s-table-header></s-table-header-row><s-table-body>{definitions.map(d => <s-table-row key={d.id}><s-table-cell>{d.name}</s-table-cell><s-table-cell>{d.key}</s-table-cell><s-table-cell>{d.type.toLowerCase()}</s-table-cell></s-table-row>)}</s-table-body></s-table> : <s-paragraph>No custom attributes yet. Create your first field below.</s-paragraph>}
    </s-section>
    <s-section heading="Create an attribute">
      {fetcher.data?.error && <s-banner tone="critical">{fetcher.data.error}</s-banner>}
      {fetcher.data?.saved && !busy && <s-banner tone="success">Attribute created.</s-banner>}
      <fetcher.Form method="post"><s-stack direction="block" gap="base">
        <s-text-field label="Name" name="name" required maxLength={100} placeholder="Customer plan" />
        <s-text-field label="Key" name="key" required maxLength={64} placeholder="customer_plan" details="Permanent lowercase identifier. Keys and types cannot be changed in this version." />
        <s-select label="Type" name="type" value="TEXT">{attributeTypes.map(type => <s-option key={type} value={type}>{type.toLowerCase()}</s-option>)}</s-select>
        <s-text-area label="Description" name="description" maxLength={500} />
        <s-button type="submit" variant="primary" loading={busy} disabled={busy}>Create attribute</s-button>
      </s-stack></fetcher.Form>
    </s-section>
  </s-page>;
}
