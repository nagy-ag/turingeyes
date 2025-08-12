import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sanitize(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (!s) return null;
  return s.slice(0, 200);
}

type DemographicsBody = {
  age_range?: string;
  education_level?: string;
  gender?: string;
  occupation_field?: string;
  income_bucket?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as DemographicsBody;
    const cookiePid = req.cookies.get("te_pid")?.value;
    if (!cookiePid) {
      return NextResponse.json({ error: "no_participant" }, { status: 401 });
    }

    const age_range = sanitize(body?.age_range);
    const education_level = sanitize(body?.education_level);
    const gender = sanitize(body?.gender);
    const occupation_field = sanitize(body?.occupation_field);
    const income_bucket = sanitize(body?.income_bucket);

    // For now: use global median 50k USD
    const income_median = income_bucket ? 50000 : null;
    const income_currency = income_bucket ? "USD" : null;

    const supabase = createAdminClient();
    const { error: err } = await supabase
      .from("participants")
      .update({
        age_range,
        education_level,
        gender,
        occupation_field,
        income_bucket,
        income_median,
        income_currency,
        demographics_updated_at: new Date().toISOString(),
      })
      .eq("id", cookiePid);

    if (err) {
      console.error("participants.update demographics error", err);
      return NextResponse.json({ error: "update_failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("/api/save-demographics POST error", e);
    return NextResponse.json({ error: "unexpected_error" }, { status: 500 });
  }
}
