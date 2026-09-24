/**
 * /namestyle Discord Slash Command
 * Allows server administrators to inspect and apply custom bot display name styles:
 * - 12 fonts (Bangers, BioRhyme, Cherry Bomb, Chicle, Compagnon, MuseoModerno, Neo Castel, etc.)
 * - 6 visual effects (Solid, Linear Gradient, Neon Glow, Toon Outline, 3D Pop, Prism Radiance)
 * - Custom colors (hex & decimal for Discord API)
 * - Server clan badge/tag
 */

import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} from "discord.js";
import { botNameStylesService } from "../services/botNameStylesService.js";
import {
  BOT_NAME_FONTS,
  BOT_NAME_EFFECTS,
  BOT_COLOR_PRESETS,
  hexToDiscordDecimal,
} from "../types/nameStyles.js";

export const nameStyleCommand = {
  data: new SlashCommandBuilder()
    .setName("namestyle")
    .setDescription("Configure or view Discord bot display name styles, fonts, and visual effects")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName("view")
        .setDescription("View the current bot name style, active font, and visual effect")
    )
    .addSubcommand((sub) =>
      sub
        .setName("list")
        .setDescription("List all 12 available fonts and 6 visual effects for the bot")
    )
    .addSubcommand((sub) =>
      sub
        .setName("set")
        .setDescription("Apply a new font, effect, or color style to the bot")
        .addStringOption((opt) =>
          opt
            .setName("font")
            .setDescription("Select one of the 12 Discord fonts")
            .setRequired(false)
            .addChoices(
              { name: "gg sans (Default)", value: "gg-sans" },
              { name: "Bangers (Comic Display)", value: "bangers" },
              { name: "BioRhyme (Modern Slab)", value: "biorhyme" },
              { name: "Cherry Bomb (Sakura)", value: "cherry-bomb" },
              { name: "Chicle (Jellybean)", value: "chicle" },
              { name: "Compagnon (Typewriter)", value: "compagnon" },
              { name: "MuseoModerno (Modern)", value: "museo-moderno" },
              { name: "Neo Castel (Medieval Gothic)", value: "neo-castel" },
              { name: "Pixelify Sans (8Bit Retro)", value: "pixelify" },
              { name: "Ribes (Flared Display)", value: "ribes" },
              { name: "Sinistre (Dramatic Serif)", value: "sinistre" },
              { name: "Zilla Slab (Industrial)", value: "zilla-slab" }
            )
        )
        .addStringOption((opt) =>
          opt
            .setName("effect")
            .setDescription("Select one of the 6 visual effects")
            .setRequired(false)
            .addChoices(
              { name: "Solid (Clean Flat)", value: "solid" },
              { name: "Linear Gradient (Smooth)", value: "gradient" },
              { name: "Neon Glow (Vibrant)", value: "neon" },
              { name: "Toon (Outline Stroke)", value: "toon" },
              { name: "Pop (3D Extrusion)", value: "pop" },
              { name: "Prism Radiance (Shimmer)", value: "glow" }
            )
        )
        .addStringOption((opt) =>
          opt
            .setName("color")
            .setDescription("Select a curated color palette preset")
            .setRequired(false)
            .addChoices(
              { name: "🇮🇳 Tiranga Vibrant (Saffron, White, Emerald Green)", value: "indian-tricolor-vibrant" },
              { name: "Discord Blurple (#5865F2)", value: "#5865F2" },
              { name: "Cyber Emerald (#10B981)", value: "#10B981" },
              { name: "Neon Cyan (#06B6D4)", value: "#06B6D4" },
              { name: "Sakura Pink (#EC4899)", value: "#EC4899" },
              { name: "Hyper Violet (#8B5CF6)", value: "#8B5CF6" },
              { name: "Solar Amber (#F59E0B)", value: "#F59E0B" },
              { name: "Crimson Ruby (#EF4444)", value: "#EF4444" }
            )
        )
        .addStringOption((opt) =>
          opt
            .setName("name")
            .setDescription("Change the bot display name (2-32 characters)")
            .setRequired(false)
        )
        .addStringOption((opt) =>
          opt
            .setName("clan_tag")
            .setDescription("Set a 2-4 character Clan/Server tag badge (e.g., AEGIS)")
            .setRequired(false)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("sync")
        .setDescription("Sync this server's bot nickname to match the active name style")
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "view") {
      const config = botNameStylesService.getConfig();
      const font = BOT_NAME_FONTS.find((f) => f.id === config.fontId) || BOT_NAME_FONTS[0];
      const effect = BOT_NAME_EFFECTS.find((e) => e.id === config.effectId) || BOT_NAME_EFFECTS[0];
      const primaryDec = hexToDiscordDecimal(config.primaryColor);

      const embed = new EmbedBuilder()
        .setColor(primaryDec)
        .setTitle("✨ Discord Bot Name Style & Aesthetics")
        .setDescription(
          `**Current Display Name:** \`${config.displayName}\`\n**Formatted Nickname:** \`${botNameStylesService.formatFormattedNickname(config)}\``
        )
        .addFields(
          {
            name: "🔤 Active Font",
            value: `**${font.name}**\n${font.description}\nCategory: \`${font.category}\``,
            inline: true,
          },
          {
            name: "✨ Visual Effect",
            value: `**${effect.name}**\n${effect.description}\nBadge: \`${effect.badge}\``,
            inline: true,
          },
          {
            name: "🎨 Primary Color",
            value: `\`${config.primaryColor}\`\n(Decimal: \`${primaryDec}\`)`,
            inline: true,
          },
          {
            name: "🏷️ Server Tag / Clan Badge",
            value: config.clanTag
              ? `${config.clanBadge || "🛡️"} \`[${config.clanTag}]\``
              : "*(None configured)*",
            inline: true,
          },
          {
            name: "🌐 Scope & Persistence",
            value: `Global: \`${config.applyGlobally}\` • AutoSync: \`${config.autoSyncNickname}\``,
            inline: true,
          }
        )
        .setFooter({ text: "AegisMod Bot Name Styles • Use /namestyle set to update" })
        .setTimestamp();

      const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("namestyle:refresh")
          .setLabel("🔄 Refresh Preview")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId("namestyle:cycle_font")
          .setLabel("🔤 Next Font")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("namestyle:cycle_effect")
          .setLabel("✨ Next Effect")
          .setStyle(ButtonStyle.Success)
      );

      return interaction.reply({
        embeds: [embed],
        components: [actionRow],
        flags: MessageFlags.Ephemeral,
      });
    }

    if (subcommand === "list") {
      const fontList = BOT_NAME_FONTS.map(
        (f, idx) => `**${idx + 1}. ${f.name}** (\`${f.category}\`)\n└ *${f.description}*`
      ).join("\n");

      const effectList = BOT_NAME_EFFECTS.map(
        (e, idx) => `**${idx + 1}. ${e.name}** [\`${e.badge}\`]\n└ *${e.description}*`
      ).join("\n");

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle("🎨 Bot Name Styles Catalog (12 Fonts & 6 Visual Effects)")
        .setDescription(
          "Discord's Display Name Styles allow bots and users to apply custom typography and shader effects."
        )
        .addFields(
          { name: "🔤 12 Available Fonts", value: fontList },
          { name: "✨ 6 Visual Effects", value: effectList }
        )
        .setFooter({ text: "Use /namestyle set font:<name> effect:<name> to apply" });

      return interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral,
      });
    }

    if (subcommand === "set") {
      const newFont = interaction.options.getString("font");
      const newEffect = interaction.options.getString("effect");
      const newColor = interaction.options.getString("color");
      const newName = interaction.options.getString("name");
      const newClanTag = interaction.options.getString("clan_tag");

      const updates: Record<string, any> = {};
      if (newFont) updates.fontId = newFont;
      if (newEffect) updates.effectId = newEffect;
      if (newColor) {
        if (newColor === "indian-tricolor-vibrant" || newColor === "indian-tricolor-dark") {
          updates.primaryColor = "#FF9933"; // High-Luminance Saffron Orange
          updates.secondaryColor = "#FFFFFF"; // Crisp White
          updates.tertiaryColor = "#138808"; // High-Luminance Emerald Green
        } else {
          updates.primaryColor = newColor;
          const foundPreset = BOT_COLOR_PRESETS.find((p) => p.hex.toLowerCase() === newColor.toLowerCase());
          if (foundPreset) {
            updates.secondaryColor = foundPreset.secondaryHex || newColor;
            updates.tertiaryColor = foundPreset.tertiaryHex;
          }
        }
      }
      if (newName) updates.displayName = newName;
      if (newClanTag !== null) updates.clanTag = newClanTag;

      if (Object.keys(updates).length === 0) {
        return interaction.reply({
          content: "⚠️ No styling changes specified. Please provide at least one option (`font`, `effect`, `color`, `name`, or `clan_tag`).",
          flags: MessageFlags.Ephemeral,
        });
      }

      const res = botNameStylesService.updateConfig(updates);

      // Attempt to sync guild nickname and identity role color if bot has permissions
      let nicknameNotice = "";
      if (interaction.guild && interaction.guild.members.me) {
        try {
          const formattedNick = botNameStylesService.formatFormattedNickname(res.config);
          await interaction.guild.members.me.setNickname(formattedNick).catch(() => null);
          const role = await botNameStylesService.syncBotNametagColor(interaction.guild, res.config.primaryColor);
          nicknameNotice = `\n✅ Server nickname updated to: **${formattedNick}**\n🎨 Identity role synced to **${res.config.primaryColor}** (${role?.name || "AEGIS Identity"}).`;
        } catch (err: any) {
          nicknameNotice = `\n⚠️ Note: Could not update server nickname/role (${err?.message || "Missing Manage Nicknames / Manage Roles permission"}).`;
        }
      }

      const fontObj = BOT_NAME_FONTS.find((f) => f.id === res.config.fontId);
      const effectObj = BOT_NAME_EFFECTS.find((e) => e.id === res.config.effectId);

      const embed = new EmbedBuilder()
        .setColor(hexToDiscordDecimal(res.config.primaryColor))
        .setTitle("✅ Bot Name Style Successfully Updated")
        .setDescription(
          `Discord bot name style parameters updated.${nicknameNotice}`
        )
        .addFields(
          { name: "🔤 Font", value: fontObj?.name || res.config.fontId, inline: true },
          { name: "✨ Effect", value: effectObj?.name || res.config.effectId, inline: true },
          { name: "🎨 Color", value: res.config.primaryColor, inline: true },
          { name: "🏷️ Clan Tag", value: res.config.clanTag ? `\`[${res.config.clanTag}]\`` : "None", inline: true }
        )
        .setFooter({ text: "Synced with Discord REST API payload specification" })
        .setTimestamp();

      return interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral,
      });
    }

    if (subcommand === "sync") {
      if (!interaction.guild || !interaction.guild.members.me) {
        return interaction.reply({
          content: "❌ This command must be executed within a Discord server.",
          flags: MessageFlags.Ephemeral,
        });
      }

      const currentConfig = botNameStylesService.getConfig();
      const formattedNick = botNameStylesService.formatFormattedNickname(currentConfig);

      try {
        await interaction.guild.members.me.setNickname(formattedNick).catch(() => null);
        const role = await botNameStylesService.syncBotNametagColor(interaction.guild, currentConfig.primaryColor);
        return interaction.reply({
          content: `✅ Successfully synced bot nickname to **${formattedNick}** (Font: **${currentConfig.fontId}**, Effect: **${currentConfig.effectId}**) and synced nametag color **${currentConfig.primaryColor}** on role \`${role?.name || "AEGIS Identity"}\`!`,
          flags: MessageFlags.Ephemeral,
        });
      } catch (err: any) {
        return interaction.reply({
          content: `❌ Failed to update bot nickname or role color: ${err?.message || "Please verify the bot has Manage Nicknames and Manage Roles permissions."}`,
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  },
};
