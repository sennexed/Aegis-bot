/**
 * Traditional Moderation Commands
 * Slash commands: /ban, /kick, /mute, /warn, /cases
 */

import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  GuildMember,
} from "discord.js";
import { TraditionalModService } from "../services/traditionalModService.js";

export const moderationCommands = [
  // 1. /ban command
  {
    data: new SlashCommandBuilder()
      .setName("ban")
      .setDescription("Ban a user from the server with audit logging")
      .addUserOption((opt) => opt.setName("target").setDescription("Member to ban").setRequired(true))
      .addStringOption((opt) => opt.setName("reason").setDescription("Reason for ban").setRequired(true))
      .addIntegerOption((opt) =>
        opt
          .setName("prune_days")
          .setDescription("Days of message history to delete (0 to 7)")
          .setMinValue(0)
          .setMaxValue(7)
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction: ChatInputCommandInteraction, modService: TraditionalModService) {
      const targetUser = interaction.options.getUser("target", true);
      const reason = interaction.options.getString("reason", true);
      const pruneDays = interaction.options.getInteger("prune_days") ?? 1;

      const targetMember = interaction.guild?.members.cache.get(targetUser.id);
      if (!targetMember) {
        return interaction.reply({ content: "That user is not currently in this server.", ephemeral: true });
      }

      await interaction.deferReply();
      const result = await modService.ban(
        interaction.member as GuildMember,
        targetMember,
        reason,
        pruneDays
      );

      if (!result.success) {
        return interaction.editReply({ content: `❌ Ban failed: ${result.error}` });
      }

      return interaction.editReply({
        content: `🔨 **${targetUser.tag}** has been banned.\n**Reason:** ${reason}`,
      });
    },
  },

  // 2. /kick command
  {
    data: new SlashCommandBuilder()
      .setName("kick")
      .setDescription("Kick a user from the server")
      .addUserOption((opt) => opt.setName("target").setDescription("Member to kick").setRequired(true))
      .addStringOption((opt) => opt.setName("reason").setDescription("Reason for kick").setRequired(true))
      .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    async execute(interaction: ChatInputCommandInteraction, modService: TraditionalModService) {
      const targetUser = interaction.options.getUser("target", true);
      const reason = interaction.options.getString("reason", true);

      const targetMember = interaction.guild?.members.cache.get(targetUser.id);
      if (!targetMember) {
        return interaction.reply({ content: "That user is not currently in this server.", ephemeral: true });
      }

      await interaction.deferReply();
      const result = await modService.kick(interaction.member as GuildMember, targetMember, reason);

      if (!result.success) {
        return interaction.editReply({ content: `❌ Kick failed: ${result.error}` });
      }

      return interaction.editReply({
        content: `👢 **${targetUser.tag}** has been kicked.\n**Reason:** ${reason}`,
      });
    },
  },

  // 3. /mute (timeout) command
  {
    data: new SlashCommandBuilder()
      .setName("mute")
      .setDescription("Mute (timeout) a user for a specific duration")
      .addUserOption((opt) => opt.setName("target").setDescription("Member to mute").setRequired(true))
      .addStringOption((opt) =>
        opt
          .setName("duration")
          .setDescription("Duration format: 10m, 1h, 1d, 7d")
          .setRequired(true)
      )
      .addStringOption((opt) => opt.setName("reason").setDescription("Reason for mute").setRequired(true))
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction: ChatInputCommandInteraction, modService: TraditionalModService) {
      const targetUser = interaction.options.getUser("target", true);
      const durationStr = interaction.options.getString("duration", true);
      const reason = interaction.options.getString("reason", true);

      const durationMs = modService.parseDurationString(durationStr);
      if (!durationMs) {
        return interaction.reply({
          content: "Invalid duration format. Use: `10m` (minutes), `2h` (hours), `1d` (days).",
          ephemeral: true,
        });
      }

      const targetMember = interaction.guild?.members.cache.get(targetUser.id);
      if (!targetMember) {
        return interaction.reply({ content: "That user is not currently in this server.", ephemeral: true });
      }

      await interaction.deferReply();
      const result = await modService.mute(
        interaction.member as GuildMember,
        targetMember,
        durationMs,
        reason
      );

      if (!result.success) {
        return interaction.editReply({ content: `❌ Mute failed: ${result.error}` });
      }

      return interaction.editReply({
        content: `🔇 **${targetUser.tag}** has been muted for **${modService.formatDuration(durationMs)}**.\n**Reason:** ${reason}`,
      });
    },
  },

  // 4. /warn command
  {
    data: new SlashCommandBuilder()
      .setName("warn")
      .setDescription("Issue an official logged warning to a member")
      .addUserOption((opt) => opt.setName("target").setDescription("Member to warn").setRequired(true))
      .addStringOption((opt) => opt.setName("reason").setDescription("Reason for warning").setRequired(true))
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction: ChatInputCommandInteraction, modService: TraditionalModService) {
      const targetUser = interaction.options.getUser("target", true);
      const reason = interaction.options.getString("reason", true);

      const targetMember = interaction.guild?.members.cache.get(targetUser.id);
      if (!targetMember) {
        return interaction.reply({ content: "That user is not currently in this server.", ephemeral: true });
      }

      await interaction.deferReply();
      const result = await modService.warn(interaction.member as GuildMember, targetMember, reason);

      if (!result.success) {
        return interaction.editReply({ content: `❌ Warning failed: ${result.error}` });
      }

      return interaction.editReply({
        content: `⚠️ Warning issued to **${targetUser.tag}** (Total Strikes: ${result.warningCount}).\n**Reason:** ${reason}`,
      });
    },
  },

  // 5. /cases command
  {
    data: new SlashCommandBuilder()
      .setName("cases")
      .setDescription("View moderation infraction history for a user")
      .addUserOption((opt) => opt.setName("target").setDescription("Member to inspect").setRequired(true))
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction: ChatInputCommandInteraction, modService: TraditionalModService) {
      const targetUser = interaction.options.getUser("target", true);
      const cases = modService.getUserCases(interaction.guildId!, targetUser.id);

      if (cases.length === 0) {
        return interaction.reply({
          content: `No recorded moderation infractions for **${targetUser.tag}**. Clean record!`,
          ephemeral: true,
        });
      }

      const embed = new EmbedBuilder()
        .setTitle(`📜 Infraction History for ${targetUser.tag}`)
        .setColor(0x5865f2)
        .setDescription(`Found **${cases.length}** recorded case(s) in this server:`)
        .setThumbnail(targetUser.displayAvatarURL());

      cases.slice(-5).forEach((c) => {
        const date = new Date(c.timestamp).toLocaleDateString();
        embed.addFields({
          name: `[${c.caseId}] ${c.action} • ${date}`,
          value: `**Mod:** ${c.moderatorTag}\n**Reason:** ${c.reason}`,
        });
      });

      return interaction.reply({ embeds: [embed], ephemeral: true });
    },
  },
];
