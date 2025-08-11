import React from "react";
import { HeadlineScore } from "@/components/ui/results/HeadlineScore";
import { PeerComparison } from "@/components/ui/results/PeerComparison";
import { CategoryTable } from "@/components/ui/results/CategoryTable";
import { AnswerGrid } from "@/components/ui/results/AnswerGrid";
import type { ResultsData } from "@/components/ui/results/types";

export const dynamic = "force-dynamic";

function getSampleResults(): ResultsData {
  return {
    headline: {
      overallAccuracy: 80,
      correctCount: 32,
      totalCount: 40,
      globalRankTopPercent: 15,
      countryRankTopPercent: 5,
      countryName: "United States",
      globalParticipants: 12345,
      countryParticipants: 1200,
    },
    peerComparison: {
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
        "You performed significantly better than the global average and higher than peers across several demographics.",
    },
    categories: [
      { category: "Portraits", correct: 7, total: 10, peerAvg: 65 },
      { category: "Landscapes", correct: 9, total: 10, peerAvg: 88 },
      { category: "Human Hands", correct: 6, total: 10, peerAvg: 66 },
      { category: "Food Photography", correct: 10, total: 10, peerAvg: 85 },
    ],
    answers: [
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
    ],
  };
}

export default async function ResultsPage() {
  // TODO: Replace sample data with real participant/test results from Supabase
  const data = getSampleResults();

  return (
    <div className="min-h-[100dvh] py-10 px-6">
      <div className="mx-auto max-w-5xl space-y-10">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium">
            Your Results
          </div>
          <h1 className="mt-4 text-3xl md:text-5xl font-extrabold tracking-tight">How You Did</h1>
          <p className="mt-3 text-sm md:text-base text-muted-foreground">
            Here&#39;s your performance overview, how you compare to your peers, and a breakdown by category.
          </p>
        </div>

        <HeadlineScore metrics={data.headline} />
        <PeerComparison
          headlinePercent={data.peerComparison.headlinePercent}
          entries={data.peerComparison.entries}
          insight={data.peerComparison.insight}
        />
        <CategoryTable rows={data.categories} peerLabel="Tech/IT" />
        <AnswerGrid rows={data.answers} />
      </div>
    </div>
  );
}
