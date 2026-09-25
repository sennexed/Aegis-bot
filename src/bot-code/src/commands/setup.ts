/**
 * /setup Command
 * Interactive Server Onboarding Wizard with Discord Role Select Menus and Auto Log Channel Creation
 */

import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ComponentType,
  MessageFlags,
} from "discord.js";
import { RoleService } from "../services/roleService.js";
import { LoggingService } from "../services/loggingService.js";
import { guildMemoryService } from "../services/guildMemoryService.js";

export const setupCommand = {
  data: new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Configure AegisMod roles and initialize the dedicated #mod-logs audit channel")
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

    // Check if this guild is already remembered in permanent storage
    const existingMemory = guildMemoryService.getServer(interaction.guild.id);
    const isAlreadyConfigured = existingMemory?.isSetupComplete;

    // 1. Generate Interactive Role Select Menus
    const selectRows = roleService.createSetupRoleSelects(interaction.guild.id);

    const setupEmbed = new EmbedBuilder()
      .setTitle(
        isAlreadyConfigured
          ? "🛡️ AegisMod Server Setup (Stored in Permanent Memory)"
          : "🛡️ AegisMod Server Setup Wizard"
      )
      .setDescription(
        isAlreadyConfigured
          ? `ℹ️ **Server Already Setup:** This server's configuration was previously saved on <t:${Math.floor((existingMemory.configuredAt || Date.now()) / 1000)}:d> and is **immune to bot restarts**. You can modify staff role assignments below.`
          : "Welcome to **AegisMod**! Please configure your server's role hierarchy below. Once completed, your settings will be stored in **permanent memory** so you will never need to run `/setup` again after bot reboots."
      )
      .setColor(isAlreadyConfigured ? 0x57f287 : 0x5865f2)
      .addFields(
        {
          name: "1. Owner / Executive Role",
          value: "Bypasses all moderation checks and has full emergency override.",
        },
        {
          name: "2. Administrator Roles",
          value: "Can run `/setup`, `/cases`, and manage bot settings.",
        },
        {
          name: "3. Moderator Roles",
          value: "Can execute `/ban`, `/kick`, `/mute`, `/warn`, and read `#mod-logs`.",
        },
        {
          name: "4. Dedicated Audit Log Channel",
          value: "The bot will automatically create or bind `#mod-logs` visible only to staff.",
        },
        {
          name: "💾 Permanent Memory Guarantee",
          value: "All bindings are committed to persistent disk storage (`guild_memory.json`). Upon any bot crash or server restart, all 17 commands and configurations are restored automatically.",
        }
      )
      .setFooter({ text: "Select options below within 5 minutes to commit changes." });

    const message = await interaction.editReply({
      embeds: [setupEmbed],
      components: selectRows,
    });

    // Handle interactive selections
    let ownerRole: string | null = null;
    let adminRoles: string[] = [];
    let modRoles: string[] = [];
    let hasSyncedThisSession = Boolean(isAlreadyConfigured);

    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.RoleSelect,
      time: 5 * 60 * 1000,
    });

    collector.on("collect", async (menuInteraction) => {
      // 1. Immediately acknowledge the interaction to prevent Discord 3000ms timeout (DiscordAPIError 10062)
      try {
        if (!menuInteraction.deferred && !menuInteraction.replied) {
          await menuInteraction.deferUpdate();
        }
      } catch (deferErr: any) {
        // Safe catch if already acknowledged
      }

      if (menuInteraction.user.id !== interaction.user.id) {
        try {
          await menuInteraction.followUp({
            content: "Only the administrator who invoked /setup can configure roles.",
            flags: MessageFlags.Ephemeral,
          });
        } catch {
          // Ignore
        }
        return;
      }

      try {
        const customId = menuInteraction.customId;
        const selected = menuInteraction.values;

        if (customId.includes(":owner:")) {
          ownerRole = selected[0] || null;
        } else if (customId.includes(":admin:")) {
          adminRoles = selected;
        } else if (customId.includes(":mod:")) {
          modRoles = selected;
        }

        // Save role mapping
        roleService.saveGuildRoles(interaction.guildId!, ownerRole, adminRoles, modRoles);

        // Dynamically unlock and register moderation commands in this server (only once per session)
        if (syncCommands && !hasSyncedThisSession) {
          hasSyncedThisSession = true;
          syncCommands(interaction.guildId!, true).catch((e) => {
            console.warn("[Setup Command] Command sync error:", e?.message || e);
          });
        }

        // Auto-create or ensure dedicated #mod-logs channel
        const staffRoles = [...adminRoles, ...modRoles];
        if (ownerRole) staffRoles.push(ownerRole);

        const logChannel = await loggingService.ensureLogChannel(
          interaction.guild!,
          staffRoles
        );

        // Commit to permanent disk memory so reboots never prompt /setup again
        await guildMemoryService.saveServerSetup(
          interaction.guildId!,
          interaction.guild!.name,
          ownerRole,
          adminRoles,
          modRoles,
          logChannel.id,
          logChannel.name
        );

        const updatedEmbed = new EmbedBuilder()
          .setTitle("✅ AegisMod Configuration Committed to Permanent Memory")
          .setColor(0x57f287)
          .setDescription("Your server role hierarchy and audit log channels are now permanently saved to disk (`guild_memory.json`).")
          .addFields(
            {
              name: "👑 Owner Role",
              value: ownerRole ? `<@&${ownerRole}>` : "*None selected*",
              inline: true,
            },
            {
              name: "⚙️ Admin Roles",
              value: adminRoles.length ? adminRoles.map((r) => `<@&${r}>`).join(", ") : "*None selected*",
              inline: true,
            },
            {
              name: "🛡️ Moderator Roles",
              value: modRoles.length ? modRoles.map((r) => `<@&${r}>`).join(", ") : "*None selected*",
              inline: true,
            },
            {
              name: "📋 Dedicated Log Channel",
              value: `<#${logChannel.id}> (Bound & Restricted)`,
              inline: true,
            },
            {
              name: "💾 Persistence Status",
              value: "🟢 **Locked in Permanent Memory** — Restart immune. Will never demand setup again.",
              inline: true,
            }
          )
          .setFooter({ text: "AegisMod is active with all 17 commands registered." });

        // Update the setup message via the parent interaction editReply
        await interaction.editReply({
          embeds: [updatedEmbed],
          components: selectRows,
        });
      } catch (updateErr: any) {
        console.warn("[Setup Command] Error applying role updates:", updateErr?.message || updateErr);
      }
    });

    collector.on("end", async () => {
      // Disable components after timeout
      await interaction.editReply({ components: [] }).catch(() => null);
    });
  },
};
