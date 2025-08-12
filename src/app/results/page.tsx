import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { HeadlineScore } from "@/components/ui/results/HeadlineScore";
import { PeerComparison } from "@/components/ui/results/PeerComparison";
import CategoryDeepDive from "@/components/ui/results/CategoryDeepDive";
import { AnswerGrid } from "@/components/ui/results/AnswerGrid";
import type { ResultsData, AnswerRow, PeerComparisonEntry } from "@/components/ui/results/types";

export const dynamic = "force-dynamic";

export default async function ResultsPage() {
  const cookieStore = await cookies();
  const pid = cookieStore.get("te_pid")?.value;
  if (!pid) {
    redirect("/start");
  }

  const supabase = createAdminClient();

  // Fetch participant trials (for your answers and headline accuracy)
  const { data: trials, error: tErr } = await supabase
    .from("trials")
    .select("image_id, user_choice, is_correct, response_time_ms, created_at")
    .eq("participant_id", pid!)
    .order("created_at", { ascending: true });

  if (tErr) {
    console.error("trials select error", tErr);
  }

  const trialRows = trials ?? [];
  const totalCount = trialRows.length;
  const correctCount = trialRows.reduce((acc, r) => acc + (r.is_correct ? 1 : 0), 0);
  const overallAccuracy = totalCount ? Math.round((correctCount / totalCount) * 100) : 0;

  // Fetch participant demographics and country
  const { data: participant, error: pErr } = await supabase
    .from("participants")
    .select("country_code, gender, age_range, education_level, occupation_field")
    .eq("id", pid!)
    .single();
  if (pErr) {
    console.error("participants single error", pErr);
  }

  const countryCode = participant?.country_code || "";
  const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
  const countryNameDisplay = countryCode ? (regionNames.of(countryCode.toUpperCase()) ?? countryCode) : "";
  const gender = participant?.gender || null;
  const ageRange = participant?.age_range || null;
  const education = participant?.education_level || null;
  const occupation = participant?.occupation_field || null;

  // Headline ranks and participant counts (global and by country)
  let globalRankTopPercent = 0;
  let countryRankTopPercent = 0;
  let globalParticipants = 0;
  let countryParticipants = 0;
  try {
    // Global totals and rank
    const { count: gTotal } = await supabase
      .from("participant_accuracy")
      .select("participant_id", { count: "exact", head: true })
      .not("accuracy_pct", "is", null);
    globalParticipants = gTotal ?? 0;

    const { count: gBetter } = await supabase
      .from("participant_accuracy")
      .select("participant_id", { count: "exact", head: true })
      .gt("accuracy_pct", overallAccuracy)
      .not("accuracy_pct", "is", null);

    const gRank = (gBetter ?? 0) + 1;
    globalRankTopPercent = globalParticipants > 0 ? Math.ceil((100 * gRank) / globalParticipants) : 0;

    // Country totals and rank (if we have a country)
    if (countryCode) {
      const { count: cTotal } = await supabase
        .from("participant_accuracy")
        .select("participant_id", { count: "exact", head: true })
        .eq("country_code", countryCode)
        .not("accuracy_pct", "is", null);
      countryParticipants = cTotal ?? 0;

      const { count: cBetter } = await supabase
        .from("participant_accuracy")
        .select("participant_id", { count: "exact", head: true })
        .eq("country_code", countryCode)
        .gt("accuracy_pct", overallAccuracy)
        .not("accuracy_pct", "is", null);
      const cRank = (cBetter ?? 0) + 1;
      countryRankTopPercent = countryParticipants > 0 ? Math.ceil((100 * cRank) / countryParticipants) : 0;
    }
  } catch (e) {
    console.error("rank computation error", e);
  }

  // Peer comparison metrics
  type AvgRow = { avg: number | null };
  type AvgEq = {
    column: "gender" | "age_range" | "education_level" | "occupation_field";
    value: string;
  };

  async function fetchAvg(eq?: AvgEq) {
    let q = supabase
      .from("participant_accuracy")
      .select("avg:avg(accuracy_pct)")
      .not("accuracy_pct", "is", null);
    if (eq) q = q.eq(eq.column, eq.value);
    const { data, error } = await q.maybeSingle();
    if (error) {
      console.error("avg fetch error", error);
      return null;
    }
    const row = data as AvgRow | null;
    return row?.avg ?? null;
  }

  const [avgGlobal, avgGender, avgAge, avgEducation, avgOccupation] = await Promise.all([
    fetchAvg(),
    gender ? fetchAvg({ column: "gender", value: gender }) : Promise.resolve(null),
    ageRange ? fetchAvg({ column: "age_range", value: ageRange }) : Promise.resolve(null),
    education ? fetchAvg({ column: "education_level", value: education }) : Promise.resolve(null),
    occupation ? fetchAvg({ column: "occupation_field", value: occupation }) : Promise.resolve(null),
  ]);

  const pcEntries: PeerComparisonEntry[] = [
    { label: "Your Score", value: overallAccuracy, tone: "primary" },
  ];
  if (avgGlobal != null) pcEntries.push({ label: "Global Average", value: Math.round(avgGlobal), tone: "contrast" });
  if (gender && avgGender != null) pcEntries.push({ label: `By Gender (${gender})`, value: Math.round(avgGender), tone: "muted" });
  if (ageRange && avgAge != null) pcEntries.push({ label: `By Age Range (${ageRange})`, value: Math.round(avgAge), tone: "muted" });
  if (education && avgEducation != null) pcEntries.push({ label: `By Education Level (${education})`, value: Math.round(avgEducation), tone: "muted" });
  if (occupation && avgOccupation != null) pcEntries.push({ label: `By Occupation (${occupation})`, value: Math.round(avgOccupation), tone: "muted" });

  const peerInsight = (() => {
    if (avgGlobal == null) return "";
    const diff = overallAccuracy - Math.round(avgGlobal);
    if (diff > 0) return `You performed ${diff}% above the global average.`;
    if (diff < 0) return `You performed ${Math.abs(diff)}% below the global average.`;
    return "You performed on par with the global average.";
  })();

  // Category deep-dive data
  type CatAccRow = { category: string; accuracy_pct: number | null };
  type UserCatRow = { category: string; correct_count: number; total_count: number };

  const { data: userCatRows, error: uCatErr } = await supabase
    .from("participant_category_accuracy")
    .select("category, correct_count, total_count")
    .eq("participant_id", pid!);
  if (uCatErr) console.error("user category rows error", uCatErr);

  const userCategories = (userCatRows ?? []).map((r: UserCatRow) => ({
    category: r.category,
    correct: Number(r.correct_count) || 0,
    total: Number(r.total_count) || 0,
  }));

  type CategoryFilter = {
    column: "gender" | "age_range" | "education_level" | "occupation_field";
    value: string;
  };

  async function buildCategoryPeerMap(eq: CategoryFilter | undefined, label: string) {
    let q = supabase.from("participant_category_accuracy").select("category, accuracy_pct");
    if (eq) q = q.eq(eq.column, eq.value);
    const { data, error } = await q;
    if (error) {
      console.error("category peer fetch error", label, error);
      return { label, byCategory: {} as Record<string, number> };
    }
    const acc = new Map<string, { sum: number; n: number }>();
    for (const row of ((data ?? []) as CatAccRow[])) {
      if (row.accuracy_pct == null) continue;
      const k = row.category;
      const e = acc.get(k) || { sum: 0, n: 0 };
      e.sum += Number(row.accuracy_pct);
      e.n += 1;
      acc.set(k, e);
    }
    const byCategory: Record<string, number> = {};
    for (const [k, v] of acc.entries()) {
      byCategory[k] = v.n > 0 ? v.sum / v.n : 0;
    }
    return { label, byCategory };
  }

  const peerMaps: Record<string, { label: string; byCategory: Record<string, number> }> = {};
  // Global
  peerMaps["global"] = await buildCategoryPeerMap(undefined, "Global Average");
  if (gender) peerMaps["gender"] = await buildCategoryPeerMap({ column: "gender", value: gender }, `Gender (${gender})`);
  if (ageRange) peerMaps["age_range"] = await buildCategoryPeerMap({ column: "age_range", value: ageRange }, `Age Range (${ageRange})`);
  if (education) peerMaps["education_level"] = await buildCategoryPeerMap({ column: "education_level", value: education }, `Education Level (${education})`);
  if (occupation) peerMaps["occupation_field"] = await buildCategoryPeerMap({ column: "occupation_field", value: occupation }, `Occupation (${occupation})`);

  // Fetch related images in one batch
  const imageIds = Array.from(new Set(trialRows.map((t) => t.image_id))).filter(Boolean);
  type ImageMeta = {
    id: string;
    source_type: "ai" | "human" | null;
    image_url: string | null;
    category: string | null;
    ai_model: string | null;
    original_prompt: string | null;
  };
  const imagesMap = new Map<string, ImageMeta>();
  if (imageIds.length > 0) {
    const { data: imgs, error: iErr } = await supabase
      .from("images")
      .select("id, source_type, image_url, category, ai_model, original_prompt")
      .in("id", imageIds as string[]);
    if (iErr) {
      console.error("images in(select) error", iErr);
    }
    for (const im of ((imgs ?? []) as ImageMeta[])) imagesMap.set(im.id, im);
  }

  // Build AnswerGrid rows
  const answers: AnswerRow[] = trialRows.map((t) => {
    const im = imagesMap.get(t.image_id);
    const origin = (im?.source_type === "human" ? "human" : "ai") as "human" | "ai";
    const correctAnswer = origin === "human" ? "Human" : "AI";
    const userGuess = t.user_choice === "human" ? "Human" : "AI";
    return {
      imageUrl: im?.image_url ?? "",
      imageAlt: im?.category ? `${im.category} image` : "Test image",
      correctAnswer,
      userGuess,
      result: t.is_correct ? "correct" : "incorrect",
      origin,
      model: im?.ai_model ?? undefined,
      createdAt: t.created_at ?? undefined,
    };
  });

  const data: ResultsData = {
    headline: {
      overallAccuracy,
      correctCount,
      totalCount,
      globalRankTopPercent,
      countryRankTopPercent,
      countryName: countryNameDisplay,
      globalParticipants,
      countryParticipants,
    },
    peerComparison: {
      headlinePercent: overallAccuracy,
      entries: pcEntries,
      insight: peerInsight,
    },
    categories: userCategories.map((u) => ({ category: u.category, correct: u.correct, total: u.total, peerAvg: 0 })),
    answers,
  };

  return (
    <div className="min-h-[100dvh] py-10 px-6">
      <div className="mx-auto max-w-5xl space-y-10">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium">
            Your Results
          </div>
          <h1 className="mt-4 text-3xl md:text-5xl font-extrabold tracking-tight">How You Did</h1>
          <p className="mt-3 text-sm md:text-base text-muted-foreground">
            Here are your actual results based on your recent test.
          </p>
        </div>

        <HeadlineScore metrics={data.headline} />
        <PeerComparison headlinePercent={data.headline.overallAccuracy} entries={data.peerComparison.entries} insight={data.peerComparison.insight} />
        <CategoryDeepDive userCategories={userCategories} peerMaps={peerMaps} defaultKey={gender ? "gender" : "global"} />
        <AnswerGrid rows={data.answers} />
      </div>
    </div>
  );
}
