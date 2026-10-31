export const attributeTypes = ["TEXT", "NUMBER", "BOOLEAN", "DATE"] as const;
export type AttributeType = (typeof attributeTypes)[number];
export function parseAttribute(type: AttributeType, raw: string): string | number | boolean {
  if (type === "TEXT") {
    if (raw.length > 1000) throw new Error("Text must be 1,000 characters or fewer.");
    return raw;
  }
  if (type === "NUMBER") {
    if (!raw.trim() || !Number.isFinite(Number(raw))) throw new Error("Enter a valid number.");
    return Number(raw);
  }
  if (type === "BOOLEAN") {
    if (raw !== "true" && raw !== "false") throw new Error("Use true or false.");
    return raw === "true";
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw) || Number.isNaN(Date.parse(raw)) || new Date(raw).toISOString().slice(0, 10) !== raw)
    throw new Error("Enter a real date as YYYY-MM-DD.");
  return raw;
}
export function validateDefinition(key: string, name: string, type: string) {
  if (!/^[a-z][a-z0-9_]{0,63}$/.test(key)) throw new Error("Key must start with a lowercase letter and use only lowercase letters, numbers and underscores (64 characters maximum).");
  if (!name.trim() || name.length > 100) throw new Error("Name is required (100 characters maximum).");
  if (!attributeTypes.includes(type as AttributeType)) throw new Error("Choose a supported attribute type.");
}
