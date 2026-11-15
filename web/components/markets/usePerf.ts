"use client";
import { useEffect, useState } from "react";
import type { Perf } from "@/lib/periods";

const cache = new Map<string, Promise<Record<string, Perf>>>();
/** Loads period performance for one panel the first time the slider leaves 1D. Shared between tabs, so each panel is fetched once. */
export function usePerf(group: string, enabled: boolean) {
  const [state, setState] = useState<{ perf: Record<string, Perf> | null; failed: boolean }>({ perf: null, failed: false });
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    let p = cache.get(group);
    if (!p) {
      const created = fetch(`/api/perf?group=${group}`).then((r) => { if (!r.ok) throw new Error(`perf ${r.status}`); return r.json(); }).then((j) => j.perf as Record<string, Perf>);
      created.catch(() => cache.delete(group));
      cache.set(group, created); p = created;
    }
    p.then((perf) => alive && setState({ perf, failed: false })).catch(() => alive && setState({ perf: null, failed: true }));
    return () => { alive = false; };
  }, [group, enabled]);
  return state;
}
