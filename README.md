# HostOps CZ

AI guest operations and compliance assistant for Prague short-term rental managers.

## What is included
- Protected operations dashboard with message risk queue, compliance queue, property knowledge health, ROI metrics, and manual pilot onboarding.
- Tokenized guest check-in forms at `/guest/check-in/[token]`.
- Supabase Auth/Postgres schema, RLS migration, encrypted PII check-in storage, and tenant-scoped Ubyport CSV export.
- API routes for AI risk gating, Meta WhatsApp, Mailgun inbound email, check-in submission, and Ubyport export.
- Product spec in `docs/product-spec.md`.

## Supabase setup

1. Create a new Supabase project in an EU region.
2. Run all SQL files in `supabase/migrations` in filename order.
3. Create the first admin user in Supabase Auth.
4. Copy `.env.example` to `.env.local` and fill the Supabase and encryption values.
5. Optional: edit `supabase/seed.sql` with the auth user UUID and run it for pilot data.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000/login`.

## Checks

```bash
npm run lint
npm run test
npm run build
```

## Deployment target
- App: Next.js running in Docker on a Hetzner EU VPS.
- Reverse proxy: Caddy via `deploy/Caddyfile`.
- Data/auth/storage: Supabase EU project.
- Messaging: Meta WhatsApp Cloud API and Mailgun EU inbound email.
- Compliance: human-approved export only in v1; no direct police submission.
