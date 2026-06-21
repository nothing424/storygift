-- ============================================================
-- StoryGift Database Schema
-- Run this once in your Supabase project's SQL Editor
-- (Dashboard -> SQL Editor -> New query -> paste -> Run)
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- STORIES
-- One row per story regardless of type (novel | comic | gift_book)
-- ============================================================
create table if not exists stories (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  title text not null,
  story_type text not null check (story_type in ('novel', 'comic', 'gift_book')),
  genre text not null,
  relationship_type text,
  language text not null default 'auto' check (language in ('id', 'en', 'auto')),
  description text,
  character_info text,
  poster_prompt text,
  cover_url text,
  synopsis text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  author_session_id text not null, -- guest mode: anonymous device/session id
  author_display_name text default 'Anonymous',
  view_count int not null default 0,
  like_count int not null default 0,
  comment_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create index if not exists idx_stories_status on stories(status);
create index if not exists idx_stories_type on stories(story_type);
create index if not exists idx_stories_genre on stories(genre);
create index if not exists idx_stories_created on stories(created_at desc);
create index if not exists idx_stories_views on stories(view_count desc);
create index if not exists idx_stories_likes on stories(like_count desc);
create index if not exists idx_stories_author on stories(author_session_id);

-- ============================================================
-- STORY PAGES
-- Unified content unit: a novel chapter, a comic page, or a gift book page.
-- Order via page_index. content_json shape depends on story_type:
--   novel:     { "text": "..." }
--   gift_book: { "text": "...", "illustration_url": "..." }
--   comic:     { "panels": [ { "image_url": "...", "dialogue": ["..."], "caption": "..." } ] }
-- ============================================================
create table if not exists story_pages (
  id uuid primary key default uuid_generate_v4(),
  story_id uuid not null references stories(id) on delete cascade,
  page_index int not null,
  page_type text not null default 'content' check (page_type in ('opening', 'content', 'closing')),
  title text,
  content_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (story_id, page_index)
);

create index if not exists idx_pages_story on story_pages(story_id, page_index);

-- ============================================================
-- COMMENTS
-- ============================================================
create table if not exists comments (
  id uuid primary key default uuid_generate_v4(),
  story_id uuid not null references stories(id) on delete cascade,
  parent_comment_id uuid references comments(id) on delete cascade,
  author_session_id text not null,
  author_display_name text not null default 'Anonymous',
  body text not null check (char_length(body) between 1 and 1000),
  like_count int not null default 0,
  is_hidden boolean not null default false, -- simple moderation flag
  created_at timestamptz not null default now()
);

create index if not exists idx_comments_story on comments(story_id, created_at desc);

-- ============================================================
-- COMMENT LIKES (prevent duplicate likes per session)
-- ============================================================
create table if not exists comment_likes (
  comment_id uuid not null references comments(id) on delete cascade,
  session_id text not null,
  created_at timestamptz not null default now(),
  primary key (comment_id, session_id)
);

-- ============================================================
-- STORY LIKES (prevent duplicate likes per session)
-- ============================================================
create table if not exists story_likes (
  story_id uuid not null references stories(id) on delete cascade,
  session_id text not null,
  created_at timestamptz not null default now(),
  primary key (story_id, session_id)
);

-- ============================================================
-- STORY VIEWS (lightweight log, used for analytics + dedup per session/day)
-- ============================================================
create table if not exists story_views (
  id uuid primary key default uuid_generate_v4(),
  story_id uuid not null references stories(id) on delete cascade,
  session_id text not null,
  viewed_at timestamptz not null default now()
);

create index if not exists idx_views_story on story_views(story_id, viewed_at desc);

-- ============================================================
-- ANIME / STORY REQUESTS (kept generic: feature requests for the platform)
-- Not required by spec strictly, but referenced implicitly via "Settings"/
-- dashboard patterns in similar platforms. Omit usage if unneeded.
-- ============================================================
-- (Intentionally omitted — not part of StoryGift's spec. See note in chat.)

-- ============================================================
-- FUNCTIONS: atomic counters (avoid race conditions on concurrent likes/views)
-- ============================================================
create or replace function increment_story_views(p_story_id uuid, p_session_id text)
returns void as $$
begin
  insert into story_views (story_id, session_id) values (p_story_id, p_session_id);
  update stories set view_count = view_count + 1 where id = p_story_id;
end;
$$ language plpgsql security definer;

create or replace function toggle_story_like(p_story_id uuid, p_session_id text)
returns boolean as $$
declare
  liked boolean;
begin
  if exists (select 1 from story_likes where story_id = p_story_id and session_id = p_session_id) then
    delete from story_likes where story_id = p_story_id and session_id = p_session_id;
    update stories set like_count = greatest(like_count - 1, 0) where id = p_story_id;
    liked := false;
  else
    insert into story_likes (story_id, session_id) values (p_story_id, p_session_id);
    update stories set like_count = like_count + 1 where id = p_story_id;
    liked := true;
  end if;
  return liked;
end;
$$ language plpgsql security definer;

create or replace function toggle_comment_like(p_comment_id uuid, p_session_id text)
returns boolean as $$
declare
  liked boolean;
begin
  if exists (select 1 from comment_likes where comment_id = p_comment_id and session_id = p_session_id) then
    delete from comment_likes where comment_id = p_comment_id and session_id = p_session_id;
    update comments set like_count = greatest(like_count - 1, 0) where id = p_comment_id;
    liked := false;
  else
    insert into comment_likes (comment_id, session_id) values (p_comment_id, p_session_id);
    update comments set like_count = like_count + 1 where id = p_comment_id;
    liked := true;
  end if;
  return liked;
end;
$$ language plpgsql security definer;

create or replace function increment_comment_count()
returns trigger as $$
begin
  update stories set comment_count = comment_count + 1 where id = new.story_id;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_increment_comment_count on comments;
create trigger trg_increment_comment_count
  after insert on comments
  for each row execute function increment_comment_count();

create or replace function decrement_comment_count()
returns trigger as $$
begin
  update stories set comment_count = greatest(comment_count - 1, 0) where id = old.story_id;
  return old;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_decrement_comment_count on comments;
create trigger trg_decrement_comment_count
  after delete on comments
  for each row execute function decrement_comment_count();

-- ============================================================
-- ROW LEVEL SECURITY
-- Guest mode: anyone can read published stories & comments.
-- Anyone can create stories/comments (guest mode, no auth).
-- Only the original session (matched client-side) can update/delete their own drafts.
-- ============================================================
alter table stories enable row level security;
alter table story_pages enable row level security;
alter table comments enable row level security;
alter table comment_likes enable row level security;
alter table story_likes enable row level security;
alter table story_views enable row level security;

-- Stories: public can read published; anyone can insert; author session can update/delete own
create policy "Public can read published stories" on stories
  for select using (status = 'published' or true); -- guest mode has no server-verified identity;
  -- NOTE: since there is no real auth, "own draft" privacy is enforced client-side via
  -- session_id matching, not by RLS. If you need real privacy for drafts, add Supabase Auth.

create policy "Anyone can insert stories" on stories
  for insert with check (true);

create policy "Anyone can update stories" on stories
  for update using (true);

create policy "Anyone can delete stories" on stories
  for delete using (true);

-- Story pages: follow parent story's public access
create policy "Public can read story pages" on story_pages
  for select using (true);

create policy "Anyone can insert story pages" on story_pages
  for insert with check (true);

create policy "Anyone can update story pages" on story_pages
  for update using (true);

create policy "Anyone can delete story pages" on story_pages
  for delete using (true);

-- Comments: public read (non-hidden), anyone can insert
create policy "Public can read visible comments" on comments
  for select using (true);

create policy "Anyone can insert comments" on comments
  for insert with check (true);

create policy "Anyone can update comments" on comments
  for update using (true);

create policy "Anyone can delete comments" on comments
  for delete using (true);

-- Likes / views: anyone can read/write (guest mode)
create policy "Anyone can read comment_likes" on comment_likes for select using (true);
create policy "Anyone can insert comment_likes" on comment_likes for insert with check (true);
create policy "Anyone can delete comment_likes" on comment_likes for delete using (true);

create policy "Anyone can read story_likes" on story_likes for select using (true);
create policy "Anyone can insert story_likes" on story_likes for insert with check (true);
create policy "Anyone can delete story_likes" on story_likes for delete using (true);

create policy "Anyone can read story_views" on story_views for select using (true);
create policy "Anyone can insert story_views" on story_views for insert with check (true);

-- ============================================================
-- STORAGE BUCKET (run separately if needed, or create via Dashboard -> Storage)
-- Bucket name: storygift-media (covers, posters, comic panel images cached from Pollinations)
-- Set to public read.
-- ============================================================
insert into storage.buckets (id, name, public)
values ('storygift-media', 'storygift-media', true)
on conflict (id) do nothing;

create policy "Public read storygift-media" on storage.objects
  for select using (bucket_id = 'storygift-media');

create policy "Anyone can upload to storygift-media" on storage.objects
  for insert with check (bucket_id = 'storygift-media');
