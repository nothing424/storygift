import Link from "next/link";
import Image from "next/image";
import type { Story } from "@/types/story";

export default function StoryCard({ story }: { story: Story }) {
  return (
    <Link
      href={`/s/${story.slug}`}
      className="group block"
    >
      <div className="book-cover relative aspect-[3/4] mb-3 bg-ink/5 dark:bg-parchment/5">
        {story.cover_url ? (
          <Image
            src={story.cover_url}
            alt={story.title}
            fill
            className="object-cover group-hover:scale-[1.03] transition-transform duration-300"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-3xl">
            {story.story_type === "novel" ? "📖" : story.story_type === "comic" ? "📚" : "🎁"}
          </div>
        )}
        <span className="absolute top-2 left-2 text-[10px] font-mono uppercase tracking-wide bg-ink/70 text-parchment px-2 py-1 rounded-full backdrop-blur-sm">
          {story.story_type === "novel" ? "Novel" : story.story_type === "comic" ? "Comic" : "Gift"}
        </span>
      </div>
      <h3 className="font-display font-semibold text-sm leading-snug mb-1 line-clamp-2 group-hover:text-rosegold transition-colors">
        {story.title}
      </h3>
      <div className="flex items-center gap-2 text-xs text-ink-faint dark:text-parchment/50">
        <span>❤️ {story.like_count}</span>
        <span>·</span>
        <span>👁 {story.view_count}</span>
      </div>
    </Link>
  );
}
