"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

type Country = { code: string; name: string };

export default function StartForm({
  defaultCountry,
  countries,
}: {
  defaultCountry: string;
  countries: Country[];
}) {
  const router = useRouter();
  const [skill, setSkill] = useState<number | null>(null);
  const [country, setCountry] = useState<string>(defaultCountry);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => !!skill && country.length === 2, [skill, country]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/start-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selfRatedSkill: skill, countryCode: country }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "Failed to start test");
      }
      const j = (await res.json()) as {
        participantId: string;
        images: { id: string; image_url: string; category: string }[];
      };
      try {
        // Persist for the soon-to-be-built test page
        localStorage.setItem("te_pid", j.participantId);
        localStorage.setItem("te_images", JSON.stringify(j.images));
      } catch {}
      router.push("/test");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-center">
        Just two quick questions before you begin…
      </h1>
      <div className="mt-8 space-y-8">
        <div>
          <label className="block text-sm font-medium mb-3">
            First, how skilled do you believe you are at spotting AI-generated images?
          </label>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setSkill(n)}
                className={
                  "h-10 rounded-md border text-sm font-medium transition-colors " +
                  (skill === n
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border hover:bg-muted")
                }
                aria-pressed={skill === n}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="mt-2 text-xs text-muted-foreground">1 = Just Guessing, 7 = Expert</div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Which country are you taking the test from?</label>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value.toUpperCase())}
            className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
          >
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 p-3 rounded-md">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!canSubmit || submitting}
          className="w-full h-11 rounded-md bg-primary text-primary-foreground font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? "Starting…" : "Begin the Test"}
        </button>
      </div>
    </form>
  );
}
