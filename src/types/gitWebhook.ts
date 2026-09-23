export interface GitCommitPayload {
  id: string;
  sha: string;
  shortSha: string;
  message: string;
  author: {
    name: string;
    email?: string;
    username: string;
    avatarUrl?: string;
  };
  timestamp: string;
  url?: string;
  added?: string[];
  removed?: string[];
  modified?: string[];
}

export interface GitPushEvent {
  ref: string;
  branch: string;
  repository: {
    name: string;
    fullName: string;
    owner: string;
    url: string;
  };
  pusher: {
    name: string;
    email?: string;
  };
  commits: GitCommitPayload[];
  headCommit: GitCommitPayload;
  sender?: {
    login: string;
    avatarUrl?: string;
  };
}

export interface GitDeploymentRecord {
  id: string;
  timestamp: string;
  branch: string;
  commitSha: string;
  commitShortSha: string;
  commitMessage: string;
  authorName: string;
  authorUsername: string;
  repository: string;
  status: "SUCCESS" | "IN_PROGRESS" | "FAILED";
  restartDurationMs: number;
  filesChangedCount: number;
  actionTaken: string;
  logs: string[];
}

export interface GitWebhookConfig {
  enabled: boolean;
  targetBranch: string; // e.g. "main" or "*"
  secretConfigured: boolean;
  webhookUrl: string;
  autoPullChanges: boolean;
  zeroDowntimeReload: boolean;
  notifyDiscordChannel: boolean;
  notifyChannelName: string;
}

export interface GitWebhookStatusResponse {
  config: GitWebhookConfig;
  totalPushesReceived: number;
  totalAutoRestarts: number;
  lastRestartAt: string | null;
  lastCommit: GitCommitPayload | null;
  isRestarting: boolean;
  history: GitDeploymentRecord[];
}
