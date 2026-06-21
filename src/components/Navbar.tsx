"use client";

import Link from "next/link";
import { useState } from "react";
import { useTheme } from "./ThemeProvider";

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 dark:border-parchment/10 bg-parchment/90 dark:bg-ink/90 backdrop-blur-md">
      <nav className="mx-auto max-w-6xl px-5 h-16 flex items-center justify-between">
        <Link href="/" className="font-display text-xl font-semibold tracking-tight">
          Story<span className="text-rosegold">Gift</span>
        </Link>

        <div className="hidden md:flex items-center gap-7 text-sm font-medium">
          <Link href="/explore" className="hover:text-rosegold transition-colors">
            Explore
          </Link>
          <Link href="/create" className="hover:text-rosegold transition-colors">
            Create Story
          </Link>
          <Link href="/dashboard" className="hover:text-rosegold transition-colors">
            My Stories
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-ink/5 dark:hover:bg-parchment/10 transition-colors"
          >
            {theme === "light" ? "🌙" : "☀️"}
          </button>
          <Link
            href="/create"
            className="hidden sm:inline-flex items-center px-4 py-2 rounded-full bg-rosegold text-parchment text-sm font-medium hover:bg-rosegold-dark transition-colors"
          >
            Create Story
          </Link>
          <button
            className="md:hidden w-9 h-9 flex items-center justify-center"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            <span className="text-xl">{menuOpen ? "✕" : "☰"}</span>
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="md:hidden border-t border-ink/10 dark:border-parchment/10 px-5 py-4 flex flex-col gap-4 text-sm font-medium animate-fadeup">
          <Link href="/explore" onClick={() => setMenuOpen(false)}>
            Explore
          </Link>
          <Link href="/create" onClick={() => setMenuOpen(false)}>
            Create Story
          </Link>
          <Link href="/dashboard" onClick={() => setMenuOpen(false)}>
            My Stories
          </Link>
        </div>
      )}
    </header>
  );
}
