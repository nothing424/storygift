// Guest Mode session handling.
// StoryGift has no login. We generate a stable anonymous id per browser
// and store it in localStorage so a person's drafts/likes/comments are
// recognizable as "theirs" across visits, without any account.

import { nanoid } from "nanoid";

const SESSION_KEY = "storygift_session_id";
const NAME_KEY = "storygift_display_name";

export function getSessionId(): string {
  if (typeof window === "undefined") return "server";
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = nanoid(16);
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function getDisplayName(): string {
  if (typeof window === "undefined") return "Anonymous";
  return localStorage.getItem(NAME_KEY) || "Anonymous";
}

export function setDisplayName(name: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(NAME_KEY, name.trim().slice(0, 40) || "Anonymous");
}
