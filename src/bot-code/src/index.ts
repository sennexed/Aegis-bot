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
} from "discord.js";
import dotenv from "dotenv";

import { LoggingService } from "./services/loggingService.js";
import { RoleService } from "./services/roleService.js";
import { TraditionalModService } from "./services/traditionalModService.js";
import { TriageService } from "./services/triageService.js";
import { GeminiModerationService } from "./services/geminiModerationService.js";

import { setupCommand } from "./commands/setup.js";
import { moderationCommands } from "./commands/moderation.js";

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

// 3. Register Slash Commands
async function registerSlashCommands() {
  const token = process.env.DISCORD_BOT_TOKEN;
  const clientId = process.env.DISCORD_CLIENT_ID;

  if (!token || !clientId) {
    console.warn("⚠️ DISCORD_BOT_TOKEN or DISCORD_CLIENT_ID missing; skipping slash command registration.");
    return;
  }

  const commands = [setupCommand.data.toJSON(), ...moderationCommands.map((c) => c.data.toJSON())];
  const rest = new REST({ version: "10" }).setToken(token);

  try {
    console.log("Registering global slash commands with Discord API...");
    await rest.put(Routes.applicationCommands(clientId), { body: commands });
    console.log("✅ Successfully registered slash commands (/setup, /ban, /kick, /mute, /warn, /cases).");
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

// 5. Interaction Create Event (Slash Commands & Role Selects)
client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const { commandName } = interaction;

    if (commandName === "setup") {
      return setupCommand.execute(interaction, roleService, loggingService);
    }

    const modCmd = moderationCommands.find((c) => c.data.name === commandName);
    if (modCmd) {
      return modCmd.execute(interaction, modService);
    }
  }
});

// 6. Message Event Listeners
client.on(Events.MessageCreate, (message) => {
  handleMessageCreate(message, triageService, geminiService, loggingService, roleService);
});

client.on(Events.MessageUpdate, (oldMsg, newMsg) => {
  handleMessageUpdate(oldMsg, newMsg, loggingService, triageService, geminiService, roleService);
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
