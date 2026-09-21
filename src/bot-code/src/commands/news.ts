/**
 * /news Discord Slash Command
 * Allows server members and moderators to view or broadcast the 13 famous newspapers news briefing
 */

import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} from "discord.js";
import { newsService } from "../services/newsService.js";
import { autoNewsBotService } from "../services/autoNewsBotService.js";

export const newsCommand = {
  data: new SlashCommandBuilder()
    .setName("news")
    .setDescription("Fetch or broadcast the latest headline from the 13 top world newspapers")
    .addSubcommand((sub) =>
      sub
        .setName("digest")
        .setDescription("View today's top article from each of the 13 famous international newspapers")
    )
    .addSubcommand((sub) =>
      sub
        .setName("source")
        .setDescription("View the latest headline from a specific famous newspaper")
        .addStringOption((opt) =>
          opt
            .setName("paper")
            .setDescription("Select a famous newspaper")
            .setRequired(true)
            .addChoices(
              { name: "BBC (UK)", value: "bbc" },
              { name: "The New York Times (US)", value: "nyt" },
              { name: "The Wall Street Journal (US)", value: "wsj" },
              { name: "The Guardian (UK)", value: "guardian" },
              { name: "The Washington Post (US)", value: "wapo" },
              { name: "The Times of India (India)", value: "toi" },
              { name: "The Yomiuri Shimbun (Japan)", value: "yomiuri" },
              { name: "Le Monde (France)", value: "lemonde" },
              { name: "Financial Times (UK/Global)", value: "ft" },
              { name: "The Asahi Shimbun (Japan)", value: "asahi" },
              { name: "El País (Spain)", value: "elpais" },
              { name: "Daily Mail (UK)", value: "dailymail" },
              { name: "The Daily Telegraph (UK)", value: "telegraph" }
            )
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("broadcast")
        .setDescription("Broadcast the 13-newspaper digest to the current channel (Moderators only)")
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "digest") {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const articles = await newsService.fetchAll13Newspapers();
      const totalPages = Math.ceil(articles.length / 5);
      const embed = autoNewsBotService.create13NewspapersDigestEmbed(articles, 1, 5);
      const paginationRow = autoNewsBotService.createPaginationRow(1, totalPages);

      return interaction.editReply({
        embeds: [embed],
        components: [paginationRow],
      });
    }

    if (subcommand === "source") {
      await interaction.deferReply();
      const paperKey = interaction.options.getString("paper", true);
      const articles = await newsService.fetchAll13Newspapers();
      const article = articles.find((a) => a.sourceId === paperKey) || articles[0];

      const embed = new EmbedBuilder()
        .setTitle(`${article.sourceFlag} ${article.sourceName} — Top Story`)
        .setDescription(`**[${article.title}](${article.link})**\n\n${article.description}`)
        .setColor(0x2563eb)
        .addFields(
          { name: "Country", value: article.sourceCountry, inline: true },
          { name: "Category", value: article.category || "General", inline: true },
          { name: "Published", value: article.publishedAt, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: "AegisMod Interactive News Feed" });

      if (article.imageUrl) {
        embed.setImage(article.imageUrl);
      }

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel(`Read on ${article.sourceName}`)
          .setStyle(ButtonStyle.Link)
          .setURL(article.link)
      );

      return interaction.editReply({
        embeds: [embed],
        components: [row],
      });
    }

    if (subcommand === "broadcast") {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages)) {
        return interaction.reply({
          content: "❌ You need `Manage Messages` permission to broadcast news to the server.",
          flags: MessageFlags.Ephemeral,
        });
      }

      await interaction.deferReply();
      const articles = await newsService.fetchAll13Newspapers(true);
      const totalPages = Math.ceil(articles.length / 5);
      const embed = autoNewsBotService.create13NewspapersDigestEmbed(articles, 1, 5);
      const paginationRow = autoNewsBotService.createPaginationRow(1, totalPages);

      await interaction.editReply({
        content: "📰 **Automated Global News Digest Broadcast (Page 1 of 3 — 5 News Per Page)**",
        embeds: [embed],
        components: [paginationRow],
      });
    }
  },
};
