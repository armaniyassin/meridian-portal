/** Canonical origin used for canonical URLs, sitemap and OpenGraph. Set NEXT_PUBLIC_SITE_URL in production (e.g. https://meridianglobal.com). */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "") ||
  "http://localhost:3000"
).replace(/\/+$/, "");
export const SITE_NAME = "Meridian Global Macro";
export const abs = (path: string) => `${SITE_URL}${path}`;
export const utc = (iso: string) => new Date(iso).toISOString().replace("T", " ").slice(0, 16) + " UTC";
