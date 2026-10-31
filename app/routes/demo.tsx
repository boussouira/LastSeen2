import { useSearchParams } from "react-router";

// Isolated, fictional UI preview. Never reads or writes merchant data, and never
// bypasses authentication on /app or any production API.
const people = [
  { name: "Alex Morgan", email: "alex@example.com", known: true, sessions: 8, pages: 24, seen: "2 minutes ago", plan: "VIP" },
  { name: "Visitor 8f31a2c9", email: "Anonymous visitor", known: false, sessions: 1, pages: 5, seen: "6 minutes ago", plan: "—" },
  { name: "Jamie Chen", email: "jamie@example.com", known: true, sessions: 4, pages: 13, seen: "18 minutes ago", plan: "Returning" },
  { name: "Visitor 7c92d5b1", email: "Anonymous visitor", known: false, sessions: 2, pages: 7, seen: "34 minutes ago", plan: "—" },
  { name: "Sam Rivera", email: "sam@example.com", known: true, sessions: 12, pages: 38, seen: "1 hour ago", plan: "VIP" },
];
const fields = [
  ["Customer tier", "customer_tier", "Text", "Group customers by their relationship with your store."],
  ["Lifetime value", "lifetime_value", "Number", "Total customer value in your store currency."],
  ["VIP customer", "is_vip", "Boolean", "Flag customers for a more personal experience."],
  ["Next follow-up", "next_follow_up", "Date", "When your team should reconnect."],
];
export default function Demo() {
  const [params] = useSearchParams();
  const screen = params.get("screen") || "people";
  return <>
    <script src="https://cdn.shopify.com/shopifycloud/polaris.js" />
    <style>{`body { margin: 0; background: #f1f1f1; font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif; color: #303030; } .preview-header { height: 56px; background:#1a1a1a; display:flex; align-items:center; padding:0 24px; color:#fff; gap:12px; } .preview-mark {display:grid;place-items:center;width:28px;height:28px;border-radius:7px;background:#fff;color:#222;font-size:15px;font-weight:700} .preview-header strong {font-size:15px} .preview-header span {margin-left:auto;color:#b5b5b5;font-size:12px} .preview-shell{display:grid;grid-template-columns:210px 1fr; min-height:calc(100vh - 56px)} .preview-sidebar{padding:24px 12px;border-right:1px solid #dedede;background:#ebebeb} .preview-sidebar p{padding:0 12px;font-size:11px;letter-spacing:.06em;color:#6d7175;font-weight:600;text-transform:uppercase;margin:0 0 12px} .preview-sidebar a{display:block;text-decoration:none;color:#303030;font-size:13px;padding:10px 12px;border-radius:8px;margin-bottom:4px} .preview-sidebar a.active{background:#dedede;font-weight:600} .preview-main{padding:12px 24px 40px;max-width:1400px;width:100%;box-sizing:border-box} .preview-caption{font-size:11px;line-height:18px;color:#616161;text-align:center;margin:22px 0 0} @media(max-width:760px){.preview-shell{grid-template-columns:1fr}.preview-sidebar{display:none}.preview-main{padding:12px 8px 24px}}`}</style>
    <header className="preview-header"><div className="preview-mark">W</div><strong>Win C</strong><span>Sample store · Design preview</span></header>
    <div className="preview-shell"><nav className="preview-sidebar"><p>Win C</p><a className={screen !== "attributes" ? "active" : ""} href="/demo?screen=people">People</a><a className={screen === "attributes" ? "active" : ""} href="/demo?screen=attributes">Custom attributes</a></nav>
    <main className="preview-main">
    {screen === "attributes" ? <s-page heading="Custom attributes">
      <s-banner heading="Sample data preview" tone="info">Fictional fields for reviewing the interface. Nothing here changes a store.</s-banner>
      <s-section heading="Contact fields"><s-paragraph>Capture what matters about each person. Attributes describe their current state; events record what happened.</s-paragraph><s-table><s-table-header-row><s-table-header listSlot="primary">Name</s-table-header><s-table-header listSlot="labeled">Key</s-table-header><s-table-header listSlot="inline">Type</s-table-header></s-table-header-row><s-table-body>{fields.map(f=><s-table-row key={f[1]}><s-table-cell><s-text type="strong">{f[0]}</s-text><s-paragraph color="subdued">{f[3]}</s-paragraph></s-table-cell><s-table-cell>{f[1]}</s-table-cell><s-table-cell><s-badge>{f[2]}</s-badge></s-table-cell></s-table-row>)}</s-table-body></s-table></s-section>
      <s-section heading="Create an attribute"><s-stack direction="block" gap="base"><s-grid gridTemplateColumns="1fr 1fr" gap="base"><s-text-field label="Name" value="Preferred collection" /><s-text-field label="Key" value="preferred_collection" /></s-grid><s-select label="Type" value="TEXT"><s-option value="TEXT">Text</s-option><s-option value="NUMBER">Number</s-option><s-option value="BOOLEAN">Boolean</s-option><s-option value="DATE">Date</s-option></s-select><s-text-area label="Description" value="The collection this customer is most interested in." rows={2} /><s-button variant="primary" disabled>Create attribute</s-button></s-stack></s-section>
      <s-section slot="aside" heading="A field for every detail"><s-paragraph>Use text, numbers, booleans or dates. Keep field names clear and useful for your team.</s-paragraph><s-divider /><s-paragraph>Keys are permanent identifiers for your integration. Choose a stable key before collecting values.</s-paragraph></s-section>
    </s-page> : screen === "person" ? <s-page heading="Alex Morgan">
      <s-link slot="breadcrumb-actions" href="/demo?screen=people">People</s-link><s-banner heading="Sample data preview" tone="info">Fictional customer and activity. This preview does not indicate live tracking.</s-banner>
      <s-section heading="Activity timeline"><s-paragraph color="subdued">Latest visits and events · All times in UTC</s-paragraph>
        <s-section heading="Today · October 25, 2026"><s-stack direction="block" gap="base">
          <s-stack direction="inline" gap="small"><s-badge tone="success">Known customer</s-badge><s-text color="subdued">Visit started at 11:42</s-text></s-stack>
          <s-box padding="base" background="subdued" borderRadius="base"><s-text type="strong">Viewed a page</s-text><s-paragraph>/products/linen-overshirt</s-paragraph><s-text color="subdued">11:48:32 UTC</s-text></s-box>
          <s-box padding="base" background="subdued" borderRadius="base"><s-text type="strong">Added a product to cart</s-text><s-paragraph>Linen overshirt · Sand · Medium</s-paragraph><s-text color="subdued">11:46:10 UTC</s-text></s-box>
          <s-box padding="base" background="subdued" borderRadius="base"><s-text type="strong">Viewed a collection</s-text><s-paragraph>/collections/autumn-essentials</s-paragraph><s-text color="subdued">11:43:04 UTC</s-text></s-box>
        </s-stack></s-section>
        <s-section heading="October 23, 2026"><s-stack direction="block" gap="base"><s-text color="subdued">Visit started at 16:18</s-text><s-box padding="base" background="subdued" borderRadius="base"><s-text type="strong">Viewed a page</s-text><s-paragraph>/collections/new-arrivals</s-paragraph><s-text color="subdued">16:22:19 UTC</s-text></s-box></s-stack></s-section>
      </s-section>
      <s-section slot="aside" heading="Profile"><s-stack direction="block" gap="base"><s-avatar initials="AM" alt="Alex Morgan" /><s-badge tone="success">Known customer</s-badge><s-text>alex@example.com</s-text><s-divider /><s-paragraph><s-text type="strong">First seen</s-text><br/>October 11, 2026</s-paragraph><s-paragraph><s-text type="strong">Last seen</s-text><br/>2 minutes ago</s-paragraph><s-paragraph><s-text type="strong">8 visits</s-text> · 24 pages viewed</s-paragraph></s-stack></s-section>
      <s-section slot="aside" heading="Attributes"><s-stack direction="block" gap="base"><s-paragraph><s-text color="subdued">Customer tier</s-text><br/><s-text type="strong">VIP</s-text></s-paragraph><s-paragraph><s-text color="subdued">Lifetime value</s-text><br/><s-text type="strong">$428.00</s-text></s-paragraph><s-paragraph><s-text color="subdued">VIP customer</s-text><br/><s-badge tone="success">True</s-badge></s-paragraph><s-divider /><s-select label="Attribute" value="customer_tier"><s-option value="customer_tier">Customer tier (text)</s-option></s-select><s-text-field label="Value" value="VIP" /><s-button disabled>Save value</s-button></s-stack></s-section>
    </s-page> : <s-page heading="People">
      <s-banner heading="Sample data preview" tone="info">Fictional visitors for reviewing the interface. Live tracking has not been connected.</s-banner>
      <s-section heading="Visitors and customers"><s-paragraph>Understand each person’s visits, browsing history, and custom attributes.</s-paragraph><s-grid gridTemplateColumns="1fr 220px auto" gap="base" alignItems="end"><s-search-field label="Search people" placeholder="Name, email or visitor ID" /><s-select label="Identity" value="all"><s-option value="all">Everyone</s-option><s-option value="known">Known customers</s-option><s-option value="anonymous">Anonymous visitors</s-option></s-select><s-button>Search</s-button></s-grid></s-section>
      <s-section padding="none"><s-table><s-table-header-row><s-table-header listSlot="primary">Person</s-table-header><s-table-header listSlot="inline">Identity</s-table-header><s-table-header listSlot="labeled">Sessions</s-table-header><s-table-header listSlot="labeled">Last seen</s-table-header></s-table-header-row><s-table-body>{people.map(p=><s-table-row key={p.name}><s-table-cell><s-link href="/demo?screen=person">{p.name}</s-link><s-paragraph color="subdued">{p.email}</s-paragraph></s-table-cell><s-table-cell><s-badge tone={p.known ? "success" : "neutral"}>{p.known ? "Known" : "Anonymous"}</s-badge></s-table-cell><s-table-cell>{p.sessions}</s-table-cell><s-table-cell>{p.seen}</s-table-cell></s-table-row>)}</s-table-body></s-table></s-section>
      <s-stack direction="inline" gap="base"><s-text color="subdued">5 people · Sample dataset</s-text><s-button disabled>Previous</s-button><s-button disabled>Next</s-button></s-stack>
      <s-section slot="aside" heading="One person, the full picture"><s-paragraph>Open a profile to explore visits, page history, and the attributes your team cares about.</s-paragraph><s-divider /><s-paragraph>Anonymous visitors remain separate until a verified identity connection is available.</s-paragraph><s-link href="/demo?screen=attributes">Manage custom attributes</s-link></s-section>
    </s-page>}
    <p className="preview-caption">Win C · Mocked app pages rendered with Shopify Polaris web components · Not a live Shopify Admin session</p>
    </main></div>
  </>;
}
