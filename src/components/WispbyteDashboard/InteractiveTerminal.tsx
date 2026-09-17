import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Terminal,
  Play,
  RotateCw,
  Search,
  Copy,
  Check,
  Download,
  Trash2,
  ChevronRight,
  Sparkles,
  Shield,
  ArrowDown,
  Pause,
  Sliders,
  HelpCircle,
} from "lucide-react";
import { WispbyteLogItem } from "../../types";

interface InteractiveTerminalProps {
  logs: WispbyteLogItem[];
  serverRunning: boolean;
  onSendCommand: (cmd: string) => Promise<string | void>;
  onClearLogs: () => void;
}

export const InteractiveTerminal: React.FC<InteractiveTerminalProps> = ({
  logs,
  serverRunning,
  onSendCommand,
  onClearLogs,
}) => {
  const [commandInput, setCommandInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [filterLevel, setFilterLevel] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const [copied, setCopied] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom within the terminal window only (preventing page-level jumps)
  useEffect(() => {
    if (autoScroll && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!commandInput.trim() || isSending) return;
    const cmd = commandInput.trim();
    setCommandInput("");
    setIsSending(true);
    try {
      await onSendCommand(cmd);
    } finally {
      setIsSending(false);
    }
  };

  const handleQuickChip = (cmd: string) => {
    setCommandInput(cmd);
  };

  const handleCopyLogs = () => {
    const text = logs.map((l) => `[${l.timestamp}] [${l.level}] ${l.message}`).join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadLogs = () => {
    const text = logs.map((l) => `[${l.timestamp}] [${l.level}] ${l.message}`).join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wispbyte-aegismod-${new Date().toISOString().slice(0, 10)}.log`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    if (filterLevel !== "ALL" && log.level !== filterLevel) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return log.message.toLowerCase().includes(q) || log.level.toLowerCase().includes(q);
    }
    return true;
  });

  const getLevelBadge = (level: WispbyteLogItem["level"]) => {
    switch (level) {
      case "DAEMON":
        return "text-cyan-400 bg-cyan-950/70 border border-cyan-800/60";
      case "DISCORD":
        return "text-indigo-400 bg-indigo-950/70 border border-indigo-800/60";
      case "AI_MOD":
        return "text-purple-300 bg-purple-950/80 border border-purple-800/60";
      case "AUTOMOD":
        return "text-amber-300 bg-amber-950/80 border border-amber-800/60";
      case "WARN":
        return "text-orange-400 bg-orange-950/80 border border-orange-800/60";
      case "ERROR":
        return "text-red-400 bg-red-950/80 border border-red-800/60";
      case "COMMAND":
        return "text-emerald-300 bg-emerald-950/80 border border-emerald-800/60";
      default:
        return "text-zinc-400 bg-zinc-800/70 border border-zinc-700/60";
    }
  };

  return (
    <div className="bg-[#121316] rounded-2xl border border-zinc-800 shadow-xl overflow-hidden flex flex-col font-sans">
      {/* Terminal Title Bar */}
      <div className="bg-[#18191e] px-4 py-3 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
          </div>
          <div className="h-4 w-px bg-zinc-700 mx-1" />
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-mono font-bold text-zinc-200">
              Wispbyte Pterodactyl Console
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
              container:c8f2a1b9
            </span>
          </div>
        </div>

        {/* Console Action Bar */}
        <div className="flex items-center gap-2">
          {/* Level Filter */}
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="bg-zinc-800 text-zinc-300 text-xs px-2.5 py-1 rounded-lg border border-zinc-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="ALL">All Levels</option>
            <option value="AI_MOD">AI Mod & Gemini</option>
            <option value="AUTOMOD">AutoMod Rules</option>
            <option value="DISCORD">Discord Events</option>
            <option value="DAEMON">Pterodactyl Daemon</option>
            <option value="COMMAND">Commands</option>
            <option value="ERROR">Errors Only</option>
          </select>

          {/* Search Box */}
          <div className="relative hidden sm:block">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-zinc-800/80 text-zinc-200 text-xs pl-8 pr-2.5 py-1 rounded-lg border border-zinc-700 focus:outline-none focus:border-indigo-500 w-36 focus:w-48 transition-all"
            />
          </div>

          {/* Auto Scroll Toggle */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            title={autoScroll ? "Pause autoscroll" : "Enable autoscroll"}
            className={`p-1.5 rounded-lg text-xs flex items-center gap-1 border transition-colors cursor-pointer ${
              autoScroll
                ? "bg-indigo-950/70 border-indigo-700 text-indigo-300"
                : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {autoScroll ? <ArrowDown className="w-3.5 h-3.5 animate-bounce" /> : <Pause className="w-3.5 h-3.5" />}
          </button>

          {/* Copy Logs */}
          <button
            onClick={handleCopyLogs}
            title="Copy all logs"
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 text-xs transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Download Logs */}
          <button
            onClick={handleDownloadLogs}
            title="Download log file"
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 text-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {/* Clear logs */}
          <button
            onClick={onClearLogs}
            title="Clear console view"
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-950 text-zinc-400 hover:text-red-400 border border-zinc-700 text-xs transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Log Stream Window */}
      <div
        ref={scrollContainerRef}
        className="h-80 sm:h-96 overflow-y-auto p-4 space-y-1 font-mono text-xs text-zinc-300 select-text leading-relaxed scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent"
      >
        {!serverRunning && (
          <div className="p-3 bg-red-950/30 border border-red-900/50 rounded-lg text-red-300 flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span>Container is offline. Click <strong>Start</strong> above to boot AegisMod.</span>
          </div>
        )}

        {filteredLogs.map((log) => (
          <motion.div
            key={log.id}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.15 }}
            className="flex items-start gap-2.5 py-0.5 hover:bg-white/[0.03] px-1 rounded transition-colors group"
          >
            <span className="text-zinc-600 text-[11px] shrink-0 select-none">
              {log.timestamp}
            </span>
            <span
              className={`text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0 uppercase tracking-wider ${getLevelBadge(
                log.level
              )}`}
            >
              {log.level}
            </span>
            <span className="break-all text-zinc-200 group-hover:text-white">
              {log.message}
            </span>
          </motion.div>
        ))}

        {filteredLogs.length === 0 && (
          <div className="py-12 text-center text-zinc-600 text-xs">
            No logs match the current filter.
          </div>
        )}

        <div ref={terminalEndRef} />
      </div>

      {/* Quick Suggestion Chips */}
      <div className="bg-[#18191e] px-4 py-2 border-t border-zinc-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 shrink-0 mr-1 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-indigo-400" /> Quick Cmds:
        </span>
        {[
          "help",
          "status",
          "ping",
          "stats",
          "clearcache",
          "reload",
          "testmod \"gg ez bro\"",
          "testmod \"free discord nitro gift\"",
          "policy STRICT_TEEN",
        ].map((cmd) => (
          <button
            key={cmd}
            onClick={() => handleQuickChip(cmd)}
            className="px-2.5 py-0.5 rounded bg-zinc-800/80 hover:bg-indigo-600/30 text-zinc-300 hover:text-indigo-200 border border-zinc-700/80 text-[11px] font-mono whitespace-nowrap transition-colors cursor-pointer"
          >
            {cmd}
          </button>
        ))}
      </div>

      {/* Interactive Command Input */}
      <form
        onSubmit={handleSend}
        className="bg-[#14151a] px-4 py-3 border-t border-zinc-800 flex items-center gap-2"
      >
        <span className="text-emerald-400 font-mono font-bold flex items-center gap-1 shrink-0">
          <ChevronRight className="w-4 h-4" />
          <span className="text-zinc-500 text-xs">wispbyte@aegismod:~$</span>
        </span>
        <input
          type="text"
          value={commandInput}
          onChange={(e) => setCommandInput(e.target.value)}
          placeholder={
            serverRunning
              ? "Type command (e.g. stats, ping, testmod <message>, clearcache, help)..."
              : "Server is stopped. Start container to run commands."
          }
          disabled={!serverRunning || isSending}
          className="flex-1 bg-transparent text-xs font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!serverRunning || !commandInput.trim() || isSending}
          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
        >
          {isSending ? (
            <RotateCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current" />
          )}
          <span>Execute</span>
        </button>
      </form>
    </div>
  );
};
