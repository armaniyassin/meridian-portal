import "./globals.css";
import type { Metadata } from "next";
import { Inter_Tight, Geist_Mono } from "next/font/google";
import Header from "@/components/Header";
import { HUB_COUNT_WORD } from "@/lib/hubs";

const sans = Inter_Tight({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "Meridian Global Macro",
  description: `Bonds, currencies, indices and AI sentiment across ${HUB_COUNT_WORD} financial centres. Educational information only.`,
};

// Runs before first paint so the saved theme never flashes.
const themeScript = `try{var t=localStorage.getItem('mgm-theme');if(t)document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body>
        <a className="skip" href="#main">Skip to content</a>
        <Header />
        <main id="main" tabIndex={-1}>{children}</main>
      </body>
    </html>
  );
}
