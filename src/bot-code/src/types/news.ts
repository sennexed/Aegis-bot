/**
 * News Item & Source Data Models
 * Supports 13 world-famous news publications (exactly 1 article per newspaper)
 */

export interface NewsArticle {
  id: string;
  sourceId: string;
  sourceName: string;
  sourceFlag: string;
  sourceCountry: string;
  sourceColor: string;
  sourceBadge: string;
  title: string;
  description: string;
  link: string;
  publishedAt: string;
  author?: string;
  imageUrl?: string;
  category?: string;
}

export interface NewsSourceConfig {
  id: string;
  name: string;
  country: string;
  flag: string;
  primaryLanguage: string;
  website: string;
  brandColor: string;
  directRssUrl: string | null;
  googleNewsQuery: string;
  defaultCategory: string;
  fallbackHeadline: {
    title: string;
    description: string;
    link: string;
  };
}

export interface AutoNewsConfig {
  enabled: boolean;
  channelId: string | null;
  channelName: string;
  intervalHours: number;
  postMode: "ALL_13_DIGEST" | "INDIVIDUAL_EMBEDS";
  pingRole: "none" | "everyone" | "news_subscribers";
  lastDispatchedAt: string | null;
  totalBroadcastsSent: number;
  featuredSources: string[];
}
