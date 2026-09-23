import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Server,
  Terminal,
  Activity,
  Cpu,
  HardDrive,
  Wifi,
  Sliders,
  UploadCloud,
  ShieldCheck,
  Check,
  RotateCw,
  Sparkles,
  Zap,
  ExternalLink,
  AlertCircle,
  Code2,
} from "lucide-react";
import {
  ServerPowerState,
  WispbyteMetrics,
  WispbyteBotDetails,
  WispbyteStats,
  WispbyteLogItem,
} from "../../types";
import { ServerPowerCard } from "./ServerPowerCard";
import { LiveResourceGauges } from "./LiveResourceGauges";
import { InteractiveTerminal } from "./InteractiveTerminal";
import { DiscordBotTelemetry, TelemetryEvent } from "./DiscordBotTelemetry";
import { StartupConfigModal } from "./StartupConfigModal";
import { QuickDeployModal } from "./QuickDeployModal";
import { BotStabilityPanel } from "./BotStabilityPanel";
import { GitHubAutoDeployFeature } from "../GitHubAutoDeployFeature";
import { WispbyteApiExplorer } from "./WispbyteApiExplorer";
import { SystemHealthWidget } from "./SystemHealthWidget";

export const WispbyteDashboard: React.FC = () => {
  // Server State
  const [powerState, setPowerState] = useState<ServerPowerState>("RUNNING");
  const [uptimeSeconds, setUptimeSeconds] = useState<number>(398420);
  const [historyCpu, setHistoryCpu] = useState<number[]>([
    9.2, 10.4, 8.8, 12.1, 9.7, 8.4, 11.2, 14.5, 10.1, 9.4, 8.9, 11.0, 9.6, 12.4, 9.8,
  ]);

  const [metrics, setMetrics] = useState<WispbyteMetrics>({
    cpuPercent: 9.8,
    memoryMb: 174,
    memoryLimitMb: 512,
    memoryPercent: 34.0,
    diskMb: 48,
    diskLimitMb: 1024,
    networkInboundKbps: 124,
    networkOutboundKbps: 52,
    discordPingMs: 24,
  });

  const [botDetails, setBotDetails] = useState<WispbyteBotDetails>({
    name: "AegisMod",
    discriminator: "4419",
    id: "124892849204918294",
    avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&q=80",
    guildsCount: 14,
    membersCount: 3420,
    channelsCount: 86,
    shardsCount: 1,
    policyLevel: "STRICT_TEEN",
    autoRestart: true,
    nodeVersion: "Node.js v20.18.0 LTS",
    wispbyteNode: "wisp-sg-node01.wispbyte.net (SG-1)",
    containerId: "c8f2a1b9-7b3c",
    geminiModel: "Gemini 3.8 Flash",
    port: 10734,
    subdomain: "aegisbot.wispbyte.app",
    webpageUrl: "https://aegisbot.wispbyte.app/",
    allocation: "aegisbot.wispbyte.app:10734",
  });

  const [stats, setStats] = useState<WispbyteStats>({
    processedMessages: 14892,
    violationsPrevented: 437,
    tokensSavedByTriage: 349120,
    cacheHitRatioPercent: 88.4,
  });

  const [logs, setLogs] = useState<WispbyteLogItem[]>([]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [activeSubTab, setActiveSubTab] = useState<"console" | "guilds" | "stability" | "git" | "api" | "guide">("console");

  // Modals
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isDeployOpen, setIsDeployOpen] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Moderation events (fully synced with backend /api/wispbyte/events)
  const [telemetryEvents, setTelemetryEvents] = useState<TelemetryEvent[]>([]);

  // Audio synthesize function for tactile UX (zero external audio files)
  const playSound = (freq = 440, type: OscillatorType = "sine", duration = 0.08) => {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // AudioContext unavailable or blocked
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Poll server status
  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/wispbyte/status");
      if (!res.ok) return;
      const data = await res.json();
      setPowerState(data.serverStatus);
      if (data.uptimeSeconds !== null) setUptimeSeconds(data.uptimeSeconds);
      if (data.metrics) {
        setMetrics(data.metrics);
        setHistoryCpu((prev) => [...prev.slice(1), data.metrics.cpuPercent]);
      }
      if (data.botDetails) setBotDetails(data.botDetails);
      if (data.stats) setStats(data.stats);
    } catch (err) {
      // ignore transient poll failure
    }
  };

  // Poll server logs
  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/wispbyte/logs");
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.logs)) {
        setLogs(data.logs);
      }
    } catch (err) {
      // ignore
    }
  };

  // Poll server telemetry events
  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/wispbyte/events");
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.events)) {
        setTelemetryEvents(data.events);
      }
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchLogs();
    fetchEvents();
    const interval = setInterval(() => {
      fetchStatus();
      fetchLogs();
      fetchEvents();
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  // Handle Power Action
  const handlePowerAction = async (action: "start" | "stop" | "restart" | "kill") => {
    playSound(action === "start" ? 600 : action === "restart" ? 520 : 320, "triangle", 0.12);
    try {
      const res = await fetch("/api/wispbyte/power", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.serverStatus) {
        setPowerState(data.serverStatus);
      }
      showToast(`Server action '${action.toUpperCase()}' dispatched.`);
      await fetchLogs();
      await fetchStatus();
    } catch (err: any) {
      showToast(`Action failed: ${err.message}`);
    }
  };

  // Handle Command Submission
  const handleSendCommand = async (command: string) => {
    playSound(700, "sine", 0.06);
    try {
      const res = await fetch("/api/wispbyte/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command }),
      });
      const data = await res.json();
      await fetchLogs();
      await fetchStatus();
      return data.output;
    } catch (err: any) {
      showToast(`Command error: ${err.message}`);
    }
  };

  // Handle Config Save
  const handleSaveConfig = async (cfg: {
    policy: string;
    ramMb: number;
    autoRestart: boolean;
    botToken: string;
    geminiKey: string;
  }) => {
    playSound(880, "sine", 0.1);
    const res = await fetch("/api/wispbyte/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cfg),
    });
    const data = await res.json();
    setBotDetails((prev) => ({
      ...prev,
      policyLevel: data.policy || prev.policyLevel,
      autoRestart: data.autoRestart ?? prev.autoRestart,
    }));
    setMetrics((prev) => ({
      ...prev,
      memoryLimitMb: data.ramMb || prev.memoryLimitMb,
    }));
    showToast("Wispbyte environment configuration applied!");
    await fetchLogs();
    await fetchStatus();
  };

  // Handle Test Message Intercept
  const handleTestMessage = async (content: string, author = "TeenUser#1234") => {
    playSound(620, "triangle", 0.08);
    try {
      const res = await fetch("/api/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, author }),
      });
      const result = await res.json();

      const newEvent: TelemetryEvent = {
        id: "evt-" + Date.now(),
        timestamp: "Just now",
        author,
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=64&q=80",
        content,
        flagged: result.flagged,
        category: result.category,
        severity: result.severity,
        recommendedAction: result.recommendedAction,
        reason: result.reason,
        source: result.source,
        tokensUsed: result.tokensUsed,
        latencyMs: result.latencyMs,
        highlightedPhrases: result.highlightedPhrases,
      };

      setTelemetryEvents((prev) => [newEvent, ...prev.slice(0, 19)]);
      showToast(
        result.flagged
          ? `Intercepted: ${result.category} (${result.recommendedAction})`
          : "Message verified safe by AegisMod!"
      );

      // Refresh console logs, telemetry events, and server status
      await fetchEvents();
      await fetchLogs();
      await fetchStatus();
    } catch (err: any) {
      showToast(`Evaluation error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-5 right-5 z-50 px-4 py-2.5 rounded-2xl bg-zinc-900 text-white text-xs font-semibold shadow-xl border border-zinc-700 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Master Server Power Card */}
      <ServerPowerCard
        powerState={powerState}
        uptimeSeconds={uptimeSeconds}
        botDetails={botDetails}
        onPowerAction={handlePowerAction}
        onOpenConfig={() => setIsConfigOpen(true)}
        onOpenDeployModal={() => setIsDeployOpen(true)}
        onOpenSimulationModal={() => {
          setActiveSubTab("guilds");
        }}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
      />

      {/* 2. Live Resource Gauges */}
      <LiveResourceGauges
        metrics={metrics}
        stats={stats}
        historyCpu={historyCpu}
        serverRunning={powerState === "RUNNING"}
      />

      {/* 2.5 Real-Time D3 System Health & Low-Overhead Telemetry */}
      <SystemHealthWidget />

      {/* 3. Sub-navigation tabs inside Wispbyte Dashboard */}
      <div className="flex items-center justify-between border-b border-zinc-200 pb-2 flex-wrap gap-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveSubTab("console")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === "console"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                : "bg-white text-zinc-600 hover:text-zinc-900 border border-zinc-200"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Pterodactyl Console</span>
          </button>

          <button
            onClick={() => setActiveSubTab("guilds")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === "guilds"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                : "bg-white text-zinc-600 hover:text-zinc-900 border border-zinc-200"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Discord Telemetry & Safety Feed</span>
          </button>

          <button
            onClick={() => setActiveSubTab("stability")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === "stability"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                : "bg-white text-zinc-600 hover:text-zinc-900 border border-zinc-200"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Bot Stability & Self-Healing</span>
          </button>

          <button
            onClick={() => setActiveSubTab("git")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === "git"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                : "bg-white text-zinc-600 hover:text-zinc-900 border border-zinc-200"
            }`}
          >
            <RotateCw className="w-3.5 h-3.5 text-indigo-500" />
            <span>GitHub CI/CD & Auto-Restart</span>
          </button>

          <button
            onClick={() => setActiveSubTab("api")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === "api"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                : "bg-white text-zinc-600 hover:text-zinc-900 border border-zinc-200"
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-indigo-500" />
            <span>Wispbyte API Explorer</span>
          </button>

          <button
            onClick={() => setActiveSubTab("guide")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === "guide"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                : "bg-white text-zinc-600 hover:text-zinc-900 border border-zinc-200"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Deploy Guide</span>
          </button>
        </div>

        <button
          onClick={() => setIsDeployOpen(true)}
          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span>Deploy to Wispbyte</span>
        </button>
      </div>

      {/* 4. Sub-Tab Content Views with Animated Transitions */}
      <AnimatePresence mode="wait">
        {activeSubTab === "console" && (
          <motion.div
            key="console"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <InteractiveTerminal
              logs={logs}
              serverRunning={powerState === "RUNNING"}
              onSendCommand={handleSendCommand}
              onClearLogs={() => setLogs([])}
            />
          </motion.div>
        )}

        {activeSubTab === "guilds" && (
          <motion.div
            key="guilds"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <DiscordBotTelemetry
              botDetails={botDetails}
              events={telemetryEvents}
              onTestMessage={handleTestMessage}
            />
          </motion.div>
        )}

        {activeSubTab === "stability" && (
          <motion.div
            key="stability"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <BotStabilityPanel />
          </motion.div>
        )}

        {activeSubTab === "git" && (
          <motion.div
            key="git"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <GitHubAutoDeployFeature />
          </motion.div>
        )}

        {activeSubTab === "api" && (
          <motion.div
            key="api"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <WispbyteApiExplorer />
          </motion.div>
        )}

        {activeSubTab === "guide" && (
          <motion.div
            key="guide"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
              <div>
                <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                  <Server className="w-5 h-5 text-indigo-600" />
                  Wispbyte 24/7 Hosting Quick Steps
                </h3>
                <p className="text-xs text-zinc-500">
                  Deploy AegisMod to Wispbyte Pterodactyl Node.js in 5 minutes.
                </p>
              </div>
              <button
                onClick={() => setIsDeployOpen(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Simulate 24/7 Deploy</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/50">
                <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-[10px]">
                  STEP 1
                </span>
                <h4 className="font-bold text-zinc-900 mt-2">Pterodactyl Egg Selection</h4>
                <p className="text-zinc-600 mt-1">
                  In Wispbyte panel, select Node.js 20 or Node.js 22 official Egg. 256MB to 512MB RAM is sufficient.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/50">
                <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-[10px]">
                  STEP 2
                </span>
                <h4 className="font-bold text-zinc-900 mt-2">Network & Web Allocation</h4>
                <p className="text-zinc-600 mt-1">
                  Assign port <code className="bg-white px-1 rounded font-mono font-bold text-indigo-600">10734</code> and bind subdomain <code className="bg-white px-1 rounded font-mono font-bold text-indigo-600">aegisbot.wispbyte.app/</code> in the Wispbyte Network tab.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/50">
                <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-[10px]">
                  STEP 3
                </span>
                <h4 className="font-bold text-zinc-900 mt-2">Startup & Verify</h4>
                <p className="text-zinc-600 mt-1">
                  Configure <code className="bg-white px-1 rounded font-mono">DISCORD_BOT_TOKEN</code> in Startup, click Start, and run <code className="bg-white px-1 rounded font-mono font-bold">/setup</code> in your server!
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Startup Config Modal */}
      <StartupConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        currentPolicy={botDetails.policyLevel}
        currentRam={metrics.memoryLimitMb}
        autoRestart={botDetails.autoRestart}
        onSave={handleSaveConfig}
      />

      {/* Quick Deploy Modal */}
      <QuickDeployModal
        isOpen={isDeployOpen}
        onClose={() => setIsDeployOpen(false)}
        onDeployComplete={() => {
          showToast("Deployment verified! AegisMod is running on Wispbyte.");
          setIsDeployOpen(false);
          fetchLogs();
        }}
      />
    </div>
  );
};
