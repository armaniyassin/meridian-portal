import AcademyView from "@/components/pages/AcademyView";
import DisclaimerFooter from "@/components/DisclaimerFooter";

export const metadata = { title: "Academy | Meridian", description: "Level-based lessons and quizzes inspired by CFA-level curriculum. Level 1 is free." };

export default function Page() {
  return (<><AcademyView /><DisclaimerFooter /></>);
}
