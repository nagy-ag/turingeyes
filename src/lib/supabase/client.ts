import { createClient } from "@supabase/supabase-js";

// Public browser client for read-only needs. Do NOT use for privileged writes.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!url || !anon) {
  // This will surface during local dev if envs are missing.
  // We intentionally avoid throwing to keep build working on Vercel preview
  // but log a clear message.
  console.warn("Supabase public env vars are missing. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
}

export const supabaseClient = createClient(url ?? "", anon ?? "");

export type SupabaseClientType = typeof supabaseClient;
