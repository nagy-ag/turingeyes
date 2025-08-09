import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function POST(req: NextRequest) {
  try {
    const { selfRatedSkill, countryCode } = (await req.json()) ?? {};

    // Basic validation
    const skill = Number(selfRatedSkill);
    if (!Number.isInteger(skill) || skill < 1 || skill > 7) {
      return NextResponse.json(
        { error: "selfRatedSkill must be an integer 1..7" },
        { status: 400 }
      );
    }
    const country = String(countryCode ?? "").toUpperCase();
    if (!country || country.length !== 2) {
      return NextResponse.json(
        { error: "countryCode must be a 2-letter ISO code" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // 1) Create participant (anonymous session)
    const { data: participant, error: pErr } = await supabase
      .from("participants")
      .insert({ self_rated_skill: skill, country_code: country })
      .select("id")
      .single();

    if (pErr || !participant) {
      console.error("participants.insert error", pErr);
      return NextResponse.json({ error: "failed_to_create_participant" }, { status: 500 });
    }

    // 2) Select images (balanced attempt: 50/50 human vs ai)
    const N = Number(process.env.NEXT_TEST_IMAGE_COUNT ?? 40);
    const half = Math.floor(N / 2);

    const [{ count: humanCount }, { count: aiCount }] = await Promise.all([
      supabase.from("images").select("id", { count: "exact", head: true }).eq("source_type", "human"),
      supabase.from("images").select("id", { count: "exact", head: true }).eq("source_type", "ai"),
    ]);

    const humanLimit = Math.min(half, humanCount ?? 0);
    const aiLimit = Math.min(N - humanLimit, aiCount ?? 0);

    function randStart(count: number, limit: number) {
      if (!count || count <= limit) return 0;
      const maxStart = Math.max(0, count - limit);
      return Math.floor(Math.random() * (maxStart + 1));
    }

    const humanStart = randStart(humanCount ?? 0, humanLimit);
    const aiStart = randStart(aiCount ?? 0, aiLimit);

    const [humansRes, aiRes] = await Promise.all([
      humanLimit > 0
        ? supabase
            .from("images")
            .select("id, category, image_url")
            .eq("source_type", "human")
            .range(humanStart, humanStart + humanLimit - 1)
        : Promise.resolve({ data: [], error: null } as any),
      aiLimit > 0
        ? supabase
            .from("images")
            .select("id, category, image_url")
            .eq("source_type", "ai")
            .range(aiStart, aiStart + aiLimit - 1)
        : Promise.resolve({ data: [], error: null } as any),
    ]);

    if (humansRes.error) console.error("images(human) error", humansRes.error);
    if (aiRes.error) console.error("images(ai) error", aiRes.error);

    const selected = shuffle([...(humansRes.data ?? []), ...(aiRes.data ?? [])]);

    const res = NextResponse.json({
      participantId: participant.id,
      images: selected.map((i) => ({ id: i.id, image_url: i.image_url, category: i.category })),
    });

    // Store participant id in an HttpOnly cookie for 90 days
    res.cookies.set("te_pid", participant.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 90,
      path: "/",
    });

    return res;
  } catch (e) {
    console.error("/api/start-test POST error", e);
    return NextResponse.json({ error: "unexpected_error" }, { status: 500 });
  }
}
