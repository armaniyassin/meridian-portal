const KEY = "mgm-academy-done";
export function readDone(): string[] { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; } }
export function markDone(slug: string) { try { const d = new Set(readDone()); d.add(slug); localStorage.setItem(KEY, JSON.stringify([...d])); } catch { /* storage unavailable */ } }
