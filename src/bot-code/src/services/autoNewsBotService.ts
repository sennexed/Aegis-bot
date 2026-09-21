/**
 * Discord Bot AutoNews Service
 * Manages automated dispatching of world news from the 13 famous newspapers into Discord channels
 */

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
            embeds: [embed],
            components: [paginationRow],
          });
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
