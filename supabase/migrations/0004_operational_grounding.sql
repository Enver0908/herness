alter table public.reservations
  add column if not exists provider text,
  add column if not exists provider_reservation_id text,
  add column if not exists reservation_status text not null default 'confirmed',
  add column if not exists guest_phone text,
  add column if not exists channel text not null default 'Airbnb',
  add column if not exists special_requests text,
  add column if not exists external_url text;

alter table public.conversations
  add column if not exists provider text,
  add column if not exists provider_thread_id text,
  add column if not exists last_provider_message_id text;

create unique index if not exists reservations_provider_reservation_idx
on public.reservations (organization_id, provider, provider_reservation_id)
where provider is not null and provider_reservation_id is not null;

create unique index if not exists conversations_provider_thread_idx
on public.conversations (organization_id, provider, provider_thread_id)
where provider is not null and provider_thread_id is not null;

create table if not exists public.operation_cases (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  property_id uuid references public.properties(id) on delete set null,
  reservation_id uuid references public.reservations(id) on delete set null,
  conversation_id uuid references public.conversations(id) on delete set null,
  message_id uuid references public.messages(id) on delete set null,
  case_type text not null,
  status text not null default 'open',
  risk public.risk_level not null default 'medium',
  title text not null,
  summary text not null,
  recommended_action text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.operation_tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  property_id uuid references public.properties(id) on delete set null,
  reservation_id uuid references public.reservations(id) on delete cascade,
  task_type text not null,
  status text not null default 'pending',
  due_at timestamptz,
  completed_at timestamptz,
  delivery_status text not null default 'not_sent',
  last_error text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists operation_cases_status_idx
on public.operation_cases (organization_id, status, created_at desc);

create index if not exists operation_tasks_due_idx
on public.operation_tasks (organization_id, status, due_at);

alter table public.operation_cases enable row level security;
alter table public.operation_tasks enable row level security;

drop policy if exists "members can manage operation cases" on public.operation_cases;
create policy "members can manage operation cases"
on public.operation_cases for all
using (organization_id in (select public.current_organization_ids()))
with check (organization_id in (select public.current_organization_ids()));

drop policy if exists "members can manage operation tasks" on public.operation_tasks;
create policy "members can manage operation tasks"
on public.operation_tasks for all
using (organization_id in (select public.current_organization_ids()))
with check (organization_id in (select public.current_organization_ids()));

drop trigger if exists touch_operation_cases_updated_at on public.operation_cases;
create trigger touch_operation_cases_updated_at
before update on public.operation_cases
for each row execute function public.touch_updated_at();

drop trigger if exists touch_operation_tasks_updated_at on public.operation_tasks;
create trigger touch_operation_tasks_updated_at
before update on public.operation_tasks
for each row execute function public.touch_updated_at();
