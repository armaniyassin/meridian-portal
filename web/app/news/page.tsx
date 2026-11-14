import NewsView from "@/components/pages/NewsView";
import DisclaimerFooter from "@/components/DisclaimerFooter";

export const metadata = { title: "News and insights | Meridian", description: "Plain-language explainers on bonds, equities, currencies and macro, with a live headline feed coming soon." };

export default function Page() {
  return (<><NewsView /><DisclaimerFooter /></>);
}
