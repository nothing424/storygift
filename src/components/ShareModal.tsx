"use client";

import { useState } from "react";
import { slugify, isValidSlug } from "@/lib/slug";
import { supabase } from "@/lib/supabase";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://storygift.biz.id";

export default function ShareModal({
  storyId,
  currentSlug,
  onClose,
  onSlugUpdated,
}: {
  storyId: string;
  currentSlug: string;
  onClose: () => void;
  onSlugUpdated: (slug: string) => void;
}) {
  const [slugInput, setSlugInput] = useState(currentSlug);
  const [checking, setChecking] = useState(false);
  const [availability, setAvailability] = useState<"unknown" | "available" | "taken" | "invalid">(
    "unknown"
  );
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = `${SITE_URL}/s/${currentSlug}`;

  async function checkAvailability(value: string) {
    const clean = slugify(value);
    setSlugInput(clean);
    if (clean === currentSlug) {
      setAvailability("unknown");
      return;
    }
    if (!isValidSlug(clean)) {
      setAvailability("invalid");
      return;
    }
    setChecking(true);
    try {
      const res = await fetch(`/api/stories/check-slug?slug=${encodeURIComponent(clean)}`);
      const data = await res.json();
      setAvailability(data.available ? "available" : "taken");
    } catch {
      setAvailability("unknown");
    } finally {
      setChecking(false);
    }
  }

  async function handleSaveSlug() {
    if (availability !== "available") return;
    setSaving(true);
    try {
      const { error } = await supabase.from("stories").update({ slug: slugInput }).eq("id", storyId);
      if (error) throw error;
      onSlugUpdated(slugInput);
    } catch {
      alert("Couldn't update the link. That URL may already be taken.");
    } finally {
      setSaving(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className="fixed inset-0 bg-ink/50 backdrop-blur-sm z-50 flex items-center justify-center p-5"
      onClick={onClose}
    >
      <div
        className="bg-parchment dark:bg-ink-soft rounded-2xl p-6 max-w-md w-full shadow-book dark:shadow-book-dark animate-fadeup"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-xl font-semibold mb-4">Share this story</h3>

        <div className="flex items-center gap-2 mb-5">
          <input
            readOnly
            value={shareUrl}
            className="flex-1 px-3 py-2.5 rounded-lg border border-ink/15 dark:border-parchment/20 bg-transparent text-sm truncate"
          />
          <button
            onClick={handleCopy}
            className="px-4 py-2.5 rounded-lg bg-rosegold text-parchment text-sm font-medium whitespace-nowrap"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>

        <p className="text-xs font-medium text-ink-faint dark:text-parchment/60 mb-2">
          Customize your link
        </p>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-ink-faint dark:text-parchment/40 whitespace-nowrap">
            storygift.biz.id/s/
          </span>
          <input
            value={slugInput}
            onChange={(e) => checkAvailability(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg border border-ink/15 dark:border-parchment/20 bg-transparent text-sm focus:border-rosegold outline-none"
          />
        </div>
        <p className="text-xs mb-4 h-4">
          {checking && <span className="text-ink-faint">Checking…</span>}
          {!checking && availability === "available" && (
            <span className="text-green-600 dark:text-green-400">✓ Available</span>
          )}
          {!checking && availability === "taken" && (
            <span className="text-rosegold-dark">Already taken</span>
          )}
          {!checking && availability === "invalid" && (
            <span className="text-rosegold-dark">Use lowercase letters, numbers, hyphens only</span>
          )}
        </p>

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full text-sm font-medium border border-ink/15 dark:border-parchment/20"
          >
            Close
          </button>
          <button
            onClick={handleSaveSlug}
            disabled={availability !== "available" || saving}
            className="px-4 py-2 rounded-full text-sm font-medium bg-rosegold text-parchment disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save link"}
          </button>
        </div>
      </div>
    </div>
  );
}
