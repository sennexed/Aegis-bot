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
} from "discord.js";
import { RoleService } from "../services/roleService.js";
import { LoggingService } from "../services/loggingService.js";

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
        ephemeral: true,
      });
    }

    await interaction.deferReply({ ephemeral: true });

    // 1. Generate Interactive Role Select Menus
    const selectRows = roleService.createSetupRoleSelects(interaction.guild.id);

    const setupEmbed = new EmbedBuilder()
      .setTitle("🛡️ AegisMod Server Setup Wizard")
      .setDescription(
        "Welcome to **AegisMod**! Please configure your server's role hierarchy below. " +
        "These roles will control command permissions and access to the dedicated audit log channel."
      )
      .setColor(0x5865f2)
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
        }
      )
      .setFooter({ text: "Select options below within 5 minutes to complete setup." });

    const message = await interaction.editReply({
      embeds: [setupEmbed],
      components: selectRows,
    });

    // Handle interactive selections
    let ownerRole: string | null = null;
    let adminRoles: string[] = [];
    let modRoles: string[] = [];

    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.RoleSelect,
      time: 5 * 60 * 1000,
    });

    collector.on("collect", async (menuInteraction) => {
      if (menuInteraction.user.id !== interaction.user.id) {
        return menuInteraction.reply({
          content: "Only the administrator who invoked /setup can configure roles.",
          ephemeral: true,
        });
      }

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

      // Dynamically unlock and register moderation commands in this server
      if (syncCommands) {
        await syncCommands(interaction.guildId!, true);
      }

      // Auto-create or ensure dedicated #mod-logs channel
      const staffRoles = [...adminRoles, ...modRoles];
      if (ownerRole) staffRoles.push(ownerRole);

      const logChannel = await loggingService.ensureLogChannel(
        interaction.guild!,
        staffRoles
      );

      const updatedEmbed = new EmbedBuilder()
        .setTitle("✅ AegisMod Configuration Updated")
        .setColor(0x57f287)
        .setDescription("Your role configuration has been updated!")
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
            value: `<#${logChannel.id}> (Auto-created with strict permissions)`,
            inline: false,
          }
        )
        .setFooter({ text: "AegisMod is now monitoring messages for teenage safety." });

      await menuInteraction.update({
        embeds: [updatedEmbed],
        components: selectRows,
      });
    });

    collector.on("end", async () => {
      // Disable components after timeout
      await interaction.editReply({ components: [] }).catch(() => null);
    });
  },
};
