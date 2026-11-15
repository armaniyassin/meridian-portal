import AskForm from "@/components/account/AskForm";
import JsonLd from "@/components/seo/JsonLd";
import { supabasePublic } from "@/lib/supabase/public";

type Q = { id: string; body: string; answer: string | null };

/** Published, answered questions for one page (public, indexable) plus the form to ask a new one. Questions are reviewed before they show. */
export default async function QuestionsSection({ targetType, targetSlug, label }: { targetType: "ticker" | "indicator"; targetSlug: string; label: string }) {
  let qs: Q[] = [];
  try {
    const db = supabasePublic();
    if (db) {
      const { data } = await db.from("questions").select("id, body, answer").eq("target_type", targetType).eq("target_slug", targetSlug).eq("status", "published").not("answer", "is", null).order("published_at", { ascending: false }).limit(20);
      qs = (data as Q[]) ?? [];
    }
  } catch { /* the form still works without the list */ }
  return (
    <section className="card mt-6" aria-labelledby="qa-h">
      <h2 id="qa-h" style={{ fontSize: 18 }}>Questions about {label}</h2>
      {qs.length > 0 && (
        <>
          <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: qs.map((q) => ({ "@type": "Question", name: q.body, acceptedAnswer: { "@type": "Answer", text: q.answer } })) }} />
          {qs.map((q) => <div key={q.id} className="qa"><h3>{q.body}</h3><p>{q.answer}</p></div>)}
        </>
      )}
      <AskForm targetType={targetType} targetSlug={targetSlug} label={label} />
      <p className="note" style={{ margin: "10px 0 0" }}>Educational answers only, not personal advice.</p>
    </section>
  );
}
