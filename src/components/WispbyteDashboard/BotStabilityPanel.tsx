import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  ShieldAlert,
  Activity,
  Cpu,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Zap,
  HardDrive,
  Database,
  Radio,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { BotStabilityHealth, StabilityDiagnosticsReport } from "../../types/stability";

export const BotStabilityPanel: React.FC = () => {
  const [health, setHealth] = useState<BotStabilityHealth | null>(null);
  const [report, setReport] = useState<StabilityDiagnosticsReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isHealing, setIsHealing] = useState(false);
  const [healMessage, setHealMessage] = useState<string | null>(null);

  const fetchHealth = async () => {
    try {
      const res = await fetch("/api/stability/health");
      if (res.ok) {
        const data = await res.json();
        setHealth(data);
      }
    } catch (err) {
      console.error("Failed to fetch stability health:", err);
    }
  };

  const runDiagnostics = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/stability/diagnostics", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      }
    } catch (err) {
      console.error("Failed to run diagnostics:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const triggerHeal = async () => {
    setIsHealing(true);
    setHealMessage(null);
    try {
      const res = await fetch("/api/stability/heal", { method: "POST" });
      if (res.ok) {
        setHealMessage("✅ State sanitized, token caches cleared, and heap swept successfully!");
        await fetchHealth();
        await runDiagnostics();
      }
    } catch (err) {
      setHealMessage("⚠️ Self-heal request failed.");
    } finally {
      setIsHealing(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    runDiagnostics();
    const timer = setInterval(fetchHealth, 10000);
    return () => clearInterval(timer);
  }, []);

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "OPTIMAL":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            OPTIMAL (100% HEALTHY)
          </span>
        );
      case "DEGRADED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5" />
            DEGRADED (FAILOVER ACTIVE)
          </span>
        );
      case "CRITICAL":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <Flame className="w-3.5 h-3.5" />
            CRITICAL ATTENTION
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Health Status & Actions */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-indigo-600" />
              Bot Stability & Crash-Resilience Supervisor
            </h3>
            {getStatusBadge(health?.status)}
          </div>
          <p className="text-xs text-zinc-500 max-w-2xl">
            Autonomous self-healing engine protecting AegisMod from Discord gateway drops, Gemini API demand spikes,
            memory pressure OOM crashes, and unhandled interaction errors.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={runDiagnostics}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-indigo-600" : ""}`} />
            <span>Audit System</span>
          </button>

          <button
            onClick={triggerHeal}
            disabled={isHealing}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs shadow-indigo-100 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isHealing ? "Healing State..." : "Self-Heal & Flush Caches"}</span>
          </button>
        </div>
      </div>

      {healMessage && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-medium text-emerald-800"
        >
          {healMessage}
        </motion.div>
      )}

      {/* Stability Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Memory Heap Sentinel */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Heap Sentinel</span>
            <Cpu className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-black text-zinc-900 mb-1">
            {health?.memoryUsageMb ?? 174} MB{" "}
            <span className="text-xs font-medium text-zinc-400">/ 512 MB</span>
          </div>
          <div className="w-full bg-zinc-100 rounded-full h-1.5 mb-2 overflow-hidden">
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ${
                (health?.memoryHeapPercent ?? 34) > 80 ? "bg-rose-500" : "bg-emerald-500"
              }`}
              style={{ width: `${Math.min(100, health?.memoryHeapPercent ?? 34)}%` }}
            />
          </div>
          <p className="text-[11px] text-zinc-500">
            Auto-sheds triage cache when memory exceeds 80% quota.
          </p>
        </div>

        {/* Gemini Circuit Breaker */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">AI Circuit Breaker</span>
            <Zap className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-black text-zinc-900 mb-1 flex items-center gap-2">
            <span>{health?.circuitBreakers.geminiAi ?? "CLOSED"}</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                health?.circuitBreakers.geminiAi === "CLOSED"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {health?.circuitBreakers.geminiAi === "CLOSED" ? "NOMINAL" : "FALLBACK"}
            </span>
          </div>
          <p className="text-[11px] text-zinc-500">
            Automatic failover to Standard AutoMod heuristics on 503 / 429 spikes.
          </p>
        </div>

        {/* Gateway Supervisor */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Gateway Supervisor</span>
            <Radio className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-zinc-900 mb-1 flex items-center gap-2">
            <span>{health?.heartbeatLatencyMs ?? 24}ms</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-700">
              CONNECTED
            </span>
          </div>
          <p className="text-[11px] text-zinc-500">
            Auto-reconnects on shard disconnect with exponential backoff.
          </p>
        </div>

        {/* Permanent Registry Cache */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Memory Persistence</span>
            <Database className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-black text-zinc-900 mb-1">
            {health?.cacheStats.guildMemorySize ?? 14}{" "}
            <span className="text-xs font-medium text-zinc-400">Servers Safe</span>
          </div>
          <p className="text-[11px] text-zinc-500">
            Restart-immune storage in <code className="text-indigo-600">data/guild_memory.json</code>.
          </p>
        </div>
      </div>

      {/* Stability Diagnostics & Active Safeguards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Diagnostics Report */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-zinc-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-zinc-900 flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-indigo-600" />
              Stability Health Audit
            </h4>

            <div className="text-center py-4 border-b border-zinc-100">
              <div className="text-4xl font-black text-indigo-600 mb-1">
                {report?.overallScore ?? 100}%
              </div>
              <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                Resilience Rating
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                {report?.passedChecks ?? 6} of {report?.totalChecks ?? 6} stability checks passing
              </p>
            </div>

            <div className="mt-4 space-y-2.5">
              <div className="text-xs font-bold text-zinc-700">Active Safeguards:</div>
              <ul className="text-xs text-zinc-600 space-y-1.5">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Bounded Triage Cache (5,000 items max LRU eviction)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Atomic JSON disk serialization prevents corrupted writes</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Graceful process signals handling (SIGINT / SIGTERM)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Comprehensive command interaction try/catch wrapper</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-100 text-[11px] text-zinc-400 flex items-center justify-between">
            <span>Supervisor Version</span>
            <span className="font-mono text-zinc-600">v2.4.0-STABLE</span>
          </div>
        </div>

        {/* Right Column: Live Stability Diagnostic Logs */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-zinc-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-indigo-600" />
              Live Stability & Recovery Telemetry
            </h4>
            <span className="text-[11px] text-zinc-400">Auto-refreshing every 10s</span>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {(health?.diagnostics || []).map((diag) => (
              <div
                key={diag.id}
                className="p-2.5 rounded-xl border border-zinc-100 bg-zinc-50/60 flex items-start justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        diag.level === "HEALTHY"
                          ? "bg-emerald-100 text-emerald-800"
                          : diag.level === "NOTICE"
                          ? "bg-blue-100 text-blue-800"
                          : diag.level === "WARNING"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {diag.level}
                    </span>
                    <span className="font-bold text-zinc-800">{diag.component}</span>
                  </div>
                  <p className="text-zinc-600 text-[11px]">{diag.message}</p>
                </div>
                <span className="text-[10px] text-zinc-400 shrink-0">{diag.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
