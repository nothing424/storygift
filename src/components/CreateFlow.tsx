"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SelectCard, Pill, FieldLabel } from "./CreateFormUI";
import type { StoryFormData, StoryType } from "@/types/story";
import {
  generateFullNovel,
  generateFullGiftBook,
  generateFullComic,
  GenerationProgress,
} from "@/lib/generation-pipeline";
import { saveNovel, saveGiftBook, saveComic } from "@/lib/story-storage";
import { HabibieAIError } from "@/lib/habibie-writer";
import { HabibiePosterError } from "@/lib/habibie-image";

type Step = "type" | "form" | "generating" | "error" | "done";

const GENRES = [
  "Romance",
  "Friendship",
  "Drama",
  "Fantasy",
  "Adventure",
  "Comedy",
  "Mystery",
  "School",
  "Family",
  "Birthday",
  "Graduation",
  "Custom",
];

const RELATIONSHIPS = [
  "Someone Special",
  "Best Friend",
  "Family",
  "Teacher",
  "Classmate",
  "Birthday",
  "Graduation",
  "Custom",
];

const COMIC_STYLES = ["Manga", "Anime Comic", "Webtoon"] as const;

const initialForm: StoryFormData = {
  title: "",
  story_type: "novel",
  genre: "Friendship",
  language: "auto",
  relationship_type: "Best Friend",
  description: "",
  character_info: "",
  poster_prompt: "",
  comic_style: "Manga",
};

export default function CreateFlow() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("type");
  const [form, setForm] = useState<StoryFormData>(initialForm);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [resultSlug, setResultSlug] = useState<string>("");
  const [resultStoryId, setResultStoryId] = useState<string>("");

  function selectType(type: StoryType) {
    setForm((f) => ({ ...f, story_type: type }));
    setStep("form");
  }

  async function handleGenerate() {
    setStep("generating");
    setErrorMsg("");
    try {
      let saveResult: { storyId: string; slug: string };

      if (form.story_type === "novel") {
        const result = await generateFullNovel(form, setProgress);
        saveResult = await saveNovel(form, result);
      } else if (form.story_type === "gift_book") {
        const result = await generateFullGiftBook(form, setProgress);
        saveResult = await saveGiftBook(form, result);
      } else {
        const style = form.comic_style || "Manga";
        const result = await generateFullComic(form, style, setProgress);
        saveResult = await saveComic(form, result);
      }

      setResultSlug(saveResult.slug);
      setResultStoryId(saveResult.storyId);
      setStep("done");
    } catch (err) {
      const message =
        err instanceof HabibieAIError || err instanceof HabibiePosterError
          ? err.message
          : "Something went wrong while creating your story. Please try again.";
      setErrorMsg(message);
      setStep("error");
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-12 min-h-[70vh]">
      {step === "type" && <StepChooseType onSelect={selectType} />}

      {step === "form" && (
        <StepStoryForm
          form={form}
          setForm={setForm}
          onBack={() => setStep("type")}
          onSubmit={handleGenerate}
        />
      )}

      {step === "generating" && <StepGenerating progress={progress} storyType={form.story_type} />}

      {step === "error" && (
        <StepError
          message={errorMsg}
          onRetry={handleGenerate}
          onBack={() => setStep("form")}
        />
      )}

      {step === "done" && (
        <StepDone
          slug={resultSlug}
          storyId={resultStoryId}
          onViewStory={() => router.push(`/s/${resultSlug}`)}
        />
      )}
    </main>
  );
}

function StepChooseType({ onSelect }: { onSelect: (t: StoryType) => void }) {
  return (
    <div className="animate-fadeup">
      <p className="text-xs font-mono uppercase tracking-wider text-rosegold-dark mb-2">
        Step 1 of 2
      </p>
      <h1 className="font-display text-3xl font-semibold mb-2">Choose your story type</h1>
      <p className="text-ink-faint dark:text-parchment/70 mb-8">
        Each format tells a memory a little differently.
      </p>
      <div className="grid sm:grid-cols-3 gap-4">
        <SelectCard
          selected={false}
          onClick={() => onSelect("novel")}
          emoji="📖"
          title="Novel"
          description="Cover, synopsis, chapters, ending."
        />
        <SelectCard
          selected={false}
          onClick={() => onSelect("comic")}
          emoji="📚"
          title="Comic"
          description="Manga, anime, or webtoon pages."
        />
        <SelectCard
          selected={false}
          onClick={() => onSelect("gift_book")}
          emoji="🎁"
          title="Gift Book"
          description="Opening message, illustrated pages, closing note."
        />
      </div>
    </div>
  );
}

