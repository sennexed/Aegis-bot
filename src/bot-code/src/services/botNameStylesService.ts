/**
 * Discord Bot Name Styles Service
 * Manages bot display name styling, font selection, visual effects, and Discord API PATCH requests.
 * Includes support for:
 * 1. Discord REST API PATCH /users/@me (name_style, font_id, effect_id, colors)
 * 2. Guild nickname synchronization with server tag / clan badge
 * 3. In-memory styling state persistence and live preview formatting
 */

import fs from "fs";
import path from "path";
import {
  BOT_NAME_FONTS,
  BOT_NAME_EFFECTS,
  BOT_COLOR_PRESETS,
  BotNameStyleConfig,
  DEFAULT_BOT_NAME_STYLE,
  hexToDiscordDecimal,
} from "../types/nameStyles.js";

class BotNameStylesService {
  private config: BotNameStyleConfig = { ...DEFAULT_BOT_NAME_STYLE };
  private history: { timestamp: string; config: BotNameStyleConfig; appliedToDiscord: boolean }[] = [];
  private dataDir = path.join(process.cwd(), "data");
  private storageFilePath = path.join(this.dataDir, "name_styles.json");
  private writeQueue: Promise<void> = Promise.resolve();

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }

      if (fs.existsSync(this.storageFilePath)) {
        const raw = fs.readFileSync(this.storageFilePath, "utf8");
        const parsed = JSON.parse(raw);
        if (parsed.config) {
          this.config = { ...DEFAULT_BOT_NAME_STYLE, ...parsed.config };
        }
        if (Array.isArray(parsed.history)) {
          this.history = parsed.history;
        }
      } else {
        this.history.push({
          timestamp: new Date().toISOString(),
          config: { ...this.config },
          appliedToDiscord: true,
        });
        this.persistToDisk();
      }
    } catch (err) {
      console.warn("[NameStyles] Warning: could not load name_styles.json from disk, using defaults:", err);
      this.history.push({
        timestamp: new Date().toISOString(),
        config: { ...this.config },
        appliedToDiscord: true,
      });
    }
  }

  private async persistToDisk(): Promise<void> {
    this.writeQueue = this.writeQueue
      .then(async () => {
        if (!fs.existsSync(this.dataDir)) {
          await fs.promises.mkdir(this.dataDir, { recursive: true });
        }
        const dataObj = {
          config: this.config,
          history: this.history,
          updatedAt: new Date().toISOString(),
        };
        const tempPath = `${this.storageFilePath}.tmp`;
        await fs.promises.writeFile(tempPath, JSON.stringify(dataObj, null, 2), "utf8");
        await fs.promises.rename(tempPath, this.storageFilePath);
      })
      .catch((err) => {
        console.error("[NameStyles] Failed to persist name styles to disk:", err);
      });
    return this.writeQueue;
  }

  /**
   * Get current name style configuration
   */
  public getConfig(): BotNameStyleConfig {
    return { ...this.config };
  }

  /**
   * Get catalog of fonts, effects, and color presets
   */
  public getCatalog() {
    return {
      fonts: BOT_NAME_FONTS,
      effects: BOT_NAME_EFFECTS,
      colors: BOT_COLOR_PRESETS,
    };
  }

  /**
   * Update configuration and optionally trigger Discord API sync
   */
  public updateConfig(updates: Partial<BotNameStyleConfig>): {
    success: boolean;
    config: BotNameStyleConfig;
    apiPayload: Record<string, any>;
  } {
    this.config = {
      ...this.config,
      ...updates,
    };

    const apiPayload = this.buildDiscordApiPayload(this.config);

    this.history.unshift({
      timestamp: new Date().toISOString(),
      config: { ...this.config },
      appliedToDiscord: true,
    });
    if (this.history.length > 20) this.history.pop();

    this.persistToDisk();

    return {
      success: true,
      config: { ...this.config },
      apiPayload,
    };
  }

  /**
   * Build Discord API request payload for /users/@me
   * Structures name_style parameters according to Discord's Display Name Styles specification
   */
  public buildDiscordApiPayload(config: BotNameStyleConfig = this.config) {
    const primaryDec = hexToDiscordDecimal(config.primaryColor);
    const secondaryDec = config.secondaryColor ? hexToDiscordDecimal(config.secondaryColor) : primaryDec;
    const colors = [primaryDec, secondaryDec];
    if (config.tertiaryColor) {
      colors.push(hexToDiscordDecimal(config.tertiaryColor));
    }

    return {
      username: config.displayName,
      global_name: config.displayName,
      name_style: {
        font_id: config.fontId,
        effect_id: config.effectId,
        colors,
      },
      clan: config.clanTag
        ? {
            tag: config.clanTag,
            badge: config.clanBadge || "🛡️",
            identity_enabled: true,
          }
        : null,
    };
  }

  /**
   * Formats the displayed nickname for a server (including clan tag / badge prefix)
   */
  public formatFormattedNickname(config: BotNameStyleConfig = this.config): string {
    const font = BOT_NAME_FONTS.find((f) => f.id === config.fontId);
    let styledText = config.displayName;

    if (font?.transform) {
      styledText = font.transform(config.displayName);
    }

    if (config.clanTag) {
      const badge = config.clanBadge ? `${config.clanBadge} ` : "";
      return `[${badge}${config.clanTag}] ${styledText}`;
    }

    return styledText;
  }

  /**
   * Automatic Role Color Sync:
   * Discord raw nicknames cannot render colors or gradients directly.
   * Creates or updates a dedicated identity role with the hexColor and assigns it to the bot.
   */
  public async syncBotNametagColor(guild: any, hexColor: string, roleName = "AEGIS Identity") {
    if (!guild || !guild.roles) return null;
    try {
      let role = guild.roles.cache.find((r: any) => r.name === roleName);
      const colorDec = hexToDiscordDecimal(hexColor);
      if (!role) {
        role = await guild.roles.create({
          name: roleName,
          color: colorDec,
          reason: "Nametag identity color sync",
        });
      } else {
        await role.setColor(colorDec);
      }
      const botMember = await guild.members.fetchMe().catch(() => guild.members.me);
      if (botMember && botMember.roles && !botMember.roles.cache.has(role.id)) {
        await botMember.roles.add(role).catch(() => null);
      }
      return role;
    } catch (err: any) {
      console.warn(`[NameStyles] Could not sync role color in guild ${guild.name || guild.id}:`, err?.message || err);
      return null;
    }
  }

  /**
   * Synchronizes both nickname text and identity role color across all guilds in the Discord client
   */
  public async syncAcrossGuilds(client: any, config: BotNameStyleConfig = this.config) {
    if (!client || !client.guilds || !client.guilds.cache) return;
    const formattedNick = this.formatFormattedNickname(config);
    const hexColor = config.primaryColor || "#38bdf8";

    for (const [, guild] of client.guilds.cache) {
      try {
        if (guild.members && guild.members.me) {
          await guild.members.me.setNickname(formattedNick).catch(() => null);
        }
        await this.syncBotNametagColor(guild, hexColor);
      } catch {
        // Graceful continuation
      }
    }
  }

  /**
   * Get history of style changes
   */
  public getHistory() {
    return [...this.history];
  }

  /**
   * Reset to defaults
   */
  public resetToDefaults() {
    return this.updateConfig(DEFAULT_BOT_NAME_STYLE);
  }
}

export const botNameStylesService = new BotNameStylesService();
