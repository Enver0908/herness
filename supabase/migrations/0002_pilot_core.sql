alter table public.conversations
  add column if not exists ai_model text,
  add column if not exists ai_confidence numeric,
  add column if not exists approval_status text not null default 'none',
  add column if not exists approved_by_user_id uuid references auth.users(id) on delete set null,
  add column if not exists approved_at timestamptz;

alter table public.messages
  add column if not exists ai_model text,
  add column if not exists ai_confidence numeric,
  add column if not exists approval_status text not null default 'none',
  add column if not exists approved_by_user_id uuid references auth.users(id) on delete set null,
  add column if not exists approved_at timestamptz;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_conversations_updated_at on public.conversations;
create trigger touch_conversations_updated_at
before update on public.conversations
for each row execute function public.touch_updated_at();
