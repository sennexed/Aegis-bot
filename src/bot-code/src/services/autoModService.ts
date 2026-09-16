/**
 * Standard AutoMod Service for AegisMod
 * Provides local deterministic protection:
 * - Anti-Invite Links
 * - Anti-Phishing & Malicious Scams
 * - Anti-Mass Mentions
 * - Anti-Spam / Flood Control (Sliding Window)
 * - Anti-Excessive Caps
 * - Anti-Zalgo & Glitch Text
 * - Banned Slurs with Leetspeak Normalization
 * - Discord Native AutoMod Provisioning & Sync
 */

import {
  Guild,
  Message,
  AutoModerationRuleTriggerType,
  AutoModerationActionType,
  AutoModerationRuleEventType,
} from "discord.js";
import fs from "fs";
import path from "path";

export interface AutoModConfig {
  antiInvite: boolean;
  antiPhishing: boolean;
  antiMassMention: boolean;
  mentionThreshold: number; // default: 4
  antiSpam: boolean;
  spamMessageThreshold: number; // default: 5 messages
  spamIntervalMs: number; // default: 4000ms
  antiCaps: boolean;
  capsMinLength: number; // default: 15
  capsPercentage: number; // default: 70%
  antiZalgo: boolean;
  antiBannedWords: boolean;
}

export const DEFAULT_AUTOMOD_CONFIG: AutoModConfig = {
  antiInvite: true,
  antiPhishing: true,
  antiMassMention: true,
  mentionThreshold: 4,
  antiSpam: true,
  spamMessageThreshold: 5,
  spamIntervalMs: 4000,
  antiCaps: true,
  capsMinLength: 15,
  capsPercentage: 70,
  antiZalgo: true,
  antiBannedWords: true,
};

export interface AutoModCheckResult {
  triggered: boolean;
  ruleName?: string;
  category?: string;
  severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  recommendedAction?: "DELETE" | "WARN" | "TIMEOUT_1H" | "TIMEOUT_24H" | "BAN";
  reason?: string;
  matchedContent?: string;
}

export class AutoModService {
  private configMap = new Map<string, AutoModConfig>();
  private messageHistory = new Map<string, { timestamp: number; content: string }[]>();
  private configFilePath: string;
  private isSaving = false;
  private needsSave = false;

  // Anti-Invite Regex
  private inviteRegex = /(?:https?:\/\/)?(?:www\.)?(?:discord\.(?:gg|io|me|li)|discord(?:app)?\.com\/invite)\/([a-zA-Z0-9_-]+)/i;

