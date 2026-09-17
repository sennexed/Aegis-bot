/**
 * /duty Slash Command
 * Staff On-Duty Shift Tracker (/duty on, /duty off, /duty list)
 */

import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
  PermissionFlagsBits,
} from "discord.js";
import { DutyService } from "../services/dutyService.js";
import { RoleService } from "../services/roleService.js";
import { LoaService } from "../services/loaService.js";

export const dutyCommand = {
  data: new SlashCommandBuilder()
    .setName("duty")
    .setDescription("Staff On-Duty Shift Tracker for teen safety monitoring")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addSubcommand((sub) =>
      sub
        .setName("on")
        .setDescription("Clock into your active moderation monitoring shift")
        .addStringOption((opt) =>
          opt
            .setName("note")
            .setDescription("Optional shift focus or availability (e.g. Covering #voice-chat until 8 PM)")
            .setMaxLength(120)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("off")
        .setDescription("Clock out of your moderation monitoring shift")
    )
    .addSubcommand((sub) =>
      sub
        .setName("list")
        .setDescription("View currently on-duty moderation staff and active shifts")
    ),

  async execute(
    interaction: ChatInputCommandInteraction,
    dutyService: DutyService,
    roleService: RoleService,
    loaService?: LoaService
  ) {
    if (!interaction.guild) return;

    // Check staff permissions
    if (interaction.member && !roleService.isStaffOrExempt(interaction.member as any)) {
      return interaction.reply({
        content: "⛔ Only authorized moderators or staff can use the `/duty` command.",
        ephemeral: true,
      });
    }

    const subcommand = interaction.options.getSubcommand();

    // 1. Clock In (/duty on)
    if (subcommand === "on") {
      // LOA protection check: Cannot clock in if on active approved LOA
      if (loaService?.isUserOnLoa(interaction.guild.id, interaction.user.id)) {
        const activeLoa = loaService.getActiveLoaForUser(interaction.guild.id, interaction.user.id);
        const endT = activeLoa ? Math.floor(activeLoa.endDate / 1000) : 0;
        return interaction.reply({
          content: `🌴 **You are currently on an approved Leave of Absence (${activeLoa?.id || "LOA"})** until <t:${endT}:D> (<t:${endT}:R>).\n\nIf you have returned early and wish to resume moderation duties, please end your LOA first with \`/loa end\`.`,
          ephemeral: true,
        });
      }

      const note = interaction.options.getString("note") || undefined;
      const result = dutyService.clockIn(
        interaction.guild.id,
        interaction.user.id,
        interaction.user.tag,
        note
      );

      const embed = new EmbedBuilder()
        .setColor(0x10b981) // emerald
        .setTitle("🟢 Checked IN • On-Duty Shift Active")
        .setDescription(
          result.alreadyOnDuty
            ? `You are already marked as **On-Duty**.\n**Shift Started:** <t:${Math.floor(result.startedAt / 1000)}:R>`
            : `You have successfully checked in for active safety monitoring.\nEmergency pings and user reports will be routed to your shift.`
        )
        .addFields(
          { name: "Staff Member", value: `<@${interaction.user.id}> (${interaction.user.tag})`, inline: true },
          { name: "Shift Start", value: `<t:${Math.floor(result.startedAt / 1000)}:t>`, inline: true },
          { name: "Shift Note", value: result.note || "General Community Oversight", inline: false }
        )
        .setFooter({ text: "AegisMod Staff Operations • /duty off to end shift" })
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    // 2. Clock Out (/duty off)
    if (subcommand === "off") {
      const result = dutyService.clockOut(interaction.guild.id, interaction.user.id);

      if (!result.wasOnDuty) {
        return interaction.reply({
          content: "ℹ️ You are not currently marked as on-duty.",
          ephemeral: true,
        });
      }

      const embed = new EmbedBuilder()
        .setColor(0x6366f1) // indigo
        .setTitle("🔴 Checked OUT • Shift Concluded")
        .setDescription(`Thank you for keeping **${interaction.guild.name}** safe!`)
        .addFields(
          { name: "Staff Member", value: `<@${interaction.user.id}>`, inline: true },
          { name: "Shift Duration", value: `⏱️ **${result.formattedDuration}**`, inline: true },
          { name: "All-Time Duty Time", value: `🛡️ ${result.totalDutyTimeFormatted}`, inline: true }
        )
        .setFooter({ text: "AegisMod Staff Operations" })
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    // 3. List On-Duty Staff (/duty list)
    if (subcommand === "list") {
      const activeList = dutyService.getOnDutyStaff(interaction.guild.id);

      const embed = new EmbedBuilder()
        .setColor(0x3b82f6) // blue
        .setTitle(`🛡️ Active Staff Roster • ${interaction.guild.name}`)
        .setDescription(
          activeList.length === 0
            ? "⚠️ *No staff members are currently marked as on-duty.* Automated AI AutoMod and Gemini triage remain active 24/7."
            : `Currently **${activeList.length}** moderator${activeList.length === 1 ? "" : "s"} actively on shift:`
        )
        .setTimestamp();

      for (const staff of activeList) {
        embed.addFields({
          name: `🟢 ${staff.userTag}`,
          value: `• On Duty: **${staff.currentShiftMinutes || 0}m**\n• Started: <t:${Math.floor(staff.shiftStartedAt! / 1000)}:R>\n• Note: *${staff.note || "No note provided"}*`,
          inline: true,
        });
      }

      // Add On-Leave section if any staff are on active approved LOA
      if (loaService) {
        const activeLoas = loaService.getGuildLoas(interaction.guild.id, "ACTIVE");
        if (activeLoas.length > 0) {
          embed.addFields({
            name: `🌴 On Leave of Absence (${activeLoas.length})`,
            value: activeLoas
              .map(
                (l) =>
                  `• <@${l.userId}> (${l.userTag}) — Returns <t:${Math.floor(l.endDate / 1000)}:R> (*"${l.reason.slice(0, 35)}"* )`
              )
              .join("\n"),
            inline: false,
          });
        }
      }

      return interaction.reply({ embeds: [embed] });
    }
  },
};
