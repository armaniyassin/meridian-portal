import Insights from "@/components/pages/Insights";
import DisclaimerFooter from "@/components/DisclaimerFooter";

export const metadata = { title: "Insights | Meridian", description: "Plain-language explainers on bonds, equities, currencies and macro, and words from great investors." };

export default function Page() {
  return (<><Insights /><DisclaimerFooter /></>);
}
