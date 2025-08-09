import { createClient } from "@supabase/supabase-js";

// Create a server-only Supabase client using the Service Role key.
// IMPORTANT: Never import this file into client components.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL env var");
  }
  if (!serviceRole) {
    // Clear, actionable error for local dev / Vercel setup
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY. Add it to .env.local and Vercel project settings (Environment Variables)."
    );
  }

  return createClient(url, serviceRole, {
    auth: { persistSession: false },
  });
}
