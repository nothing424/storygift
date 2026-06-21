"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StoryCard from "@/components/StoryCard";
import { getTrending, getMostLoved, getNewest, getByType, searchStories } from "@/lib/explore-data";
import type { Story } from "@/types/story";

export default function ExploreContent() {
  const [trending, setTrending] = useState<Story[]>([]);
  const [mostLoved, setMostLoved] = useState<Story[]>([]);
  const [newest, setNewest] = useState<Story[]>([]);
  const [novels, setNovels] = useState<Story[]>([]);
  const [comics, setComics] = useState<Story[]>([]);
  const [giftBooks, setGiftBooks] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Story[] | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    Promise.all([
      getTrending(),
      getMostLoved(),
      getNewest(),
      getByType("novel"),
      getByType("comic"),
      getByType("gift_book"),
    ]).then(([t, m, n, nv, cm, gb]) => {
      setTrending(t);
      setMostLoved(m);
      setNewest(n);
      setNovels(nv);
      setComics(cm);
      setGiftBooks(gb);
      setLoading(false);
    });
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    const results = await searchStories(query.trim());
    setSearchResults(results);
    setSearching(false);
  }

  const isEmpty =
    !loading &&
    trending.length === 0 &&
    mostLoved.length === 0 &&
    newest.length === 0;

  return (
    <main className="mx-auto max-w-6xl px-5 py-12">
      <div className="mb-10">
        <h1 className="font-display text-3xl md:text-4xl font-semibold mb-3">Explore Stories</h1>
        <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search stories…"
            className="flex-1 px-4 py-2.5 rounded-full border border-ink/15 dark:border-parchment/20 bg-transparent text-sm focus:border-rosegold outline-none"
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-full bg-rosegold text-parchment text-sm font-medium hover:bg-rosegold-dark"
          >
            Search
          </button>
        </form>
      </div>

      {searchResults !== null ? (
        <SearchResultsView
          results={searchResults}
          query={query}
          searching={searching}
          onClear={() => {
            setSearchResults(null);
            setQuery("");
          }}
        />
      ) : loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 rounded-full border-4 border-rosegold/20 border-t-rosegold animate-spin" />
        </div>
      ) : isEmpty ? (
        <EmptyState />
      ) : (
        <div className="space-y-14">
          <Section title="🔥 Trending Stories" stories={trending} />
          <Section title="❤️ Most Loved" stories={mostLoved} />
          <Section title="📚 Novels" stories={novels} />
          <Section title="🎨 Comics" stories={comics} />
          <Section title="🎁 Gift Books" stories={giftBooks} />
          <Section title="Newest Stories" stories={newest} />
        </div>
      )}
    </main>
  );
}

function Section({ title, stories }: { title: string; stories: Story[] }) {
  if (stories.length === 0) return null;
  return (
    <section>
      <h2 className="font-display text-xl font-semibold mb-5">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
        {stories.map((s) => (
          <StoryCard key={s.id} story={s} />
        ))}
      </div>
    </section>
  );
}

function SearchResultsView({
  results,
  query,
  searching,
  onClear,
}: {
  results: Story[];
  query: string;
  searching: boolean;
  onClear: () => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-ink-faint dark:text-parchment/60">
          {searching ? "Searching…" : `${results.length} result${results.length === 1 ? "" : "s"} for "${query}"`}
        </p>
        <button onClick={onClear} className="text-sm text-rosegold font-medium">
          Clear search
        </button>
      </div>
      {!searching && results.length === 0 && (
        <p className="text-ink-faint dark:text-parchment/60">
          No stories found. Try a different search.
        </p>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
        {results.map((s) => (
          <StoryCard key={s.id} story={s} />
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-20">
      <p className="text-4xl mb-4">📖</p>
      <h2 className="font-display text-xl font-semibold mb-2">No stories yet</h2>
      <p className="text-ink-faint dark:text-parchment/60 mb-6">
        Be the first to turn a memory into a story.
      </p>
      <Link
        href="/create"
        className="inline-flex items-center px-6 py-3 rounded-full bg-rosegold text-parchment font-medium hover:bg-rosegold-dark"
      >
        Create Story
      </Link>
    </div>
  );
}
