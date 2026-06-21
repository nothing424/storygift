"use client";

import { ReactNode } from "react";
import clsx from "clsx";

export function SelectCard({
  selected,
  onClick,
  emoji,
  title,
  description,
}: {
  selected: boolean;
  onClick: () => void;
  emoji: string;
  title: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "text-left p-5 rounded-2xl border-2 transition-all w-full",
        selected
          ? "border-rosegold bg-rosegold/10 shadow-book dark:shadow-book-dark"
          : "border-ink/10 dark:border-parchment/15 hover:border-rosegold/40"
      )}
    >
      <div className="text-2xl mb-2">{emoji}</div>
      <p className="font-display font-semibold text-base">{title}</p>
      {description && (
        <p className="text-xs text-ink-faint dark:text-parchment/60 mt-1">{description}</p>
      )}
    </button>
  );
}

export function Pill({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "px-4 py-2 rounded-full text-sm font-medium border transition-colors",
        selected
          ? "bg-rosegold text-parchment border-rosegold"
          : "border-ink/15 dark:border-parchment/20 hover:border-rosegold/50"
      )}
    >
      {children}
    </button>
  );
}

export function FieldLabel({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <label className="block mb-2">
      <span className="text-sm font-medium">{children}</span>
      {hint && <span className="block text-xs text-ink-faint dark:text-parchment/50 mt-0.5">{hint}</span>}
    </label>
  );
}
