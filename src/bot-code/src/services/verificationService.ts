/**
 * AegisMod Verification Gatekeeper Service
 * Manages member onboarding, anti-alt quarantine, interactive button/captcha verification,
 * and persistent gatekeeper configuration.
 */

import fs from "fs";
import path from "path";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  Guild,
  GuildMember,
} from "discord.js";
import { getPersistentDataDir } from "../utils/storagePath.js";

export type VerificationMode = "BUTTON" | "CAPTCHA" | "ANTI_ALT" | "AI_PLEDGE";

export interface VerificationStats {
  totalVerified: number;
  totalQuarantined: number;
  totalFailed: number;
}

export interface VerificationConfig {
  guildId: string;
  enabled: boolean;
  mode: VerificationMode;
  verificationChannelId?: string;
  verifiedRoleId?: string;
  unverifiedRoleId?: string;
  quarantineRoleId?: string;
  minAccountAgeDays: number;
  requireAvatar: boolean;
  kickOnFailedCaptcha: boolean;
  captchaMaxAttempts: number;
  customPledgeText?: string;
  stats: VerificationStats;
  updatedAt: string;
}

export interface CaptchaSession {
  code: string;
  attempts: number;
  expiresAt: number;
}

export class VerificationService {
  private configMap = new Map<string, VerificationConfig>();
  private activeCaptchas = new Map<string, CaptchaSession>();
  private storageFilePath: string;

  constructor() {
    const dataDir = getPersistentDataDir();
    this.storageFilePath = path.join(dataDir, "verification_config.json");
    this.loadFromDisk();
  }

  /**
   * Load configurations from disk
   */
  private loadFromDisk(): void {
    try {
      if (fs.existsSync(this.storageFilePath)) {
        const raw = fs.readFileSync(this.storageFilePath, "utf-8");
        const parsed = JSON.parse(raw);
        if (typeof parsed === "object" && parsed !== null) {
          for (const [guildId, config] of Object.entries(parsed)) {
            this.configMap.set(guildId, config as VerificationConfig);
          }
        }
      }
    } catch (err) {
      console.warn("Notice: Failed to load verification configs from disk, using defaults:", err);
    }
  }

  /**
   * Persist configurations to disk
   */
  private persistToDisk(): void {
    try {
      const obj: Record<string, VerificationConfig> = {};
      for (const [guildId, config] of this.configMap.entries()) {
        obj[guildId] = config;
      }
      fs.writeFileSync(this.storageFilePath, JSON.stringify(obj, null, 2), "utf-8");
    } catch (err) {
      console.error("Failed to persist verification configs to disk:", err);
    }
  }

