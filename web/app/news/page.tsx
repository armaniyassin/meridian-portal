import NewsView from "@/components/pages/NewsView";
import DisclaimerFooter from "@/components/DisclaimerFooter";

export const metadata = { title: "News | Meridian", description: "The market stories that matter. The live headline feed is coming soon." };

export default function Page() {
  return (<><NewsView /><DisclaimerFooter /></>);
}
