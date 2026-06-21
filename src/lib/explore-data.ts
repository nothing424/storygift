import { supabase } from "./supabase";
import type { Story, StoryType } from "@/types/story";

async function fetchPublished(
  orderColumn: string,
  ascending: boolean,
  limit: number,
  storyType?: StoryType
): Promise<Story[]> {
  let query = supabase
    .from("stories")
    .select("*")
    .eq("status", "published")
    .order(orderColumn, { ascending })
    .limit(limit);

  if (storyType) query = query.eq("story_type", storyType);

  const { data, error } = await query;
  if (error) {
    console.error(error);
    return [];
  }
  return (data || []) as Story[];
}

export async function getTrending(limit = 8): Promise<Story[]> {
  return fetchPublished("view_count", false, limit);
}

export async function getMostLoved(limit = 8): Promise<Story[]> {
  return fetchPublished("like_count", false, limit);
}

export async function getNewest(limit = 8): Promise<Story[]> {
  return fetchPublished("created_at", false, limit);
}

export async function getByType(type: StoryType, limit = 8): Promise<Story[]> {
  return fetchPublished("created_at", false, limit, type);
}

export async function searchStories(query: string): Promise<Story[]> {
  const { data, error } = await supabase
    .from("stories")
    .select("*")
    .eq("status", "published")
    .ilike("title", `%${query}%`)
    .order("view_count", { ascending: false })
    .limit(20);
  if (error) {
    console.error(error);
    return [];
  }
  return (data || []) as Story[];
}
