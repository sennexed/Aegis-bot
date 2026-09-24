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
  Options,
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
import { LoaService } from "./services/loaService.js";
import { guildMemoryService } from "./services/guildMemoryService.js";

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
import { loaCommand } from "./commands/loa.js";
import { newsCommand } from "./commands/news.js";
import { nameStyleCommand } from "./commands/namestyle.js";
import { autoNewsBotService } from "./services/autoNewsBotService.js";
import { newsService } from "./services/newsService.js";
import { botNameStylesService } from "./services/botNameStylesService.js";
import { BOT_NAME_FONTS, BOT_NAME_EFFECTS, hexToDiscordDecimal } from "./types/nameStyles.js";

import { handleMessageCreate } from "./events/messageCreate.js";
import { handleMessageUpdate } from "./events/messageUpdate.js";
import { handleMessageDelete } from "./events/messageDelete.js";
import { handleGuildMemberAdd } from "./events/guildMemberAdd.js";



// 1. Initialize Discord Client with Required Gateway Intents & Low-Memory Sweepers
export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // PRIVILEGED: Enable in Discord Developer Portal
    GatewayIntentBits.GuildMembers,   // PRIVILEGED: Enable in Discord Developer Portal
    GatewayIntentBits.GuildModeration,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.User],
  makeCache: Options.cacheWithLimits({
    MessageManager: 50,
    PresenceManager: 0,
    ReactionManager: 0,
    ReactionUserManager: 0,
    VoiceStateManager: 0,
    AutoModerationRuleManager: 10,
    GuildScheduledEventManager: 0,
    StageInstanceManager: 0,
    ThreadMemberManager: 0,
  }),
  sweepers: {
    ...Options.DefaultSweeperSettings,
    messages: {
      interval: 300, // Sweep messages every 5 minutes
      lifetime: 900, // Drop messages older than 15 minutes
    },
    users: {
      interval: 3600,
      filter: () => (user) => user.id !== client.user?.id,
    },
    guildMembers: {
      interval: 3600,
      filter: () => (member) => member.id !== client.user?.id,
    },
  },
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
const loaService = new LoaService();

// 3. Register Slash Commands
export async function syncGuildCommands(guildId: string, isSetupComplete: boolean) {
  const token = process.env.DISCORD_BOT_TOKEN;
  const clientId = process.env.DISCORD_CLIENT_ID;
  if (!token || !clientId) return;

  const rest = new REST({ version: "10", timeout: 30000 }).setToken(token);

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
    loaCommand.data.toJSON(),
    newsCommand.data.toJSON(),
    nameStyleCommand.data.toJSON(),
    ...moderationCommands.map((c) => c.data.toJSON()),
  ];

  const commandsToRegister = isSetupComplete
    ? fullCommands
    : [setupCommand.data.toJSON()];

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
        body: commandsToRegister,
      });
      console.log(
        `[Commands] Guild ${guildId}: registered ${commandsToRegister.length} commands (Setup complete: ${isSetupComplete})`
      );
      break;
    } catch (err: any) {
      if (attempt < 3) {
        console.warn(`[Commands] Guild ${guildId} sync attempt ${attempt}/3 timed out/failed (${err?.message || err}). Retrying in 2s...`);
        await new Promise((r) => setTimeout(r, 2000));
      } else {
        console.warn(`[Commands] Notice: Could not sync slash commands to guild ${guildId} due to Discord API latency. Cached commands will remain active.`);
      }
    }
  }
}

