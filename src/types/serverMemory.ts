export interface ServerRoleOption {
  id: string;
  name: string;
  color: string;
}

export interface ServerMemoryRecord {
  guildId: string;
  guildName: string;
  icon: string | null;
  ownerRoleId: string | null;
  adminRoleIds: string[];
  moderatorRoleIds: string[];
  modLogChannelId: string | null;
  modLogChannelName: string;
  isSetupComplete: boolean;
  configuredAt: number;
  lastActive: number;
  configuredBy: string;
  memberCount: number;
  autoModEnabled: boolean;
  antiRaidEnabled: boolean;
  exemptChannels: string[];
  restoredFromDiskCount: number;
  version: string;
  notes?: string;
}

export interface ServerMemoryMetadata {
  storageFilePath: string;
  lastSavedAt: number;
  totalServersConfigured: number;
  totalServersRegistered: number;
  persistenceDriver: string;
  autoReloadOnBoot: boolean;
}

export interface RebootCheckResult {
  success: boolean;
  timestamp: number;
  rebootDurationMs: number;
  serversRestored: number;
  serverSummaries: {
    guildId: string;
    guildName: string;
    ownerRole: string | null;
    staffRoleCount: number;
    logChannel: string;
    setupState: "PRESERVED_ACTIVE" | "PENDING_SETUP";
    commandsUnlocked: number;
  }[];
  message: string;
}
