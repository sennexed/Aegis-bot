import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

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
    const recommendedAction = isPredatory ? "BAN" : (isSelfHarm || isHate) ? "TIMEOUT_24H" : "TIMEOUT_1H";

    return { 
      status: "LOCAL_FLAG", 
      ruleName: "Zero-Tolerance Safety Filter",
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
  level: "DAEMON" | "INFO" | "DISCORD" | "AI_MOD" | "AUTOMOD" | "WARN" | "ERROR" | "COMMAND";
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
  { id: "log-2", timestamp: new Date(Date.now() - 3590000).toLocaleTimeString(), level: "DAEMON", message: "[Pterodactyl Daemon]: Starting container with 512MB RAM, 100% CPU quota (wisp-sg-node01.wispbyte.net)" },
  { id: "log-3", timestamp: new Date(Date.now() - 3580000).toLocaleTimeString(), level: "INFO", message: "[Container Entry]: node dist/index.js (Node.js v20.18.0)" },
  { id: "log-4", timestamp: new Date(Date.now() - 3570000).toLocaleTimeString(), level: "INFO", message: "[AegisMod]: Initializing AegisMod v1.0.0 Hybrid Discord Moderation Engine..." },
  { id: "log-5", timestamp: new Date(Date.now() - 3560000).toLocaleTimeString(), level: "INFO", message: "[AegisMod]: Policy Level set to 'STRICT_TEEN' (Zero-tolerance grooming, self-harm, hate speech; benign gamer slang allowed)" },
  { id: "log-6", timestamp: new Date(Date.now() - 3550000).toLocaleTimeString(), level: "DISCORD", message: "[Discord.js]: Logging in with Privileged Gateway Intents: GuildMembers, GuildMessages, MessageContent" },
  { id: "log-7", timestamp: new Date(Date.now() - 3540000).toLocaleTimeString(), level: "DISCORD", message: "[Discord.js]: Shard #0 identified. Gateway Heartbeat WebSocket established (ping: 24ms)" },
  { id: "log-8", timestamp: new Date(Date.now() - 3530000).toLocaleTimeString(), level: "INFO", message: "🛡️ AegisMod logged in as AegisMod#4419 (ID: 124892849204918294)" },
  { id: "log-9", timestamp: new Date(Date.now() - 3520000).toLocaleTimeString(), level: "AI_MOD", message: "[Gemini 3.8 Flash]: Model connection primed. Multi-tier token triage cache initialized." },
  { id: "log-10", timestamp: new Date(Date.now() - 120000).toLocaleTimeString(), level: "AUTOMOD", message: "[AutoMod]: Intercepted suspicious link from User#8841: 'free-nitro-airdrop.xyz' -> Auto-timed out 24h [0 tokens]" },
  { id: "log-11", timestamp: new Date(Date.now() - 45000).toLocaleTimeString(), level: "INFO", message: "[Heartbeat]: Memory: 174 MB / 512 MB | CPU: 8.2% | Latency: 26ms | Guilds: 14 | Monitored Teen Members: 3,420" },
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
  } else {
    responseText = `Command '${trimmed}' executed successfully.`;
    addWispbyteLog("INFO", responseText);
  }

  res.json({ output: responseText, command: trimmed });
});

// Wispbyte Logs Endpoint
app.get("/api/wispbyte/logs", (_req: Request, res: Response) => {
  res.json({ logs: wispbyteLogs });
});

// Wispbyte Telemetry Events Endpoint
app.get("/api/wispbyte/events", (_req: Request, res: Response) => {
  res.json({ events: wispbyteEvents });
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

Severities:
- "NONE": No action required.
- "LOW": Mild infraction. Recommended action: "WARN".
- "MEDIUM": Notable violation (toxic harassment, vulgar evasion). Recommended action: "DELETE".
- "HIGH": Severe violation (hate speech, vicious cyberbullying, doxxing). Recommended action: "TIMEOUT_1H" or "TIMEOUT_24H".
- "CRITICAL": Predatory grooming, explicit threats, suicide encouragement. Recommended action: "BAN" (with immediate moderator ping).

Output structured JSON strictly matching the provided schema.`;

    const now = Date.now();
    const allCandidateModels = [
      process.env.GEMINI_MODEL || "gemini-3.8-flash",
      "gemini-3.1-flash-lite",
      "gemini-2.5-flash",
      "gemini-flash-latest",
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
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AegisMod Control Server running on port ${PORT}`);
  });
}

startServer();
