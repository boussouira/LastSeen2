/** Only bounded public catalog route classes are retained; private paths are redacted. */
export function publicPagePath(raw: string): string {
  try {
    const url = new URL(raw);
    if (!["https:", "http:"].includes(url.protocol)) return "/[redacted]";
    const path = url.pathname;
    if (path === "/" || path === "/cart") return path;
    if (/^\/(products|collections)\/[a-zA-Z0-9_-]{1,160}\/?$/.test(path)) return path;
    return "/[redacted]";
  } catch { return "/[redacted]"; }
}
