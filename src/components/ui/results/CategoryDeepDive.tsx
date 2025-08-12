"use client";

import React, { useMemo, useState } from "react";
import { CategoryTable } from "./CategoryTable";
import type { CategoryRow } from "./types";

export type UserCategoryStat = { category: string; correct: number; total: number };
export type PeerCategoryMap = { label: string; byCategory: Record<string, number> };

export default function CategoryDeepDive({
  userCategories,
  peerMaps,
  defaultKey,
}: {
  userCategories: UserCategoryStat[];
  peerMaps: Record<string, PeerCategoryMap>;
  defaultKey: string;
}) {
  const options = useMemo(() => Object.entries(peerMaps), [peerMaps]);
  const [key, setKey] = useState<string>(defaultKey);

  const sel = peerMaps[key] ?? options[0]?.[1];
  const rows: CategoryRow[] = useMemo(() => {
    const byCat = sel?.byCategory ?? {};
    return userCategories.map((u) => ({
      category: u.category,
      correct: u.correct,
      total: u.total,
      peerAvg: Math.max(0, Math.min(100, Math.round(byCat[u.category] ?? 0))),
    }));
  }, [userCategories, sel]);

  return (
    <section className="relative z-10">
      <div className="w-full rounded-2xl border border-border bg-card text-card-foreground shadow-sm p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="font-heading text-xl md:text-2xl font-semibold">Deep Dive by Category</h2>
          <div className="flex items-center gap-2">
            <label htmlFor="peer-dimension" className="text-xs text-muted-foreground">Compare vs</label>
            <select
              id="peer-dimension"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="h-9 rounded-md border border-border bg-background px-2.5 text-sm text-foreground"
            >
              {options.map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <CategoryTable rows={rows} peerLabel={sel?.label ?? "Peers"} />
      </div>
    </section>
  );
}
