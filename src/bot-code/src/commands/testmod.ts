/**
 * /testmod Slash Command
 * Diagnostic tool for server administrators and moderators
 * Simulates the full AegisMod moderation pipeline on a test message
 * without executing destructive actions or punishing the caller.
 */

import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
} from "discord.js";
import { AutoModService } from "../services/autoModService.js";
import { TriageService } from "../services/triageService.js";
import { GeminiModerationService } from "../services/geminiModerationService.js";
import { PolicyEngine, ModerationClassification } from "../services/policyEngine.js";

export const testModCommand = {
  data: new SlashCommandBuilder()
    .setName("testmod")
    .setDescription("Simulate AegisMod AutoMod & AI moderation on a sample message (Safe preview)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption((opt) =>
      opt
        .setName("content")
        .setDescription("The message text to evaluate through the moderation pipeline")
        .setRequired(true)
    ),

  async execute(
    interaction: ChatInputCommandInteraction,
    autoModService: AutoModService,
    triageService: TriageService,
    geminiService: GeminiModerationService
  ) {
    if (!interaction.guild) {
      return interaction.reply({ content: "This command can only be run in a server.", ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    const content = interaction.options.getString("content", true);
    const authorTag = interaction.user.tag;
    const guildName = interaction.guild.name;

    const startTime = Date.now();

    // 1. AutoMod Check
    const autoMod = autoModService.checkContent(content, interaction.user.id, interaction.guild.id, 0);

    // 2. Triage Check
    const triage = triageService.evaluate(content);

    // 3. AI Evaluation
    let aiResult: any = null;
    let pipelineSource = "AI (Gemini 3.8 Flash)";

    let rawClassification: any;

    if (autoMod.triggered) {
      pipelineSource = `Standard AutoMod (${autoMod.ruleName})`;
      rawClassification = {
        flagged: true,
        category: autoMod.category || "SEVERE_PROFANITY_OR_ABUSE",
        severity: autoMod.severity || "MEDIUM",
        confidence: 1.0,
        reason: autoMod.reason || "AutoMod local trigger",
        highlightedPhrases: autoMod.matchedContent ? [autoMod.matchedContent] : [],
        ageAppropriateNotes: "Deterministic standard AutoMod check.",
        tokensUsed: 0,
      };
    } else if (!triage.shouldCallGemini && triage.localVerdict) {
      pipelineSource = "Triage Filter (Local Heuristic)";
      rawClassification = {
        flagged: triage.localVerdict.flagged,
        category: triage.localVerdict.category,
        severity: triage.localVerdict.severity,
        confidence: 0.99,
        reason: triage.localVerdict.reason,
        highlightedPhrases: [],
        ageAppropriateNotes: "Triage evaluation.",
        tokensUsed: 0,
      };
    } else {
      aiResult = await geminiService.analyzeMessage(content, authorTag);
      pipelineSource = aiResult.isApiErrorFallback ? "AI Fallback (Heuristics)" : "Gemini 3.8 Flash";
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
    }

    // 4. Policy Engine
    const validated: ModerationClassification = PolicyEngine.validateClassification(rawClassification);
    const decision = PolicyEngine.evaluatePolicy(validated, guildName);

    const elapsedMs = Date.now() - startTime;

    // Build Response Embed
    const embed = new EmbedBuilder()
      .setTitle("🧪 AegisMod Pipeline Diagnostic Test")
      .setColor(validated.flagged ? 0xed4245 : 0x57f287)
      .setDescription(`**Input Message:**\n> "${content.slice(0, 300)}"`)
      .addFields(
        {
          name: "Pipeline Resolution",
          value: `**Source:** ${pipelineSource}\n**Execution Time:** ${elapsedMs}ms\n**Tokens Consumed:** ${validated.tokensUsed || 0}`,
          inline: true,
        },
        {
          name: "Classification Verdict",
          value: `**Flagged:** ${validated.flagged ? "🚨 YES" : "✅ NO"}\n**Category:** \`${validated.category}\`\n**Severity:** \`${validated.severity}\`\n**Confidence:** ${Math.round(validated.confidence * 100)}%`,
          inline: true,
        },
        {
          name: "Policy Decision",
          value: `**Action:** \`${decision.action}\`\n**Executed Code:** \`${decision.executedActionDescription}\`\n**Staff Ping Required:** ${decision.requiresStaffNotification ? "🔔 YES" : "NO"}`,
          inline: false,
        },
        {
          name: "Reasoning & Notes",
          value: validated.reason,
          inline: false,
        }
      )
      .setFooter({ text: "This is a safe diagnostic test. No moderation actions were taken." })
      .setTimestamp();

    return interaction.editReply({ embeds: [embed] });
  },
};
