"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  getStoryBySlug,
  getStoryPages,
  recordView,
  hasLikedStory,
  toggleStoryLike,
} from "@/lib/story-data";
import { publishStory } from "@/lib/story-storage";
import { getSessionId } from "@/lib/session";
import ShareModal from "./ShareModal";
import CommentsSection from "./CommentsSection";
import Footer from "./Footer";
import type {
  Story,
  StoryPage,
  NovelPageContent,
  GiftBookPageContent,
  ComicPageContent,
} from "@/types/story";

export default function StoryReader({ slug }: { slug: string }) {
  const [story, setStory] = useState<Story | null>(null);
  const [pages, setPages] = useState<StoryPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [publishing, setPublishing] = useState(false);
  const [currentSlugState, setCurrentSlugState] = useState(slug);
  const containerRef = useRef<HTMLDivElement>(null);

  const isOwner = story && story.author_session_id === getSessionId();

  useEffect(() => {
    let mounted = true;
    (async () => {
      const s = await getStoryBySlug(slug);
      if (!mounted) return;
      if (!s) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setStory(s);
      setLikeCount(s.like_count);
      setCurrentSlugState(s.slug);
      const [p, likedAlready] = await Promise.all([getStoryPages(s.id), hasLikedStory(s.id)]);
      setPages(p);
      setLiked(likedAlready);
      setLoading(false);
      if (s.status === "published") {
        recordView(s.id);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [slug]);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const el = document.documentElement;
    const scrollTop = el.scrollTop;
    const max = el.scrollHeight - el.clientHeight;
    setProgress(max > 0 ? Math.min(100, (scrollTop / max) * 100) : 0);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  async function handleLike() {
    if (!story) return;
    try {
      const nowLiked = await toggleStoryLike(story.id);
      setLiked(nowLiked);
      setLikeCount((c) => c + (nowLiked ? 1 : -1));
    } catch {
      // best-effort
    }
  }

  async function handlePublish() {
    if (!story) return;
    setPublishing(true);
    try {
      await publishStory(story.id);
      setStory({ ...story, status: "published", published_at: new Date().toISOString() });
      setShareOpen(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Couldn't publish right now.");
    } finally {
      setPublishing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 rounded-full border-4 border-rosegold/20 border-t-rosegold animate-spin" />
      </div>
    );
  }

  if (notFound || !story) {
    return (
      <div className="text-center py-24">
        <p className="text-4xl mb-4">📭</p>
        <h1 className="font-display text-2xl font-semibold mb-2">Story not found</h1>
        <p className="text-ink-faint dark:text-parchment/60 mb-6">
          This link doesn't lead to a story — it may have been moved or never existed.
        </p>
        <Link href="/explore" className="text-rosegold font-medium">
          Explore other stories →
        </Link>
      </div>
    );
  }

  const readingMinutes = estimateReadingTime(pages, story.story_type);

  return (
    <div ref={containerRef} className={fullscreen ? "fixed inset-0 z-50 overflow-y-auto bg-parchment dark:bg-ink" : ""}>
      <div className="reading-progress" style={{ width: `${progress}%` }} />

      {fullscreen && (
        <button
          onClick={() => setFullscreen(false)}
          className="fixed top-4 right-4 z-50 w-10 h-10 rounded-full bg-ink/10 dark:bg-parchment/10 flex items-center justify-center"
          aria-label="Exit fullscreen"
        >
          ✕
        </button>
      )}

      <article className="mx-auto max-w-2xl px-5 py-10">
        {/* Header */}
        <div className="mb-10">
          {story.cover_url && (
            <div className="book-cover w-44 mx-auto mb-8 aspect-[3/4] relative">
              <Image
                src={story.cover_url}
                alt={`Cover for ${story.title}`}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}
          <div className="text-center">
            <span className="text-xs font-mono uppercase tracking-wider text-rosegold-dark">
              {labelForType(story.story_type)} · {story.genre}
            </span>
            <h1 className="font-display text-3xl md:text-4xl font-semibold mt-2 mb-3 leading-tight">
              {story.title}
            </h1>
            {story.synopsis && (
              <p className="text-ink-faint dark:text-parchment/70 max-w-md mx-auto mb-5">
                {story.synopsis}
              </p>
            )}
            <div className="flex items-center justify-center gap-4 text-sm text-ink-faint dark:text-parchment/50 mb-6">
              <span>By {story.author_display_name}</span>
              <span>·</span>
              <span>{readingMinutes} min read</span>
              <span>·</span>
              <span>{story.view_count} views</span>
            </div>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handleLike}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                  liked
                    ? "bg-rosegold text-parchment border-rosegold"
                    : "border-ink/15 dark:border-parchment/20"
                }`}
              >
                {liked ? "❤️" : "🤍"} {likeCount}
              </button>
              <button
                onClick={() => setShareOpen(true)}
                className="px-4 py-2 rounded-full text-sm font-medium border border-ink/15 dark:border-parchment/20"
              >
                Share
              </button>
              <button
                onClick={() => setFullscreen((v) => !v)}
                className="px-4 py-2 rounded-full text-sm font-medium border border-ink/15 dark:border-parchment/20"
              >
                {fullscreen ? "Exit" : "Fullscreen"}
              </button>
            </div>

            {isOwner && story.status === "draft" && (
              <div className="mt-6 p-4 rounded-xl bg-gold/10 border border-gold/30">
                <p className="text-sm mb-3">
                  This story is still a draft — only you can see it. Publish it to get a
                  shareable link.
                </p>
                <button
                  onClick={handlePublish}
                  disabled={publishing}
                  className="px-5 py-2 rounded-full bg-rosegold text-parchment text-sm font-medium disabled:opacity-40"
                >
                  {publishing ? "Publishing…" : "Publish story"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-12">
          {pages.map((page, idx) => (
            <PageRenderer key={page.id} page={page} storyType={story.story_type} index={idx} />
          ))}
        </div>

        {!fullscreen && <CommentsSection storyId={story.id} />}
      </article>

      {!fullscreen && <Footer />}

      {shareOpen && (
        <ShareModal
          storyId={story.id}
          currentSlug={currentSlugState}
          onClose={() => setShareOpen(false)}
          onSlugUpdated={(newSlug) => setCurrentSlugState(newSlug)}
        />
      )}
    </div>
  );
}

function labelForType(t: string) {
  if (t === "novel") return "Novel";
  if (t === "comic") return "Comic";
  return "Gift Book";
}

function estimateReadingTime(pages: StoryPage[], storyType: string): number {
  if (storyType === "comic") return Math.max(1, pages.length); // ~1 min/page for comics
  const words = pages.reduce((sum, p) => {
    const content = p.content_json as NovelPageContent | GiftBookPageContent;
    return sum + (content.text?.split(/\s+/).length || 0);
  }, 0);
  return Math.max(1, Math.round(words / 200));
}

function PageRenderer({
  page,
  storyType,
  index,
}: {
  page: StoryPage;
  storyType: string;
  index: number;
}) {
  if (storyType === "comic") {
    const content = page.content_json as ComicPageContent;
    return (
      <section className="animate-fadeup">
        {page.title && (
          <h2 className="font-display text-lg font-semibold mb-4 text-center text-ink-faint dark:text-parchment/60">
            {page.title}
          </h2>
        )}
        <div className="space-y-4">
          {content.panels?.map((panel, pIdx) => (
            <div key={pIdx} className="book-cover relative">
              <div className="relative w-full aspect-square">
                <Image
                  src={panel.image_url}
                  alt={panel.caption || `Panel ${pIdx + 1}`}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              {panel.caption && (
                <p className="px-4 py-2 text-xs italic text-ink-faint dark:text-parchment/60 bg-parchment dark:bg-ink-soft">
                  {panel.caption}
                </p>
              )}
              {panel.dialogue?.length > 0 && (
                <div className="px-4 py-3 bg-parchment dark:bg-ink-soft space-y-1.5">
                  {panel.dialogue.map((line, lIdx) => (
                    <p key={lIdx} className="text-sm font-medium">
                      {line}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    );
  }

  // novel + gift_book share the same prose layout, with optional illustration
  const content = page.content_json as GiftBookPageContent;
  const isMessage = page.page_type === "opening" || page.page_type === "closing";

  return (
    <section className="animate-fadeup">
      {page.title && !isMessage && (
        <h2 className="font-display text-xl font-semibold mb-4">{page.title}</h2>
      )}
      {isMessage && (
        <p className="text-xs font-mono uppercase tracking-wider text-rosegold-dark mb-3">
          {page.page_type === "opening" ? "💌 Opening Message" : "💌 Closing Message"}
        </p>
      )}
      {content.illustration_url && (
        <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden mb-5 shadow-book dark:shadow-book-dark">
          <Image
            src={content.illustration_url}
            alt={page.title || "Illustration"}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      )}
      <div
        className={`whitespace-pre-wrap leading-relaxed ${
          isMessage ? "font-display italic text-lg text-center" : "text-base"
        }`}
      >
        {content.text}
      </div>
    </section>
  );
}
