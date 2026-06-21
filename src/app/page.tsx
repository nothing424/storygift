import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        {/* HERO — book-fold layout */}
        <section className="relative overflow-hidden">
          <div className="mx-auto max-w-6xl px-5 pt-16 pb-20 md:pt-24 md:pb-28">
            <div className="grid md:grid-cols-2 gap-12 items-center fold-divider">
              <div className="animate-fadeup">
                <span className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-rosegold-dark bg-rosegold/10 px-3 py-1.5 rounded-full mb-6">
                  Powered by Habibie AI
                </span>
                <h1 className="font-display text-4xl md:text-6xl font-semibold leading-[1.05] tracking-tight mb-5">
                  Turn Memories
                  <br />
                  Into <span className="italic text-rosegold">Stories.</span>
                </h1>
                <p className="text-lg text-ink-faint dark:text-parchment/70 mb-8 max-w-md">
                  Create novels, comics, and digital gift books using AI in
                  minutes. Share them with a single link.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/create"
                    className="inline-flex items-center px-6 py-3 rounded-full bg-rosegold text-parchment font-medium hover:bg-rosegold-dark transition-colors shadow-book"
                  >
                    Create Story
                  </Link>
                  <Link
                    href="/explore"
                    className="inline-flex items-center px-6 py-3 rounded-full border border-ink/15 dark:border-parchment/20 font-medium hover:bg-ink/5 dark:hover:bg-parchment/10 transition-colors"
                  >
                    Explore Stories
                  </Link>
                </div>
              </div>

              {/* Stacked book-cover visual */}
              <div className="relative h-[360px] md:h-[420px] flex items-center justify-center">
                <div className="absolute w-44 md:w-52 aspect-[3/4] book-cover bg-teal rotate-[-9deg] translate-x-[-70px] translate-y-3" />
                <div className="absolute w-44 md:w-52 aspect-[3/4] book-cover bg-gold/90 rotate-[6deg] translate-x-[60px] translate-y-6" />
                <div className="relative w-48 md:w-56 aspect-[3/4] book-cover bg-rosegold flex items-end p-5 z-10 animate-pageturn">
                  <div className="text-parchment">
                    <p className="font-mono text-[10px] uppercase tracking-widest opacity-80 mb-1">
                      Gift Book
                    </p>
                    <p className="font-display text-lg font-semibold leading-snug">
                      Our Story,
                      <br />
                      Beautifully Told
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STORY TYPES */}
        <section className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="font-display text-2xl md:text-3xl font-semibold mb-2">
            Three ways to tell it
          </h2>
          <p className="text-ink-faint dark:text-parchment/70 mb-10 max-w-xl">
            Choose the format that fits the moment.
          </p>
          <div className="grid sm:grid-cols-3 gap-5">
            <StoryTypeCard
              emoji="📖"
              title="Novel"
              description="Cover, synopsis, chapters, and a proper ending — for stories with room to breathe."
            />
            <StoryTypeCard
              emoji="📚"
              title="Comic"
              description="Manga, anime comic, or webtoon style pages with panels, dialogue, and art."
            />
            <StoryTypeCard
              emoji="🎁"
              title="Gift Book"
              description="An opening message, illustrated pages, and a closing note — made to be given."
            />
          </div>
        </section>

        {/* OCCASIONS */}
        <section className="mx-auto max-w-6xl px-5 py-16 border-t border-ink/10 dark:border-parchment/10">
          <h2 className="font-display text-2xl md:text-3xl font-semibold mb-8">
            For every moment worth keeping
          </h2>
          <div className="flex flex-wrap gap-3">
            {[
              "Birthday gifts",
              "Graduation gifts",
              "Family stories",
              "Romantic stories",
              "Friendship stories",
              "Original stories",
            ].map((tag) => (
              <span
                key={tag}
                className="px-4 py-2 rounded-full border border-ink/10 dark:border-parchment/15 text-sm font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function StoryTypeCard({
  emoji,
  title,
  description,
}: {
  emoji: string;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 rounded-2xl border border-ink/10 dark:border-parchment/10 hover:border-rosegold/40 hover:shadow-book dark:hover:shadow-book-dark transition-all">
      <div className="text-3xl mb-4">{emoji}</div>
      <h3 className="font-display text-xl font-semibold mb-2">{title}</h3>
      <p className="text-sm text-ink-faint dark:text-parchment/70">{description}</p>
    </div>
  );
}
