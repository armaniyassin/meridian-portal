"use client";
import Link from "next/link";
import { useState } from "react";
import type { QuizQ } from "@/lib/academy";
import { markDone } from "@/components/pages/progress";

/** Practice quiz after a lesson. Answers are checked in the browser and nothing is stored except that you finished. */
export default function Quiz({ slug, quiz, next }: { slug: string; quiz: QuizQ[]; next: { slug: string; title: string } | null }) {
  const [i, setI] = useState(0);
  const [ans, setAns] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [end, setEnd] = useState(false);
  const Q = quiz[i];

  const pick = (k: number) => { if (ans != null) return; setAns(k); if (k === Q.a) setScore((s) => s + 1); };
  const advance = () => { if (i < quiz.length - 1) { setI(i + 1); setAns(null); } else { setEnd(true); markDone(slug); } };
  const again = () => { setI(0); setAns(null); setScore(0); setEnd(false); };

  if (end) {
    return (
      <div className="card quiz" role="status">
        <div className="eyebrow">Quiz complete</div>
        <h2 style={{ fontSize: 28, margin: "8px 0" }}>You scored {score} of {quiz.length}</h2>
        <p className="expl">{score === quiz.length ? "Full marks. Lesson marked as done." : "Lesson marked as done. Read the explanations again, or retry the quiz."}</p>
        <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="b" type="button" onClick={again}>Try again</button>
          {next ? <Link className="b solid" href={`/academy/${next.slug}`}>Next lesson: {next.title}</Link> : <Link className="b solid" href="/academy">Back to the Academy</Link>}
        </div>
      </div>
    );
  }
  return (
    <div className="card quiz">
      <div className="eyebrow">Practice question {i + 1} of {quiz.length}</div>
      <h2 style={{ fontSize: 22, margin: "6px 0 12px" }}>{Q.q}</h2>
      <div role="group" aria-label="Answers">
        {Q.o.map((o, k) => (
          <button key={o} type="button" className={`opt ${ans == null ? "" : k === Q.a ? "ok" : k === ans ? "no" : ""}`} disabled={ans != null} onClick={() => pick(k)}>{String.fromCharCode(65 + k)}. {o}</button>
        ))}
      </div>
      <div aria-live="polite">
        {ans != null && (<>
          <p className="expl"><b style={{ color: "var(--text)", fontWeight: 600 }}>{ans === Q.a ? "Correct." : "Not quite."}</b> {Q.e}</p>
          <div style={{ marginTop: 12 }}><button className="b" type="button" onClick={advance}>{i < quiz.length - 1 ? "Next question" : "See your score"}</button></div>
        </>)}
      </div>
    </div>
  );
}
