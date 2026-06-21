// Habibie AI — Generation Pipeline
// Orchestrates: Idea -> Outline -> (Chapters | Comic Pages | Gift Messages) -> Cover
// This is the single entry point the Create flow UI calls into.

import {
  generateStoryOutline,
  generateChapterText,
  generateComicPageScript,
  generateGiftBookMessages,
  StoryBrief,
  GeneratedStoryOutline,
} from "./habibie-writer";
import {
  generateVerifiedImageUrl,
  buildCoverPrompt,
  withComicStyle,
} from "./habibie-image";
import type {
  ComicPanel,
  ComicPageContent,
  NovelPageContent,
  GiftBookPageContent,
  StoryFormData,
} from "@/types/story";

export function formToBrief(form: StoryFormData): StoryBrief {
  return {
    title: form.title || undefined,
    storyType: form.story_type,
    genre: form.genre,
    relationshipType: form.relationship_type || undefined,
    language: form.language,
    description: form.description,
    characterInfo: form.character_info || undefined,
    posterPrompt: form.poster_prompt || undefined,
  };
}

export interface GenerationProgress {
  stage: string;
  current: number;
  total: number;
}

export type ProgressCallback = (progress: GenerationProgress) => void;

export interface GeneratedNovelResult {
  outline: GeneratedStoryOutline;
  coverUrl: string;
  pages: { title: string; content: NovelPageContent }[];
}

export async function generateFullNovel(
  form: StoryFormData,
  onProgress?: ProgressCallback
): Promise<GeneratedNovelResult> {
  const brief = formToBrief(form);
  onProgress?.({ stage: "Understanding your idea", current: 0, total: 1 });
  const outline = await generateStoryOutline(brief);

  const total = outline.chapterTitles.length + 1; // chapters + cover
  const pages: { title: string; content: NovelPageContent }[] = [];

  for (let i = 0; i < outline.chapterTitles.length; i++) {
    onProgress?.({
      stage: `Writing chapter ${i + 1} of ${outline.chapterTitles.length}`,
      current: i + 1,
      total,
    });
    const text = await generateChapterText({
      brief,
      outline,
      chapterIndex: i,
      chapterTitle: outline.chapterTitles[i],
      isFinal: i === outline.chapterTitles.length - 1,
    });
    pages.push({ title: outline.chapterTitles[i], content: { text } });
  }

  onProgress?.({ stage: "Painting the cover", current: total, total });
  const coverPrompt = buildCoverPrompt({
    title: outline.title,
    genre: brief.genre,
    storyType: "novel",
    synopsisHint: outline.synopsis,
    posterPrompt: brief.posterPrompt,
  });
  const coverUrl = await generateVerifiedImageUrl(coverPrompt, { width: 768, height: 1024 });

  return { outline, coverUrl, pages };
}

export interface GeneratedGiftBookResult {
  outline: GeneratedStoryOutline;
  coverUrl: string;
  opening: string;
  closing: string;
  pages: { title: string; content: GiftBookPageContent }[];
}

