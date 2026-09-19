/**
 * Moderation Policy Engine
 * Enforces strictly deterministic server-side mapping between AI/Triage classifications
 * and concrete Discord moderation actions.
 * 
 * ARCHITECTURAL MANDATE:
 * User message -> AI/Triage classifier -> validated classification -> Policy Engine -> Discord action.
 * Never allows raw AI text to trigger arbitrary Discord actions.
 */

export type ViolationCategory =
  | "NONE"
  | "CYBERBULLYING"
  | "HARASSMENT"
  | "SEXUAL_GROOMING_OR_PREDATORY"
  | "SELF_HARM"
  | "HATE_SPEECH"
  | "SEVERE_PROFANITY_OR_ABUSE"
  | "DOXXING_OR_PII"
  | "PROMPT_INJECTION_OR_JAILBREAK"
  | "INVITE_LINK_SPAM"
  | "PHISHING_OR_SCAM"
  | "MASS_MENTION_SPAM"
  | "FLOOD_OR_SPAM"
  | "EXCESSIVE_CAPS"
  | "GLITCH_OR_ZALGO";

export type SeverityLevel = "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type ModerationAction =
  | "ALLOW"
  | "WARN"
  | "DELETE"
  | "TIMEOUT_1H"
  | "TIMEOUT_24H"
  | "BAN"
  | "HOLD_FOR_STAFF_REVIEW";

export interface ModerationClassification {
  flagged: boolean;
  category: ViolationCategory;
  severity: SeverityLevel;
  confidence: number;
  reason: string;
  highlightedPhrases: string[];
  ageAppropriateNotes?: string;
  tokensUsed?: number;
}

export interface PolicyDecision {
  action: ModerationAction;
  executedActionDescription: string;
  category: ViolationCategory;
  severity: SeverityLevel;
  confidence: number;
  reason: string;
  durationMs?: number;
  requiresStaffNotification: boolean;
  notifyUser: boolean;
  userMessage?: string;
}

export class PolicyEngine {
  /**
   * Sanitizes and validates raw classification inputs, rejecting unknown categories or severities.
   */
  public static validateClassification(raw: any): ModerationClassification {
    const validCategories: Set<string> = new Set([
      "NONE",
      "CYBERBULLYING",
      "HARASSMENT",
      "SEXUAL_GROOMING_OR_PREDATORY",
      "SELF_HARM",
      "HATE_SPEECH",
      "SEVERE_PROFANITY_OR_ABUSE",
      "DOXXING_OR_PII",
      "PROMPT_INJECTION_OR_JAILBREAK",
      "INVITE_LINK_SPAM",
      "PHISHING_OR_SCAM",
      "MASS_MENTION_SPAM",
      "FLOOD_OR_SPAM",
      "EXCESSIVE_CAPS",
      "GLITCH_OR_ZALGO",
    ]);

    const validSeverities: Set<string> = new Set(["NONE", "LOW", "MEDIUM", "HIGH", "CRITICAL"]);

    const category: ViolationCategory = validCategories.has(raw?.category)
      ? (raw.category as ViolationCategory)
      : "NONE";

    const severity: SeverityLevel = validSeverities.has(raw?.severity)
      ? (raw.severity as SeverityLevel)
      : "NONE";

    const flagged = Boolean(raw?.flagged) && category !== "NONE" && severity !== "NONE";
    const confidence = typeof raw?.confidence === "number" ? Math.max(0, Math.min(1, raw.confidence)) : 0.8;
    const reason = typeof raw?.reason === "string" && raw.reason.trim() ? raw.reason.trim() : "Automated policy evaluation.";
    const highlightedPhrases = Array.isArray(raw?.highlightedPhrases)
      ? raw.highlightedPhrases.filter((p: any) => typeof p === "string" && p.length > 0)
      : [];

    return {
      flagged,
      category,
      severity,
      confidence,
      reason,
      highlightedPhrases,
      ageAppropriateNotes: typeof raw?.ageAppropriateNotes === "string" ? raw.ageAppropriateNotes : undefined,
      tokensUsed: typeof raw?.tokensUsed === "number" ? raw.tokensUsed : 0,
    };
  }

