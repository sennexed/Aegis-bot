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
  | "PROMPT_INJECTION_OR_JAILBREAK";

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

    // 1. Zero-Tolerance Predatory Grooming -> IMMEDIATE BAN + STAFF PING
    if (classification.category === "SEXUAL_GROOMING_OR_PREDATORY") {
      return {
        action: "BAN",
        executedActionDescription: "BANNED_PREDATORY_GROOMING",
        category: classification.category,
        severity: "CRITICAL",
        confidence: classification.confidence,
        reason: classification.reason,
        requiresStaffNotification: true,
        notifyUser: true,
        userMessage: `🔨 You have been banned from **${guildName}** for severe violation of youth safety standards: ${classification.reason}`,
      };
    }

    // 2. Self-Harm & Suicide Encouragement -> Immediate 24h Timeout + Staff Ping
    if (classification.category === "SELF_HARM") {
      return {
        action: "TIMEOUT_24H",
        executedActionDescription: "DELETED_AND_TIMEOUT_24H_SELF_HARM",
        category: classification.category,
        severity: "CRITICAL",
        confidence: classification.confidence,
        reason: classification.reason,
        durationMs: 24 * 60 * 60 * 1000,
        requiresStaffNotification: true,
        notifyUser: true,
        userMessage: `⚠️ Your message was removed and you have been timed out for 24 hours in **${guildName}**. If you or someone you know is in crisis, please reach out to local support resources or dial 988 (Suicide & Crisis Lifeline).`,
      };
    }

    // 3. Doxxing & Minor PII Exposure -> Immediate 24h Timeout + Delete + Staff Ping
    if (classification.category === "DOXXING_OR_PII") {
      return {
        action: "TIMEOUT_24H",
        executedActionDescription: "DELETED_AND_TIMEOUT_24H_DOXXING",
        category: classification.category,
        severity: "HIGH",
        confidence: classification.confidence,
        reason: classification.reason,
        durationMs: 24 * 60 * 60 * 1000,
        requiresStaffNotification: true,
        notifyUser: true,
        userMessage: `⚠️ Your message was removed and you have been timed out in **${guildName}** for distributing private personal identifiable information (PII/Doxxing).`,
      };
    }

    // 4. Hate Speech
    if (classification.category === "HATE_SPEECH") {
      const isCritical = classification.severity === "CRITICAL" || classification.severity === "HIGH";
      const action = isCritical ? "TIMEOUT_1H" : "DELETE";
      return {
        action,
        executedActionDescription: isCritical ? "DELETED_AND_TIMEOUT_1H_HATE_SPEECH" : "MESSAGE_DELETED_HATE_SPEECH",
        category: classification.category,
        severity: classification.severity,
        confidence: classification.confidence,
        reason: classification.reason,
        durationMs: isCritical ? 60 * 60 * 1000 : undefined,
        requiresStaffNotification: isCritical,
        notifyUser: true,
        userMessage: `⚠️ Your message was removed in **${guildName}** for violating anti-hate and community safety rules.`,
      };
    }

    // 5. Cyberbullying & Targeted Harassment
    if (classification.category === "CYBERBULLYING" || classification.category === "HARASSMENT") {
      if (classification.severity === "CRITICAL" || classification.severity === "HIGH") {
        return {
          action: "TIMEOUT_1H",
          executedActionDescription: "DELETED_AND_TIMEOUT_1H_HARASSMENT",
          category: classification.category,
          severity: classification.severity,
          confidence: classification.confidence,
          reason: classification.reason,
          durationMs: 60 * 60 * 1000,
          requiresStaffNotification: false,
          notifyUser: true,
          userMessage: `⚠️ You have been placed on a 1-hour timeout in **${guildName}** for targeted harassment or cyberbullying.`,
        };
      }
      return {
        action: "DELETE",
        executedActionDescription: "MESSAGE_DELETED_HARASSMENT",
        category: classification.category,
        severity: classification.severity,
        confidence: classification.confidence,
        reason: classification.reason,
        requiresStaffNotification: false,
        notifyUser: true,
        userMessage: `⚠️ Your message was removed in **${guildName}** for violating teen harassment policies: ${classification.reason}`,
      };
    }

    // 6. Severe Profanity or Abuse
    if (classification.category === "SEVERE_PROFANITY_OR_ABUSE") {
      if (classification.severity === "HIGH") {
        return {
          action: "DELETE",
          executedActionDescription: "MESSAGE_DELETED_PROFANITY",
          category: classification.category,
          severity: classification.severity,
          confidence: classification.confidence,
          reason: classification.reason,
          requiresStaffNotification: false,
          notifyUser: true,
          userMessage: `⚠️ Your message was removed in **${guildName}** for excessive vulgarity or evasion.`,
        };
      }
      return {
        action: "WARN",
        executedActionDescription: "USER_WARNED_PROFANITY",
        category: classification.category,
        severity: "LOW",
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