export async function generateFullGiftBook(
  form: StoryFormData,
  onProgress?: ProgressCallback
): Promise<GeneratedGiftBookResult> {
  const brief = formToBrief(form);
  onProgress?.({ stage: "Understanding your idea", current: 0, total: 1 });
  const outline = await generateStoryOutline(brief);

  const total = outline.chapterTitles.length + 2; // pages + messages + cover
  const pages: { title: string; content: GiftBookPageContent }[] = [];

  for (let i = 0; i < outline.chapterTitles.length; i++) {
    onProgress?.({
      stage: `Writing page ${i + 1} of ${outline.chapterTitles.length}`,
      current: i + 1,
      total,
    });
    const text = await generateChapterText({
      brief,
      outline,
      chapterIndex: i,
      chapterTitle: outline.chapterTitles[i],
      isFinal: i === outline.chapterTitles.length - 1,
    });

    const illustrationPrompt = `Gift book illustration for the scene: ${text.slice(0, 220)}, ${brief.genre} mood, warm soft lighting, heartfelt, storybook illustration style`;
    let illustration_url: string | undefined;
    try {
      illustration_url = await generateVerifiedImageUrl(illustrationPrompt, {
        width: 1024,
        height: 768,
      });
    } catch {
      illustration_url = undefined; // page still works without an illustration
    }

    pages.push({ title: outline.chapterTitles[i], content: { text, illustration_url } });
  }

  onProgress?.({ stage: "Writing your opening & closing message", current: total - 1, total });
  const messages = await generateGiftBookMessages(brief, outline);

  onProgress?.({ stage: "Designing the cover", current: total, total });
  const coverPrompt = buildCoverPrompt({
    title: outline.title,
    genre: brief.genre,
    storyType: "gift_book",
    synopsisHint: outline.synopsis,
    posterPrompt: brief.posterPrompt,
  });
  const coverUrl = await generateVerifiedImageUrl(coverPrompt, { width: 768, height: 1024 });

  return { outline, coverUrl, opening: messages.opening, closing: messages.closing, pages };
}

export interface GeneratedComicResult {
  outline: GeneratedStoryOutline;
  coverUrl: string;
  pages: { title: string; content: ComicPageContent }[];
}

export async function generateFullComic(
  form: StoryFormData,
  style: "Manga" | "Anime Comic" | "Webtoon",
  onProgress?: ProgressCallback
): Promise<GeneratedComicResult> {
  const brief = formToBrief(form);
  onProgress?.({ stage: "Understanding your idea", current: 0, total: 1 });
  const outline = await generateStoryOutline(brief);

  const pageCount = outline.chapterTitles.length;
  const total = pageCount * 2 + 1; // storyboard+art per page, plus cover
  const pages: { title: string; content: ComicPageContent }[] = [];
  let step = 0;

  for (let i = 0; i < pageCount; i++) {
    step++;
    onProgress?.({
      stage: `Storyboarding page ${i + 1} of ${pageCount}`,
      current: step,
      total,
    });
    const script = await generateComicPageScript({
      brief,
      outline,
      pageIndex: i,
      pageTitle: outline.chapterTitles[i],
      style,
      isFinal: i === pageCount - 1,
    });

    step++;
    onProgress?.({
      stage: `Illustrating page ${i + 1} of ${pageCount}`,
      current: step,
      total,
    });

    const panels: ComicPanel[] = [];
    // Generate panels sequentially with a shared base seed offset so retries
    // don't collide, while keeping requests light for low-spec connections.
    for (let p = 0; p < script.panels.length; p++) {
      const panelScript = script.panels[p];
      const styledPrompt = withComicStyle(panelScript.imagePrompt, style);
      let image_url: string;
      try {
        image_url = await generateVerifiedImageUrl(styledPrompt, {
          width: 768,
          height: 768,
        });
      } catch {
        // Fall back to a plain (unverified) URL so the page can still render;
        // the <img> tag's own error handling can show a retry state.
        image_url = `https://image.pollinations.ai/prompt/${encodeURIComponent(
          styledPrompt
        )}?width=768&height=768&nologo=true`;
      }
      panels.push({
        image_url,
        dialogue: panelScript.dialogue,
        caption: panelScript.caption,
      });
    }

    pages.push({ title: script.pageTitle, content: { panels } });
  }

  onProgress?.({ stage: "Designing the cover", current: total, total });
  const coverPrompt = buildCoverPrompt({
    title: outline.title,
    genre: brief.genre,
    storyType: "comic",
    synopsisHint: outline.synopsis,
    posterPrompt: brief.posterPrompt,
  });
  const coverUrl = await generateVerifiedImageUrl(
    withComicStyle(coverPrompt, style),
    { width: 768, height: 1024 }
  );

  return { outline, coverUrl, pages };
}
