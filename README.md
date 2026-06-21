# StoryGift — Setup Guide

## What's built so far
- Full Next.js 14 app (App Router, TypeScript, Tailwind)
- Supabase schema (`sql/schema.sql`) — stories, pages, comments, likes, views
- Habibie AI pipeline (writer + image gen via Pollinations, branded, with retry logic)
- Homepage, Create flow (Novel/Comic/Gift Book), Story Reader, Explore, Dashboard
- Guest Mode (no login) via localStorage session id
- Dark/light mode, custom slugs, comments, likes, basic analytics

## 1. Install dependencies
This was built without network access, so nothing is installed yet:
```
cd storygift
npm install
```

## 2. Set up Supabase
1. Open your Supabase project → SQL Editor → New query
2. Paste the entire contents of `sql/schema.sql` → Run
3. This creates all tables, RLS policies, atomic counter functions, and a public storage bucket called `storygift-media`

## 3. Configure environment variables
```
cp .env.local.example .env.local
```
Then fill in:
- `NEXT_PUBLIC_SUPABASE_URL` — your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — your Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` — optional for now, not yet used by any route
- `NEXT_PUBLIC_SUPPORT_URL` — your Sociabuzz link
- `NEXT_PUBLIC_SITE_URL` — your deployed domain (used for share links)

## 4. Run locally
```
npm run dev
```
Visit http://localhost:3000

## 5. Deploy
Push to a git repo and import into Vercel, or run `vercel` from the project root. Add the same env vars in the Vercel project settings.

## Known gaps / things to know
- **RLS is wide open** — there's no real auth, so draft privacy and edit/delete protection rely on guessing UUIDs, not real security. Fine for a free gifting tool; not bulletproof.
- **"Shares" aren't tracked** — copying a link doesn't fire an event, so the dashboard analytics intentionally don't show a fake share count.
- **Pollinations is free but can be slow/flaky** — the pipeline retries automatically, but comic generation (multiple panel images per page) is the slowest path.
- **Admin panel, AI assistant, schedule, and anime requests features mentioned in your other project (Cosmos) are not part of this StoryGift build** — this is a separate platform from Cosmos.
- Not yet built: anime/story request form, fullscreen reading polish, image caching to Supabase Storage (currently images load live from Pollinations URLs each time).

## File map
```
src/
  app/                  routes (homepage, create, explore, dashboard, s/[slug])
  components/           UI components
  lib/
    habibie-writer.ts        text generation (outline, chapters, comic scripts)
    habibie-image.ts         image generation (covers, posters, panels)
    generation-pipeline.ts   orchestrates writer + image into full stories
    story-storage.ts         saves generated stories to Supabase
    story-data.ts            reads stories/pages/comments, likes, views
    explore-data.ts          trending/most loved/newest queries
    dashboard-data.ts        "my stories" + analytics queries
    session.ts               guest-mode session id (no login)
    slug.ts                  slug generation/validation
  types/story.ts        shared TypeScript types
sql/schema.sql          run once in Supabase SQL Editor
```
