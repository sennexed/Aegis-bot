/**
 * AegisMod - Main Bot Entry Point
 * Discord Hybrid Moderation Bot for Teen Communities
 * Powered by Gemini 3.8 Flash & discord.js v14
 */

import {
  Client,
  GatewayIntentBits,
  Partials,
  REST,
  Routes,
  Events,
  ActivityType,
  MessageFlags,
  GuildMember,
  EmbedBuilder,
} from "discord.js";
import dotenv from "dotenv";

import { LoggingService } from "./services/loggingService.js";
import { RoleService } from "./services/roleService.js";
import { TraditionalModService } from "./services/traditionalModService.js";
import { TriageService } from "./services/triageService.js";
import { GeminiModerationService } from "./services/geminiModerationService.js";
import { AutoModService } from "./services/autoModService.js";
import { AntiRaidService } from "./services/antiRaidService.js";
import { ChannelPolicyService } from "./services/channelPolicyService.js";
import { ANALYTICS_SERVICE } from "./services/analyticsService.js";
import { DutyService } from "./services/dutyService.js";
import { ModMailService } from "./services/modMailService.js";
import { AuditExportService } from "./services/auditExportService.js";

import { setupCommand } from "./commands/setup.js";
import { moderationCommands } from "./commands/moderation.js";
import { autoModCommand } from "./commands/automod.js";
import { testModCommand } from "./commands/testmod.js";
import { userInfoCommand } from "./commands/userinfo.js";
import { antiRaidCommand } from "./commands/antiraid.js";
import { channelPolicyCommand } from "./commands/channelpolicy.js";
import { reportMessageContextMenu } from "./commands/reportMessage.js";
import { appealCommand } from "./commands/appeal.js";
import { modStatsCommand } from "./commands/modstats.js";
import { dutyCommand } from "./commands/duty.js";
import { modMailCommand } from "./commands/modmail.js";
import { exportLogsCommand } from "./commands/exportlogs.js";
import { reportCommand } from "./commands/report.js";

import { handleMessageCreate } from "./events/messageCreate.js";
import { handleMessageUpdate } from "./events/messageUpdate.js";
import { handleMessageDelete } from "./events/messageDelete.js";
import { handleGuildMemberAdd } from "./events/guildMemberAdd.js";

dotenv.config();

// 1. Initialize Discord Client with Required Gateway Intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // PRIVILEGED: Enable in Discord Developer Portal
    GatewayIntentBits.GuildMembers,   // PRIVILEGED: Enable in Discord Developer Portal
    GatewayIntentBits.GuildModeration,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.User],
});

// 2. Instantiate Modular Services
const loggingService = new LoggingService();
const roleService = new RoleService();
const modService = new TraditionalModService(loggingService, roleService);
const triageService = new TriageService();
const geminiService = new GeminiModerationService(process.env.GEMINI_API_KEY);
const autoModService = new AutoModService();
const antiRaidService = new AntiRaidService(loggingService);
const channelPolicyService = new ChannelPolicyService();
const dutyService = new DutyService();
const modMailService = new ModMailService();
const auditExportService = new AuditExportService();

// 3. Register Slash Commands
export async function syncGuildCommands(guildId: string, isSetupComplete: boolean) {
  const token = process.env.DISCORD_BOT_TOKEN;
  const clientId = process.env.DISCORD_CLIENT_ID;
  if (!token || !clientId) return;

  const rest = new REST({ version: "10" }).setToken(token);

  // If server is not setup yet, ONLY expose /setup command
  // Once setup is completed, expose the full suite of moderation, protection & utility tools
  const fullCommands = [
    setupCommand.data.toJSON(),
    autoModCommand.data.toJSON(),
    testModCommand.data.toJSON(),
    userInfoCommand.data.toJSON(),
    antiRaidCommand.data.toJSON(),
    channelPolicyCommand.data.toJSON(),
    reportMessageContextMenu.data.toJSON(),
    appealCommand.data.toJSON(),
    modStatsCommand.data.toJSON(),
    dutyCommand.data.toJSON(),
    modMailCommand.data.toJSON(),
    exportLogsCommand.data.toJSON(),
    reportCommand.data.toJSON(),
    ...moderationCommands.map((c) => c.data.toJSON()),
  ];

  const commandsToRegister = isSetupComplete
    ? fullCommands
    : [setupCommand.data.toJSON()];

  try {
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
      body: commandsToRegister,
    });
    console.log(
      `[Commands] Guild ${guildId}: registered ${commandsToRegister.length} commands (Setup complete: ${isSetupComplete})`
    );
  } catch (err) {
    console.error(`Failed to register guild commands for ${guildId}:`, err);
  }
}

