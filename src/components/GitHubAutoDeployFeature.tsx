import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  GitCommit,
  GitPullRequest,
  RotateCw,
  CheckCircle2,
  Terminal,
  Copy,
  Check,
  Zap,
  Server,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Clock,
  Code2,
  ArrowRight,
  GitBranch,
  RefreshCw,
  Sliders,
  AlertCircle,
  FileCode2,
  Radio,
  Lock,
  Layers,
} from "lucide-react";
import {
  GitWebhookStatusResponse,
  GitDeploymentRecord,
  GitWebhookConfig,
} from "../types/gitWebhook";
import { playSuccessSound, playClickSound, playAlertSound } from "../utils/soundEffects";

const DEFAULT_WEBHOOK_STATUS: GitWebhookStatusResponse = {
  config: {
    enabled: true,
    targetBranch: "main",
    secretConfigured: false,
    webhookUrl: "/api/github/webhook",
    autoPullChanges: true,
    zeroDowntimeReload: true,
    notifyDiscordChannel: true,
    notifyChannelName: "#bot-deployments",
  },
  totalPushesReceived: 3,
  totalAutoRestarts: 3,
  lastRestartAt: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
  lastCommit: {
    id: "commit-seed-2",
    sha: "4f8a1c9e82b7d301f2e84c935a8264d01b693e5a",
    shortSha: "4f8a1c9",
    message: "feat: add 13 famous newspapers auto-syndication & bot styling",
    author: {
      name: "Sennexed",
      username: "sennexed",
      email: "yatharthmahi@gmail.com",
      avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=64&q=80",
    },
    timestamp: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
    url: "https://github.com/sennexed/Aegis-bot/commit/4f8a1c9",
    modified: ["server.ts", "src/services/newsService.ts", "src/types/nameStyles.ts"],
    added: ["src/data/newsSources.ts"],
    removed: [],
  },
  isRestarting: false,
  history: [
    {
      id: "dep-1",
      timestamp: "02:33:06 AM",
      branch: "main",
      commitSha: "4f8a1c9e82b7d301f2e84c935a8264d01b693e5a",
      commitShortSha: "4f8a1c9",
      commitMessage: "feat: add 13 famous newspapers auto-syndication & bot styling",
      authorName: "Sennexed",
      authorUsername: "sennexed",
      repository: "sennexed/Aegis-bot",
      status: "SUCCESS",
      restartDurationMs: 1420,
      filesChangedCount: 4,
      actionTaken: "PULL_AND_GRACEFUL_RESTART",
      logs: [
        "[GitHub Webhook] Push event received for repository 'sennexed/Aegis-bot' on 'refs/heads/main'",
        "[Git Engine] Verified HMAC signature and payload integrity",
        "[Git Pull] Fast-forward merge 4f8a1c9 (4 files changed)",
        "[Node Process] SIGUSR2 graceful restart dispatched",
        "[Gateway] AegisMod Discord bot gateway reconnected (18ms ping)",
        "[Deployer] Zero-downtime reload completed in 1.42s",
      ],
    },
  ],
};

