/**
 * /antiraid Command
 * Controls server gatekeeper status, toggles raid lockdowns,
 * and displays active raid statistics.
 */

import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { AntiRaidService } from "../services/antiRaidService.js";

export const antiRaidCommand = {
  data: new SlashCommandBuilder()
    .setName("antiraid")
    .setDescription("Configure Anti-Raid protection and toggle server gatekeeper lockdown")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub
        .setName("status")
        .setDescription("Check current server raid and gatekeeper status")
    )
    .addSubcommand((sub) =>
      sub
        .setName("lockdown")
        .setDescription("Enable or disable emergency server lockdown")
        .addBooleanOption((opt) =>
          opt
            .setName("enabled")
            .setDescription("Whether to engage emergency raid lockdown")
            .setRequired(true)
        )
    ),

  async execute(interaction: ChatInputCommandInteraction, antiRaidService: AntiRaidService) {
    if (!interaction.guild) return;

    const sub = interaction.options.getSubcommand();

    if (sub === "status") {
      const isLockdown = antiRaidService.isLockdownActive(interaction.guild.id);
      const embed = new EmbedBuilder()
        .setTitle("🛡️ AegisMod Anti-Raid & Gatekeeper Status")
        .setColor(isLockdown ? 0xed4245 : 0x2ecc71)
        .addFields(
          { name: "Lockdown State", value: isLockdown ? "🚨 **ACTIVE LOCKDOWN**" : "✅ **Normal Monitoring**", inline: true },
          { name: "Join Velocity Limit", value: "> 5 joins / 12 seconds", inline: true },
          { name: "New Account Flag", value: "< 24 hours old", inline: true },
          { name: "Verification Gate", value: isLockdown ? "High (10m member)" : "Standard", inline: true }
        )
        .setFooter({ text: "AegisMod Gatekeeper Protection" })
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    if (sub === "lockdown") {
      const enable = interaction.options.getBoolean("enabled", true);
      await antiRaidService.setLockdown(interaction.guild, enable);

      const embed = new EmbedBuilder()
        .setTitle(enable ? "🚨 Server Lockdown ENGAGED" : "✅ Server Lockdown LIFTED")
        .setColor(enable ? 0xed4245 : 0x2ecc71)
        .setDescription(
          enable
            ? "Emergency Anti-Raid Gatekeeper is active. Join verification elevated to **High**, and newly joined unverified accounts will be temporarily isolated."
            : "Emergency lockdown has been lifted. Server verification and join rates restored to normal."
        )
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }
  },
};
