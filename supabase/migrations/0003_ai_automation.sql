do $$
begin
  create type public.ai_job_status as enum ('pending', 'running', 'done', 'failed');
exception
  when duplicate_object then null;
end $$;

create table public.ai_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  message_id uuid references public.messages(id) on delete cascade,
  job_type text not null default 'guest_message',
  status public.ai_job_status not null default 'pending',
  attempts integer not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ai_decisions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  message_id uuid references public.messages(id) on delete set null,
  category text not null,
  risk public.risk_level not null,
  can_auto_send boolean not null default false,
  confidence numeric not null default 0,
  reason text not null,
  escalation_reason text,
  source_label text,
  model text,
  pii_detected boolean not null default false,
  provider text,
  delivery_status text not null default 'not_sent',
  created_at timestamptz not null default now()
);

alter table public.messages
  add column if not exists provider text,
  add column if not exists provider_message_id text,
  add column if not exists delivery_status text not null default 'not_sent';

alter table public.conversations
  add column if not exists guest_email text,
  add column if not exists guest_phone text;

create unique index if not exists messages_provider_message_id_idx
on public.messages (provider, provider_message_id)
where provider is not null and provider_message_id is not null;

alter table public.ai_jobs enable row level security;
alter table public.ai_decisions enable row level security;

drop policy if exists "members can read ai jobs" on public.ai_jobs;
create policy "members can read ai jobs"
on public.ai_jobs for select
using (organization_id in (select public.current_organization_ids()));

drop policy if exists "members can read ai decisions" on public.ai_decisions;
create policy "members can read ai decisions"
on public.ai_decisions for select
using (organization_id in (select public.current_organization_ids()));

drop trigger if exists touch_ai_jobs_updated_at on public.ai_jobs;
create trigger touch_ai_jobs_updated_at
before update on public.ai_jobs
for each row execute function public.touch_updated_at();
