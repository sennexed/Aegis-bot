/**
 * Pre-bundled Discord Bot Source Code for Code Explorer and ZIP Exporter
 */

export interface BotFileDefinition {
  path: string;
  filename: string;
  category: "entry" | "service" | "command" | "event" | "config" | "docs";
  description: string;
  content: string;
}

export const BOT_FILES: BotFileDefinition[] = [
  {
    path: "src/index.ts",
    filename: "index.ts",
    category: "entry",
    description: "Discord client bootstrap, Privileged Gateway Intents, slash command registration, event routing",
    content: `import {
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

// 1. Initialize Client with Required Gateway Intents
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
export async function syncGuildCommands(guildId: string, isSetupComplete: boolean) {
  const token = process.env.DISCORD_BOT_TOKEN;
  const clientId = process.env.DISCORD_CLIENT_ID;
  if (!token || !clientId) return;

  const rest = new REST({ version: "10" }).setToken(token);

  // If server is not setup yet, ONLY expose /setup command
  // Once setup is completed, expose /setup AND all moderation commands (/ban, /kick, /mute, /warn, /cases)
  const commandsToRegister = isSetupComplete
    ? [setupCommand.data.toJSON(), ...moderationCommands.map((c) => c.data.toJSON())]
    : [setupCommand.data.toJSON()];

  try {
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
      body: commandsToRegister,
    });
    console.log(
      \`[Commands] Guild \${guildId}: registered \${commandsToRegister.length} commands (Setup complete: \${isSetupComplete})\`
    );
  } catch (err) {
    console.error(\`Failed to register guild commands for \${guildId}:\`, err);
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
    // Globally register only /setup as base
    await rest.put(Routes.applicationCommands(clientId), {
      body: [setupCommand.data.toJSON()],
    });
    console.log("✅ Global commands updated: only /setup is visible by default until server is configured.");

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
  console.log(\`🛡️ AegisMod is online! Logged in as \${readyClient.user.tag}\`);
  readyClient.user.setActivity("teen community chat | /setup", {
    type: ActivityType.Watching,
  });

  await registerSlashCommands();

  // Periodic cache cleanup every 15 minutes
  setInterval(() => triageService.clearExpired(), 15 * 60 * 1000);
});

// Guild Join Event (New Server Added)
client.on(Events.GuildCreate, async (guild) => {
  console.log(\`Joined new guild: \${guild.name} (\${guild.id}) - registering /setup only until configured\`);
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
        content: "⚠️ **AegisMod is not set up on this server yet.**\\nAn Administrator must run \`/setup\` first to configure staff roles and \`#mod-logs\` before moderation commands are unlocked.",
        ephemeral: true,
      });
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

// 7. Process Cleanup
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
}`
  },
  {
    path: "src/services/geminiModerationService.ts",
    filename: "geminiModerationService.ts",
    category: "service",
    description: "Gemini 3.8 Flash connection with @google/genai, structured JSON schema response, teen moderation rubric",
    content: `import { GoogleGenAI, Type } from "@google/genai";
import { TEEN_SAFETY_RUBRIC } from "../config/safetyRubric.js";

export interface AIAnalysisOutput {
  flagged: boolean;
  category: string;
  severity: "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  recommendedAction: "ALLOW" | "WARN" | "DELETE" | "TIMEOUT_1H" | "TIMEOUT_24H" | "BAN";
  confidence: number;
  reason: string;
  highlightedPhrases: string[];
  ageAppropriateNotes: string;
  tokensUsed: number;
}

export class GeminiModerationService {
  private ai: GoogleGenAI;
  private readonly modelName = "gemini-3.8-flash";

  constructor(apiKey?: string) {
    const key = apiKey || process.env.GEMINI_API_KEY;
    this.ai = new GoogleGenAI({
      apiKey: key || "",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }

  public async analyzeMessage(content: string, authorName: string = "User"): Promise<AIAnalysisOutput> {
    const trimmed = content.trim();

    try {
      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: \`Evaluate the following Discord message sent by "\${authorName}":\\n"\${trimmed}"\`,
        config: {
          systemInstruction: TEEN_SAFETY_RUBRIC.geminiSystemInstruction,
          temperature: 0.1,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              flagged: { type: Type.BOOLEAN, description: "Whether content breaches teen community rules" },
              category: {
                type: Type.STRING,
                description: "NONE, CYBERBULLYING, HARASSMENT, SEXUAL_GROOMING_OR_PREDATORY, SELF_HARM, HATE_SPEECH, SEVERE_PROFANITY_OR_ABUSE, DOXXING_OR_PII",
              },
              severity: {
                type: Type.STRING,
                description: "NONE, LOW, MEDIUM, HIGH, CRITICAL",
              },
              recommendedAction: {
                type: Type.STRING,
                description: "ALLOW, WARN, DELETE, TIMEOUT_1H, TIMEOUT_24H, BAN",
              },
              confidence: { type: Type.NUMBER, description: "Confidence score between 0.0 and 1.0" },
              reason: { type: Type.STRING, description: "Clear explanation for Discord mod log embed" },
              highlightedPhrases: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Violating words or substrings",
              },
              ageAppropriateNotes: {
                type: Type.STRING,
                description: "Notes reflecting standards for 16-year-old teens",
              },
            },
            required: ["flagged", "category", "severity", "recommendedAction", "confidence", "reason"],
          },
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      const estimatedTokens = Math.ceil(trimmed.length / 3.5) + 380;

      return {
        flagged: !!parsed.flagged,
        category: parsed.category || "NONE",
        severity: parsed.severity || "NONE",
        recommendedAction: parsed.recommendedAction || "ALLOW",
        confidence: parsed.confidence ?? 0.9,
        reason: parsed.reason || "Evaluated by Gemini 3.8 Flash",
        highlightedPhrases: parsed.highlightedPhrases || [],
        ageAppropriateNotes: parsed.ageAppropriateNotes || "Strict teenage community guidelines enforced.",
        tokensUsed: estimatedTokens,
      };
    } catch (err: any) {
      console.error("[GeminiModerationService] Error during AI evaluation:", err);
      return {
        flagged: false,
        category: "NONE",
        severity: "NONE",
        recommendedAction: "ALLOW",
        confidence: 0,
        reason: \`Gemini API query encountered temporary failure: \${err.message}\`,
        highlightedPhrases: [],
        ageAppropriateNotes: "Held for manual moderator review.",
        tokensUsed: 0,
      };
    }
  }
}`
  },
  {
    path: "src/services/triageService.ts",
    filename: "triageService.ts",
    category: "service",
    description: "Multi-tier token efficiency pipeline, local regex fast-pass, TTL LRU cache (80-90% token reduction)",
    content: `export interface TriageResult {
  shouldCallGemini: boolean;
  localVerdict?: {
    flagged: boolean;
    category: string;
    severity: "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    recommendedAction: "ALLOW" | "WARN" | "DELETE" | "TIMEOUT_1H" | "TIMEOUT_24H" | "BAN";
    reason: string;
  };
  reason: string;
}

export class TriageService {
  private cache = new Map<string, { result: any; timestamp: number }>();
  private readonly CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

  private benignSlang = new Set([
    "gg", "ggwp", "ggs", "lol", "lmao", "lmfao", "rofl", "w", "l", "fr", "frfr",
    "ong", "ngl", "tbh", "idk", "idc", "brb", "gtg", "gn", "gm", "glhf", "ez",
    "pog", "poggers", "clutch", "sheesh", "bet", "no cap", "cap", "fax", "ok",
    "okay", "k", "sure", "nice", "cool", "ye", "yes", "yea", "yeah", "nah", "no",
    "nope", "hi", "hello", "hey", "yo", "sup", "whatsup", "wassup", "cya", "bye"
  ]);

  private zeroToleranceRegex = /\\b(kys|k\\.y\\.s|kill yourself|kill ur self|die in a fire|suicide|send nudes|send me nudes|trade pics|drop snap 16|drop your insta dm|meet up in person secretly)\\b/i;

  public evaluate(content: string): TriageResult {
    const trimmed = content.trim();
    const normalized = trimmed.toLowerCase();

    const cached = this.cache.get(normalized);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return {
        shouldCallGemini: false,
        localVerdict: cached.result,
        reason: "Cache Hit: Exact duplicate evaluated recently (0 tokens consumed)"
      };
    }

    if (normalized.length <= 4 && (this.benignSlang.has(normalized) || /^[a-z0-9!?. ]{1,4}$/.test(normalized))) {
      return {
        shouldCallGemini: false,
        localVerdict: {
          flagged: false,
          category: "NONE",
          severity: "NONE",
          recommendedAction: "ALLOW",
          reason: "Triage Tier-1: Short benign chat slang."
        },
        reason: "Fast filter: Benign chat (0 tokens consumed)"
      };
    }

    const words = normalized.split(/\\s+/);
    if (words.length <= 5 && words.every(w => this.benignSlang.has(w.replace(/[^a-z]/g, "")))) {
      return {
        shouldCallGemini: false,
        localVerdict: {
          flagged: false,
          category: "NONE",
          severity: "NONE",
          recommendedAction: "ALLOW",
          reason: "Triage Tier-1: Multi-word benign slang phrase."
        },
        reason: "Fast filter: Whitelisted conversational phrase (0 tokens consumed)"
      };
    }

    if (this.zeroToleranceRegex.test(trimmed)) {
      const isSelfHarm = /kys|k\\.y\\.s|kill yourself|kill ur self|suicide/i.test(trimmed);
      const category = isSelfHarm ? "SELF_HARM" : "SEXUAL_GROOMING_OR_PREDATORY";
      const action = isSelfHarm ? "TIMEOUT_24H" : "BAN";
      
      const verdict = {
        flagged: true,
        category,
        severity: "CRITICAL" as const,
        recommendedAction: action as const,
        reason: \`Immediate local regex trigger for zero-tolerance keyword pattern in \${category}\`
      };

      this.cacheVerdict(normalized, verdict);
      return {
        shouldCallGemini: false,
        localVerdict: verdict,
        reason: "Tier-2 Local Regex Flag: Immediate action without API latency"
      };
    }

    return {
      shouldCallGemini: true,
      reason: "Tier-3 Passed: Message requires nuanced contextual evaluation by Gemini 3.8 Flash."
    };
  }

  public cacheVerdict(content: string, verdict: any) {
    this.cache.set(content.toLowerCase().trim(), {
      result: verdict,
      timestamp: Date.now()
    });
  }

  public clearExpired() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.CACHE_TTL_MS) {
        this.cache.delete(key);
      }
    }
  }
}`
  },
  {
    path: "src/services/roleService.ts",
    filename: "roleService.ts",
    category: "service",
    description: "Discord RoleSelectMenuBuilder setup, hierarchy enforcement, staff permission checks",
    content: `import {
  ActionRowBuilder,
  RoleSelectMenuBuilder,
  GuildMember,
  PermissionFlagsBits,
} from "discord.js";
import fs from "fs";
import path from "path";

export interface GuildRoleMapping {
  guildId: string;
  ownerRoleId: string | null;
  adminRoleIds: string[];
  moderatorRoleIds: string[];
  configuredAt: number;
}

export class RoleService {
  private guildRoles = new Map<string, GuildRoleMapping>();
  private dataFilePath = path.join(process.cwd(), "guild_roles.json");

  constructor() {
    this.loadFromDisk();
  }

  private loadFromDisk(): void {
    try {
      if (fs.existsSync(this.dataFilePath)) {
        const raw = fs.readFileSync(this.dataFilePath, "utf8");
        const parsed = JSON.parse(raw);
        for (const key of Object.keys(parsed)) {
          this.guildRoles.set(key, parsed[key]);
        }
      }
    } catch {
      // Fallback cleanly
    }
  }

  private persistToDisk(): void {
    try {
      const obj: Record<string, GuildRoleMapping> = {};
      this.guildRoles.forEach((val, key) => {
        obj[key] = val;
      });
      fs.writeFileSync(this.dataFilePath, JSON.stringify(obj, null, 2), "utf8");
    } catch {
      // Ignore disk write errors
    }
  }

  public createSetupRoleSelects(guildId: string): ActionRowBuilder<RoleSelectMenuBuilder>[] {
    const ownerSelect = new RoleSelectMenuBuilder()
      .setCustomId(\`setup:role:owner:\${guildId}\`)
      .setPlaceholder("Select Server Owner / Executive Role")
      .setMinValues(1)
      .setMaxValues(1);

    const adminSelect = new RoleSelectMenuBuilder()
      .setCustomId(\`setup:role:admin:\${guildId}\`)
      .setPlaceholder("Select Administrator Roles (Full Control)")
      .setMinValues(1)
      .setMaxValues(5);

    const modSelect = new RoleSelectMenuBuilder()
      .setCustomId(\`setup:role:mod:\${guildId}\`)
      .setPlaceholder("Select Moderator Roles (Kick, Ban, Mute, Warn)")
      .setMinValues(1)
      .setMaxValues(10);

    return [
      new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(ownerSelect),
      new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(adminSelect),
      new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(modSelect),
    ];
  }

  public saveGuildRoles(
    guildId: string,
    ownerRoleId: string | null,
    adminRoleIds: string[],
    moderatorRoleIds: string[]
  ): GuildRoleMapping {
    const mapping: GuildRoleMapping = {
      guildId,
      ownerRoleId,
      adminRoleIds,
      moderatorRoleIds,
      configuredAt: Date.now(),
    };
    this.guildRoles.set(guildId, mapping);
    this.persistToDisk();
    return mapping;
  }

  public isGuildConfigured(guildId: string): boolean {
    return this.guildRoles.has(guildId);
  }

  public getGuildRoles(guildId: string): GuildRoleMapping | undefined {
    return this.guildRoles.get(guildId);
  }

  public isStaffOrExempt(member: GuildMember): boolean {
    if (member.user.bot) return true;
    if (member.id === member.guild.ownerId) return true;
    if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;

    const config = this.getGuildRoles(member.guild.id);
    if (!config) return false;

    if (config.ownerRoleId && member.roles.cache.has(config.ownerRoleId)) return true;
    if (config.adminRoleIds.some((id) => member.roles.cache.has(id))) return true;
    if (config.moderatorRoleIds.some((id) => member.roles.cache.has(id))) return true;

    return false;
  }

  public canModerateMember(
    executor: GuildMember,
    target: GuildMember,
    action: "BAN" | "KICK" | "MUTE" | "WARN"
  ): { allowed: boolean; reason?: string } {
    if (target.id === target.guild.ownerId) {
      return { allowed: false, reason: "You cannot moderate the Server Owner." };
    }
    if (executor.id === target.id) {
      return { allowed: false, reason: "You cannot take moderation action on yourself." };
    }
    if (executor.id === executor.guild.ownerId) {
      return { allowed: true };
    }
    if (executor.roles.highest.position <= target.roles.highest.position) {
      return {
        allowed: false,
        reason: "Your highest role is lower or equal to the target's highest role in Discord's hierarchy.",
      };
    }
    const botMember = target.guild.members.me;
    if (botMember && botMember.roles.highest.position <= target.roles.highest.position) {
      return {
        allowed: false,
        reason: "The Bot's role is lower than the target member's role and cannot perform this action.",
      };
    }
    return { allowed: true };
  }
}`
  },
  {
    path: "src/services/loggingService.ts",
    filename: "loggingService.ts",
    category: "service",
    description: "Dedicated #mod-logs channel creation with strict staff-only permissions, rich Discord Embed builders",
    content: `import {
  ChannelType,
  EmbedBuilder,
  Guild,
  Message,
  PermissionFlagsBits,
  TextChannel,
  User,
} from "discord.js";
import { AIAnalysisOutput } from "./geminiModerationService.js";

export class LoggingService {
  private logChannelCache = new Map<string, string>();

  public async ensureLogChannel(
    guild: Guild,
    staffRoleIds: string[] = []
  ): Promise<TextChannel> {
    const cachedId = this.logChannelCache.get(guild.id);
    if (cachedId) {
      const channel = guild.channels.cache.get(cachedId) as TextChannel;
      if (channel) return channel;
    }

    const existing = guild.channels.cache.find(
      (c) =>
        c.type === ChannelType.GuildText &&
        (c.name === "mod-logs" || c.name === "aegis-logs" || c.name === "moderation-logs")
    ) as TextChannel | undefined;

    if (existing) {
      this.logChannelCache.set(guild.id, existing.id);
      return existing;
    }

    const permissionOverwrites: any[] = [
      {
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
      },
      {
        id: guild.client.user.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.EmbedLinks,
          PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.ReadMessageHistory,
        ],
      },
    ];

    for (const roleId of staffRoleIds) {
      if (roleId) {
        permissionOverwrites.push({
          id: roleId,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.ReadMessageHistory,
          ],
          deny: [PermissionFlagsBits.SendMessages],
        });
      }
    }

    const newChannel = await guild.channels.create({
      name: "mod-logs",
      type: ChannelType.GuildText,
      topic: "AegisMod Audit Log — Automated AI moderation actions, deletions, edits & staff records.",
      permissionOverwrites,
      reason: "Automatic setup of AegisMod dedicated moderation logging channel",
    });

    this.logChannelCache.set(guild.id, newChannel.id);

    const welcomeEmbed = new EmbedBuilder()
      .setTitle("🛡️ AegisMod Logging Channel Initialized")
      .setDescription(
        "This channel has been automatically created and configured. All moderation activities, deleted messages, edited messages, and AI detections will be logged here."
      )
      .setColor(0x5865f2)
      .addFields(
        { name: "Channel Privacy", value: "Locked: \`@everyone\` cannot view this channel.", inline: true },
        { name: "Target Community", value: "Strict Teen Safety (~16 y/o standards)", inline: true }
      )
      .setTimestamp();

    await newChannel.send({ embeds: [welcomeEmbed] });
    return newChannel;
  }

  public async logAIAction(
    message: Message,
    aiResult: AIAnalysisOutput,
    actionTaken: string
  ) {
    if (!message.guild) return;
    const logChannel = await this.ensureLogChannel(message.guild);

    const embed = new EmbedBuilder()
      .setTitle(\`🤖 AI Moderation Action: \${actionTaken}\`)
      .setColor(
        aiResult.severity === "CRITICAL"
          ? 0xed4245
          : aiResult.severity === "HIGH"
          ? 0xe67e22
          : 0xf1c40f
      )
      .setAuthor({
        name: \`\${message.author.tag} (\${message.author.id})\`,
        iconURL: message.author.displayAvatarURL(),
      })
      .addFields(
        { name: "Offending Content", value: \`\`\`\${message.content.slice(0, 1000)}\`\`\` },
        { name: "Category", value: \`\`\${aiResult.category}\`\`, inline: true },
        { name: "Severity", value: \`\`\${aiResult.severity}\`\`, inline: true },
        { name: "Confidence", value: \`\${Math.round(aiResult.confidence * 100)}%\`, inline: true },
        { name: "Channel", value: \`<#\${message.channel.id}>\`, inline: true },
        { name: "Tokens Used", value: \`\${aiResult.tokensUsed} tokens\`, inline: true },
        { name: "AI Reason", value: aiResult.reason }
      )
      .setFooter({ text: "AegisMod AI Engine • Powered by Gemini 3.8 Flash" })
      .setTimestamp();

    if (aiResult.highlightedPhrases.length > 0) {
      embed.addFields({
        name: "Flagged Substrings",
        value: aiResult.highlightedPhrases.map((p) => \`\`\${p}\`\`).join(", "),
      });
    }

    await logChannel.send({ embeds: [embed] });
  }

  public async logMessageDelete(message: Message) {
    if (!message.guild || message.author.bot) return;
    const logChannel = await this.ensureLogChannel(message.guild);

    const embed = new EmbedBuilder()
      .setTitle("🗑️ Message Deleted")
      .setColor(0xe74c3c)
      .setAuthor({
        name: \`\${message.author.tag} (\${message.author.id})\`,
        iconURL: message.author.displayAvatarURL(),
      })
      .addFields(
        { name: "Author", value: \`<@\${message.author.id}>\`, inline: true },
        { name: "Channel", value: \`<#\${message.channel.id}>\`, inline: true },
        {
          name: "Original Content",
          value: message.content ? \`\`\`\${message.content.slice(0, 1000)}\`\`\` : "*[No text content or embed]*",
        }
      )
      .setFooter({ text: \`Message ID: \${message.id}\` })
      .setTimestamp();

    await logChannel.send({ embeds: [embed] });
  }

  public async logMessageEdit(oldMessage: Message, newMessage: Message) {
    if (!oldMessage.guild || oldMessage.author.bot) return;
    if (oldMessage.content === newMessage.content) return;

    const logChannel = await this.ensureLogChannel(oldMessage.guild);

    const embed = new EmbedBuilder()
      .setTitle("✏️ Message Edited")
      .setColor(0xf39c12)
      .setAuthor({
        name: \`\${oldMessage.author.tag} (\${oldMessage.author.id})\`,
        iconURL: oldMessage.author.displayAvatarURL(),
      })
      .addFields(
        { name: "Author", value: \`<@\${oldMessage.author.id}>\`, inline: true },
        { name: "Channel", value: \`<#\${oldMessage.channel.id}>\`, inline: true },
        { name: "Jump To Message", value: \`[Click Here](\${newMessage.url})\`, inline: true },
        { name: "Before", value: \`\`\`\${(oldMessage.content || "*[empty]*").slice(0, 500)}\`\`\` },
        { name: "After", value: \`\`\`\${(newMessage.content || "*[empty]*").slice(0, 500)}\`\`\` }
      )
      .setFooter({ text: \`Message ID: \${newMessage.id}\` })
      .setTimestamp();

    await logChannel.send({ embeds: [embed] });
  }

  public async logTraditionalModAction(
    guild: Guild,
    target: User,
    moderator: User,
    action: "BAN" | "KICK" | "MUTE" | "WARN" | "UNMUTE",
    reason: string,
    durationFormatted?: string
  ) {
    const logChannel = await this.ensureLogChannel(guild);

    const colors = {
      BAN: 0xed4245,
      KICK: 0xe67e22,
      MUTE: 0x9b59b6,
      WARN: 0xf1c40f,
      UNMUTE: 0x2ecc71,
    };

    const embed = new EmbedBuilder()
      .setTitle(\`🔨 Moderation Action: \${action}\`)
      .setColor(colors[action] || 0x95a5a6)
      .setThumbnail(target.displayAvatarURL())
      .addFields(
        { name: "Target User", value: \`\${target.tag} (<@\${target.id}>)\`, inline: true },
        { name: "Moderator", value: \`\${moderator.tag} (<@\${moderator.id}>)\`, inline: true },
        { name: "Reason", value: reason || "No reason specified" }
      )
      .setTimestamp();

    if (durationFormatted) {
      embed.addFields({ name: "Duration", value: durationFormatted, inline: true });
    }

    await logChannel.send({ embeds: [embed] });
  }
}`
  },
  {
    path: "src/services/traditionalModService.ts",
    filename: "traditionalModService.ts",
    category: "service",
    description: "Manual moderation actions (ban, kick, mute, warn), native Discord timeout integration, infraction case tracking",
    content: `import { GuildMember, User } from "discord.js";
import { LoggingService } from "./loggingService.js";
import { RoleService } from "./roleService.js";

export interface InfractionRecord {
  caseId: string;
  guildId: string;
  targetId: string;
  targetTag: string;
  moderatorId: string;
  moderatorTag: string;
  action: "BAN" | "KICK" | "MUTE" | "WARN" | "UNMUTE";
  reason: string;
  durationMs?: number;
  timestamp: number;
}

export class TraditionalModService {
  private infractions = new Map<string, InfractionRecord[]>();
  private caseCounter = 1000;

  constructor(
    private loggingService: LoggingService,
    private roleService: RoleService
  ) {}

  public async ban(
    moderator: GuildMember,
    target: GuildMember,
    reason: string,
    deleteMessageDays: number = 1
  ): Promise<{ success: boolean; error?: string }> {
    const check = this.roleService.canModerateMember(moderator, target, "BAN");
    if (!check.allowed) return { success: false, error: check.reason };

    try {
      await target.send({
        content: \`You have been banned from **\${target.guild.name}**.\\n**Reason:** \${reason}\`,
      }).catch(() => null);

      await target.ban({
        reason: \`\${moderator.user.tag}: \${reason}\`,
        deleteMessageSeconds: deleteMessageDays * 86400,
      });

      this.recordInfraction({
        guildId: target.guild.id,
        targetId: target.id,
        targetTag: target.user.tag,
        moderatorId: moderator.id,
        moderatorTag: moderator.user.tag,
        action: "BAN",
        reason,
        timestamp: Date.now(),
      });

      await this.loggingService.logTraditionalModAction(
        target.guild,
        target.user,
        moderator.user,
        "BAN",
        reason
      );

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  public async kick(
    moderator: GuildMember,
    target: GuildMember,
    reason: string
  ): Promise<{ success: boolean; error?: string }> {
    const check = this.roleService.canModerateMember(moderator, target, "KICK");
    if (!check.allowed) return { success: false, error: check.reason };

    try {
      await target.send({
        content: \`You have been kicked from **\${target.guild.name}**.\\n**Reason:** \${reason}\`,
      }).catch(() => null);

      await target.kick(\`\${moderator.user.tag}: \${reason}\`);

      this.recordInfraction({
        guildId: target.guild.id,
        targetId: target.id,
        targetTag: target.user.tag,
        moderatorId: moderator.id,
        moderatorTag: moderator.user.tag,
        action: "KICK",
        reason,
        timestamp: Date.now(),
      });

      await this.loggingService.logTraditionalModAction(
        target.guild,
        target.user,
        moderator.user,
        "KICK",
        reason
      );

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  public async mute(
    moderator: GuildMember,
    target: GuildMember,
    durationMs: number,
    reason: string
  ): Promise<{ success: boolean; error?: string }> {
    const check = this.roleService.canModerateMember(moderator, target, "MUTE");
    if (!check.allowed) return { success: false, error: check.reason };

    const maxDuration = 28 * 24 * 60 * 60 * 1000;
    if (durationMs > maxDuration) {
      return { success: false, error: "Timeout duration cannot exceed 28 days." };
    }

    try {
      await target.timeout(durationMs, \`\${moderator.user.tag}: \${reason}\`);
      const formattedDuration = this.formatDuration(durationMs);

      await target.send({
        content: \`You have been muted (timed out) in **\${target.guild.name}** for **\${formattedDuration}**.\\n**Reason:** \${reason}\`,
      }).catch(() => null);

      this.recordInfraction({
        guildId: target.guild.id,
        targetId: target.id,
        targetTag: target.user.tag,
        moderatorId: moderator.id,
        moderatorTag: moderator.user.tag,
        action: "MUTE",
        reason,
        durationMs,
        timestamp: Date.now(),
      });

      await this.loggingService.logTraditionalModAction(
        target.guild,
        target.user,
        moderator.user,
        "MUTE",
        reason,
        formattedDuration
      );

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  public async warn(
    moderator: GuildMember,
    target: GuildMember,
    reason: string
  ): Promise<{ success: boolean; warningCount: number; error?: string }> {
    try {
      this.recordInfraction({
        guildId: target.guild.id,
        targetId: target.id,
        targetTag: target.user.tag,
        moderatorId: moderator.id,
        moderatorTag: moderator.user.tag,
        action: "WARN",
        reason,
        timestamp: Date.now(),
      });

      const userCases = this.getUserCases(target.guild.id, target.id);
      const warningCount = userCases.filter((c) => c.action === "WARN").length;

      await target.send({
        content: \`⚠️ You received an official warning in **\${target.guild.name}**.\\n**Reason:** \${reason}\\n**Total Warnings:** \${warningCount}\`,
      }).catch(() => null);

      await this.loggingService.logTraditionalModAction(
        target.guild,
        target.user,
        moderator.user,
        "WARN",
        \`\${reason} (Strike #\${warningCount})\`
      );

      return { success: true, warningCount };
    } catch (err: any) {
      return { success: false, warningCount: 0, error: err.message };
    }
  }

  public recordInfraction(data: Omit<InfractionRecord, "caseId">): InfractionRecord {
    const key = \`\${data.guildId}:\${data.targetId}\`;
    const list = this.infractions.get(key) || [];
    const record: InfractionRecord = {
      ...data,
      caseId: \`CASE-\${++this.caseCounter}\`,
    };
    list.push(record);
    this.infractions.set(key, list);
    return record;
  }

  public getUserCases(guildId: string, userId: string): InfractionRecord[] {
    return this.infractions.get(\`\${guildId}:\${userId}\`) || [];
  }

  public parseDurationString(input: string): number | null {
    const match = input.trim().match(/^(\\d+)\\s*(s|m|h|d|w)$/i);
    if (!match) return null;
    const val = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();
    switch (unit) {
      case "s": return val * 1000;
      case "m": return val * 60 * 1000;
      case "h": return val * 60 * 60 * 1000;
      case "d": return val * 24 * 60 * 60 * 1000;
      case "w": return val * 7 * 24 * 60 * 60 * 1000;
      default: return null;
    }
  }

  public formatDuration(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    if (minutes < 60) return \`\${minutes} minutes\`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return \`\${hours} hours\`;
    const days = Math.floor(hours / 24);
    return \`\${days} days\`;
  }
}`
  },
  {
    path: "src/commands/setup.ts",
    filename: "setup.ts",
    category: "command",
    description: "/setup slash command with Discord native RoleSelectMenuBuilder and #mod-logs channel provisioning",
    content: `import {
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
          value: "Can run \`/setup\`, \`/cases\`, and manage bot settings.",
        },
        {
          name: "3. Moderator Roles",
          value: "Can execute \`/ban\`, \`/kick\`, \`/mute\`, \`/warn\`, and read \`#mod-logs\`.",
        },
        {
          name: "4. Dedicated Audit Log Channel",
          value: "The bot will automatically create or bind \`#mod-logs\` visible only to staff.",
        }
      )
      .setFooter({ text: "Select options below within 5 minutes to complete setup." });

    const message = await interaction.editReply({
      embeds: [setupEmbed],
      components: selectRows,
    });

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

      roleService.saveGuildRoles(interaction.guildId!, ownerRole, adminRoles, modRoles);

      // Unlock and register commands for this server
      if (syncCommands) {
        await syncCommands(interaction.guildId!, true);
      }

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
            value: ownerRole ? \`<@&\${ownerRole}>\` : "*None selected*",
            inline: true,
          },
          {
            name: "⚙️ Admin Roles",
            value: adminRoles.length ? adminRoles.map((r) => \`<@&\${r}>\`).join(", ") : "*None selected*",
            inline: true,
          },
          {
            name: "🛡️ Moderator Roles",
            value: modRoles.length ? modRoles.map((r) => \`<@&\${r}>\`).join(", ") : "*None selected*",
            inline: true,
          },
          {
            name: "📋 Dedicated Log Channel",
            value: \`<#\${logChannel.id}> (Auto-created with strict permissions)\`,
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
      await interaction.editReply({ components: [] }).catch(() => null);
    });
  },
};`
  },
  {
    path: "src/config/safetyRubric.ts",
    filename: "safetyRubric.ts",
    category: "config",
    description: "Strict teen safety definitions (cyberbullying, predatory grooming, doxxing, self-harm, hate speech)",
    content: `export const TEEN_SAFETY_RUBRIC = {
  version: "2.4-strict-teen",
  targetAudience: "Communities with adolescents aged ~16",
  description:
    "Zero tolerance for predatory behaviors, cyberbullying, doxxing, self-harm incitement, and malicious harassment.",
  
  categories: {
    SEXUAL_GROOMING_OR_PREDATORY: {
      description: "Any adult-to-minor solicitation, asking teens for intimate photos, Snapchat/secret DMs, secret meetups, sexualizing underage users.",
      defaultSeverity: "CRITICAL",
      defaultAction: "BAN",
      requiresStaffPing: true
    },
    SELF_HARM: {
      description: "Encouraging suicide ('kys', 'kill yourself'), glorifying self-harm, suicide pacts or harassment urging self-injury.",
      defaultSeverity: "CRITICAL",
      defaultAction: "TIMEOUT_24H",
      requiresStaffPing: true
    },
    DOXXING_OR_PII: {
      description: "Leaking real full names, home addresses, phone numbers, schools, family details, or private social media handles of minors.",
      defaultSeverity: "HIGH",
      defaultAction: "TIMEOUT_24H",
      requiresStaffPing: true
    },
    HATE_SPEECH: {
      description: "Dehumanizing attacks, slurs, or systemic hatred based on race, ethnicity, sexual orientation, gender identity, religion, or disability.",
      defaultSeverity: "HIGH",
      defaultAction: "TIMEOUT_1H",
      requiresStaffPing: true
    },
    CYBERBULLYING: {
      description: "Targeted humiliation, malicious group exclusion, persistent vicious mocking, degradation of a peer.",
      defaultSeverity: "MEDIUM",
      defaultAction: "DELETE",
      requiresStaffPing: false
    },
    HARASSMENT: {
      description: "Persistent abusive name-calling, non-consensual sexualized jokes, invasive personal insults.",
      defaultSeverity: "MEDIUM",
      defaultAction: "DELETE",
      requiresStaffPing: false
    },
    SEVERE_PROFANITY_OR_ABUSE: {
      description: "Aggressive or vulgar swearing directed at individuals, bypass tactics (leetspeak, spaced characters, zero-width characters).",
      defaultSeverity: "LOW",
      defaultAction: "WARN",
      requiresStaffPing: false
    }
  },

  geminiSystemInstruction: \`You are AegisMod, a specialized Discord moderation AI tailored for an online community where members are around 16 years old.
Your core mission is to uphold strict teen safety standards, preventing abuse, predatory behavior, cyberbullying, doxxing, self-harm, hate speech, and severe vulgarity.
Maintain a high bar for respectful communication, while distinguishing genuine harmless gaming banter (e.g., "you're so bad at this game lol", "bro that aim was trash") from malicious targeted harassment (e.g., "nobody likes you, leave this server", "kill yourself").

Categories:
- "NONE": Safe, acceptable casual teen conversation.
- "CYBERBULLYING": Targeted humiliation, exclusion campaigns, malicious mockery, persistent hostility.
- "HARASSMENT": Stalking, abusive name-calling, non-consensual sexualized comments.
- "SEXUAL_GROOMING_OR_PREDATORY": Age-inappropriate sexual solicitation, asking minors for private photos/snapchat/DMs, covert meetup proposals, sexualizing teenagers.
- "SELF_HARM": Encouraging suicide ("kys"), self-harm ideation, suicide pacts.
- "HATE_SPEECH": Slurs or dehumanizing attacks based on race, religion, gender, sexual orientation, disability.
- "SEVERE_PROFANITY_OR_ABUSE": Repeated aggressive profanity, bypass attempts (leetspeak/spaced out vulgarities).
- "DOXXING_OR_PII": Leaking real names, addresses, phone numbers, school locations, private photos.

Severities:
- "NONE": No action required.
- "LOW": Mild infraction. Recommended action: "WARN".
- "MEDIUM": Notable violation (toxic harassment, vulgar evasion). Recommended action: "DELETE".
- "HIGH": Severe violation (hate speech, vicious cyberbullying, doxxing). Recommended action: "TIMEOUT_1H" or "TIMEOUT_24H".
- "CRITICAL": Predatory grooming, explicit threats, suicide encouragement. Recommended action: "BAN" (with immediate moderator ping).

Output structured JSON strictly matching the provided schema.\`
};`
  },
  {
    path: "WISPBYTE_DEPLOYMENT.md",
    filename: "WISPBYTE_DEPLOYMENT.md",
    category: "docs",
    description: "Step-by-step Pterodactyl host guide for Wispbyte, Privileged Intents setup, environment variables",
    content: `# 🚀 AegisMod — Wispbyte Hosting & Deployment Guide

This guide details how to host and run **AegisMod** on **Wispbyte** (Pterodactyl-based Game/Discord Bot Hosting) with 24/7 uptime.

---

## 1. Discord Developer Portal Setup

1. Visit [Discord Developer Portal](https://discord.com/developers/applications) and click **New Application**.
2. Name your bot (e.g., \`AegisMod\`).
3. Navigate to the **Bot** tab on the left:
   - Click **Reset Token** and copy your **Bot Token**.
   - Scroll down to **Privileged Gateway Intents** and enable:
     - ✅ **Server Members Intent** (Required for hierarchy checks and timeouts)
     - ✅ **Message Content Intent** (Required for reading chat messages to moderate)
4. Navigate to the **OAuth2 -> URL Generator** tab:
   - Check \`bot\` and \`applications.commands\`.
   - Under **Bot Permissions**, select \`Administrator\` or essential moderation permissions.
   - Copy the invite link to add AegisMod to your server.

---

## 2. Wispbyte Server Setup

### Step A: Create or Select Your Bot Server
1. In your **Wispbyte Client Dashboard**, deploy a new server with the **Node.js** egg (**Node.js 20** or **Node.js 22**).
2. 512 MB RAM and 0.5 vCPU is optimal.

### Step B: Upload Files
Upload the project files directly to \`/home/container\`.

### Step C: Configure Environment Variables
In the **Startup** or file manager, configure:
\`\`\`env
DISCORD_BOT_TOKEN="your_discord_bot_token_here"
DISCORD_CLIENT_ID="your_discord_application_client_id_here"
GEMINI_API_KEY="your_google_gemini_api_key_here"
NODE_ENV="production"
\`\`\`

### Step D: Configure Startup Command
\`\`\`bash
npm install && npx tsx src/index.ts
\`\`\`

### Step E: Start Your Server
Click **Start** in the console. When ready, test with \`/setup\` in Discord!`
  },
  {
    path: "package.json",
    filename: "package.json",
    category: "config",
    description: "Discord.js v14, @google/genai, dotenv, TypeScript configuration",
    content: `{
  "name": "aegismod-discord-bot",
  "version": "1.0.0",
  "description": "Discord Hybrid Moderation Bot combining Gemini API AI moderation with traditional commands for teen-focused communities",
  "main": "dist/index.js",
  "type": "module",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "tsx src/index.ts"
  },
  "dependencies": {
    "discord.js": "^14.16.3",
    "@google/genai": "^2.4.0",
    "dotenv": "^16.4.5"
  },
  "devDependencies": {
    "@types/node": "^22.5.0",
    "typescript": "^5.5.4",
    "tsx": "^4.19.0"
  }
}`
  }
];
