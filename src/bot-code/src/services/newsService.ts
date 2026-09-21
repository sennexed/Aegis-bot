/**
 * News Fetcher Service
 * Responsible for retrieving exactly 1 live article from each of the 13 specified famous newspapers.
 * Direct RSS with Google News RSS query fallback and high-reliability sanitization.
 */

import { NewsArticle, NewsSourceConfig } from "../types/news.js";
import { FAMOUS_NEWS_SOURCES } from "../data/newsSources.js";

export class NewsService {
  private static instance: NewsService;
  private cache: { articles: NewsArticle[]; timestamp: number } | null = null;
  private readonly CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes cache

  public static getInstance(): NewsService {
    if (!NewsService.instance) {
      NewsService.instance = new NewsService();
    }
    return NewsService.instance;
  }

  private cleanHtmlEntities(str: string): string {
    return str
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&#8217;/g, "’")
      .replace(/&#8216;/g, "‘")
      .replace(/&#8220;/g, "“")
      .replace(/&#8221;/g, "”")
      .replace(/&#8212;/g, "—")
      .replace(/&#8211;/g, "–")
      .replace(/&nbsp;/g, " ")
      .replace(/<[^>]+>/g, "")
      .trim();
  }

  private parseFirstRssItem(xml: string, source: NewsSourceConfig): NewsArticle | null {
    if (!xml) return null;

    // Find the first <item> or <entry>
    const itemMatch = xml.match(/<item[\s\S]*?<\/item>/i) || xml.match(/<entry[\s\S]*?<\/entry>/i);
    if (!itemMatch) return null;
    const itemXml = itemMatch[0];

    // Extract Title
    const titleMatch = itemXml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    let title = titleMatch ? this.cleanHtmlEntities(titleMatch[1]) : "";
    if (title.endsWith(` - ${source.name}`)) {
      title = title.slice(0, -(source.name.length + 3)).trim();
    }

    // Extract Link
    let link = "";
    const linkTagMatch = itemXml.match(/<link[^>]*href=["']([^"']+)["']/i);
    if (linkTagMatch) {
      link = linkTagMatch[1];
    } else {
      const linkMatch = itemXml.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
      link = linkMatch ? linkMatch[1].trim() : source.website;
    }

    // Extract Description / Snippet
    const descMatch =
      itemXml.match(/<description[^>]*>([\s\S]*?)<\/description>/i) ||
      itemXml.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i);
    let description = descMatch ? this.cleanHtmlEntities(descMatch[1]) : "";
    if (description.length > 250) {
      description = description.slice(0, 247) + "...";
    }

    // Extract PubDate
    const dateMatch =
      itemXml.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i) ||
      itemXml.match(/<published[^>]*>([\s\S]*?)<\/published>/i) ||
      itemXml.match(/<updated[^>]*>([\s\S]*?)<\/updated>/i);
    let publishedAt = new Date().toISOString();
    if (dateMatch) {
      const parsed = Date.parse(dateMatch[1]);
      if (!isNaN(parsed)) {
        publishedAt = new Date(parsed).toISOString();
      }
    }

    if (!title) return null;

    return {
      id: `${source.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sourceId: source.id,
      sourceName: source.name,
      sourceFlag: source.flag,
      sourceCountry: source.country,
      sourceColor: source.brandColor,
      sourceBadge: `${source.flag} ${source.name}`,
      title,
      description: description || source.fallbackHeadline.description,
      link: link || source.website,
      publishedAt,
      category: source.defaultCategory,
    };
  }

  private async fetchXmlWithTimeout(url: string, timeoutMs = 3500): Promise<string | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 AegisMod/1.0",
          Accept: "application/rss+xml, application/xml, text/xml, */*",
        },
      });
      clearTimeout(timeout);
      if (response.ok) {
        return await response.text();
      }
      return null;
    } catch {
      clearTimeout(timeout);
      return null;
    }
  }

  public async fetchOneFromSource(source: NewsSourceConfig): Promise<NewsArticle> {
    // 1. Try Direct RSS Feed if available
    if (source.directRssUrl) {
      try {
        const directXml = await this.fetchXmlWithTimeout(source.directRssUrl, 3000);
        if (directXml) {
          const article = this.parseFirstRssItem(directXml, source);
          if (article) return article;
        }
      } catch {
        // Fall through to Google News RSS
      }
    }

    // 2. Try Google News RSS targeted search query
    try {
      const googleNewsUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(
        source.googleNewsQuery
      )}&hl=en-US&gl=US&ceid=US:en`;
      const googleXml = await this.fetchXmlWithTimeout(googleNewsUrl, 3500);
      if (googleXml) {
        const article = this.parseFirstRssItem(googleXml, source);
        if (article) return article;
      }
    } catch {
      // Fall through to fallback headline
    }

    // 3. Resilient Fallback Headline
    return {
      id: `${source.id}-fallback-${Date.now()}`,
      sourceId: source.id,
      sourceName: source.name,
      sourceFlag: source.flag,
      sourceCountry: source.country,
      sourceColor: source.brandColor,
      sourceBadge: `${source.flag} ${source.name}`,
      title: source.fallbackHeadline.title,
      description: source.fallbackHeadline.description,
      link: source.fallbackHeadline.link,
      publishedAt: new Date().toISOString(),
      category: source.defaultCategory,
    };
  }

  /**
   * Fetches exactly 1 article from each of the 13 famous newspapers in parallel
   */
  public async fetchAll13Newspapers(forceRefresh = false): Promise<NewsArticle[]> {
    const now = Date.now();
    if (!forceRefresh && this.cache && now - this.cache.timestamp < this.CACHE_TTL_MS) {
      return this.cache.articles;
    }

    // Fetch all 13 sources in parallel
    const promises = FAMOUS_NEWS_SOURCES.map((source: NewsSourceConfig) => this.fetchOneFromSource(source));
    const articles = await Promise.all(promises);

    this.cache = {
      articles,
      timestamp: now,
    };

    return articles;
  }
}

export const newsService = NewsService.getInstance();
