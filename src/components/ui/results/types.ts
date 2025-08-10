export type HeadlineMetrics = {
  overallAccuracy: number; // 0-100
  correctCount: number;
  totalCount: number;
  globalRankTopPercent: number; // e.g., 15 means Top 15%
  countryRankTopPercent: number; // e.g., 5 means Top 5%
  countryName: string;
  globalParticipants: number;
  countryParticipants: number;
};

export type PeerComparisonEntry = {
  label: string;
  value: number; // 0-100
  hint?: string;
  tone?: "primary" | "contrast" | "muted";
};

export type CategoryRow = {
  category: string;
  correct: number;
  total: number;
  peerAvg: number; // 0-100
};

export type AnswerRow = {
  imageUrl: string;
  imageAlt: string;
  correctAnswer: string;
  userGuess: string;
  result: "correct" | "incorrect";
  origin: "human" | "ai";
  author?: string;
  model?: string;
  createdAt?: string; // ISO date string
  confidence?: number; // 1-5 (optional; not shown in landing preview)
};

export type ResultsData = {
  headline: HeadlineMetrics;
  peerComparison: {
    headlinePercent: number;
    entries: PeerComparisonEntry[];
    insight: string;
  };
  categories: CategoryRow[];
  answers: AnswerRow[];
};