async function registerSlashCommands() {
  const token = process.env.DISCORD_BOT_TOKEN;
  const clientId = process.env.DISCORD_CLIENT_ID;

  if (!token || !clientId) {
    console.warn("⚠️ DISCORD_BOT_TOKEN or DISCORD_CLIENT_ID missing; skipping slash command registration.");
    return;
  }

  const rest = new REST({ version: "10" }).setToken(token);

  try {
    // Clear global moderation commands and register only /setup as base
    await rest.put(Routes.applicationCommands(clientId), {
      body: [setupCommand.data.toJSON()],
    });
    console.log("✅ Global commands updated: only /setup is default until server is configured.");

    // Sync each joined guild based on whether /setup has been completed
    for (const [guildId] of client.guilds.cache) {
      const isConfigured = roleService.isGuildConfigured(guildId);
      await syncGuildCommands(guildId, isConfigured);
    }
  } catch (err) {
    console.error("Failed to register slash commands:", err);
  }
}

// 4. Client Ready Event
client.once(Events.ClientReady, async (readyClient) => {
  console.log(`🛡️ AegisMod is online! Logged in as ${readyClient.user.tag}`);
  readyClient.user.setActivity("use /setup to set the bot up", {
    type: ActivityType.Watching,
  });

  await registerSlashCommands();

  // Periodic cache cleanup every 15 minutes
  setInterval(() => triageService.clearExpired(), 15 * 60 * 1000);
});

// Guild Join Event (New Server Added)
client.on(Events.GuildCreate, async (guild) => {
  console.log(`Joined new guild: ${guild.name} (${guild.id}) - registering /setup only until configured`);
  await syncGuildCommands(guild.id, false);
});

// Member Join Event (Anti-Raid Gatekeeper)
client.on(Events.GuildMemberAdd, (member) => {
  handleGuildMemberAdd(member, antiRaidService);
});

