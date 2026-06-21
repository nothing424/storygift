import { supabase } from "./supabase";
import { getSessionId } from "./session";
import type { Story } from "@/types/story";

export async function getMyStories(): Promise<Story[]> {
  const sessionId = getSessionId();
  const { data, error } = await supabase
    .from("stories")
    .select("*")
    .eq("author_session_id", sessionId)
    .order("updated_at", { ascending: false });
  if (error) {
    console.error(error);
    return [];
  }
  return (data || []) as Story[];
}

export async function deleteStory(storyId: string): Promise<void> {
  const { error } = await supabase.from("stories").delete().eq("id", storyId);
  if (error) throw new Error("Couldn't delete this story.");
}

export async function unpublishStory(storyId: string): Promise<void> {
  const { error } = await supabase
    .from("stories")
    .update({ status: "draft" })
    .eq("id", storyId);
  if (error) throw new Error("Couldn't update this story.");
}

export interface AnalyticsSummary {
  totalViews: number;
  totalLikes: number;
  totalShares: number; // approximated via views as a proxy; see note in UI
  totalComments: number;
  storyCount: number;
}

export function summarizeAnalytics(stories: Story[]): AnalyticsSummary {
  return stories.reduce(
    (acc, s) => ({
      totalViews: acc.totalViews + s.view_count,
      totalLikes: acc.totalLikes + s.like_count,
      totalShares: acc.totalShares, // no native share tracking yet
      totalComments: acc.totalComments + s.comment_count,
      storyCount: acc.storyCount + 1,
    }),
    { totalViews: 0, totalLikes: 0, totalShares: 0, totalComments: 0, storyCount: 0 }
  );
}
