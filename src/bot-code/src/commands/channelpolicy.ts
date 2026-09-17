/**
 * /channelpolicy Command
 * Configures per-channel moderation profiles:
 * STRICT_TEEN, GAMING_BANTER, CRISIS_SUPPORT, MEDIA_ONLY
 */

import {
  ChannelType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import {
  ChannelPolicyProfile,
  ChannelPolicyService,
  POLICY_DEFINITIONS,
} from "../services/channelPolicyService.js";

export const channelPolicyCommand = {
  data: new SlashCommandBuilder()
    .setName("channelpolicy")
    .setDescription("Configure custom AI safety sensitivity for specific channels")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addSubcommand((sub) =>
      sub
        .setName("set")
        .setDescription("Assign a safety sensitivity profile to a channel")
        .addChannelOption((opt) =>
          opt
            .setName("channel")
            .setDescription("The channel to configure")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName("profile")
            .setDescription("The sensitivity profile to apply")
            .setRequired(true)
            .addChoices(
              { name: "Strict Teen (Standard - zero toxicity/slurs)", value: "STRICT_TEEN" },
              { name: "Gaming Banter (Relaxed - allows mild slang, blocks slurs)", value: "GAMING_BANTER" },
              { name: "Crisis Support (Supportive - prioritized helpline guidance)", value: "CRISIS_SUPPORT" },
              { name: "Media Only (Requires image scans, restricts link spam)", value: "MEDIA_ONLY" }
            )
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("view")
        .setDescription("View the active policy for a channel")
        .addChannelOption((opt) =>
          opt
            .setName("channel")
            .setDescription("The channel to inspect")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    ),

  async execute(interaction: ChatInputCommandInteraction, policyService: ChannelPolicyService) {
    const sub = interaction.options.getSubcommand();
    const targetChannel = interaction.options.getChannel("channel", true);

    if (sub === "set") {
      const profile = interaction.options.getString("profile", true) as ChannelPolicyProfile;
      policyService.setChannelPolicy(targetChannel.id, profile);
      const conf = POLICY_DEFINITIONS[profile];

      const embed = new EmbedBuilder()
        .setTitle("⚙️ Channel Safety Profile Updated")
        .setColor(0x5865f2)
        .addFields(
          { name: "Channel", value: `<#${targetChannel.id}>`, inline: true },
          { name: "Applied Profile", value: `\`${profile}\``, inline: true },
          { name: "Allow Mild Banter", value: conf.allowMildBanter ? "Yes" : "No", inline: true },
          { name: "Block All Profanity", value: conf.blockAllProfanity ? "Yes" : "No", inline: true },
          { name: "Crisis Helpline Routing", value: conf.priorityHelplineResponse ? "Enabled" : "Disabled", inline: true },
          { name: "Multimodal Image Screen", value: conf.requireImageScreening ? "Required" : "Optional", inline: true }
        )
        .setFooter({ text: "AegisMod Channel Sensitivity Manager" })
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    if (sub === "view") {
      const conf = policyService.getChannelPolicy(targetChannel.id);
      const embed = new EmbedBuilder()
        .setTitle(`⚙️ Safety Policy: #${targetChannel.name}`)
        .setColor(0x5865f2)
        .addFields(
          { name: "Current Profile", value: `\`${conf.profile}\``, inline: true },
          { name: "Gaming Banter", value: conf.allowMildBanter ? "Allowed" : "Filtered", inline: true },
          { name: "Profanity Filter", value: conf.blockAllProfanity ? "Strict" : "Standard", inline: true }
        )
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }
  },
};
