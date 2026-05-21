# HostOps CZ Product Spec

## Goal
Build a 60-day sellable v1 for Prague short-term rental managers with 5-50 properties. The product reduces weekly operations time by automating low-risk guest replies and preparing human-approved Ubyport/eTurista compliance exports.

## Users
- Property manager: owns the account, reviews operations, downloads exports, tracks ROI.
- Operations agent: handles escalations, checks guest form completion, edits property knowledge.
- Guest: receives check-in instructions, submits required identity fields, asks routine stay questions.

## V1 Scope
- Multi-tenant admin dashboard backed by Supabase Auth and Postgres.
- Dashboard is a multi-page operations console: overview, compliance, messages, reservations, properties, and knowledge each have their own focused page.
- Property knowledge base and source-backed AI draft generation.
- WhatsApp/email conversation inbox with risk gating.
- Secure structured check-in form. No passport photo upload and no OCR in v1.
- Compliance queue with export-ready guest records and human approval.
- API route skeletons for Meta WhatsApp, inbound email, guest form submit, AI response, and Ubyport export.

## Pilot-Ready Core Scope
- Admin can manually create, edit, and delete properties and reservations.
- Admin can add text/Markdown knowledge documents per property and approve them for AI use.
- PMS/channel-manager webhooks are the first operational path for Airbnb reservation and guest-message events; direct Airbnb API access remains out of scope until partner access exists.
- AI automatically classifies inbound guest messages, retrieves approved property knowledge, and sends safe sourced replies through connected channels.
- Legal, privacy, identity/PII, emergency, complaint, refund, compensation, and missing-source cases are automatically acknowledged and escalated to operators.
- New reservations automatically create compliance records and check-in messaging tasks.
- Refund, complaint, emergency, legal, privacy, and missing-source messages create operator review cases after a safe acknowledgement.
- Dashboard shows the latest AI automation decision, provider delivery status, and recent decision history separately from the legacy draft workflow.
- Dashboard keeps create/edit forms inside the relevant focused page instead of showing every workflow in one long screen.
- AI drafts use OpenAI Responses API with `OPENAI_MODEL`, defaulting to `gpt-5.4-mini`.
- Knowledge retrieval is intentionally simple in this phase: approved property documents are ranked by keyword overlap and the top sources are sent to the model.
- Hetzner preview must run from Docker Compose. Use `https://178.104.197.9.sslip.io` for the current HTTPS pilot preview. If HTTPS is not available, use HTTP only for smoke tests and do not collect real guest PII.
- When nginx already owns public `80/443`, it terminates TLS and proxies HostOps to the internal HTTP preview on `127.0.0.1:8080`.

## Real Data Model
- `organizations`: tenant boundary for each property management company.
- `memberships`: maps Supabase auth users to organizations and roles.
- `properties`: rental units owned by one organization.
- `reservations`: stay records with unique guest check-in tokens.
- `guests`: structured guest identity records for compliance.
- `compliance_forms`: status and encrypted identity fields for Ubyport/eTurista export.
- `conversations` and `messages`: inbound guest support threads and AI decisions.
- `knowledge_documents`: approved property knowledge sources.
- `audit_logs`: append-only operational trace for forms, exports, and AI decisions.
- `operation_tasks`: scheduled operational work such as check-in links and reminders.
- `operation_cases`: human-review queue for risky guest operations decisions.

## Auth and RLS
- Admin users sign in with email and password through Supabase Auth.
- `/dashboard` is protected. Unauthenticated users are redirected to `/login`.
- Every tenant-scoped table has `organization_id`.
- RLS allows reads and writes only when `organization_id` belongs to the authenticated user's memberships.
- Guest check-in forms are public only through an unexpired reservation token and do not expose passport values.

## Edge Cases
- Missing Supabase environment variables show a setup screen instead of demo data.
- Invalid or expired guest token returns `404`.
- Check-in submit with missing required fields returns `400`.
- Ubyport export includes only approved records for the current tenant.
- AI response never receives encrypted passport, date of birth, or nationality fields.
- AI auto-send fails closed when no approved property knowledge is found.
- AI sends externally only when the deterministic risk gate, approved source retrieval, and structured decision all allow auto-send.
- Plain HTTP guest links are for smoke testing only.

## Non-Goals
- Direct Airbnb/Booking API integration without an approved PMS/channel-manager or partner API path.
- Direct Ubyport police submission.
- Stripe subscriptions.
- OCR or identity document image storage.

## Safety Rules
- Passport and identity fields never go to an LLM.
- AI may auto-answer only low-risk questions grounded in approved property knowledge.
- Refunds, discounts, complaints, emergencies, legal questions, missing context, and personal data requests receive a safe acknowledgement and require human review.
- Every automated answer must have a source label, AI decision record, provider delivery status, and audit event.
- Operators can inspect recent AI decision history before manually rerunning automation.
- AI may open operational cases and send safe acknowledgements, but may not approve refunds, discounts, legal advice, or emergency resolutions.

## Success Criteria
- Admin can see operations hours saved, automated replies, pending compliance forms, and escalation queue.
- A guest can submit structured check-in data through a tokenized form.
- A manager can download a compliance export from approved records.
- Pilot guest check-in links use HTTPS before real guest identity data is collected.
- Safe guest operations messages can be handled end to end by AI with auditable outbound delivery.
- PMS reservation and message webhooks create the right reservation, conversation, compliance, task, case, and audit records idempotently.
- Operators can distinguish the live automation action from the legacy internal draft action in the dashboard.
- Lint and production build pass.
