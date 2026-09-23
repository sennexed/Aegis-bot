import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Code2,
  Play,
  Copy,
  Check,
  Send,
  Sparkles,
  Server,
  Zap,
  RefreshCw,
  Clock,
  Terminal,
  Layers,
  ArrowRight,
  Database,
  Radio,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Flame,
  Globe,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import { playClickSound, playSuccessSound } from "../utils/soundEffects";

interface ApiEndpointPreset {
  id: string;
  name: string;
  category: "SYSTEM" | "MODERATION" | "NEWS" | "STYLES" | "MEMORY" | "WISPBYTE";
  method: "GET" | "POST" | "PATCH";
  path: string;
  description: string;
  defaultBody?: any;
  queryParams?: Record<string, string>;
  curlExample: string;
}

const API_PRESETS: ApiEndpointPreset[] = [
  {
    id: "health",
    name: "System Health & AI Status",
    category: "SYSTEM",
    method: "GET",
    path: "/api/health",
    description: "Returns backend service heartbeat, active Gemini API key status, and system timestamp.",
    curlExample: "curl -X GET https://aegis-bot.wispbyte.app/api/health",
  },
  {
    id: "news-all",
    name: "13 World Newspapers RSS Feed",
    category: "NEWS",
    method: "GET",
    path: "/api/news",
    description: "Fetches live news headlines from 13 top world newspapers (BBC, NYT, WSJ, Guardian, WaPo, TOI, Yomiuri, etc.).",
    curlExample: "curl -X GET https://aegis-bot.wispbyte.app/api/news?page=1&pageSize=5",
  },
  {
    id: "news-broadcast",
    name: "Dispatch AutoNews Broadcast",
    category: "NEWS",
    method: "POST",
    path: "/api/news/broadcast",
    description: "Triggers immediate news digest dispatch to configured Discord channel.",
    defaultBody: { channelName: "world-news" },
    curlExample: 'curl -X POST https://aegis-bot.wispbyte.app/api/news/broadcast -H "Content-Type: application/json" -d \'{"channelName":"world-news"}\'',
  },
  {
    id: "namestyle-get",
    name: "Get Bot Name Styles Config",
    category: "STYLES",
    method: "GET",
    path: "/api/namestyle",
    description: "Retrieves current Discord nickname font, gradient effect, colors, and REST API payload.",
    curlExample: "curl -X GET https://aegis-bot.wispbyte.app/api/namestyle",
  },
  {
    id: "namestyle-update",
    name: "Update Bot Name & Typography",
    category: "STYLES",
    method: "POST",
    path: "/api/namestyle",
    description: "Updates bot styling parameters and generates simulated Discord REST API v10 PATCH payload.",
    defaultBody: {
      displayName: "AegisMod",
      fontId: "orbitron",
      effectId: "cyberpunk",
      primaryColor: "#00F0FF",
      secondaryColor: "#FF007F",
    },
    curlExample: 'curl -X POST https://aegis-bot.wispbyte.app/api/namestyle -H "Content-Type: application/json" -d \'{"displayName":"AegisMod","fontId":"orbitron","effectId":"cyberpunk","primaryColor":"#00F0FF","secondaryColor":"#FF007F"}\'',
  },
  {
    id: "wispbyte-status",
    name: "Live Server Telemetry",
    category: "WISPBYTE",
    method: "GET",
    path: "/api/wispbyte/status",
    description: "Fetches live CPU, RAM, network throughput, and uptime metrics from Pterodactyl container engine.",
    curlExample: "curl -X GET https://aegis-bot.wispbyte.app/api/wispbyte/status",
  },
  {
    id: "wispbyte-logs",
    name: "Live Console Output Stream",
    category: "WISPBYTE",
    method: "GET",
    path: "/api/wispbyte/logs",
    description: "Retrieves recent server terminal output, moderation events, and Discord gateway logs.",
    curlExample: "curl -X GET https://aegis-bot.wispbyte.app/api/wispbyte/logs",
  },
  {
    id: "memory-guilds",
    name: "Guild Persistent Memory",
    category: "MEMORY",
    method: "GET",
    path: "/api/memory/guilds",
    description: "Returns persistent server configurations, channel bindings, and auto-restored role permissions.",
    curlExample: "curl -X GET https://aegis-bot.wispbyte.app/api/memory/guilds",
  },
];