  /**
   * Get default configuration for a guild
   */
  public getDefaultConfig(guildId: string): VerificationConfig {
    return {
      guildId,
      enabled: true,
      mode: "BUTTON",
      minAccountAgeDays: 3,
      requireAvatar: true,
      kickOnFailedCaptcha: false,
      captchaMaxAttempts: 3,
      customPledgeText: "I agree to treat all teen community members with respect, report unsafe behavior, and never ask for or share personal info.",
      stats: {
        totalVerified: 0,
        totalQuarantined: 0,
        totalFailed: 0,
      },
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get configuration for a guild
   */
  public getConfig(guildId: string): VerificationConfig {
    if (!this.configMap.has(guildId)) {
      const defaultConfig = this.getDefaultConfig(guildId);
      this.configMap.set(guildId, defaultConfig);
      this.persistToDisk();
    }
    return this.configMap.get(guildId)!;
  }

  /**
   * Update configuration for a guild
   */
  public updateConfig(guildId: string, partial: Partial<VerificationConfig>): VerificationConfig {
    const current = this.getConfig(guildId);
    const updated: VerificationConfig = {
      ...current,
      ...partial,
      stats: {
        ...current.stats,
        ...(partial.stats || {}),
      },
      updatedAt: new Date().toISOString(),
    };
    this.configMap.set(guildId, updated);
    this.persistToDisk();
    return updated;
  }

  /**
   * Evaluates a member joining the server
   */
  public evaluateMemberJoin(
    member: { id: string; user: { createdAt: Date; bot: boolean; avatar: string | null } },
    guildId: string,
    isRaidLockdown: boolean = false
  ): { action: "VERIFY_REQUIRED" | "QUARANTINE" | "AUTO_PASS"; reason: string } {
    if (member.user.bot) {
      return { action: "AUTO_PASS", reason: "Bot account bypasses gatekeeper" };
    }

    const config = this.getConfig(guildId);
    if (!config.enabled) {
      return { action: "AUTO_PASS", reason: "Verification gatekeeper disabled" };
    }

    // Emergency Anti-Raid elevation
    if (isRaidLockdown) {
      return {
        action: "QUARANTINE",
        reason: "Server Anti-Raid lockdown is active. Incoming accounts quarantined for staff safety.",
      };
    }

    // Account Age Check
    const accountAgeMs = Date.now() - member.user.createdAt.getTime();
    const accountAgeDays = accountAgeMs / (1000 * 60 * 60 * 24);

    if (accountAgeDays < config.minAccountAgeDays) {
      this.recordStat(guildId, "totalQuarantined");
      return {
        action: "QUARANTINE",
        reason: `Account age (${Math.floor(accountAgeDays)}d) is below the required ${config.minAccountAgeDays} days maturity threshold.`,
      };
    }

    // Avatar Requirement Check
    if (config.requireAvatar && !member.user.avatar) {
      this.recordStat(guildId, "totalQuarantined");
      return {
        action: "QUARANTINE",
        reason: "Default Discord avatar detected. Server policy requires a customized profile picture to prevent throwaway alt accounts.",
      };
    }

    return {
      action: "VERIFY_REQUIRED",
      reason: "Account verified eligible for gatekeeper challenge.",
    };
  }

  /**
   * Generate a random 6-character Captcha code excluding confusing characters (0/O, 1/I/l)
   */
  public generateCaptchaCode(): string {
    const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Initialize a Captcha session for a user (valid for 90 seconds)
   */
  public createCaptchaSession(userId: string): string {
    const code = this.generateCaptchaCode();
    this.activeCaptchas.set(userId, {
      code,
      attempts: 0,
      expiresAt: Date.now() + 90 * 1000,
    });
    return code;
  }

  /**
   * Get active captcha session
   */
  public getCaptchaSession(userId: string): CaptchaSession | null {
    const session = this.activeCaptchas.get(userId);
    if (!session) return null;
    if (Date.now() > session.expiresAt) {
      this.activeCaptchas.delete(userId);
      return null;
    }
    return session;
  }

  /**
   * Verify a submitted Captcha code
   */
  public verifyCaptcha(
    userId: string,
    userInput: string,
    guildId: string
  ): { success: boolean; attemptsLeft: number; error?: string } {
    const session = this.getCaptchaSession(userId);
    if (!session) {
      return { success: false, attemptsLeft: 0, error: "Captcha expired or not found. Please click 'Verify Now' again." };
    }

    const config = this.getConfig(guildId);
    const cleanedInput = userInput.trim().toUpperCase();

    if (cleanedInput === session.code) {
      this.activeCaptchas.delete(userId);
      this.recordStat(guildId, "totalVerified");
      return { success: true, attemptsLeft: config.captchaMaxAttempts };
    }

    session.attempts += 1;
    const attemptsLeft = Math.max(0, config.captchaMaxAttempts - session.attempts);

    this.recordStat(guildId, "totalFailed");

    if (attemptsLeft <= 0) {
      this.activeCaptchas.delete(userId);
      return {
        success: false,
        attemptsLeft: 0,
        error: "Maximum verification attempts exceeded. Please wait 2 minutes or contact staff.",
      };
    }

    return {
      success: false,
      attemptsLeft,
      error: `Incorrect captcha code. You have ${attemptsLeft} attempt(s) remaining.`,
    };
  }

  /**
   * Increment a statistic counter
   */
  public recordStat(guildId: string, statKey: keyof VerificationStats): void {
    const config = this.getConfig(guildId);
    config.stats[statKey] += 1;
    this.persistToDisk();
  }

  /**
   * Promotes member: removes unverified/quarantine roles, adds verified role
   */
  public async grantVerifiedRoles(member: GuildMember, guildId: string): Promise<boolean> {
    try {
      const config = this.getConfig(guildId);
      
      if (config.unverifiedRoleId && member.roles.cache.has(config.unverifiedRoleId)) {
        await member.roles.remove(config.unverifiedRoleId, "AegisMod Verification Passed").catch(() => null);
      }
      if (config.quarantineRoleId && member.roles.cache.has(config.quarantineRoleId)) {
        await member.roles.remove(config.quarantineRoleId, "AegisMod Verification Passed").catch(() => null);
      }
      if (config.verifiedRoleId) {
        await member.roles.add(config.verifiedRoleId, "AegisMod Verification Passed").catch(() => null);
      }

      this.recordStat(guildId, "totalVerified");
      return true;
    } catch (err) {
      console.error("Error granting verified roles to member:", err);
      return false;
    }
  }

  /**
   * Constructs the main Discord Verification Announcement Embed
   */
  public buildVerificationEmbed(guildName: string, config: VerificationConfig): EmbedBuilder {
    const modeDescriptions: Record<VerificationMode, string> = {
      BUTTON: "Click the **'Verify & Accept Rules'** button below to immediately gain access to the server.",
      CAPTCHA: "Click the button below to solve a quick 6-character anti-bot captcha challenge.",
      ANTI_ALT: "Accounts meeting our maturity standards are automatically granted access. Click below to verify.",
      AI_PLEDGE: "Read our community safety pledge and click below to confirm your commitment to teen member safety.",
    };

    return new EmbedBuilder()
      .setTitle(`🛡️ Welcome to ${guildName} • Verification Gate`)
      .setDescription(
        `To protect our community from spam bots, predatory accounts, and raids, all newcomers must verify before accessing channels.\n\n` +
        `### 📜 Community Rules & Safety Principles\n` +
        `• **Respect & Civility:** No harassment, hate speech, bullying, or slurs.\n` +
        `• **Adolescent Safety:** Zero tolerance for asking for personal phone numbers, addresses, selfies, or suggestive DMs.\n` +
        `• **Zero Scams & Phishing:** Never share suspicious Discord Nitro or Steam links.\n` +
        `• **Moderation Authority:** Follow instructions from server staff and AegisMod.\n\n` +
        `**Verification Mode:** \`${config.mode}\`\n` +
        `👉 ${modeDescriptions[config.mode]}`
      )
      .setColor(0x5865F2)
      .setFooter({ text: "AegisMod Protection Suite • High-Standard Teen Community Safety" })
      .setTimestamp();
  }

  /**
   * Constructs the action row with Verify, Rules, and ModMail buttons
   */
  public buildVerificationActionRow(): ActionRowBuilder<ButtonBuilder> {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("verify_button_click")
        .setLabel("✅ Verify & Accept Rules")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("verify_rules_click")
        .setLabel("📜 Read Full Rules")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("verify_modmail_click")
        .setLabel("📩 Need Help? (Staff ModMail)")
        .setStyle(ButtonStyle.Secondary)
    );
  }
}

export const verificationService = new VerificationService();
