import { redirect } from "next/navigation";

/** Old address of the explainers. They now live under Insights, so old links keep working. */
export default async function OldArticle({ params }: { params: Promise<{ id: string }> }) {
  redirect(`/insights/${(await params).id}`);
}
