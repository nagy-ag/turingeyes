# TuringEyes — PRD and Technical Implementation Plan

Version: 1.0
Date: 2025-08-08
Owner: TuringEyes

---

## 0) Current Status (as of today)

- You completed foundation setup: GitHub, Vercel deploy, Supabase (EU Frankfurt), env vars.
- Next.js (App Router, `src/`), Tailwind v4, shadcn/ui initialized. Example `src/components/ui/button.tsx` added.
- Supabase schema created: `participants`, `users` (FK to `auth.users`), `images`, `trials`, enum `source_enum`.
- Storage: public bucket `images` created. RLS enabled on all 4 tables. Public read policy exists on `images`.

This plan picks up from here to deliver Steps 1–4 and the reporting funnel.

---

## 1) Product Requirements (PRD)

### 1.1 Problem & Goal
- Problem: People struggle to reliably distinguish AI-generated from human-made images.
- Goal: Build a fast, delightful test that collects high-quality, unbiased data (including hidden response time), and converts high-intent users to logged-in profiles for richer reporting.

### 1.2 KPIs (success metrics)
- Primary: completion rate of test (% reaching results), email/SSO conversion rate on results page, avg. trials per participant.
- Secondary: median response_time_ms per category/model, accuracy vs. global average, % of users providing demographics.

### 1.3 Non-Goals (MVP)
- No visible countdown timers. No complex multi-language UI (initially EN only). No payments/subscriptions.

### 1.4 Personas
- Curious visitor (anonymous).
- Engaged participant (completes test, shares email/SSO).
- Returning user (views history after auth).

### 1.5 Key User Stories
- As a visitor, I can start quickly via a lean form (skill 1–7, country) to begin immediately.
- As a participant, I make a binary choice per image, then rate confidence (1–5). No visible timers.
- As a participant, I see my score and how I compare to the global average.
- As a participant, I can save results via email/SSO and optionally add demographics to enrich my report.

### 1.6 UX Spec by Step

- Step 1 — Landing
  - Headline: “Can You Spot the AI? Test Your Skills.”
  - Subtext + small preview of the final report.
  - CTA: Start the Challenge.
  - AC: Page loads < 2s on 4G, CTA visible above the fold, no layout shift.

- Step 2 — Lean Form (mandatory, fast)
  - Q1: Self-Rated Skill (1–7, labels: 1=Just Guessing, 7=Expert). Prefer ToggleGroup.
  - Q2: Country (dropdown). Prefill from Vercel geo header when available.
  - Begin the Test: creates session (participant) and moves to test.
  - AC: Both fields required; form submits in < 300ms P50; country prefilled when possible.

- Step 3 — Core Test
  - Show one image at a time.
  - Choice: Human-Made or AI-Generated (buttons + keyboard shortcuts H/A).
  - After choice: confidence scale 1–5 (keys 1–5).
  - Hidden metric: response_time_ms from image-visible to choice.
  - AC: No visible timers; data recorded: participant_id, image_id, user_choice, is_correct (server-computed), confidence, response_time_ms.

- Step 4 — Results & Upgrade
  - Part A: Instant score (e.g., “32 of 40”) + simple comparison to global average.
  - Part B: Email/SSO to save results and receive final report.
  - Part C: Optional demographics (age, education, occupation, income optional).
  - AC: Score computed server-side; sign-in flow works; demographics stored securely.

### 1.7 Instrumentation
- Events: `view_landing`, `start_form_submit`, `start_form_success`, `trial_submit`, `view_results`, `auth_success`, `demographics_submit`.
- Tools: Vercel Analytics initially; optional PostHog later.

---

## 2) Data Model (Supabase)

Tables you created are correct for MVP:
- `participants(id, user_id, self_rated_skill, country_code, created_at)`
- `users(id -> auth.users.id, email, age_range, education_level, occupation_field, income_range, updated_at)`
- `images(id, quarter, theme_id, source_type, ai_model, category, image_url, original_prompt)`
- `trials(id, participant_id, image_id, user_choice, is_correct, confidence, response_time_ms, created_at)`

Optional (recommended) for quick email capture prior to auth (if desired):
- `email_captures(id bigserial pk, participant_id uuid, email text, created_at timestamptz default now())`
  - Purpose: store an email before full Supabase Auth. If you stick to Auth-only, you can skip this table.

