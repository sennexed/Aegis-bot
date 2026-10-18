/**
 * Guild Member Add Event Listener
 * Monitors incoming member velocity, account age, and enforces the AegisMod Verification Gatekeeper.
 */

import { GuildMember } from "discord.js";
import { AntiRaidService } from "../services/antiRaidService.js";
import { verificationService } from "../services/verificationService.js";

export async function handleGuildMemberAdd(
  member: GuildMember,
  antiRaidService: AntiRaidService
) {
  if (member.user.bot) return;

  // 1. Anti-Raid join velocity and raid detection
  await antiRaidService.handleMemberJoin(member);
  const isLockdown = antiRaidService.isLockdownActive(member.guild.id);

  // 2. Verification Gatekeeper evaluation
  const evaluation = verificationService.evaluateMemberJoin(member, member.guild.id, isLockdown);
  const config = verificationService.getConfig(member.guild.id);

  if (!config.enabled) return;

  try {
    if (evaluation.action === "QUARANTINE") {
      if (config.quarantineRoleId) {
        await member.roles.add(config.quarantineRoleId, `Gatekeeper Quarantine: ${evaluation.reason}`).catch(() => null);
      }
      try {
        await member.send(`🛡️ **${member.guild.name} Security Gatekeeper**:\nYour account was temporarily placed in review because:\n> *${evaluation.reason}*\nIf you are a genuine member, please contact the server moderation staff via our help channel.`);
      } catch {
        // Direct messages may be closed
      }
    } else if (evaluation.action === "VERIFY_REQUIRED") {
      if (config.unverifiedRoleId) {
        await member.roles.add(config.unverifiedRoleId, "AegisMod Gatekeeper: Pending verification").catch(() => null);
      }
    } else if (evaluation.action === "AUTO_PASS") {
      if (config.verifiedRoleId) {
        await member.roles.add(config.verifiedRoleId, "AegisMod Gatekeeper: Auto-pass").catch(() => null);
      }
    }
  } catch (err) {
    console.warn("[Verification] Error applying onboarding roles:", err);
  }
}
