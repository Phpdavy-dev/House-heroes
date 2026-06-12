-- House Heroes – Supabase schema
-- Plak dit volledige bestand in de SQL Editor van je Supabase-project en voer het uit.

create table if not exists profiles (
  id serial primary key,
  name text not null unique,
  emoji text not null default '🙂',
  color text not null default '#FF6B4A'
);

create table if not exists chores (
  id serial primary key,
  name text not null,
  emoji text not null default '🧹',
  points int not null check (points > 0),
  category text not null default 'overig', -- keuken | schoonmaak | was | overig
  active boolean not null default true
);

create table if not exists chore_logs (
  id bigserial primary key,
  user_id int not null references profiles(id) on delete cascade,
  chore_id int not null references chores(id) on delete cascade,
  points int not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  approved_by int references profiles(id),
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create index if not exists chore_logs_user_idx on chore_logs (user_id, created_at);
create index if not exists chore_logs_status_idx on chore_logs (status);

-- Eerste versie: geen login, dus open policies voor de anon key.
alter table profiles enable row level security;
alter table chores enable row level security;
alter table chore_logs enable row level security;

create policy "read profiles" on profiles for select using (true);
create policy "read chores" on chores for select using (true);
create policy "write chores" on chores for all using (true) with check (true);
create policy "read logs" on chore_logs for select using (true);
create policy "insert logs" on chore_logs for insert with check (true);
create policy "update logs" on chore_logs for update using (true) with check (true);
create policy "delete logs" on chore_logs for delete using (true);

-- Realtime updates voor alle apparaten
alter publication supabase_realtime add table chore_logs;
alter publication supabase_realtime add table chores;

-- Bewoners
insert into profiles (name, emoji, color) values
  ('Manuela', '🌸', '#E0589B'),
  ('Davy', '🦊', '#FF6B4A'),
  ('Destiny', '⭐', '#F5B12D'),
  ('Jayden', '🚀', '#2D9C8F'),
  ('Gwenn', '🦄', '#7C6BD6')
on conflict (name) do nothing;

-- Standaard klusjes
insert into chores (name, emoji, points, category) values
  ('Boodschappen doen', '🛒', 20, 'overig'),
  ('Eten koken', '🍳', 25, 'keuken'),
  ('Tafel dekken', '🍽️', 10, 'keuken'),
  ('Tafel afruimen', '🧺', 10, 'keuken'),
  ('Vaatwasser inruimen', '🫧', 10, 'keuken'),
  ('Vaatwasser uitruimen', '🍴', 10, 'keuken'),
  ('Kamer opruimen', '🛏️', 15, 'schoonmaak'),
  ('Stofzuigen', '🌀', 20, 'schoonmaak'),
  ('Dweilen', '🪣', 20, 'schoonmaak'),
  ('Badkamer schoonmaken', '🛁', 30, 'schoonmaak'),
  ('WC schoonmaken', '🚽', 25, 'schoonmaak'),
  ('Tuin opruimen', '🌿', 30, 'overig'),
  ('Was ophangen', '👕', 15, 'was'),
  ('Was opvouwen', '🧦', 15, 'was'),
  ('Afval wegbrengen', '🗑️', 10, 'overig'),
  ('Ramen lappen', '🪟', 30, 'schoonmaak');

-- ===== Update: vaste taken per weekdag =====
create table if not exists assignments (
  id serial primary key,
  user_id int not null references profiles(id) on delete cascade,
  chore_id int not null references chores(id) on delete cascade,
  weekday int not null check (weekday between 1 and 7) -- 1=maandag ... 7=zondag
);

alter table assignments enable row level security;
create policy "read assignments" on assignments for select using (true);
create policy "write assignments" on assignments for all using (true) with check (true);
alter publication supabase_realtime add table assignments;

-- ===== Update: instelbaar weekdoel =====
create table if not exists settings (
  key text primary key,
  value int not null
);
insert into settings (key, value) values ('week_goal', 7) on conflict (key) do nothing;
alter table settings enable row level security;
create policy "read settings" on settings for select using (true);
create policy "write settings" on settings for all using (true) with check (true);
alter publication supabase_realtime add table settings;
