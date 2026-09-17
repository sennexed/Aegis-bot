/**
 * /modstats Command
 * Displays weekly moderation health digest, violation category breakdown,
 * triage token savings, and safety analytics.
 */

import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { ANALYTICS_SERVICE } from "../services/analyticsService.js";

export const modStatsCommand = {
  data: new SlashCommandBuilder()
    .setName("modstats")
    .setDescription("View weekly safety digest, token savings, and violation analytics")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction: ChatInputCommandInteraction) {
    const digest = ANALYTICS_SERVICE.generateWeeklyDigestSummary();
    const stats = ANALYTICS_SERVICE.getStats();

    const categoryLines = Object.entries(stats.categoryBreakdown)
      .filter(([, count]) => count > 0)
      .map(([cat, count]) => `• **${cat}**: ${count}`)
      .join("\n") || "*No violations recorded this week!*";

    const embed = new EmbedBuilder()
      .setTitle("📊 AegisMod Weekly Moderation Digest")
      .setColor(0x5865f2)
      .addFields(
        { name: "🛡️ Community Safety Score", value: `**${digest.safeCommunityScore}% Safe**`, inline: true },
        { name: "💬 Total Messages Guarded", value: `${digest.scanned.toLocaleString()}`, inline: true },
        { name: "⚡ Violations Intercepted", value: `${digest.flagged}`, inline: true },
        { name: "🎯 Tier-1 Triage Efficiency", value: `**${digest.triageEfficiencyPercent}%** (0-token passes)`, inline: true },
        { name: "💰 Estimated API Cost Saved", value: `$${digest.estimatedCostSavedUsd.toFixed(4)}`, inline: true },
        { name: "🚨 Most Common Violation", value: `\`${digest.topViolation}\``, inline: true },
        { name: "📈 Violation Category Distribution", value: categoryLines, inline: false }
      )
      .setFooter({ text: "AegisMod Analytics Engine • Weekly Automated Digest" })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
