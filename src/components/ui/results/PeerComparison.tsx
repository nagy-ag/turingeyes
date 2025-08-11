"use client";
import React from "react";
import type { PeerComparisonEntry } from "./types";

function Bar({ value, tone = "primary" }: { value: number; tone?: "primary" | "contrast" | "muted" }) {
  const cl =
    tone === "primary"
      ? "bg-primary"
      : tone === "contrast"
      ? "bg-foreground/70"
      : "bg-muted-foreground/50";
  const width = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="h-3 w-full rounded-full bg-muted" aria-hidden>
      <div className={`h-3 rounded-full ${cl}`} style={{ width: `${width}%` }} />
    </div>
  );
}

export const SAMPLE_PEER_COMPARISON: {
  headlinePercent: number;
  entries: PeerComparisonEntry[];
  insight: string;
} = {
  headlinePercent: 80,
  entries: [
    { label: "Your Score", value: 80, tone: "primary" },
    { label: "Global Average", value: 68, tone: "contrast" },
    { label: "By Age Range (25–34)", value: 71, tone: "muted" },
    { label: "By Education Level (Bachelor&#39;s)", value: 70, tone: "muted" },
    { label: "By Occupation (Tech/IT)", value: 74, tone: "muted" },
    { label: "By Income Range (50k–100k)", value: 72, tone: "muted" },
  ],
  insight:
    "You performed significantly better than the global average and notably higher than others in your age group and profession.",
};

export function PeerComparison({
  headlinePercent = SAMPLE_PEER_COMPARISON.headlinePercent,
  entries = SAMPLE_PEER_COMPARISON.entries,
  insight = SAMPLE_PEER_COMPARISON.insight,
}: {
  headlinePercent?: number;
  entries?: PeerComparisonEntry[];
  insight?: string;
}) {
  return (
    <section aria-labelledby="peer-comparison" className="relative z-10">
      <div className="w-full rounded-2xl border border-border bg-card text-card-foreground shadow-sm p-6">
        <h2 id="peer-comparison" className="font-heading text-xl md:text-2xl font-semibold mb-2">
          You vs. Your Peers
        </h2>
        <p className="text-muted-foreground mb-6 text-sm">
          We compared your score to the global average and to averages for the demographics you identify with.
        </p>

        <h3 className="text-sm font-medium mb-3">How Your {Math.round(headlinePercent)}% Score Compares:</h3>

        <ul className="space-y-4" role="list">
          {entries.map((e) => (
            <li key={e.label} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
              <div className="text-sm text-muted-foreground md:text-right">{e.label}</div>
              <div className="md:col-span-2">
                <div className="flex items-center gap-3">
                  <div className="min-w-16 text-xs font-medium tabular-nums" aria-hidden>
                    {Math.round(e.value)}%
                  </div>
                  <Bar value={e.value} tone={e.tone} />
                </div>
                {e.hint && <div className="mt-1 text-xs text-muted-foreground">{e.hint}</div>}
              </div>
            </li>
          ))}
        </ul>

        {insight && (
          <div className="mt-6 rounded-lg border border-border bg-background/50 p-4 text-sm">
            <div className="font-medium mb-1">Your Insight</div>
            <p className="text-muted-foreground">{insight}</p>
          </div>
        )}
      </div>
    </section>
  );
}
