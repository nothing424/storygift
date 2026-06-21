// Habibie AI — Writer Engine
// Wraps Pollinations' OpenAI-compatible text endpoint. The brand name
// "Habibie AI" is what users see; the underlying provider is never exposed
// in any user-facing string.

const TEXT_URL =
  process.env.NEXT_PUBLIC_POLLINATIONS_TEXT_URL || "https://text.pollinations.ai/openai";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

async function callHabibieText(
  messages: ChatMessage[],
  opts: { retries?: number; timeoutMs?: number } = {}
): Promise<string> {
  const retries = opts.retries ?? 2;
  const timeoutMs = opts.timeoutMs ?? 30000;

  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(TEXT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "openai-fast",
          messages,
        }),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!res.ok) {
        throw new Error(`Habibie AI writer returned status ${res.status}`);
      }

      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content;

      if (!content || typeof content !== "string") {
        throw new Error("Habibie AI writer returned an empty response");
      }

      return content.trim();
    } catch (err) {
      clearTimeout(timer);
      lastError = err;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
        continue;
      }
    }
  }

  throw new HabibieAIError(
    "Habibie AI's writer is taking a break right now. Please try again in a moment.",
    lastError
  );
}

export class HabibieAIError extends Error {
  cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "HabibieAIError";
    this.cause = cause;
  }
}

function stripJsonFences(text: string): string {
  return text.replace(/```json/gi, "").replace(/```/g, "").trim();
}

async function callHabibieJSON<T>(messages: ChatMessage[]): Promise<T> {
  const raw = await callHabibieText(messages);
  const cleaned = stripJsonFences(raw);
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Try to salvage a JSON object/array substring if the model added preamble.
    const match = cleaned.match(/[\{\[][\s\S]*[\}\]]/);
    if (match) {
      try {
        return JSON.parse(match[0]) as T;
      } catch {
        // fall through
      }
    }
    throw new HabibieAIError(
      "Habibie AI's writer returned something we couldn't read. Please try again."
    );
  }
}

const LANGUAGE_INSTRUCTION: Record<string, string> = {
  id: "Write entirely in natural, warm Indonesian (Bahasa Indonesia).",
  en: "Write entirely in natural, warm English.",
  auto: "Detect the language of the user's input and respond in that same language, matching their natural tone.",
};

export interface StoryBrief {
  title?: string;
  storyType: "novel" | "comic" | "gift_book";
  genre: string;
  relationshipType?: string;
  language: "id" | "en" | "auto";
  description: string;
  characterInfo?: string;
  posterPrompt?: string;
}

export interface GeneratedStoryOutline {
  title: string;
  synopsis: string;
  characters: { name: string; role: string; description: string }[];
  chapterTitles: string[];
  endingNote: string;
}

// Step 1: Expand a short, natural-language idea into a full outline.
export async function generateStoryOutline(
  brief: StoryBrief
): Promise<GeneratedStoryOutline> {
  const langInstruction = LANGUAGE_INSTRUCTION[brief.language];

  const system = `You are Habibie AI, the warm and emotionally intelligent story-writing engine inside StoryGift, a platform that turns memories and feelings into gift-worthy novels, comics, and gift books.
${langInstruction}
You understand casual, short, imperfect prompts (including Indonesian slang and casual phrasing) and expand them into complete, emotionally resonant story outlines.
Always respond with ONLY valid JSON, no preamble, no markdown fences, matching this exact shape:
{
  "title": string,
  "synopsis": string (2-4 sentences, evocative, gift-card-worthy),
  "characters": [ { "name": string, "role": string, "description": string } ],
  "chapterTitles": [string, ...] (5 to 8 entries for novel/gift_book, 4 to 6 for comic, representing chapters or page-acts),
  "endingNote": string (one warm sentence describing how the story closes)
}`;

  const user = `Story type: ${brief.storyType}
Genre: ${brief.genre}
${brief.relationshipType ? `This is for: ${brief.relationshipType}` : ""}
${brief.title ? `Working title idea: ${brief.title}` : "No title given — invent one."}
${brief.characterInfo ? `Character info from the user: ${brief.characterInfo}` : ""}

The user's idea, in their own words:
"""
${brief.description}
"""

Expand this into a complete outline. If the idea is short or vague, infer warmly and tastefully — do not ask questions, just create.`;

  return callHabibieJSON<GeneratedStoryOutline>([
    { role: "system", content: system },
    { role: "user", content: user },
  ]);
}

export interface GeneratedChapter {
  title: string;
  text: string;
}

