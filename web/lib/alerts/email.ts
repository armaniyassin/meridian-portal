import "server-only";
import { SITE_NAME } from "@/lib/site";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

export type AlertMail = { to: string; label: string; what: string; pageUrl: string; unsubUrl: string; asOf: string };

/** Sends through the Resend REST API (no extra dependency). Throws on any failure so the caller can undo its bookkeeping. */
export async function sendAlertEmail(m: AlertMail) {
  const key = process.env.RESEND_API_KEY, from = process.env.RESEND_FROM;
  if (!key || !from) throw new Error("RESEND_API_KEY / RESEND_FROM missing");
  const note = "Educational information only. Not investment advice. Data may be delayed.";
  const text = `${m.label}: ${m.what}\nData as of ${m.asOf}\n${m.pageUrl}\n\n${note}\nStop this alert: ${m.unsubUrl}`;
  const html = `<p><strong>${esc(m.label)}</strong>: ${esc(m.what)}</p><p style="color:#667487">Data as of ${esc(m.asOf)}</p><p><a href="${esc(m.pageUrl)}">Open on ${esc(SITE_NAME)}</a></p><p style="color:#667487;font-size:12px">${esc(note)}<br><a href="${esc(m.unsubUrl)}">Stop this alert</a></p>`;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: m.to, subject: `${m.label}: ${m.what}`, text, html, headers: { "List-Unsubscribe": `<${m.unsubUrl}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } }),
  });
  if (!res.ok) throw new Error(`Resend HTTP ${res.status}`);
}
