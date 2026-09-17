/**
 * /appeal Command
 * Enables penalized members to submit formal infraction appeals to staff.
 */

import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import { TraditionalModService } from "../services/traditionalModService.js";
import { LoggingService } from "../services/loggingService.js";

export const appealCommand = {
  data: new SlashCommandBuilder()
    .setName("appeal")
    .setDescription("Submit an appeal for an active warning, timeout, or moderation infraction")
    .addStringOption((opt) =>
      opt
        .setName("case_id")
        .setDescription("The Case ID provided in your DM notification (e.g. CASE-1004)")
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("reason")
        .setDescription("Explain why this was a misunderstanding or why the penalty should be removed")
        .setMinLength(10)
        .setMaxLength(1000)
        .setRequired(true)
    ),

  async execute(
    interaction: ChatInputCommandInteraction,
    modService: TraditionalModService,
    loggingService: LoggingService
  ) {
    if (!interaction.guild) return;

    const caseId = interaction.options.getString("case_id", true).trim().toUpperCase();
    const reason = interaction.options.getString("reason", true).trim();

    const userCases = modService.getUserCases(interaction.guild.id, interaction.user.id);
    const matchedCase = userCases.find((c) => c.caseId.toUpperCase() === caseId);

    if (!matchedCase && !caseId.startsWith("CASE-")) {
      return interaction.reply({
        content: `⚠️ Could not locate \`${caseId}\` on record for your account. Please check your DM notification for the exact Case ID.`,
        ephemeral: true,
      });
    }

    const appeal = modService.createAppeal(
      interaction.guild.id,
      interaction.user.id,
      interaction.user.tag,
      caseId,
      reason
    );

    // Notify staff via #mod-logs
    await loggingService.logAppealSubmission(
      interaction.guild,
      interaction.user,
      caseId,
      appeal.appealId,
      reason
    );

    const confirmationEmbed = new EmbedBuilder()
      .setTitle("📬 Appeal Submitted Successfully")
      .setColor(0x2ecc71)
      .setDescription(
        `Your appeal for **${caseId}** has been registered with reference ID \`${appeal.appealId}\`.\nServer moderators will review your explanation in \`#mod-logs\`.`
      )
      .setTimestamp();

    await interaction.reply({ embeds: [confirmationEmbed], ephemeral: true });
  },
};
