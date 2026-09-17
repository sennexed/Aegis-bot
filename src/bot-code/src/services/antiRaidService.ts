/**
 * Anti-Raid & Gatekeeper Protection Service
 * Detects rapid influxes of newly created accounts, join floods,
 * and allows 1-click server lockdown to protect adolescent communities.
 */

import { Guild, GuildMember, GuildVerificationLevel } from "discord.js";
import { LoggingService } from "./loggingService.js";

export interface RaidIncident {
  guildId: string;
  detectedAt: number;
  recentJoinCount: number;
  suspiciousMembers: string[];
  activeLockdown: boolean;
}

export class AntiRaidService {
  // Join timestamps tracking: guildId -> number[]
  private joinHistory = new Map<string, number[]>();
  // Active raid states per guild
  private activeRaids = new Map<string, RaidIncident>();
  // Lockdown states
  private lockdownEnabled = new Map<string, boolean>();

  private readonly JOIN_THRESHOLD = 5; // > 5 joins
  private readonly WINDOW_MS = 12 * 1000; // within 12 seconds
  private readonly MIN_ACCOUNT_AGE_HOURS = 24; // Suspicious if account < 24h old

  constructor(private loggingService: LoggingService) {}

  /**
   * Tracks a new member joining and evaluates whether a raid is underway
   */
  public async handleMemberJoin(member: GuildMember): Promise<{ isRaid: boolean; isSuspiciousNewAccount: boolean }> {
    const now = Date.now();
    const guild = member.guild;
    const guildId = guild.id;

    // Check account age
    const accountAgeMs = now - member.user.createdTimestamp;
    const accountAgeHours = accountAgeMs / (1000 * 60 * 60);
    const isSuspiciousNewAccount = accountAgeHours < this.MIN_ACCOUNT_AGE_HOURS;

    // Update join history
    const history = (this.joinHistory.get(guildId) || []).filter((t) => now - t < this.WINDOW_MS);
    history.push(now);
    this.joinHistory.set(guildId, history);

    // If already in lockdown, automatically isolate/quarantine member if possible
    if (this.isLockdownActive(guildId)) {
      await this.quarantineMember(member, "Server is in active Raid Lockdown.");
      return { isRaid: true, isSuspiciousNewAccount };
    }

    // Check if threshold exceeded
    if (history.length >= this.JOIN_THRESHOLD) {
      const incident: RaidIncident = {
        guildId,
        detectedAt: now,
        recentJoinCount: history.length,
        suspiciousMembers: [member.user.tag],
        activeLockdown: true,
      };
      this.activeRaids.set(guildId, incident);
      this.lockdownEnabled.set(guildId, true);

      // Log critical alert to #mod-logs
      const logChannel = await this.loggingService.ensureLogChannel(guild);
      await logChannel.send({
        content: `🚨 **MASS RAID DETECTED!** (@here)\nDetected **${history.length} joins in under 12 seconds**!\n• Triggered by: ${member.user.tag} (Account age: ${Math.round(accountAgeHours)}h)\n• **Server Gatekeeper engaged**: Elevated verification & join throttling activated.`,
      }).catch(console.error);

      // Attempt to set Guild verification level to High
      await guild.setVerificationLevel(GuildVerificationLevel.High, "AegisMod Auto Anti-Raid Threshold Triggered").catch(() => null);

      return { isRaid: true, isSuspiciousNewAccount };
    }

    return { isRaid: false, isSuspiciousNewAccount };
  }

  public isLockdownActive(guildId: string): boolean {
    return Boolean(this.lockdownEnabled.get(guildId));
  }

  public async setLockdown(guild: Guild, enable: boolean): Promise<void> {
    this.lockdownEnabled.set(guild.id, enable);
    if (!enable) {
      this.activeRaids.delete(guild.id);
      this.joinHistory.set(guild.id, []);
      await guild.setVerificationLevel(GuildVerificationLevel.Medium, "AegisMod Lockdown Lifted").catch(() => null);
    } else {
      await guild.setVerificationLevel(GuildVerificationLevel.High, "AegisMod Manual Lockdown Enabled").catch(() => null);
    }
  }

  private async quarantineMember(member: GuildMember, reason: string): Promise<void> {
    // Attempt to timeout newly joined member or assign quarantine role
    try {
      await member.timeout(15 * 60 * 1000, `Anti-Raid: ${reason}`);
    } catch {
      // Role hierarchy or missing perms
    }
  }
}
