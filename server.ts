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

// API Health
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ 
    status: "ok", 
    service: "AegisMod Discord Hybrid Moderation Backend",
    hasApiKey: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString()
  });
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
      return res.json(cleanResult);
    }

    if (triage.status === "LOCAL_FLAG") {
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
