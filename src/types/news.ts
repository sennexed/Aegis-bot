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

export const FAMOUS_NEWS_SOURCES: NewsSourceConfig[] = [
  {
    id: "nyt",
    name: "The New York Times",
    country: "United States",
    flag: "🇺🇸",
    primaryLanguage: "English",
    website: "https://www.nytimes.com",
    brandColor: "#000000",
    directRssUrl: "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml",
    googleNewsQuery: "site:nytimes.com when:24h",
    defaultCategory: "World & General",
    fallbackHeadline: {
      title: "Global Markets Update and Economic Outlook",
      description: "Markets reflect ongoing shifts in international trade policies and technological growth.",
      link: "https://www.nytimes.com",
    },
  },
  {
    id: "bbc",
    name: "BBC News",
    country: "United Kingdom",
    flag: "🇬🇧",
    primaryLanguage: "English",
    website: "https://www.bbc.com/news",
    brandColor: "#bb191c",
    directRssUrl: "http://feeds.bbci.co.uk/news/rss.xml",
    googleNewsQuery: "site:bbc.com/news when:24h",
    defaultCategory: "International",
    fallbackHeadline: {
      title: "International Diplomacy Talks Resume in Geneva",
      description: "Delegates gather to discuss multilateral cooperation and global security frameworks.",
      link: "https://www.bbc.com/news",
    },
  },
  {
    id: "techcrunch",
    name: "TechCrunch",
    country: "United States",
    flag: "🇺🇸",
    primaryLanguage: "English",
    website: "https://techcrunch.com",
    brandColor: "#002366",
    directRssUrl: "https://techcrunch.com/feed/",
    googleNewsQuery: "site:techcrunch.com when:24h",
    defaultCategory: "Technology",
    fallbackHeadline: {
      title: "AI Breakthroughs Redefine Enterprise Software Architecture",
      description: "New multimodal models showcase dramatic efficiency gains in distributed computing clusters.",
      link: "https://techcrunch.com",
    },
  },
];
