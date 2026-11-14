import SentimentView, { type Row } from "@/components/pages/SentimentView";
import DisclaimerFooter from "@/components/DisclaimerFooter";
import { getStocks } from "@/lib/markets";

export const revalidate = 300;
export const metadata = { title: "Sentiment | Meridian", description: "Search a ticker for AI sentiment on recent headlines next to core fundamentals. Educational information only." };

export default async function Page() {
  let rows: Row[] = [];
  try {
    rows = (await getStocks()).map((r) => ({ t: r.label, s: r.group, price: r.ok ? r.item.price : null, chg: r.ok ? r.item.changePct : null }));
  } catch { /* leave empty: rows show a dash */ }
  return (<><SentimentView rows={rows} /><DisclaimerFooter /></>);
}