  /**
   * Evaluates a validated classification against strict teen safety escalation policies.
   * Deterministic matrix ensures no arbitrary actions can be executed.
   */
  public static evaluatePolicy(
    classification: ModerationClassification,
    guildName: string = "the server"
  ): PolicyDecision {
    if (!classification.flagged || classification.category === "NONE" || classification.severity === "NONE") {
      return {
        action: "ALLOW",
        executedActionDescription: "CLEAN_PASS",
        category: "NONE",
        severity: "NONE",
        confidence: classification.confidence,
        reason: classification.reason,
        requiresStaffNotification: false,
        notifyUser: false,
      };
    }

    // 1. Zero-Tolerance Predatory Grooming -> 1H Cooldown Quarantine + Immediate Staff Alert (No Permanent Bans)
    if (classification.category === "SEXUAL_GROOMING_OR_PREDATORY") {
      return {
        action: "TIMEOUT_1H",
        executedActionDescription: "TIMEOUT_1H_PREDATORY_REVIEW",
        category: classification.category,
        severity: "CRITICAL",
        confidence: classification.confidence,
        reason: classification.reason,
        durationMs: 60 * 60 * 1000,
        requiresStaffNotification: true,
        notifyUser: true,
        userMessage: `⚠️ Your message was removed in **${guildName}** and staff have been alerted for safety review. A temporary 1-hour cooldown timeout has been applied.`,
      };
    }

    // 2. Self-Harm & Suicide Encouragement -> Message Deletion + Compassionate Helpline Support (Supportive, Non-Strict)
    if (classification.category === "SELF_HARM") {
      return {
        action: "DELETE",
        executedActionDescription: "DELETED_SUPPORT_SELF_HARM",
        category: classification.category,
        severity: "CRITICAL",
        confidence: classification.confidence,
        reason: classification.reason,
        requiresStaffNotification: true,
        notifyUser: true,
        userMessage: `💜 Your message was removed in **${guildName}** out of care for your wellbeing. If you or someone you know is going through a tough time, please know that you are not alone. Reach out to someone you trust or contact the Suicide & Crisis Lifeline by calling or texting 988 (free, confidential, 24/7).`,
      };
    }

    // 3. Doxxing & Minor PII Exposure -> Immediate Deletion + Privacy Reminder (Non-Strict)
    if (classification.category === "DOXXING_OR_PII") {
      return {
        action: "DELETE",
        executedActionDescription: "MESSAGE_DELETED_DOXXING",
        category: classification.category,
        severity: "HIGH",
        confidence: classification.confidence,
        reason: classification.reason,
        requiresStaffNotification: true,
        notifyUser: true,
        userMessage: `⚠️ Your message was removed in **${guildName}** because it contained private personally identifiable information (PII). Please respect everyone's privacy and safety.`,
      };
    }

    // 4. Hate Speech -> Deletion + Warning (Non-Strict)
    if (classification.category === "HATE_SPEECH") {
      return {
        action: "DELETE",
        executedActionDescription: "MESSAGE_DELETED_HATE_SPEECH",
        category: classification.category,
        severity: classification.severity,
        confidence: classification.confidence,
        reason: classification.reason,
        requiresStaffNotification: classification.severity === "CRITICAL" || classification.severity === "HIGH",
        notifyUser: true,
        userMessage: `⚠️ Your message was removed in **${guildName}** for violating our community respect and anti-hate guidelines.`,
      };
    }

    // 5. Cyberbullying & Targeted Harassment -> Deletion + Reminder (Non-Strict)
    if (classification.category === "CYBERBULLYING" || classification.category === "HARASSMENT") {
      return {
        action: "DELETE",
        executedActionDescription: "MESSAGE_DELETED_HARASSMENT",
        category: classification.category,
        severity: classification.severity,
        confidence: classification.confidence,
        reason: classification.reason,
        requiresStaffNotification: false,
        notifyUser: true,
        userMessage: `⚠️ Your message was removed in **${guildName}** for unkind or harassing behavior. Please keep interactions positive!`,
      };
    }

    // 6. Severe Profanity or Abuse -> Deletion or Warning (Non-Strict)
    if (classification.category === "SEVERE_PROFANITY_OR_ABUSE") {
      return {
        action: classification.severity === "HIGH" ? "DELETE" : "WARN",
        executedActionDescription: classification.severity === "HIGH" ? "MESSAGE_DELETED_PROFANITY" : "USER_WARNED_PROFANITY",
        category: classification.category,
        severity: classification.severity,
        confidence: classification.confidence,
        reason: classification.reason,
        requiresStaffNotification: false,
        notifyUser: true,
        userMessage: `⚠️ Reminder: Please keep language civil and respectful in **${guildName}**.`,
      };
    }

    // 7. Prompt Injection / Jailbreak attempt
    if (classification.category === "PROMPT_INJECTION_OR_JAILBREAK") {
      return {
        action: "DELETE",
        executedActionDescription: "MESSAGE_DELETED_PROMPT_INJECTION",
        category: classification.category,
        severity: "HIGH",
        confidence: classification.confidence,
        reason: "Adversarial prompt injection attempt detected.",
        requiresStaffNotification: true,
        notifyUser: true,
        userMessage: `⚠️ System command bypass attempts are not permitted in **${guildName}**.`,
      };
    }

    // 8. AutoMod: Phishing & Malicious Scams -> 1h Cooldown + Delete + Staff Ping (Non-Strict, No 24h Timeout)
    if (classification.category === "PHISHING_OR_SCAM") {
      return {
        action: "TIMEOUT_1H",
        executedActionDescription: "DELETED_AND_TIMEOUT_1H_PHISHING",
        category: classification.category,
        severity: "CRITICAL",
        confidence: classification.confidence,
        reason: classification.reason,
        durationMs: 60 * 60 * 1000,
        requiresStaffNotification: true,
        notifyUser: true,
        userMessage: `⚠️ A suspicious link was removed in **${guildName}** and a temporary 1-hour cooldown timeout was applied for community security.`,
      };
    }

    // 9. AutoMod: Mass Mention Spam -> Delete + Warning (Non-Strict, No Timeout)
    if (classification.category === "MASS_MENTION_SPAM") {
      return {
        action: "DELETE",
        executedActionDescription: "MESSAGE_DELETED_MASS_MENTION",
        category: classification.category,
        severity: "HIGH",
        confidence: classification.confidence,
        reason: classification.reason,
        requiresStaffNotification: false,
        notifyUser: true,
        userMessage: `⚠️ Your message was removed in **${guildName}** for excessive user mentions.`,
      };
    }

    // 10. AutoMod: Invite Link Spam -> Delete + Warning
    if (classification.category === "INVITE_LINK_SPAM") {
      return {
        action: "DELETE",
        executedActionDescription: "MESSAGE_DELETED_INVITE_LINK",
        category: classification.category,
        severity: "MEDIUM",
        confidence: classification.confidence,
        reason: classification.reason,
        requiresStaffNotification: false,
        notifyUser: true,
        userMessage: `⚠️ Unauthorized Discord server invite links are not permitted in **${guildName}**.`,
      };
    }

    // 11. AutoMod: Fast Spam / Flood -> Delete
    if (classification.category === "FLOOD_OR_SPAM") {
      return {
        action: "DELETE",
        executedActionDescription: "MESSAGE_DELETED_SPAM_FLOOD",
        category: classification.category,
        severity: "MEDIUM",
        confidence: classification.confidence,
        reason: classification.reason,
        requiresStaffNotification: false,
        notifyUser: true,
        userMessage: `⚠️ Please slow down! Rapid message flooding is prohibited in **${guildName}**.`,
      };
    }

    // 12. AutoMod: Excessive Caps & Zalgo -> Delete
    if (classification.category === "EXCESSIVE_CAPS" || classification.category === "GLITCH_OR_ZALGO") {
      return {
        action: "DELETE",
        executedActionDescription: classification.category === "EXCESSIVE_CAPS" ? "MESSAGE_DELETED_CAPS" : "MESSAGE_DELETED_ZALGO",
        category: classification.category,
        severity: classification.severity,
        confidence: classification.confidence,
        reason: classification.reason,
        requiresStaffNotification: false,
        notifyUser: true,
        userMessage: classification.category === "EXCESSIVE_CAPS"
          ? `⚠️ Please avoid sending messages in all uppercase in **${guildName}**.`
          : `⚠️ Messages containing glitch or excessive zalgo characters are not permitted in **${guildName}**.`,
      };
    }

    // Default Fallback: Warn
    return {
      action: "WARN",
      executedActionDescription: "USER_WARNED",
      category: classification.category,
      severity: classification.severity,
      confidence: classification.confidence,
      reason: classification.reason,
      requiresStaffNotification: false,
      notifyUser: false,
    };
  }
}
