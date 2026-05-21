# HostOps CZ Handoff

Last updated: 2026-05-14

## Project
HostOps CZ is a Supabase-backed Next.js app for Prague short-term rental managers. The product is moving from a draft-only AI assistant toward full AI guest-operations automation: inbound WhatsApp/email/dashboard messages are classified, safe sourced replies are sent automatically, and legal/privacy/emergency/refund/missing-source cases are acknowledged and escalated.

## Current Status
- App lives under `C:\Users\Dell\OneDrive\Masaüstü\herness\hostops-cz`.
- Next.js 16, React 19, Supabase, Docker Compose.
- Production preview is live at `https://178.104.197.9.sslip.io/login`.
- HTTPS is terminated by nginx, then proxied to HostOps Caddy on `127.0.0.1:8080`.
- New frontend redesign is deployed.
- AI automation code is deployed.
- Supabase migration `0003_ai_automation.sql` is applied and verified.
- Smoke checks passed after the final hotfix:
  - `GET /login` returns `200 OK`.
  - Unauthenticated `GET /dashboard` returns `307` to `/login`.
  - `POST /api/jobs/ai/process` without secret returns `401`.
  - Malformed `POST /api/webhooks/email/mailgun` returns `400 {"error":"invalid_form_data"}`.
  - WhatsApp verify with wrong token returns `400`.

## Important Operating Rules
- Follow `C:\Users\Dell\OneDrive\Masaüstü\herness\codex.md`.
- `Process_narration=false` was explicitly requested.
- Keep changes minimal and tied to the product plan.
- Before major product changes, update `docs/product-spec.md`.
- Do not print or commit secrets.
- Prefer tests for auth, tenant isolation, PII, exports, webhooks, AI risk/automation behavior.
- There is no `.git` repository inside `hostops-cz` right now, so normal `git status/diff` is not available.

## Secrets / Env
Do not put secrets in git or docs.

Local secrets:
- `.env.local`

VPS secrets:
- `/opt/hostops-cz/.env`

Expected env values now include:
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `PII_ENCRYPTION_KEY`
- `CRON_SECRET`
- `HOSTOPS_DEFAULT_ORGANIZATION_ID`
- `HOSTOPS_DEFAULT_PROPERTY_ID`
- `META_WHATSAPP_VERIFY_TOKEN`
- `META_WHATSAPP_ACCESS_TOKEN`
- `META_WHATSAPP_PHONE_NUMBER_ID`
- `MAILGUN_API_KEY`
- `MAILGUN_SIGNING_KEY`
- `MAILGUN_DOMAIN`
- Optional deploy values: `HOSTOPS_DOMAIN`, `HOSTOPS_HTTP_PORT`, `HOSTOPS_HTTPS_PORT`

## Supabase
- Project ref: `uiioayancvkjwjklklxf`.
- Region shown in Supabase UI: West EU / Ireland.
- Organization: `HostOps CZ Pilot`.
- Migrations applied:
  - `supabase/migrations/0001_initial_schema.sql`
  - `supabase/migrations/0002_pilot_core.sql`
  - `supabase/migrations/0003_ai_automation.sql`
- `0003_ai_automation.sql` added:
  - `ai_job_status` enum.
  - `ai_jobs`.
  - `ai_decisions`.
  - provider/idempotency/delivery columns on `messages`.
  - `guest_email` and `guest_phone` on `conversations`.
  - RLS read policies for AI tables.
- Migration was verified from local code using Supabase service role:
  - `ai_jobs` accessible.
  - `ai_decisions` accessible.
  - `messages.provider/provider_message_id/delivery_status` accessible.
  - `conversations.guest_email/guest_phone` accessible.

## Implemented Product Surface
- `/login`: Supabase email/password login.
- `/logout`: logout.
- `/dashboard`: protected admin dashboard backed by Supabase.
- `/guest/check-in/[token]`: public guest check-in form by reservation token.
- `GET /api/exports/ubyport`: CSV export for approved compliance records.
- `POST /api/forms/check-in`: validates token, encrypts PII, creates compliance form, writes audit log.
- `POST /api/ai/respond`: legacy/admin draft API still present.
- `POST /api/jobs/ai/process`: internal AI job processor guarded by `CRON_SECRET`.
- `POST /api/messages/send`: authenticated operator-safe outbound send.
- `GET/POST /api/webhooks/whatsapp/meta`: Meta verify + inbound ingestion.
- `POST /api/webhooks/email/mailgun`: Mailgun inbound ingestion with signature validation when configured.

## AI Automation Behavior
- Inbound webhook messages create:
  - `conversations`
  - inbound `messages`
  - `ai_jobs`
  - audit log
- AI job processor pipeline:
  - deterministic PII redaction
  - risk classification
  - approved property knowledge retrieval
  - safe auto-send decision
  - outbound provider send
  - `messages.direction = outbound`
  - `ai_decisions`
  - conversation status update
  - audit log
- Safe routine guest ops can auto-send when grounded in approved property knowledge.
- Risky cases receive a safe acknowledgement and escalate:
  - legal/regulatory
  - privacy/identity/PII
  - emergency/injury/security
  - refund/discount/compensation
  - complaint
  - missing approved source
- AI must not receive passport, DOB, nationality, visa, or identity fields.
- Auto-send requires provider env values to be configured.

