"use client";
import React from "react";
import type { AnswerRow } from "./types";


export const SAMPLE_ANSWER_ROWS: AnswerRow[] = [
  {
    imageUrl: "/placeholder.svg?height=96&width=96",
    imageAlt: "AI Portrait thumbnail",
    correctAnswer: "AI",
    userGuess: "AI",
    result: "correct",
    origin: "ai",
    model: "Midjourney v6",
    createdAt: "2025-03-15",
  },
  {
    imageUrl: "/placeholder.svg?height=96&width=96",
    imageAlt: "Human Landscape thumbnail",
    correctAnswer: "Human",
    userGuess: "AI",
    result: "incorrect",
    origin: "human",
    author: "A. Rivera",
    createdAt: "2024-12-08",
  },
  {
    imageUrl: "/placeholder.svg?height=96&width=96",
    imageAlt: "AI Hands thumbnail",
    correctAnswer: "AI",
    userGuess: "Human",
    result: "incorrect",
    origin: "ai",
    model: "DALL‑E 3",
    createdAt: "2025-01-20",
  },
];

export function AnswerGrid({ rows = SAMPLE_ANSWER_ROWS, preview = false, maxPreviewRows = 3 }: { rows?: AnswerRow[]; preview?: boolean; maxPreviewRows?: number }) {
  const allRows = rows;
  const visibleRows = preview ? allRows.slice(0, maxPreviewRows) : allRows;
  const hasMore = preview && allRows.length > visibleRows.length;
  return (
    <section aria-labelledby="answer-grid" className="relative z-10">
      <div className="w-full rounded-2xl border border-border bg-card text-card-foreground shadow-sm p-6">
        <h2 id="answer-grid" className="font-heading text-xl md:text-2xl font-semibold mb-2">
          Your Complete Answer Grid
        </h2>
        <p className="text-muted-foreground mb-4 text-sm">
          Review every decision you made to see your hits and misses. This is the best way to learn and improve.
        </p>
        <div className="overflow-x-auto relative">
          <table className="w-full text-sm border-collapse">
            <caption className="sr-only">Every image you evaluated with provenance and correctness</caption>
            <thead className="text-xs text-muted-foreground">
              <tr>
                <th scope="col" className="text-left py-2 border-b border-border">Image</th>
                <th scope="col" className="text-left py-2 border-b border-border">Provenance</th>
                <th scope="col" className="text-left py-2 border-b border-border">You Guessed</th>
                <th scope="col" className="text-left py-2 border-b border-border">Result</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((r, idx) => (
                <tr key={idx} className="align-middle">
                  <td className="py-3 border-b border-border">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={r.imageUrl}
                        alt={r.imageAlt}
                        className="h-12 w-12 rounded-md object-cover border border-border bg-muted"
                        loading="lazy"
                        width={48}
                        height={48}
                      />
                      <div className="text-xs text-muted-foreground">Thumbnail</div>
                    </div>
                  </td>
                  <td className="py-3 border-b border-border">
                    <div className="space-y-0.5">
                      {r.origin === "human" ? (
                        <div className="font-medium">Human — {r.author ?? "Unknown"}</div>
                      ) : (
                        <div className="font-medium">AI — {r.model ?? "Unknown model"}</div>
                      )}
                      {r.createdAt ? (
                        <div className="text-xs text-muted-foreground">Date: {r.createdAt.slice(0, 10)}</div>
                      ) : null}
                    </div>
                  </td>
                  <td className="py-3 border-b border-border">
                    <span className="tabular-nums">{r.userGuess}</span>
                  </td>
                  <td className="py-3 border-b border-border">
                    {r.result === "correct" ? (
                      <span className="inline-flex items-center rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-medium">✅ Correct</span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-destructive/10 text-destructive px-2 py-0.5 text-xs font-medium">❌ Incorrect</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {hasMore && (
            <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-card to-transparent z-10" />
          )}
        </div>
        {hasMore && (
          <div className="mt-2 text-center text-xs text-muted-foreground">… more answers</div>
        )}
      </div>
    </section>
  );
}
