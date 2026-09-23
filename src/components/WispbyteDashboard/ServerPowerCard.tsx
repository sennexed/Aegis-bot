import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Play,
  Square,
  RotateCw,
  Skull,
  Server,
  Clock,
  Radio,
  Sliders,
  Sparkles,
  ShieldCheck,
  Send,
  Volume2,
  VolumeX,
  ExternalLink,
  ChevronDown,
  AlertOctagon,
  Bot,
  Globe,
  Copy,
  Check,
} from "lucide-react";
import { ServerPowerState, WispbyteBotDetails } from "../../types";

interface ServerPowerCardProps {
  powerState: ServerPowerState;
  uptimeSeconds: number;
  botDetails: WispbyteBotDetails;
  onPowerAction: (action: "start" | "stop" | "restart" | "kill") => Promise<void>;
  onOpenConfig: () => void;
  onOpenDeployModal: () => void;
  onOpenSimulationModal: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const ServerPowerCard: React.FC<ServerPowerCardProps> = ({
  powerState,
  uptimeSeconds,
  botDetails,
  onPowerAction,
  onOpenConfig,
  onOpenDeployModal,
  onOpenSimulationModal,
  soundEnabled,
  onToggleSound,
}) => {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [confirmKill, setConfirmKill] = useState(false);
  const [currentUptime, setCurrentUptime] = useState(uptimeSeconds);
  const [copiedDomain, setCopiedDomain] = useState(false);

  const subdomain = botDetails.subdomain || "aegisbot.wispbyte.app";
  const port = botDetails.port || 10734;
  const webpageUrl = botDetails.webpageUrl || `https://${subdomain}/`;
  const allocation = botDetails.allocation || `${subdomain}:${port}`;

  const handleCopyDomain = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(webpageUrl);
    setCopiedDomain(true);
    setTimeout(() => setCopiedDomain(false), 2000);
  };

