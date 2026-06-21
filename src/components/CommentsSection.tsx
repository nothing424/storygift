"use client";

import { useEffect, useState } from "react";
import { getComments, postComment, toggleCommentLike } from "@/lib/story-data";
import { getDisplayName, setDisplayName, getSessionId } from "@/lib/session";
import type { Comment } from "@/types/story";

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function CommentsSection({ storyId }: { storyId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [name, setName] = useState("");
  const [posting, setPosting] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const sessionId = getSessionId();

  useEffect(() => {
    setName(getDisplayName());
    getComments(storyId).then((c) => {
      setComments(c);
      setLoading(false);
    });
  }, [storyId]);

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setPosting(true);
    try {
      setDisplayName(name);
      const comment = await postComment(storyId, body, name || "Anonymous");
      setComments((c) => [comment, ...c]);
      setBody("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Couldn't post comment.");
    } finally {
      setPosting(false);
    }
  }

  async function handleLike(commentId: string) {
    try {
      const liked = await toggleCommentLike(commentId);
      setLikedIds((prev) => {
        const next = new Set(prev);
        if (liked) next.add(commentId);
        else next.delete(commentId);
        return next;
      });
      setComments((cs) =>
        cs.map((c) =>
          c.id === commentId ? { ...c, like_count: c.like_count + (liked ? 1 : -1) } : c
        )
      );
    } catch {
      // best-effort; ignore
    }
  }

  return (
    <section className="mt-16">
      <h2 className="font-display text-2xl font-semibold mb-6">
        Comments {comments.length > 0 && `(${comments.length})`}
      </h2>

      <form onSubmit={handlePost} className="mb-8 space-y-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name (optional)"
          className="w-full px-4 py-2.5 rounded-xl border border-ink/15 dark:border-parchment/20 bg-transparent text-sm focus:border-rosegold outline-none"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Share your thoughts on this story…"
          rows={3}
          maxLength={1000}
          className="w-full px-4 py-3 rounded-xl border border-ink/15 dark:border-parchment/20 bg-transparent text-sm focus:border-rosegold outline-none resize-none"
        />
        <button
          type="submit"
          disabled={posting || !body.trim()}
          className="px-5 py-2 rounded-full bg-rosegold text-parchment text-sm font-medium hover:bg-rosegold-dark disabled:opacity-40"
        >
          {posting ? "Posting…" : "Post comment"}
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-ink-faint dark:text-parchment/50">Loading comments…</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-ink-faint dark:text-parchment/50">
          No comments yet. Be the first to share your thoughts.
        </p>
      ) : (
        <ul className="space-y-5">
          {comments.map((c) => (
            <li key={c.id} className="border-b border-ink/10 dark:border-parchment/10 pb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-medium text-sm">{c.author_display_name}</span>
                <span className="text-xs text-ink-faint dark:text-parchment/40">
                  {timeAgo(c.created_at)}
                </span>
              </div>
              <p className="text-sm text-ink-soft dark:text-parchment/85 mb-2 whitespace-pre-wrap">
                {c.body}
              </p>
              <button
                onClick={() => handleLike(c.id)}
                className={`text-xs font-medium inline-flex items-center gap-1 transition-colors ${
                  likedIds.has(c.id) ? "text-rosegold" : "text-ink-faint dark:text-parchment/50"
                }`}
              >
                {likedIds.has(c.id) ? "❤️" : "🤍"} {c.like_count > 0 ? c.like_count : "Like"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
