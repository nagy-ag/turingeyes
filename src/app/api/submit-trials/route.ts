import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Simple validators
function isUuid(v: unknown): v is string {
  return typeof v === "string" && /^[0-9a-fA-F-]{36}$/.test(v);
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const cookiePid = req.cookies.get("te_pid")?.value;

    const participantId: unknown = body?.participantId;
    const trials: unknown = body?.trials;

    if (!isUuid(participantId)) {
      return NextResponse.json({ error: "invalid_participant_id" }, { status: 400 });
    }

    // Require that the HttpOnly cookie matches the provided participantId to mitigate tampering
    if (!cookiePid || cookiePid !== participantId) {
      return NextResponse.json({ error: "unauthorized_participant" }, { status: 401 });
    }

    if (!Array.isArray(trials) || trials.length === 0) {
      return NextResponse.json({ error: "no_trials" }, { status: 400 });
    }

    // Hard limit to protect API
    if (trials.length > 100) {
      return NextResponse.json({ error: "too_many_trials" }, { status: 400 });
    }

    type IncomingTrial = {
      imageId: string;
      userChoice: "ai" | "human";
      responseTimeMs: number;
      confidence?: number;
    };

    const incoming: IncomingTrial[] = [];
    for (const t of trials as unknown[]) {
      const u = (t ?? {}) as {
        imageId?: unknown;
        userChoice?: unknown;
        responseTimeMs?: unknown;
        confidence?: unknown;
      };
      const imageId = u.imageId;
      const userChoice = u.userChoice;
      const responseTimeMs = u.responseTimeMs;
      const confidence = u.confidence;

      const isChoice = (v: unknown): v is "ai" | "human" => v === "ai" || v === "human";

      if (isUuid(imageId) && isChoice(userChoice) && Number.isFinite(Number(responseTimeMs))) {
        incoming.push({
          imageId: imageId as string,
          userChoice: userChoice as "ai" | "human",
          responseTimeMs: clamp(Math.round(Number(responseTimeMs)), 0, 600000),
          confidence: confidence != null ? clamp(Math.round(Number(confidence)), 0, 5) : 0,
        });
      }
    }

    if (incoming.length === 0) {
      return NextResponse.json({ error: "no_valid_trials" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Fetch ground truth for images
    const imageIds = Array.from(new Set(incoming.map((t) => t.imageId)));
    const { data: imgs, error: imgsErr } = await supabase
      .from("images")
      .select("id, source_type")
      .in("id", imageIds);

    if (imgsErr) {
      console.error("images.in select error", imgsErr);
      return NextResponse.json({ error: "images_lookup_failed" }, { status: 500 });
    }

    const truth = new Map<string, "ai" | "human">();
    type ImageRow = { id: string; source_type: "ai" | "human" | null };
    for (const r of (imgs ?? []) as ImageRow[]) {
      if (r && r.id && r.source_type) {
        truth.set(r.id, r.source_type);
      }
    }

    // Build rows for insert
    type TrialRow = {
      participant_id: string;
      image_id: string;
      user_choice: "ai" | "human";
      is_correct: boolean;
      confidence: number;
      response_time_ms: number;
    };

    const rows: TrialRow[] = [];
    const participantIdStr = participantId as string;
    for (const t of incoming) {
      const gt = truth.get(t.imageId);
      if (!gt) continue; // ignore unknown images
      rows.push({
        participant_id: participantIdStr,
        image_id: t.imageId,
        user_choice: t.userChoice,
        is_correct: t.userChoice === gt,
        confidence: t.confidence ?? 0,
        response_time_ms: t.responseTimeMs,
      });
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: "no_known_images" }, { status: 400 });
    }

    const { error: insErr } = await supabase.from("trials").insert(rows);
    if (insErr) {
      console.error("trials.insert error", insErr);
      return NextResponse.json({ error: "insert_failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("/api/submit-trials POST error", e);
    return NextResponse.json({ error: "unexpected_error" }, { status: 500 });
  }
}
