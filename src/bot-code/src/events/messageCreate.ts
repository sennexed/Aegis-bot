/**
 * messageCreate Event Listener
 * Core Real-Time AI Content Moderation Pipeline
 */

import { Message, GuildMember } from "discord.js";
import { TriageService } from "../services/triageService.js";
import { GeminiModerationService } from "../services/geminiModerationService.js";
import { LoggingService } from "../services/loggingService.js";
import { RoleService } from "../services/roleService.js";

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

    let flagged = false;
    let category = "NONE";
    let severity: "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "NONE";
    let recommendedAction = "ALLOW";
    let confidence = 1.0;
    let reason = triage.reason;
    let highlightedPhrases: string[] = [];
    let ageAppropriateNotes = "";
    let tokensUsed = 0;

    if (!triage.shouldCallGemini && triage.localVerdict) {
      // Handled entirely by Tier-1 or Tier-2 local triage
      flagged = triage.localVerdict.flagged;
      category = triage.localVerdict.category;
      severity = triage.localVerdict.severity;
      recommendedAction = triage.localVerdict.recommendedAction;
      reason = triage.localVerdict.reason;
      tokensUsed = 0;
    } else {
      // Tier-3: Pass to Gemini 3.8 Flash for deep contextual analysis
      const aiResult = await geminiService.analyzeMessage(rawContent, message.author.tag);
      flagged = aiResult.flagged;
      category = aiResult.category;
      severity = aiResult.severity;
      recommendedAction = aiResult.recommendedAction;
      confidence = aiResult.confidence;
      reason = aiResult.reason;
      highlightedPhrases = aiResult.highlightedPhrases;
      ageAppropriateNotes = aiResult.ageAppropriateNotes;
      tokensUsed = aiResult.tokensUsed;

      // Cache the verdict for future duplicate messages
      triageService.cacheVerdict(rawContent, {
        flagged,
        category,
        severity,
        recommendedAction,
        reason: `Cached from Gemini: ${reason}`,
      });
    }

    // 4. Action Execution if Flagged
    if (flagged) {
      let actionExecuted = "LOGGED";

      // Execute automated enforcement
      switch (recommendedAction) {
        case "DELETE":
          await message.delete().catch(() => null);
          await message.author
            .send({
              content: `⚠️ Your message in **${message.guild.name}** was automatically removed for violating teen community standards: **${reason}**`,
            })
            .catch(() => null);
          actionExecuted = "MESSAGE_DELETED";
          break;

        case "WARN":
          await message.author
            .send({
              content: `⚠️ Notice: Your recent message in **${message.guild.name}** triggered our community content standards: **${reason}**`,
            })
            .catch(() => null);
          actionExecuted = "USER_WARNED";
          break;

        case "TIMEOUT_1H":
        case "TIMEOUT_24H": {
          const hours = recommendedAction === "TIMEOUT_1H" ? 1 : 24;
          const durationMs = hours * 60 * 60 * 1000;
          await message.delete().catch(() => null);
          if (member && member.moderatable) {
            await member.timeout(durationMs, `AegisMod Auto-Mod: [${category}] ${reason}`).catch(() => null);
            await message.author
              .send({
                content: `🔇 You have been placed on timeout in **${message.guild.name}** for **${hours} hour(s)** due to: **${reason}**`,
              })
              .catch(() => null);
            actionExecuted = `DELETED_AND_TIMEOUT_${hours}H`;
          }
          break;
        }

        case "BAN": {
          await message.delete().catch(() => null);
          if (member && member.bannable) {
            await member
              .send({
                content: `🔨 You have been banned from **${message.guild.name}** for severe policy breach: **${reason}**`,
              })
              .catch(() => null);
            await member.ban({ reason: `AegisMod Critical Safety: [${category}] ${reason}` }).catch(() => null);
            actionExecuted = "BANNED_CRITICAL_VIOLATION";
          }
          break;
        }
      }

      // 5. Send rich audit record to dedicated #mod-logs channel
      await loggingService.logAIAction(
        message,
        {
          flagged,
          category,
          severity,
          recommendedAction: recommendedAction as any,
          confidence,
          reason,
          highlightedPhrases,
          ageAppropriateNotes,
          tokensUsed,
        },
        actionExecuted
      );
    }
  } catch (err) {
    console.error("[handleMessageCreate] Unexpected moderation pipeline error:", err);
  }
}
