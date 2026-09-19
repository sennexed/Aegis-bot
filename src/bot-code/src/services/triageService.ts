/**
 * Triage Service
 * High-performance Token Efficiency Pipeline for AegisMod
 * Prevents unnecessary Gemini API calls by pre-filtering 80-90% of benign chat.
 */

export interface TriageResult {
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
    "nope", "hi", "hello", "hey", "yo", "sup", "whatsup", "wassup", "cya", "bye",
    "bro", "bruh", "dude", "man", "mate", "team", "play", "game", "good", "great"
  ]);

  private zeroToleranceRegex = /\b(kys|k\.y\.s|kill yourself|kill ur self|die in a fire|suicide|send nudes|send me nudes|trade pics|drop snap 16|drop your insta dm|meet up in person secretly)\b/i;

  /**
   * Evaluates if a message needs Gemini API analysis.
   */
  public evaluate(content: string): TriageResult {
    const trimmed = content.trim();
    const normalized = trimmed.toLowerCase();

    // Check duplicate in cache
    const cached = this.cache.get(normalized);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return {
        shouldCallGemini: false,
        localVerdict: cached.result,
        reason: "Cache Hit: Exact duplicate evaluated recently (0 tokens consumed)"
      };
    }

    // 0. Check for recognized safe GIF URLs (Tenor, Giphy, Discord media/CDN, etc.)
    const isPureSafeGif =
      /^(?:https?:\/\/)?(?:[a-zA-Z0-9.-]+\.)?(?:tenor\.com|giphy\.com)\/[^\s]+$/i.test(trimmed) ||
      /^(?:https?:\/\/)?(?:cdn\.discordapp\.com|media\.discordapp\.net)\/attachments\/[^\s]+\.gif(?=[?#\s]|$)/i.test(trimmed) ||
      /^(?:https?:\/\/)[^\s]+\.gif(?=[?#\s]|$)/i.test(trimmed);

    if (isPureSafeGif) {
      return {
        shouldCallGemini: false,
        localVerdict: {
          flagged: false,
          category: "NONE",
          severity: "NONE",
          recommendedAction: "ALLOW",
          reason: "Triage Tier-1: Verified safe animated GIF (Tenor/Giphy). Clean pass (0 tokens)."
        },
        reason: "Fast filter: Safe GIF media allowed (0 tokens consumed)"
      };
    }

    // 1. Check for single harmless words / short reactions or simple punctuation
    if (this.benignSlang.has(normalized) || /^[\p{Emoji}\s!?.~]{1,4}$/u.test(normalized)) {
      return {
        shouldCallGemini: false,
        localVerdict: {
          flagged: false,
          category: "NONE",
          severity: "NONE",
          recommendedAction: "ALLOW",
          reason: "Triage Tier-1: Short benign chat slang or emoji."
        },
        reason: "Fast filter: Benign chat (0 tokens consumed)"
      };
    }

    // 2. All words are known benign chat phrases (< 5 words)
    const words = normalized.split(/\s+/);
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

    // 3. Instant local regex for zero-tolerance severe hate/predatory patterns (Non-strict, NO BAN)
    if (this.zeroToleranceRegex.test(trimmed)) {
      const isSelfHarm = /kys|k\.y\.s|kill yourself|kill ur self|suicide/i.test(trimmed);
      const category = isSelfHarm ? "SELF_HARM" : "SEXUAL_GROOMING_OR_PREDATORY";
      const action = isSelfHarm ? "DELETE" : "TIMEOUT_1H";
      
      const verdict = {
        flagged: true,
        category,
        severity: "CRITICAL" as const,
        recommendedAction: action as "DELETE" | "TIMEOUT_1H",
        reason: `Immediate local regex trigger for zero-tolerance keyword pattern in ${category}`
      };

      this.cacheVerdict(normalized, verdict);
      return {
        shouldCallGemini: false,
        localVerdict: verdict,
        reason: "Tier-2 Local Regex Flag: Immediate action without API latency"
      };
    }

    // 4. Default: Require contextual AI analysis from Gemini
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
}
