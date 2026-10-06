# Portfolio v2 — Professional Platform Plan

Stack decisions: PayFast/Yoco payments · South Africa (POPIA, CPA, ECTA) · Supabase Realtime chat + WebRTC calls · Vercel hosting.

## Findings in the current code (to fix first)

| # | Problem | Where |
|---|---------|-------|
| 1 | Admin password compared in plain text against an env var; login attempts **and the expected admin email** are written to logs | `src/lib/auth.ts` |
| 2 | `/admin` guard only checks that a session cookie *exists*, never that it is valid, so a forged cookie passes the proxy | `proxy.ts` |
| 3 | Admin session persists 24 h, so clicking Admin opens the dashboard straight away | `auth.ts`, `proxy.ts` |
| 4 | reCAPTCHA is only on resume download, is skipped in development, logs the response, and is **not** on contact or login | `api/resume/download`, `api/contact` |
| 5 | Contact emails are sent from `onboarding@resend.dev` (Resend's test sender), so they land in spam or are dropped. Only the owner is notified; the sender gets no confirmation | `api/contact/route.ts` |
| 6 | `typescript.ignoreBuildErrors: true` hides real bugs | `next.config.ts` |
| 7 | No security headers (CSP, HSTS, X-Frame-Options...) | `next.config.ts` |
| 8 | Whole site errors if the DB is down (every page queries it) | `layout.tsx`, `page.tsx` |
| 9 | Supabase project is paused/deleted, which is the current outage | Supabase |

## Phase 0 — Unblock (you)
1. Restore the Supabase project (or create a new one), update `DATABASE_URL`/`DIRECT_URL` locally and in Vercel.
2. Rename the Vercel project to `angelo-portfolio-v2` (Settings, General, Project Name) so the URL has no extra characters. Buying a domain is the proper fix; a `.co.za` is cheap.
3. Get a Resend account verified on a domain you own (needed for the email fix).
4. Create a PayFast (or Yoco) merchant account, sandbox first.
5. Create a LiveKit (or Daily) project for calls.

## Phase 1 — Security and reliability (no new accounts needed)
- Admin auth: hashed password (argon2/bcrypt) in the `User` table, remove credential logging, short session, **re-login required each time Admin is opened** (session-only cookie, no auto-redirect from the login page), lockout and rate limit on login, optional TOTP 2FA.
- Real session validation in the proxy/layout instead of cookie-exists.
- reCAPTCHA v3 verification on login, contact, resume request; never skipped silently in production.
- Security headers + CSP, CSRF/origin checks on mutating routes, input validation with zod everywhere.
- Remove `ignoreBuildErrors`, fix type errors.
- Graceful fallback content when the DB is unreachable, plus an error boundary and `/api/health`.

## Phase 2 — Contact and email deliverability
- Send from `no-reply@yourdomain` / `hello@yourdomain` via Resend with SPF, DKIM, DMARC set up on the domain.
- Owner notification + auto-confirmation to the sender, stored in DB (never lost), retry queue on failure, delivery/bounce webhook logging.
- Plain-text + HTML versions, proper headers, a Reply-To of the visitor.

## Phase 3 — Site-wide editing and UI/UX
- Every section editable from the admin, header and footer included (nav links, logo, footer text, legal links, socials, section order and visibility).
- Design pass: type scale, spacing, accessibility (WCAG AA), mobile-first layout, performance (images, fonts via `next/font`, no render-blocking Google font link), SEO/OG.

## Phase 4 — Client platform
Data model: `Client`, `Project` (client work), `Contract`, `Quote`, `Milestone`, `ProgressUpdate`, `WorkLog`, `OvertimeRequest`, `Payment`, `Message`, `Call`, `Document`, `AuditLog`.
- **Access code ("passkey")**: one per client, generated randomly (high entropy), shown once, stored only as a hash, rate-limited, expires when the contract is marked complete or cancelled.
- **Client dashboard**: live progress timeline (visible whether you are online or offline), documents, payments, profile.
- **Chat**: Supabase Realtime, both sides, desktop and mobile, unread badges, push/email notification when offline.
- **Calls**: popup ring + WebRTC call via LiveKit/Daily, on both sides.
- **Automated work log**: timer and activity entries, viewable and downloadable (PDF/CSV). Overtime flow: you flag overtime, client gets a request and must accept or decline, and the decision is logged.
- **Onboarding documents emailed automatically** when a client is created: quote, service agreement/contract, NDA, POPIA notice, terms (see legal note).
- **Payments**: deposit and final payment through PayFast/Yoco with signed webhook verification, receipts and invoices emailed.
- **Client profile**: edit details, **delete my account and data** (POPIA erasure, keeping only records the law requires, such as invoices), **cancel project** before or after deposit, with a clear "no refund once the deposit is paid" notice and acceptance recorded.

## Phase 5 — Compliance and hardening
- POPIA: privacy policy, information-officer details, consent capture with timestamps, data export/erase, retention schedule, breach procedure.
- ECTA/CPA: electronic signature and acceptance records (IP, timestamp, document version), cooling-off and cancellation wording reviewed.
- Row-level security on Supabase tables, encrypted storage for documents, audit logging, backups.
- Penetration-style checklist before launch.

> **Legal note:** I can draft the contract, quote, NDA, privacy policy and terms from standard South African freelance templates, but I'm not a lawyer. Have a South African attorney review them before real clients sign. This matters most for the no-refund clause and POPIA obligations.

## Suggested order
Phase 0, then 1, 2, 3, then 4 in slices (access code and dashboard shell, then progress and work log, then chat, then payments, then calls), then 5 alongside.
