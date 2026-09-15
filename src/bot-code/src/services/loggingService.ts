/**
 * Logging Service
 * Manages the dedicated #mod-logs channel and formats comprehensive audit records
 * for message deletions, edits, AI auto-mod flags, and traditional moderation commands.
 */

import {
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
    actionTaken: string
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

    await logChannel.send({ embeds: [embed] });
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
