import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Code2,
  Key,
  Globe,
  Server,
  Zap,
  Play,
  RotateCw,
  Copy,
  Check,
  Terminal,
  Radio,
  ExternalLink,
  ShieldCheck,
  Layers,
  Database,
  Sliders,
  Send,
  Sparkles,
} from "lucide-react";
import { WispbyteApiEndpointDoc, WispbyteApiTestResponse } from "../../types/wispbyteApi";
import { playClickSound, playSuccessSound } from "../../utils/soundEffects";

export const WispbyteApiExplorer: React.FC = () => {
  const [endpoints, setEndpoints] = useState<WispbyteApiEndpointDoc[]>([]);
  const [selectedEndpointId, setSelectedEndpointId] = useState<string>("get-server");
  const [apiKey, setApiKey] = useState<string>("ptlc_demo_live_client_key_9a8b7c");
  const [powerSignal, setPowerSignal] = useState<string>("restart");
  const [consoleCommand, setConsoleCommand] = useState<string>("status");
  const [loadingTest, setLoadingTest] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<WispbyteApiTestResponse | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [codeTab, setCodeTab] = useState<"curl" | "fetch">("curl");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    fetch("/api/wispbyte/api-docs")
      .then((res) => res.json())
      .then((data) => {
        if (data.endpoints) {
          setEndpoints(data.endpoints);
        }
      })
      .catch((err) => console.error("Failed to load Wispbyte API docs:", err));
  }, []);

  const selectedEndpoint = endpoints.find((e) => e.id === selectedEndpointId) || endpoints[0];

  const handleRunApiTest = async () => {
    setLoadingTest(true);
    playClickSound();
    try {
      const res = await fetch("/api/wispbyte/client-api/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpointId: selectedEndpointId,
          customApiKey: apiKey,
          customSignal: powerSignal,
          customCommand: consoleCommand,
        }),
      });
      const data: WispbyteApiTestResponse = await res.json();
      setTestResult(data);
      playSuccessSound();
      showToast(`API call executed successfully (${data.durationMs}ms)`);
    } catch (err: any) {
      console.error("API test error:", err);
      showToast("API test failed: " + err.message);
    } finally {
      setLoadingTest(false);
    }
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    playClickSound();
    setCopiedCode(type);
    showToast(`${type} copied to clipboard!`);
    setTimeout(() => setCopiedCode(null), 2000);
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

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-zinc-900 via-indigo-950 to-zinc-900 rounded-3xl p-6 text-white border border-zinc-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold mb-2">
              <Key className="w-3.5 h-3.5 text-indigo-400" />
              <span>Wispbyte Pterodactyl Client REST API</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white">
              Wispbyte Dashboard & Server API Explorer
            </h2>
            <p className="text-zinc-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Interact directly with the Wispbyte hosting control panel. Fetch live telemetry, execute power actions, query network allocations on <strong className="text-white">aegisbot.wispbyte.app:10734</strong>, and stream console WebSockets.
            </p>
          </div>

          <div className="bg-zinc-800/80 backdrop-blur-md border border-zinc-700 p-4 rounded-2xl flex flex-col gap-2 min-w-[240px]">
            <div className="text-[10px] uppercase font-bold text-zinc-400">Panel Endpoint Base</div>
            <div className="font-mono text-xs text-indigo-300 font-bold flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>https://panel.wispbyte.net</span>
            </div>
            <div className="text-[11px] text-zinc-400 flex items-center justify-between pt-2 border-t border-zinc-700/60 font-mono">
              <span>Port: 10734</span>
              <span>ID: c8f2a1b9</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Endpoint Selector (Left) + Interactive Console / Tester (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Endpoints List & Credentials */}
        <div className="lg:col-span-4 space-y-4">
          {/* API Key Input */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-indigo-600" />
                <span>Wispbyte Client API Key</span>
              </label>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 font-semibold">
                Authorization: Bearer
              </span>
            </div>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="ptlc_your_client_api_key"
              className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-zinc-200 bg-zinc-50 focus:outline-none focus:border-indigo-500"
            />
            <p className="text-[11px] text-zinc-500">
              Obtain from <strong className="text-zinc-700">Wispbyte Panel &gt; Account &gt; API Credentials</strong>.
            </p>
          </div>

          {/* Endpoints List */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-4 shadow-sm space-y-2">
            <div className="text-xs font-bold text-zinc-900 pb-2 border-b border-zinc-100 flex items-center justify-between">
              <span>Client API Endpoints</span>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded">
                {endpoints.length} Routes
              </span>
            </div>

            <div className="space-y-1.5">
              {endpoints.map((ep) => {
                const isSelected = ep.id === selectedEndpointId;
                const methodColor =
                  ep.method === "GET"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : ep.method === "POST"
                    ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                    : "bg-amber-50 text-amber-700 border-amber-200";

                return (
                  <button
                    key={ep.id}
                    onClick={() => {
                      playClickSound();
                      setSelectedEndpointId(ep.id);
                      setTestResult(null);
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? "bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-50 text-zinc-900 shadow-xs"
                        : "bg-zinc-50/50 hover:bg-zinc-100/70 border-zinc-200/80 text-zinc-700"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-black border ${methodColor}`}
                        >
                          {ep.method}
                        </span>
                        <span className="font-bold text-xs truncate">{ep.title}</span>
                      </div>
                      <div className="text-[11px] font-mono text-zinc-500 truncate mt-1">
                        {ep.path}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Endpoint Inspector & Interactive Runner */}
        <div className="lg:col-span-8 space-y-6">
          {selectedEndpoint && (
            <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-zinc-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                        selectedEndpoint.method === "GET"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-indigo-100 text-indigo-800"
                      }`}
                    >
                      {selectedEndpoint.method}
                    </span>
                    <h3 className="text-base font-bold text-zinc-900">
                      {selectedEndpoint.title}
                    </h3>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">{selectedEndpoint.description}</p>
                </div>

                <button
                  onClick={handleRunApiTest}
                  disabled={loadingTest}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-indigo-100 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {loadingTest ? (
                    <RotateCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4 fill-current" />
                  )}
                  <span>{loadingTest ? "Sending Request..." : "Execute API Call"}</span>
                </button>
              </div>

              {/* Endpoint Path & Headers */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 bg-zinc-900 text-zinc-100 p-3 rounded-xl font-mono text-xs overflow-x-auto">
                  <span className="text-emerald-400 font-bold">{selectedEndpoint.method}</span>
                  <span className="text-zinc-300">https://panel.wispbyte.net{selectedEndpoint.path}</span>
                </div>

                {/* Custom Body inputs if POST */}
                {selectedEndpoint.id === "post-power" && (
                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 space-y-2">
                    <label className="text-xs font-bold text-zinc-900 block">Power Signal Parameter</label>
                    <div className="flex gap-2 flex-wrap">
                      {["start", "stop", "restart", "kill"].map((sig) => (
                        <button
                          key={sig}
                          type="button"
                          onClick={() => setPowerSignal(sig)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                            powerSignal === sig
                              ? "bg-indigo-600 text-white"
                              : "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                          }`}
                        >
                          signal: "{sig}"
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {selectedEndpoint.id === "post-command" && (
                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 space-y-2">
                    <label className="text-xs font-bold text-zinc-900 block">Console Command</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={consoleCommand}
                        onChange={(e) => setConsoleCommand(e.target.value)}
                        placeholder="e.g. status, ping, help"
                        className="flex-1 px-3 py-1.5 text-xs font-mono rounded-lg border border-zinc-200 bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Code Snippets (Curl / Fetch) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCodeTab("curl")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        codeTab === "curl"
                          ? "bg-zinc-900 text-white"
                          : "bg-zinc-100 text-zinc-600 hover:text-zinc-900"
                      }`}
                    >
                      cURL
                    </button>
                    <button
                      onClick={() => setCodeTab("fetch")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        codeTab === "fetch"
                          ? "bg-zinc-900 text-white"
                          : "bg-zinc-100 text-zinc-600 hover:text-zinc-900"
                      }`}
                    >
                      JavaScript / Node.js
                    </button>
                  </div>

                  <button
                    onClick={() =>
                      handleCopy(
                        codeTab === "curl" ? selectedEndpoint.curlSnippet : selectedEndpoint.jsSnippet,
                        codeTab === "curl" ? "cURL snippet" : "JavaScript snippet"
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? "Copied!" : "Copy Code"}</span>
                  </button>
                </div>

                <pre className="p-4 rounded-xl bg-zinc-900 text-emerald-400 font-mono text-xs overflow-x-auto leading-relaxed border border-zinc-800">
                  <code>{codeTab === "curl" ? selectedEndpoint.curlSnippet : selectedEndpoint.jsSnippet}</code>
                </pre>
              </div>

              {/* Live Response Card */}
              {testResult && (
                <div className="space-y-3 pt-4 border-t border-zinc-100">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-900">Live API Response</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          testResult.statusCode === 200
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        HTTP {testResult.statusCode} OK
                      </span>
                      <span className="text-[11px] font-mono text-zinc-500">
                        {testResult.durationMs}ms
                      </span>
                    </div>

                    <button
                      onClick={() => handleCopy(JSON.stringify(testResult.data, null, 2), "Response JSON")}
                      className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy JSON</span>
                    </button>
                  </div>

                  <pre className="p-4 rounded-xl bg-zinc-950 text-indigo-300 font-mono text-xs overflow-x-auto max-h-80 border border-zinc-800 leading-relaxed select-all">
                    <code>{JSON.stringify(testResult.data, null, 2)}</code>
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
