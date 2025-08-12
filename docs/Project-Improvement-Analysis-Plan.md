# TuringEyes – Project Improvement Analysis Plan

## Executive Summary
Solid foundation with clear separation of server-only Supabase admin client, accessible UI, and thoughtful theming. Below are prioritized, actionable recommendations across architecture, security, performance, and maintainability, with concrete file-path references.

---

## 1) Immediate Wins (1–2 hours)

- __Harden cookies__ in `src/app/api/start-test/route.ts`
  - Set `HttpOnly`, `Secure` (prod only), `SameSite=Strict`, and a reasonable `Max-Age`.
  - Avoid duplicating participant ID in `localStorage`; rely on the HttpOnly cookie instead.

- __Input validation with Zod__
  - Server: `src/app/api/start-test/route.ts`
  - Client: `src/app/start/StartForm.tsx`
  - Shared schema: `src/lib/validation/start.ts`
  - Validate on both sides; return standardized error shapes.

- __Rate limit__ `POST /api/start-test`
  - Use simple IP/cookie keyed limiter (e.g., Upstash) to prevent abuse.

- __Security headers__ in `next.config.js`
  - Add CSP (including `img-src` for Supabase bucket), `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Content-Type-Options`.

- __Make landing static__
  - Ensure `src/app/page.tsx` and `src/components/ui/turingeyes-landing-page.tsx` do not use request-bound data so they can be static for better TTFB and caching.

---

## 2) Architecture and Data Layer

- __Domain modules__ in `src/domain/`
  - `participants.ts`, `images.ts`, `trials.ts` exporting typed functions like `createParticipant()`, `selectBalancedImages()`, `recordTrial()`.
  - Co-locate Zod schemas; keep API routes thin and testable.

- __Consider Server Actions__ for private mutations
  - Useful for “start test” and “submit trials.” If staying with `/api/*`, ensure validation + rate limiting.

- __DB constraints and indexes__
  - Unique composite index on `trials (participant_id, image_id)`.
  - Indexes: `trials(participant_id)`, `trials(image_id)`, `images(source)`.
  - If `trials.guess` is text, prefer an enum aligned with `source_enum`.

- __Materialized views for analytics__
  - Precompute category averages, percentiles, ranks; refresh on schedule for fast renders in `src/app/results/page.tsx`.

- __Image selection via SQL/RPC__
  - Current randomized selection in `src/app/api/start-test/route.ts` is okay; consolidating in a single SQL query or Postgres function reduces round trips and ensures fairness.

---

## 3) Security and Supabase

- __Service role__ strictly server-only (Node runtime; not Edge). Never expose in clients.
- __Key hygiene__: rotate periodically; separate Preview vs Prod envs.
- __RLS patterns__: for future user writes (e.g., trials), consider anon key + RLS where feasible; otherwise keep writes via server-only admin client.
- __Storage bucket__ `images` (public): use long `Cache-Control` with hashed filenames; pre-generate thumbnails to lighten payloads.

---

## 4) Performance and Caching

- __Dynamic rendering__: enable only where necessary (participant/request-specific). Marketing pages should be static by default.
- __Image optimization__ in `src/components/ui/results/AnswerGrid.tsx`
  - Use `next/image` with a Supabase loader; specify width/height; keep lazy.
  - Use thumbnails (≈256–320px) for grid items.
- __Bundle size__
  - Lazy-import heavy libs (e.g., `framer-motion`) only where needed in `src/components/ui/turingeyes-landing-page.tsx`.
  - Tree-shake icons by importing per-icon.
- __Streaming UI__
  - Add Suspense boundaries on `src/app/results/page.tsx` if fetching per-section (HeadlineScore, PeerComparison, etc.).

---

## 5) UI/UX and Accessibility

- __Skip link & focus management__
  - Add a “Skip to content” in `src/app/layout.tsx`.
  - Ensure focus trap + inert background for mobile menu/dialog.

- __Tables__
  - In `CategoryTable.tsx` and `AnswerGrid.tsx`, ensure `scope`/`headers` correctness for complex headers.

- __Countdown & live regions__
  - Use `aria-live="polite"` for the landing hero countdown.

- __Theming__
  - Continue using tokens from `src/app/globals.css`; avoid raw colors. Ensure focus rings/outlines use theme vars across components (e.g., `button.tsx`).

---

## 6) Tailwind v4 and shadcn/ui

- __Tailwind v4__
  - Keep tokens centralized in `globals.css` (OKLCH is great).
  - Prefer utilities + tokens over `@apply` where possible.
  - Add stylelint/rules to catch raw color usage.

- __shadcn/ui__
  - Keep `cva` variants co-located (e.g., `src/components/ui/button.tsx`).
  - Ensure Radix components have labels, focus states, keyboard support (Dialog/Sheet for mobile nav recommended).

---

## 7) Testing Strategy

- __Unit & Integration__
  - Vitest + RTL for `StartForm.tsx` and results components. Cover validation and ARIA.

- __E2E__ (Playwright)
  - Start test → receive images.
  - Answer sequence → results preview.
  - CI: axe-core accessibility + Lighthouse.

- __Database tests__
  - pgTAP/SQL scripts for constraints + RLS.
  - Run via Supabase CLI migrations on a branch DB.

- __Type safety__
  - Generate Supabase types → commit to `src/types/database.ts`.

---

## 8) Observability and Reliability

- __Error tracking__: Sentry (server + client); correlate with Supabase logs.
- __Analytics__: Keep Vercel Speed Insights; consider Vercel Analytics or a privacy-friendly tool with consent handling.
- __Operational policies__: CI for typecheck, lint, tests, migration dry-runs; preview envs with isolated secrets.

---

## 9) Privacy, Fairness, Anti-cheat

- __Privacy__: avoid PII; consent for analytics; document retention.
- __Fairness__: keep balanced selection; optionally rate-limit repeat attempts with short-lived cookies.
- __Anti-cheat__: prefetch next image (not visible), avoid predictable order; thumbnails only, strip EXIF.

---

## 10) File-Specific Actions

- `src/app/api/start-test/route.ts`
  - Add Zod validation, rate limit, hardened cookie flags, and structured errors.
  - Optionally move image selection to domain or RPC.

- `src/app/start/StartForm.tsx`
  - Use the shared Zod schema pre-POST.
  - Do not store participant ID in `localStorage`; rely on HttpOnly cookie.

- `src/components/ui/results/AnswerGrid.tsx`
  - Use `next/image` with Supabase loader + sizes.
  - Keep preview fade and “... more answers” hint only here.

- `src/app/globals.css`
  - Maintain tokens and OKLCH; add focus ring tokens; ensure consistency.

- `src/components/ui/turingeyes-landing-page.tsx`
  - Lazy-load `framer-motion` and heavy sections.
  - Add skip link target; use Dialog/Sheet with focus trap for mobile menu.

---

## 11) Suggested Roadmap

- __Now (Quick wins)__
  - Cookie flags, Zod validation, rate limiting, security headers.
  - Make landing fully static.

- __Next (1–2 days)__
  - Domain modules; generate Supabase types; adopt `next/image` in `AnswerGrid`.
  - DB indexes/unique constraints; analytics materialized views.

- __Later (1–2 weeks)__
  - Optional Server Actions migration for mutations.
  - Sentry + CI hardening + full test suite.
  - RPC for image selection and trial recording if needed.

---

## Status
Delivered a structured, prioritized review with concrete, file-referenced actions across security, performance, architecture, testing, and UX. No code changes were made.

If helpful, I can implement the Immediate Wins as a first PR, or start with Supabase types + Zod + headers.