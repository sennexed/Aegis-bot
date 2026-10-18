/**
 * /verify Command
 * Manages the AegisMod Verification Gatekeeper, posts verification embeds,
 * configures roles & challenge modes, and displays verification statistics.
 */

import {
  ChannelType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
  TextChannel,
} from "discord.js";
import { verificationService, VerificationMode } from "../services/verificationService.js";

export const verifyCommand = {
  data: new SlashCommandBuilder()
    .setName("verify")
    .setDescription("Configure and manage the AegisMod Verification Gatekeeper")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName("setup")
        .setDescription("Configure verification gatekeeper roles, channel, and challenge mode")
        .addRoleOption((opt) =>
          opt
            .setName("verified_role")
            .setDescription("Role given to members after passing verification")
            .setRequired(false)
        )
        .addRoleOption((opt) =>
          opt
            .setName("unverified_role")
            .setDescription("Role given to newcomers restricting them to the verification channel")
            .setRequired(false)
        )
        .addStringOption((opt) =>
          opt
            .setName("mode")
            .setDescription("Challenge mode required to verify")
            .addChoices(
              { name: "One-Click Button (Instant)", value: "BUTTON" },
              { name: "Alphanumeric Captcha (Anti-Bot)", value: "CAPTCHA" },
              { name: "Account Maturity / Anti-Alt", value: "ANTI_ALT" },
              { name: "Gemini AI Community Pledge", value: "AI_PLEDGE" }
            )
            .setRequired(false)
        )
        .addIntegerOption((opt) =>
          opt
            .setName("min_account_age_days")
            .setDescription("Minimum Discord account age in days required to verify")
            .setMinValue(0)
            .setMaxValue(90)
            .setRequired(false)
        )
        .addBooleanOption((opt) =>
          opt
            .setName("require_avatar")
            .setDescription("Require custom profile picture (blocks default Discord avatar alts)")
            .setRequired(false)
        )
        .addBooleanOption((opt) =>
          opt
            .setName("enabled")
            .setDescription("Enable or disable the gatekeeper")
            .setRequired(false)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("config")
        .setDescription("View or update verification gatekeeper settings")
        .addRoleOption((opt) =>
          opt
            .setName("verified_role")
            .setDescription("Role given to members after passing verification")
            .setRequired(false)
        )
        .addRoleOption((opt) =>
          opt
            .setName("unverified_role")
            .setDescription("Role given to newcomers restricting them to the verification channel")
            .setRequired(false)
        )
        .addStringOption((opt) =>
          opt
            .setName("mode")
            .setDescription("Challenge mode required to verify")
            .addChoices(
              { name: "One-Click Button (Instant)", value: "BUTTON" },
              { name: "Alphanumeric Captcha (Anti-Bot)", value: "CAPTCHA" },
              { name: "Account Maturity / Anti-Alt", value: "ANTI_ALT" },
              { name: "Gemini AI Community Pledge", value: "AI_PLEDGE" }
            )
            .setRequired(false)
        )
        .addIntegerOption((opt) =>
          opt
            .setName("min_account_age_days")
            .setDescription("Minimum Discord account age in days required to verify")
            .setMinValue(0)
            .setMaxValue(90)
            .setRequired(false)
        )
        .addBooleanOption((opt) =>
          opt
            .setName("require_avatar")
            .setDescription("Require custom profile picture (blocks default Discord avatar alts)")
            .setRequired(false)
        )
        .addBooleanOption((opt) =>
          opt
            .setName("enabled")
            .setDescription("Enable or disable the gatekeeper")
            .setRequired(false)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("send")
        .setDescription("Post the interactive Verification Embed in the verification channel")
        .addChannelOption((opt) =>
          opt
            .setName("channel")
            .setDescription("Channel to post the verification embed into (defaults to current)")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(false)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("status")
        .setDescription("Inspect gatekeeper configuration and verification statistics")
    )
    .addSubcommand((sub) =>
      sub
        .setName("manual")
        .setDescription("Manually verify, quarantine, or reset a member's verification status")
        .addUserOption((opt) =>
          opt
            .setName("target")
            .setDescription("The user to modify")
            .setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName("action")
            .setDescription("Action to perform on the user")
            .addChoices(
              { name: "Force Verify (Grant Access)", value: "VERIFY" },
              { name: "Quarantine (Restrict to Staff Review)", value: "QUARANTINE" },
              { name: "Reset (Prompt Re-Verification)", value: "RESET" }
            )
            .setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName("reason")
            .setDescription("Reason for the manual action")
            .setRequired(false)
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;
    const guildId = interaction.guild.id;
    const sub = interaction.options.getSubcommand();

    if (sub === "setup" || sub === "config") {
      const verifiedRole = interaction.options.getRole("verified_role");
      const unverifiedRole = interaction.options.getRole("unverified_role");
      const mode = interaction.options.getString("mode") as VerificationMode | null;
      const minAge = interaction.options.getInteger("min_account_age_days");
      const reqAvatar = interaction.options.getBoolean("require_avatar");
      const enabled = interaction.options.getBoolean("enabled");

      if (sub === "config" && !verifiedRole && !unverifiedRole && !mode && minAge === null && reqAvatar === null && enabled === null) {
        const conf = verificationService.getConfig(guildId);
        const embed = new EmbedBuilder()
          .setTitle("🛡️ Verification Gatekeeper Configuration")
          .setColor(conf.enabled ? 0x2ecc71 : 0x95a5a6)
          .addFields(
            { name: "Gatekeeper Status", value: conf.enabled ? "🟢 **Active**" : "🔴 **Disabled**", inline: true },
            { name: "Challenge Mode", value: `\`${conf.mode}\``, inline: true },
            { name: "Min Account Age", value: `${conf.minAccountAgeDays} days`, inline: true },
            { name: "Verified Role", value: conf.verifiedRoleId ? `<@&${conf.verifiedRoleId}>` : "*Not set*", inline: true },
            { name: "Unverified Role", value: conf.unverifiedRoleId ? `<@&${conf.unverifiedRoleId}>` : "*Not set*", inline: true },
            { name: "Avatar Required", value: conf.requireAvatar ? "Yes" : "No", inline: true }
          )
          .setFooter({ text: "To update, run /verify config mode:CAPTCHA min_account_age_days:7 enabled:true" })
          .setTimestamp();
        return interaction.reply({ embeds: [embed] });
      }

      const updates: any = {};
      if (verifiedRole) updates.verifiedRoleId = verifiedRole.id;
      if (unverifiedRole) updates.unverifiedRoleId = unverifiedRole.id;
      if (mode) updates.mode = mode;
      if (minAge !== null) updates.minAccountAgeDays = minAge;
      if (reqAvatar !== null) updates.requireAvatar = reqAvatar;
      if (enabled !== null) updates.enabled = enabled;

      const updated = verificationService.updateConfig(guildId, updates);

      const embed = new EmbedBuilder()
        .setTitle("⚙️ Verification Gatekeeper Configured")
        .setColor(0x5865F2)
        .setDescription("The server verification gatekeeper parameters have been updated successfully.")
        .addFields(
          { name: "Gatekeeper Status", value: updated.enabled ? "🟢 **ENABLED**" : "🔴 **DISABLED**", inline: true },
          { name: "Active Mode", value: `\`${updated.mode}\``, inline: true },
          { name: "Min Account Age", value: `${updated.minAccountAgeDays} days`, inline: true },
          { name: "Verified Role", value: updated.verifiedRoleId ? `<@&${updated.verifiedRoleId}>` : "*Not set*", inline: true },
          { name: "Unverified Role", value: updated.unverifiedRoleId ? `<@&${updated.unverifiedRoleId}>` : "*Not set*", inline: true },
          { name: "Avatar Required", value: updated.requireAvatar ? "Yes" : "No", inline: true }
        )
        .setFooter({ text: "Use '/verify send' to deploy the interactive verification embed." })
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    if (sub === "send") {
      const channel = (interaction.options.getChannel("channel") || interaction.channel) as TextChannel;
      if (!channel || channel.type !== ChannelType.GuildText) {
        return interaction.reply({ content: "❌ Please specify a valid text channel for the verification embed.", ephemeral: true });
      }

      const config = verificationService.getConfig(guildId);
      verificationService.updateConfig(guildId, { verificationChannelId: channel.id });

      const embed = verificationService.buildVerificationEmbed(interaction.guild.name, config);
      const row = verificationService.buildVerificationActionRow();

      await channel.send({ embeds: [embed], components: [row] });

      return interaction.reply({
        content: `✅ Interactive verification gatekeeper deployed to <#${channel.id}>!`,
        ephemeral: true,
      });
    }

    if (sub === "status") {
      const config = verificationService.getConfig(guildId);
      const embed = new EmbedBuilder()
        .setTitle("🛡️ Verification Gatekeeper Dashboard")
        .setColor(config.enabled ? 0x2ecc71 : 0x95a5a6)
        .addFields(
          { name: "Gatekeeper", value: config.enabled ? "🟢 Active" : "🔴 Offline", inline: true },
          { name: "Challenge Mode", value: `\`${config.mode}\``, inline: true },
          { name: "Min Account Age", value: `${config.minAccountAgeDays} days`, inline: true },
          { name: "Verified Role", value: config.verifiedRoleId ? `<@&${config.verifiedRoleId}>` : "*None*", inline: true },
          { name: "Unverified Role", value: config.unverifiedRoleId ? `<@&${config.unverifiedRoleId}>` : "*None*", inline: true },
          { name: "Channel", value: config.verificationChannelId ? `<#${config.verificationChannelId}>` : "*None*", inline: true },
          { name: "Total Verified", value: `**${config.stats.totalVerified}** members`, inline: true },
          { name: "Quarantined Alts", value: `**${config.stats.totalQuarantined}** accounts`, inline: true },
          { name: "Failed Attempts", value: `**${config.stats.totalFailed}** challenges`, inline: true }
        )
        .setFooter({ text: "AegisMod Security Matrix" })
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    if (sub === "manual") {
      const targetUser = interaction.options.getUser("target", true);
      const action = interaction.options.getString("action", true);
      const reason = interaction.options.getString("reason") || "Manual staff override";

      const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
      if (!member) {
        return interaction.reply({ content: `❌ User <@${targetUser.id}> is not currently in this server.`, ephemeral: true });
      }

      const config = verificationService.getConfig(guildId);

      if (action === "VERIFY") {
        await verificationService.grantVerifiedRoles(member, guildId);
        return interaction.reply({
          content: `✅ <@${targetUser.id}> has been manually **verified** and granted the verified role.\nReason: *${reason}*`,
        });
      }

      if (action === "QUARANTINE") {
        if (config.verifiedRoleId) await member.roles.remove(config.verifiedRoleId).catch(() => null);
        if (config.quarantineRoleId) await member.roles.add(config.quarantineRoleId).catch(() => null);
        verificationService.recordStat(guildId, "totalQuarantined");
        return interaction.reply({
          content: `⚠️ <@${targetUser.id}> has been placed in **quarantine**.\nReason: *${reason}*`,
        });
      }

      if (action === "RESET") {
        if (config.verifiedRoleId) await member.roles.remove(config.verifiedRoleId).catch(() => null);
        if (config.unverifiedRoleId) await member.roles.add(config.unverifiedRoleId).catch(() => null);
        return interaction.reply({
          content: `🔄 <@${targetUser.id}>'s verification status has been **reset**. They must re-verify in the gatekeeper channel.`,
        });
      }
    }
  },
};