async function registerSlashCommands() {
  const token = process.env.DISCORD_BOT_TOKEN;
  const clientId = process.env.DISCORD_CLIENT_ID;

  if (!token || !clientId) {
    console.warn("⚠️ DISCORD_BOT_TOKEN or DISCORD_CLIENT_ID missing; skipping slash command registration.");
    return;
  }

  const rest = new REST({ version: "10", timeout: 25000 }).setToken(token);

  let attempts = 0;
  while (attempts < 3) {
    attempts++;
    try {
      // Clear global moderation commands and register only /setup as base
      await rest.put(Routes.applicationCommands(clientId), {
        body: [setupCommand.data.toJSON()],
      });
      console.log("✅ Global commands synchronized successfully with Discord API.");

      // Sync each joined guild based on whether /setup has been completed in permanent memory
      for (const [guildId, guild] of client.guilds.cache) {
        const isConfigured = guildMemoryService.isServerSetup(guildId) || roleService.isGuildConfigured(guildId);
        await syncGuildCommands(guildId, isConfigured);
        if (isConfigured) {
          console.log(
            `[AegisMod Ready] Server '${guild.name}' (${guildId}) setup restored from permanent memory! 17 commands unlocked.`
          );
        }
      }
      break; // Succeeded, exit retry loop
    } catch (err: any) {
      console.warn(`[Commands] Discord API sync attempt ${attempts}/3: ${err?.message || err}. Retrying in 3s...`);
      if (attempts >= 3) {
        console.error("Failed to register slash commands after 3 attempts. Bot will continue running with cached commands.");
      } else {
        await new Promise((r) => setTimeout(r, 3000));
      }
    }
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
  const triageTimer = setInterval(() => triageService.clearExpired(), 15 * 60 * 1000);
  if (typeof triageTimer.unref === "function") {
    triageTimer.unref();
  }

  // Initialize AutoNews bot client
  autoNewsBotService.setClient(readyClient);

  // Sync bot display nickname style & nametag role color across connected guilds on startup
  try {
    const styleConfig = botNameStylesService.getConfig();
    if (styleConfig.autoSyncNickname) {
      await botNameStylesService.syncAcrossGuilds(readyClient, styleConfig);
      const styledNick = botNameStylesService.formatFormattedNickname(styleConfig);
      console.log(`[NameStyles] Applied styled nickname '${styledNick}' & nametag color '${styleConfig.primaryColor}' across connected guilds.`);
    }
  } catch (err) {
    console.warn("[NameStyles] Could not apply nickname/role color sync on startup:", err);
  }
});

// Guild Join Event (New Server Added)
client.on(Events.GuildCreate, async (guild) => {
  const isConfigured = guildMemoryService.isServerSetup(guild.id);
  console.log(
    `Joined guild: ${guild.name} (${guild.id}) - Setup status from permanent memory: ${isConfigured ? "ALREADY_CONFIGURED (Commands Unlocked)" : "PENDING_SETUP"}`
  );
  await syncGuildCommands(guild.id, isConfigured);
});

// Member Join Event (Anti-Raid Gatekeeper)
client.on(Events.GuildMemberAdd, (member) => {
  handleGuildMemberAdd(member, antiRaidService);
});