  // Anti-Phishing & Scam Domains / Keywords
  private phishingRegex = /(?:discorcl|dlscord|discrod|disccord|disscord|discord-app|discord-nitro|free-nitro|nitro-airdrop|gift-discord|discord-gift|steamcommuniity|steamcomminuty|steamcommunyt|steamcommunitys|trade-offer|steam-gift|grabify\.link|iplogger\.org|yip\.su|blasze\.com)/i;
  private suspiciousTldRegex = /(?:https?:\/\/)[^\s/$.?#].[^\s]*\.(?:ru|xyz|top|click|link|skin|tk|ml|ga|cf|gift|download|fun|biz|monster|rest)(?:\/[^\s]*)?/i;

  // Zalgo / Excessive Combining Unicode Diacritics
  private zalgoRegex = /[\u0300-\u036f\u0483-\u0489\u1dc0-\u1dff\u20d0-\u20ff\ufe20-\ufe2f]/g;

  // Zero-Tolerance High-Severity Slurs & Violent Words (with leetspeak normalization)
  private zeroToleranceKeywords = [
    "kys",
    "kill yourself",
    "kill ur self",
    "die in a fire",
    "suicide",
    "send nudes",
    "send me nudes",
    "trade pics",
    "drop snap 16",
    "drop your insta dm",
    "meet up in person secretly",
    "faggot",
    "nigger",
    "retard",
    "tranny",
  ];

  constructor(storageDir?: string) {
    const dir = storageDir || path.resolve(process.cwd(), "data");
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch {
        // Ignored if exists
      }
    }
    this.configFilePath = path.join(dir, "automod_config.json");
    this.loadFromDisk();

    // Clean up spam history every 5 minutes (unref so tests/scripts don't hang)
    const timer = setInterval(() => this.cleanupSpamHistory(), 5 * 60 * 1000);
    if (typeof timer.unref === "function") {
      timer.unref();
    }
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(this.configFilePath)) {
        const raw = fs.readFileSync(this.configFilePath, "utf8");
        const parsed = JSON.parse(raw);
        for (const [guildId, config] of Object.entries(parsed)) {
          this.configMap.set(guildId, { ...DEFAULT_AUTOMOD_CONFIG, ...(config as any) });
        }
      }
    } catch (err) {
      console.error("[AutoModService] Failed to load config from disk:", err);
    }
  }

  private persistToDisk() {
    if (this.isSaving) {
      this.needsSave = true;
      return;
    }
    this.isSaving = true;

    const data: Record<string, AutoModConfig> = {};
    for (const [guildId, config] of this.configMap.entries()) {
      data[guildId] = config;
    }

    const tempPath = `${this.configFilePath}.tmp.${Date.now()}`;
    fs.promises
      .writeFile(tempPath, JSON.stringify(data, null, 2), "utf8")
      .then(() => fs.promises.rename(tempPath, this.configFilePath))
      .then(() => {
        this.isSaving = false;
        if (this.needsSave) {
          this.needsSave = false;
          this.persistToDisk();
        }
      })
      .catch((err) => {
        this.isSaving = false;
        console.error("[AutoModService] Failed to persist config to disk:", err);
      });
  }

  public getConfig(guildId: string): AutoModConfig {
    return this.configMap.get(guildId) || { ...DEFAULT_AUTOMOD_CONFIG };
  }

  public updateConfig(guildId: string, updates: Partial<AutoModConfig>): AutoModConfig {
    const current = this.getConfig(guildId);
    const updated = { ...current, ...updates };
    this.configMap.set(guildId, updated);
    this.persistToDisk();
    return updated;
  }

  /**
   * Normalizes leetspeak, spaces, and punctuation for robust evasion detection
   */
  public normalizeEvasion(text: string): string {
    return text
      .toLowerCase()
      .replace(/[\u200B-\u200D\uFEFF]/g, "") // zero width
      .replace(/0/g, "o")
      .replace(/1|!|\|/g, "i")
      .replace(/3/g, "e")
      .replace(/4|@/g, "a")
      .replace(/5|\$/g, "s")
      .replace(/7/g, "t")
      .replace(/8/g, "b")
      .replace(/[._\-*+~]/g, " "); // collapse separators into spaces
  }

  /**
   * Comprehensive local AutoMod check on incoming message
   */
  public checkContent(
    content: string,
    authorId: string,
    guildId: string,
    mentionCount: number = 0
  ): AutoModCheckResult {
    const config = this.getConfig(guildId);
    const trimmed = content.trim();
    const normalized = this.normalizeEvasion(trimmed);

    // 1. Anti-Phishing & Malicious Scam Links (CRITICAL)
    if (config.antiPhishing) {
      if (this.phishingRegex.test(trimmed)) {
        const match = trimmed.match(this.phishingRegex)?.[0] || "phishing link";
        return {
          triggered: true,
          ruleName: "Anti-Phishing & Malicious Scams",
          category: "PHISHING_OR_SCAM",
          severity: "CRITICAL",
          recommendedAction: "TIMEOUT_24H",
          reason: `Detected suspected phishing/credential theft link matching pattern: ${match}`,
          matchedContent: match,
        };
      }
      if (this.suspiciousTldRegex.test(trimmed) && /(nitro|free|steam|gift|airdrop)/i.test(trimmed)) {
        return {
          triggered: true,
          ruleName: "Anti-Phishing & Malicious Scams",
          category: "PHISHING_OR_SCAM",
          severity: "CRITICAL",
          recommendedAction: "TIMEOUT_24H",
          reason: "Detected suspicious high-risk TLD link combined with giveaway/nitro lure.",
          matchedContent: trimmed,
        };
      }
    }

    // 2. Zero-Tolerance Keywords & Slurs (CRITICAL)
    if (config.antiBannedWords) {
      for (const kw of this.zeroToleranceKeywords) {
        if (normalized.includes(kw) || new RegExp(`\\b${kw.replace(/\s+/g, "\\s*")}\\b`, "i").test(normalized)) {
          const isSelfHarm = /kys|kill yourself|kill ur self|suicide|die in a fire/i.test(kw);
          const isHate = /faggot|nigger|retard|tranny/i.test(kw);
          const isPredatory = /send nudes|trade pics|drop snap|secretly/i.test(kw);

          const category = isSelfHarm ? "SELF_HARM" : isHate ? "HATE_SPEECH" : "SEXUAL_GROOMING_OR_PREDATORY";
          const recommendedAction = isPredatory ? "BAN" : (isSelfHarm || isHate) ? "TIMEOUT_24H" : "TIMEOUT_1H";

          return {
            triggered: true,
            ruleName: "Banned Severe Keywords",
            category,
            severity: "CRITICAL",
            recommendedAction,
            reason: `Immediate local AutoMod trigger for zero-tolerance keyword: "${kw}"`,
            matchedContent: kw,
          };
        }
      }
    }

    // 3. Anti-Invite Links
    if (config.antiInvite && this.inviteRegex.test(trimmed)) {
      const match = trimmed.match(this.inviteRegex)?.[0] || "discord invite";
      return {
        triggered: true,
        ruleName: "Anti-Invite Links",
        category: "INVITE_LINK_SPAM",
        severity: "MEDIUM",
        recommendedAction: "DELETE",
        reason: "Unauthorized Discord server invite links are prohibited in this server.",
        matchedContent: match,
      };
    }

    // 4. Anti-Mass Mention
    if (config.antiMassMention && mentionCount >= config.mentionThreshold) {
      return {
        triggered: true,
        ruleName: "Anti-Mass Mentions",
        category: "MASS_MENTION_SPAM",
        severity: "HIGH",
        recommendedAction: "TIMEOUT_1H",
        reason: `Exceeded mass mention threshold (${mentionCount} mentions >= limit of ${config.mentionThreshold}).`,
        matchedContent: `${mentionCount} mentions`,
      };
    }

    // 5. Anti-Spam & Flood Control (Sliding Window per user)
    if (config.antiSpam) {
      const key = `${guildId}:${authorId}`;
      const now = Date.now();
      const history = this.messageHistory.get(key) || [];
      const recent = history.filter((m) => now - m.timestamp < config.spamIntervalMs);

      // Check consecutive identical messages
      const identicalCount = recent.filter((m) => m.content.toLowerCase() === trimmed.toLowerCase()).length;
      if (identicalCount >= 2) {
        recent.push({ timestamp: now, content: trimmed });
        this.messageHistory.set(key, recent);
        return {
          triggered: true,
          ruleName: "Anti-Spam Flood (Repeated Content)",
          category: "FLOOD_OR_SPAM",
          severity: "MEDIUM",
          recommendedAction: "DELETE",
          reason: "Detected repeated identical messages in rapid succession (spam flood).",
          matchedContent: trimmed,
        };
      }

      if (recent.length >= config.spamMessageThreshold) {
        recent.push({ timestamp: now, content: trimmed });
        this.messageHistory.set(key, recent);
        return {
          triggered: true,
          ruleName: "Anti-Spam Flood (Message Rate Limit)",
          category: "FLOOD_OR_SPAM",
          severity: "MEDIUM",
          recommendedAction: "DELETE",
          reason: `Exceeded rapid message threshold (${recent.length} messages in ${config.spamIntervalMs / 1000}s).`,
        };
      }

      recent.push({ timestamp: now, content: trimmed });
      this.messageHistory.set(key, recent);
    }

    // 6. Anti-Excessive Caps
    if (config.antiCaps && trimmed.length >= config.capsMinLength) {
      const letters = trimmed.replace(/[^a-zA-Z]/g, "");
      if (letters.length >= 10) {
        const uppercase = letters.replace(/[^A-Z]/g, "").length;
        const percentage = (uppercase / letters.length) * 100;
        if (percentage >= config.capsPercentage) {
          return {
            triggered: true,
            ruleName: "Anti-Excessive Caps",
            category: "EXCESSIVE_CAPS",
            severity: "LOW",
            recommendedAction: "DELETE",
            reason: `Excessive uppercase characters (${Math.round(percentage)}% caps >= limit of ${config.capsPercentage}%).`,
            matchedContent: trimmed,
          };
        }
      }
    }

    // 7. Anti-Zalgo & Glitch Text
    if (config.antiZalgo) {
      const zalgoMatches = trimmed.match(this.zalgoRegex);
      if (zalgoMatches && zalgoMatches.length >= 8) {
        return {
          triggered: true,
          ruleName: "Anti-Zalgo & Glitch Text",
          category: "GLITCH_OR_ZALGO",
          severity: "MEDIUM",
          recommendedAction: "DELETE",
          reason: `Excessive combining unicode characters detected (${zalgoMatches.length} zalgo diacritics) which may lag client chat.`,
          matchedContent: "[Glitch/Zalgo characters]",
        };
      }
    }

    return { triggered: false };
  }

  /**
   * Helper method for Discord.js Message objects
   */
  public checkMessage(message: Message): AutoModCheckResult {
    const mentionCount = message.mentions.users.size + message.mentions.roles.size + (message.mentions.everyone ? 5 : 0);
    return this.checkContent(message.content, message.author.id, message.guild?.id || "default", mentionCount);
  }

  private cleanupSpamHistory() {
    const now = Date.now();
    for (const [key, history] of this.messageHistory.entries()) {
      const filtered = history.filter((m) => now - m.timestamp < 30000);
      if (filtered.length === 0) {
        this.messageHistory.delete(key);
      } else {
        this.messageHistory.set(key, filtered);
      }
    }
  }

  /**
   * Provisions official Discord Native AutoMod rules directly on the Discord guild.
   * Runs directly on Discord's servers for 0ms edge protection.
   */
  public async syncDiscordNativeRules(guild: Guild): Promise<{ created: number; updated: number; errors: string[] }> {
    const errors: string[] = [];
    let created = 0;
    let updated = 0;

    try {
      // Fetch existing rules
      const existingRules = await guild.autoModerationRules.fetch().catch((err) => {
        errors.push(`Failed to fetch native rules: ${err.message}`);
        return null;
      });

      if (!existingRules) {
        return { created, updated, errors };
      }

      // Rule 1: Mention Spam Filter
      const mentionRuleName = "AegisMod - Native Anti-Mention Spam";
      const existingMention = existingRules.find((r) => r.name === mentionRuleName);
      if (!existingMention) {
        await guild.autoModerationRules
          .create({
            name: mentionRuleName,
            eventType: AutoModerationRuleEventType.MessageSend,
            triggerType: AutoModerationRuleTriggerType.MentionSpam,
            triggerMetadata: {
              mentionTotalLimit: 5,
            },
            actions: [
              {
                type: AutoModerationActionType.BlockMessage,
                metadata: {
                  customMessage: "Your message was blocked by AegisMod Native AutoMod for excessive mentions.",
                },
              },
            ],
            enabled: true,
            reason: "AegisMod Native AutoMod rule provisioning",
          })
          .then(() => created++)
          .catch((err) => errors.push(`Mention Spam Rule: ${err.message}`));
      } else {
        updated++;
      }

      // Rule 2: Suspected Spam Content
      const spamRuleName = "AegisMod - Native Anti-Spam";
      const existingSpam = existingRules.find((r) => r.name === spamRuleName);
      if (!existingSpam) {
        await guild.autoModerationRules
          .create({
            name: spamRuleName,
            eventType: AutoModerationRuleEventType.MessageSend,
            triggerType: AutoModerationRuleTriggerType.Spam,
            actions: [
              {
                type: AutoModerationActionType.BlockMessage,
                metadata: {
                  customMessage: "Your message was blocked by AegisMod Native AutoMod for suspected spam content.",
                },
              },
            ],
            enabled: true,
            reason: "AegisMod Native AutoMod spam rule",
          })
          .then(() => created++)
          .catch((err) => errors.push(`Spam Rule: ${err.message}`));
      } else {
        updated++;
      }

      // Rule 3: High-Risk Keyword & Link Filter
      const keywordRuleName = "AegisMod - Native High-Risk Keyword Filter";
      const existingKeyword = existingRules.find((r) => r.name === keywordRuleName);
      if (!existingKeyword) {
        await guild.autoModerationRules
          .create({
            name: keywordRuleName,
            eventType: AutoModerationRuleEventType.MessageSend,
            triggerType: AutoModerationRuleTriggerType.Keyword,
            triggerMetadata: {
              keywordFilter: [
                "*kys*",
                "*kill yourself*",
                "*send nudes*",
                "*grabify.link*",
                "*iplogger.org*",
                "*steamcommuniity*",
              ],
            },
            actions: [
              {
                type: AutoModerationActionType.BlockMessage,
                metadata: {
                  customMessage: "Your message was blocked by AegisMod Native AutoMod for high-risk safety keywords.",
                },
              },
            ],
            enabled: true,
            reason: "AegisMod Native AutoMod zero-tolerance keywords",
          })
          .then(() => created++)
          .catch((err) => errors.push(`Keyword Rule: ${err.message}`));
      } else {
        updated++;
      }
    } catch (err: any) {
      errors.push(`Sync failed: ${err.message}`);
    }

    return { created, updated, errors };
  }
}
