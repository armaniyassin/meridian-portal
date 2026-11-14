import Link from "next/link";
import NavLinks from "@/components/NavLinks";
import ThemeToggle from "@/components/ThemeToggle";

export default function Header() {
  return (
    <header className="hdr" id="hdr">
      <div className="hdr-in">
        <Link className="brand" href="/" aria-label="Meridian Global Macro home">
          <svg width="26" height="26" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
            <circle cx="14" cy="14" r="11" /><ellipse cx="14" cy="14" rx="4.6" ry="11" /><path d="M3.5 10.5h21M3.5 17.5h21" />
          </svg>
          <span>Meridian</span>
        </Link>
        <NavLinks />
        <div className="right">
          <ThemeToggle />
          <Link className="b solid hide-s" href="/brief">Join the brief</Link>
        </div>
      </div>
    </header>
  );
}