export const InteractiveApiCenter: React.FC = () => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>("health");
  const [method, setMethod] = useState<"GET" | "POST" | "PATCH">("GET");
  const [path, setPath] = useState<string>("/api/health");
  const [bodyText, setBodyText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseTimeMs, setResponseTimeMs] = useState<number | null>(null);
  const [responseData, setResponseData] = useState<any | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [codeLanguage, setCodeLanguage] = useState<"curl" | "fetch" | "python">("curl");

  const activePreset = API_PRESETS.find((p) => p.id === selectedPresetId) || API_PRESETS[0];

  useEffect(() => {
    if (activePreset) {
      setMethod(activePreset.method);
      setPath(activePreset.path);
      setBodyText(activePreset.defaultBody ? JSON.stringify(activePreset.defaultBody, null, 2) : "");
      setResponseData(null);
      setResponseStatus(null);
      setResponseTimeMs(null);
    }
  }, [selectedPresetId]);

  const handleExecuteRequest = async () => {
    setLoading(true);
    playClickSound();
    const startTime = performance.now();

    try {
      const options: RequestInit = {
        method,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      };

      if ((method === "POST" || method === "PATCH") && bodyText.trim()) {
        try {
          options.body = JSON.stringify(JSON.parse(bodyText));
        } catch {
          options.body = bodyText;
        }
      }

      const res = await fetch(path, options);
      const elapsed = Math.round(performance.now() - startTime);
      setResponseTimeMs(elapsed);
      setResponseStatus(res.status);

      const json = await res.json().catch(() => ({ message: "Non-JSON response received" }));
      setResponseData(json);
      playSuccessSound();
    } catch (err: any) {
      const elapsed = Math.round(performance.now() - startTime);
      setResponseTimeMs(elapsed);
      setResponseStatus(500);
      setResponseData({
        error: "Client Request Failed",
        message: err?.message || String(err),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateCodeSnippet = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://aegis-bot.wispbyte.app";
    const fullUrl = `${origin}${path}`;

    if (codeLanguage === "curl") {
      if (method === "GET") {
        return `curl -X GET "${fullUrl}" \\\n  -H "Accept: application/json"`;
      }
      return `curl -X ${method} "${fullUrl}" \\\n  -H "Content-Type: application/json" \\\n  -d '${bodyText.replace(/\n/g, "").replace(/\s+/g, " ")}'`;
    }

    if (codeLanguage === "fetch") {
      if (method === "GET") {
        return `const res = await fetch("${fullUrl}");\nconst data = await res.json();\nconsole.log(data);`;
      }
      return `const res = await fetch("${fullUrl}", {\n  method: "${method}",\n  headers: { "Content-Type": "application/json" },\n  body: JSON.stringify(${bodyText.trim() || "{}"})\n});\nconst data = await res.json();\nconsole.log(data);`;
    }

    if (codeLanguage === "python") {
      if (method === "GET") {
        return `import requests\n\nresponse = requests.get("${fullUrl}")\nprint(response.json())`;
      }
      return `import requests\n\npayload = ${bodyText.trim() || "{}"}\nresponse = requests.${method.toLowerCase()}("${fullUrl}", json=payload)\nprint(response.json())`;
    }

    return "";
  };

  const filteredPresets = categoryFilter === "ALL" 
    ? API_PRESETS 
    : API_PRESETS.filter((p) => p.category === categoryFilter);

  return (
    <div className="space-y-6">
      {/* Top Header Banner with Dynamic Animation */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-zinc-900 via-indigo-950 to-zinc-900 border border-indigo-500/20 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-indigo-600/30 border border-indigo-400/30 text-indigo-400">
                <Radio className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Live API Lab
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
                  Interactive REST & WebSocket Engine
                </h2>
              </div>
            </div>
            <p className="text-zinc-300 text-sm max-w-2xl leading-relaxed">
              Test live backend endpoints, inspect real-time response latency, generate production code snippets, and dispatch live payloads directly to the AegisMod hybrid server.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-zinc-950/60 backdrop-blur-md border border-zinc-800 rounded-xl p-3">
            <div className="text-right">
              <div className="text-xs text-zinc-400 font-medium">Server Endpoint</div>
              <div className="text-sm font-bold font-mono text-emerald-400">aegis-bot.wispbyte.app</div>
            </div>
            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_12px_#10b981] animate-ping" />
          </div>
        </div>

        {/* Category Filters */}
        <div className="relative z-10 flex items-center gap-2 mt-6 overflow-x-auto pb-1">
          {["ALL", "SYSTEM", "MODERATION", "NEWS", "STYLES", "MEMORY", "WISPBYTE"].map((cat) => (
            <button
              key={cat}
              onClick={() => {
                playClickSound();
                setCategoryFilter(cat);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                categoryFilter === cat
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 ring-2 ring-indigo-400/50"
                  : "bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Preset Catalog */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Available Endpoints ({filteredPresets.length})
            </span>
            <span className="text-xs text-indigo-600 font-semibold">1-Click Load</span>
          </div>

          <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
            {filteredPresets.map((preset) => {
              const isSelected = preset.id === selectedPresetId;
              return (
                <motion.div
                  key={preset.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => {
                    playClickSound();
                    setSelectedPresetId(preset.id);
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-white border-indigo-500 shadow-md ring-2 ring-indigo-500/20"
                      : "bg-white hover:bg-zinc-50 border-zinc-200"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-mono ${
                        preset.method === "GET"
                          ? "bg-emerald-100 text-emerald-700"
                          : preset.method === "POST"
                          ? "bg-indigo-100 text-indigo-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {preset.method}
                    </span>
                    <span className="text-[11px] font-semibold text-zinc-400 font-mono truncate">
                      {preset.path}
                    </span>
                  </div>
                  <div className="font-bold text-sm text-zinc-900">{preset.name}</div>
                  <p className="text-xs text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
                    {preset.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Interactive Request & Live Response Console */}
        <div className="lg:col-span-8 space-y-5">
          {/* Request Builder Card */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <span className="font-bold text-sm text-zinc-900">Request Configurator</span>
              </div>
              <span className="text-xs text-zinc-500 font-medium">Target: Local / Remote Proxy</span>
            </div>

            {/* Method + Path Bar */}
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as any)}
                className="px-3 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl font-mono text-xs font-bold text-zinc-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PATCH">PATCH</option>
              </select>

              <div className="flex-1 relative">
                <input
                  type="text"
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                  placeholder="/api/..."
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl font-mono text-xs text-zinc-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleExecuteRequest}
                disabled={loading}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-indigo-200 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Executing...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Request</span>
                  </>
                )}
              </motion.button>
            </div>

            {/* Request Body (For POST/PATCH) */}
            {(method === "POST" || method === "PATCH") && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span className="font-semibold">JSON Request Body (application/json)</span>
                  <span>Formatted JSON</span>
                </div>
                <textarea
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  rows={4}
                  className="w-full p-3 bg-zinc-900 text-zinc-100 font-mono text-xs rounded-xl border border-zinc-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  placeholder='{"key": "value"}'
                />
              </div>
            )}
          </div>

          {/* Response Console */}
          <div className="bg-zinc-950 rounded-2xl border border-zinc-800 shadow-xl overflow-hidden">
            {/* Console Toolbar */}
            <div className="bg-zinc-900/90 border-b border-zinc-800 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-xs font-mono font-bold text-zinc-300">Live HTTP Response</span>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono">
                {responseStatus !== null && (
                  <span
                    className={`px-2 py-0.5 rounded-md font-bold ${
                      responseStatus >= 200 && responseStatus < 300
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-red-500/20 text-red-400 border border-red-500/30"
                    }`}
                  >
                    HTTP {responseStatus}
                  </span>
                )}

                {responseTimeMs !== null && (
                  <span className="text-zinc-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                    {responseTimeMs} ms
                  </span>
                )}

                {responseData && (
                  <button
                    onClick={() => handleCopyCode(JSON.stringify(responseData, null, 2))}
                    className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    title="Copy Response JSON"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            </div>

            {/* Console Body */}
            <div className="p-4 max-h-72 overflow-y-auto font-mono text-xs leading-relaxed">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 text-zinc-500 space-y-3">
                  <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
                  <span>Awaiting server response...</span>
                </div>
              ) : responseData ? (
                <pre className="text-emerald-400 whitespace-pre-wrap break-all">
                  {JSON.stringify(responseData, null, 2)}
                </pre>
              ) : (
                <div className="text-center py-12 text-zinc-600">
                  <Terminal className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Select an endpoint preset or configure the bar above and click "Send Request".</p>
                </div>
              )}
            </div>
          </div>

          {/* Code Snippet Generator */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-indigo-600" />
                <span className="font-bold text-sm text-zinc-900">Production Code Snippets</span>
              </div>

              <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl">
                {(["curl", "fetch", "python"] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      playClickSound();
                      setCodeLanguage(lang);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      codeLanguage === lang
                        ? "bg-white text-indigo-700 shadow-xs"
                        : "text-zinc-500 hover:text-zinc-900"
                    }`}
                  >
                    {lang === "curl" ? "cURL" : lang === "fetch" ? "JavaScript (Fetch)" : "Python"}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <pre className="bg-zinc-900 text-zinc-200 p-4 rounded-xl font-mono text-xs overflow-x-auto">
                {generateCodeSnippet()}
              </pre>
              <button
                onClick={() => handleCopyCode(generateCodeSnippet())}
                className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