  // Live ticking uptime
  useEffect(() => {
    setCurrentUptime(uptimeSeconds);
    if (powerState !== "RUNNING") return;
    const timer = setInterval(() => {
      setCurrentUptime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [uptimeSeconds, powerState]);

  const formatUptime = (totalSec: number) => {
    if (totalSec <= 0 || powerState !== "RUNNING") return "Offline";
    const days = Math.floor(totalSec / 86400);
    const hours = Math.floor((totalSec % 86400) / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    return `${minutes}m ${seconds}s`;
  };

  const handleAction = async (action: "start" | "stop" | "restart" | "kill") => {
    setLoadingAction(action);
    setConfirmKill(false);
    try {
      await onPowerAction(action);
    } finally {
      setLoadingAction(null);
    }
  };

  const getStatusBadge = () => {
    switch (powerState) {
      case "RUNNING":
        return {
          label: "ONLINE",
          color: "bg-emerald-500",
          textColor: "text-emerald-700",
          bgColor: "bg-emerald-50 border-emerald-200",
          ringColor: "ring-emerald-400/40",
          pulse: true,
        };
      case "STARTING":
        return {
          label: "STARTING...",
          color: "bg-amber-500",
          textColor: "text-amber-700",
          bgColor: "bg-amber-50 border-amber-200",
          ringColor: "ring-amber-400/40",
          pulse: true,
        };
      case "RESTARTING":
        return {
          label: "RESTARTING...",
          color: "bg-indigo-500",
          textColor: "text-indigo-700",
          bgColor: "bg-indigo-50 border-indigo-200",
          ringColor: "ring-indigo-400/40",
          pulse: true,
        };
      case "STOPPED":
      default:
        return {
          label: "STOPPED",
          color: "bg-red-500",
          textColor: "text-red-700",
          bgColor: "bg-red-50 border-red-200",
          ringColor: "ring-red-400/20",
          pulse: false,
        };
    }
  };

  const status = getStatusBadge();

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm relative overflow-hidden">
      {/* Background Subtle Gradient Glow */}
      <div className="absolute top-0 right-0 w-96 h-48 bg-gradient-to-bl from-indigo-50/70 via-transparent to-transparent pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
        {/* Left: Bot & Server Identity */}
        <div className="flex items-start sm:items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-100 ring-4 ring-indigo-50">
              <Bot className="w-9 h-9" />
            </div>
            {/* Status Beacon Ring */}
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
              {status.pulse && (
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full ${status.color} opacity-75`}
                />
              )}
              <span
                className={`relative inline-flex rounded-full h-4 w-4 ${status.color} ring-2 ring-white`}
              />
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-bold text-zinc-900 tracking-tight flex items-center gap-1.5">
                {botDetails.name}
                <span className="text-sm font-normal text-zinc-400 font-mono">
                  #{botDetails.discriminator}
                </span>
              </h2>

              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1.5 ${status.bgColor} ${status.textColor}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${status.color}`} />
                {status.label}
              </span>

              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                {botDetails.policyLevel}
              </span>
            </div>

            {/* Server Meta Info Bar */}
            <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500 flex-wrap">
              <span className="flex items-center gap-1">
                <Server className="w-3.5 h-3.5 text-zinc-400" />
                <span className="font-mono text-zinc-700">{botDetails.wispbyteNode}</span>
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                <span>Uptime:</span>
                <span className="font-mono font-semibold text-zinc-800">
                  {formatUptime(currentUptime)}
                </span>
              </span>
              <span className="hidden md:inline-flex items-center gap-1">
                <Radio className="w-3.5 h-3.5 text-zinc-400" />
                <span>{botDetails.nodeVersion}</span>
              </span>
            </div>

            {/* Webpage & Subdomain Allocation Pill */}
            <div className="flex items-center gap-2 mt-2.5 flex-wrap">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-50/80 border border-indigo-200/80 text-[11px] font-mono text-indigo-900 shadow-2xs">
                <Globe className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span className="font-bold text-indigo-700">Subdomain:</span>
                <span className="font-semibold text-zinc-800">{subdomain}/</span>
                <span className="text-zinc-300">|</span>
                <span className="text-indigo-600 font-bold">Port: {port}</span>
              </div>

              <button
                onClick={handleCopyDomain}
                title="Copy Webpage URL"
                className="px-2 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer border border-zinc-200"
              >
                {copiedDomain ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-zinc-500" />
                    <span>Copy URL</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Power Controls & Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Sound FX Toggle */}
          <button
            onClick={onToggleSound}
            title={soundEnabled ? "Mute interface feedback" : "Enable interface feedback sounds"}
            className="p-2.5 rounded-xl border border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition-colors cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-indigo-600" /> : <VolumeX className="w-4 h-4 text-zinc-400" />}
          </button>

          {/* Simulate Event Button */}
          <button
            onClick={onOpenSimulationModal}
            className="px-3.5 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 text-indigo-600" />
            <span>Test Live Intercept</span>
          </button>

          {/* Startup Config */}
          <button
            onClick={onOpenConfig}
            className="px-3.5 py-2.5 rounded-xl border border-zinc-200 hover:border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-zinc-500" />
            <span>Startup Env</span>
          </button>

          {/* Power Controls Group */}
          {powerState === "STOPPED" ? (
            <button
              onClick={() => handleAction("start")}
              disabled={loadingAction !== null}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-200 transition-all cursor-pointer disabled:opacity-50"
            >
              {loadingAction === "start" ? (
                <RotateCw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4 fill-current" />
              )}
              <span>Start Server</span>
            </button>
          ) : (
            <>
              {/* Restart Button */}
              <button
                onClick={() => handleAction("restart")}
                disabled={loadingAction !== null}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-100 transition-all cursor-pointer disabled:opacity-50"
              >
                <RotateCw className={`w-3.5 h-3.5 ${loadingAction === "restart" ? "animate-spin" : ""}`} />
                <span>Restart</span>
              </button>

              {/* Stop Button */}
              <button
                onClick={() => handleAction("stop")}
                disabled={loadingAction !== null}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-900 active:bg-black text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                {loadingAction === "stop" ? (
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Square className="w-3.5 h-3.5 fill-current" />
                )}
                <span>Stop</span>
              </button>

              {/* Kill / Force Kill */}
              {confirmKill ? (
                <div className="flex items-center gap-1 bg-red-50 p-1 rounded-xl border border-red-200">
                  <button
                    onClick={() => handleAction("kill")}
                    className="px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all cursor-pointer"
                  >
                    Confirm Kill
                  </button>
                  <button
                    onClick={() => setConfirmKill(false)}
                    className="px-2 py-1.5 rounded-lg text-zinc-500 hover:bg-white text-xs transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmKill(true)}
                  title="Force Kill (SIGKILL)"
                  className="p-2.5 rounded-xl border border-red-200 hover:bg-red-50 text-red-600 transition-colors cursor-pointer"
                >
                  <Skull className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