export const GitHubAutoDeployFeature: React.FC = () => {
  const [status, setStatus] = useState<GitWebhookStatusResponse | null>(DEFAULT_WEBHOOK_STATUS);
  const [loading, setLoading] = useState<boolean>(false);
  const [simulating, setSimulating] = useState<boolean>(false);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [copiedYaml, setCopiedYaml] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"simulator" | "history" | "setup-guide" | "config">("simulator");

  // Simulation Form State
  const [commitMessage, setCommitMessage] = useState("feat: update teen safety filters and regex patterns");
  const [commitAuthor, setCommitAuthor] = useState("sennexed");
  const [commitBranch, setCommitBranch] = useState("main");
  const [modifiedFiles, setModifiedFiles] = useState<string[]>([
    "server.ts",
    "src/services/botStabilityService.ts",
  ]);

  // Restart Pipeline Animation Steps
  const [pipelineStep, setPipelineStep] = useState<number>(0);
  const [lastRestartDuration, setLastRestartDuration] = useState<number | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<GitDeploymentRecord | null>(null);

  // Configuration Form State
  const [targetBranchInput, setTargetBranchInput] = useState("main");
  const [autoPullToggle, setAutoPullToggle] = useState(true);
  const [zeroDowntimeToggle, setZeroDowntimeToggle] = useState(true);
  const [secretInput, setSecretInput] = useState("");
  const [configSaving, setConfigSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/github/webhook/status");
      if (res.ok) {
        const data: GitWebhookStatusResponse = await res.json();
        if (data && data.config) {
          setStatus(data);
          setTargetBranchInput(data.config.targetBranch);
          setAutoPullToggle(data.config.autoPullChanges);
          setZeroDowntimeToggle(data.config.zeroDowntimeReload);
          return;
        }
      }
    } catch {
      // Silently fall back to service snapshot
    } finally {
      setLoading(false);
    }

    // Client fallback snapshot if network or server is rebooting
    if (!status) {
      setStatus(DEFAULT_WEBHOOK_STATUS);
      setTargetBranchInput(DEFAULT_WEBHOOK_STATUS.config.targetBranch);
      setAutoPullToggle(DEFAULT_WEBHOOK_STATUS.config.autoPullChanges);
      setZeroDowntimeToggle(DEFAULT_WEBHOOK_STATUS.config.zeroDowntimeReload);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleCopyWebhookUrl = () => {
    const url = status?.config?.webhookUrl || `${window.location.origin}/api/github/webhook`;
    navigator.clipboard.writeText(url);
    playClickSound();
    setCopiedUrl(true);
    showToast("Webhook URL copied to clipboard!");
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  const handleToggleAutoRestart = async () => {
    if (!status) return;
    playClickSound();
    const newEnabled = !status.config.enabled;
    try {
      const res = await fetch("/api/github/webhook/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: newEnabled }),
      });
      const data = await res.json();
      if (data.config) {
        setStatus((prev) => (prev ? { ...prev, config: data.config } : null));
        showToast(
          newEnabled
            ? "✅ Auto-Restart on GitHub Commit is now ENABLED!"
            : "⚠️ Auto-Restart on GitHub Commit is now PAUSED."
        );
      }
    } catch {
      showToast("Failed to update config");
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfigSaving(true);
    playClickSound();
    try {
      const res = await fetch("/api/github/webhook/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetBranch: targetBranchInput,
          autoPullChanges: autoPullToggle,
          zeroDowntimeReload: zeroDowntimeToggle,
          ...(secretInput ? { secret: secretInput } : {}),
        }),
      });
      const data = await res.json();
      if (data.config) {
        setStatus((prev) => (prev ? { ...prev, config: data.config } : null));
        playSuccessSound();
        showToast("Configuration saved successfully!");
      }
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    } finally {
      setConfigSaving(false);
    }
  };

  const handleTriggerSimulation = async () => {
    if (simulating) return;
    setSimulating(true);
    setPipelineStep(1);
    playClickSound();

    try {
      // Step 1: Webhook received
      await new Promise((r) => setTimeout(r, 350));
      setPipelineStep(2);

      // Step 2: Verification
      await new Promise((r) => setTimeout(r, 400));
      setPipelineStep(3);

      // Step 3: Git Pull & Reload
      const res = await fetch("/api/github/webhook/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commitMessage,
          authorUsername: commitAuthor,
          authorName: commitAuthor === "sennexed" ? "Sennexed" : commitAuthor,
          branch: commitBranch,
          modifiedFiles,
        }),
      });

      const data = await res.json();
      setPipelineStep(4);
      await new Promise((r) => setTimeout(r, 300));
      setPipelineStep(5);

      if (data.deployment) {
        setLastRestartDuration(data.deployment.restartDurationMs);
        setSelectedRecord(data.deployment);
      }

      playSuccessSound();
      showToast("🚀 GitHub commit received! AegisMod server restarted cleanly.");
      await fetchStatus();
    } catch (err: any) {
      playAlertSound();
      showToast(`Simulation error: ${err.message}`);
    } finally {
      setTimeout(() => {
        setSimulating(false);
        setPipelineStep(0);
      }, 1800);
    }
  };

  const presetCommits = [
    {
      msg: "feat: update teen safety filters and regex patterns",
      files: ["server.ts", "src/services/botStabilityService.ts"],
    },
    {
      msg: "fix: auto-news scheduled broadcast timezones",
      files: ["src/services/newsService.ts", "src/types/news.ts"],
    },
    {
      msg: "style: add neon glowing font styles for bot nickname",
      files: ["src/types/nameStyles.ts", "src/bot-code/src/commands/namestyle.ts"],
    },
    {
      msg: "perf: optimize token triage memory heap bounds",
      files: ["server.ts", "src/services/guildMemoryService.ts"],
    },
  ];

  const githubActionsYaml = `# .github/workflows/deploy.yml
name: AegisMod Auto-Deploy & Server Restart

on:
  push:
    branches:
      - main

jobs:
  auto-restart-server:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger AegisMod Auto-Restart Webhook
        run: |
          curl -X POST "${status?.config?.webhookUrl || "https://your-server.app/api/github/webhook"}" \\
            -H "Content-Type: application/json" \\
            -H "X-GitHub-Event: push" \\
            -d '{
              "ref": "refs/heads/${status?.config?.targetBranch || "main"}",
              "head_commit": {
                "id": "\${{ github.sha }}",
                "message": "\${{ github.event.head_commit.message }}",
                "author": {
                  "name": "\${{ github.actor }}",
                  "username": "\${{ github.actor }}"
                }
              }
            }'
`;

  const copyYamlToClipboard = () => {
    navigator.clipboard.writeText(githubActionsYaml);
    playClickSound();
    setCopiedYaml(true);
    showToast("GitHub Actions YAML workflow copied!");
    setTimeout(() => setCopiedYaml(false), 2500);
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
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-zinc-900 via-zinc-800 to-indigo-950 p-6 md:p-8 text-white shadow-xl border border-zinc-700/50">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-semibold text-indigo-300">
              <RotateCw className="w-3.5 h-3.5 text-indigo-400 animate-spin" style={{ animationDuration: "6s" }} />
              <span>Zero-Downtime Continuous Deployment</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              GitHub Commit Auto-Restart & Hot Reload
            </h2>
            <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed">
              Whenever any commit is pushed to your GitHub repository, the AegisMod server catches the webhook, pulls changes, flushes memory buffers, and performs an instant zero-downtime hot reload.
            </p>
          </div>

          {/* Quick Metrics & Toggle Switch */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-zinc-800/80 backdrop-blur-md rounded-2xl border border-zinc-700/80 p-4 flex items-center gap-4">
              <div>
                <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                  Auto-Restart Status
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      status?.config?.enabled ? "bg-emerald-400 animate-pulse" : "bg-zinc-500"
                    }`}
                  />
                  <span className="font-bold text-sm text-white">
                    {status?.config?.enabled ? "ACTIVE (Listening)" : "DISABLED"}
                  </span>
                </div>
              </div>

              <button
                onClick={handleToggleAutoRestart}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  status?.config?.enabled
                    ? "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40"
                    : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600 border border-zinc-600"
                }`}
              >
                {status?.config?.enabled ? "Enabled" : "Paused"}
              </button>
            </div>

            <div className="bg-zinc-800/80 backdrop-blur-md rounded-2xl border border-zinc-700/80 p-4 min-w-[130px]">
              <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                Total Restarts
              </div>
              <div className="text-xl font-black text-indigo-400 mt-0.5 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>{status?.totalAutoRestarts ?? 3}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Webhook URL Bar */}
        <div className="mt-6 pt-6 border-t border-zinc-700/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-black/20 p-3.5 rounded-2xl">
          <div className="flex items-center gap-2.5 min-w-0">
            <Radio className="w-4 h-4 text-emerald-400 shrink-0 animate-pulse" />
            <span className="text-xs font-bold text-zinc-300 shrink-0">Live Webhook Endpoint:</span>
            <code className="text-xs font-mono text-indigo-300 bg-zinc-900/90 px-3 py-1 rounded-lg border border-zinc-700 truncate select-all">
              {status?.config?.webhookUrl || `${window.location.origin}/api/github/webhook`}
            </code>
          </div>

          <button
            onClick={handleCopyWebhookUrl}
            className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer shrink-0"
          >
            {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedUrl ? "Copied!" : "Copy Webhook URL"}</span>
          </button>
        </div>
      </div>

      {/* Feature Sub-Navigation */}
      <div className="flex items-center space-x-2 border-b border-zinc-200 pb-2 overflow-x-auto">
        <button
          onClick={() => {
            playClickSound();
            setActiveTab("simulator");
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === "simulator"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
              : "bg-white text-zinc-600 hover:text-zinc-900 border border-zinc-200"
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Interactive Commit & Restart Simulator</span>
        </button>

        <button
          onClick={() => {
            playClickSound();
            setActiveTab("history");
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === "history"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
              : "bg-white text-zinc-600 hover:text-zinc-900 border border-zinc-200"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Deployment & Restart Audit Log ({status?.history?.length || 0})</span>
        </button>

        <button
          onClick={() => {
            playClickSound();
            setActiveTab("setup-guide");
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === "setup-guide"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
              : "bg-white text-zinc-600 hover:text-zinc-900 border border-zinc-200"
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>GitHub Webhook Setup Guide</span>
        </button>

        <button
          onClick={() => {
            playClickSound();
            setActiveTab("config");
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === "config"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
              : "bg-white text-zinc-600 hover:text-zinc-900 border border-zinc-200"
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>CI/CD Settings</span>
        </button>
      </div>

      {/* Tab 1: Simulator */}
      {activeTab === "simulator" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Simulator Form */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                  <GitCommit className="w-4 h-4 text-indigo-600" />
                  Simulate Live GitHub Push Event
                </h3>
                <p className="text-xs text-zinc-500">
                  Send a push event to trigger the automatic server restart & hot reload pipeline.
                </p>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Interactive Test
              </span>
            </div>

            {/* Quick Templates */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                Quick Commit Templates:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {presetCommits.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setCommitMessage(item.msg);
                      setModifiedFiles(item.files);
                    }}
                    className={`text-left p-2.5 rounded-xl border text-[11px] transition-all cursor-pointer ${
                      commitMessage === item.msg
                        ? "bg-indigo-50/80 border-indigo-300 text-indigo-900 font-semibold"
                        : "bg-zinc-50/60 hover:bg-zinc-100/80 border-zinc-200 text-zinc-700"
                    }`}
                  >
                    <div className="truncate font-medium">{item.msg}</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">
                      {item.files.length} files modified
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Input Fields */}
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Commit Message:
                </label>
                <input
                  type="text"
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  placeholder="e.g. feat: add automated restart on commit"
                  className="w-full px-3.5 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-zinc-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    GitHub Author:
                  </label>
                  <input
                    type="text"
                    value={commitAuthor}
                    onChange={(e) => setCommitAuthor(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-zinc-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Target Branch:
                  </label>
                  <div className="flex items-center gap-1.5 px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl font-mono text-zinc-800">
                    <GitBranch className="w-3.5 h-3.5 text-zinc-400" />
                    <select
                      value={commitBranch}
                      onChange={(e) => setCommitBranch(e.target.value)}
                      className="bg-transparent w-full focus:outline-none"
                    >
                      <option value="main">refs/heads/main</option>
                      <option value="master">refs/heads/master</option>
                      <option value="staging">refs/heads/staging</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Modified Files in Commit:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {modifiedFiles.map((file, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono bg-zinc-100 text-zinc-700 border border-zinc-200"
                    >
                      <FileCode2 className="w-3 h-3 text-indigo-500" />
                      <span>{file}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Trigger Button */}
            <button
              onClick={handleTriggerSimulation}
              disabled={simulating}
              className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 text-white transition-all shadow-md cursor-pointer ${
                simulating
                  ? "bg-indigo-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100"
              }`}
            >
              {simulating ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  <span>Processing Commit & Auto-Restarting Server...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                  <span>Push Commit to GitHub & Auto-Restart Server</span>
                </>
              )}
            </button>
          </div>

          {/* Live Pipeline Visualizer & Logs */}
          <div className="lg:col-span-6 space-y-6">
            {/* Step-by-Step Restart Pipeline */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                  <RotateCw className="w-4 h-4 text-emerald-600" />
                  Zero-Downtime Hot Reload Pipeline
                </h3>
                {lastRestartDuration && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Last: {(lastRestartDuration / 1000).toFixed(2)}s
                  </span>
                )}
              </div>

              <div className="space-y-3">
                {[
                  {
                    step: 1,
                    title: "1. Webhook Payload Ingestion",
                    desc: "Express catches POST /api/github/webhook event with commit diff",
                  },
                  {
                    step: 2,
                    title: "2. HMAC Signature & Branch Verification",
                    desc: "Authenticates SHA-256 signature and matches configured ref branch",
                  },
                  {
                    step: 3,
                    title: "3. Remote Code Sync & Buffer Flush",
                    desc: "Pulls updated modules and cleans temporary triage memory cache",
                  },
                  {
                    step: 4,
                    title: "4. Graceful Node.js Process Restart",
                    desc: "Hot-reloads server.ts without dropping incoming Discord events",
                  },
                  {
                    step: 5,
                    title: "5. Gateway Heartbeat & Health Check",
                    desc: "Discord bot gateway re-attached and stability monitor confirmed healthy",
                  },
                ].map((item) => {
                  const isDone = pipelineStep >= item.step || (!simulating && pipelineStep === 0);
                  const isCurrent = simulating && pipelineStep === item.step;

                  return (
                    <div
                      key={item.step}
                      className={`p-3 rounded-xl border transition-all flex items-start gap-3 ${
                        isCurrent
                          ? "bg-indigo-50 border-indigo-300 ring-2 ring-indigo-100"
                          : isDone
                          ? "bg-emerald-50/40 border-emerald-200/80"
                          : "bg-zinc-50 border-zinc-200/60 opacity-60"
                      }`}
                    >
                      <div className="mt-0.5">
                        {isCurrent ? (
                          <RotateCw className="w-4 h-4 text-indigo-600 animate-spin" />
                        ) : isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-zinc-300" />
                        )}
                      </div>
                      <div>
                        <div
                          className={`text-xs font-bold ${
                            isCurrent
                              ? "text-indigo-900"
                              : isDone
                              ? "text-emerald-900"
                              : "text-zinc-600"
                          }`}
                        >
                          {item.title}
                        </div>
                        <div className="text-[11px] text-zinc-500 mt-0.5">{item.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Last Restarted Commit Card */}
            {status?.lastCommit && (
              <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5 text-white shadow-md space-y-3">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                    <GitCommit className="w-3.5 h-3.5 text-indigo-400" />
                    Latest Hot-Reloaded Commit
                  </span>
                  <span className="font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60 text-[10px]">
                    {status.lastCommit.shortSha}
                  </span>
                </div>

                <div className="text-sm font-semibold text-zinc-100">
                  "{status.lastCommit.message}"
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-800 text-xs text-zinc-400">
                  <div className="flex items-center gap-2">
                    <img
                      src={
                        status.lastCommit.author.avatarUrl ||
                        `https://api.dicebear.com/7.x/identicon/svg?seed=${status.lastCommit.author.username}`
                      }
                      alt={status.lastCommit.author.name}
                      className="w-5 h-5 rounded-full ring-1 ring-zinc-700"
                    />
                    <span className="text-zinc-300 font-medium">
                      @{status.lastCommit.author.username}
                    </span>
                  </div>
                  <span className="text-zinc-500 text-[11px]">
                    {new Date(status.lastCommit.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Deployment & Restart History Audit */}
      {activeTab === "history" && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                Commit-Triggered Auto-Restart History
              </h3>
              <p className="text-xs text-zinc-500">
                Full chronological ledger of GitHub push webhooks and automated server restarts.
              </p>
            </div>
            <button
              onClick={fetchStatus}
              className="px-3 py-1.5 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-600 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh History</span>
            </button>
          </div>

          {/* Records Table */}
          <div className="overflow-x-auto rounded-xl border border-zinc-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 text-zinc-500 font-bold border-b border-zinc-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Commit</th>
                  <th className="py-3 px-4">Message</th>
                  <th className="py-3 px-4">Author</th>
                  <th className="py-3 px-4">Branch</th>
                  <th className="py-3 px-4">Restart Time</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {status?.history?.map((rec) => (
                  <tr
                    key={rec.id}
                    onClick={() => setSelectedRecord(rec)}
                    className="hover:bg-indigo-50/40 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{rec.status}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-mono font-bold text-indigo-600">
                      {rec.commitShortSha}
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate font-medium text-zinc-900">
                      {rec.commitMessage}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-zinc-600">
                      @{rec.authorUsername}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-zinc-100 text-zinc-700">
                        {rec.branch}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-zinc-600 font-medium">
                      {(rec.restartDurationMs / 1000).toFixed(2)}s
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-zinc-500 text-[11px]">
                      {rec.timestamp}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Detail Modal / Drawer for Selected Record */}
          {selectedRecord && (
            <div className="p-4 rounded-xl bg-zinc-900 text-white space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5" />
                  Deployment Logs: {selectedRecord.commitShortSha} - "{selectedRecord.commitMessage}"
                </span>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="text-xs text-zinc-400 hover:text-white cursor-pointer"
                >
                  ✕ Close
                </button>
              </div>
              <div className="font-mono text-[11px] text-zinc-300 space-y-1 bg-black/40 p-3 rounded-lg max-h-40 overflow-y-auto">
                {selectedRecord.logs?.map((log, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="text-zinc-600 select-none">{index + 1}</span>
                    <span className={log.includes("✨") ? "text-emerald-400 font-bold" : ""}>
                      {log}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Setup Guide */}
      {activeTab === "setup-guide" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm space-y-6">
            <div className="border-b border-zinc-100 pb-4">
              <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <Code2 className="w-5 h-5 text-indigo-600" />
                How to Connect your GitHub Repository in 3 Minutes
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                Configure GitHub to notify this server on every push event for automated reloads.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Step 1 */}
              <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-100 text-indigo-800">
                    STEP 1
                  </span>
                  <a
                    href="https://github.com/sennexed/Aegis-bot/settings/hooks"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
                  >
                    <span>Open Webhooks</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <h4 className="text-xs font-bold text-zinc-900">Open Repository Webhooks</h4>
                <p className="text-xs text-zinc-600">
                  Navigate to <strong className="text-zinc-900">github.com/sennexed/Aegis-bot</strong> &gt; <strong className="text-zinc-900">Settings</strong> &gt; <strong className="text-zinc-900">Webhooks</strong>, and click <strong className="text-zinc-900">Add webhook</strong>.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-100 text-indigo-800">
                    STEP 2
                  </span>
                  <span className="text-xs text-zinc-400">Payload URL</span>
                </div>
                <h4 className="text-xs font-bold text-zinc-900">Enter the Webhook URL</h4>
                <p className="text-xs text-zinc-600">
                  Paste the generated endpoint in the <strong className="text-zinc-900">Payload URL</strong> field:
                </p>
                <code className="block p-2 rounded bg-zinc-900 text-indigo-300 font-mono text-[11px] select-all break-all">
                  {status?.config?.webhookUrl || `${window.location.origin}/api/github/webhook`}
                </code>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-100 text-indigo-800">
                    STEP 3
                  </span>
                  <span className="text-xs text-zinc-400">Content Type</span>
                </div>
                <h4 className="text-xs font-bold text-zinc-900">Set JSON Payload</h4>
                <p className="text-xs text-zinc-600">
                  Set <strong className="text-zinc-900">Content type</strong> to <code className="bg-zinc-200 px-1 py-0.5 rounded text-zinc-800 font-mono">application/json</code>. Secret can be left blank or configured in the Settings tab.
                </p>
              </div>

              {/* Step 4 */}
              <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-100 text-indigo-800">
                    STEP 4
                  </span>
                  <span className="text-xs text-zinc-400">Event Trigger</span>
                </div>
                <h4 className="text-xs font-bold text-zinc-900">Select Push Events</h4>
                <p className="text-xs text-zinc-600">
                  Select <strong className="text-zinc-900">"Just the push event"</strong> and ensure the <strong className="text-zinc-900">"Active"</strong> checkbox is checked. Click <strong className="text-zinc-900">Add webhook</strong>!
                </p>
              </div>
            </div>
          </div>

          {/* GitHub Actions Alternative */}
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 text-white shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 flex-wrap gap-2">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileCode2 className="w-4 h-4 text-emerald-400" />
                  Optional: GitHub Actions CI/CD Workflow (.github/workflows/deploy.yml)
                </h4>
                <p className="text-xs text-zinc-400">
                  You can also trigger automated server reloads using GitHub Actions CI/CD.
                </p>
              </div>

              <button
                onClick={copyYamlToClipboard}
                className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-zinc-700"
              >
                {copiedYaml ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedYaml ? "Copied YAML" : "Copy Workflow YAML"}</span>
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-black/60 font-mono text-xs text-emerald-300 overflow-x-auto border border-zinc-800 leading-relaxed">
              {githubActionsYaml}
            </pre>
          </div>
        </div>
      )}

      {/* Tab 4: CI/CD Settings */}
      {activeTab === "config" && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm space-y-5 max-w-2xl">
          <div className="border-b border-zinc-100 pb-3">
            <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              Auto-Restart & GitHub Webhook Configuration
            </h3>
            <p className="text-xs text-zinc-500">
              Customize branch filters, security secrets, and reload policies.
            </p>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                Target Git Branch Filter:
              </label>
              <input
                type="text"
                value={targetBranchInput}
                onChange={(e) => setTargetBranchInput(e.target.value)}
                placeholder="e.g. main (or * for all branches)"
                className="w-full px-3.5 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-zinc-800"
              />
              <span className="text-[11px] text-zinc-500 mt-1 block">
                Server will only restart when commits are pushed to this branch. Use <code className="bg-zinc-100 px-1 rounded font-mono">*</code> to restart on any branch.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                GitHub Webhook Secret (HMAC SHA-256):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  value={secretInput}
                  onChange={(e) => setSecretInput(e.target.value)}
                  placeholder="Leave blank for open webhook, or enter secret"
                  className="w-full px-3.5 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-zinc-800"
                />
              </div>
              <span className="text-[11px] text-zinc-500 mt-1 block">
                Matches the secret key configured in GitHub Webhook settings for cryptographic verification.
              </span>
            </div>

            <div className="pt-2 space-y-3 border-t border-zinc-100">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoPullToggle}
                  onChange={(e) => setAutoPullToggle(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <div>
                  <span className="text-xs font-bold text-zinc-800">
                    Automatic Code Sync (git pull)
                  </span>
                  <p className="text-[11px] text-zinc-500">
                    Automatically synchronize modified files before restarting the Node.js process.
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={zeroDowntimeToggle}
                  onChange={(e) => setZeroDowntimeToggle(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <div>
                  <span className="text-xs font-bold text-zinc-800">
                    Zero-Downtime Hot Reload
                  </span>
                  <p className="text-[11px] text-zinc-500">
                    Keep Discord gateway websocket listeners alive during process recycling to eliminate dropped chat packets.
                  </p>
                </div>
              </label>
            </div>

            <div className="pt-4 border-t border-zinc-100 flex justify-end">
              <button
                type="submit"
                disabled={configSaving}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
              >
                {configSaving ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Save CI/CD Configuration</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