// 5. Interaction Create Event (Slash Commands, Context Menus, Modals, and Buttons)
client.on(Events.InteractionCreate, async (interaction) => {
  // A. Message Context Menu (Report to Staff)
  if (interaction.isMessageContextMenuCommand()) {
    if (interaction.commandName === "Report to Staff") {
      return reportMessageContextMenu.execute(interaction);
    }
  }

  // B. Modal Submit (Report to Staff Reason)
  if (interaction.isModalSubmit()) {
    if (interaction.customId.startsWith("report_modal:")) {
      const parts = interaction.customId.split(":");
      const channelId = parts[1];
      const messageId = parts[2];
      const reason = interaction.fields.getTextInputValue("report_reason");

      if (!interaction.guild) return;

      const channel = interaction.guild.channels.cache.get(channelId);
      if (channel && channel.isTextBased()) {
        const reportedMsg = await channel.messages.fetch(messageId).catch(() => null);
        if (reportedMsg) {
          const staffPing = roleService.getStaffPing(interaction.guild.id, dutyService);
          await loggingService.logUserReport(interaction.guild, interaction.user, reportedMsg, reason, staffPing);
        }
      }

      return interaction.reply({
        content: "✅ **Report Received.** On-duty moderators and staff have been alerted in `#mod-logs`.",
        flags: MessageFlags.Ephemeral,
      });
    }
  }

  // C. Interactive Button Clicks (Quick Actions & Appeals)
  if (interaction.isButton()) {
    if (!interaction.guild || !interaction.member) return;
    const staffMember = interaction.member as GuildMember;

    // Verify staff permission
    if (!roleService.isStaffOrExempt(staffMember)) {
      return interaction.reply({
        content: "⛔ Only authorized moderation staff can execute quick action buttons.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const [scope, action, targetUserId, extra] = interaction.customId.split(":");

    // Quick Action Mod-Log Buttons
    if (scope === "quickmod") {
      const targetMember = await interaction.guild.members.fetch(targetUserId).catch(() => null);

      if (action === "pardon") {
        const replyText = `🕊️ **Marked as False Positive / Pardoned** by <@${interaction.user.id}>.`;
        await interaction.reply({ content: replyText });
        return;
      }

      if (!targetMember) {
        return interaction.reply({ content: "⚠️ Target member is no longer in this server.", flags: MessageFlags.Ephemeral });
      }

      if (action === "mute1h") {
        await targetMember.timeout(3600000, `Quick Action by ${interaction.user.tag}`);
        await interaction.reply({ content: `⏳ <@${targetUserId}> timed out for 1 hour by <@${interaction.user.id}>.` });
      } else if (action === "mute24h") {
        await targetMember.timeout(86400000, `Quick Action by ${interaction.user.tag}`);
        await interaction.reply({ content: `🔇 <@${targetUserId}> timed out for 24 hours by <@${interaction.user.id}>.` });
      } else if (action === "kick") {
        await targetMember.kick(`Quick Action by ${interaction.user.tag}`);
        await interaction.reply({ content: `👢 <@${targetUserId}> kicked from the server by <@${interaction.user.id}>.` });
      } else if (action === "ban") {
        await targetMember.ban({ reason: `Quick Action by ${interaction.user.tag}` });
        await interaction.reply({ content: `🔨 <@${targetUserId}> banned from the server by <@${interaction.user.id}>.` });
      }
      return;
    }

    // Appeal Resolution Buttons
    if (scope === "appeal") {
      const appealId = targetUserId; // mapped from split
      const appealingUserId = extra;
      const approved = action === "accept";

      const appeal = modService.resolveAppeal(appealId, approved, interaction.user.tag);
      if (approved && appealingUserId) {
        const targetMember = await interaction.guild.members.fetch(appealingUserId).catch(() => null);
        if (targetMember && targetMember.communicationDisabledUntilTimestamp) {
          await targetMember.timeout(null, `Appeal approved by ${interaction.user.tag}`).catch(() => null);
        }
      }

      return interaction.reply({
        content: approved
          ? `✅ **Appeal ${appealId} APPROVED** by <@${interaction.user.id}>. User timeout lifted.`
          : `❌ **Appeal ${appealId} DENIED** by <@${interaction.user.id}>. Infraction stands.`,
      });
    }

    // Report Actions
    if (scope === "report") {
      if (action === "dismiss") {
        return interaction.reply({ content: `✅ Report dismissed by <@${interaction.user.id}>.` });
      } else if (action === "delete") {
        const [channelId, messageId] = [targetUserId, extra];
        const channel = interaction.guild.channels.cache.get(channelId);
        if (channel && channel.isTextBased()) {
          const msg = await channel.messages.fetch(messageId).catch(() => null);
          if (msg) await msg.delete().catch(() => null);
        }
        return interaction.reply({ content: `🗑️ Reported message deleted by <@${interaction.user.id}>.` });
      }
    }
  }

  // D. Chat Input Slash Commands
  if (interaction.isChatInputCommand()) {
    const { commandName, guildId } = interaction;

    if (commandName === "setup") {
      return setupCommand.execute(interaction, roleService, loggingService, syncGuildCommands);
    }

    // Safety guard: if guild is not configured yet, decline execution and prompt /setup
    if (guildId && !roleService.isGuildConfigured(guildId)) {
      return interaction.reply({
        content:
          "⚠️ **AegisMod is not set up on this server yet.**\nAn Administrator must run `/setup` first to configure staff roles and `#mod-logs` before moderation commands are unlocked.",
        flags: MessageFlags.Ephemeral,
      });
    }

    if (commandName === "automod") {
      return autoModCommand.execute(interaction, autoModService);
    }

    if (commandName === "testmod") {
      return testModCommand.execute(interaction, autoModService, triageService, geminiService);
    }

    if (commandName === "userinfo") {
      return userInfoCommand.execute(interaction, modService);
    }

    if (commandName === "antiraid") {
      return antiRaidCommand.execute(interaction, antiRaidService);
    }

    if (commandName === "channelpolicy") {
      return channelPolicyCommand.execute(interaction, channelPolicyService);
    }

    if (commandName === "appeal") {
      return appealCommand.execute(interaction, modService, loggingService);
    }

    if (commandName === "modstats") {
      return modStatsCommand.execute(interaction);
    }

    if (commandName === "duty") {
      return dutyCommand.execute(interaction, dutyService, roleService);
    }

    if (commandName === "modmail") {
      return modMailCommand.execute(interaction, modMailService, roleService, loggingService, dutyService);
    }

    if (commandName === "report") {
      return reportCommand.execute(interaction, loggingService, dutyService, roleService);
    }

    if (commandName === "exportlogs") {
      return exportLogsCommand.execute(interaction, auditExportService, modService, roleService);
    }

    const modCmd = moderationCommands.find((c) => c.data.name === commandName);
    if (modCmd) {
      return modCmd.execute(interaction, modService);
    }
  }
});

// 6. Message Event Listeners
client.on(Events.MessageCreate, async (message) => {
  // Support DM replies for active Mod-Mail tickets with on-duty staff ping
  if (message.channel.isDMBased() && !message.author.bot) {
    for (const [guildId, guild] of client.guilds.cache) {
      const activeTicket = modMailService.getActiveTicketForUser(guildId, message.author.id);
      if (activeTicket) {
        modMailService.addMessage(guildId, activeTicket.id, {
          senderId: message.author.id,
          senderTag: message.author.tag,
          content: message.content,
          isStaff: false,
        });

        const staffPing = roleService.getStaffPing(guildId, dutyService);
        await loggingService.logToModLogs(guild, {
          content: `📬 **MOD-MAIL TICKET UPDATE** • ${staffPing}`,
          embeds: [
            new EmbedBuilder()
              .setColor(0x38bdf8)
              .setTitle(`💬 User Reply • Ticket ${activeTicket.id}`)
              .setDescription(`**${message.author.tag}** sent a new response:\n>>> ${message.content}`)
              .setFooter({ text: `Reply using /modmail reply ticket_id:${activeTicket.id} message:...` })
              .setTimestamp(),
          ],
        });
        await message.reply("📬 Your response was forwarded to the on-duty moderation staff. They will reply to you here.");
        return;
      }
    }
  }

  handleMessageCreate(
    message,
    triageService,
    geminiService,
    loggingService,
    roleService,
    autoModService,
    channelPolicyService,
    modService
  );
});

client.on(Events.MessageUpdate, (oldMsg, newMsg) => {
  handleMessageUpdate(oldMsg, newMsg, loggingService, triageService, geminiService, roleService, autoModService);
});

client.on(Events.MessageDelete, (message) => {
  handleMessageDelete(message, loggingService);
});

// 7. Error Handling & Graceful Process Management
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection in AegisMod bot:", reason);
});

process.on("SIGINT", () => {
  console.log("Shutting down AegisMod cleanly...");
  client.destroy();
  process.exit(0);
});

// 8. Bot Login
if (process.env.DISCORD_BOT_TOKEN) {
  client.login(process.env.DISCORD_BOT_TOKEN).catch((err) => {
    console.error("Failed to login to Discord:", err.message);
  });
} else {
  console.log("ℹ️ DISCORD_BOT_TOKEN not provided in local environment. Running in sandbox/control mode.");
}