// 5. Interaction Create Event (Slash Commands, Context Menus, Modals, and Buttons)
client.on(Events.InteractionCreate, async (interaction) => {
  try {
    // A. Message Context Menu (Report to Staff)
    if (interaction.isMessageContextMenuCommand()) {
      if (interaction.commandName === "Report to Staff") {
        return await reportMessageContextMenu.execute(interaction);
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
            const staffPing = roleService.getStaffPing(interaction.guild.id, dutyService, loaService);
            await loggingService.logUserReport(interaction.guild, interaction.user, reportedMsg, reason, staffPing);
          }
        }

        return await interaction.reply({
          content: "✅ **Report Received.** On-duty moderators and staff have been alerted in `#mod-logs`.",
          flags: MessageFlags.Ephemeral,
        });
      }
    }

  // C. Interactive Button Clicks (Quick Actions & Appeals)
  if (interaction.isButton()) {
    // News digest pagination and refresh (accessible to all members)
    if (interaction.customId.startsWith("news:")) {
      const parts = interaction.customId.split(":");
      const newsAction = parts[1];
      const pageParam = parts[2] ? parseInt(parts[2], 10) : 1;

      if (newsAction === "noop") {
        return interaction.deferUpdate();
      }

      await interaction.deferUpdate();
      const articles = await newsService.fetchAll13Newspapers(newsAction === "refresh");
      const totalPages = Math.ceil(articles.length / 5);
      const targetPage = isNaN(pageParam) ? 1 : Math.min(Math.max(1, pageParam), totalPages);

      const embed = autoNewsBotService.create13NewspapersDigestEmbed(articles, targetPage, 5);
      const paginationRow = autoNewsBotService.createPaginationRow(targetPage, totalPages);

      return interaction.editReply({
        embeds: [embed],
        components: [paginationRow],
      });
    }

    // Bot Name Styles interactive controls (Refresh, Next Font, Next Effect)
    if (interaction.customId.startsWith("namestyle:")) {
      const action = interaction.customId.split(":")[1];
      const currentConfig = botNameStylesService.getConfig();

      if (action === "cycle_font") {
        const fontIdx = BOT_NAME_FONTS.findIndex((f) => f.id === currentConfig.fontId);
        const nextFont = BOT_NAME_FONTS[(fontIdx + 1) % BOT_NAME_FONTS.length];
        botNameStylesService.updateConfig({ fontId: nextFont.id });
      } else if (action === "cycle_effect") {
        const effectIdx = BOT_NAME_EFFECTS.findIndex((e) => e.id === currentConfig.effectId);
        const nextEffect = BOT_NAME_EFFECTS[(effectIdx + 1) % BOT_NAME_EFFECTS.length];
        botNameStylesService.updateConfig({ effectId: nextEffect.id });
      }

      const updated = botNameStylesService.getConfig();
      const font = BOT_NAME_FONTS.find((f) => f.id === updated.fontId) || BOT_NAME_FONTS[0];
      const effect = BOT_NAME_EFFECTS.find((e) => e.id === updated.effectId) || BOT_NAME_EFFECTS[0];
      const primaryDec = hexToDiscordDecimal(updated.primaryColor);

      // Attempt to sync server nickname if applicable
      if (interaction.guild && interaction.guild.members.me) {
        try {
          const nick = botNameStylesService.formatFormattedNickname(updated);
          await interaction.guild.members.me.setNickname(nick);
        } catch {
          // Ignore missing permissions gracefully
        }
      }

      const embed = new EmbedBuilder()
        .setColor(primaryDec)
        .setTitle("✨ Discord Bot Name Style & Aesthetics")
        .setDescription(
          `**Current Display Name:** \`${updated.displayName}\`\n**Formatted Nickname:** \`${botNameStylesService.formatFormattedNickname(updated)}\``
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
            value: `\`${updated.primaryColor}\`\n(Decimal: \`${primaryDec}\`)`,
            inline: true,
          },
          {
            name: "🏷️ Server Tag / Clan Badge",
            value: updated.clanTag
              ? `${updated.clanBadge || "🛡️"} \`[${updated.clanTag}]\``
              : "*(None configured)*",
            inline: true,
          }
        )
        .setFooter({ text: "AegisMod Bot Name Styles • Interactive Preview" })
        .setTimestamp();

      return interaction.update({
        embeds: [embed],
      });
    }

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

      if (action === "warn") {
        try {
          await targetMember.send(`⚠️ **Friendly Server Reminder**: A message you posted in **${interaction.guild?.name}** violated community guidelines. Please remember to keep things respectful!`);
        } catch {
          // DMs might be closed
        }
        await interaction.reply({ content: `⚠️ Official gentle DM warning sent to <@${targetUserId}> by <@${interaction.user.id}>.` });
      } else if (action === "mute15m") {
        await targetMember.timeout(15 * 60 * 1000, `Quick Action by ${interaction.user.tag}`);
        await interaction.reply({ content: `⏱️ <@${targetUserId}> timed out for 15 minutes by <@${interaction.user.id}>.` });
      } else if (action === "mute1h") {
        await targetMember.timeout(60 * 60 * 1000, `Quick Action by ${interaction.user.tag}`);
        await interaction.reply({ content: `⏳ <@${targetUserId}> timed out for 1 hour by <@${interaction.user.id}>.` });
      } else if (action === "kick") {
        await targetMember.kick(`Quick Action by ${interaction.user.tag}`);
        await interaction.reply({ content: `👢 <@${targetUserId}> kicked from the server by <@${interaction.user.id}>.` });
      } else if (action === "ban" || action === "mute24h") {
        await interaction.reply({ content: "⚠️ Permanent bans and long 24-hour timeouts are currently disabled in this server. Please use **Mute 15m** or **Mute 1h** for non-strict moderation.", flags: MessageFlags.Ephemeral });
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

    // LOA Approval / Denial Buttons
    if (scope === "loa") {
      if (!roleService.isAdminOrOwner(staffMember)) {
        return interaction.reply({
          content: "⛔ Only Administrators or Server Owners can approve or deny Leave of Absence requests.",
          flags: MessageFlags.Ephemeral,
        });
      }

      const loaId = targetUserId;
      if (action === "approve") {
        const res = loaService.approveLoa(interaction.guild.id, loaId, interaction.user.id, interaction.user.tag);
        return interaction.reply({
          content: res.success ? `✅ ${res.message}` : `⚠️ ${res.message}`,
        });
      } else if (action === "deny") {
        const res = loaService.denyLoa(interaction.guild.id, loaId, interaction.user.id, interaction.user.tag);
        return interaction.reply({
          content: res.success ? `❌ ${res.message}` : `⚠️ ${res.message}`,
        });
      }
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

    if (commandName === "namestyle") {
      return nameStyleCommand.execute(interaction);
    }

    if (commandName === "news") {
      return newsCommand.execute(interaction);
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
      return dutyCommand.execute(interaction, dutyService, roleService, loaService);
    }

    if (commandName === "modmail") {
      return modMailCommand.execute(interaction, modMailService, roleService, loggingService, dutyService, loaService);
    }

    if (commandName === "report") {
      return reportCommand.execute(interaction, loggingService, dutyService, roleService, loaService);
    }

    if (commandName === "loa") {
      return loaCommand.execute(interaction, loaService, roleService, loggingService);
    }

    if (commandName === "exportlogs") {
      return exportLogsCommand.execute(interaction, auditExportService, modService, roleService);
    }

    const modCmd = moderationCommands.find((c) => c.data.name === commandName);
    if (modCmd) {
      return modCmd.execute(interaction, modService);
    }
  }
  } catch (err: any) {
    console.error(`[Interaction Error] Command execution failure:`, err);
    if (interaction.isRepliable()) {
      const errorMessage = "⚠️ An unexpected error occurred while executing this command. The bot state was safely preserved.";
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({ content: errorMessage, flags: MessageFlags.Ephemeral }).catch(() => null);
      } else {
        await interaction.reply({ content: errorMessage, flags: MessageFlags.Ephemeral }).catch(() => null);
      }
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

        const staffPing = roleService.getStaffPing(guildId, dutyService, loaService);
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
  handleMessageUpdate(
    oldMsg,
    newMsg,
    loggingService,
    triageService,
    geminiService,
    roleService,
    autoModService,
    channelPolicyService,
    modService
  );
});

