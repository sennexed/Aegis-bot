/**
 * Channel-Specific Safety Sensitivity Profiles Service
 * Allows servers to tailor moderation strictness per channel
 * (e.g. Strict in #general, relaxed in #gaming-chat, compassionate in #support, parliament announcements).
 * 
 * Includes persistent disk storage so channel settings survive bot restarts.
 */

import fs from "fs";
import path from "path";
import { getPersistentDataDir } from "../utils/storagePath.js";

export type ChannelPolicyProfile = "STRICT_TEEN" | "GAMING_BANTER" | "CRISIS_SUPPORT" | "MEDIA_ONLY" | "PARLIAMENT_ANNOUNCEMENTS";

export interface ChannelPolicyConfig {
  profile: ChannelPolicyProfile;
  allowMildBanter: boolean;
  blockAllProfanity: boolean;
  priorityHelplineResponse: boolean;
  requireImageScreening: boolean;
  announcementWhitelist?: boolean;
}

export const POLICY_DEFINITIONS: Record<ChannelPolicyProfile, ChannelPolicyConfig> = {
  STRICT_TEEN: {
    profile: "STRICT_TEEN",
    allowMildBanter: false,
    blockAllProfanity: true,
    priorityHelplineResponse: true,
    requireImageScreening: true,
  },
  GAMING_BANTER: {
    profile: "GAMING_BANTER",
    allowMildBanter: true,
    blockAllProfanity: false, // allows gaming trash-talk, still blocks slurs & predatory
    priorityHelplineResponse: false,
    requireImageScreening: false,
  },
  CRISIS_SUPPORT: {
    profile: "CRISIS_SUPPORT",
    allowMildBanter: false,
    blockAllProfanity: false,
    priorityHelplineResponse: true, // triggers supportive helpline links instead of punitive timeouts
    requireImageScreening: false,
  },
  MEDIA_ONLY: {
    profile: "MEDIA_ONLY",
    allowMildBanter: false,
    blockAllProfanity: true,
    priorityHelplineResponse: false,
    requireImageScreening: true,
  },
  PARLIAMENT_ANNOUNCEMENTS: {
    profile: "PARLIAMENT_ANNOUNCEMENTS",
    allowMildBanter: true,
    blockAllProfanity: false,
    priorityHelplineResponse: false,
    requireImageScreening: false,
    announcementWhitelist: true,
  },
};

export class ChannelPolicyService {
  // channelId -> ChannelPolicyProfile
  private channelProfiles = new Map<string, ChannelPolicyProfile>();
  private storageFilePath: string;
  private isSaving = false;
  private needsSave = false;

  constructor(customStorageDir?: string) {
    const dataDir = customStorageDir || getPersistentDataDir();
    this.storageFilePath = path.join(dataDir, "channel_policies.json");
    this.loadFromDisk();
  }

  private loadFromDisk(): void {
    try {
      if (fs.existsSync(this.storageFilePath)) {
        const raw = fs.readFileSync(this.storageFilePath, "utf8");
        if (raw && raw.trim()) {
          const parsed: Record<string, ChannelPolicyProfile> = JSON.parse(raw);
          for (const [channelId, profile] of Object.entries(parsed)) {
            if (POLICY_DEFINITIONS[profile]) {
              this.channelProfiles.set(channelId, profile);
            }
          }
        }
      }
    } catch (err) {
      console.warn("[ChannelPolicy] Warning: Could not load channel_policies.json:", err);
    }
  }

  private persistToDisk(): void {
    try {
      const dataObj: Record<string, ChannelPolicyProfile> = {};
      this.channelProfiles.forEach((profile, channelId) => {
        dataObj[channelId] = profile;
      });

      const dir = path.dirname(this.storageFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(this.storageFilePath, JSON.stringify(dataObj, null, 2), "utf8");
    } catch (err) {
      console.error("[ChannelPolicy] Failed to write channel_policies.json to disk:", err);
    }
  }

  public setChannelPolicy(channelId: string, profile: ChannelPolicyProfile): void {
    this.channelProfiles.set(channelId, profile);
    this.persistToDisk();
  }

  public getChannelPolicy(channelId: string): ChannelPolicyConfig {
    const profile = this.channelProfiles.get(channelId) || "STRICT_TEEN";
    return POLICY_DEFINITIONS[profile];
  }

  public getAllPolicies(): Map<string, ChannelPolicyProfile> {
    return this.channelProfiles;
  }
}