## Important Code Areas
- `src/lib/ai/redaction.ts`: deterministic PII redaction.
- `src/lib/ai/triage.ts`: automation classification and prompt building.
- `src/lib/ai/jobs.ts`: AI job queue processing and auto-send orchestration.
- `src/lib/providers.ts`: WhatsApp/Mailgun outbound senders.
- `src/lib/inbound.ts`: webhook inbound persistence and job enqueue.
- `src/lib/ai-draft.ts`: legacy/admin draft prompt builder.
- `src/lib/openai.ts`: OpenAI Responses API wrapper.
- `src/lib/knowledge.ts`: approved knowledge retrieval/ranking.
- `src/lib/safety.ts`: deterministic escalation terms.
- `src/lib/dashboard.ts`: dashboard data mapper, now reads latest AI decisions.
- `src/app/dashboard/page.tsx`: main admin UI.
- `src/app/dashboard/actions.ts`: dashboard server actions, including manual run automation.
- `src/app/api/jobs/ai/process/route.ts`: cron/internal processor.
- `src/app/api/messages/send/route.ts`: authenticated operator outbound send.
- `src/app/api/webhooks/whatsapp/meta/route.ts`: Meta webhook.
- `src/app/api/webhooks/email/mailgun/route.ts`: Mailgun webhook.
- `supabase/migrations/0003_ai_automation.sql`: latest database changes.

## Deployment Notes
- VPS: `178.104.197.9`.
- Public URL: `https://178.104.197.9.sslip.io/login`.
- nginx owns public `80/443`.
- HostOps Compose uses:
  - `HOSTOPS_DOMAIN=:80`
  - `HOSTOPS_HTTP_PORT=8080`
  - `HOSTOPS_HTTPS_PORT=8443`
- nginx proxies `178.104.197.9.sslip.io` to `http://127.0.0.1:8080`.
- The last deploy had an issue where an archive copy did not overwrite the live Mailgun route. Final fix was applied by uploading `src/app/api/webhooks/email/mailgun/route.ts` directly to `/opt/hostops-cz/...` and running:
  - `docker compose build --no-cache hostops-cz`
  - `docker compose up -d`
- If production seems stale after future deploys, verify live file content first and rebuild with `--no-cache`.

## Verification Already Run
Local:
- `npm run lint` passed.
- `npm run test` passed: 8 test files, 14 tests.
- `npm run build` passed.

Production smoke:
- `curl -I https://178.104.197.9.sslip.io/login` => `200 OK`.
- `curl -I https://178.104.197.9.sslip.io/dashboard` => `307 /login` when unauthenticated.
- `curl -i -X POST https://178.104.197.9.sslip.io/api/jobs/ai/process` => `401`.
- `curl -i -X POST https://178.104.197.9.sslip.io/api/webhooks/email/mailgun` => `400 {"error":"invalid_form_data"}`.
- Wrong WhatsApp verify token => `400`.

## Known Constraints / Risks
- No full real WhatsApp outbound test has been completed yet.
- No full real Mailgun outbound/inbound signed webhook test has been completed yet.
- `HOSTOPS_DEFAULT_ORGANIZATION_ID` and `HOSTOPS_DEFAULT_PROPERTY_ID` should be set for webhook ingestion to target the intended pilot workspace/property reliably.
- `CRON_SECRET` must be set and cron must call `POST /api/jobs/ai/process` for queued jobs to process automatically.
- The dashboard still contains legacy draft actions alongside new automation actions.
- Auto-send requires approved property knowledge. Missing source escalates.
- Provider credentials must not be tested with real guest PII.
- Ubyport/eTurista CSV field requirements still need real-world validation.
- Demo data vs pilot data separation still needs a product decision.

## Recommended Next Steps
1. Confirm VPS `.env` has:
   - `CRON_SECRET`
   - `HOSTOPS_DEFAULT_ORGANIZATION_ID`
   - `HOSTOPS_DEFAULT_PROPERTY_ID`
   - real provider values for WhatsApp/Mailgun if testing external sends.
2. Add/confirm cron on VPS:
   - `* * * * * curl -fsS -X POST https://178.104.197.9.sslip.io/api/jobs/ai/process -H "Authorization: Bearer $CRON_SECRET" >/dev/null 2>&1`
3. Do browser walkthrough:
   - Login.
   - Check dashboard data.
   - Add approved knowledge for a property.
   - Create fake inbound conversation or send fake webhook.
   - Verify AI job and decision records.
   - Verify safe auto-send or safe escalation behavior.
4. Test real signed provider flows with fake data only:
   - Meta WhatsApp verify + inbound text.
   - Mailgun signed inbound.
   - Outbound provider delivery.
5. Polish automation UX:
   - Make latest AI decision history easier to inspect.
   - Separate legacy “Generate draft” from new “Run automation” or remove legacy path after confidence.
   - Add explicit provider delivery failure display.
6. Prepare pilot data:
   - Separate demo and pilot organization data.
   - Confirm Czech reporting/export field requirements.

## Quick Recovery Commands
Production smoke:
```bash
curl -I https://178.104.197.9.sslip.io/login
curl -I https://178.104.197.9.sslip.io/dashboard
curl -i -X POST https://178.104.197.9.sslip.io/api/jobs/ai/process
curl -i -X POST https://178.104.197.9.sslip.io/api/webhooks/email/mailgun
```

VPS rebuild if stale:
```bash
cd /opt/hostops-cz
docker compose build --no-cache hostops-cz
docker compose up -d
docker compose logs --tail=80 hostops-cz
```
