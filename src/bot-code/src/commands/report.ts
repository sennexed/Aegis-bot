/**
 * /report Slash Command
 * Allows any community member to report a user directly to on-duty staff.
 * Pings currently on-duty moderators & admins (or staff roles if none on duty).
 */

import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} from "discord.js";
import { LoggingService } from "../services/loggingService.js";
import { DutyService } from "../services/dutyService.js";
import { RoleService } from "../services/roleService.js";

export const reportCommand = {
  data: new SlashCommandBuilder()
    .setName("report")
    .setDescription("Report a user or incident directly to on-duty server moderators")
    .addUserOption((opt) =>
      opt
        .setName("user")
        .setDescription("The user you are reporting")
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("reason")
        .setDescription("Reason for this report (e.g. harassment, hate speech, scam, predator behavior)")
        .setMinLength(5)
        .setMaxLength(500)
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("evidence")
        .setDescription("Message link, quotes, channel, or additional context")
        .setMaxLength(500)
    ),

  async execute(
    interaction: ChatInputCommandInteraction,
    loggingService: LoggingService,
    dutyService: DutyService,
    roleService: RoleService
  ) {
    if (!interaction.guild) return;

    const targetUser = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason", true);
    const evidence = interaction.options.getString("evidence") || undefined;

    // Validation checks
    if (targetUser.id === interaction.user.id) {
      return interaction.reply({
        content: "⚠️ You cannot report yourself.",
        flags: MessageFlags.Ephemeral,
      });
    }

    if (targetUser.id === interaction.client.user.id) {
      return interaction.reply({
        content: "⚠️ You cannot report AegisMod.",
        flags: MessageFlags.Ephemeral,
      });
    }

    // Ping on-duty staff (or staff roles if nobody is currently /duty on)
    const staffPing = roleService.getStaffPing(interaction.guild.id, dutyService);
    const logChannel = await loggingService.ensureLogChannel(interaction.guild);

    const embed = new EmbedBuilder()
      .setTitle("🚩 User Report Submitted (/report)")
      .setColor(0xe67e22)
      .setThumbnail(targetUser.displayAvatarURL())
      .addFields(
        { name: "Reported Member", value: `<@${targetUser.id}> (${targetUser.tag})`, inline: true },
        { name: "Reported By", value: `<@${interaction.user.id}> (${interaction.user.tag})`, inline: true },
        { name: "Channel", value: `<#${interaction.channelId}>`, inline: true },
        { name: "Report Reason", value: reason, inline: false }
      )
      .setFooter({ text: `Target ID: ${targetUser.id} • Reporter ID: ${interaction.user.id}` })
      .setTimestamp();

    if (evidence) {
      embed.addFields({ name: "Evidence / Details", value: evidence, inline: false });
    }

    const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`quickmod:mute1h:${targetUser.id}`)
        .setLabel("Mute 1h")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`quickmod:mute24h:${targetUser.id}`)
        .setLabel("Mute 24h")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`quickmod:pardon:${targetUser.id}`)
        .setLabel("Dismiss Report")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`quickmod:ban:${targetUser.id}`)
        .setLabel("Ban Member")
        .setStyle(ButtonStyle.Danger)
    );

    await logChannel.send({
      content: staffPing,
      embeds: [embed],
      components: [actionRow],
    });

    return interaction.reply({
      content: "✅ **Report Submitted Successfully.** On-duty moderators and admins have been alerted in our secure staff channel. Thank you for keeping our community safe!",
      flags: MessageFlags.Ephemeral,
    });
  },
};