client.on(Events.MessageDelete, (message) => {
  handleMessageDelete(message, loggingService);
});

// 7. Error Handling & Graceful Process Management
client.on(Events.Error, (err) => {
  console.error("🛡️ [AegisMod Discord Client Error]:", err.message);
});

client.on(Events.ShardError, (err, shardId) => {
  console.error(`🛡️ [AegisMod Shard #${shardId} Error]:`, err.message);
});

client.on(Events.ShardDisconnect, (event, shardId) => {
  console.warn(`🛡️ [AegisMod Shard #${shardId} Disconnected]: Code ${event.code}. Will auto-reconnect.`);
});

client.on(Events.ShardReconnecting, (shardId) => {
  console.log(`🔄 [AegisMod Shard #${shardId} Reconnecting]...`);
});

process.on("unhandledRejection", (reason) => {
  console.error("🛡️ [Bot Process Guard] Handled unhandled rejection safely:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("🛡️ [Bot Process Guard] Handled uncaught exception safely:", err.message);
});

process.on("SIGINT", () => {
  console.log("Shutting down AegisMod cleanly...");
  client.destroy();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down AegisMod cleanly...");
  client.destroy();
  process.exit(0);
});

// 8. Bot Login Export & Gateway Diagnostics
let lastDiscordLoginError: string | null = null;

export function getLastLoginError(): string | null {
  return lastDiscordLoginError;
}

export function getBotGatewayStatus() {
  return {
    isReady: client.isReady(),
    tag: client.user?.tag || null,
    id: client.user?.id || null,
    ping: client.ws?.ping ?? -1,
    status: client.ws?.status ?? 5,
    guildCount: client.guilds?.cache?.size || 0,
    userCount: client.users?.cache?.size || 0,
    lastError: lastDiscordLoginError,
  };
}

export function startDiscordBot() {
  const rawToken = process.env.DISCORD_BOT_TOKEN;
  const token = rawToken ? rawToken.trim().replace(/^["']|["']$/g, "").trim() : "";

  if (token && token.length > 20 && !token.includes("your_bot_token") && !token.includes("placeholder")) {
    const masked = token.length > 8 ? `${token.slice(0, 4)}...${token.slice(-4)} (${token.length} chars)` : "***";
    console.log(`🤖 Attempting Discord Bot login with token: ${masked}`);
    lastDiscordLoginError = null;
    client.login(token).then(() => {
      lastDiscordLoginError = null;
    }).catch((err) => {
      lastDiscordLoginError = err.message || String(err);
      console.error("❌ Failed to login to Discord:", err.message || err);
      console.error("💡 Tip: Make sure you copied the 'Token' from Discord Developer Portal -> Bot -> Reset Token (NOT the Client Secret or Application ID).");
      if (err.message?.includes("disallowed intents") || err.message?.includes("PRIVILEGED")) {
        console.error("🚨 Privileged Gateway Intents error: Enable 'MESSAGE CONTENT INTENT' and 'SERVER MEMBERS INTENT' in Discord Developer Portal -> Bot -> Privileged Gateway Intents.");
      }
    });
  } else if (rawToken) {
    lastDiscordLoginError = "DISCORD_BOT_TOKEN appears to be a placeholder or invalid format.";
    console.warn("⚠️ DISCORD_BOT_TOKEN appears to be a placeholder or invalid format. Please set your actual Discord Bot Token in Wispbyte / .env.");
  } else {
    lastDiscordLoginError = "DISCORD_BOT_TOKEN not provided in environment.";
    console.log("ℹ️ DISCORD_BOT_TOKEN not provided in environment. Running in web dashboard and API mode.");
  }
}

