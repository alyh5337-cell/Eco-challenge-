-- =========================================================
-- ECO CHALLENGE v2.0 - SUPABASE DATABASE SCHEMA
-- =========================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES TABLE
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  display_name text not null default 'Eco Warrior',
  avatar_url text default 'https://api.dicebear.com/7.x/bottts/svg?seed=EcoHero1',
  score integer not null default 0,
  current_streak integer not null default 0,
  last_action_date timestamp with time zone,
  is_banned boolean not null default false,
  ban_reason text,
  banned_at timestamp with time zone,
  is_guest boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. SQUADS (GROUPS) TABLE
create table if not exists public.squads (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  join_code text unique not null,
  is_private boolean not null default false,
  password_hash text,
  leader_id uuid references public.profiles(id) on delete set null,
  total_score integer not null default 0,
  badge_icon text default '🌿',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. SQUAD MEMBERSHIPS (Multi-group support)
create table if not exists public.squad_members (
  id uuid default uuid_generate_v4() primary key,
  squad_id uuid references public.squads(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text not null default 'member' check (role in ('leader', 'co-leader', 'member')),
  is_muted boolean not null default false,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (squad_id, user_id)
);

-- 4. SQUAD CHAT MESSAGES (Text, Image, Voice Notes)
create table if not exists public.squad_messages (
  id uuid default uuid_generate_v4() primary key,
  squad_id uuid references public.squads(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  user_name text not null,
  user_avatar text not null,
  content text,
  media_url text,
  media_type text check (media_type in ('text', 'image', 'voice_note')),
  voice_duration_sec integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. CHALLENGES / QUESTS TABLE
create table if not exists public.challenges (
  id text primary key,
  title_en text not null,
  title_ar text not null,
  description_en text not null,
  description_ar text not null,
  category text not null,
  points integer not null default 50,
  icon text not null default '🌱',
  difficulty text default 'medium'
);

-- 6. CHALLENGE SUBMISSIONS / VERIFICATIONS
create table if not exists public.challenge_submissions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  challenge_id text references public.challenges(id) not null,
  image_url text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  points_awarded integer default 0,
  ai_feedback text,
  submitted_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. KARIN AI CHAT HISTORY
create table if not exists public.karin_chat_history (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  sender text not null check (sender in ('user', 'karin')),
  message_text text not null,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. COMMUNITY MEDIA FEED
create table if not exists public.community_posts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  author_name text not null,
  author_avatar text not null,
  caption text not null,
  media_url text not null,
  media_type text not null default 'image',
  likes_count integer default 0,
  is_flagged boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. STORE ITEMS
create table if not exists public.store_items (
  id text primary key,
  name_en text not null,
  name_ar text not null,
  type text not null check (type in ('avatar', 'badge')),
  cost integer not null,
  image_url text not null,
  description_en text,
  description_ar text
);

-- 10. USER INVENTORY
create table if not exists public.user_inventory (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  item_id text references public.store_items(id) not null,
  purchased_at timestamp with time zone default timezone('utc'::text, now()) not null,
  is_equipped boolean default false,
  unique (user_id, item_id)
);

-- ROW LEVEL SECURITY (RLS) POLICIES
alter table public.profiles enable row level security;
alter table public.squads enable row level security;
alter table public.squad_members enable row level security;
alter table public.squad_messages enable row level security;
alter table public.challenge_submissions enable row level security;
alter table public.karin_chat_history enable row level security;
alter table public.community_posts enable row level security;
alter table public.user_inventory enable row level security;

-- Public read access policies
create policy "Allow public read on profiles" on public.profiles for select using (true);
create policy "Allow users update own profile" on public.profiles for update using (auth.uid() = id);

create policy "Allow read on squads" on public.squads for select using (true);
create policy "Allow authenticated create squads" on public.squads for insert with check (auth.role() = 'authenticated');
create policy "Allow squad leader update squad" on public.squads for update using (auth.uid() = leader_id);

create policy "Allow read squad members" on public.squad_members for select using (true);
create policy "Allow insert squad members" on public.squad_members for insert with check (auth.uid() = user_id);

create policy "Allow read squad messages" on public.squad_messages for select using (true);
create policy "Allow post squad messages" on public.squad_messages for insert with check (auth.uid() = user_id);

create policy "Allow read own karin chat" on public.karin_chat_history for select using (auth.uid() = user_id);
create policy "Allow insert own karin chat" on public.karin_chat_history for insert with check (auth.uid() = user_id);

create policy "Allow read community posts" on public.community_posts for select using (true);
create policy "Allow insert community posts" on public.community_posts for insert with check (auth.uid() = user_id);

create policy "Allow read own inventory" on public.user_inventory for select using (auth.uid() = user_id);
create policy "Allow insert own inventory" on public.user_inventory for insert with check (auth.uid() = user_id);
create policy "Allow update own inventory" on public.user_inventory for update using (auth.uid() = user_id);
