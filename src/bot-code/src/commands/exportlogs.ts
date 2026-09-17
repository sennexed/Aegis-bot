/**
 * /exportlogs Slash Command
 * Generates downloadable CSV/JSON audit logs and executive transparency reports.
 */

import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
  PermissionFlagsBits,
  AttachmentBuilder,
  MessageFlags,
} from "discord.js";
import { AuditExportService } from "../services/auditExportService.js";
import { TraditionalModService } from "../services/traditionalModService.js";
import { RoleService } from "../services/roleService.js";

export const exportLogsCommand = {
  data: new SlashCommandBuilder()
    .setName("exportlogs")
    .setDescription("Export moderation audit records and transparency statistics")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((opt) =>
      opt
        .setName("format")
        .setDescription("Export output format")
        .addChoices(
          { name: "Executive Summary Embed", value: "summary" },
          { name: "CSV Spreadsheet (Downloadable .csv)", value: "csv" },
          { name: "Raw JSON File (Downloadable .json)", value: "json" }
        )
    )
    .addStringOption((opt) =>
      opt
        .setName("timeframe")
        .setDescription("Time window for records")
        .addChoices(
          { name: "Past 7 Days", value: "7" },
          { name: "Past 30 Days (Default)", value: "30" },
          { name: "All-Time", value: "0" }
        )
    )
    .addStringOption((opt) =>
      opt
        .setName("action_filter")
        .setDescription("Filter by specific moderation action")
        .addChoices(
          { name: "All Actions", value: "ALL" },
          { name: "Bans Only", value: "BAN" },
          { name: "Timeouts Only", value: "MUTE" },
          { name: "Warnings Only", value: "WARN" },
          { name: "Kicks Only", value: "KICK" }
        )
    ),

  async execute(
    interaction: ChatInputCommandInteraction,
    auditService: AuditExportService,
    modService: TraditionalModService,
    roleService: RoleService
  ) {
    if (!interaction.guild) return;

    // Check staff permissions
    if (interaction.member && !roleService.isStaffOrExempt(interaction.member as any)) {
      return interaction.reply({
        content: "⛔ Only administrators and senior staff can export moderation audit logs.",
        flags: MessageFlags.Ephemeral,
      });
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const format = interaction.options.getString("format") || "summary";
    const timeframeDays = parseInt(interaction.options.getString("timeframe") || "30", 10);
    const actionFilter = interaction.options.getString("action_filter") || "ALL";

    const allCases = modService.getAllGuildCases(interaction.guild.id);

    // 1. Executive Summary Embed
    if (format === "summary") {
      const summary = auditService.generateTransparencySummary(
        interaction.guild.id,
        interaction.guild.name,
        allCases,
        { timeframeDays: timeframeDays > 0 ? timeframeDays : undefined, actionFilter }
      );

      const embed = new EmbedBuilder()
        .setColor(0x6366f1)
        .setTitle(`📊 Moderation Transparency & Audit Report`)
        .setDescription(
          `**Server:** ${interaction.guild.name}\n**Timeframe:** ${summary.timeframeLabel}\n**Total Recorded Actions:** ${summary.totalIncidents}\n**Unique Members Sanctioned:** ${summary.uniqueUsersSanctioned}`
        )
        .addFields(
          {
            name: "⚖️ Action Breakdown",
            value: `• **Bans:** ${summary.actionBreakdown.bans}\n• **Kicks:** ${summary.actionBreakdown.kicks}\n• **Timeouts:** ${summary.actionBreakdown.timeouts}\n• **Warnings:** ${summary.actionBreakdown.warnings}\n• **Unmutes / Pardons:** ${summary.actionBreakdown.unmutes}`,
            inline: true,
          },
          {
            name: "🛡️ Top Safety Categories",
            value: Object.entries(summary.categoryBreakdown)
              .filter(([_, count]) => count > 0)
              .map(([name, count]) => `• ${name}: **${count}**`)
              .join("\n") || "• None recorded in period",
            inline: true,
          }
        )
        .setFooter({ text: "AegisMod Governance & Transparency • /exportlogs for raw files" })
        .setTimestamp();

      if (summary.topActiveModerators.length > 0) {
        embed.addFields({
          name: "👮 Top Active Staff",
          value: summary.topActiveModerators
            .map((m, idx) => `${idx + 1}. **${m.moderatorTag}** (${m.count} actions)`)
            .join("\n"),
          inline: false,
        });
      }

      return interaction.editReply({ embeds: [embed] });
    }

    // 2. CSV File Export
    if (format === "csv") {
      const csvData = auditService.exportCsv(allCases, {
        timeframeDays: timeframeDays > 0 ? timeframeDays : undefined,
        actionFilter,
      });

      const buffer = Buffer.from(csvData, "utf-8");
      const filename = `aegismod_audit_${interaction.guild.id}_${Date.now()}.csv`;
      const attachment = new AttachmentBuilder(buffer, { name: filename });

      return interaction.editReply({
        content: `📁 **Audit Log CSV Export Generated**\n• Records: ${csvData.split("\n").length - 1}\n• Timeframe: ${timeframeDays > 0 ? `${timeframeDays} days` : "All-time"}`,
        files: [attachment],
      });
    }

    // 3. JSON File Export
    if (format === "json") {
      const jsonData = auditService.exportJson(
        interaction.guild.id,
        interaction.guild.name,
        allCases,
        { timeframeDays: timeframeDays > 0 ? timeframeDays : undefined, actionFilter }
      );

      const buffer = Buffer.from(jsonData, "utf-8");
      const filename = `aegismod_audit_${interaction.guild.id}_${Date.now()}.json`;
      const attachment = new AttachmentBuilder(buffer, { name: filename });

      return interaction.editReply({
        content: `📁 **Audit Log JSON Export Generated**\n• Exported At: ${new Date().toISOString()}`,
        files: [attachment],
      });
    }
  },
};
