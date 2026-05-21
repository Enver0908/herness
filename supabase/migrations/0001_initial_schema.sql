create extension if not exists "pgcrypto";

create type public.member_role as enum ('owner', 'operator');
create type public.message_status as enum ('auto_sent', 'needs_review', 'draft', 'resolved');
create type public.risk_level as enum ('low', 'medium', 'high');
create type public.compliance_status as enum ('missing', 'submitted', 'approved', 'exported');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.member_role not null default 'owner',
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  area text not null,
  address text not null,
  channel text not null default 'Airbnb',
  knowledge_health integer not null default 0 check (knowledge_health between 0 and 100),
  created_at timestamptz not null default now()
);

create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  guest_display_name text not null,
  guest_email text,
  arrival_date date not null,
  departure_date date,
  check_in_token text not null unique,
  token_expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table public.guests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  encrypted_full_name text not null,
  encrypted_date_of_birth text not null,
  encrypted_nationality text not null,
  encrypted_passport_number text not null,
  receipt_email text,
  created_at timestamptz not null default now()
);

create table public.compliance_forms (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  guest_id uuid references public.guests(id) on delete set null,
  status public.compliance_status not null default 'missing',
  submitted_at timestamptz,
  approved_at timestamptz,
  exported_at timestamptz,
  created_at timestamptz not null default now(),
  unique (reservation_id)
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  property_id uuid references public.properties(id) on delete set null,
  reservation_id uuid references public.reservations(id) on delete set null,
  guest_display_name text not null,
  channel text not null,
  language text not null default 'English',
  status public.message_status not null default 'draft',
  risk public.risk_level not null default 'low',
  source_label text,
  minutes_saved integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  direction text not null check (direction in ('inbound', 'outbound', 'ai_draft')),
  body text not null,
  created_at timestamptz not null default now()
);

create table public.knowledge_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  property_id uuid references public.properties(id) on delete cascade,
  title text not null,
  body text not null,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.organizations enable row level security;
alter table public.memberships enable row level security;
alter table public.properties enable row level security;
alter table public.reservations enable row level security;
alter table public.guests enable row level security;
alter table public.compliance_forms enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.knowledge_documents enable row level security;
alter table public.audit_logs enable row level security;

create or replace function public.current_organization_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id from public.memberships where user_id = auth.uid()
$$;

create policy "members can read own organizations"
on public.organizations for select
using (id in (select public.current_organization_ids()));

create policy "members can read memberships"
on public.memberships for select
using (organization_id in (select public.current_organization_ids()));

create policy "members can manage properties"
on public.properties for all
using (organization_id in (select public.current_organization_ids()))
with check (organization_id in (select public.current_organization_ids()));

create policy "members can manage reservations"
on public.reservations for all
using (organization_id in (select public.current_organization_ids()))
with check (organization_id in (select public.current_organization_ids()));

create policy "members can manage guests"
on public.guests for all
using (organization_id in (select public.current_organization_ids()))
with check (organization_id in (select public.current_organization_ids()));

create policy "members can manage compliance forms"
on public.compliance_forms for all
using (organization_id in (select public.current_organization_ids()))
with check (organization_id in (select public.current_organization_ids()));

create policy "members can manage conversations"
on public.conversations for all
using (organization_id in (select public.current_organization_ids()))
with check (organization_id in (select public.current_organization_ids()));

create policy "members can manage messages"
on public.messages for all
using (organization_id in (select public.current_organization_ids()))
with check (organization_id in (select public.current_organization_ids()));

create policy "members can manage knowledge"
on public.knowledge_documents for all
using (organization_id in (select public.current_organization_ids()))
with check (organization_id in (select public.current_organization_ids()));

create policy "members can read audit logs"
on public.audit_logs for select
using (organization_id in (select public.current_organization_ids()));
