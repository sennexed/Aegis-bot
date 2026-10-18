/**
 * Discord Bot AutoNews Service
 * Manages automated dispatching of world news from the 13 famous newspapers into Discord channels.
 * Features persistent disk storage and an active background scheduler that auto-broadcasts
 * at configured intervals.
 */

import fs from "fs";
import path from "path";
import {
  Client,
  EmbedBuilder,
  TextChannel,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { NewsArticle } from "../types/news.js";
import { newsService } from "./newsService.js";
import { getPersistentDataDir } from "../utils/storagePath.js";

export interface AutoNewsConfig {
  enabled: boolean;
  channelId: string;
  channelName: string;
  targetChannels: string[]; // List of channel IDs across servers
  intervalHours: number;
  lastDispatchedAt: string | null;
  totalBroadcastsSent: number;
}

export class AutoNewsBotService {
  private static instance: AutoNewsBotService;
  private client: Client | null = null;
  private timer: NodeJS.Timeout | null = null;
  private storageFilePath: string;
  private isSaving = false;
  private needsSave = false;

  private config: AutoNewsConfig = {
    enabled: true,
    channelId: "124892849204918299", // Defaults to configured #world-news or #announcements
    channelName: "world-news",
    targetChannels: ["124892849204918299"],
    intervalHours: 6,
    lastDispatchedAt: null,
    totalBroadcastsSent: 42,
  };

  constructor(customStorageDir?: string) {
    const dataDir = customStorageDir || getPersistentDataDir();
    this.storageFilePath = path.join(dataDir, "auto_news_config.json");
    this.loadFromDisk();
  }

  public static getInstance(): AutoNewsBotService {
    if (!AutoNewsBotService.instance) {
      AutoNewsBotService.instance = new AutoNewsBotService();
    }
    return AutoNewsBotService.instance;
  }

  private loadFromDisk(): void {
    try {
      if (fs.existsSync(this.storageFilePath)) {
        const raw = fs.readFileSync(this.storageFilePath, "utf8");
        if (raw && raw.trim()) {
          const parsed = JSON.parse(raw);
          this.config = { ...this.config, ...parsed };
          if (!Array.isArray(this.config.targetChannels)) {
            this.config.targetChannels = [this.config.channelId].filter(Boolean);
          }
          console.log(`[AutoNews] 💾 Loaded auto-news config (interval: ${this.config.intervalHours}h, enabled: ${this.config.enabled}, broadcasts: ${this.config.totalBroadcastsSent})`);
        }
      }
    } catch (err) {
      console.warn("[AutoNews] Warning: Could not load auto_news_config.json:", err);
    }
  }

  private persistToDisk(): void {
    try {
      const dir = path.dirname(this.storageFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(this.storageFilePath, JSON.stringify(this.config, null, 2), "utf8");
    } catch (err) {
      console.error("[AutoNews] Failed to persist auto_news_config.json:", err);
    }
  }

  public setClient(client: Client) {
    this.client = client;
  }

  public getConfig(): AutoNewsConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<AutoNewsConfig>) {
    this.config = { ...this.config, ...newConfig };
    if (newConfig.channelId && !this.config.targetChannels.includes(newConfig.channelId)) {
      this.config.targetChannels.push(newConfig.channelId);
    }
    this.persistToDisk();
  }

  public registerChannel(channelId: string, channelName?: string) {
    if (!this.config.targetChannels.includes(channelId)) {
      this.config.targetChannels.push(channelId);
    }
    this.config.channelId = channelId;
    if (channelName) {
      this.config.channelName = channelName;
    }
    this.persistToDisk();
  }

  public removeChannel(channelId: string) {
    this.config.targetChannels = this.config.targetChannels.filter((id) => id !== channelId);
    if (this.config.channelId === channelId) {
      this.config.channelId = this.config.targetChannels[0] || "";
    }
    this.persistToDisk();
  }

  /**
   * Starts the background scheduler that periodically checks and auto-broadcasts
   * the 13 newspapers digest.
   */
  public startScheduler(client?: Client) {
    if (client) {
      this.client = client;
    }

    if (this.timer) {
      clearInterval(this.timer);
    }

    console.log(`[AutoNews Scheduler] 🚀 Starting automated news broadcasting scheduler (Interval: ${this.config.intervalHours}h)...`);

    // Check interval every 60 seconds
    this.timer = setInterval(async () => {
      await this.checkAndAutoBroadcast();
    }, 60 * 1000);

    if (typeof this.timer.unref === "function") {
      this.timer.unref();
    }

    // Run initial check after 10 seconds of startup
    setTimeout(async () => {
      await this.checkAndAutoBroadcast();
    }, 10 * 1000);
  }

  private async checkAndAutoBroadcast() {
    if (!this.config.enabled) return;

    const intervalMs = this.config.intervalHours * 3600 * 1000;
    const now = Date.now();
    const lastDispatched = this.config.lastDispatchedAt ? new Date(this.config.lastDispatchedAt).getTime() : 0;

    if (now - lastDispatched >= intervalMs) {
      console.log("[AutoNews Scheduler] ⏰ Scheduled interval reached. Broadcasting news digest now...");
      await this.broadcastToAllTargets();
    }
  }

  public async broadcastToAllTargets(): Promise<{ totalDispatched: number; errors: string[] }> {
    const errors: string[] = [];
    let dispatched = 0;

    if (!this.client) {
      return { totalDispatched: 0, errors: ["Client not initialized"] };
    }

    try {
      const articles = await newsService.fetchAll13Newspapers(true);
      const totalPages = Math.ceil(articles.length / 5);
      const embed = this.create13NewspapersDigestEmbed(articles, 1, 5);
      const paginationRow = this.createPaginationRow(1, totalPages);

      // Identify target channels
      const targetIds = new Set<string>(this.config.targetChannels.filter(Boolean));

      // Also auto-discover any text channel named "world-news", "news", or "daily-news" in joined guilds
      for (const [, guild] of this.client.guilds.cache) {
        let foundInGuild = false;
        for (const tid of targetIds) {
          if (guild.channels.cache.has(tid)) {
            foundInGuild = true;
            break;
          }
        }
        if (!foundInGuild) {
          const autoChan = guild.channels.cache.find(
            (c) => c.isTextBased() && (c.name.includes("world-news") || c.name === "news")
          );
          if (autoChan) {
            targetIds.add(autoChan.id);
          }
        }
      }

      for (const chanId of targetIds) {
        try {
          const channel = await this.client.channels.fetch(chanId).catch(() => null);
          if (channel && channel.isTextBased()) {
            await (channel as TextChannel).send({
              content: "📰 **Automated Global News Digest Broadcast (Page 1 of 3 — 5 News Per Page)**",
              embeds: [embed],
              components: [paginationRow],
            });
            dispatched++;
          }
        } catch (err: any) {
          errors.push(`Failed to send to channel ${chanId}: ${err?.message || err}`);
        }
      }

      this.config.lastDispatchedAt = new Date().toISOString();
      this.config.totalBroadcastsSent += Math.max(1, dispatched);
      this.persistToDisk();

      console.log(`[AutoNews Scheduler] ✅ Successfully auto-broadcasted to ${dispatched} channel(s).`);
      return { totalDispatched: dispatched, errors };
    } catch (err: any) {
      console.error("[AutoNews Scheduler] ❌ Broadcast failed:", err);
      return { totalDispatched: 0, errors: [err?.message || "Unknown error"] };
    }
  }

  public create13NewspapersDigestEmbed(
    articles: NewsArticle[],
    page: number = 1,
    pageSize: number = 5
  ): EmbedBuilder {
    const totalPages = Math.ceil(articles.length / pageSize) || 1;
    const safePage = Math.min(Math.max(1, page), totalPages);
    const startIndex = (safePage - 1) * pageSize;
    const pageArticles = articles.slice(startIndex, startIndex + pageSize);

    const embed = new EmbedBuilder()
      .setTitle("🌐 World Press Digest — Top 13 International Newspapers")
      .setDescription(
        `Automated multi-perspective press briefing. Showing **${pageArticles.length} of ${articles.length} news articles** (Page **${safePage}** of **${totalPages}**, 5 news per page).\nExactly **one top article** selected directly from each world-famous newspaper.`
      )
      .setColor(0x1e3a8a)
      .setTimestamp()
      .setFooter({
        text: `Page ${safePage} of ${totalPages} • AegisMod Global News • 13 Publications (5 news per page)`,
      });

    // Add field for each newspaper in this page (5 items)
    pageArticles.forEach((article, idx) => {
      const displayTitle = article.title.length > 90 ? article.title.slice(0, 87) + "..." : article.title;
      const rankNum = startIndex + idx + 1;
      embed.addFields({
        name: `#${rankNum} ${article.sourceFlag} ${article.sourceName} (${article.sourceCountry})`,
        value: `[**${displayTitle}**](${article.link})\n*${article.description.slice(0, 120)}...*`,
        inline: false,
      });
    });

    return embed;
  }

  public createPaginationRow(
    currentPage: number = 1,
    totalPages: number = 3
  ): ActionRowBuilder<ButtonBuilder> {
    const safePage = Math.min(Math.max(1, currentPage), totalPages);

    const prevBtn = new ButtonBuilder()
      .setCustomId(`news:page:${safePage - 1}`)
      .setLabel("◀ Previous (5)")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(safePage <= 1);

    const pageIndicatorBtn = new ButtonBuilder()
      .setCustomId("news:noop")
      .setLabel(`Page ${safePage}/${totalPages}`)
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true);

    const nextBtn = new ButtonBuilder()
      .setCustomId(`news:page:${safePage + 1}`)
      .setLabel("Next (5) ▶")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(safePage >= totalPages);

    const refreshBtn = new ButtonBuilder()
      .setCustomId("news:refresh")
      .setLabel("Refresh")
      .setStyle(ButtonStyle.Success)
      .setEmoji("🔄");

    return new ActionRowBuilder<ButtonBuilder>().addComponents(
      prevBtn,
      pageIndicatorBtn,
      nextBtn,
      refreshBtn
    );
  }

  public async broadcastToChannel(channelId: string): Promise<{ success: boolean; error?: string; articlesCount: number }> {
    try {
      const articles = await newsService.fetchAll13Newspapers(true);

      if (this.client) {
        const channel = await this.client.channels.fetch(channelId).catch(() => null);
        if (channel && channel.isTextBased()) {
          const totalPages = Math.ceil(articles.length / 5);
          const embed = this.create13NewspapersDigestEmbed(articles, 1, 5);
          const paginationRow = this.createPaginationRow(1, totalPages);
          await (channel as TextChannel).send({
            content: "📰 **Automated Global News Digest Broadcast (Page 1 of 3 — 5 News Per Page)**",
            embeds: [embed],
            components: [paginationRow],
          });
        }
      }

      this.config.lastDispatchedAt = new Date().toISOString();
      this.config.totalBroadcastsSent++;
      this.persistToDisk();

      return {
        success: true,
        articlesCount: articles.length,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || "Failed to broadcast news to Discord",
        articlesCount: 0,
      };
    }
  }
}

export const autoNewsBotService = AutoNewsBotService.getInstance();
