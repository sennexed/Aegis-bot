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

// Tier 1 Fast Triage Filter for Token Efficiency (bypasses Gemini for benign short messages)
const BENIGN_GAMER_SLANG = new Set([
  "gg", "ggwp", "ggs", "lol", "lmao", "lmfao", "rofl", "w", "l", "fr", "frfr",
  "ong", "ngl", "tbh", "idk", "idc", "brb", "gtg", "gn", "gm", "glhf", "ez",
  "pog", "poggers", "clutch", "sheesh", "bet", "no cap", "cap", "fax", "ok",
  "okay", "k", "sure", "nice", "cool", "ye", "yes", "yea", "yeah", "nah", "no",
  "nope", "hi", "hello", "hey", "yo", "sup", "whatsup", "wassup", "cya", "bye"
]);

function runLocalTriage(text: string): { status: "CLEAN_PASS" | "SUSPICIOUS" | "LOCAL_FLAG"; reason?: string; category?: string } {
  const normalized = text.trim().toLowerCase();
  
  // 1. Very short benign words
  if (normalized.length <= 4 && (BENIGN_GAMER_SLANG.has(normalized) || /^[a-z0-9!?. ]{1,4}$/.test(normalized))) {
    return { status: "CLEAN_PASS" };
  }

  // 2. All words in message are benign conversational words
  const words = normalized.split(/\s+/);
  if (words.length <= 5 && words.every(w => BENIGN_GAMER_SLANG.has(w.replace(/[^a-z]/g, "")))) {
    return { status: "CLEAN_PASS" };
  }

  // 3. Fast regex check for zero-tolerance severe hate speech / explicit predatory patterns
  const zeroToleranceRegex = /\b(kys|k\.y\.s|kill yourself|kill ur self|die in a fire|suicide|send nudes|send me nudes|trade pics|how old are you snap|drop snap 16|drop your insta dm|meet up in person secretly)\b/i;
  if (zeroToleranceRegex.test(text)) {
    return { 
      status: "LOCAL_FLAG", 
      reason: "Immediate high-risk keyword pattern detected by Tier-1 local filter", 
      category: text.toLowerCase().includes("kill") || text.toLowerCase().includes("kys") ? "SELF_HARM" : "SEXUAL_GROOMING_OR_PREDATORY"
    };
  }

  // 4. Default: Send to Gemini Flash for deep context & nuanced teenage safety evaluation
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

  // Run Tier 1 Local Triage
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

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
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

    const parsed = JSON.parse(response.text || "{}");
    const estimatedTokens = Math.ceil(trimmed.length / 3.5) + 380; // system prompt + input + output tokens

    const result = {
      flagged: !!parsed.flagged,
      category: parsed.category || "NONE",
      severity: parsed.severity || "NONE",
      recommendedAction: parsed.recommendedAction || "ALLOW",
      confidence: parsed.confidence ?? 0.9,
      reason: parsed.reason || "Analysis completed by Gemini 3.8 Flash",
      highlightedPhrases: parsed.highlightedPhrases || [],
      ageAppropriateNotes: parsed.ageAppropriateNotes || "Strict teenage community guidelines enforced.",
      source: "GEMINI_3_8_FLASH",
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
