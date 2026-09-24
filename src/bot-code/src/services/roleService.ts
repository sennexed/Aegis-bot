/**
 * Role Service
 * Handles interactive role setup (Owner, Admin, Moderator) using Discord RoleSelectMenuBuilder,
 * role hierarchy validations, permission checks, and guild configurations.
 */

import {
  ActionRowBuilder,
  RoleSelectMenuBuilder,
  GuildMember,
  Guild,
  PermissionFlagsBits,
} from "discord.js";
import fs from "fs";
import path from "path";

export interface GuildRoleMapping {
  guildId: string;
  ownerRoleId: string | null;
  adminRoleIds: string[];
  moderatorRoleIds: string[];
  configuredAt: number;
}

export class RoleService {
  private guildRoles = new Map<string, GuildRoleMapping>();
  private dataFilePath = path.join(process.cwd(), "guild_roles.json");
  private writeQueue: Promise<void> = Promise.resolve();

  constructor() {
    this.loadFromDisk();
  }

  private async loadFromDisk(): Promise<void> {
    try {
      if (fs.existsSync(this.dataFilePath)) {
        const raw = await fs.promises.readFile(this.dataFilePath, "utf8");
        const parsed = JSON.parse(raw);
        for (const key of Object.keys(parsed)) {
          this.guildRoles.set(key, parsed[key]);
        }
      }
    } catch (err) {
      console.warn("[RoleService] Warning: Unable to parse guild_roles.json, falling back to memory store:", err);
    }
  }

  private async persistToDisk(): Promise<void> {
    // Chain writes to serialize async operations and avoid file corruption
    this.writeQueue = this.writeQueue
      .then(async () => {
        const obj: Record<string, GuildRoleMapping> = {};
        this.guildRoles.forEach((val, key) => {
          obj[key] = val;
        });
        const dir = path.dirname(this.dataFilePath);
        if (!fs.existsSync(dir)) {
          await fs.promises.mkdir(dir, { recursive: true });
        }
        await fs.promises.writeFile(this.dataFilePath, JSON.stringify(obj, null, 2), "utf8");
      })
      .catch((err) => {
        console.error("[RoleService] Failed to persist role mappings to disk:", err);
      });
  }

  /**
   * Generates the Discord Role Select Menu components for server onboarding
   */
  public createSetupRoleSelects(guildId: string): ActionRowBuilder<RoleSelectMenuBuilder>[] {
    // 1. Owner Role Select Menu
    const ownerSelect = new RoleSelectMenuBuilder()
      .setCustomId(`setup:role:owner:${guildId}`)
      .setPlaceholder("Select Server Owner / Executive Role")
      .setMinValues(1)
      .setMaxValues(1);

    // 2. Admin Roles Select Menu
    const adminSelect = new RoleSelectMenuBuilder()
      .setCustomId(`setup:role:admin:${guildId}`)
      .setPlaceholder("Select Administrator Roles (Full Control)")
      .setMinValues(1)
      .setMaxValues(5);

    // 3. Moderator Roles Select Menu
    const modSelect = new RoleSelectMenuBuilder()
      .setCustomId(`setup:role:mod:${guildId}`)
      .setPlaceholder("Select Moderator Roles (Kick, Ban, Mute, Warn)")
      .setMinValues(1)
      .setMaxValues(10);

    return [
      new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(ownerSelect),
      new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(adminSelect),
      new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(modSelect),
    ];
  }

  /**
   * Saves role mappings configured via Discord Select Menus
   */
  public saveGuildRoles(
    guildId: string,
    ownerRoleId: string | null,
    adminRoleIds: string[],
    moderatorRoleIds: string[]
  ): GuildRoleMapping {
    const mapping: GuildRoleMapping = {
      guildId,
      ownerRoleId,
      adminRoleIds,
      moderatorRoleIds,
      configuredAt: Date.now(),
    };
    this.guildRoles.set(guildId, mapping);
    this.persistToDisk();
    return mapping;
  }

