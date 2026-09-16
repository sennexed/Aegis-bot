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
} from "discord.js";
import dotenv from "dotenv";

import { LoggingService } from "./services/loggingService.js";
import { RoleService } from "./services/roleService.js";
import { TraditionalModService } from "./services/traditionalModService.js";
import { TriageService } from "./services/triageService.js";
import { GeminiModerationService } from "./services/geminiModerationService.js";
import { AutoModService } from "./services/autoModService.js";

import { setupCommand } from "./commands/setup.js";
import { moderationCommands } from "./commands/moderation.js";
import { autoModCommand } from "./commands/automod.js";
import { testModCommand } from "./commands/testmod.js";

import { handleMessageCreate } from "./events/messageCreate.js";
import { handleMessageUpdate } from "./events/messageUpdate.js";
import { handleMessageDelete } from "./events/messageDelete.js";

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

// 3. Register Slash Commands
export async function syncGuildCommands(guildId: string, isSetupComplete: boolean) {
  const token = process.env.DISCORD_BOT_TOKEN;
  const clientId = process.env.DISCORD_CLIENT_ID;
  if (!token || !clientId) return;

  const rest = new REST({ version: "10" }).setToken(token);

  // If server is not setup yet, ONLY expose /setup command
  // Once setup is completed, expose /setup, /automod, /testmod, AND all traditional moderation commands (/ban, /kick, /mute, /warn, /cases)
  const fullCommands = [
    setupCommand.data.toJSON(),
    autoModCommand.data.toJSON(),
    testModCommand.data.toJSON(),
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
    // Clear any previous global moderation commands so guilds strictly follow their setup status
    // and globally register only /setup as base
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
  readyClient.user.setActivity("teen community chat | /setup", {
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

// 5. Interaction Create Event (Slash Commands & Role Selects)
client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const { commandName, guildId } = interaction;

    if (commandName === "setup") {
      return setupCommand.execute(interaction, roleService, loggingService, syncGuildCommands);
    }

    // Safety guard: if guild is not configured yet, decline execution and prompt /setup
    if (guildId && !roleService.isGuildConfigured(guildId)) {
      return interaction.reply({
        content: "⚠️ **AegisMod is not set up on this server yet.**\nAn Administrator must run `/setup` first to configure staff roles and `#mod-logs` before moderation commands are unlocked.",
        flags: MessageFlags.Ephemeral,
      });
    }

    if (commandName === "automod") {
      return autoModCommand.execute(interaction, autoModService);
    }

    if (commandName === "testmod") {
      return testModCommand.execute(interaction, autoModService, triageService, geminiService);
    }

    const modCmd = moderationCommands.find((c) => c.data.name === commandName);
    if (modCmd) {
      return modCmd.execute(interaction, modService);
    }
  }
});

// 6. Message Event Listeners
client.on(Events.MessageCreate, (message) => {
  handleMessageCreate(message, triageService, geminiService, loggingService, roleService, autoModService);
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
