import { supabase } from "./supabase";
import { getSessionId } from "./session";
import type { Story, StoryPage, Comment } from "@/types/story";

export async function getStoryBySlug(slug: string): Promise<Story | null> {
  const { data, error } = await supabase.from("stories").select("*").eq("slug", slug).maybeSingle();
  if (error) {
    console.error(error);
    return null;
  }
  return data as Story | null;
}

export async function getStoryPages(storyId: string): Promise<StoryPage[]> {
  const { data, error } = await supabase
    .from("story_pages")
    .select("*")
    .eq("story_id", storyId)
    .order("page_index", { ascending: true });
  if (error) {
    console.error(error);
    return [];
  }
  return (data || []) as StoryPage[];
}

export async function recordView(storyId: string): Promise<void> {
  const sessionId = getSessionId();
  // Avoid spamming duplicate views from the same session within a short window —
  // checked client-side for simplicity since this is guest mode (best-effort,
  // not abuse-proof).
  const key = `viewed_${storyId}`;
  if (typeof window !== "undefined" && sessionStorage.getItem(key)) return;

  const { error } = await supabase.rpc("increment_story_views", {
    p_story_id: storyId,
    p_session_id: sessionId,
  });
  if (!error && typeof window !== "undefined") {
    sessionStorage.setItem(key, "1");
  }
}

export async function hasLikedStory(storyId: string): Promise<boolean> {
  const sessionId = getSessionId();
  const { data } = await supabase
    .from("story_likes")
    .select("story_id")
    .eq("story_id", storyId)
    .eq("session_id", sessionId)
    .maybeSingle();
  return !!data;
}

export async function toggleStoryLike(storyId: string): Promise<boolean> {
  const sessionId = getSessionId();
  const { data, error } = await supabase.rpc("toggle_story_like", {
    p_story_id: storyId,
    p_session_id: sessionId,
  });
  if (error) throw new Error("Couldn't update like right now.");
  return data as boolean;
}

export async function getComments(storyId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("story_id", storyId)
    .eq("is_hidden", false)
    .order("created_at", { ascending: false });
  if (error) {
    console.error(error);
    return [];
  }
  return (data || []) as Comment[];
}

export async function postComment(
  storyId: string,
  body: string,
  displayName: string
): Promise<Comment> {
  const sessionId = getSessionId();
  const { data, error } = await supabase
    .from("comments")
    .insert({
      story_id: storyId,
      author_session_id: sessionId,
      author_display_name: displayName || "Anonymous",
      body: body.trim(),
    })
    .select("*")
    .single();
  if (error || !data) throw new Error("Couldn't post your comment. Please try again.");
  return data as Comment;
}

export async function toggleCommentLike(commentId: string): Promise<boolean> {
  const sessionId = getSessionId();
  const { data, error } = await supabase.rpc("toggle_comment_like", {
    p_comment_id: commentId,
    p_session_id: sessionId,
  });
  if (error) throw new Error("Couldn't update like right now.");
  return data as boolean;
}

export async function deleteComment(commentId: string): Promise<void> {
  const { error } = await supabase.from("comments").delete().eq("id", commentId);
  if (error) throw new Error("Couldn't delete comment.");
}
