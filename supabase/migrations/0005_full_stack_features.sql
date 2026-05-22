-- Migration 0005: Full Stack Features

-- Add column ubyport_id to public.compliance_forms
alter table public.compliance_forms
  add column if not exists ubyport_id text;

-- Create public.ubyport_sync_logs table
create table if not exists public.ubyport_sync_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  status text not null,
  record_count integer not null default 0,
  error_message text,
  created_at timestamptz not null default now()
);

-- Enable RLS and add policy for ubyport_sync_logs
alter table public.ubyport_sync_logs enable row level security;

drop policy if exists "members can manage ubyport_sync_logs" on public.ubyport_sync_logs;
create policy "members can manage ubyport_sync_logs"
on public.ubyport_sync_logs for all
using (organization_id in (select public.current_organization_ids()))
with check (organization_id in (select public.current_organization_ids()));

-- Create public.organization_settings table
create table if not exists public.organization_settings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references public.organizations(id) on delete cascade,
  quiet_hours_start text not null default '22:00',
  quiet_hours_end text not null default '06:00',
  waste_sorting_rules text not null default 'Sort waste: blue (paper), yellow (plastic), green/glass, orange (beverage cartons), black (mixed municipal waste).',
  local_tourist_tax_czk numeric not null default 50,
  other_rules text not null default 'Quiet hours must be respected. Under no circumstances should tourist taxes be waived.',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS and add policy for organization_settings
alter table public.organization_settings enable row level security;

drop policy if exists "members can manage organization_settings" on public.organization_settings;
create policy "members can manage organization_settings"
on public.organization_settings for all
using (organization_id in (select public.current_organization_ids()))
with check (organization_id in (select public.current_organization_ids()));

-- Add touch_organization_settings_updated_at trigger
drop trigger if exists touch_organization_settings_updated_at on public.organization_settings;
create trigger touch_organization_settings_updated_at
before update on public.organization_settings
for each row execute function public.touch_updated_at();