---

## 3) Security & RLS Plan

- Keep RLS enabled on all tables.
- Use a Supabase Service Role key ONLY inside Next.js Route Handlers/Server Actions to perform server-validated writes for anonymous participants.

Policies to add when enabling features:

- `images`: already has public SELECT true.
- `participants`:
  - INSERT: via server (service role). No public insert policy needed.
  - SELECT: later allow user to view their own sessions.
    - USING: `auth.uid() = user_id`
- `users`:
  - SELECT: `auth.uid() = id`
  - UPDATE: `auth.uid() = id`
- `trials`:
  - INSERT: via server (service role) after computing `is_correct`.
  - SELECT (later for history):
    - USING: `EXISTS (SELECT 1 FROM participants p WHERE p.id = trials.participant_id AND p.user_id = auth.uid())`

Note: Service Role bypasses RLS; restrict usage to server-only code and never expose it to the browser.

---

## 4) API Design (Next.js Route Handlers)

All routes live under `src/app/api/.../route.ts`. Use `@supabase/supabase-js` twice:
- Public client (anon) for browser-only needs.
- Admin client (service role) inside server routes.

Add env var: `SUPABASE_SERVICE_ROLE_KEY` (Vercel + `.env.local`) — server-only.

1) POST `/api/start-test`
- Request: `{ selfRatedSkill: number (1–7), countryCode: string }`
- Server behavior:
  - Create participant row.
  - Select and shuffle N images (e.g., 40) with balancing (see Randomization below).
  - Set HttpOnly cookie `te_pid=<participant_id>; Max-Age=90d`.
- Response: `{ participantId, images: Array<{ id, image_url, category, source_type? (omit in client), ai_model? (omit), ... }> }`

2) POST `/api/submit-trial`
- Request: `{ participantId, imageId, choice: 'human'|'ai', confidence: 1..5, responseTimeMs: number }`
- Server behavior:
  - Fetch `images.source_type` for `imageId`.
  - Compute `is_correct = (choice === source_type)`.
  - Insert into `trials` using service role.
- Response: `{ ok: true }`

3) GET `/api/results?participantId=...`
- Server behavior:
  - Aggregate trials for the participant: total, correct, accuracy, breakdown by `category`, optional model breakdown.
  - Compute global average from all trials (simple overall accuracy P50 or mean).
- Response: `{ score: number, total: number, globalAvg: number, breakdown?: {...} }`

4) POST `/api/associate-user`
- Purpose: After Supabase Auth success in the browser, call this to link the current participant to `auth.user.id`.
- Request: `{ participantId }` (user must be authenticated; use server-side session in route to get `auth.uid`).
- Server: update `participants.user_id = auth.uid()` if null.

5) POST `/api/profile/upsert`
- Purpose: Save demographics on `users`.
- Auth required. Update only `id = auth.uid()`.
- Request: `{ age_range?, education_level?, occupation_field?, income_range? }`

6) POST `/api/email/send-report` (Phase 4)
- Purpose: Send instant email report via Resend.
- Request: `{ participantId }` (auth optional — send to the authenticated user’s email).

Randomization (server-side):
- Target N images (e.g., 40). Balance by:
  - 50/50 human vs ai overall.
  - Even spread across `category`.
  - For AI, sample across `ai_model`.
- Implementation sketch:
  - Query bucketed IDs per `source_type`/`category` and sample with `ORDER BY random()` and `LIMIT` ratios.
  - Shuffle final list in server code before returning.

---

## 5) Frontend Implementation Plan

Structure (App Router):
- `src/app/page.tsx` — Landing (Step 1)
- `src/app/start/page.tsx` — Lean form (Step 2)
- `src/app/test/page.tsx` — Core test (Step 3)
- `src/app/results/page.tsx` — Results & upgrade (Step 4)
- `src/app/api/*/route.ts` — API routes listed above
- `src/middleware.ts` — optional: geolocation hints/cookies
- `src/lib/supabase/client.ts` — public client
- `src/lib/supabase/admin.ts` — admin client (service role)
- `src/components/*` — UI building blocks