function StepStoryForm({
  form,
  setForm,
  onBack,
  onSubmit,
}: {
  form: StoryFormData;
  setForm: (updater: (f: StoryFormData) => StoryFormData) => void;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const typeLabel =
    form.story_type === "novel" ? "Novel" : form.story_type === "comic" ? "Comic" : "Gift Book";
  const typeEmoji = form.story_type === "novel" ? "📖" : form.story_type === "comic" ? "📚" : "🎁";

  const canSubmit = form.description.trim().length >= 8 && form.genre;

  return (
    <div className="animate-fadeup">
      <button
        onClick={onBack}
        className="text-sm text-ink-faint dark:text-parchment/60 hover:text-rosegold mb-4 inline-flex items-center gap-1"
      >
        ← Change story type
      </button>
      <p className="text-xs font-mono uppercase tracking-wider text-rosegold-dark mb-2">
        Step 2 of 2 · {typeEmoji} {typeLabel}
      </p>
      <h1 className="font-display text-3xl font-semibold mb-2">Tell us the memory</h1>
      <p className="text-ink-faint dark:text-parchment/70 mb-8">
        Write naturally — in Indonesian or English. Habibie AI will expand it
        into a full story.
      </p>

      <form
        className="space-y-7"
        onSubmit={(e) => {
          e.preventDefault();
          if (canSubmit) onSubmit();
        }}
      >
        <div>
          <FieldLabel hint="Optional — leave blank and Habibie AI will invent one">
            Title
          </FieldLabel>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="e.g. Untuk Sahabat Terbaikku"
            className="w-full px-4 py-3 rounded-xl border border-ink/15 dark:border-parchment/20 bg-transparent focus:border-rosegold outline-none"
          />
        </div>

        <div>
          <FieldLabel>Description</FieldLabel>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder='Contoh: "Aku ingin membuat cerita untuk sahabat yang pindah sekolah."'
            rows={5}
            className="w-full px-4 py-3 rounded-xl border border-ink/15 dark:border-parchment/20 bg-transparent focus:border-rosegold outline-none resize-none"
          />
          <p className="text-xs text-ink-faint dark:text-parchment/50 mt-1.5">
            {form.description.trim().length < 8
              ? "A sentence or two is enough — Habibie AI will expand it."
              : "Looks good."}
          </p>
        </div>

        <div>
          <FieldLabel>Genre</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {GENRES.map((g) => (
              <Pill key={g} selected={form.genre === g} onClick={() => setForm((f) => ({ ...f, genre: g }))}>
                {g}
              </Pill>
            ))}
          </div>
        </div>

        <div>
          <FieldLabel>Who is this for?</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {RELATIONSHIPS.map((r) => (
              <Pill
                key={r}
                selected={form.relationship_type === r}
                onClick={() => setForm((f) => ({ ...f, relationship_type: r }))}
              >
                {r}
              </Pill>
            ))}
          </div>
        </div>

        <div>
          <FieldLabel>Language</FieldLabel>
          <div className="flex flex-wrap gap-2">
            <Pill selected={form.language === "auto"} onClick={() => setForm((f) => ({ ...f, language: "auto" }))}>
              Auto Detect
            </Pill>
            <Pill selected={form.language === "id"} onClick={() => setForm((f) => ({ ...f, language: "id" }))}>
              Indonesia
            </Pill>
            <Pill selected={form.language === "en"} onClick={() => setForm((f) => ({ ...f, language: "en" }))}>
              English
            </Pill>
          </div>
        </div>

        {form.story_type === "comic" && (
          <div>
            <FieldLabel>Comic Style</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {COMIC_STYLES.map((s) => (
                <Pill
                  key={s}
                  selected={form.comic_style === s}
                  onClick={() => setForm((f) => ({ ...f, comic_style: s }))}
                >
                  {s}
                </Pill>
              ))}
            </div>
          </div>
        )}

        <div>
          <FieldLabel hint="Optional — names, appearance, personality">Character Information</FieldLabel>
          <textarea
            value={form.character_info}
            onChange={(e) => setForm((f) => ({ ...f, character_info: e.target.value }))}
            placeholder="e.g. Rina, 17 tahun, ceria, suka membaca"
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-ink/15 dark:border-parchment/20 bg-transparent focus:border-rosegold outline-none resize-none"
          />
        </div>

        <div>
          <FieldLabel hint="Optional — describe the cover/poster you imagine">
            Poster Prompt
          </FieldLabel>
          <input
            type="text"
            value={form.poster_prompt}
            onChange={(e) => setForm((f) => ({ ...f, poster_prompt: e.target.value }))}
            placeholder="e.g. two friends under sakura trees at sunset"
            className="w-full px-4 py-3 rounded-xl border border-ink/15 dark:border-parchment/20 bg-transparent focus:border-rosegold outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full py-3.5 rounded-full bg-rosegold text-parchment font-medium hover:bg-rosegold-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Create with Habibie AI ✨
        </button>
      </form>
    </div>
  );
}

function StepGenerating({
  progress,
  storyType,
}: {
  progress: GenerationProgress | null;
  storyType: StoryType;
}) {
  const pct = progress ? Math.round((progress.current / Math.max(progress.total, 1)) * 100) : 5;
  const eta =
    storyType === "comic"
      ? "Comics take a little longer — Habibie AI is illustrating each panel."
      : "This usually takes under a minute.";

  return (
    <div className="flex flex-col items-center justify-center text-center py-20 animate-fadeup">
      <div className="w-16 h-16 rounded-full border-4 border-rosegold/20 border-t-rosegold animate-spin mb-8" />
      <h2 className="font-display text-2xl font-semibold mb-2">
        {progress?.stage || "Starting Habibie AI…"}
      </h2>
      <p className="text-ink-faint dark:text-parchment/60 text-sm mb-6">{eta}</p>
      <div className="w-full max-w-sm h-2 rounded-full bg-ink/10 dark:bg-parchment/10 overflow-hidden">
        <div
          className="h-full bg-rosegold transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function StepError({
  message,
  onRetry,
  onBack,
}: {
  message: string;
  onRetry: () => void;
  onBack: () => void;
}) {
  return (
    <div className="text-center py-16 animate-fadeup">
      <div className="text-4xl mb-4">😞</div>
      <h2 className="font-display text-2xl font-semibold mb-2">Couldn't finish that story</h2>
      <p className="text-ink-faint dark:text-parchment/70 mb-8 max-w-sm mx-auto">{message}</p>
      <div className="flex gap-3 justify-center">
        <button
          onClick={onBack}
          className="px-5 py-2.5 rounded-full border border-ink/15 dark:border-parchment/20 font-medium"
        >
          Edit details
        </button>
        <button
          onClick={onRetry}
          className="px-5 py-2.5 rounded-full bg-rosegold text-parchment font-medium hover:bg-rosegold-dark"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

function StepDone({
  slug,
  storyId,
  onViewStory,
}: {
  slug: string;
  storyId: string;
  onViewStory: () => void;
}) {
  return (
    <div className="text-center py-16 animate-fadeup">
      <div className="text-4xl mb-4">🎉</div>
      <h2 className="font-display text-2xl font-semibold mb-2">Your story is ready</h2>
      <p className="text-ink-faint dark:text-parchment/70 mb-8">
        It's saved as a draft. Read it through, then publish it to get your share link.
      </p>
      <button
        onClick={onViewStory}
        className="px-6 py-3 rounded-full bg-rosegold text-parchment font-medium hover:bg-rosegold-dark"
      >
        Read & Publish →
      </button>
    </div>
  );
}
