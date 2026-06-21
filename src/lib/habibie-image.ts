// Habibie AI — Poster & Comic Engine (image side)
// Wraps Pollinations' image endpoint. Branded only as "Habibie AI" to the user.

const IMAGE_BASE_URL =
  process.env.NEXT_PUBLIC_POLLINATIONS_IMAGE_URL || "https://image.pollinations.ai/prompt";

export interface ImageGenOptions {
  width?: number;
  height?: number;
  seed?: number;
  model?: "flux" | "turbo";
  nologo?: boolean;
}

/**
 * Builds a Pollinations image URL. Pollinations generates lazily on first
 * request to this URL, so the URL itself can be used directly as an <img src>
 * or Next/Image src — no separate "generate then fetch" step is required.
 * We still expose a fetchAndVerify helper for cases (like cover generation)
 * where we want to confirm the image actually rendered before saving it
 * permanently to a story record.
 */
export function buildImageUrl(prompt: string, opts: ImageGenOptions = {}): string {
  const { width = 1024, height = 1024, seed, model = "flux", nologo = true } = opts;
  const encoded = encodeURIComponent(prompt.trim().slice(0, 2000));
  const params = new URLSearchParams();
  params.set("width", String(width));
  params.set("height", String(height));
  params.set("model", model);
  if (nologo) params.set("nologo", "true");
  if (seed !== undefined) params.set("seed", String(seed));
  return `${IMAGE_BASE_URL}/${encoded}?${params.toString()}`;
}

/**
 * Verifies an image actually loads (Pollinations can occasionally time out
 * or 5xx under load). Retries with a fresh seed on failure so a stuck prompt
 * doesn't repeat the exact same failure.
 */
export async function generateVerifiedImageUrl(
  prompt: string,
  opts: ImageGenOptions = {},
  retries = 2
): Promise<string> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const seed = opts.seed ?? Math.floor(Math.random() * 1_000_000);
    const url = buildImageUrl(prompt, { ...opts, seed });

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 45000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);

      if (!res.ok) {
        throw new Error(`Habibie AI's poster generator returned status ${res.status}`);
      }
      return url;
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
    }
  }

  throw new HabibiePosterError(
    "Habibie AI's poster generator couldn't finish this image. Please try again.",
    lastError
  );
}

export class HabibiePosterError extends Error {
  cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "HabibiePosterError";
    this.cause = cause;
  }
}

const STYLE_PROMPT_SUFFIX: Record<string, string> = {
  Manga: "black and white manga art style, screentone shading, dynamic ink linework, Japanese comic panel",
  "Anime Comic": "vibrant anime art style, cel-shaded, clean bold linework, Japanese animation aesthetic",
  Webtoon: "webtoon digital art style, soft cel shading, vertical scroll comic aesthetic, clean modern coloring",
};

export function withComicStyle(prompt: string, style: keyof typeof STYLE_PROMPT_SUFFIX): string {
  return `${prompt}, ${STYLE_PROMPT_SUFFIX[style]}`;
}

export function buildCoverPrompt(params: {
  title: string;
  genre: string;
  storyType: "novel" | "comic" | "gift_book";
  synopsisHint: string;
  posterPrompt?: string;
}): string {
  const { title, genre, storyType, synopsisHint, posterPrompt } = params;

  if (posterPrompt && posterPrompt.trim()) {
    return `Book cover illustration: ${posterPrompt}, ${genre} mood, title-card composition, no text overlay, elegant lighting, high detail`;
  }

  const typeFlavor =
    storyType === "comic"
      ? "manga/anime comic book cover, dynamic character pose"
      : storyType === "gift_book"
      ? "warm gift book cover illustration, soft inviting composition"
      : "novel book cover illustration, atmospheric, literary";

  return `${typeFlavor} for a story titled "${title}", ${genre} genre, depicting: ${synopsisHint}. No text overlay, elegant lighting, high detail, professional book cover art`;
}
