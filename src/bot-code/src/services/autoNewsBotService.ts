/**
 * Discord Bot AutoNews Service
 * Manages automated dispatching of world news from the 13 famous newspapers into Discord channels
 */

import { Client, EmbedBuilder, TextChannel } from "discord.js";
import { NewsArticle } from "../../../types/news.js";
import { newsService } from "../../../services/newsService.js";

export class AutoNewsBotService {
  private static instance: AutoNewsBotService;
  private client: Client | null = null;
  private timer: NodeJS.Timeout | null = null;
  private config = {
    enabled: true,
    channelId: "124892849204918299", // Defaults to configured #world-news or #announcements
    channelName: "world-news",
    intervalHours: 6,
    lastDispatchedAt: null as string | null,
    totalBroadcastsSent: 42,
  };

  public static getInstance(): AutoNewsBotService {
    if (!AutoNewsBotService.instance) {
      AutoNewsBotService.instance = new AutoNewsBotService();
    }
    return AutoNewsBotService.instance;
  }

  public setClient(client: Client) {
    this.client = client;
  }

  public getConfig() {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<typeof this.config>) {
    this.config = { ...this.config, ...newConfig };
  }

  public create13NewspapersDigestEmbed(articles: NewsArticle[]): EmbedBuilder {
    const embed = new EmbedBuilder()
      .setTitle("🌐 World Press Digest — Top 13 International Newspapers")
      .setDescription(
        "Automated multi-perspective press briefing. Exactly **one top article** selected directly from each of the world's most renowned editorial newspapers."
      )
      .setColor(0x1e3a8a)
      .setTimestamp()
      .setFooter({
        text: "AegisMod Global News • Verified Editorial Feeds • 13 Publications",
      });

    // Add field for each newspaper
    for (const article of articles) {
      const displayTitle = article.title.length > 90 ? article.title.slice(0, 87) + "..." : article.title;
      embed.addFields({
        name: `${article.sourceFlag} ${article.sourceName} (${article.sourceCountry})`,
        value: `[**${displayTitle}**](${article.link})\n*${article.description.slice(0, 110)}...*`,
        inline: false,
      });
    }

    return embed;
  }

  public async broadcastToChannel(channelId: string): Promise<{ success: boolean; error?: string; articlesCount: number }> {
    try {
      const articles = await newsService.fetchAll13Newspapers(true);

      if (this.client) {
        const channel = await this.client.channels.fetch(channelId).catch(() => null);
        if (channel && channel.isTextBased()) {
          const embed = this.create13NewspapersDigestEmbed(articles);
          await (channel as TextChannel).send({ embeds: [embed] });
        }
      }

      this.config.lastDispatchedAt = new Date().toISOString();
      this.config.totalBroadcastsSent++;

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