// Step 2: Write the full prose for one chapter/page given outline context.
export async function generateChapterText(params: {
  brief: StoryBrief;
  outline: GeneratedStoryOutline;
  chapterIndex: number;
  chapterTitle: string;
  isFinal: boolean;
}): Promise<string> {
  const { brief, outline, chapterIndex, chapterTitle, isFinal } = params;
  const langInstruction = LANGUAGE_INSTRUCTION[brief.language];

  const system = `You are Habibie AI, the writer engine inside StoryGift. ${langInstruction}
You write warm, vivid, emotionally honest prose suitable for a personal gift story. Avoid clichés and generic filler — ground details in what the user described. Write only the chapter's prose. No titles, no markdown, no preamble — just the story text.`;

  const user = `Story title: ${outline.title}
Synopsis: ${outline.synopsis}
Characters: ${outline.characters.map((c) => `${c.name} (${c.role}): ${c.description}`).join("; ")}
Genre: ${brief.genre}
${brief.relationshipType ? `Written for: ${brief.relationshipType}` : ""}

This is chapter ${chapterIndex + 1} of ${outline.chapterTitles.length}, titled "${chapterTitle}".
${isFinal ? `This is the FINAL chapter. Close the story warmly, echoing this ending note: "${outline.endingNote}"` : "Continue the story naturally from the outline. Do not resolve the whole story yet."}

Original user idea for grounding: "${brief.description}"

Write 3-6 paragraphs of prose for this chapter only.`;

  return callHabibieText([
    { role: "system", content: system },
    { role: "user", content: user },
  ]);
}

export interface ComicPanelScript {
  imagePrompt: string;
  dialogue: string[];
  caption?: string;
}

export interface ComicPageScript {
  pageTitle: string;
  panels: ComicPanelScript[];
}

// Comic Engine: Step A — storyboard a single page into panel-level prompts + dialogue.
export async function generateComicPageScript(params: {
  brief: StoryBrief;
  outline: GeneratedStoryOutline;
  pageIndex: number;
  pageTitle: string;
  style: "Manga" | "Anime Comic" | "Webtoon";
  isFinal: boolean;
}): Promise<ComicPageScript> {
  const { brief, outline, pageIndex, pageTitle, style, isFinal } = params;
  const langInstruction = LANGUAGE_INSTRUCTION[brief.language];

  const system = `You are Habibie AI's Comic Engine, the storyboard artist inside StoryGift.
${langInstruction} for dialogue and captions only — image prompts must always be written in English regardless of story language, since the image model only understands English prompts.
You break a story page into 3 to 5 manga/comic panels. Each panel needs a vivid, specific image-generation prompt (English, describing composition, character appearance, setting, mood, art style: ${style}) and short punchy dialogue lines (in the story's language).
Maintain character visual consistency across panels by repeating concrete physical descriptors (hair, outfit, build) in every imagePrompt, since each panel is generated independently.
Respond with ONLY valid JSON matching exactly:
{
  "pageTitle": string,
  "panels": [
    { "imagePrompt": string, "dialogue": [string, ...], "caption": string (optional, narration text) }
  ]
}`;

  const characterDescriptors = outline.characters
    .map((c) => `${c.name}: ${c.description}`)
    .join(" | ");

  const user = `Story: ${outline.title} — ${outline.synopsis}
Characters (repeat these descriptors in every imagePrompt for consistency): ${characterDescriptors}
Genre: ${brief.genre}. Art style: ${style}.
This is page ${pageIndex + 1} of ${outline.chapterTitles.length}, titled "${pageTitle}".
${isFinal ? `Final page — resolve the story, echoing: "${outline.endingNote}"` : "Advance the story naturally, do not resolve it yet."}
Original idea for grounding: "${brief.description}"

Create the storyboard JSON now.`;

  return callHabibieJSON<ComicPageScript>([
    { role: "system", content: system },
    { role: "user", content: user },
  ]);
}

export interface GiftBookMessages {
  opening: string;
  closing: string;
}

// Gift Book: opening + closing message, written directly to the recipient.
export async function generateGiftBookMessages(
  brief: StoryBrief,
  outline: GeneratedStoryOutline
): Promise<GiftBookMessages> {
  const langInstruction = LANGUAGE_INSTRUCTION[brief.language];

  const system = `You are Habibie AI, writing the opening and closing pages of a digital gift book on StoryGift. ${langInstruction}
Write directly to the recipient, warm and personal, like a heartfelt card. Respond with ONLY valid JSON: { "opening": string, "closing": string }. Each should be 2-4 sentences.`;

  const user = `Gift book title: ${outline.title}
Synopsis: ${outline.synopsis}
${brief.relationshipType ? `This is for: ${brief.relationshipType}` : ""}
Genre/occasion: ${brief.genre}
Original idea: "${brief.description}"
Ending note to echo in the closing message: "${outline.endingNote}"`;

  return callHabibieJSON<GiftBookMessages>([
    { role: "system", content: system },
    { role: "user", content: user },
  ]);
}
