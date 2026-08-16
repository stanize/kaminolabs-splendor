-- Splendor-clone schema
-- Run this in your Supabase project's SQL editor.

create table if not exists games (
  id uuid primary key default gen_random_uuid(),
  room_code text unique not null,
  state jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Keep updated_at fresh on every write
create or replace function touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists games_touch_updated_at on games;
create trigger games_touch_updated_at
before update on games
for each row execute procedure touch_updated_at();

-- Enable Realtime on this table (also toggle in Supabase Dashboard > Database > Replication)
alter publication supabase_realtime add table games;

-- RLS: personal-use app, so keep it simple — anyone with the room code (i.e. the row id)
-- can read/write. Good enough for a private, non-indexed, unlisted game room.
-- Tighten this later if you ever expose it publicly.
alter table games enable row level security;

create policy "public read" on games for select using (true);
create policy "public insert" on games for insert with check (true);
create policy "public update" on games for update using (true);
