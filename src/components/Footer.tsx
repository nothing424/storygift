const SUPPORT_URL = process.env.NEXT_PUBLIC_SUPPORT_URL || "https://sociabuzz.com/";

export default function Footer() {
  return (
    <footer className="border-t border-ink/10 dark:border-parchment/10 mt-20">
      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="rounded-2xl bg-rosegold/10 dark:bg-rosegold/15 border border-rosegold/20 p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-10">
          <div>
            <p className="font-display text-lg font-semibold mb-1">☕ Support StoryGift</p>
            <p className="text-sm text-ink-faint dark:text-parchment/70 max-w-md">
              If StoryGift helped create a special moment for someone, consider
              supporting development voluntarily. No premium plan, no paywall —
              every core feature stays free.
            </p>
          </div>
          <a
            href={SUPPORT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center px-5 py-2.5 rounded-full bg-rosegold text-parchment text-sm font-medium hover:bg-rosegold-dark transition-colors"
          >
            Support on Sociabuzz
          </a>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-faint dark:text-parchment/50">
          <p>Created with StoryGift · Powered by Habibie AI</p>
          <p>© {new Date().getFullYear()} StoryGift. Turn memories into stories.</p>
        </div>
      </div>
    </footer>
  );
}
