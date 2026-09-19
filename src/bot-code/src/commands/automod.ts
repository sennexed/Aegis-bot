/**
 * /automod Slash Command
 * Server configuration for standard AutoMod rules:
 * - /automod status: View active filters & thresholds
 * - /automod toggle: Enable/disable specific AutoMod modules
 * - /automod sync: Provision Discord's official server-side native AutoMod rules
 */

import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  MessageFlags,
} from "discord.js";
import { AutoModService, AutoModConfig } from "../services/autoModService.js";

export const autoModCommand = {
  data: new SlashCommandBuilder()
    .setName("automod")
    .setDescription("Configure AegisMod Standard AutoMod protection rules and Discord native sync")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub.setName("status").setDescription("View current AutoMod rule statuses and thresholds")
    )
    .addSubcommand((sub) =>
      sub
        .setName("toggle")
        .setDescription("Enable or disable a specific AutoMod rule")
        .addStringOption((opt) =>
          opt
            .setName("rule")
            .setDescription("The AutoMod rule to configure")
            .setRequired(true)
            .addChoices(
              { name: "Anti-Invite Links", value: "antiInvite" },
              { name: "Anti-Phishing & Scam Links", value: "antiPhishing" },
              { name: "Anti-Mass Mentions", value: "antiMassMention" },
              { name: "Anti-Spam & Flood Control", value: "antiSpam" },
              { name: "Anti-Excessive Caps", value: "antiCaps" },
              { name: "Anti-Zalgo & Glitch Text", value: "antiZalgo" },
              { name: "Anti-Banned Words & Slurs", value: "antiBannedWords" },
              { name: "Allow Tenor / Giphy GIFs", value: "allowGifs" }
            )
        )
        .addBooleanOption((opt) =>
          opt.setName("enabled").setDescription("Whether the rule should be enabled").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("sync")
        .setDescription("Sync Discord Native AutoMod rules directly to the server")
    ),

  async execute(interaction: ChatInputCommandInteraction, autoModService: AutoModService) {
    if (!interaction.guild) {
      return interaction.reply({ content: "This command can only be used in a server.", flags: MessageFlags.Ephemeral });
    }

    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (subcommand === "status") {
      const config = autoModService.getConfig(guildId);
      const embed = new EmbedBuilder()
        .setTitle("🛡️ AegisMod - Standard AutoMod Status")
        .setDescription(
          "Deterministic local filters running alongside Gemini AI to ensure zero-latency protection against spam, malicious links, and server raids."
        )
        .setColor(0x5865f2)
        .addFields(
          {
            name: "🔗 Anti-Invite Links",
            value: config.antiInvite ? "✅ **Enabled** (Deletes unauthorized `discord.gg` links)" : "❌ **Disabled**",
            inline: true,
          },
          {
            name: "🎣 Anti-Phishing & Scams",
            value: config.antiPhishing ? "✅ **Enabled** (24h timeout on fake Nitro/Steam scams)" : "❌ **Disabled**",
            inline: true,
          },
          {
            name: "📣 Anti-Mass Mentions",
            value: config.antiMassMention ? `✅ **Enabled** (Limit: ${config.mentionThreshold} mentions)` : "❌ **Disabled**",
            inline: true,
          },
          {
            name: "🌊 Anti-Spam / Flood",
            value: config.antiSpam
              ? `✅ **Enabled** (Max ${config.spamMessageThreshold} msgs in ${config.spamIntervalMs / 1000}s)`
              : "❌ **Disabled**",
            inline: true,
          },
          {
            name: "🔠 Anti-Excessive Caps",
            value: config.antiCaps ? `✅ **Enabled** (>=${config.capsPercentage}% uppercase on len >=${config.capsMinLength})` : "❌ **Disabled**",
            inline: true,
          },
          {
            name: "🔣 Anti-Zalgo & Glitch Text",
            value: config.antiZalgo ? "✅ **Enabled** (Blocks client-lagging unicode characters)" : "❌ **Disabled**",
            inline: true,
          },
          {
            name: "🚫 Zero-Tolerance Slurs",
            value: config.antiBannedWords ? "✅ **Enabled** (Instant local leetspeak interception)" : "❌ **Disabled**",
            inline: true,
          },
          {
            name: "🎭 Allow Tenor/Giphy GIFs",
            value: config.allowGifs ? "✅ **Allowed** (Safe GIF culture enabled, slugs exempted from profanity checks)" : "❌ **Blocked**",
            inline: true,
          }
        )
        .setFooter({ text: "Use /automod toggle <rule> <enabled> to adjust settings | /automod sync for native Discord rules" })
        .setTimestamp();

      return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }

    if (subcommand === "toggle") {
      const rule = interaction.options.getString("rule", true) as keyof AutoModConfig;
      const enabled = interaction.options.getBoolean("enabled", true);

      autoModService.updateConfig(guildId, { [rule]: enabled });

      return interaction.reply({
        content: `✅ Updated AutoMod rule **${rule}**: **${enabled ? "ENABLED" : "DISABLED"}**.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    if (subcommand === "sync") {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const result = await autoModService.syncDiscordNativeRules(interaction.guild);

      const embed = new EmbedBuilder()
        .setTitle("⚡ Discord Native AutoMod Provisioning")
        .setColor(result.errors.length > 0 ? 0xffaa00 : 0x57f287)
        .setDescription(
          "Synced server-side AutoMod rules directly with Discord's infrastructure. These rules run on Discord's edge servers even before messages reach chat!"
        )
        .addFields(
          { name: "New Rules Created", value: `${result.created}`, inline: true },
          { name: "Existing Rules Verified", value: `${result.updated}`, inline: true },
          {
            name: "Rules Installed",
            value: "• AegisMod - Native Anti-Mention Spam\n• AegisMod - Native Anti-Spam\n• AegisMod - Native High-Risk Keyword Filter",
          }
        );

      if (result.errors.length > 0) {
        embed.addFields({
          name: "⚠️ Warnings",
          value: result.errors.slice(0, 3).join("\n"),
        });
      }

      return interaction.editReply({ embeds: [embed] });
    }
  },
};
