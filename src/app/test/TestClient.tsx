"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useMotionValue, useTransform, animate, PanInfo } from "framer-motion";

// Types from /api/start-test response
export type TestImage = { id: string; image_url: string; category: string };

// Outgoing trial payload type
type TrialOut = {
  imageId: string;
  userChoice: "ai" | "human";
  responseTimeMs: number;
  confidence?: number; // reserved for future UI, defaulted on server if missing
};

const SWIPE_DISTANCE = 80; // px
const SWIPE_VELOCITY = 300; // px/s

export default function TestClient() {
  const router = useRouter();
  const [images, setImages] = useState<TestImage[]>([]);
  const [pid, setPid] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [records, setRecords] = useState<TrialOut[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submittedRef = useRef(false);
  const handledRef = useRef<string | null>(null);

  // Motion
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-12, 0, 12]);
  const aiOpacity = useTransform(x, [0, -140], [0, 1]);
  const humanOpacity = useTransform(x, [0, 140], [0, 1]);

  // Timing per card
  const startRef = useRef<number>(performance.now());

  // Load test session from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("te_images");
      const p = localStorage.getItem("te_pid");
      if (raw && p) {
        const arr = JSON.parse(raw) as TestImage[];
        // Fallback if more than 40 were returned by config
        const limited = Array.isArray(arr) ? arr.slice(0, 40) : [];
        setImages(limited);
        setPid(p);
        startRef.current = performance.now();
      } else {
        router.replace("/start");
      }
    } catch {
      router.replace("/start");
    }
  }, [router]);

  // Reset motion and timer on card change
  useEffect(() => {
    x.set(0);
    startRef.current = performance.now();
  }, [idx, x]);

  // Reset duplicate-guard when moving to next card
  useEffect(() => {
    handledRef.current = null;
  }, [idx]);

  const total = images.length;
  const current = images[idx];
  const progress = total ? Math.min(idx, total) / total : 0;

  const finalizeAndSubmit = useCallback(
    async (nextRecords: TrialOut[]) => {
      if (!pid) return;
      setSubmitting(true);
      setError(null);
      try {
        if (submittedRef.current) return; // guard against double-submit
        submittedRef.current = true;
        const res = await fetch("/api/submit-trials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ participantId: pid, trials: nextRecords }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j?.error || "Failed to submit trials");
        }
        try { localStorage.removeItem("te_images"); } catch {}
        router.push("/demographics");
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Unexpected error";
        setError(msg);
        submittedRef.current = false;
      } finally {
        setSubmitting(false);
      }
    },
    [pid, router]
  );

  const decide = useCallback(
    async (choice: "ai" | "human") => {
      if (!pid || !current) return;
      // prevent duplicates for the same card
      if (handledRef.current === current.id) return;
      handledRef.current = current.id;
      const elapsed = Math.round(performance.now() - startRef.current);
      const rec: TrialOut = {
        imageId: current.id,
        userChoice: choice,
        responseTimeMs: elapsed,
        confidence: 0, // placeholder; we can add a slider later
      };

      // Animate card off-screen for both swipe and non-swipe actions
      const to = choice === "ai" ? -window.innerWidth * 1.2 : window.innerWidth * 1.2;
      try {
        animate(x, to, { duration: 0.22, ease: "easeOut" });
        // Wait roughly for the animation to complete without relying on non-typed APIs
        await new Promise((r) => setTimeout(r, 240));
      } finally {
        // no immediate x reset here to avoid flicker; it will reset on idx change
      }

      const nextIdx = idx + 1;
      const nextRecords = [...records, rec];
      setRecords(nextRecords);

      if (nextIdx < total) {
        setIdx(nextIdx);
      } else {
        // Finished — submit
        finalizeAndSubmit(nextRecords);
      }
    },
    [pid, current, idx, records, total, x, finalizeAndSubmit]
  );

  const onDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const v = info.velocity.x;
    const dist = info.offset.x;
    if (Math.abs(dist) > SWIPE_DISTANCE || Math.abs(v) > SWIPE_VELOCITY) {
      const choice: "ai" | "human" = dist < 0 ? "ai" : "human"; // Left = AI, Right = Human
      decide(choice);
    } else {
      // snap back
      animate(x, 0, { type: "spring", stiffness: 400, damping: 30 });
    }
  };

  // Keyboard controls
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!current || submitting) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        decide("ai");
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        decide("human");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, submitting, decide]);

  if (!current) {
    return (
      <div className="min-h-[60vh] grid place-items-center text-muted-foreground">
        {submitting ? "Submitting your results…" : error ? (
          <div className="max-w-md text-center space-y-3">
            <div className="text-sm">{error}</div>
            <button
              type="button"
              onClick={() => finalizeAndSubmit(records)}
              className="inline-flex h-10 px-4 rounded-md bg-primary text-primary-foreground"
              disabled={submitting || records.length === 0 || !pid}
            >
              Retry Submit
            </button>
          </div>
        ) : (
          "Loading…"
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header + progress */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-semibold">Swipe Test</h1>
        <div className="text-sm text-muted-foreground">{idx + 1} / {total}</div>
      </div>
      <div aria-hidden className="h-1 w-full rounded bg-muted overflow-hidden">
        <div
          className="h-full bg-primary"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>

      {/* Card area */}
      <div className="relative h-[70vh] max-h-[720px] w-full">
        <motion.div
          key={current.id}
          className="absolute inset-0 m-auto flex items-center justify-center select-none touch-pan-y"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragMomentum={false}
          style={{ x, rotate }}
          onDragEnd={onDragEnd}
        >
          <div className="relative w-full h-full max-w-xl mx-auto">
            <div className="absolute inset-0 rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={current.image_url}
                alt={current.category || "Test image"}
                className="h-full w-full object-contain bg-background"
                draggable={false}
                loading="eager"
                crossOrigin="anonymous"
              />

              {/* Overlays */}
              <div className="pointer-events-none absolute inset-0 flex items-start justify-between p-4">
                <motion.span
                  className="rounded-md border border-border/60 bg-background/80 px-2 py-1 text-xs font-semibold text-foreground"
                  style={{ opacity: aiOpacity }}
                >
                  AI
                </motion.span>
                <motion.span
                  className="rounded-md border border-border/60 bg-background/80 px-2 py-1 text-xs font-semibold text-foreground"
                  style={{ opacity: humanOpacity }}
                >
                  Human
                </motion.span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => decide("ai")}
          className="h-11 px-4 rounded-md border border-border bg-card text-foreground hover:bg-muted"
          disabled={submitting}
        >
          AI (←)
        </button>
        <button
          type="button"
          onClick={() => decide("human")}
          className="h-11 px-4 rounded-md bg-primary text-primary-foreground hover:brightness-110"
          disabled={submitting}
        >
          Human (→)
        </button>
      </div>

      <p className="text-center text-xs text-muted-foreground">Swipe left for AI, right for Human. You can also use the arrow keys.</p>
    </div>
  );
}
