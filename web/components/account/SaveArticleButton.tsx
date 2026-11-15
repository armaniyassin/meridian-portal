import ToggleSave from "@/components/account/ToggleSave";

export default function SaveArticleButton({ id }: { id: string }) {
  return <ToggleSave table="saved_articles" keyCol="article_id" keyVal={id} off="Save article" on="✓ Saved" reason="to save this article"
    limitMsg="Free accounts save up to 10 articles. Pro, coming soon, removes the limit." doneOn="Article saved." doneOff="Removed from saved." />;
}
