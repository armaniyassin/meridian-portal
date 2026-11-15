import type { MetadataRoute } from "next";
import { LESSONS } from "@/lib/academy";
import { ARTICLES } from "@/lib/content";
import { INDICATORS, INSTRUMENTS } from "@/lib/seo-catalog";
import { abs } from "@/lib/site";

const GROUPS = ["bonds", "indices", "currencies", "commodities", "stocks", "macro"];
/** Only pages that carry data are listed; noindex symbols stay out. No lastModified: it would be a guess. */
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "/", "/markets", "/sentiment", "/academy", "/news", "/insights", "/brief", "/indicators", "/pricing", "/data-sources",
    ...GROUPS.map((g) => `/markets/${g}`),
    ...INSTRUMENTS.filter((i) => i.indexable).map((i) => `/markets/${i.slug}`),
    ...INDICATORS.map((i) => `/indicators/${i.slug}`),
    ...LESSONS.map((l) => `/academy/${l.slug}`),
    ...ARTICLES.map((a) => `/insights/${a.id}`),
  ];
  return paths.map((p) => ({ url: abs(p) }));
}
