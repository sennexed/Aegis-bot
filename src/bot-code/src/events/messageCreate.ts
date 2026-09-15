/**
 * messageCreate Event Listener
 * Core Real-Time AI Content Moderation Pipeline
 */

import { Message, GuildMember } from "discord.js";
import { TriageService } from "../services/triageService.js";
import { GeminiModerationService } from "../services/geminiModerationService.js";
import { LoggingService } from "../services/loggingService.js";
import { RoleService } from "../services/roleService.js";
import { PolicyEngine, ModerationClassification } from "../services/policyEngine.js";

export async function handleMessageCreate(
  message: Message,
  triageService: TriageService,
  geminiService: GeminiModerationService,
  loggingService: LoggingService,
  roleService: RoleService
) {
  // 1. Guard clauses: Ignore bots, DMs, or empty messages
  if (message.author.bot || !message.guild || !message.content?.trim()) {
    return;
  }

  // 2. Staff exemption check
  const member = message.member;
  if (member && roleService.isStaffOrExempt(member)) {
    return;
  }

  try {
    const rawContent = message.content;

    // 3. Triage & Token Efficiency Filter
    const triage = triageService.evaluate(rawContent);

    let rawClassification: any;

    if (!triage.shouldCallGemini && triage.localVerdict) {
      // Handled entirely by Tier-1 or Tier-2 local triage
      rawClassification = {
        flagged: triage.localVerdict.flagged,
        category: triage.localVerdict.category,
        severity: triage.localVerdict.severity,
        confidence: 0.95,
        reason: triage.localVerdict.reason,
        highlightedPhrases: [],
        ageAppropriateNotes: "Local triage evaluation.",
        tokensUsed: 0,
      };
    } else {
      // Tier-3: Pass to Gemini 3.8 Flash for deep contextual analysis
      const aiResult = await geminiService.analyzeMessage(rawContent, message.author.tag);
      rawClassification = {
        flagged: aiResult.flagged,
        category: aiResult.category,
        severity: aiResult.severity,
        confidence: aiResult.confidence,
        reason: aiResult.reason,
        highlightedPhrases: aiResult.highlightedPhrases,
        ageAppropriateNotes: aiResult.ageAppropriateNotes,
        tokensUsed: aiResult.tokensUsed,
      };

      // Cache the verdict for future duplicate messages if not an API error
      if (!aiResult.isApiErrorFallback) {
        triageService.cacheVerdict(rawContent, {
          flagged: aiResult.flagged,
          category: aiResult.category,
          severity: aiResult.severity,
          recommendedAction: aiResult.recommendedAction,
          reason: `Cached from Gemini: ${aiResult.reason}`,
        });
      }
    }

    // 4. ARCHITECTURAL MANDATE: Validate classification & evaluate via PolicyEngine
    // Pipeline: User message -> AI classifier -> validated classification -> policy engine -> Discord action
    const validatedClassification: ModerationClassification = PolicyEngine.validateClassification(rawClassification);
    const policyDecision = PolicyEngine.evaluatePolicy(validatedClassification, message.guild.name);

    // 5. Action Execution if Policy dictates an action other than ALLOW
    if (policyDecision.action !== "ALLOW") {
      // Direct message notification to the user if policy dictates
      if (policyDecision.notifyUser && policyDecision.userMessage) {
        await message.author.send({ content: policyDecision.userMessage }).catch(() => null);
      }

      switch (policyDecision.action) {
        case "DELETE":
          await message.delete().catch(() => null);
          break;

        case "WARN":
          // User already notified via DM if enabled
          break;

        case "TIMEOUT_1H":
        case "TIMEOUT_24H": {
          const duration = policyDecision.durationMs || (policyDecision.action === "TIMEOUT_1H" ? 3600000 : 86400000);
          await message.delete().catch(() => null);
          if (member && member.moderatable) {
            await member.timeout(duration, `AegisMod Policy: [${policyDecision.category}] ${policyDecision.reason}`).catch(() => null);
          }
          break;
        }

        case "BAN": {
          await message.delete().catch(() => null);
          if (member && member.bannable) {
            await member.ban({ reason: `AegisMod Policy: [${policyDecision.category}] ${policyDecision.reason}` }).catch(() => null);
          }
          break;
        }
      }

      // 6. Send rich audit record to dedicated #mod-logs channel with optional staff alert
      const guildRoles = roleService.getGuildRoles(message.guild.id);
      const staffRoleIds = guildRoles ? [...guildRoles.adminRoleIds, ...guildRoles.moderatorRoleIds] : [];

      await loggingService.logAIAction(
        message,
        {
          flagged: validatedClassification.flagged,
          category: validatedClassification.category,
          severity: validatedClassification.severity,
          recommendedAction: policyDecision.action as any,
          confidence: validatedClassification.confidence,
          reason: validatedClassification.reason,
          highlightedPhrases: validatedClassification.highlightedPhrases,
          ageAppropriateNotes: validatedClassification.ageAppropriateNotes || "",
          tokensUsed: validatedClassification.tokensUsed || 0,
        },
        policyDecision.executedActionDescription,
        {
          requiresStaffNotification: policyDecision.requiresStaffNotification,
          staffRoleIds,
        }
      );
    }
  } catch (err) {
    console.error("[handleMessageCreate] Unexpected moderation pipeline error:", err);
  }
}
