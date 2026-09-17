/**
 * Logging Service
 * Manages the dedicated #mod-logs channel and formats comprehensive audit records
 * for message deletions, edits, AI auto-mod flags, and traditional moderation commands.
 */

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  Guild,
  Message,
  PermissionFlagsBits,
  TextChannel,
  User,
} from "discord.js";
import { AIAnalysisOutput } from "./geminiModerationService.js";

export class LoggingService {
  private logChannelCache = new Map<string, string>(); // guildId -> channelId

  /**
   * Ensures a dedicated, secure #mod-logs channel exists with strict permissions.
   */
  public async ensureLogChannel(
    guild: Guild,
    staffRoleIds: string[] = []
  ): Promise<TextChannel> {
    const cachedId = this.logChannelCache.get(guild.id);
    if (cachedId) {
      const channel = guild.channels.cache.get(cachedId) as TextChannel;
      if (channel) return channel;
    }

    // Look for existing channel named mod-logs or moderation-logs
    const existing = guild.channels.cache.find(
      (c) =>
        c.type === ChannelType.GuildText &&
        (c.name === "mod-logs" || c.name === "aegis-logs" || c.name === "moderation-logs")
    ) as TextChannel | undefined;

    if (existing) {
      this.logChannelCache.set(guild.id, existing.id);
      return existing;
    }

    // Create permission overwrites: Hide from @everyone, allow bot and staff roles
    const permissionOverwrites: any[] = [
      {
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
      },
      {
        id: guild.client.user.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.EmbedLinks,
          PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.ReadMessageHistory,
        ],
      },
    ];

