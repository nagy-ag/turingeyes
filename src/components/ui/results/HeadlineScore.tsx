"use client";
import React from "react";
import type { HeadlineMetrics } from "./types";

const NUMBER_FMT = new Intl.NumberFormat("en-US");

export const SAMPLE_HEADLINE_METRICS: HeadlineMetrics = {
  overallAccuracy: 80,
  correctCount: 32,
  totalCount: 40,
  globalRankTopPercent: 15,
  countryRankTopPercent: 5,
  countryName: "United States",
  globalParticipants: 12345,
  countryParticipants: 1200,
};

export function HeadlineScore({ metrics, showSampleBadge = false }: { metrics?: HeadlineMetrics; showSampleBadge?: boolean }) {
  const m = metrics ?? SAMPLE_HEADLINE_METRICS;
  const {
    overallAccuracy,
    correctCount,
    totalCount,
    globalRankTopPercent,
    countryRankTopPercent,
    countryName,
    globalParticipants,
    countryParticipants,
  } = m;

  return (
    <section aria-labelledby="headline-score" className="relative z-10">
      <div className="relative w-full rounded-2xl border border-border bg-card text-card-foreground shadow-sm p-6">
        {showSampleBadge ? (
          <div className="absolute top-3 right-3 z-10">
            <div
              className="relative inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary border border-primary/25 px-2.5 py-1 text-xs font-medium select-none"
              aria-label="Sample preview"
            >
              <span aria-hidden="true" className="inline-flex h-3 w-3 items-center justify-center rounded-full bg-primary/30">
                <span className="h-1 w-1 rounded-full bg-primary" />
              </span>
              <span>Sample</span>
            </div>
          </div>
        ) : null}
        <h2 id="headline-score" className="font-heading text-xl md:text-2xl font-semibold mb-6">
          Your Headline Score
        </h2>
        <p className="text-muted-foreground mb-6 text-sm">
          Immediate snapshot of your three most important rankings at a glance.
        </p>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-border p-5 bg-background/50">
            <div className="text-xs text-muted-foreground mb-1">Overall Accuracy</div>
            <div className="text-3xl md:text-4xl font-extrabold tracking-tight">{overallAccuracy}%</div>
            <div className="text-xs text-muted-foreground mt-2">({correctCount} out of {totalCount} correct)</div>
          </div>

          <div className="rounded-xl border border-border p-5 bg-background/50">
            <div className="text-xs text-muted-foreground mb-1">Global Rank</div>
            <div className="text-3xl md:text-4xl font-extrabold tracking-tight">Top {globalRankTopPercent}%</div>
            <div className="text-xs text-muted-foreground mt-2">(vs. {NUMBER_FMT.format(globalParticipants)} participants)</div>
          </div>

          <div className="rounded-xl border border-border p-5 bg-background/50">
            <div className="text-xs text-muted-foreground mb-1">Country Rank ({countryName})</div>
            <div className="text-3xl md:text-4xl font-extrabold tracking-tight">Top {countryRankTopPercent}%</div>
            <div className="text-xs text-muted-foreground mt-2">(vs. {NUMBER_FMT.format(countryParticipants)} participants in your country)</div>
          </div>
        </div>
      </div>
    </section>
  );
}
