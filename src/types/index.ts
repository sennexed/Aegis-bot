export type ViolationCategory =
  | "NONE"
  | "CYBERBULLYING"
  | "HARASSMENT"
  | "SEXUAL_GROOMING_OR_PREDATORY"
  | "SELF_HARM"
  | "HATE_SPEECH"
  | "SEVERE_PROFANITY_OR_ABUSE"
  | "DOXXING_OR_PII";

export type ActionSeverity = "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type RecommendedAction =
  | "ALLOW"
  | "WARN"
  | "DELETE"
  | "TIMEOUT_1H"
  | "TIMEOUT_24H"
  | "BAN";

export interface AIModerationResult {
  flagged: boolean;
  category: ViolationCategory;
  severity: ActionSeverity;
  recommendedAction: RecommendedAction;
  confidence: number;
  reason: string;
  highlightedPhrases?: string[];
  ageAppropriateNotes?: string;
  source: "TIER_1_LOCAL_TRIAGE" | "GEMINI_3_8_FLASH" | "IN_MEMORY_CACHE" | "HEURISTIC_FALLBACK";
  tokensUsed: number;
  latencyMs: number;
  cacheHit?: boolean;
}

export interface GuildRoleConfig {
  ownerRoleId: string | null;
  adminRoleIds: string[];
  moderatorRoleIds: string[];
  logChannelId: string | null;
  policyPreset: "STRICT_TEEN" | "BALANCED" | "LENIENT";
  autoDeleteThreshold: "LOW" | "MEDIUM" | "HIGH";
  autoTimeoutMinutes: number;
  exemptChannelIds: string[];
}

export interface ModInfractionCase {
  id: string;
  guildId: string;
  userId: string;
  userName: string;
  moderatorId: string;
  moderatorName: string;
  action: "WARN" | "MUTE" | "KICK" | "BAN" | "AI_AUTO_ACTION";
  reason: string;
  durationMinutes?: number;
  timestamp: string;
  messageContentSnippet?: string;
}

export interface DiscordEmbedPreview {
  title: string;
  color: number;
  author?: { name: string; icon_url?: string };
  description?: string;
  fields: { name: string; value: string; inline?: boolean }[];
  footer?: { text: string };
  timestamp?: string;
}

export type ServerPowerState = "RUNNING" | "STOPPED" | "STARTING" | "RESTARTING";

export interface WispbyteMetrics {
  cpuPercent: number;
  memoryMb: number;
  memoryLimitMb: number;
  memoryPercent: number;
  diskMb: number;
  diskLimitMb: number;
  networkInboundKbps: number;
  networkOutboundKbps: number;
  discordPingMs: number;
}

export interface WispbyteBotDetails {
  name: string;
  discriminator: string;
  id: string;
  avatar: string;
  guildsCount: number;
  membersCount: number;
  channelsCount: number;
  shardsCount: number;
  policyLevel: string;
  autoRestart: boolean;
  nodeVersion: string;
  wispbyteNode: string;
  containerId: string;
  geminiModel: string;
}

export interface WispbyteStats {
  processedMessages: number;
  violationsPrevented: number;
  tokensSavedByTriage: number;
  cacheHitRatioPercent: number;
}

export interface WispbyteLogItem {
  id: string;
  timestamp: string;
  level: "DAEMON" | "INFO" | "DISCORD" | "AI_MOD" | "AUTOMOD" | "WARN" | "ERROR" | "COMMAND";
  message: string;
}

export interface TelemetryEvent {
  id: string;
  timestamp: string;
  author: string;
  avatar: string;
  content: string;
  flagged: boolean;
  category: string;
  severity: string;
  recommendedAction: string;
  reason: string;
  source: string;
  tokensUsed: number;
  latencyMs: number;
  highlightedPhrases?: string[];
}

export * from "./news";
export * from "./serverMemory";

