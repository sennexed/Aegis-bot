/**
 * Channel-Specific Safety Sensitivity Profiles Service
 * Allows servers to tailor moderation strictness per channel
 * (e.g. Strict in #general, relaxed in #gaming-chat, compassionate in #support).
 */

export type ChannelPolicyProfile = "STRICT_TEEN" | "GAMING_BANTER" | "CRISIS_SUPPORT" | "MEDIA_ONLY";

export interface ChannelPolicyConfig {
  profile: ChannelPolicyProfile;
  allowMildBanter: boolean;
  blockAllProfanity: boolean;
  priorityHelplineResponse: boolean;
  requireImageScreening: boolean;
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
};

export class ChannelPolicyService {
  // channelId -> ChannelPolicyProfile
  private channelProfiles = new Map<string, ChannelPolicyProfile>();

  public setChannelPolicy(channelId: string, profile: ChannelPolicyProfile): void {
    this.channelProfiles.set(channelId, profile);
  }

  public getChannelPolicy(channelId: string): ChannelPolicyConfig {
    const profile = this.channelProfiles.get(channelId) || "STRICT_TEEN";
    return POLICY_DEFINITIONS[profile];
  }

  public getAllPolicies(): Map<string, ChannelPolicyProfile> {
    return this.channelProfiles;
  }
}
