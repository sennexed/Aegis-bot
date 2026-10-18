/**
 * /news Discord Slash Command
 * Allows server members and moderators to view or broadcast the 13 famous newspapers news briefing,
 * configure automated broadcasting, and check scheduler status.
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
  ChannelType,
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
    )
    .addSubcommand((sub) =>
      sub
        .setName("status")
        .setDescription("View automated news broadcasting schedule, targets, and status")
    )
    .addSubcommand((sub) =>
      sub
        .setName("configure")
        .setDescription("Configure automated news broadcasting for this server (Admins only)")
        .addChannelOption((opt) =>
          opt
            .setName("channel")
            .setDescription("The channel to receive scheduled news broadcasts")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(false)
        )
        .addIntegerOption((opt) =>
          opt
            .setName("interval_hours")
            .setDescription("Broadcast interval in hours (1 to 24)")
            .setMinValue(1)
            .setMaxValue(24)
            .setRequired(false)
        )
        .addBooleanOption((opt) =>
          opt
            .setName("enabled")
            .setDescription("Enable or disable automatic scheduled news broadcasts")
            .setRequired(false)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("config")
        .setDescription("View or configure automated news broadcasting for this server (Admins only)")
        .addChannelOption((opt) =>
          opt
            .setName("channel")
            .setDescription("The channel to receive scheduled news broadcasts")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(false)
        )
        .addIntegerOption((opt) =>
          opt
            .setName("interval_hours")
            .setDescription("Broadcast interval in hours (1 to 24)")
            .setMinValue(1)
            .setMaxValue(24)
            .setRequired(false)
        )
        .addBooleanOption((opt) =>
          opt
            .setName("enabled")
            .setDescription("Enable or disable automatic scheduled news broadcasts")
            .setRequired(false)
        )
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

      return interaction.editReply({
        content: "📰 **Automated Global News Digest Broadcast (Page 1 of 3 — 5 News Per Page)**",
        embeds: [embed],
        components: [paginationRow],
      });
    }

    if (subcommand === "status") {
      const config = autoNewsBotService.getConfig();
      const nextTime = config.lastDispatchedAt
        ? new Date(new Date(config.lastDispatchedAt).getTime() + config.intervalHours * 3600 * 1000).toLocaleString()
        : "Immediately pending next cycle";

      const embed = new EmbedBuilder()
        .setTitle("📰 AegisMod Auto-News Broadcaster Status")
        .setColor(config.enabled ? 0x57f287 : 0xed4245)
        .setDescription("Automated dispatching of daily world news from 13 premier international newspapers.")
        .addFields(
          {
            name: "Status",
            value: config.enabled ? "🟢 **Active & Scheduled**" : "🔴 **Paused / Disabled**",
            inline: true,
          },
          {
            name: "Interval",
            value: `Every **${config.intervalHours} hour(s)**`,
            inline: true,
          },
          {
            name: "Total Dispatched",
            value: `**${config.totalBroadcastsSent}** press digests`,
            inline: true,
          },
          {
            name: "Default Channel",
            value: config.channelId ? `<#${config.channelId}>` : `\`#${config.channelName}\``,
            inline: true,
          },
          {
            name: "Last Dispatched",
            value: config.lastDispatchedAt ? new Date(config.lastDispatchedAt).toLocaleString() : "*None recorded yet*",
            inline: true,
          },
          {
            name: "Next Scheduled Dispatch",
            value: config.enabled ? nextTime : "*Disabled*",
            inline: true,
          }
        )
        .setFooter({ text: "Use /news configure to change target channel or interval" })
        .setTimestamp();

      return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }

    if (subcommand === "configure" || subcommand === "config") {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
        return interaction.reply({
          content: "❌ You need `Manage Server` permission to configure auto-news broadcasting.",
          flags: MessageFlags.Ephemeral,
        });
      }

      const targetChannel = interaction.options.getChannel("channel");
      const interval = interaction.options.getInteger("interval_hours");
      const enabled = interaction.options.getBoolean("enabled");

      // If no options provided, display current configuration nicely
      if (!targetChannel && (interval === null || interval === undefined) && (enabled === null || enabled === undefined)) {
        const conf = autoNewsBotService.getConfig();
        const embed = new EmbedBuilder()
          .setTitle("⚙️ Auto-News Broadcaster Configuration")
          .setColor(conf.enabled ? 0x57f287 : 0xed4245)
          .setDescription("Current automated news broadcasting settings for this server.")
          .addFields(
            { name: "Broadcasting", value: conf.enabled ? "🟢 **Enabled**" : "🔴 **Disabled**", inline: true },
            { name: "Interval", value: `Every **${conf.intervalHours}** hour(s)`, inline: true },
            { name: "Target Channel", value: conf.channelId ? `<#${conf.channelId}>` : `\`#${conf.channelName}\``, inline: true }
          )
          .setFooter({ text: "To update, run /news config channel:#news interval_hours:4 enabled:true" })
          .setTimestamp();
        return interaction.reply({ embeds: [embed] });
      }

      const updates: any = {};
      if (targetChannel) {
        updates.channelId = targetChannel.id;
        updates.channelName = targetChannel.name;
        autoNewsBotService.registerChannel(targetChannel.id, targetChannel.name);
      }
      if (interval !== null && interval !== undefined) {
        updates.intervalHours = interval;
      }
      if (enabled !== null && enabled !== undefined) {
        updates.enabled = enabled;
      }

      autoNewsBotService.updateConfig(updates);
      const conf = autoNewsBotService.getConfig();

      const embed = new EmbedBuilder()
        .setTitle("⚙️ Auto-News Broadcaster Configured")
        .setColor(0x57f287)
        .setDescription("Successfully updated automated news broadcast settings. Persisted to disk across bot restarts.")
        .addFields(
          { name: "Broadcasting", value: conf.enabled ? "✅ Enabled" : "❌ Disabled", inline: true },
          { name: "Interval", value: `${conf.intervalHours} hours`, inline: true },
          { name: "Target Channel", value: conf.channelId ? `<#${conf.channelId}>` : "*Default channel*", inline: true }
        )
        .setFooter({ text: "Settings saved permanently to auto_news_config.json" })
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }
  },
};