Key components (shadcn/ui based):
- `CountrySelect` (Select)
- `SkillScale` (ToggleGroup 1–7)
- `ConfidenceScale` (ToggleGroup 1–5)
- `ImageCard` (Next/Image, skeleton while loading)
- `ProgressBar` (Radix Progress)
- `ResultsCard`, `GlobalAvgBadge`, `AuthButtons`

Geo prefill:
- Use Vercel header `x-vercel-ip-country` via `headers()` in server component, or set a cookie in `middleware.ts`.

Response time capture (client):
- Start timestamp when image becomes visible (`onLoad` or after a tiny delay to ensure render).
- End timestamp on choice click; compute `responseTimeMs = end - start` using `performance.now()`.

Accessibility & UX:
- Keyboard shortcuts (H/A, 1–5). Focus ring on active elements.
- No layout shift; prefetch next image; use `next/image` for optimization.

---

## 6) Auth Flow (Results page)

Recommended: Supabase Auth magic link + Google OAuth.
- On results page, render:
  - Email field -> `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: '<prod-url>/results' } })`.
  - Social buttons: `signInWithOAuth({ provider: 'google' })`.
- After auth success, call `/api/associate-user` to link the current `participantId` to `auth.user.id`.
- Then show demographics form; POST to `/api/profile/upsert`.

Note: Because `users.id` references `auth.users.id`, you cannot store an email there until the user authenticates. For pre-auth email capture, use the optional `email_captures` table.

---

## 7) Reporting & Email (Phase 4)

- Email provider: Resend. Env var: `RESEND_API_KEY` (Vercel + local).
- When a user authenticates, trigger `/api/email/send-report` with a simple HTML summary and a link back to the detailed report page.

---

## 8) Analytics & Privacy

- Start with Vercel Analytics. Optionally add PostHog for event-level analysis.
- Region: keep data in EU (Frankfurt). Avoid sending PII to third parties without consent.
- Add a simple cookie banner if adding analytics beyond Vercel’s privacy-friendly defaults.

---

## 9) Milestones & Acceptance Criteria

- M1 (MVP Core Test): landing, lean form, start-test API, test UI, submit-trial API, results summary.
  - AC: Anonymous user completes 40 trials, sees score and global average.
- M2 (Save Score): Auth on results page, associate participant to user, demographics.
  - AC: A user logs in and profile rows update under RLS.
- M3 (Email Report): Send instant report via Resend after auth; branded HTML.
  - AC: Email delivered and links to results.
- M4 (Polish & Domain): Connect `turingeyes.com` (Vercel + GoDaddy), add metadata, OG images, QA.

---

## 10) Risks & Mitigations

- Cheating/data quality: randomize image order, avoid showing answers, throttle repeated sessions per IP, optional simple bot checks.
- RLS pitfalls: keep all anonymous writes on server with service role; add tests for policies.
- Image performance: use CDN (Supabase Storage + caching), `next/image`, preloading.

---

## 11) Immediate Next Tasks (starting Phase 2)

1) Add `SUPABASE_SERVICE_ROLE_KEY` to Vercel and `.env.local` (server-only).
2) Create `src/lib/supabase/admin.ts` and `client.ts` helpers.
3) Implement `/api/start-test` (create participant, select/shuffle images, set cookie).
4) Build `src/app/start/page.tsx` form (Skill 1–7, Country with prefill, validation).
5) Build `src/app/test/page.tsx` with trial flow and client-side response time capture; wire to `/api/submit-trial`.
6) Build `src/app/results/page.tsx` and `/api/results` aggregation endpoint.
7) Add auth UI (magic link + Google) on results page; implement `/api/associate-user` and `/api/profile/upsert`.

---

## 12) Appendix — Example Policy SQL (add when enabling features)

```sql
-- users: self read/update
create policy "users_self_select" on public.users
  for select using (auth.uid() = id);

create policy "users_self_update" on public.users
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- participants: user can read their own sessions (add when you build history)
create policy "participants_self_select" on public.participants
  for select using (auth.uid() = user_id);

-- trials: user can read trials of their sessions (add when you build history)
create policy "trials_self_select" on public.trials
  for select using (
    exists (
      select 1 from public.participants p
      where p.id = trials.participant_id and p.user_id = auth.uid()
    )
  );
```

---

This PRD and plan are tailored to your current codebase and Supabase setup. Follow the Immediate Next Tasks to ship M1 quickly, then iterate.
