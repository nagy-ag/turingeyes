"use client";
import React from "react";
import type { CategoryRow } from "./types";

export const SAMPLE_CATEGORY_ROWS: CategoryRow[] = [
  { category: "Portraits", correct: 7, total: 10, peerAvg: 65 },
  { category: "Landscapes", correct: 9, total: 10, peerAvg: 88 },
  { category: "Human Hands", correct: 6, total: 10, peerAvg: 66 },
  { category: "Food Photography", correct: 10, total: 10, peerAvg: 85 },
];

export function CategoryTable({ rows = SAMPLE_CATEGORY_ROWS, peerLabel = "Tech/IT" }: { rows?: CategoryRow[]; peerLabel?: string }) {
  return (
    <section aria-labelledby="deep-dive" className="relative z-10">
      <div className="w-full rounded-2xl border border-border bg-card text-card-foreground shadow-sm p-6">
        <h2 id="deep-dive" className="font-heading text-xl md:text-2xl font-semibold mb-2">
          Deep Dive by Category
        </h2>
        <p className="text-muted-foreground mb-4 text-sm">
          Where are you sharpest? This section breaks down your accuracy by image type, compared directly against your professional peers. (A detailed table that provides actionable insights.)
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <caption className="sr-only">Accuracy by category vs peers</caption>
            <thead className="text-xs text-muted-foreground">
              <tr>
                <th scope="col" className="text-left py-2 border-b border-border">Image Category</th>
                <th scope="col" className="text-left py-2 border-b border-border">Your Accuracy</th>
                <th scope="col" className="text-left py-2 border-b border-border">Peer Average ({peerLabel})</th>
                <th scope="col" className="text-left py-2 border-b border-border">Your Edge</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const pct = r.total > 0 ? Math.round((r.correct / r.total) * 100) : 0;
                const edge = pct - Math.round(r.peerAvg);
                const edgeText = edge === 0 ? "—" : edge > 0 ? `+${edge}%` : `${edge}%`;
                const hint = edge > 0 ? "This is a clear strength for you!" : edge < 0 ? "Your peers have a slight edge here!" : "You are on par with peers.";
                return (
                  <tr key={r.category} className="align-middle">
                    <th scope="row" className="py-3 border-b border-border font-medium">{r.category}</th>
                    <td className="py-3 border-b border-border">
                      <div className="flex items-center gap-3">
                        <div className="min-w-20 tabular-nums">{r.correct}/{r.total} ({pct}%)</div>
                        <div className="h-2 w-full rounded-full bg-muted" aria-hidden>
                          <div className="h-2 rounded-full bg-primary" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 border-b border-border">
                      <div className="flex items-center gap-3">
                        <div className="min-w-12 tabular-nums">{Math.round(r.peerAvg)}%</div>
                        <div className="h-2 w-full rounded-full bg-muted" aria-hidden>
                          <div className="h-2 rounded-full bg-foreground/70" style={{ width: `${Math.round(r.peerAvg)}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 border-b border-border">
                      <div className={edge > 0 ? "text-primary" : edge < 0 ? "text-destructive" : "text-muted-foreground"}>
                        {edgeText}
                        {edge !== 0 && (
                          <span className="ml-1 text-xs text-muted-foreground">({hint})</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
