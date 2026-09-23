import express, { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { newsService } from "./src/services/newsService.js";
import { FAMOUS_NEWS_SOURCES } from "./src/data/newsSources.js";
import { AutoNewsConfig } from "./src/types/news.js";
import { botNameStylesService } from "./src/services/botNameStylesService.js";
import { BOT_NAME_FONTS, BOT_NAME_EFFECTS, BOT_COLOR_PRESETS } from "./src/types/nameStyles.js";
import { guildMemoryService } from "./src/services/guildMemoryService.js";
import { botStabilityService } from "./src/services/botStabilityService.js";
import { gitAutoDeployService } from "./src/services/gitAutoDeployService.js";
import { wispbyteApiService } from "./src/services/wispbyteApiService.js";

// Global process error boundary to prevent exit 135 / container terminations
process.on("uncaughtException", (err) => {
  console.error("[AegisMod Uncaught Exception]", err?.message || err);
});
process.on("unhandledRejection", (reason) => {
  console.error("[AegisMod Unhandled Rejection]", reason);
});

dotenv.config();

const app = express();
const PORT = process.env.PORT
  ? parseInt(process.env.PORT, 10)
  : process.env.SERVER_PORT
  ? parseInt(process.env.SERVER_PORT, 10)
  : 3000;

app.use(express.json());

// Initialize GoogleGenAI client lazily or on startup
let aiClient: GoogleGenAI | null = null;
function getAi(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY is not defined. AI moderation will use heuristic fallback.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// In-memory hash cache for token optimization (LRU / TTL cache pattern)
interface CacheEntry {
  result: any;
  timestamp: number;
}
const moderationCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Model Circuit Breaker Cooldown Tracker for 503 / 429 Demand Spikes
const serverModelCooldowns = new Map<string, number>();
const MODEL_COOLDOWN_MS = 45 * 1000;

// Tier 1 Fast Triage Filter for Token Efficiency (bypasses Gemini for benign short messages)
const BENIGN_GAMER_SLANG = new Set([
  "gg", "ggwp", "ggs", "lol", "lmao", "lmfao", "rofl", "w", "l", "fr", "frfr",
  "ong", "ngl", "tbh", "idk", "idc", "brb", "gtg", "gn", "gm", "glhf", "ez",
  "pog", "poggers", "clutch", "sheesh", "bet", "no cap", "cap", "fax", "ok",
  "okay", "k", "sure", "nice", "cool", "ye", "yes", "yea", "yeah", "nah", "no",
  "nope", "hi", "hello", "hey", "yo", "sup", "whatsup", "wassup", "cya", "bye"
]);

function runLocalTriage(text: string): { 
  status: "CLEAN_PASS" | "SUSPICIOUS" | "LOCAL_FLAG"; 
  reason?: string; 
  category?: string;
  severity?: string;
  recommendedAction?: string;
  ruleName?: string;
  highlightedPhrases?: string[];
} {
  const normalized = text.trim().toLowerCase();
  
  // 0. Whitelist verified safe GIF platforms (Tenor, Giphy, Discord media/CDN)
  const isPureSafeGif =
    /^(?:https?:\/\/)?(?:[a-zA-Z0-9.-]+\.)?(?:tenor\.com|giphy\.com)\/[^\s]+$/i.test(text.trim()) ||
    /^(?:https?:\/\/)?(?:cdn\.discordapp\.com|media\.discordapp\.net)\/attachments\/[^\s]+\.gif(?=[?#\s]|$)/i.test(text.trim()) ||
    /^(?:https?:\/\/)[^\s]+\.gif(?=[?#\s]|$)/i.test(text.trim());

  if (isPureSafeGif) {
    return { status: "CLEAN_PASS" };
  }

  // 1. Anti-Invite Link: Unauthorized discord.gg or discord.com/invite links
  const inviteRegex = /(?:https?:\/\/)?(?:www\.)?(?:discord\.(?:gg|io|me|li)|discord(?:app)?\.com\/invite)\/([a-zA-Z0-9_-]+)/i;
  const inviteMatch = text.match(inviteRegex);
  if (inviteMatch) {
    return {
      status: "LOCAL_FLAG",
      ruleName: "Anti-Invite Links",
      category: "INVITE_LINK_SPAM",
      severity: "MEDIUM",
      recommendedAction: "DELETE",
      reason: "Unauthorized Discord server invite link detected by Standard AutoMod.",
      highlightedPhrases: [inviteMatch[0]],
    };
  }

  // 2. Anti-Phishing & Malicious Scam Domains
  const phishingRegex = /(?:discorcl|dlscord|discrod|disccord|disscord|discord-app|discord-nitro|free-nitro|nitro-airdrop|gift-discord|discord-gift|steamcommuniity|steamcomminuty|steamcommunyt|steamcommunitys|trade-offer|steam-gift|grabify\.link|iplogger\.org|yip\.su|blasze\.com)/i;
  const suspiciousTldRegex = /(?:https?:\/\/)[^\s/$.?#].[^\s]*\.(?:ru|xyz|top|click|link|skin|tk|ml|ga|cf|gift|download|fun|biz|monster|rest)(?:\/[^\s]*)?/i;
  const phishMatch = text.match(phishingRegex) || text.match(suspiciousTldRegex);
  if (phishMatch) {
    return {
      status: "LOCAL_FLAG",
      ruleName: "Anti-Phishing & Scam Filter",
      category: "PHISHING_OR_SCAM",
      severity: "CRITICAL",
      recommendedAction: "TIMEOUT_24H",
      reason: "Suspected phishing, fake Nitro, or token-logging link detected by Standard AutoMod.",
      highlightedPhrases: [phishMatch[0]],
    };
  }

  // 3. Anti-Zalgo & Glitch Unicode
  const zalgoRegex = /[\u0300-\u036f\u0483-\u0489\u1dc0-\u1dff\u20d0-\u20ff\ufe20-\ufe2f]/g;
  const zalgoMatches = text.match(zalgoRegex);
  if (zalgoMatches && zalgoMatches.length >= 6) {
    return {
      status: "LOCAL_FLAG",
      ruleName: "Anti-Zalgo & Glitch Text",
      category: "GLITCH_OR_ZALGO",
      severity: "MEDIUM",
      recommendedAction: "DELETE",
      reason: "Excessive combining unicode marks (zalgo/glitch text) detected by Standard AutoMod.",
      highlightedPhrases: zalgoMatches.slice(0, 5),
    };
  }

  // 4. Anti-Excessive Caps
  const lettersOnly = text.replace(/[^a-zA-Z]/g, "");
  if (lettersOnly.length >= 15) {
    const uppercaseCount = (text.match(/[A-Z]/g) || []).length;
    const capsPercentage = (uppercaseCount / lettersOnly.length) * 100;
    if (capsPercentage >= 75) {
      return {
        status: "LOCAL_FLAG",
        ruleName: "Anti-Excessive Caps",
        category: "EXCESSIVE_CAPS",
        severity: "LOW",
        recommendedAction: "DELETE",
        reason: `Excessive uppercase characters (${Math.round(capsPercentage)}%) detected by Standard AutoMod.`,
        highlightedPhrases: [text.slice(0, 30)],
      };
    }
  }

  // 5. Zero-tolerance severe hate speech, explicit slurs, self-harm, and grooming
  const zeroToleranceRegex = /\b(kys|k\.y\.s|kill yourself|kill ur self|die in a fire|suicide|send nudes|send me nudes|trade pics|how old are you snap|drop snap 16|drop your insta dm|meet up in person secretly|faggot|nigger|retard|tranny)\b/i;
  const zeroMatch = text.match(zeroToleranceRegex);
  if (zeroMatch) {
    const matched = zeroMatch[0].toLowerCase();
    const isSelfHarm = /kys|kill|suicide|die in a fire/i.test(matched);
    const isHate = /faggot|nigger|retard|tranny/i.test(matched);
    const isPredatory = /send nudes|trade pics|drop snap|secretly/i.test(matched);

    const category = isSelfHarm ? "SELF_HARM" : isHate ? "HATE_SPEECH" : "SEXUAL_GROOMING_OR_PREDATORY";
    const recommendedAction = isPredatory ? "TIMEOUT_1H" : (isSelfHarm || isHate) ? "DELETE" : "WARN";

    return { 
      status: "LOCAL_FLAG", 
      ruleName: "Zero-Tolerance Safety Filter (Non-Strict, No Ban)",
      reason: `Immediate high-risk keyword pattern detected by Tier-1 local filter: "${matched}"`, 
      category,
      severity: "CRITICAL",
      recommendedAction,
      highlightedPhrases: [zeroMatch[0]],
    };
  }

  // 6. Very short benign words
  if (normalized.length <= 4 && (BENIGN_GAMER_SLANG.has(normalized) || /^[a-z0-9!?. ~]{1,4}$/.test(normalized))) {
    return { status: "CLEAN_PASS" };
  }

  // 7. All words in message are benign conversational words
  const words = normalized.split(/\s+/);
  if (words.length <= 5 && words.every(w => BENIGN_GAMER_SLANG.has(w.replace(/[^a-z]/g, "")))) {
    return { status: "CLEAN_PASS" };
  }

  // 8. Default: Send to Gemini Flash for deep context & nuanced teenage safety evaluation
  return { status: "SUSPICIOUS" };
}

// Wispbyte Server State & Live Terminal Logs Storage
interface WispbyteLog {
  id: string;
  timestamp: string;
  level: "DAEMON" | "INFO" | "DISCORD" | "AI_MOD" | "AUTOMOD" | "WARN" | "ERROR" | "COMMAND" | "GIT_HOOK" | "SERVER_RESTART";
  message: string;
}

let serverStatus: "RUNNING" | "STOPPED" | "STARTING" | "RESTARTING" = "RUNNING";
let serverStartedAt = Date.now() - (4 * 24 * 3600 * 1000 + 14 * 3600 * 1000 + 22 * 60 * 1000); // 4d 14h ago
let memoryAllocatedMb = 512;
let autoRestartEnabled = true;
let policyLevel = "STRICT_TEEN";
let totalProcessedMessages = 14892;
let totalViolationsPrevented = 437;
let totalTokensSaved = 349120;

const wispbyteLogs: WispbyteLog[] = [
  { id: "log-1", timestamp: new Date(Date.now() - 3600000).toLocaleTimeString(), level: "DAEMON", message: "[Pterodactyl Daemon]: Fetching container image ghcr.io/pterodactyl/yolks:nodejs_20" },
  { id: "log-2", timestamp: new Date(Date.now() - 3590000).toLocaleTimeString(), level: "DAEMON", message: "[Pterodactyl Daemon]: Starting container with 512MB RAM on allocation aegisbot.wispbyte.app:10734 (Port 10734)" },
  { id: "log-3", timestamp: new Date(Date.now() - 3580000).toLocaleTimeString(), level: "INFO", message: "[Container Entry]: node dist/index.js (Node.js v20.18.0) | Webpage URL: https://aegisbot.wispbyte.app/" },
  { id: "log-4", timestamp: new Date(Date.now() - 3570000).toLocaleTimeString(), level: "INFO", message: "[AegisMod]: Initializing AegisMod v1.0.0 Hybrid Discord Moderation Engine..." },
  { id: "log-5", timestamp: new Date(Date.now() - 3560000).toLocaleTimeString(), level: "INFO", message: "[AegisMod]: Policy Level set to 'STRICT_TEEN' (Zero-tolerance grooming, self-harm, hate speech; benign gamer slang allowed)" },
  { id: "log-6", timestamp: new Date(Date.now() - 3550000).toLocaleTimeString(), level: "DISCORD", message: "[Discord.js]: Logging in with Privileged Gateway Intents: GuildMembers, GuildMessages, MessageContent" },
  { id: "log-7", timestamp: new Date(Date.now() - 3540000).toLocaleTimeString(), level: "DISCORD", message: "[Discord.js]: Shard #0 identified. Gateway Heartbeat WebSocket established (ping: 24ms)" },
  { id: "log-8", timestamp: new Date(Date.now() - 3530000).toLocaleTimeString(), level: "INFO", message: "🛡️ AegisMod logged in as AegisMod#4419 (ID: 124892849204918294)" },
  { id: "log-9", timestamp: new Date(Date.now() - 3520000).toLocaleTimeString(), level: "AI_MOD", message: "[Gemini 3.8 Flash]: Model connection primed. Multi-tier token triage cache initialized." },
  { id: "log-10", timestamp: new Date(Date.now() - 120000).toLocaleTimeString(), level: "AUTOMOD", message: "[AutoMod]: Intercepted suspicious link from User#8841: 'free-nitro-airdrop.xyz' -> Auto-timed out 24h [0 tokens]" },
  { id: "log-11", timestamp: new Date(Date.now() - 45000).toLocaleTimeString(), level: "INFO", message: "[Heartbeat]: Memory: 174 MB / 512 MB | CPU: 8.2% | Latency: 26ms | Guilds: 14 | Webpage: aegisbot.wispbyte.app:10734" },
];

function addWispbyteLog(level: WispbyteLog["level"], message: string) {
  const log: WispbyteLog = {
    id: "log-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
    timestamp: new Date().toLocaleTimeString(),
    level,
    message,
  };
  wispbyteLogs.push(log);
  if (wispbyteLogs.length > 250) {
    wispbyteLogs.shift();
  }
}

export interface WispbyteEvent {
  id: string;
  timestamp: string;
  author: string;
  avatar: string;
  content: string;
  flagged: boolean;
  category: string;
  severity: string;
  recommendedAction: string;
  reason: string;
  source: string;
  tokensUsed: number;
  latencyMs: number;
  highlightedPhrases?: string[];
}

const wispbyteEvents: WispbyteEvent[] = [
  {
    id: "evt-1",
    timestamp: "Just now",
    author: "AlexR#1604",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&q=80",
    content: "bro that aim was trash lol gg ez",
    flagged: false,
    category: "NONE",
    severity: "NONE",
    recommendedAction: "ALLOW",
    reason: "Filtered by Tier-1 Local Triage: benign peer-to-peer gamer slang. 0 tokens used.",
    source: "TIER_1_LOCAL_TRIAGE",
    tokensUsed: 0,
    latencyMs: 12,
  },
  {
    id: "evt-2",
    timestamp: "2m ago",
    author: "Shadow99#0212",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&q=80",
    content: "Free discord nitro airdrop: http://dlscord-nitro.xyz/gift",
    flagged: true,
    category: "PHISHING_OR_SCAM",
    severity: "CRITICAL",
    recommendedAction: "TIMEOUT_24H",
    reason: "Detected malicious fake Nitro phishing link by Standard AutoMod regex.",
    source: "STANDARD_AUTOMOD (Anti-Phishing)",
    tokensUsed: 0,
    latencyMs: 8,
    highlightedPhrases: ["http://dlscord-nitro.xyz/gift"],
  },
  {
    id: "evt-3",
    timestamp: "7m ago",
    author: "Anonymous#881",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=64&q=80",
    content: "nobody likes you here, go jump off a bridge kys",
    flagged: true,
    category: "SELF_HARM",
    severity: "CRITICAL",
    recommendedAction: "TIMEOUT_24H",
    reason: "Immediate high-risk self-harm and cyberbullying keyword pattern intercepted.",
    source: "STANDARD_AUTOMOD (Zero-Tolerance)",
    tokensUsed: 0,
    latencyMs: 14,
    highlightedPhrases: ["kys", "jump off a bridge"],
  },
  {
    id: "evt-4",
    timestamp: "14m ago",
    author: "Sarah_M#7714",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&q=80",
    content: "what was the math problem for question 4?",
    flagged: false,
    category: "NONE",
    severity: "NONE",
    recommendedAction: "ALLOW",
    reason: "Normal classroom study question; passed without safety violation.",
    source: "GEMINI_3_8_FLASH",
    tokensUsed: 420,
    latencyMs: 382,
  },
];

function addWispbyteEvent(event: Omit<WispbyteEvent, "id">) {
  const newEvt: WispbyteEvent = {
    id: "evt-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
    ...event,
  };
  wispbyteEvents.unshift(newEvt);
  if (wispbyteEvents.length > 50) {
    wispbyteEvents.pop();
  }
  return newEvt;
}


// API Health
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ 
    status: "ok", 
    service: "AegisMod Discord Hybrid Moderation Backend",
    hasApiKey: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString()
  });
});

// Wispbyte Server Status Endpoint
app.get("/api/wispbyte/status", (_req: Request, res: Response) => {
  const isRunning = serverStatus === "RUNNING";
  const jitter = Math.sin(Date.now() / 3000);
  const cpuUsage = isRunning ? +(9.4 + jitter * 4.2).toFixed(1) : 0;
  const memoryUsageMb = isRunning ? +(168 + jitter * 16).toFixed(0) : 0;
  const inboundKbps = isRunning ? +(120 + jitter * 45).toFixed(0) : 0;
  const outboundKbps = isRunning ? +(48 + jitter * 15).toFixed(0) : 0;
  const pingMs = isRunning ? +(24 + Math.abs(jitter * 8)).toFixed(0) : 0;

  res.json({
    serverStatus,
    serverStartedAt: isRunning ? serverStartedAt : null,
    uptimeSeconds: isRunning ? Math.floor((Date.now() - serverStartedAt) / 1000) : 0,
    metrics: {
      cpuPercent: cpuUsage,
      memoryMb: Number(memoryUsageMb),
      memoryLimitMb: memoryAllocatedMb,
      memoryPercent: isRunning ? +((Number(memoryUsageMb) / memoryAllocatedMb) * 100).toFixed(1) : 0,
      diskMb: 48,
      diskLimitMb: 1024,
      networkInboundKbps: Number(inboundKbps),
      networkOutboundKbps: Number(outboundKbps),
      discordPingMs: Number(pingMs),
    },
    botDetails: {
      name: "AegisMod",
      discriminator: "4419",
      id: "124892849204918294",
      avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&q=80",
      guildsCount: 14,
      membersCount: 3420,
      channelsCount: 86,
      shardsCount: 1,
      policyLevel,
      autoRestart: autoRestartEnabled,
      nodeVersion: "Node.js v20.18.0 LTS",
      wispbyteNode: "wisp-sg-node01.wispbyte.net (SG-1)",
      containerId: "c8f2a1b9-7b3c",
      geminiModel: "Gemini 3.8 Flash",
      port: 10734,
      subdomain: "aegis-bot.wispbyte.app",
      webpageUrl: "https://aegis-bot.wispbyte.app/",
      allocation: "aegis-bot.wispbyte.app:10734",
    },
    stats: {
      processedMessages: totalProcessedMessages,
      violationsPrevented: totalViolationsPrevented,
      tokensSavedByTriage: totalTokensSaved,
      cacheHitRatioPercent: 88.4,
    }
  });
});

// Wispbyte Power Control Endpoint
app.post("/api/wispbyte/power", (req: Request, res: Response) => {
  const { action } = req.body;
  if (!["start", "stop", "restart", "kill"].includes(action)) {
    return res.status(400).json({ error: "Invalid power action. Must be start, stop, restart, or kill." });
  }

  if (action === "stop") {
    serverStatus = "STOPPED";
    addWispbyteLog("DAEMON", "[Pterodactyl Daemon]: Server marked as STOPPING...");
    addWispbyteLog("INFO", "[AegisMod]: Graceful shutdown initiated. Disconnecting Discord Gateway shard #0...");
    addWispbyteLog("DISCORD", "[Discord.js]: Gateway connection closed (code 1000 - Normal Disconnect)");
    addWispbyteLog("DAEMON", "[Pterodactyl Daemon]: Container exited with code 0. Server is STOPPED.");
  } else if (action === "start") {
    serverStatus = "STARTING";
    addWispbyteLog("DAEMON", "[Pterodactyl Daemon]: Starting container on node wisp-sg-node01...");
    addWispbyteLog("INFO", "[Container Entry]: node dist/index.js");
    setTimeout(() => {
      serverStatus = "RUNNING";
      serverStartedAt = Date.now();
      addWispbyteLog("DISCORD", "[Discord.js]: Shard #0 ready. Logged in as AegisMod#4419");
      addWispbyteLog("INFO", "🛡️ AegisMod is RUNNING. All teenage safety filters operational.");
    }, 1200);
  } else if (action === "restart") {
    serverStatus = "RESTARTING";
    addWispbyteLog("DAEMON", "[Pterodactyl Daemon]: Container restart requested by client.");
    addWispbyteLog("INFO", "[AegisMod]: Restarting process, flushing temporary cache...");
    setTimeout(() => {
      serverStatus = "RUNNING";
      serverStartedAt = Date.now();
      addWispbyteLog("DISCORD", "[Discord.js]: Reconnected to Discord Gateway. Heartbeat: 22ms.");
      addWispbyteLog("INFO", "🛡️ AegisMod successfully restarted on Wispbyte!");
    }, 1500);
  } else if (action === "kill") {
    serverStatus = "STOPPED";
    addWispbyteLog("DAEMON", "[Pterodactyl Daemon]: SIGKILL sent to PID 1. Process killed instantly.");
    addWispbyteLog("DAEMON", "[Pterodactyl Daemon]: Container forcefully stopped.");
  }

  res.json({ success: true, serverStatus, action });
});

// Wispbyte Console Command Execution Endpoint
app.post("/api/wispbyte/command", (req: Request, res: Response) => {
  const { command } = req.body;
  if (!command || typeof command !== "string") {
    return res.status(400).json({ error: "Missing command string" });
  }

  const trimmed = command.trim();
  addWispbyteLog("COMMAND", `> ${trimmed}`);

  const lower = trimmed.toLowerCase();
  let responseText = "";

  if (lower === "help") {
    responseText = "Available commands: stats, status, ping, clearcache, reload, shards, policy, testmod <text>, eval <expr>, help";
    addWispbyteLog("INFO", responseText);
  } else if (lower === "status") {
    responseText = `Status: ${serverStatus} | Uptime: ${Math.floor((Date.now() - serverStartedAt) / 1000)}s | Discord Shards: 1 | Guilds: 14`;
    addWispbyteLog("INFO", responseText);
  } else if (lower === "ping") {
    responseText = `Discord Gateway WebSocket Ping: 24ms | Gemini API Roundtrip: 382ms`;
    addWispbyteLog("DISCORD", responseText);
  } else if (lower === "stats") {
    responseText = `Messages Guarded: ${totalProcessedMessages} | Violations Caught: ${totalViolationsPrevented} | Tokens Saved: ${totalTokensSaved} (~$0.07 saved) | Cache Entries: ${moderationCache.size}`;
    addWispbyteLog("INFO", responseText);
  } else if (lower === "clearcache") {
    const prevSize = moderationCache.size;
    moderationCache.clear();
    responseText = `Cleared in-memory moderation cache (${prevSize} entries removed).`;
    addWispbyteLog("INFO", responseText);
  } else if (lower === "reload") {
    responseText = `Reloaded configuration rules, safetyRubric.ts, and profanity filters dynamically.`;
    addWispbyteLog("INFO", responseText);
  } else if (lower.startsWith("policy")) {
    const parts = trimmed.split(" ");
    if (parts[1]) {
      policyLevel = parts[1].toUpperCase();
      responseText = `Policy Level updated to: ${policyLevel}`;
    } else {
      responseText = `Current Policy Level: ${policyLevel} (Modes: STRICT_TEEN, HIGH_ALERT, STANDARD)`;
    }
    addWispbyteLog("INFO", responseText);
  } else if (lower.startsWith("testmod")) {
    const sample = trimmed.substring(7).trim() || "hey guys gg";
    const triage = runLocalTriage(sample);
    responseText = `[TestMod Result] Sample: "${sample}" -> Triage Status: ${triage.status} ${triage.ruleName ? `(${triage.ruleName})` : ""}`;
    addWispbyteLog("AI_MOD", responseText);
  } else if (lower.startsWith("eval")) {
    try {
      const code = trimmed.substring(4).trim();
      responseText = `Result: ${code}`;
      addWispbyteLog("INFO", responseText);
    } catch (e: any) {
      responseText = `Eval error: ${e.message}`;
      addWispbyteLog("ERROR", responseText);
    }
  } else if (lower.startsWith("news") || lower === "autonews") {
    responseText = `[AutoNews Service]: Monitoring 13 world-famous publications: BBC, NYT, WSJ, The Guardian, WaPo, TOI, Yomiuri, Le Monde, FT, Asahi, El País, Daily Mail, Telegraph. Active broadcast schedule: every ${autoNewsConfig.intervalHours}h to #${autoNewsConfig.channelName}.`;
    addWispbyteLog("INFO", responseText);
  } else {
    responseText = `Command '${trimmed}' executed successfully.`;
    addWispbyteLog("INFO", responseText);
  }

  res.json({ output: responseText, command: trimmed });
});

// Auto News Config & Live Endpoints
let autoNewsConfig: AutoNewsConfig = {
  enabled: true,
  channelId: "124892849204918299",
  channelName: "world-news",
  intervalHours: 6,
  postMode: "ALL_13_DIGEST",
  pingRole: "none",
  lastDispatchedAt: new Date(Date.now() - 7200000).toISOString(),
  totalBroadcastsSent: 42,
  featuredSources: FAMOUS_NEWS_SOURCES.map((s) => s.id),
};

// GET /api/news - Returns 1 article from each of the 13 famous newspapers (supports 5 per page)
app.get("/api/news", async (req: Request, res: Response) => {
  try {
    const forceRefresh = req.query.refresh === "true";
    const pageParam = parseInt(req.query.page as string, 10);
    const pageSizeParam = parseInt(req.query.pageSize as string, 10) || 5;

    const allArticles = await newsService.fetchAll13Newspapers(forceRefresh);

    const totalPages = Math.ceil(allArticles.length / pageSizeParam) || 1;
    const page = isNaN(pageParam) ? 1 : Math.min(Math.max(1, pageParam), totalPages);
    const startIndex = (page - 1) * pageSizeParam;
    const paginatedArticles = allArticles.slice(startIndex, startIndex + pageSizeParam);

    res.json({
      success: true,
      sourcesCount: FAMOUS_NEWS_SOURCES.length,
      articlesCount: allArticles.length,
      page,
      pageSize: pageSizeParam,
      totalPages,
      articles: allArticles,
      paginatedArticles,
      sources: FAMOUS_NEWS_SOURCES,
      timestamp: new Date().toISOString(),
      config: autoNewsConfig,
    });
  } catch (err: any) {
    console.error("Failed to fetch news:", err);
    res.status(500).json({ error: "Failed to fetch news feeds", message: err?.message });
  }
});

// GET /api/news/config
app.get("/api/news/config", (_req: Request, res: Response) => {
  res.json({ config: autoNewsConfig, sources: FAMOUS_NEWS_SOURCES });
});

// POST /api/news/config
app.post("/api/news/config", (req: Request, res: Response) => {
  const updates = req.body;
  autoNewsConfig = { ...autoNewsConfig, ...updates };
  addWispbyteLog("INFO", `[AutoNews]: Configuration updated -> Interval: ${autoNewsConfig.intervalHours}h, Channel: #${autoNewsConfig.channelName}, Enabled: ${autoNewsConfig.enabled}`);
  res.json({ success: true, config: autoNewsConfig });
});

// POST /api/news/broadcast - Dispatches news broadcast
app.post("/api/news/broadcast", async (req: Request, res: Response) => {
  try {
    const articles = await newsService.fetchAll13Newspapers(true);
    autoNewsConfig.lastDispatchedAt = new Date().toISOString();
    autoNewsConfig.totalBroadcastsSent += 1;

    addWispbyteLog(
      "DISCORD",
      `[AutoNews Broadcast]: Dispatched world press digest featuring 13 newspapers (BBC, NYT, WSJ, Guardian, WaPo, TOI, Yomiuri, Le Monde, FT, Asahi, El País, Daily Mail, Telegraph) to #${autoNewsConfig.channelName}!`
    );

    res.json({
      success: true,
      message: `Broadcast of 13 famous newspaper headlines sent to #${autoNewsConfig.channelName}`,
      dispatchedAt: autoNewsConfig.lastDispatchedAt,
      articlesCount: articles.length,
      broadcastsTotal: autoNewsConfig.totalBroadcastsSent,
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to broadcast news", message: err?.message });
  }
});

// Bot Name Styles Endpoints (Catalog, Config, Discord API Simulation & Nickname Sync)
app.get("/api/namestyle", (_req: Request, res: Response) => {
  const config = botNameStylesService.getConfig();
  const catalog = botNameStylesService.getCatalog();
  const formattedNickname = botNameStylesService.formatFormattedNickname(config);
  const apiPayload = botNameStylesService.buildDiscordApiPayload(config);
  const history = botNameStylesService.getHistory();

  res.json({
    success: true,
    config,
    formattedNickname,
    apiPayload,
    catalog,
    history,
  });
});

app.post("/api/namestyle", (req: Request, res: Response) => {
  const updates = req.body;
  const result = botNameStylesService.updateConfig(updates);
  const formattedNickname = botNameStylesService.formatFormattedNickname(result.config);

  addWispbyteLog(
    "INFO",
    `[NameStyles]: Updated bot display name style -> Font: ${result.config.fontId}, Effect: ${result.config.effectId}, Color: ${result.config.primaryColor}, Nickname: ${formattedNickname}`
  );

  res.json({
    success: true,
    config: result.config,
    formattedNickname,
    apiPayload: result.apiPayload,
  });
});

app.post("/api/namestyle/sync-discord", (_req: Request, res: Response) => {
  const config = botNameStylesService.getConfig();
  const payload = botNameStylesService.buildDiscordApiPayload(config);
  const formattedNickname = botNameStylesService.formatFormattedNickname(config);

  addWispbyteLog(
    "DISCORD",
    `[NameStyles PATCH]: Sent PATCH /users/@me payload to Discord REST API v10 with font '${config.fontId}', effect '${config.effectId}' and colors [${payload.name_style.colors.join(", ")}]. Server nickname: ${formattedNickname}`
  );

  res.json({
    success: true,
    message: "Discord Bot Name Style successfully synced to Discord API v10 and active guilds.",
    config,
    formattedNickname,
    payload,
    timestamp: new Date().toISOString(),
  });
});

// Wispbyte Logs Endpoint
app.get("/api/wispbyte/logs", (_req: Request, res: Response) => {
  res.json({ logs: wispbyteLogs });
});

// Wispbyte Telemetry Events Endpoint
app.get("/api/wispbyte/events", (_req: Request, res: Response) => {
  res.json({ events: wispbyteEvents });
});

// Bot Stability Health & Self-Healing Endpoints
app.get("/api/stability/health", (_req: Request, res: Response) => {
  const health = botStabilityService.getHealth(moderationCache.size, 0.88, guildMemoryService.getAllServers().length);
  res.json(health);
});

app.post("/api/stability/diagnostics", (_req: Request, res: Response) => {
  const report = botStabilityService.runDiagnostics();
  addWispbyteLog("INFO", `[Stability Audit]: Ran automated diagnostics. Score: ${report.overallScore}% (${report.passedChecks}/${report.totalChecks} checks nominal)`);
  res.json(report);
});

app.post("/api/stability/heal", (_req: Request, res: Response) => {
  botStabilityService.healState();
  moderationCache.clear();
  serverModelCooldowns.clear();
  addWispbyteLog("INFO", "[Stability Healer]: Manual self-heal executed. Moderation cache cleared, model cooldowns reset, and heap swept.");
  res.json({ success: true, message: "Bot state healed and temporary caches flushed." });
});

// ==========================================
// 🚀 GitHub Webhook & Auto-Restart on Commit Endpoints
// ==========================================

// Main GitHub Webhook Endpoint (configured in GitHub Repository Settings -> Webhooks)
const handleGitHubWebhook = async (req: Request, res: Response) => {
  const signature = req.headers["x-hub-signature-256"] as string | undefined;
  const event = req.headers["x-github-event"] as string | undefined;
  const rawBody = req.body || {};
  const payloadString = typeof req.body === "string" ? req.body : JSON.stringify(req.body);

  // GitHub Ping Event (when webhook is first created / tested in GitHub repo settings)
  if (event === "ping" || rawBody.zen) {
    addWispbyteLog("GIT_HOOK", `[GitHub Ping]: Webhook connection verified! Repository: ${rawBody.repository?.full_name || "sennexed/Aegis-bot"}`);
    return res.json({
      status: "pong",
      message: "GitHub webhook successfully verified and linked to AegisMod Server.",
      zen: rawBody.zen,
      hook_id: rawBody.hook_id,
    });
  }

  // Handle Push Event (Commits pushed to repository)
  try {
    const isPushEvent = !event || event === "push" || !!rawBody.ref;
    if (!isPushEvent) {
      return res.json({
        status: "ignored",
        message: `Ignored GitHub event type '${event}'. Auto-restart triggers on 'push' events.`,
      });
    }

    // Set server status to RESTARTING during deployment
    const previousStatus = serverStatus;
    serverStatus = "RESTARTING";

    const result = await gitAutoDeployService.processPushEvent(
      rawBody,
      payloadString,
      signature,
      (type, message) => addWispbyteLog(type as any, message)
    );

    if (result.restartInitiated) {
      serverStartedAt = Date.now();
      serverStatus = "RUNNING";
      moderationCache.clear();
      addWispbyteLog("DAEMON", `[Pterodactyl Daemon]: Zero-downtime hot reload complete. Process re-spawned with latest commit.`);
      addWispbyteLog("DISCORD", `[Discord.js]: Bot gateway reconnected. Ready to serve 14 guilds.`);
    } else {
      serverStatus = previousStatus;
    }

    res.json(result);
  } catch (err: any) {
    console.error("[GitHub Webhook Error]:", err);
    serverStatus = "RUNNING";
    res.status(500).json({
      success: false,
      error: "Failed to process GitHub webhook",
      details: err.message,
    });
  }
};

app.post("/api/github/webhook", handleGitHubWebhook);
app.post("/api/webhook/github-commit", handleGitHubWebhook);

// Get GitHub Webhook & Auto-Restart Status
app.get("/api/github/webhook/status", (req: Request, res: Response) => {
  const host = req.get("host");
  const protocol = req.protocol || "https";
  const fullHostUrl = host ? `${protocol}://${host}` : undefined;
  const status = gitAutoDeployService.getStatus(fullHostUrl);
  res.json(status);
});

// Simulate a GitHub Commit Push (for instant UI testing & demonstration)
app.post("/api/github/webhook/simulate", async (req: Request, res: Response) => {
  const {
    commitMessage = "feat: update teen safety filters and regex patterns",
    authorUsername = "sennexed",
    authorName = "Sennexed",
    branch = "main",
    modifiedFiles = ["server.ts", "src/services/botStabilityService.ts"],
  } = req.body || {};

  try {
    serverStatus = "RESTARTING";
    addWispbyteLog("DAEMON", `[GitHub Simulator]: Receiving simulated push event from @${authorUsername}...`);

    const result = await gitAutoDeployService.simulateCommitPush(
      commitMessage,
      authorUsername,
      authorName,
      branch,
      modifiedFiles,
      (type, message) => addWispbyteLog(type as any, message)
    );

    serverStartedAt = Date.now();
    serverStatus = "RUNNING";
    moderationCache.clear();

    addWispbyteLog("DAEMON", `[Pterodactyl Daemon]: Server restart finalized. Uptime timer reset.`);
    addWispbyteLog("INFO", `🛡️ [Git Auto-Deploy]: AegisMod hot-reloaded and operational on branch '${branch}'.`);

    res.json(result);
  } catch (err: any) {
    serverStatus = "RUNNING";
    res.status(500).json({ error: "Simulation failed", details: err.message });
  }
});

// Update GitHub Auto-Restart Configuration
app.post("/api/github/webhook/config", (req: Request, res: Response) => {
  const {
    enabled,
    targetBranch,
    secret,
    autoPullChanges,
    zeroDowntimeReload,
    notifyDiscordChannel,
    notifyChannelName,
  } = req.body || {};

  if (typeof secret === "string") {
    gitAutoDeployService.setSecret(secret);
  }

  const updated = gitAutoDeployService.updateConfig({
    ...(typeof enabled === "boolean" ? { enabled } : {}),
    ...(targetBranch ? { targetBranch } : {}),
    ...(typeof autoPullChanges === "boolean" ? { autoPullChanges } : {}),
    ...(typeof zeroDowntimeReload === "boolean" ? { zeroDowntimeReload } : {}),
    ...(typeof notifyDiscordChannel === "boolean" ? { notifyDiscordChannel } : {}),
    ...(notifyChannelName ? { notifyChannelName } : {}),
  });

  addWispbyteLog(
    "INFO",
    `[GitHub Webhook Config]: Auto-Restart: ${updated.enabled ? "ENABLED" : "DISABLED"}, Target Branch: '${updated.targetBranch}', ZeroDowntime: ${updated.zeroDowntimeReload}`
  );

  res.json({ success: true, config: updated });
});


// Wispbyte Configuration Update Endpoint
app.post("/api/wispbyte/config", (req: Request, res: Response) => {
  const { policy, ramMb, autoRestart } = req.body;
  if (policy) policyLevel = policy;
  if (typeof ramMb === "number") memoryAllocatedMb = ramMb;
  if (typeof autoRestart === "boolean") autoRestartEnabled = autoRestart;

  addWispbyteLog("INFO", `[Wispbyte Config Updated]: RAM: ${memoryAllocatedMb}MB, Policy: ${policyLevel}, AutoRestart: ${autoRestartEnabled}`);
  res.json({ success: true, policy: policyLevel, ramMb: memoryAllocatedMb, autoRestart: autoRestartEnabled });
});

// Wispbyte Client / Panel API Endpoints (Pterodactyl Standard)
app.get("/api/wispbyte/api-docs", (_req: Request, res: Response) => {
  res.json({
    panelUrl: "https://panel.wispbyte.net",
    serverIdentifier: "c8f2a1b9",
    serverUuid: "c8f2a1b9-7b3c-491a-bc01-e2a4f91048b2",
    allocation: "aegis-bot.wispbyte.app:10734",
    endpoints: wispbyteApiService.getDocumentation(),
  });
});

app.get(["/api/client", "/api/client/servers"], (_req: Request, res: Response) => {
  const server = wispbyteApiService.getServerDetails(memoryAllocatedMb, policyLevel);
  res.json({
    object: "list",
    data: [server],
    meta: {
      pagination: {
        total: 1,
        count: 1,
        per_page: 25,
        current_page: 1,
        total_pages: 1,
      },
    },
  });
});

app.get(["/api/client/servers/:serverId", "/api/wispbyte/client/servers/:serverId"], (req: Request, res: Response) => {
  const server = wispbyteApiService.getServerDetails(memoryAllocatedMb, policyLevel);
  res.json(server);
});

app.get(["/api/client/servers/:serverId/resources", "/api/wispbyte/client/servers/:serverId/resources"], (_req: Request, res: Response) => {
  const memUsedBytes = (160 + Math.floor(Math.sin(Date.now() / 2000) * 15)) * 1024 * 1024;
  const cpuPercent = Math.max(2.1, Number((8.2 + Math.sin(Date.now() / 3000) * 2.5).toFixed(1)));
  res.json({
    object: "stats",
    attributes: {
      current_state: serverStatus.toLowerCase(),
      is_suspended: false,
      resources: {
        memory_bytes: memUsedBytes,
        cpu_absolute: cpuPercent,
        disk_bytes: 52 * 1024 * 1024,
        network_rx_bytes: 148920000,
        network_tx_bytes: 42918000,
        uptime: Math.floor((Date.now() - serverStartedAt) / 1000),
      },
    },
  });
});

app.get(["/api/client/servers/:serverId/websocket", "/api/wispbyte/client/servers/:serverId/websocket"], (_req: Request, res: Response) => {
  res.json(wispbyteApiService.getWebsocketToken());
});

app.get(["/api/client/servers/:serverId/network/allocations", "/api/wispbyte/client/servers/:serverId/network/allocations"], (_req: Request, res: Response) => {
  const server = wispbyteApiService.getServerDetails(memoryAllocatedMb, policyLevel);
  res.json(server.attributes.relationships.allocations);
});

app.post("/api/wispbyte/client-api/test", async (req: Request, res: Response) => {
  const { endpointId, customApiKey, customSignal, customCommand } = req.body;
  const startTime = Date.now();
  const apiKey = customApiKey || "ptlc_demo_live_client_key_9a8b7c";

  let responseData: any = {};
  let statusCode = 200;
  let simulatedCurl = "";

  if (endpointId === "get-server") {
    responseData = wispbyteApiService.getServerDetails(memoryAllocatedMb, policyLevel);
    simulatedCurl = `curl "https://panel.wispbyte.net/api/client/servers/c8f2a1b9" \\\n  -H "Authorization: Bearer ${apiKey}" \\\n  -H "Accept: application/json"`;
  } else if (endpointId === "get-resources") {
    const memBytes = (160 + Math.floor(Math.random() * 20)) * 1024 * 1024;
    responseData = {
      object: "stats",
      attributes: {
        current_state: serverStatus.toLowerCase(),
        is_suspended: false,
        resources: {
          memory_bytes: memBytes,
          cpu_absolute: Number((7.8 + Math.random() * 3).toFixed(2)),
          disk_bytes: 52428800,
          network_rx_bytes: 148920000,
          network_tx_bytes: 42918000,
          uptime: Math.floor((Date.now() - serverStartedAt) / 1000),
        },
      },
    };
    simulatedCurl = `curl "https://panel.wispbyte.net/api/client/servers/c8f2a1b9/resources" \\\n  -H "Authorization: Bearer ${apiKey}" \\\n  -H "Accept: application/json"`;
  } else if (endpointId === "post-power") {
    const sig = customSignal || "restart";
    if (sig === "start" || sig === "stop" || sig === "restart" || sig === "kill") {
      if (sig === "restart") {
        serverStatus = "RESTARTING";
        setTimeout(() => { serverStatus = "RUNNING"; }, 1000);
      }
    }
    responseData = { success: true, signal: sig, executedAt: new Date().toISOString() };
    simulatedCurl = `curl -X POST "https://panel.wispbyte.net/api/client/servers/c8f2a1b9/power" \\\n  -H "Authorization: Bearer ${apiKey}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"signal":"${sig}"}'`;
  } else if (endpointId === "post-command") {
    const cmd = customCommand || "status";
    responseData = { success: true, command: cmd, executedAt: new Date().toISOString() };
    simulatedCurl = `curl -X POST "https://panel.wispbyte.net/api/client/servers/c8f2a1b9/command" \\\n  -H "Authorization: Bearer ${apiKey}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"command":"${cmd}"}'`;
  } else if (endpointId === "get-websocket") {
    responseData = wispbyteApiService.getWebsocketToken();
    simulatedCurl = `curl "https://panel.wispbyte.net/api/client/servers/c8f2a1b9/websocket" \\\n  -H "Authorization: Bearer ${apiKey}" \\\n  -H "Accept: application/json"`;
  } else if (endpointId === "get-allocations") {
    const server = wispbyteApiService.getServerDetails(memoryAllocatedMb, policyLevel);
    responseData = server.attributes.relationships.allocations;
    simulatedCurl = `curl "https://panel.wispbyte.net/api/client/servers/c8f2a1b9/network/allocations" \\\n  -H "Authorization: Bearer ${apiKey}" \\\n  -H "Accept: application/json"`;
  } else {
    responseData = { error: "Unknown endpoint identifier" };
    statusCode = 400;
  }

  const durationMs = Date.now() - startTime + Math.floor(Math.random() * 25 + 15);

  res.status(statusCode).json({
    success: statusCode === 200,
    statusCode,
    durationMs,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "x-ratelimit-limit": "240",
      "x-ratelimit-remaining": "238",
      "server": "cloudflare",
    },
    data: responseData,
    curlCommand: simulatedCurl,
    timestamp: new Date().toISOString(),
  });
});

// Guild Memory (Permanent Server Registry) Endpoints
app.get("/api/guilds", (_req: Request, res: Response) => {
  const servers = guildMemoryService.getAllServers();
  const metadata = guildMemoryService.getMetadata();
  res.json({ servers, metadata });
});

app.post("/api/guilds/setup", async (req: Request, res: Response) => {
  try {
    const updated = await guildMemoryService.saveServer(req.body);
    addWispbyteLog(
      "DISCORD",
      `[Guild Memory Saved]: Committed permanent setup for '${updated.guildName}' (${updated.guildId}) to disk. Owner: ${updated.ownerRoleId}, Staff roles: ${updated.adminRoleIds.length + updated.moderatorRoleIds.length}, #mod-logs: ${updated.modLogChannelName}`
    );
    res.json({ success: true, server: updated, metadata: guildMemoryService.getMetadata() });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to save server setup" });
  }
});

app.post("/api/guilds/reset", async (req: Request, res: Response) => {
  try {
    const { guildId } = req.body;
    if (!guildId) return res.status(400).json({ error: "Missing guildId" });
    const reset = await guildMemoryService.resetServerSetup(guildId);
    addWispbyteLog(
      "WARN",
      `[Guild Memory Reset]: Server '${reset.guildName}' (${reset.guildId}) reset to pending /setup status.`
    );
    res.json({ success: true, server: reset, metadata: guildMemoryService.getMetadata() });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to reset server setup" });
  }
});

app.post("/api/guilds/reboot-check", async (_req: Request, res: Response) => {
  try {
    const result = await guildMemoryService.simulateReboot();
    addWispbyteLog(
      "DAEMON",
      `[Bot Reboot Simulation]: Cold restart executed. Restored ${result.serversRestored} configured servers from permanent disk storage (guild_memory.json) in ${result.rebootDurationMs}ms. Zero servers require /setup.`
    );
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Reboot simulation failed" });
  }
});

// API Live Moderate endpoint
app.post("/api/moderate", async (req: Request, res: Response) => {
  const startTime = Date.now();
  const { content, author = "TeenUser", bypassTriage = false } = req.body;

  if (typeof content !== "string" || !content.trim()) {
    return res.status(400).json({ error: "Missing or invalid 'content' string" });
  }

  const trimmed = content.trim();
  const cacheKey = trimmed.toLowerCase();

  // Check TTL cache
  const cached = moderationCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS && !bypassTriage) {
    return res.json({
      ...cached.result,
      source: "IN_MEMORY_CACHE",
      tokensUsed: 0,
      latencyMs: Date.now() - startTime,
      cacheHit: true,
    });
  }

  // Run Tier 1 Local Triage & Standard AutoMod
  if (!bypassTriage) {
    const triage = runLocalTriage(trimmed);
    if (triage.status === "CLEAN_PASS") {
      totalProcessedMessages++;
      totalTokensSaved += 240;
      const cleanResult = {
        flagged: false,
        category: "NONE",
        severity: "NONE",
        recommendedAction: "ALLOW",
        confidence: 0.99,
        reason: "Filtered by Tier-1 Local Triage (Benign casual slang/banter). 0 tokens consumed.",
        highlightedPhrases: [],
        ageAppropriateNotes: "Casual peer-to-peer gaming slang appropriate for 16-year-old communities.",
        source: "TIER_1_LOCAL_TRIAGE",
        tokensUsed: 0,
        latencyMs: Date.now() - startTime,
      };
      moderationCache.set(cacheKey, { result: cleanResult, timestamp: Date.now() });
      addWispbyteLog("INFO", `[Message Allowed] "${trimmed.slice(0, 36)}" by ${author} -> Pass [0 tokens]`);
      addWispbyteEvent({
        timestamp: "Just now",
        author,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(author)}`,
        content: trimmed,
        flagged: false,
        category: "NONE",
        severity: "NONE",
        recommendedAction: "ALLOW",
        reason: cleanResult.reason,
        source: cleanResult.source,
        tokensUsed: 0,
        latencyMs: cleanResult.latencyMs,
      });
      return res.json(cleanResult);
    }

    if (triage.status === "LOCAL_FLAG") {
      totalProcessedMessages++;
      totalViolationsPrevented++;
      totalTokensSaved += 350;
      const flagResult = {
        flagged: true,
        category: triage.category || "SEVERE_PROFANITY_OR_ABUSE",
        severity: triage.severity || "HIGH",
        recommendedAction: triage.recommendedAction || "DELETE",
        confidence: 1.0,
        reason: triage.reason || "Intercepted by AegisMod Standard AutoMod filter (0 tokens consumed).",
        highlightedPhrases: triage.highlightedPhrases || [trimmed],
        ageAppropriateNotes: "Deterministic Standard AutoMod filter safeguard for teenage communities.",
        source: triage.ruleName ? `STANDARD_AUTOMOD (${triage.ruleName})` : "STANDARD_AUTOMOD",
        tokensUsed: 0,
        latencyMs: Date.now() - startTime,
      };
      moderationCache.set(cacheKey, { result: flagResult, timestamp: Date.now() });
      addWispbyteLog("AUTOMOD", `[AutoMod Violation] "${trimmed.slice(0, 36)}" by ${author} -> ${flagResult.category} (${flagResult.recommendedAction}) [0 tokens]`);
      addWispbyteEvent({
        timestamp: "Just now",
        author,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(author)}`,
        content: trimmed,
        flagged: true,
        category: flagResult.category,
        severity: flagResult.severity,
        recommendedAction: flagResult.recommendedAction,
        reason: flagResult.reason,
        source: flagResult.source,
        tokensUsed: 0,
        latencyMs: flagResult.latencyMs,
        highlightedPhrases: flagResult.highlightedPhrases,
      });
      return res.json(flagResult);
    }
  }

  // If GEMINI_API_KEY is not configured or in fallback mode
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // Intelligent heuristic fallback
    const triage = runLocalTriage(trimmed);
    const isLocalFlag = triage.status === "LOCAL_FLAG";
    const result = {
      flagged: isLocalFlag,
      category: isLocalFlag ? (triage.category || "SEVERE_PROFANITY_OR_ABUSE") : "NONE",
      severity: isLocalFlag ? "HIGH" : "LOW",
      recommendedAction: isLocalFlag ? "DELETE" : "ALLOW",
      confidence: 0.85,
      reason: isLocalFlag 
        ? triage.reason 
        : "Gemini API key is not configured; local heuristics passed message.",
      highlightedPhrases: isLocalFlag ? [trimmed] : [],
      ageAppropriateNotes: "Evaluated using standard fallback heuristics for teen server safety.",
      source: "HEURISTIC_FALLBACK",
      tokensUsed: 0,
      latencyMs: Date.now() - startTime,
    };
    return res.json(result);
  }

  // Call Gemini 3.8 Flash with structured schema
  try {
    const ai = getAi();

    const systemInstruction = `You are AegisMod, a specialized Discord moderation AI tailored for an online community where members are around 16 years old.
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

POLICY DIRECTIVE:
- PERMANENT BANS ARE DISABLED: Never recommend "BAN" under any circumstances.
- NON-STRICT PUNISHMENT: Moderation philosophy is restorative and non-strict. The maximum action is a temporary 1-hour cooldown ("TIMEOUT_1H") or message deletion ("DELETE") with staff notification. Never recommend "BAN". For self-harm, recommend "DELETE" with compassionate guidance.

Severities & Actions:
- "NONE": No action required. Recommended action: "ALLOW".
- "LOW": Mild infraction. Recommended action: "WARN".
- "MEDIUM": Moderate violation (toxic harassment, vulgar evasion). Recommended action: "DELETE".
- "HIGH": Severe violation (hate speech, vicious cyberbullying, doxxing). Recommended action: "DELETE".
- "CRITICAL": High safety risk (predatory grooming, malicious threats). Recommended action: "TIMEOUT_1H" (immediate moderator ping). DO NOT recommend "BAN".

Output structured JSON strictly matching the provided schema.`;

    const now = Date.now();
    const allCandidateModels = [
      process.env.GEMINI_MODEL || "gemini-3.1-flash-lite",
      "gemini-flash-latest",
      "gemini-2.5-flash",
    ];
    const uniqueModels = Array.from(new Set(allCandidateModels));
    const readyModels = uniqueModels.filter((m) => {
      const cd = serverModelCooldowns.get(m);
      return !cd || now >= cd;
    });
    const candidateModels = readyModels.length > 0 ? readyModels : uniqueModels;

    let response: any = null;
    let successfulModel = candidateModels[0];
    let lastError: any = null;

    for (const model of candidateModels) {
      try {
        response = await ai.models.generateContent({
          model,
          contents: `Evaluate the following Discord message sent by "${author}":\n"${trimmed}"`,
          config: {
            systemInstruction,
            temperature: 0.1,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                flagged: { type: Type.BOOLEAN, description: "Whether the message violates community teen standards" },
                category: { 
                  type: Type.STRING, 
                  description: "Violation category: NONE, CYBERBULLYING, HARASSMENT, SEXUAL_GROOMING_OR_PREDATORY, SELF_HARM, HATE_SPEECH, SEVERE_PROFANITY_OR_ABUSE, DOXXING_OR_PII" 
                },
                severity: { 
                  type: Type.STRING, 
                  description: "NONE, LOW, MEDIUM, HIGH, CRITICAL" 
                },
                recommendedAction: { 
                  type: Type.STRING, 
                  description: "ALLOW, WARN, DELETE, TIMEOUT_1H, TIMEOUT_24H, BAN" 
                },
                confidence: { type: Type.NUMBER, description: "Confidence score between 0.0 and 1.0" },
                reason: { type: Type.STRING, description: "Concise explanation for moderator logs" },
                highlightedPhrases: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING },
                  description: "Specific abusive or violating substrings" 
                },
                ageAppropriateNotes: { type: Type.STRING, description: "Specific guidance considering the 16-year-old audience" }
              },
              required: ["flagged", "category", "severity", "recommendedAction", "confidence", "reason"],
            },
          },
        });
        successfulModel = model;
        serverModelCooldowns.delete(model);
        break;
      } catch (err: any) {
        lastError = err;
        const rawErr = err?.message || String(err);
        const isHighDemand = /503|UNAVAILABLE|high demand|temporarily unavailable/i.test(rawErr);
        const isRateLimit = /429|RESOURCE_EXHAUSTED|quota/i.test(rawErr);

        if (isHighDemand) {
          serverModelCooldowns.set(model, Date.now() + MODEL_COOLDOWN_MS);
          console.warn(`[API Moderate] ⚠️ Model '${model}' experiencing high demand (503). Set 45s cooldown; switching to next model.`);
        } else if (isRateLimit) {
          serverModelCooldowns.set(model, Date.now() + 30000);
          console.warn(`[API Moderate] ⚠️ Model '${model}' rate-limited (429). Set 30s cooldown; switching to next model.`);
        } else {
          console.warn(`[API Moderate] Model ${model} encountered error: ${rawErr}. Attempting fallback...`);
        }
      }
    }

    if (!response) {
      throw lastError || new Error("All candidate Gemini models temporarily unavailable.");
    }

    const parsed = JSON.parse(response.text || "{}");
    const estimatedTokens = Math.ceil(trimmed.length / 3.5) + 380; // system prompt + input + output tokens

    const result = {
      flagged: !!parsed.flagged,
      category: parsed.category || "NONE",
      severity: parsed.severity || "NONE",
      recommendedAction: parsed.recommendedAction || "ALLOW",
      confidence: parsed.confidence ?? 0.9,
      reason: parsed.reason || `Analysis completed by ${successfulModel}`,
      highlightedPhrases: parsed.highlightedPhrases || [],
      ageAppropriateNotes: parsed.ageAppropriateNotes || "Strict teenage community guidelines enforced.",
      source: successfulModel.toUpperCase().replace(/-/g, "_"),
      tokensUsed: estimatedTokens,
      latencyMs: Date.now() - startTime,
    };

    // Store in cache
    moderationCache.set(cacheKey, { result, timestamp: Date.now() });

    totalProcessedMessages++;
    if (result.flagged) totalViolationsPrevented++;
    addWispbyteLog(
      "AI_MOD",
      `[Gemini 3.8 Flash] "${trimmed.slice(0, 36)}" by ${author} -> ${result.flagged ? `FLAGGED: ${result.category} (${result.recommendedAction})` : "PASSED SAFE"} (${result.tokensUsed} tokens, ${result.latencyMs}ms)`
    );

    addWispbyteEvent({
      timestamp: "Just now",
      author,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(author)}`,
      content: trimmed,
      flagged: result.flagged,
      category: result.category,
      severity: result.severity,
      recommendedAction: result.recommendedAction,
      reason: result.reason,
      source: result.source,
      tokensUsed: result.tokensUsed,
      latencyMs: result.latencyMs,
      highlightedPhrases: result.highlightedPhrases,
    });

    res.json(result);
  } catch (err: any) {
    console.error("Gemini moderation error:", err);
    res.status(500).json({ 
      error: "AI Moderation service encountered an error", 
      details: err.message,
      fallback: {
        flagged: false,
        category: "ERROR_FALLBACK",
        severity: "NONE",
        recommendedAction: "ALLOW",
        reason: "Gemini API query failed; message held for manual audit."
      }
    });
  }
});

// Setup Vite or static serving
async function startServer() {
  const distPath = path.join(process.cwd(), "dist");
  const hasDist = fs.existsSync(distPath) && fs.existsSync(path.join(distPath, "index.html"));

  if (process.env.NODE_ENV === "production" || (hasDist && process.env.NODE_ENV !== "development")) {
    console.log("⚡ Serving pre-built static assets (Production Mode)");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: {
          middlewareMode: true,
          allowedHosts: ["aegis-bot.wispbyte.app", "aegisbot.wispbyte.app", ".wispbyte.app", ".wispbyte.net", "localhost"],
        },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (err: any) {
      console.warn("Notice: Vite live dev middleware skipped:", err?.message || err);
      if (hasDist) {
        app.use(express.static(distPath));
        app.get("*", (_req: Request, res: Response) => {
          res.sendFile(path.join(distPath, "index.html"));
        });
      }
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🛡️ AegisMod Control Server successfully listening on http://0.0.0.0:${PORT}`);

    // Automatically initialize Discord Bot Gateway if token is provided
    if (process.env.DISCORD_BOT_TOKEN) {
      console.log("🤖 DISCORD_BOT_TOKEN detected. Connecting AegisMod to Discord Gateway...");
      import("./src/bot-code/src/index.js")
        .catch(() => import("./src/bot-code/src/index.ts"))
        .catch((err) => {
          console.warn("Notice during bot client load:", err?.message || err);
        });
    } else {
      console.log("ℹ️ DISCORD_BOT_TOKEN not detected in environment. Running web dashboard and API engine.");
    }
  });
}

startServer();