    for (const roleId of staffRoleIds) {
      if (roleId) {
        permissionOverwrites.push({
          id: roleId,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.ReadMessageHistory,
          ],
          deny: [PermissionFlagsBits.SendMessages],
        });
      }
    }

    // Auto-create channel
    const newChannel = await guild.channels.create({
      name: "mod-logs",
      type: ChannelType.GuildText,
      topic: "AegisMod Audit Log — Automated AI moderation actions, deletions, edits & staff records.",
      permissionOverwrites,
      reason: "Automatic setup of AegisMod dedicated moderation logging channel",
    });

    this.logChannelCache.set(guild.id, newChannel.id);

    // Post welcome embed
    const welcomeEmbed = new EmbedBuilder()
      .setTitle("🛡️ AegisMod Logging Channel Initialized")
      .setDescription(
        "This channel has been automatically created and configured. All moderation activities, deleted messages, edited messages, and AI detections will be logged here."
      )
      .setColor(0x5865f2)
      .addFields(
        { name: "Channel Privacy", value: "Locked: `@everyone` cannot view this channel.", inline: true },
        { name: "Target Community", value: "Strict Teen Safety (~16 y/o standards)", inline: true }
      )
      .setTimestamp();

    await newChannel.send({ embeds: [welcomeEmbed] });

    return newChannel;
  }

  /**
   * Dispatches log for an AI-driven automated moderation action
   */
  public async logAIAction(
    message: Message,
    aiResult: AIAnalysisOutput,
    actionTaken: string,
    options?: { requiresStaffNotification?: boolean; staffRoleIds?: string[] }
  ) {
    if (!message.guild) return;
    const logChannel = await this.ensureLogChannel(message.guild);

    const embed = new EmbedBuilder()
      .setTitle(`🤖 AI Moderation Action: ${actionTaken}`)
      .setColor(
        aiResult.severity === "CRITICAL"
          ? 0xed4245
          : aiResult.severity === "HIGH"
          ? 0xe67e22
          : 0xf1c40f
      )
      .setAuthor({
        name: `${message.author.tag} (${message.author.id})`,
        iconURL: message.author.displayAvatarURL(),
      })
      .addFields(
        { name: "Offending Content", value: `\`\`\`${message.content.slice(0, 1000)}\`\`\`` },
        { name: "Category", value: `\`${aiResult.category}\``, inline: true },
        { name: "Severity", value: `\`${aiResult.severity}\``, inline: true },
        { name: "Confidence", value: `${Math.round(aiResult.confidence * 100)}%`, inline: true },
        { name: "Channel", value: `<#${message.channel.id}>`, inline: true },
        { name: "Tokens Used", value: `${aiResult.tokensUsed} tokens`, inline: true },
        { name: "AI Reason", value: aiResult.reason }
      )
      .setFooter({ text: "AegisMod AI Engine • Powered by Gemini 3.8 Flash" })
      .setTimestamp();

    if (aiResult.highlightedPhrases.length > 0) {
      embed.addFields({
        name: "Flagged Substrings",
        value: aiResult.highlightedPhrases.map((p) => `\`${p}\``).join(", "),
      });
    }

    let contentAlert: string | undefined = undefined;
    if (options?.requiresStaffNotification) {
      const pingText = options.staffRoleIds && options.staffRoleIds.length > 0
        ? options.staffRoleIds.map((r) => `<@&${r}>`).join(" ")
        : "@here";
      contentAlert = `🚨 **CRITICAL YOUTH SAFETY ALERT:** Immediate staff review required! ${pingText}`;
    }

    // Interactive Discord Mod-Log Quick Action Buttons
    const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`quickmod:pardon:${message.author.id}:${message.id}`)
        .setLabel("Pardon / False Positive")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("🕊️"),
      new ButtonBuilder()
        .setCustomId(`quickmod:mute1h:${message.author.id}`)
        .setLabel("Mute 1h")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("⏳"),
      new ButtonBuilder()
        .setCustomId(`quickmod:mute24h:${message.author.id}`)
        .setLabel("Mute 24h")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("🔇"),
      new ButtonBuilder()
        .setCustomId(`quickmod:kick:${message.author.id}`)
        .setLabel("Kick")
        .setStyle(ButtonStyle.Danger)
        .setEmoji("👢"),
      new ButtonBuilder()
        .setCustomId(`quickmod:ban:${message.author.id}`)
        .setLabel("Ban")
        .setStyle(ButtonStyle.Danger)
        .setEmoji("🔨")
    );

    await logChannel.send({
      content: contentAlert,
      embeds: [embed],
      components: [actionRow],
    });
  }

  /**
   * Dispatches log for a user-submitted message report (Context Menu)
   */
  public async logUserReport(
    guild: Guild,
    reporter: User,
    reportedMessage: Message,
    reason: string
  ) {
    const logChannel = await this.ensureLogChannel(guild);

    const embed = new EmbedBuilder()
      .setTitle("🚩 User Report Submitted")
      .setColor(0xe67e22)
      .addFields(
        { name: "Reported Author", value: `${reportedMessage.author.tag} (<@${reportedMessage.author.id}>)`, inline: true },
        { name: "Reported By", value: `${reporter.tag} (<@${reporter.id}>)`, inline: true },
        { name: "Channel", value: `<#${reportedMessage.channel.id}>`, inline: true },
        { name: "User's Reason", value: reason || "No specific reason provided" },
        {
          name: "Message Content",
          value: reportedMessage.content ? `\`\`\`${reportedMessage.content.slice(0, 1000)}\`\`\`` : "*[Embed or Attachment]*",
        },
        { name: "Jump to Message", value: `[Click Here to View](${reportedMessage.url})` }
      )
      .setFooter({ text: `Message ID: ${reportedMessage.id}` })
      .setTimestamp();

    const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`report:dismiss:${reportedMessage.id}`)
        .setLabel("Dismiss Report")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`quickmod:mute1h:${reportedMessage.author.id}`)
        .setLabel("Mute Author 1h")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`report:delete:${reportedMessage.channel.id}:${reportedMessage.id}`)
        .setLabel("Delete Reported Message")
        .setStyle(ButtonStyle.Danger)
    );

    await logChannel.send({
      content: "⚠️ **NEW USER REPORT:** Please review flagged behavior.",
      embeds: [embed],
      components: [actionRow],
    });
  }

  /**
   * Dispatches log for a user punishment appeal
   */
  public async logAppealSubmission(
    guild: Guild,
    user: User,
    caseId: string,
    appealId: string,
    reason: string
  ) {
    const logChannel = await this.ensureLogChannel(guild);

    const embed = new EmbedBuilder()
      .setTitle("📬 Infraction Appeal Received")
      .setColor(0x3498db)
      .setThumbnail(user.displayAvatarURL())
      .addFields(
        { name: "Appealing User", value: `${user.tag} (<@${user.id}>)`, inline: true },
        { name: "Case ID", value: `\`${caseId}\``, inline: true },
        { name: "Appeal ID", value: `\`${appealId}\``, inline: true },
        { name: "User's Explanation", value: reason }
      )
      .setFooter({ text: "Use buttons below to review and resolve appeal" })
      .setTimestamp();

    const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`appeal:accept:${appealId}:${user.id}`)
        .setLabel("Approve Appeal (Unmute)")
        .setStyle(ButtonStyle.Success)
        .setEmoji("✅"),
      new ButtonBuilder()
        .setCustomId(`appeal:deny:${appealId}:${user.id}`)
        .setLabel("Deny Appeal")
        .setStyle(ButtonStyle.Danger)
        .setEmoji("❌")
    );

    await logChannel.send({
      embeds: [embed],
      components: [actionRow],
    });
  }

  /**
   * Dispatches log for a deleted message
   */
  public async logMessageDelete(message: Message) {
    if (!message.guild || message.author.bot) return;
    const logChannel = await this.ensureLogChannel(message.guild);

    const embed = new EmbedBuilder()
      .setTitle("🗑️ Message Deleted")
      .setColor(0xe74c3c)
      .setAuthor({
        name: `${message.author.tag} (${message.author.id})`,
        iconURL: message.author.displayAvatarURL(),
      })
      .addFields(
        { name: "Author", value: `<@${message.author.id}>`, inline: true },
        { name: "Channel", value: `<#${message.channel.id}>`, inline: true },
        {
          name: "Original Content",
          value: message.content ? `\`\`\`${message.content.slice(0, 1000)}\`\`\`` : "*[No text content or embed/attachment]*",
        }
      )
      .setFooter({ text: `Message ID: ${message.id}` })
      .setTimestamp();

    await logChannel.send({ embeds: [embed] });
  }

  /**
   * Dispatches log for an edited message
   */
  public async logMessageEdit(oldMessage: Message, newMessage: Message) {
    if (!oldMessage.guild || oldMessage.author.bot) return;
    if (oldMessage.content === newMessage.content) return; // ignore embed loads

    const logChannel = await this.ensureLogChannel(oldMessage.guild);

    const embed = new EmbedBuilder()
      .setTitle("✏️ Message Edited")
      .setColor(0xf39c12)
      .setAuthor({
        name: `${oldMessage.author.tag} (${oldMessage.author.id})`,
        iconURL: oldMessage.author.displayAvatarURL(),
      })
      .addFields(
        { name: "Author", value: `<@${oldMessage.author.id}>`, inline: true },
        { name: "Channel", value: `<#${oldMessage.channel.id}>`, inline: true },
        { name: "Jump To Message", value: `[Click Here](${newMessage.url})`, inline: true },
        { name: "Before", value: `\`\`\`${(oldMessage.content || "*[empty]*").slice(0, 500)}\`\`\`` },
        { name: "After", value: `\`\`\`${(newMessage.content || "*[empty]*").slice(0, 500)}\`\`\`` }
      )
      .setFooter({ text: `Message ID: ${newMessage.id}` })
      .setTimestamp();

    await logChannel.send({ embeds: [embed] });
  }

  /**
   * Dispatches log for traditional moderation commands (ban, kick, mute, warn)
   */
  public async logTraditionalModAction(
    guild: Guild,
    target: User,
    moderator: User,
    action: "BAN" | "KICK" | "MUTE" | "WARN" | "UNMUTE",
    reason: string,
    durationFormatted?: string
  ) {
    const logChannel = await this.ensureLogChannel(guild);

    const colors = {
      BAN: 0xed4245,
      KICK: 0xe67e22,
      MUTE: 0x9b59b6,
      WARN: 0xf1c40f,
      UNMUTE: 0x2ecc71,
    };

    const embed = new EmbedBuilder()
      .setTitle(`🔨 Moderation Action: ${action}`)
      .setColor(colors[action] || 0x95a5a6)
      .setThumbnail(target.displayAvatarURL())
      .addFields(
        { name: "Target User", value: `${target.tag} (<@${target.id}>)`, inline: true },
        { name: "Moderator", value: `${moderator.tag} (<@${moderator.id}>)`, inline: true },
        { name: "Reason", value: reason || "No reason specified" }
      )
      .setTimestamp();

    if (durationFormatted) {
      embed.addFields({ name: "Duration", value: durationFormatted, inline: true });
    }

    await logChannel.send({ embeds: [embed] });
  }
}