  public isGuildConfigured(guildId: string): boolean {
    return this.guildRoles.has(guildId);
  }

  public getGuildRoles(guildId: string): GuildRoleMapping | undefined {
    return this.guildRoles.get(guildId);
  }

  /**
   * Checks if member is exempt from moderation (Staff, Bot, or Owner)
   */
  public isStaffOrExempt(member: GuildMember): boolean {
    if (member.user.bot) return true;
    if (member.id === member.guild.ownerId) return true;
    if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;

    const config = this.getGuildRoles(member.guild.id);
    if (!config) return false;

    // Check owner role
    if (config.ownerRoleId && member.roles.cache.has(config.ownerRoleId)) {
      return true;
    }

    // Check admin roles
    if (config.adminRoleIds.some((id) => member.roles.cache.has(id))) {
      return true;
    }

    // Check moderator roles
    if (config.moderatorRoleIds.some((id) => member.roles.cache.has(id))) {
      return true;
    }

    return false;
  }

  /**
   * Checks if member has Admin or Server Owner permissions
   */
  public isAdminOrOwner(member: GuildMember): boolean {
    if (member.id === member.guild.ownerId) return true;
    if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;

    const config = this.getGuildRoles(member.guild.id);
    if (!config) return false;

    if (config.ownerRoleId && member.roles.cache.has(config.ownerRoleId)) {
      return true;
    }

    if (config.adminRoleIds.some((id) => member.roles.cache.has(id))) {
      return true;
    }

    return false;
  }

  /**
   * Validates if executor can moderate the target based on Discord hierarchy
   */
  public canModerateMember(
    executor: GuildMember,
    target: GuildMember,
    action: "BAN" | "KICK" | "MUTE" | "WARN"
  ): { allowed: boolean; reason?: string } {
    // Cannot moderate server owner
    if (target.id === target.guild.ownerId) {
      return { allowed: false, reason: "You cannot moderate the Server Owner." };
    }

    // Cannot moderate oneself
    if (executor.id === target.id) {
      return { allowed: false, reason: "You cannot take moderation action on yourself." };
    }

    // Guild Owner can moderate anyone
    if (executor.id === executor.guild.ownerId) {
      return { allowed: true };
    }

    // Role hierarchy check
    if (executor.roles.highest.position <= target.roles.highest.position) {
      return {
        allowed: false,
        reason: "Your highest role is lower or equal to the target's highest role in Discord's hierarchy.",
      };
    }

    // Bot permission check
    const botMember = target.guild.members.me;
    if (botMember && botMember.roles.highest.position <= target.roles.highest.position) {
      return {
        allowed: false,
        reason: "The Bot's role is lower than the target member's role and cannot perform this action.",
      };
    }

    return { allowed: true };
  }

  /**
   * Generates a ping mention string for staff:
   * Prioritizes on-duty moderators & admins (<@u1> <@u2>).
   * Falls back to staff role mentions (<@&modRole>) if nobody is currently on duty.
   */
  public getStaffPing(
    guildId: string,
    dutyService?: { getOnDutyMentions: (gId: string, loaService?: any) => string },
    loaService?: { isUserOnLoa: (gId: string, uId: string) => boolean }
  ): string {
    if (dutyService) {
      const onDutyMentions = dutyService.getOnDutyMentions(guildId, loaService);
      if (onDutyMentions) {
        return `🔔 **ON-DUTY STAFF:** ${onDutyMentions}`;
      }
    }

    const config = this.getGuildRoles(guildId);
    if (config) {
      const roleIds = [...config.moderatorRoleIds, ...config.adminRoleIds];
      if (roleIds.length > 0) {
        const uniqueRoles = [...new Set(roleIds)];
        return `🔔 **STAFF ALERT (No staff currently on-duty):** ${uniqueRoles.map((id) => `<@&${id}>`).join(" ")}`;
      }
    }

    return `🔔 **STAFF ALERT (No staff currently on-duty):** Please review in #mod-logs.`;
  }
}
