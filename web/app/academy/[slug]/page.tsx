import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { LESSONS, lessonBySlug } from "@/lib/academy";
import Quiz from "@/components/pages/Quiz";
import LessonLab from "@/components/pages/LessonLab";
import DisclaimerFooter from "@/components/DisclaimerFooter";

export const dynamicParams = false;
export const generateStaticParams = () => LESSONS.map((l) => ({ slug: l.slug }));
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const l = lessonBySlug((await params).slug);
  return l ? { title: `${l.title} | Academy | Meridian`, description: l.intro } : {};
}

export default async function LessonPage({ params }: { params: Promise<{ slug: string }> }) {
  const l = lessonBySlug((await params).slug);
  if (!l) notFound();
  const i = LESSONS.indexOf(l), next = LESSONS[i + 1] ?? null;
  return (
    <>
      <div className="wrap pg"><article className="art">
        <Link className="back" href="/academy">← Academy</Link>
        <div className="eyebrow" style={{ marginTop: 22 }}>Level 1 · Lesson {i + 1} of {LESSONS.length} · {l.min} min</div>
        <h1 className="fx" style={{ margin: "12px 0 16px" }}>{l.title}</h1>
        <p className="lede">{l.intro}</p>
        {l.body.map(([h, p]) => (<section key={h}><h2 style={{ fontSize: 24, marginTop: 34, letterSpacing: "-.03em" }}>{h}</h2><p className="ap">{p}</p></section>))}
        <div className="take"><b>Key takeaways</b><ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>{l.take.map((t) => <li key={t} style={{ fontSize: 17, lineHeight: 1.5, marginTop: 4 }}>{t}</li>)}</ul></div>
        <LessonLab slug={l.slug} />
        <div style={{ marginTop: 40 }}><Quiz slug={l.slug} quiz={l.quiz} next={next ? { slug: next.slug, title: next.title } : null} /></div>
        <p className="note" style={{ marginTop: 20 }}>Original text inspired by CFA-level topics. Not affiliated with or endorsed by CFA Institute. Educational information only, not financial advice. Example numbers are invented for teaching.</p>
      </article></div>
      <DisclaimerFooter />
    </>
  );
}
