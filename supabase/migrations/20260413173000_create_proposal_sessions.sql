-- Create table to record checkout sessions and their payment status
create table if not exists public.proposal_sessions (
  id uuid primary key default gen_random_uuid(),
  session_id text not null unique,
  paid boolean not null default false,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Update trigger to keep updated_at current
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_proposal_sessions_updated_at on public.proposal_sessions;
create trigger update_proposal_sessions_updated_at
before update on public.proposal_sessions
for each row execute function public.update_updated_at_column();

comment on table public.proposal_sessions is 'Tracks Dodo checkout sessions and whether they have been paid. Populated by webhook using metadata.sessionId.';
comment on column public.proposal_sessions.session_id is 'The session identifier you pass as metadata in Dodo checkout. Must be unique.';