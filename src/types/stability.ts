export interface BotStabilityHealth {
  status: "OPTIMAL" | "DEGRADED" | "CRITICAL";
  uptimeSeconds: number;
  memoryUsageMb: number;
  memoryLimitMb: number;
  memoryHeapPercent: number;
  heartbeatLatencyMs: number;
  circuitBreakers: {
    geminiAi: "CLOSED" | "HALF_OPEN" | "OPEN";
    discordGateway: "CONNECTED" | "RECONNECTING" | "DISCONNECTED";
    rateLimiter: "NORMAL" | "THROTTLED";
  };
  cacheStats: {
    triageCacheSize: number;
    triageCacheHitRatio: number;
    guildMemorySize: number;
  };
  autoRecovery: {
    enabled: boolean;
    consecutiveFailures: number;
    lastRecoveredAt: string | null;
    autoRestartOnOOM: boolean;
  };
  diagnostics: {
    id: string;
    level: "HEALTHY" | "NOTICE" | "WARNING" | "CRITICAL";
    component: string;
    message: string;
    timestamp: string;
  }[];
}

export interface StabilityDiagnosticsReport {
  overallScore: number; // 0 - 100
  passedChecks: number;
  totalChecks: number;
  recommendations: string[];
}
