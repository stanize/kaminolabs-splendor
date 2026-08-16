-- Splendor-clone schema (namespaced for a shared Supabase project)
-- Run this in your Supabase project's SQL editor.

create table if not exists splendor_games (
  id uuid primary key default gen_random_uuid(),
  room_code text unique not null,
  state jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Keep updated_at fresh on every write
create or replace function splendor_touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists splendor_games_touch_updated_at on splendor_games;
create trigger splendor_games_touch_updated_at
before update on splendor_games
for each row execute procedure splendor_touch_updated_at();

-- Enable Realtime on this table (also toggle in Supabase Dashboard > Database > Replication)
alter publication supabase_realtime add table splendor_games;

-- RLS: personal-use app, so keep it simple — anyone with the room code
-- can read/write. Good enough for a private, non-indexed, unlisted game room.
-- Tighten this later if you ever expose it publicly.
alter table splendor_games enable row level security;

create policy "splendor public read" on splendor_games for select using (true);
create policy "splendor public insert" on splendor_games for insert with check (true);
create policy "splendor public update" on splendor_games for update using (true);
