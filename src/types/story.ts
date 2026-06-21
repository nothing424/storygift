export type StoryType = "novel" | "comic" | "gift_book";
export type Genre =
  | "Romance"
  | "Friendship"
  | "Drama"
  | "Fantasy"
  | "Adventure"
  | "Comedy"
  | "Mystery"
  | "School"
  | "Family"
  | "Birthday"
  | "Graduation"
  | "Custom";

export type RelationshipType =
  | "Someone Special"
  | "Best Friend"
  | "Family"
  | "Teacher"
  | "Classmate"
  | "Birthday"
  | "Graduation"
  | "Custom";

export type Language = "id" | "en" | "auto";
export type StoryStatus = "draft" | "published";

export interface Story {
  id: string;
  slug: string;
  title: string;
  story_type: StoryType;
  genre: string;
  relationship_type: string | null;
  language: Language;
  description: string | null;
  character_info: string | null;
  poster_prompt: string | null;
  cover_url: string | null;
  synopsis: string | null;
  status: StoryStatus;
  author_session_id: string;
  author_display_name: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export type PageType = "opening" | "content" | "closing";

export interface NovelPageContent {
  text: string;
}

export interface GiftBookPageContent {
  text: string;
  illustration_url?: string;
}

export interface ComicPanel {
  image_url: string;
  dialogue: string[];
  caption?: string;
}

export interface ComicPageContent {
  panels: ComicPanel[];
}

export type PageContent = NovelPageContent | GiftBookPageContent | ComicPageContent;

export interface StoryPage {
  id: string;
  story_id: string;
  page_index: number;
  page_type: PageType;
  title: string | null;
  content_json: PageContent;
  created_at: string;
}

export interface Comment {
  id: string;
  story_id: string;
  parent_comment_id: string | null;
  author_session_id: string;
  author_display_name: string;
  body: string;
  like_count: number;
  is_hidden: boolean;
  created_at: string;
}

export interface StoryFormData {
  title: string;
  story_type: StoryType;
  genre: string;
  language: Language;
  relationship_type: string;
  description: string;
  character_info: string;
  poster_prompt: string;
  comic_style?: "Manga" | "Anime Comic" | "Webtoon";
}
