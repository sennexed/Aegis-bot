/**
 * /userinfo & /modhistory Command
 * Displays a member's comprehensive moderation passport:
 * Account Age, Server Tenure, Strike History, Trust Score, and Active Status.
 */

import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  GuildMember,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { TraditionalModService } from "../services/traditionalModService.js";

export const userInfoCommand = {
  data: new SlashCommandBuilder()
    .setName("userinfo")
    .setDescription("View a member's moderation passport, strike count, and trust score")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((opt) =>
      opt
        .setName("target")
        .setDescription("The user whose moderation passport to examine")
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction, modService: TraditionalModService) {
    if (!interaction.guild) return;

    const targetUser = interaction.options.getUser("target", true);
    const targetMember = interaction.guild.members.cache.get(targetUser.id);

    const accountCreated = targetUser.createdTimestamp;
    const joinedServer = targetMember ? targetMember.joinedTimestamp || Date.now() : Date.now();

    const trust = modService.calculateTrustScore(
      interaction.guild.id,
      targetUser.id,
      accountCreated,
      joinedServer
    );

    const infractions = modService.getUserCases(interaction.guild.id, targetUser.id);
    const strikes = modService.getRecentStrikes(interaction.guild.id, targetUser.id, 30);

    const warnCount = infractions.filter((i) => i.action === "WARN").length;
    const muteCount = infractions.filter((i) => i.action === "MUTE").length;
    const kickCount = infractions.filter((i) => i.action === "KICK").length;
    const banCount = infractions.filter((i) => i.action === "BAN").length;

    const isCurrentlyMuted = targetMember?.communicationDisabledUntilTimestamp
      ? targetMember.communicationDisabledUntilTimestamp > Date.now()
      : false;

    // Badge color based on Trust Score
    const color =
      trust.riskTier === "CLEAN"
        ? 0x2ecc71
        : trust.riskTier === "LOW_RISK"
        ? 0x3498db
        : trust.riskTier === "MEDIUM_RISK"
        ? 0xe67e22
        : 0xed4245;

    const embed = new EmbedBuilder()
      .setTitle(`📇 Moderation Passport: ${targetUser.tag}`)
      .setColor(color)
      .setThumbnail(targetUser.displayAvatarURL())
      .addFields(
        {
          name: "🛡️ Trust Score & Risk Tier",
          value: `**${trust.score}/100** • \`${trust.riskTier}\``,
          inline: true,
        },
        {
          name: "⚡ Active Strikes (30d)",
          value: `**${strikes.length}** active ${strikes.length === 1 ? "strike" : "strikes"}`,
          inline: true,
        },
        {
          name: "🔇 Active Timeout",
          value: isCurrentlyMuted
            ? `Yes (<t:${Math.floor(targetMember!.communicationDisabledUntilTimestamp! / 1000)}:R>)`
            : "None",
          inline: true,
        },
        {
          name: "📅 Account Age",
          value: `${trust.accountAgeDays} days old (<t:${Math.floor(accountCreated / 1000)}:D>)`,
          inline: true,
        },
        {
          name: "🏰 Server Tenure",
          value: `${trust.serverTenureDays} days (<t:${Math.floor(joinedServer / 1000)}:D>)`,
          inline: true,
        },
        {
          name: "📊 Infraction Breakdown",
          value: `⚠️ Warns: **${warnCount}** | ⏳ Mutes: **${muteCount}**\n👢 Kicks: **${kickCount}** | 🔨 Bans: **${banCount}**`,
          inline: false,
        }
      )
      .setFooter({ text: `User ID: ${targetUser.id} • AegisMod Teen Safety Engine` })
      .setTimestamp();

    if (infractions.length > 0) {
      const recentCases = infractions.slice(-3).reverse();
      embed.addFields({
        name: "Recent Infraction Records",
        value: recentCases
          .map(
            (c) =>
              `• **[${c.action}]** \`${c.caseId}\` - ${c.reason} (<t:${Math.floor(c.timestamp / 1000)}:R>)`
          )
          .join("\n"),
      });
    }

    await interaction.reply({ embeds: [embed] });
  },
};
