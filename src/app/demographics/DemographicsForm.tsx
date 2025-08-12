"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const AGE_RANGES = [
  "Under 18",
  "18-24",
  "25-34",
  "35-44",
  "45-54",
  "55-64",
  "65+",
] as const;

const EDUCATION_LEVELS = [
  "Primary education (up to grade 6)",
  "Lower secondary education (grades 7–9)",
  "Upper secondary education (high school diploma or equivalent)",
  "Post-secondary non-tertiary education (vocational/technical school)",
  "Bachelor’s degree or equivalent",
  "Master’s degree or equivalent",
  "Doctorate or equivalent",
  "Other (please specify)",
] as const;

const GENDERS = [
  "male",
  "female",
  "non-binary",
  "prefer not to say",
] as const;

const OCCUPATION_FIELDS = [
  "Agriculture, forestry, fishing",
  "Manufacturing, mining, construction",
  "Utilities (electricity, gas, water)",
  "Retail, wholesale, trade",
  "Transportation & logistics",
  "Information technology",
  "Finance, banking, insurance",
  "Education & training",
  "Healthcare & social services",
  "Public administration & government",
  "Arts, entertainment, media",
  "Hospitality & tourism",
  "Other (please specify)",
] as const;

type Props = {
  median: number; // e.g. 50000
  currency: string; // e.g. "USD"
};

export default function DemographicsForm({ median, currency }: Props) {
  const router = useRouter();
  const [ageRange, setAgeRange] = useState<string>("");
  const [education, setEducation] = useState<string>("");
  const [educationOther, setEducationOther] = useState("");
  const [gender, setGender] = useState<string>("");
  const [occupation, setOccupation] = useState<string>("");
  const [occupationOther, setOccupationOther] = useState("");
  const [incomeBucket, setIncomeBucket] = useState<string>("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const nf = useMemo(
    () => new Intl.NumberFormat(undefined, { style: "currency", currency }),
    [currency]
  );

  const half = Math.round(median * 0.5);
  const twice = Math.round(median * 2);

  const incomeOptions = [
    { value: "low", label: `Low income: < ${nf.format(half)}` },
    { value: "lower_middle", label: `Lower-middle income: ${nf.format(half)}–${nf.format(median)}` },
    { value: "upper_middle", label: `Upper-middle income: ${nf.format(median)}–${nf.format(twice)}` },
    { value: "high", label: `High income: > ${nf.format(twice)}` },
  ];

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSaved(false);
    try {
      const payload = {
        age_range: ageRange || null,
        education_level:
          (education === "Other (please specify)" && educationOther.trim()) || education || null,
        gender: gender || null,
        occupation_field:
          (occupation === "Other (please specify)" && occupationOther.trim()) || occupation || null,
        income_bucket: incomeBucket || null,
      };
      const res = await fetch("/api/save-demographics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "Failed to save demographics");
      }
      setSaved(true);
      // Continue to results after saving demographics
      setTimeout(() => router.push("/results"), 400);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unexpected error";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Age range */}
      <div>
        <label className="block text-sm font-medium mb-2">Age range (optional)</label>
        <select
          value={ageRange}
          onChange={(e) => setAgeRange(e.target.value)}
          className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
        >
          <option value="">Prefer not to say</option>
          {AGE_RANGES.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </div>

      {/* Education level */}
      <div>
        <label className="block text-sm font-medium mb-2">Highest education level (optional)</label>
        <select
          value={education}
          onChange={(e) => setEducation(e.target.value)}
          className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
        >
          <option value="">Prefer not to say</option>
          {EDUCATION_LEVELS.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
        {education === "Other (please specify)" && (
          <input
            type="text"
            value={educationOther}
            onChange={(e) => setEducationOther(e.target.value)}
            placeholder="Please specify"
            className="mt-2 w-full h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
            maxLength={200}
          />
        )}
      </div>

      {/* Gender */}
      <div>
        <label className="block text-sm font-medium mb-2">Gender (optional)</label>
        <select
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
        >
          <option value="">Prefer not to say</option>
          {GENDERS.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </div>

      {/* Occupation */}
      <div>
        <label className="block text-sm font-medium mb-2">Occupation field (optional)</label>
        <select
          value={occupation}
          onChange={(e) => setOccupation(e.target.value)}
          className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
        >
          <option value="">Prefer not to say</option>
          {OCCUPATION_FIELDS.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
        {occupation === "Other (please specify)" && (
          <input
            type="text"
            value={occupationOther}
            onChange={(e) => setOccupationOther(e.target.value)}
            placeholder="Please specify"
            className="mt-2 w-full h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
            maxLength={200}
          />
        )}
      </div>

      {/* Income */}
      <div>
        <label className="block text-sm font-medium mb-2">Income range (optional)</label>
        <select
          value={incomeBucket}
          onChange={(e) => setIncomeBucket(e.target.value)}
          className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
        >
          <option value="">Prefer not to say</option>
          {incomeOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="mt-2 text-xs text-muted-foreground">Median used for calculation: {nf.format(median)} {currency}</div>
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 p-3 rounded-md">
          {error}
        </div>
      )}
      {saved && (
        <div className="text-sm text-green-600 bg-green-500/10 border border-green-500/30 p-3 rounded-md">
          Saved! Redirecting to your results…
        </div>
      )}

      <div className="flex items-center justify-between gap-3 pt-2">
        <a href="/results" className="h-11 px-4 rounded-md border border-border bg-card text-foreground hover:bg-muted">
          Skip for now
        </a>
        <button
          type="submit"
          disabled={submitting}
          className="h-11 px-4 rounded-md bg-primary text-primary-foreground font-semibold disabled:opacity-60"
        >
          {submitting ? "Saving…" : "Save and continue"}
        </button>
      </div>
    </form>
  );
}
