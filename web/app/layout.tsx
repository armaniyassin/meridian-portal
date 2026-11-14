import "./globals.css";
import type { Metadata } from "next";
import Nav from "@/components/Nav";

export const metadata: Metadata = { title: "Meridian Global Macro", description: "Markets, sentiment and education in one place." };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><body><Nav />{children}</body></html>);
}
