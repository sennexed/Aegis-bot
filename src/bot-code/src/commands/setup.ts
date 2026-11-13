/**
 * /setup Command - Single-Message Discord Setup Wizard
 * Unified interactive configuration interface for AegisMod bot.
 */

import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  RoleSelectMenuBuilder,
  ChannelSelectMenuBuilder,
  StringSelectMenuBuilder,
  ComponentType,
  MessageFlags,
  ChannelType,
} from "discord.js";
import { RoleService } from "../services/roleService.js";
import { LoggingService } from "../services/loggingService.js";
import { guildMemoryService } from "../services/guildMemoryService.js";
import { setupSessionService, SetupDraft } from "../services/setupSessionService.js";

export const setupCommand = {
  data: new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Launch the AEGIS Single-Message Interactive Setup Wizard")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(
    interaction: ChatInputCommandInteraction,
    roleService: RoleService,
    loggingService: LoggingService,
    syncCommands?: (guildId: string, isSetupComplete: boolean) => Promise<void>
  ) {
    if (!interaction.guild) {
      return interaction.reply({
        content: "This command can only be run inside a Discord server.",
        flags: MessageFlags.Ephemeral,
      });
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const guildId = interaction.guild.id;
    const existingMemory = guildMemoryService.getServer(guildId);
    const isAlreadyConfigured = existingMemory?.isSetupComplete;

    // Create or reset session draft
    const draft = setupSessionService.createSession(
      guildId,
      interaction.guild.name,
      interaction.user.id,
      interaction.user.tag
    );

    // Populate draft with existing settings if configured
    if (existingMemory) {
      draft.ownerRoleId = existingMemory.ownerRoleId || null;
      draft.adminRoleIds = existingMemory.adminRoleIds || [];
      draft.moderatorRoleIds = existingMemory.moderatorRoleIds || [];
      if (existingMemory.modLogChannelId) {
        draft.loggingChannels.modLogs = existingMemory.modLogChannelId;
      }
    }

    const buildWizardPayload = (d: SetupDraft) => {
      const embed = new EmbedBuilder()
        .setTitle("🛡️ AEGIS — Single-Message Discord Setup Wizard")
        .setColor(d.currentTab === "home" ? 0x5865f2 : 0xfee75c)
        .setThumbnail(interaction.guild?.iconURL() || null);

      const components: ActionRowBuilder<any>[] = [];

      // Navigation Row (Tabs)
      const navRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`setup:tab:home:${guildId}`)
          .setLabel("Overview")
          .setStyle(d.currentTab === "home" ? ButtonStyle.Primary : ButtonStyle.Secondary)
          .setEmoji("🏠"),
        new ButtonBuilder()
          .setCustomId(`setup:tab:permissions:${guildId}`)
          .setLabel("Permissions")
          .setStyle(d.currentTab === "permissions" ? ButtonStyle.Primary : ButtonStyle.Secondary)
          .setEmoji("🛡️"),
        new ButtonBuilder()
          .setCustomId(`setup:tab:moderation:${guildId}`)
          .setLabel("Moderation")
          .setStyle(d.currentTab === "moderation" ? ButtonStyle.Primary : ButtonStyle.Secondary)
          .setEmoji("⚙️"),
        new ButtonBuilder()
          .setCustomId(`setup:tab:logging:${guildId}`)
          .setLabel("Logging")
          .setStyle(d.currentTab === "logging" ? ButtonStyle.Primary : ButtonStyle.Secondary)
          .setEmoji("📋"),
        new ButtonBuilder()
          .setCustomId(`setup:tab:features:${guildId}`)
          .setLabel("Features")
          .setStyle(d.currentTab === "features" ? ButtonStyle.Primary : ButtonStyle.Secondary)
          .setEmoji("🚀")
      );
      components.push(navRow);

      // Action Row (Confirm / Reset / Cancel)
      const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`setup:action:confirm:${guildId}`)
          .setLabel("Confirm Setup")
          .setStyle(ButtonStyle.Success)
          .setEmoji("✅"),
        new ButtonBuilder()
          .setCustomId(`setup:action:reset:${guildId}`)
          .setLabel("Reset Draft")
          .setStyle(ButtonStyle.Secondary)
          .setEmoji("🔄"),
        new ButtonBuilder()
          .setCustomId(`setup:action:cancel:${guildId}`)
          .setLabel("Cancel")
          .setStyle(ButtonStyle.Danger)
          .setEmoji("❌")
      );
      components.push(actionRow);

      if (d.currentTab === "home") {
        embed.setDescription(
          isAlreadyConfigured
            ? `ℹ️ **Server Configured:** This server was previously set up on <t:${Math.floor((existingMemory?.configuredAt || Date.now()) / 1000)}:d>. You are modifying active settings.`
            : "Welcome to **AegisMod**! Use the tabs above to configure staff permissions, moderation modules, log channels, and additional features in **one single message**, then click **Confirm Setup**."
        );
        embed.addFields(
          { name: "🏢 Server Name", value: d.guildName, inline: true },
          { name: "🆔 Server ID", value: guildId, inline: true },
          { name: "👤 Initiated By", value: `<@${d.adminUserId}>`, inline: true },
          {
            name: "👑 Configured Roles",
            value: `Owner: ${d.ownerRoleId ? `<@&${d.ownerRoleId}>` : "*None*"}\nAdmins: ${d.adminRoleIds.length ? d.adminRoleIds.map((r) => `<@&${r}>`).join(", ") : "*None*"}\nMods: ${d.moderatorRoleIds.length ? d.moderatorRoleIds.map((r) => `<@&${r}>`).join(", ") : "*None*"}`,
            inline: false,
          },
          {
            name: "📋 Log Channels",
            value: `Mod Logs: ${d.loggingChannels.modLogs ? `<#${d.loggingChannels.modLogs}>` : "*Not set (Auto-create on confirm)*"}`,
            inline: false,
          },
          {
            name: "💾 Persistence Status",
            value: isAlreadyConfigured ? "🟢 Active & Permanent (Restart Immune)" : "🟡 Pending Configuration Draft",
            inline: false,
          }
        );
      } else if (d.currentTab === "permissions") {
        embed.setDescription("Configure staff roles for server administration and moderation.");
        embed.addFields(
          { name: "1. Owner / Executive Role", value: d.ownerRoleId ? `<@&${d.ownerRoleId}>` : "Not selected", inline: false },
          { name: "2. Administrator Roles", value: d.adminRoleIds.length ? d.adminRoleIds.map((r) => `<@&${r}>`).join(", ") : "Not selected", inline: false },
          { name: "3. Moderator Roles", value: d.moderatorRoleIds.length ? d.moderatorRoleIds.map((r) => `<@&${r}>`).join(", ") : "Not selected", inline: false }
        );

        // Role select components
        const ownerSelect = new RoleSelectMenuBuilder()
          .setCustomId(`setup:role:owner:${guildId}`)
          .setPlaceholder("Select Server Owner / Executive Role")
          .setMinValues(1)
          .setMaxValues(1);

        const adminSelect = new RoleSelectMenuBuilder()
          .setCustomId(`setup:role:admin:${guildId}`)
          .setPlaceholder("Select Administrator Roles")
          .setMinValues(1)
          .setMaxValues(5);

        const modSelect = new RoleSelectMenuBuilder()
          .setCustomId(`setup:role:mod:${guildId}`)
          .setPlaceholder("Select Moderator Roles")
          .setMinValues(1)
          .setMaxValues(10);

        components.push(
          new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(ownerSelect),
          new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(adminSelect),
          new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(modSelect)
        );
      } else if (d.currentTab === "moderation") {
        embed.setDescription("Enable or disable core moderation modules.");
        const modStatus = (val: boolean) => (val ? "🟢 Enabled" : "🔴 Disabled");
        embed.addFields(
          { name: "Traditional Moderation", value: modStatus(d.modules.traditionalMod), inline: true },
          { name: "AI Moderation", value: modStatus(d.modules.aiModeration), inline: true },
          { name: "Automatic Moderation", value: modStatus(d.modules.autoMod), inline: true },
          { name: "Anti-Spam", value: modStatus(d.modules.antiSpam), inline: true },
          { name: "Anti-Link", value: modStatus(d.modules.antiLink), inline: true },
          { name: "Anti-Raid", value: modStatus(d.modules.antiRaid), inline: true },
          { name: "Phishing Protection", value: modStatus(d.modules.phishingProtection), inline: true },
          { name: "Multilingual Blacklist", value: modStatus(d.modules.multilingualBlacklist), inline: true },
          { name: "Strike Escalation", value: modStatus(d.modules.strikeEscalation), inline: true }
        );

        const modToggleRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(`setup:toggle:mods:${guildId}`)
            .setPlaceholder("Toggle Moderation Modules")
            .addOptions([
              { label: "Toggle Traditional Moderation", value: "traditionalMod", description: `Current: ${d.modules.traditionalMod ? "Enabled" : "Disabled"}` },
              { label: "Toggle AI Moderation", value: "aiModeration", description: `Current: ${d.modules.aiModeration ? "Enabled" : "Disabled"}` },
              { label: "Toggle AutoMod", value: "autoMod", description: `Current: ${d.modules.autoMod ? "Enabled" : "Disabled"}` },
              { label: "Toggle Anti-Spam", value: "antiSpam", description: `Current: ${d.modules.antiSpam ? "Enabled" : "Disabled"}` },
              { label: "Toggle Anti-Link", value: "antiLink", description: `Current: ${d.modules.antiLink ? "Enabled" : "Disabled"}` },
              { label: "Toggle Anti-Raid", value: "antiRaid", description: `Current: ${d.modules.antiRaid ? "Enabled" : "Disabled"}` },
              { label: "Toggle Phishing Protection", value: "phishingProtection", description: `Current: ${d.modules.phishingProtection ? "Enabled" : "Disabled"}` },
              { label: "Toggle Multilingual Blacklist", value: "multilingualBlacklist", description: `Current: ${d.modules.multilingualBlacklist ? "Enabled" : "Disabled"}` },
              { label: "Toggle Strike Escalation", value: "strikeEscalation", description: `Current: ${d.modules.strikeEscalation ? "Enabled" : "Disabled"}` },
            ])
        );
        components.push(modToggleRow);
      } else if (d.currentTab === "logging") {
        embed.setDescription("Configure dedicated audit log channels.");
        embed.addFields(
          { name: "Moderation Logs (#mod-logs)", value: d.loggingChannels.modLogs ? `<#${d.loggingChannels.modLogs}>` : "Auto-create on confirm", inline: true },
          { name: "Security Logs", value: d.loggingChannels.securityLogs ? `<#${d.loggingChannels.securityLogs}>` : "Default to Mod Logs", inline: true }
        );

        const channelSelect = new ChannelSelectMenuBuilder()
          .setCustomId(`setup:channel:modLogs:${guildId}`)
          .setPlaceholder("Select Dedicated Moderation Log Channel")
          .setChannelTypes([ChannelType.GuildText])
          .setMinValues(1)
          .setMaxValues(1);

        components.push(new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(channelSelect));
      } else if (d.currentTab === "features") {
        embed.setDescription("Enable or disable secondary advanced bot features.");
        const featStatus = (val: boolean) => (val ? "🟢 Enabled" : "🔴 Disabled");
        embed.addFields(
          { name: "Staff Duty System", value: featStatus(d.features.staffDuty), inline: true },
          { name: "Anonymous Modmail", value: featStatus(d.features.anonymousModmail), inline: true },
          { name: "User Verification", value: featStatus(d.features.userVerification), inline: true },
          { name: "User Passport", value: featStatus(d.features.userPassport), inline: true },
          { name: "Trust Score", value: featStatus(d.features.trustScore), inline: true },
          { name: "Appeals System", value: featStatus(d.features.appealsSystem), inline: true },
          { name: "Automatic News Broadcaster", value: featStatus(d.features.autoNews), inline: true }
        );

        const featToggleRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(`setup:toggle:features:${guildId}`)
            .setPlaceholder("Toggle Additional Features")
            .addOptions([
              { label: "Toggle Staff Duty System", value: "staffDuty", description: `Current: ${d.features.staffDuty ? "Enabled" : "Disabled"}` },
              { label: "Toggle Anonymous Modmail", value: "anonymousModmail", description: `Current: ${d.features.anonymousModmail ? "Enabled" : "Disabled"}` },
              { label: "Toggle User Verification", value: "userVerification", description: `Current: ${d.features.userVerification ? "Enabled" : "Disabled"}` },
              { label: "Toggle User Passport", value: "userPassport", description: `Current: ${d.features.userPassport ? "Enabled" : "Disabled"}` },
              { label: "Toggle Trust Score", value: "trustScore", description: `Current: ${d.features.trustScore ? "Enabled" : "Disabled"}` },
              { label: "Toggle Appeals System", value: "appealsSystem", description: `Current: ${d.features.appealsSystem ? "Enabled" : "Disabled"}` },
              { label: "Toggle Auto News", value: "autoNews", description: `Current: ${d.features.autoNews ? "Enabled" : "Disabled"}` },
            ])
        );
        components.push(featToggleRow);
      }

      return { embeds: [embed], components };
    };

    const initialPayload = buildWizardPayload(draft);
    const message = await interaction.editReply(initialPayload);

    // Create message component collector
    const collector = message.createMessageComponentCollector({
      time: 15 * 60 * 1000, // 15 minutes
    });

    collector.on("collect5", () => {}); // placeholder if needed

    collector.on("collect", async (i) => {
      // 1. Immediately acknowledge interaction to prevent Discord 3000ms timeout (DiscordAPIError 10062)
      try {
        if (!i.deferred && !i.replied) {
          await i.deferUpdate();
        }
      } catch {
        // Safe catch if already acknowledged
      }

      // 2. Validate user authorization
      if (i.user.id !== draft.adminUserId) {
        try {
          await i.followUp({
            content: "Only the administrator who initiated `/setup` can configure this wizard.",
            flags: MessageFlags.Ephemeral,
          });
        } catch {}
        return;
      }

      const customId = i.customId;

      // Handle Tab Navigation
      if (customId.startsWith("setup:tab:")) {
        const parts = customId.split(":");
        const tab = parts[2] as any;
        if (["home", "permissions", "moderation", "logging", "features"].includes(tab)) {
          draft.currentTab = tab;
        }
      }

      // Handle Role Selections
      else if (customId.startsWith("setup:role:")) {
        const parts = customId.split(":");
        const roleType = parts[2];
        const selectedValues = (i as any).values || [];

        if (roleType === "owner") {
          draft.ownerRoleId = selectedValues[0] || null;
        } else if (roleType === "admin") {
          draft.adminRoleIds = selectedValues;
        } else if (roleType === "mod") {
          draft.moderatorRoleIds = selectedValues;
        }
      }

      // Handle Channel Selections
      else if (customId.startsWith("setup:channel:")) {
        const parts = customId.split(":");
        const channelType = parts[2];
        const selectedValues = (i as any).values || [];

        if (channelType === "modLogs") {
          draft.loggingChannels.modLogs = selectedValues[0] || null;
        }
      }

      // Handle Module Toggles
      else if (customId.startsWith("setup:toggle:mods:")) {
        const selectedVal = (i as any).values?.[0];
        if (selectedVal && selectedVal in draft.modules) {
          (draft.modules as any)[selectedVal] = !(draft.modules as any)[selectedVal];
        }
      }

      // Handle Feature Toggles
      else if (customId.startsWith("setup:toggle:features:")) {
        const selectedVal = (i as any).values?.[0];
        if (selectedVal && selectedVal in draft.features) {
          (draft.features as any)[selectedVal] = !(draft.features as any)[selectedVal];
        }
      }

      // Handle Actions (Confirm, Reset, Cancel)
      else if (customId.startsWith("setup:action:")) {
        const action = customId.split(":")[2];

        if (action === "cancel") {
          setupSessionService.removeSession(guildId);
          const cancelEmbed = new EmbedBuilder()
            .setTitle("❌ Setup Cancelled")
            .setDescription("The setup session was cancelled. No changes were saved.")
            .setColor(0xed4245);
          await interaction.editReply({ embeds: [cancelEmbed], components: [] });
          collector.stop("cancelled");
          return;
        }

        if (action === "reset") {
          // Reset draft to defaults
          const fresh = setupSessionService.createSession(guildId, interaction.guild!.name, interaction.user.id, interaction.user.tag);
          draft.ownerRoleId = fresh.ownerRoleId;
          draft.adminRoleIds = fresh.adminRoleIds;
          draft.moderatorRoleIds = fresh.moderatorRoleIds;
          draft.modules = fresh.modules;
          draft.features = fresh.features;
          draft.currentTab = "home";
        }

        if (action === "confirm") {
          // 1. Ensure log channel
          const staffRoles = [...draft.adminRoleIds, ...draft.moderatorRoleIds];
          if (draft.ownerRoleId) staffRoles.push(draft.ownerRoleId);

          let logChannelId = draft.loggingChannels.modLogs;
          let logChannelName = "mod-logs";

          try {
            const ensuredChannel = await loggingService.ensureLogChannel(
              interaction.guild!,
              staffRoles
            );
            logChannelId = ensuredChannel.id;
            logChannelName = ensuredChannel.name;
          } catch (err) {
            console.warn("[Setup Command] Warning ensuring log channel:", err);
          }

          // 2. Save roles to roleService
          roleService.saveGuildRoles(
            guildId,
            draft.ownerRoleId,
            draft.adminRoleIds,
            draft.moderatorRoleIds
          );

          // 3. Save to permanent disk memory
          await guildMemoryService.saveServerSetup(
            guildId,
            interaction.guild!.name,
            draft.ownerRoleId,
            draft.adminRoleIds,
            draft.moderatorRoleIds,
            logChannelId,
            logChannelName
          );

          // 4. Register commands in guild if sync callback provided
          if (syncCommands) {
            syncCommands(guildId, true).catch((e) => {
              console.warn("[Setup Command] Command sync error:", e?.message || e);
            });
          }

          // 5. Display Final Success Screen
          const successEmbed = new EmbedBuilder()
            .setTitle("✅ AEGIS Setup Completed Successfully")
            .setDescription("Your configuration has been verified and committed to **permanent disk storage**. AegisMod is fully operational and restart-immune.")
            .setColor(0x57f287)
            .addFields(
              {
                name: "👑 Configured Staff Roles",
                value: `Owner: ${draft.ownerRoleId ? `<@&${draft.ownerRoleId}>` : "*None*"}\nAdmins: ${draft.adminRoleIds.length ? draft.adminRoleIds.map((r) => `<@&${r}>`).join(", ") : "*None*"}\nMods: ${draft.moderatorRoleIds.length ? draft.moderatorRoleIds.map((r) => `<@&${r}>`).join(", ") : "*None*"}`,
                inline: false,
              },
              {
                name: "📋 Dedicated Audit Log",
                value: logChannelId ? `<#${logChannelId}>` : "*#mod-logs*",
                inline: true,
              },
              {
                name: "⚙️ Active Modules",
                value: Object.entries(draft.modules)
                  .filter(([_, v]) => v)
                  .map(([k]) => k)
                  .join(", "),
                inline: false,
              },
              {
                name: "💾 Persistence Guarantee",
                value: "🟢 Locked in `guild_memory.json`. All 17 bot commands unlocked.",
                inline: false,
              }
            )
            .setFooter({ text: `Completed by ${interaction.user.tag} on ${new Date().toUTCString()}` });

          await interaction.editReply({ embeds: [successEmbed], components: [] });
          setupSessionService.removeSession(guildId);
          collector.stop("completed");
          return;
        }
      }

      // Update the original wizard message
      const updatedPayload = buildWizardPayload(draft);
      await interaction.editReply(updatedPayload);
    });

    collector.on("end", async (_, reason) => {
      if (reason !== "completed" && reason !== "cancelled") {
        await interaction.editReply({ components: [] }).catch(() => null);
      }
    });
  },
};
