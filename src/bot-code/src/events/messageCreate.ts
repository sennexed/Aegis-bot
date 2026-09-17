/**
 * messageCreate Event Listener
 * Core Real-Time AI Content Moderation Pipeline
 */

import { Message, GuildMember } from "discord.js";
import { TriageService } from "../services/triageService.js";
import { GeminiModerationService } from "../services/geminiModerationService.js";
import { LoggingService } from "../services/loggingService.js";
import { RoleService } from "../services/roleService.js";
import { AutoModService } from "../services/autoModService.js";
import { PolicyEngine, ModerationClassification } from "../services/policyEngine.js";
import { PHISHING_FILTER } from "../config/phishingFilter.js";
import { ChannelPolicyService } from "../services/channelPolicyService.js";
import { TraditionalModService } from "../services/traditionalModService.js";
import { ANALYTICS_SERVICE } from "../services/analyticsService.js";

export async function handleMessageCreate(
  message: Message,
  triageService: TriageService,
  geminiService: GeminiModerationService,
  loggingService: LoggingService,
  roleService: RoleService,
  autoModService?: AutoModService,
  channelPolicyService?: ChannelPolicyService,
  traditionalModService?: TraditionalModService
) {
  // 1. Guard clauses: Ignore bots or DMs
  if (message.author.bot || !message.guild) {
    return;
  }

  // 2. Staff exemption check
  const member = message.member || (await message.guild.members.fetch(message.author.id).catch(() => null));
  if (member && roleService.isStaffOrExempt(member)) {
    return;
  }

  try {
    const rawContent = message.content || "";
    const channelPolicy = channelPolicyService?.getChannelPolicy(message.channel.id);

    // Image Attachment Multimodal Screening
    if (message.attachments.size > 0 && geminiService) {
      for (const [, attachment] of message.attachments) {
        const isImage = attachment.contentType?.startsWith("image/") || /\.(png|jpe?g|webp|gif)$/i.test(attachment.name || "");
        if (isImage) {
          try {
            // Fetch image buffer and convert to base64
            const imgRes = await fetch(attachment.url);
            const arrayBuffer = await imgRes.arrayBuffer();
            const base64 = Buffer.from(arrayBuffer).toString("base64");
            const imageVerdict = await geminiService.analyzeImageAttachment(
              base64,
              attachment.contentType || "image/png",
              attachment.name || "image.png"
            );

            if (imageVerdict.flagged) {
              await message.delete().catch(() => null);
              await loggingService.logAIAction(message, imageVerdict, `Deleted Image: ${imageVerdict.category}`);
              ANALYTICS_SERVICE.recordViolation(imageVerdict.category, "DELETE");
              await message.author.send({
                content: `⚠️ Your uploaded image in **${message.guild.name}** was deleted by AegisMod.\n**Reason:** ${imageVerdict.reason}`,
              }).catch(() => null);
              return;
            }
          } catch (imgErr) {
            console.warn("[messageCreate] Error analyzing image attachment:", imgErr);
          }
        }
      }
    }

    if (!rawContent.trim()) return;

    // Phishing & Unauthorized Discord Invites check
    const phishingCheck = PHISHING_FILTER.checkContent(rawContent, message.guild.id);
    if (phishingCheck.isMalicious) {
      await message.delete().catch(() => null);
      ANALYTICS_SERVICE.recordViolation("PHISHING_OR_INVITES", "TIMEOUT_24H");
      if (member && member.moderatable) {
        await member.timeout(24 * 60 * 60 * 1000, `Phishing/Scam: ${phishingCheck.reason}`).catch(() => null);
      }
      await message.author.send({
        content: `🚨 Your message in **${message.guild.name}** was deleted for suspicious links/invites.\n**Reason:** ${phishingCheck.reason}`,
      }).catch(() => null);

      const fakeAiResult = {
        flagged: true,
        category: "PHISHING_OR_SCAM",
        severity: "HIGH" as const,
        recommendedAction: "TIMEOUT_24H" as const,
        confidence: 0.99,
        reason: phishingCheck.reason || "Phishing or unauthorized advertising",
        highlightedPhrases: phishingCheck.matchedDomain ? [phishingCheck.matchedDomain] : [],
        ageAppropriateNotes: "Scam prevention for adolescent server members.",
        tokensUsed: 0,
      };
      await loggingService.logAIAction(message, fakeAiResult, "Auto-Timed Out 24h (Phishing Link)");
      return;
    }

    // 3. Step 1: Standard AutoMod Heuristic & Security Layer
    let rawClassification: any;

    if (autoModService) {
      const autoModResult = autoModService.checkMessage(message);
      if (autoModResult.triggered) {
        rawClassification = {
          flagged: true,
          category: autoModResult.category || "SEVERE_PROFANITY_OR_ABUSE",
          severity: autoModResult.severity || "MEDIUM",
          confidence: 1.0,
          reason: autoModResult.reason || "Triggered local AutoMod rule",
          highlightedPhrases: autoModResult.matchedContent ? [autoModResult.matchedContent] : [],
          ageAppropriateNotes: "Deterministic Standard AutoMod filter.",
          tokensUsed: 0,
        };
      }
    }

    // Step 2: Triage & Token Efficiency Filter (if not already flagged by AutoMod)
    if (!rawClassification) {
      const triage = triageService.evaluate(rawContent);

      if (!triage.shouldCallGemini && triage.localVerdict) {
        // Channel policy adjustment: if Gaming Banter channel, pass casual slang without warnings
        if (channelPolicy?.allowMildBanter && triage.localVerdict.category === "CASUAL_BANTER") {
          triage.localVerdict.flagged = false;
        }

        ANALYTICS_SERVICE.recordMessageScanned(true, 240);
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
        // Step 3: Pass to Gemini 3.8 Flash for deep contextual analysis
        ANALYTICS_SERVICE.recordMessageScanned(false, 0);
        const aiResult = await geminiService.analyzeMessage(rawContent, message.author.tag);

        // Respect Gaming Banter profile
        if (channelPolicy?.allowMildBanter && aiResult.category === "SEVERE_PROFANITY_OR_ABUSE" && aiResult.severity === "LOW") {
          aiResult.flagged = false;
        }

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
    }

    // 4. PolicyEngine validation
    const validatedClassification: ModerationClassification = PolicyEngine.validateClassification(rawClassification);
    const policyDecision = PolicyEngine.evaluatePolicy(validatedClassification, message.guild.name);

    if (policyDecision.action !== "ALLOW") {
      ANALYTICS_SERVICE.recordViolation(policyDecision.category, policyDecision.action);

      // Strike Escalation check
      let escalationInfo: string = "";
      if (traditionalModService) {
        const esc = traditionalModService.calculateEscalation(message.guild.id, message.author.id);
        escalationInfo = `\n**Warning Strike Status:** Strike ${esc.strikeCount}/3.`;
        if (esc.recommendedPenalty === "TIMEOUT_24H" && policyDecision.action !== "BAN") {
          policyDecision.action = "TIMEOUT_24H";
          policyDecision.durationMs = 24 * 60 * 60 * 1000;
        } else if (esc.recommendedPenalty === "BAN") {
          policyDecision.action = "BAN";
        }
      }

      // Record infraction
      let caseRecordId = "";
      if (traditionalModService) {
        const inf = traditionalModService.recordInfraction({
          guildId: message.guild.id,
          targetId: message.author.id,
          targetTag: message.author.tag,
          moderatorId: message.client.user.id,
          moderatorTag: "AegisMod AI",
          action: policyDecision.action === "BAN" ? "BAN" : policyDecision.action.startsWith("TIMEOUT") ? "MUTE" : "WARN",
          reason: `[AI AutoMod: ${policyDecision.category}] ${policyDecision.reason}`,
          timestamp: Date.now(),
        });
        caseRecordId = inf.caseId;
      }

      // DM Appeal & notification instructions
      if (policyDecision.notifyUser) {
        const appealHelp = caseRecordId
          ? `\n\n*If you believe this was a mistake, you may submit an appeal using \`/appeal case_id:${caseRecordId}\` or contacting the server moderation team.*`
          : "";
        await message.author.send({
          content: `${policyDecision.userMessage}${escalationInfo}${appealHelp}`,
        }).catch(() => null);
      }

      // 5. Action Execution
      switch (policyDecision.action) {
        case "DELETE":
          await message.delete().catch(() => null);
          break;
        case "WARN":
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

      // 6. Send rich audit record to dedicated #mod-logs channel with interactive Quick Action buttons
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
