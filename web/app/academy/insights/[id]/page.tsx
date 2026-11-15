import { redirect } from "next/navigation";

/** Short-lived address from an earlier version. Redirects to Insights. */
export default async function OldArticle({ params }: { params: Promise<{ id: string }> }) {
  redirect(`/insights/${(await params).id}`);
}
