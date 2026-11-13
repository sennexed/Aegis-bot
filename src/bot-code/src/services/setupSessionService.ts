/**
 * Setup Session Service
 * Manages temporary interactive setup sessions for the single-message configuration wizard.
 */

export interface SetupDraft {
  guildId: string;
  guildName: string;
  adminUserId: string;
  adminUsername: string;
  currentTab: "home" | "permissions" | "moderation" | "logging" | "features";
  
  // Roles
  ownerRoleId: string | null;
  adminRoleIds: string[];
  moderatorRoleIds: string[];
  supportRoleIds: string[];
  securityRoleIds: string[];

  // Moderation Modules (enabled/disabled)
  modules: {
    traditionalMod: boolean;
    aiModeration: boolean;
    autoMod: boolean;
    antiSpam: boolean;
    antiLink: boolean;
    antiRaid: boolean;
    phishingProtection: boolean;
    multilingualBlacklist: boolean;
    strikeEscalation: boolean;
  };

  // Logging Channels
  loggingChannels: {
    modLogs: string | null;
    securityLogs: string | null;
    deletedLogs: string | null;
    aiLogs: string | null;
    staffLogs: string | null;
    incidentReports: string | null;
  };

  // Additional Features
  features: {
    staffDuty: boolean;
    anonymousModmail: boolean;
    userVerification: boolean;
    userPassport: boolean;
    trustScore: boolean;
    appealsSystem: boolean;
    autoNews: boolean;
  };

  createdAt: number;
  expiresAt: number;
}

export class SetupSessionService {
  private sessions = new Map<string, SetupDraft>(); // guildId -> draft

  public createSession(guildId: string, guildName: string, adminUserId: string, adminUsername: string): SetupDraft {
    const draft: SetupDraft = {
      guildId,
      guildName,
      adminUserId,
      adminUsername,
      currentTab: "home",
      ownerRoleId: null,
      adminRoleIds: [],
      moderatorRoleIds: [],
      supportRoleIds: [],
      securityRoleIds: [],
      modules: {
        traditionalMod: true,
        aiModeration: true,
        autoMod: true,
        antiSpam: true,
        antiLink: true,
        antiRaid: true,
        phishingProtection: true,
        multilingualBlacklist: true,
        strikeEscalation: true,
      },
      loggingChannels: {
        modLogs: null,
        securityLogs: null,
        deletedLogs: null,
        aiLogs: null,
        staffLogs: null,
        incidentReports: null,
      },
      features: {
        staffDuty: true,
        anonymousModmail: true,
        userVerification: true,
        userPassport: true,
        trustScore: true,
        appealsSystem: true,
        autoNews: true,
      },
      createdAt: Date.now(),
      expiresAt: Date.now() + 15 * 60 * 1000, // 15 mins expiry
    };

    this.sessions.set(guildId, draft);
    return draft;
  }

  public getSession(guildId: string): SetupDraft | undefined {
    const draft = this.sessions.get(guildId);
    if (!draft) return undefined;
    if (Date.now() > draft.expiresAt) {
      this.sessions.delete(guildId);
      return undefined;
    }
    return draft;
  }

  public removeSession(guildId: string): void {
    this.sessions.delete(guildId);
  }
}

export const setupSessionService = new SetupSessionService();
