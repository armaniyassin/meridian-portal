import Link from "next/link";

const LINKS = [["/markets", "Markets"], ["/sentiment", "Sentiment"], ["/academy", "Academy"], ["/news", "News"]] as const;

export default function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-semibold text-slate-100">Meridian</Link>
        <nav aria-label="Main" className="flex gap-6 text-sm text-slate-400">
          {LINKS.map(([href, name]) => (
            <Link key={href} href={href} className="hover:text-slate-100">{name}</Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
