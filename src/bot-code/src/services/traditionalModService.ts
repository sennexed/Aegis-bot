/**
 * Traditional Moderation Service
 * Handles manual moderation commands: /ban, /kick, /mute (timeout), /warn, and infraction tracking.
 */

import { Guild, GuildMember, User } from "discord.js";
import fs from "fs";
import path from "path";
import { LoggingService } from "./loggingService.js";
import { RoleService } from "./roleService.js";

export interface InfractionRecord {
  caseId: string;
  guildId: string;
  targetId: string;
  targetTag: string;
  moderatorId: string;
  moderatorTag: string;
  action: "BAN" | "KICK" | "MUTE" | "WARN" | "UNMUTE";
  reason: string;
  durationMs?: number;
  timestamp: number;
}

export class TraditionalModService {
  private infractions = new Map<string, InfractionRecord[]>(); // guildId:userId -> InfractionRecord[]
  private caseCounter = 1000;
  private infractionsFilePath = path.join(process.cwd(), "infractions.json");
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(
    private loggingService: LoggingService,
    private roleService: RoleService
  ) {
    this.loadFromDisk();
  }

  private async loadFromDisk(): Promise<void> {
    try {
      if (fs.existsSync(this.infractionsFilePath)) {
        const raw = await fs.promises.readFile(this.infractionsFilePath, "utf8");
        const parsed = JSON.parse(raw);
        if (parsed.infractions && typeof parsed.infractions === "object") {
          for (const key of Object.keys(parsed.infractions)) {
            this.infractions.set(key, parsed.infractions[key]);
          }
        }
        if (typeof parsed.caseCounter === "number") {
          this.caseCounter = parsed.caseCounter;
        }
      }
    } catch (err) {
      console.warn("[TraditionalModService] Unable to load infractions.json, starting fresh:", err);
    }
  }

  private async persistToDisk(): Promise<void> {
    this.writeQueue = this.writeQueue
      .then(async () => {
        const obj: Record<string, InfractionRecord[]> = {};
        this.infractions.forEach((val, key) => {
          obj[key] = val;
        });
        const data = {
          caseCounter: this.caseCounter,
          infractions: obj,
        };
        const tempPath = `${this.infractionsFilePath}.tmp`;
        await fs.promises.writeFile(tempPath, JSON.stringify(data, null, 2), "utf8");
        await fs.promises.rename(tempPath, this.infractionsFilePath);
      })
      .catch((err) => {
        console.error("[TraditionalModService] Failed to persist infractions to disk:", err);
      });
  }

