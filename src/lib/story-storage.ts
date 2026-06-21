import { supabase } from "./supabase";
import { getSessionId, getDisplayName } from "./session";
import { slugify, randomSlugSuffix } from "./slug";
import type { StoryType, PageContent, PageType } from "@/types/story";
import type {
  GeneratedNovelResult,
  GeneratedGiftBookResult,
  GeneratedComicResult,
} from "./generation-pipeline";
import type { StoryFormData } from "@/types/story";

async function reserveUniqueSlug(baseTitle: string): Promise<string> {
  const base = slugify(baseTitle) || "story";
  let candidate = base;
  let attempts = 0;

  while (attempts < 6) {
    const { data } = await supabase.from("stories").select("id").eq("slug", candidate).maybeSingle();
    if (!data) return candidate;
    candidate = `${base}-${randomSlugSuffix()}`;
    attempts++;
  }
  return `${base}-${Date.now()}`;
}

interface SaveResult {
  storyId: string;
  slug: string;
}

async function insertPages(
  storyId: string,
  pages: { title: string; pageType: PageType; content: PageContent }[]
) {
  const rows = pages.map((p, idx) => ({
    story_id: storyId,
    page_index: idx,
    page_type: p.pageType,
    title: p.title,
    content_json: p.content,
  }));
  const { error } = await supabase.from("story_pages").insert(rows);
  if (error) throw new Error(`Couldn't save story pages: ${error.message}`);
}

export async function saveNovel(
  form: StoryFormData,
  result: GeneratedNovelResult,
  customSlug?: string
): Promise<SaveResult> {
  const slug = customSlug || (await reserveUniqueSlug(result.outline.title));
  const sessionId = getSessionId();

  const { data: story, error } = await supabase
    .from("stories")
    .insert({
      slug,
      title: result.outline.title,
      story_type: "novel" as StoryType,
      genre: form.genre,
      relationship_type: form.relationship_type || null,
      language: form.language,
      description: form.description,
      character_info: form.character_info || null,
      poster_prompt: form.poster_prompt || null,
      cover_url: result.coverUrl,
      synopsis: result.outline.synopsis,
      status: "draft",
      author_session_id: sessionId,
      author_display_name: getDisplayName(),
    })
    .select("id, slug")
    .single();

  if (error || !story) throw new Error(`Couldn't save story: ${error?.message}`);

  await insertPages(
    story.id,
    result.pages.map((p) => ({ title: p.title, pageType: "content" as PageType, content: p.content }))
  );

  return { storyId: story.id, slug: story.slug };
}

export async function saveGiftBook(
  form: StoryFormData,
  result: GeneratedGiftBookResult,
  customSlug?: string
): Promise<SaveResult> {
  const slug = customSlug || (await reserveUniqueSlug(result.outline.title));
  const sessionId = getSessionId();

  const { data: story, error } = await supabase
    .from("stories")
    .insert({
      slug,
      title: result.outline.title,
      story_type: "gift_book" as StoryType,
      genre: form.genre,
      relationship_type: form.relationship_type || null,
      language: form.language,
      description: form.description,
      character_info: form.character_info || null,
      poster_prompt: form.poster_prompt || null,
      cover_url: result.coverUrl,
      synopsis: result.outline.synopsis,
      status: "draft",
      author_session_id: sessionId,
      author_display_name: getDisplayName(),
    })
    .select("id, slug")
    .single();

  if (error || !story) throw new Error(`Couldn't save story: ${error?.message}`);

  const pages: { title: string; pageType: PageType; content: PageContent }[] = [
    { title: "Opening Message", pageType: "opening", content: { text: result.opening } },
    ...result.pages.map((p) => ({ title: p.title, pageType: "content" as PageType, content: p.content })),
    { title: "Closing Message", pageType: "closing", content: { text: result.closing } },
  ];

  await insertPages(story.id, pages);

  return { storyId: story.id, slug: story.slug };
}

export async function saveComic(
  form: StoryFormData,
  result: GeneratedComicResult,
  customSlug?: string
): Promise<SaveResult> {
  const slug = customSlug || (await reserveUniqueSlug(result.outline.title));
  const sessionId = getSessionId();

  const { data: story, error } = await supabase
    .from("stories")
    .insert({
      slug,
      title: result.outline.title,
      story_type: "comic" as StoryType,
      genre: form.genre,
      relationship_type: form.relationship_type || null,
      language: form.language,
      description: form.description,
      character_info: form.character_info || null,
      poster_prompt: form.poster_prompt || null,
      cover_url: result.coverUrl,
      synopsis: result.outline.synopsis,
      status: "draft",
      author_session_id: sessionId,
      author_display_name: getDisplayName(),
    })
    .select("id, slug")
    .single();

  if (error || !story) throw new Error(`Couldn't save story: ${error?.message}`);

  await insertPages(
    story.id,
    result.pages.map((p) => ({ title: p.title, pageType: "content" as PageType, content: p.content }))
  );

  return { storyId: story.id, slug: story.slug };
}

export async function publishStory(storyId: string): Promise<void> {
  const { error } = await supabase
    .from("stories")
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("id", storyId);
  if (error) throw new Error(`Couldn't publish story: ${error.message}`);
}
