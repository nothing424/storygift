"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getMyStories, deleteStory, unpublishStory, summarizeAnalytics } from "@/lib/dashboard-data";
import { publishStory } from "@/lib/story-storage";
import { getDisplayName, setDisplayName } from "@/lib/session";
import type { Story } from "@/types/story";

type Tab = "all" | "drafts" | "published" | "analytics" | "settings";

export default function DashboardContent() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("all");

  useEffect(() => {
    getMyStories().then((s) => {
      setStories(s);
      setLoading(false);
    });
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Delete this story permanently? This can't be undone.")) return;
    try {
      await deleteStory(id);
      setStories((s) => s.filter((story) => story.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Couldn't delete.");
    }
  }

  async function handlePublishToggle(story: Story) {
    try {
      if (story.status === "draft") {
        await publishStory(story.id);
        setStories((s) =>
          s.map((x) => (x.id === story.id ? { ...x, status: "published" } : x))
        );
      } else {
        await unpublishStory(story.id);
        setStories((s) => s.map((x) => (x.id === story.id ? { ...x, status: "draft" } : x)));
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Couldn't update.");
    }
  }

  const drafts = stories.filter((s) => s.status === "draft");
  const published = stories.filter((s) => s.status === "published");

  const visibleStories = tab === "drafts" ? drafts : tab === "published" ? published : stories;

  return (
    <main className="mx-auto max-w-5xl px-5 py-12">
      <h1 className="font-display text-3xl md:text-4xl font-semibold mb-2">My Stories</h1>
      <p className="text-ink-faint dark:text-parchment/70 mb-8">
        Manage your drafts, published stories, and account settings.
      </p>

      <div className="flex gap-1.5 mb-8 border-b border-ink/10 dark:border-parchment/10 overflow-x-auto">
        {[
          { id: "all", label: `All (${stories.length})` },
          { id: "drafts", label: `Drafts (${drafts.length})` },
          { id: "published", label: `Published (${published.length})` },
          { id: "analytics", label: "Analytics" },
          { id: "settings", label: "Settings" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as Tab)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              tab === t.id
                ? "border-rosegold text-rosegold-dark"
                : "border-transparent text-ink-faint dark:text-parchment/50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "analytics" ? (
        <AnalyticsTab stories={stories} />
      ) : tab === "settings" ? (
        <SettingsTab />
      ) : loading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 rounded-full border-4 border-rosegold/20 border-t-rosegold animate-spin" />
        </div>
      ) : visibleStories.length === 0 ? (
        <EmptyTab tab={tab} />
      ) : (
        <ul className="space-y-3">
          {visibleStories.map((story) => (
            <StoryRow
              key={story.id}
              story={story}
              onDelete={() => handleDelete(story.id)}
              onPublishToggle={() => handlePublishToggle(story)}
            />
          ))}
        </ul>
      )}
    </main>
  );
}

function StoryRow({
  story,
  onDelete,
  onPublishToggle,
}: {
  story: Story;
  onDelete: () => void;
  onPublishToggle: () => void;
}) {
  return (
    <li className="flex items-center gap-4 p-4 rounded-2xl border border-ink/10 dark:border-parchment/10">
      <div className="relative w-14 h-18 shrink-0 rounded-lg overflow-hidden bg-ink/5 dark:bg-parchment/5">
        {story.cover_url ? (
          <Image src={story.cover_url} alt={story.title} fill className="object-cover" unoptimized />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-lg">
            {story.story_type === "novel" ? "📖" : story.story_type === "comic" ? "📚" : "🎁"}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <Link href={`/s/${story.slug}`} className="font-medium hover:text-rosegold transition-colors truncate block">
          {story.title}
        </Link>
        <div className="flex items-center gap-2 text-xs text-ink-faint dark:text-parchment/50 mt-1">
          <span
            className={`px-2 py-0.5 rounded-full ${
              story.status === "published"
                ? "bg-green-500/10 text-green-700 dark:text-green-400"
                : "bg-gold/15 text-gold-light dark:text-gold"
            }`}
          >
            {story.status === "published" ? "Published" : "Draft"}
          </span>
          <span>❤️ {story.like_count}</span>
          <span>👁 {story.view_count}</span>
          <span>💬 {story.comment_count}</span>
        </div>
      </div>

      <div className="flex gap-2 shrink-0">
        <button
          onClick={onPublishToggle}
          className="px-3 py-1.5 rounded-full text-xs font-medium border border-ink/15 dark:border-parchment/20"
        >
          {story.status === "published" ? "Unpublish" : "Publish"}
        </button>
        <button
          onClick={onDelete}
          className="px-3 py-1.5 rounded-full text-xs font-medium border border-rosegold/30 text-rosegold-dark"
        >
          Delete
        </button>
      </div>
    </li>
  );
}

function AnalyticsTab({ stories }: { stories: Story[] }) {
  const summary = summarizeAnalytics(stories);
  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        <StatCard label="Views" value={summary.totalViews} />
        <StatCard label="Likes" value={summary.totalLikes} />
        <StatCard label="Comments" value={summary.totalComments} />
        <StatCard label="Stories" value={summary.storyCount} />
      </div>
      <p className="text-xs text-ink-faint dark:text-parchment/40 mb-8">
        Share tracking isn't available yet since links can be copied outside the
        app — only views, likes, and comments are measured.
      </p>

      <h2 className="font-display text-lg font-semibold mb-4">Per-story breakdown</h2>
      {stories.length === 0 ? (
        <p className="text-sm text-ink-faint dark:text-parchment/60">No stories yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink-faint dark:text-parchment/50 border-b border-ink/10 dark:border-parchment/10">
                <th className="py-2 pr-4">Title</th>
                <th className="py-2 pr-4">Views</th>
                <th className="py-2 pr-4">Likes</th>
                <th className="py-2 pr-4">Comments</th>
              </tr>
            </thead>
            <tbody>
              {stories.map((s) => (
                <tr key={s.id} className="border-b border-ink/5 dark:border-parchment/5">
                  <td className="py-2.5 pr-4 max-w-[220px] truncate">{s.title}</td>
                  <td className="py-2.5 pr-4">{s.view_count}</td>
                  <td className="py-2.5 pr-4">{s.like_count}</td>
                  <td className="py-2.5 pr-4">{s.comment_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="p-5 rounded-2xl border border-ink/10 dark:border-parchment/10">
      <p className="text-2xl font-display font-semibold">{value}</p>
      <p className="text-xs text-ink-faint dark:text-parchment/50 mt-1">{label}</p>
    </div>
  );
}

function SettingsTab() {
  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setName(getDisplayName());
  }, []);

  function handleSave() {
    setDisplayName(name);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="max-w-sm">
      <h2 className="font-display text-lg font-semibold mb-4">Display name</h2>
      <p className="text-sm text-ink-faint dark:text-parchment/60 mb-4">
        Shown as the author on stories you publish and comments you post.
        StoryGift uses Guest Mode — there's no account or password.
      </p>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        className="w-full px-4 py-2.5 rounded-xl border border-ink/15 dark:border-parchment/20 bg-transparent text-sm focus:border-rosegold outline-none mb-3"
      />
      <button
        onClick={handleSave}
        className="px-5 py-2 rounded-full bg-rosegold text-parchment text-sm font-medium"
      >
        {saved ? "Saved ✓" : "Save name"}
      </button>
    </div>
  );
}

function EmptyTab({ tab }: { tab: Tab }) {
  return (
    <div className="text-center py-16">
      <p className="text-4xl mb-4">📝</p>
      <h2 className="font-display text-xl font-semibold mb-2">
        {tab === "drafts" ? "No drafts yet" : tab === "published" ? "Nothing published yet" : "No stories yet"}
      </h2>
      <Link href="/create" className="text-rosegold font-medium">
        Create your first story →
      </Link>
    </div>
  );
}