  /**
   * Bans a member from the guild with optional message pruning
   */
  public async ban(
    moderator: GuildMember,
    target: GuildMember,
    reason: string,
    deleteMessageDays: number = 1
  ): Promise<{ success: boolean; error?: string }> {
    const check = this.roleService.canModerateMember(moderator, target, "BAN");
    if (!check.allowed) return { success: false, error: check.reason };

    try {
      // Send DM notification to user before banning
      await target.send({
        content: `You have been banned from **${target.guild.name}**.\n**Reason:** ${reason}`,
      }).catch(() => null);

      await target.ban({
        reason: `${moderator.user.tag}: ${reason}`,
        deleteMessageSeconds: deleteMessageDays * 86400,
      });

      this.recordInfraction({
        guildId: target.guild.id,
        targetId: target.id,
        targetTag: target.user.tag,
        moderatorId: moderator.id,
        moderatorTag: moderator.user.tag,
        action: "BAN",
        reason,
        timestamp: Date.now(),
      });

      await this.loggingService.logTraditionalModAction(
        target.guild,
        target.user,
        moderator.user,
        "BAN",
        reason
      );

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Kicks a member from the guild
   */
  public async kick(
    moderator: GuildMember,
    target: GuildMember,
    reason: string
  ): Promise<{ success: boolean; error?: string }> {
    const check = this.roleService.canModerateMember(moderator, target, "KICK");
    if (!check.allowed) return { success: false, error: check.reason };

    try {
      await target.send({
        content: `You have been kicked from **${target.guild.name}**.\n**Reason:** ${reason}`,
      }).catch(() => null);

      await target.kick(`${moderator.user.tag}: ${reason}`);

      this.recordInfraction({
        guildId: target.guild.id,
        targetId: target.id,
        targetTag: target.user.tag,
        moderatorId: moderator.id,
        moderatorTag: moderator.user.tag,
        action: "KICK",
        reason,
        timestamp: Date.now(),
      });

      await this.loggingService.logTraditionalModAction(
        target.guild,
        target.user,
        moderator.user,
        "KICK",
        reason
      );

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Mutes (times out) a member using Discord's native timeout feature
   */
  public async mute(
    moderator: GuildMember,
    target: GuildMember,
    durationMs: number,
    reason: string
  ): Promise<{ success: boolean; error?: string }> {
    const check = this.roleService.canModerateMember(moderator, target, "MUTE");
    if (!check.allowed) return { success: false, error: check.reason };

    // Discord limits timeouts to 28 days
    const maxDuration = 28 * 24 * 60 * 60 * 1000;
    if (durationMs > maxDuration) {
      return { success: false, error: "Timeout duration cannot exceed 28 days." };
    }

    try {
      await target.timeout(durationMs, `${moderator.user.tag}: ${reason}`);

      const formattedDuration = this.formatDuration(durationMs);

      await target.send({
        content: `You have been muted (timed out) in **${target.guild.name}** for **${formattedDuration}**.\n**Reason:** ${reason}`,
      }).catch(() => null);

      this.recordInfraction({
        guildId: target.guild.id,
        targetId: target.id,
        targetTag: target.user.tag,
        moderatorId: moderator.id,
        moderatorTag: moderator.user.tag,
        action: "MUTE",
        reason,
        durationMs,
        timestamp: Date.now(),
      });

      await this.loggingService.logTraditionalModAction(
        target.guild,
        target.user,
        moderator.user,
        "MUTE",
        reason,
        formattedDuration
      );

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Issues an official warning to a member
   */
  public async warn(
    moderator: GuildMember,
    target: GuildMember,
    reason: string
  ): Promise<{ success: boolean; warningCount: number; error?: string }> {
    try {
      const record = this.recordInfraction({
        guildId: target.guild.id,
        targetId: target.id,
        targetTag: target.user.tag,
        moderatorId: moderator.id,
        moderatorTag: moderator.user.tag,
        action: "WARN",
        reason,
        timestamp: Date.now(),
      });

      const userCases = this.getUserCases(target.guild.id, target.id);
      const warningCount = userCases.filter((c) => c.action === "WARN").length;

      await target.send({
        content: `⚠️ You received an official warning in **${target.guild.name}**.\n**Reason:** ${reason}\n**Total Warnings:** ${warningCount}`,
      }).catch(() => null);

      await this.loggingService.logTraditionalModAction(
        target.guild,
        target.user,
        moderator.user,
        "WARN",
        `${reason} (Strike #${warningCount})`
      );

      return { success: true, warningCount };
    } catch (err: any) {
      return { success: false, warningCount: 0, error: err.message };
    }
  }

  public recordInfraction(data: Omit<InfractionRecord, "caseId">): InfractionRecord {
    const key = `${data.guildId}:${data.targetId}`;
    const list = this.infractions.get(key) || [];
    const record: InfractionRecord = {
      ...data,
      caseId: `CASE-${++this.caseCounter}`,
    };
    list.push(record);
    this.infractions.set(key, list);
    this.persistToDisk();
    return record;
  }

  public getUserCases(guildId: string, userId: string): InfractionRecord[] {
    return this.infractions.get(`${guildId}:${userId}`) || [];
  }

  public parseDurationString(input: string): number | null {
    const match = input.trim().match(/^(\d+)\s*(s|m|h|d|w)$/i);
    if (!match) return null;

    const val = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();

    switch (unit) {
      case "s": return val * 1000;
      case "m": return val * 60 * 1000;
      case "h": return val * 60 * 60 * 1000;
      case "d": return val * 24 * 60 * 60 * 1000;
      case "w": return val * 7 * 24 * 60 * 60 * 1000;
      default: return null;
    }
  }

  public formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds} seconds`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours`;
    const days = Math.floor(hours / 24);
    return `${days} days`;
  }
}
