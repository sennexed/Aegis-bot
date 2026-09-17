/**
 * Guild Member Add Event Listener
 * Monitors incoming member velocity and account age to thwart raids.
 */

import { GuildMember } from "discord.js";
import { AntiRaidService } from "../services/antiRaidService.js";

export async function handleGuildMemberAdd(
  member: GuildMember,
  antiRaidService: AntiRaidService
) {
  if (member.user.bot) return;
  await antiRaidService.handleMemberJoin(member);
}
