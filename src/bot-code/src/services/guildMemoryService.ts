/**
 * Guild Memory Service (Bot Core Engine)
 * 
 * Manages the permanent disk memory of configured Discord servers.
 * When the bot crashes or restarts, it reads guild_memory.json so that
 * no server ever has to re-run /setup or re-configure their staff roles or #mod-logs.
 */

import fs from "fs";
import path from "path";
import { ServerMemoryRecord } from "../types/serverMemory.js";

export class GuildMemoryService {
  private servers = new Map<string, ServerMemoryRecord>();
  private dataDir = path.join(process.cwd(), "data");
  private storageFilePath = path.join(this.dataDir, "guild_memory.json");
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
        const parsed: Record<string, ServerMemoryRecord> = JSON.parse(raw);
        for (const [id, rec] of Object.entries(parsed)) {
          this.servers.set(id, rec);
        }
        console.log(`[AegisMod Memory] 💾 Loaded ${this.servers.size} configured servers from permanent disk storage.`);
      }
    } catch (err) {
      console.warn("[AegisMod Memory] Warning: could not load guild_memory.json from disk:", err);
    }
  }

  private async persistToDisk(): Promise<void> {
    this.writeQueue = this.writeQueue
      .then(async () => {
        if (!fs.existsSync(this.dataDir)) {
          await fs.promises.mkdir(this.dataDir, { recursive: true });
        }
        const dataObj: Record<string, ServerMemoryRecord> = {};
        this.servers.forEach((val, key) => {
          dataObj[key] = val;
        });
        const tempPath = `${this.storageFilePath}.tmp`;
        await fs.promises.writeFile(tempPath, JSON.stringify(dataObj, null, 2), "utf8");
        await fs.promises.rename(tempPath, this.storageFilePath);
      })
      .catch((err) => {
        console.error("[AegisMod Memory] Failed to persist guild memory to disk:", err);
      });
    return this.writeQueue;
  }

  public isServerSetup(guildId: string): boolean {
    const s = this.servers.get(guildId);
    return !!(s && s.isSetupComplete);
  }

  public getServer(guildId: string): ServerMemoryRecord | undefined {
    return this.servers.get(guildId);
  }

  public getAllServers(): ServerMemoryRecord[] {
    return Array.from(this.servers.values());
  }

  public async saveServerSetup(
    guildId: string,
    guildName: string,
    ownerRoleId: string | null,
    adminRoleIds: string[],
    moderatorRoleIds: string[],
    modLogChannelId: string | null = null,
    modLogChannelName: string = "mod-logs"
  ): Promise<ServerMemoryRecord> {
    const existing = this.servers.get(guildId);

    const record: ServerMemoryRecord = {
      guildId,
      guildName: guildName || existing?.guildName || `Server (${guildId})`,
      icon: existing?.icon || null,
      ownerRoleId,
      adminRoleIds,
      moderatorRoleIds,
      modLogChannelId: modLogChannelId || existing?.modLogChannelId || null,
      modLogChannelName: modLogChannelName || existing?.modLogChannelName || "mod-logs",
      isSetupComplete: true,
      configuredAt: existing?.configuredAt && existing.configuredAt > 0 ? existing.configuredAt : Date.now(),
      lastActive: Date.now(),
      configuredBy: existing?.configuredBy || "Discord Admin",
      memberCount: existing?.memberCount || 100,
      autoModEnabled: true,
      antiRaidEnabled: true,
      exemptChannels: existing?.exemptChannels || [],
      restoredFromDiskCount: (existing?.restoredFromDiskCount || 0),
      version: "2.4.0",
      notes: "Saved to persistent disk storage. Immune to bot restarts.",
    };

    this.servers.set(guildId, record);
    await this.persistToDisk();
    console.log(`[AegisMod Memory] 💾 Committed setup memory for '${guildName}' (${guildId}) to permanent disk.`);
    return record;
  }

  public async updateLogChannel(guildId: string, channelId: string, channelName: string = "mod-logs"): Promise<void> {
    const s = this.servers.get(guildId);
    if (s) {
      s.modLogChannelId = channelId;
      s.modLogChannelName = channelName;
      s.lastActive = Date.now();
      await this.persistToDisk();
    }
  }
}

export const guildMemoryService = new GuildMemoryService();
