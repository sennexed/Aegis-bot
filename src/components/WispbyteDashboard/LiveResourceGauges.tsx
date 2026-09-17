import React from "react";
import { motion } from "motion/react";
import { Cpu, HardDrive, Wifi, Activity, Sparkles, Zap, ShieldCheck } from "lucide-react";
import { WispbyteMetrics, WispbyteStats } from "../../types";

interface LiveResourceGaugesProps {
  metrics: WispbyteMetrics;
  stats: WispbyteStats;
  historyCpu: number[];
  serverRunning: boolean;
}

export const LiveResourceGauges: React.FC<LiveResourceGaugesProps> = ({
  metrics,
  stats,
  historyCpu,
  serverRunning,
}) => {
  const cpuVal = serverRunning ? metrics.cpuPercent : 0;
  const memVal = serverRunning ? metrics.memoryMb : 0;
  const memLimit = metrics.memoryLimitMb || 512;
  const memPercent = serverRunning ? Math.min(100, Math.round((memVal / memLimit) * 100)) : 0;
  const pingVal = serverRunning ? metrics.discordPingMs : 0;

  // Render SVG Sparkline
  const renderSparkline = () => {
    if (historyCpu.length < 2) return null;
    const max = 30;
    const min = 0;
    const width = 140;
    const height = 36;
    const points = historyCpu
      .map((val, i) => {
        const x = (i / (historyCpu.length - 1)) * width;
        const clamped = Math.max(min, Math.min(max, val));
        const y = height - ((clamped - min) / (max - min)) * (height - 6) - 3;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");

    return (
      <svg className="w-full h-9 overflow-visible" viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <path
          d={`M 0,${height} L ${points} L ${width},${height} Z`}
          fill="url(#cpuGradient)"
        />
        <polyline
          fill="none"
          stroke="#6366f1"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. CPU Usage */}
      <motion.div
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-sm relative overflow-hidden group hover:border-indigo-300 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-zinc-500 block">CPU Allocation</span>
              <span className="text-lg font-bold text-zinc-900 tracking-tight">
                {cpuVal.toFixed(1)}%
              </span>
            </div>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 font-medium">
            1 vCPU
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-indigo-600 rounded-full"
              initial={false}
              animate={{ width: `${Math.min(100, (cpuVal / 50) * 100)}%` }}
              transition={{ type: "spring", stiffness: 60, damping: 15 }}
            />
          </div>
        </div>

        {/* Live Sparkline */}
        <div className="mt-3 pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-400">
          <span>Realtime Load</span>
          <div className="w-32">{renderSparkline()}</div>
        </div>
      </motion.div>

      {/* 2. Memory (RAM) Usage */}
      <motion.div
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-sm relative overflow-hidden group hover:border-emerald-300 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-zinc-500 block">RAM Usage</span>
              <span className="text-lg font-bold text-zinc-900 tracking-tight">
                {memVal} MB <span className="text-xs font-normal text-zinc-400">/ {memLimit} MB</span>
              </span>
            </div>
          </div>
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
            memPercent > 80 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"
          }`}>
            {memPercent}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${
                memPercent > 80 ? "bg-red-500" : memPercent > 60 ? "bg-amber-500" : "bg-emerald-500"
              }`}
              initial={false}
              animate={{ width: `${memPercent}%` }}
              transition={{ type: "spring", stiffness: 60, damping: 15 }}
            />
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
          <span>V8 Heap: 104MB</span>
          <span className="text-emerald-600 font-medium">Free: {memLimit - memVal}MB</span>
        </div>
      </motion.div>

      {/* 3. Discord Gateway Ping & Network */}
      <motion.div
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-sm relative overflow-hidden group hover:border-cyan-300 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-50 text-cyan-600">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-zinc-500 block">Gateway Latency</span>
              <span className="text-lg font-bold text-zinc-900 tracking-tight flex items-center gap-1.5">
                {pingVal} ms
                {serverRunning && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 text-[10px] font-semibold">
                    Optimal
                  </span>
                )}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
              WS OK
            </span>
          </div>
        </div>

        {/* Network Throughput */}
        <div className="mt-4 flex items-center justify-between text-xs bg-zinc-50 px-3 py-1.5 rounded-xl border border-zinc-100 font-mono text-zinc-700">
          <span className="flex items-center gap-1 text-indigo-600">
            &darr; {metrics.networkInboundKbps} KB/s
          </span>
          <span className="flex items-center gap-1 text-emerald-600">
            &uarr; {metrics.networkOutboundKbps} KB/s
          </span>
        </div>

        <div className="mt-3 pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
          <span>Discord Shard #0</span>
          <span className="font-semibold text-zinc-700">Wispbyte SG-1 Node</span>
        </div>
      </motion.div>

      {/* 4. AI Triage & Token Efficiency */}
      <motion.div
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15 }}
        className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-sm relative overflow-hidden group hover:border-purple-300 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-zinc-500 block">AI Token Savings</span>
              <span className="text-lg font-bold text-zinc-900 tracking-tight">
                {stats.cacheHitRatioPercent}% <span className="text-xs font-normal text-zinc-400">local pass</span>
              </span>
            </div>
          </div>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
            Tier-1 Triage
          </span>
        </div>

        {/* Tokens Saved Counter */}
        <div className="mt-4 flex items-center justify-between text-xs bg-purple-50/50 px-3 py-1.5 rounded-xl border border-purple-100 text-purple-950 font-medium">
          <span className="flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-purple-600" />
            Saved Tokens:
          </span>
          <span className="font-mono font-bold text-purple-700">
            {stats.tokensSavedByTriage.toLocaleString()}
          </span>
        </div>

        <div className="mt-3 pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
          <span>Total Guarded:</span>
          <span className="font-semibold text-zinc-800">
            {stats.processedMessages.toLocaleString()} msgs
          </span>
        </div>
      </motion.div>
    </div>
  );
};
