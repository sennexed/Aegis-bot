import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Send,
  AlertOctagon,
  CheckCircle,
  AlertTriangle,
  Clock,
  Coins,
  ShieldCheck,
  Zap,
  Info,
  Layers,
  Trash2,
  Lock,
  UserX,
  Bell,
  RotateCcw,
} from "lucide-react";
import { AIModerationResult } from "../types";
import {
  playClickSound,
  playAlertSound,
  playMessagePop,
  playSuccessChime,
} from "../utils/soundEffects";

const PRESET_MESSAGES = [
  {
    label: "Harmless Banter (Clean)",
    author: "GamerKid16",
    content: "ggwp that was a crazy clutch bro let's queue up again",
    expected: "Fast Triage Pass (0 Tokens)",
  },
  {
    label: "AutoMod: Invite Link Spam",
    author: "RaidBot",
    content: "Join our active trading server discord.gg/free-nitro-deals right now!!",
    expected: "AutoMod: INVITE_LINK_SPAM (DELETE)",
  },
  {
    label: "AutoMod: Phishing / Scam Domain",
    author: "SteamScammer",
    content: "Claim 3 months of free Discord Nitro here: https://discrod-app.gift/claim-nitro",
    expected: "AutoMod: PHISHING_OR_SCAM (24H TIMEOUT)",
  },
  {
    label: "AutoMod: Glitch / Zalgo Lag Text",
    author: "Lagger",
    content: "h̷̛̰ḛ̸̡l̵̡̰l̵̡̰o̵̡̰ t̷̛̰h̷̛̰ḛ̸̡r̸̡̰ḛ̵̡ crash your discord app",
    expected: "AutoMod: GLITCH_OR_ZALGO (DELETE)",
  },
  {
    label: "Cyberbullying / Mockery",
    author: "ToxicUser",
    content: "Nobody in this server likes you, you're pathetic. Log off and never come back.",
    expected: "AI: CYBERBULLYING (DELETE)",
  },
  {
    label: "Profanity Bypass (Spaced)",
    author: "SneakyTroll",
    content: "f.u.c.k y.o.u dumb idiot get out of here",
    expected: "AI: SEVERE_PROFANITY_OR_ABUSE (DELETE)",
  },
  {
    label: "Hindi / Hinglish Cuss (Local)",
    author: "DesiPlayer",
    content: "madarchod stop trolling this chat bsdk",
    expected: "AutoMod: Hindi (DELETE)",
  },
  {
    label: "Hindi Devanagari (Local)",
    author: "DelhiGamer",
    content: "चूतिया साले चुप बैठ मादरचोद",
    expected: "AutoMod: Hindi Devanagari (DELETE)",
  },
  {
    label: "Russian Mat / Romanized (Local)",
    author: "CSGOPusher",
    content: "cyka blyat idiot uninstall the game",
    expected: "AutoMod: Russian Mat (DELETE)",
  },
  {
    label: "Russian Mat / Cyrillic (Local)",
    author: "DotaRus",
    content: "пошел нахуй сука блять",
    expected: "AutoMod: Russian Cyrillic (DELETE)",
  },
  {
    label: "Arabic / Arabizi (Local)",
    author: "GulfGamer",
    content: "kos omk ya sharmouta get out of here",
    expected: "AutoMod: Arabic Arabizi (DELETE)",
  },
  {
    label: "Arabic Script (Local)",
    author: "ArabPro",
    content: "كس أمك يا شرموطة كل خرا",
    expected: "AutoMod: Arabic (DELETE)",
  },
  {
    label: "Spanish Cuss (Local)",
    author: "LatamKing",
    content: "hijo de puta vete a la mierda cabron",
    expected: "AutoMod: Spanish (DELETE)",
  },
  {
    label: "Predatory / Grooming Attempt",
    author: "SuspiciousAdult",
    content: "Hey how old are you? Drop your snapchat and send a selfie in my DMs, keep it secret.",
    expected: "AI: PREDATORY (BAN + PING)",
  },
  {
    label: "Self-Harm Incitement",
    author: "EdgyTeen",
    content: "Nobody would care if you die, go kys loser",
    expected: "AI/Regex: SELF_HARM (24H TIMEOUT)",
  },
  {
    label: "Doxxing / Real Location",
    author: "Exposer99",
    content: "His real name is Ethan Miller and he goes to Lincoln High School on 5th Ave.",
    expected: "AI: DOXXING_OR_PII (24H TIMEOUT)",
  },
];

export const LiveModerationTester: React.FC = () => {
  const [content, setContent] = useState(
    "ggwp that was a crazy clutch bro let's queue up again"
  );
  const [author, setAuthor] = useState("TeenUser16");
  const [bypassTriage, setBypassTriage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIModerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [simulatedAction, setSimulatedAction] = useState<string | null>(null);
  const [isDeleted, setIsDeleted] = useState(false);

  const handleTest = async (testContent?: string, testAuthor?: string) => {
    const textToTest = testContent ?? content;
    const authorToTest = testAuthor ?? author;

    if (!textToTest.trim()) return;

    playClickSound();
    setLoading(true);
    setError(null);
    setSimulatedAction(null);
    setIsDeleted(false);

    try {
      const res = await fetch("/api/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: textToTest,
          author: authorToTest,
          bypassTriage,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();
      setResult(data);
      if (data.flagged) {
        playAlertSound();
      } else {
        playSuccessChime();
      }
    } catch (err: any) {
      console.error("Moderation test error:", err);
      setError(err.message || "Failed to analyze message");
      playAlertSound();
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateDelete = () => {
    playAlertSound();
    setIsDeleted(true);
    setSimulatedAction("Message successfully purged from Discord channel with audit trail.");
  };

  const handleSimulateTimeout = () => {
    playAlertSound();
    setSimulatedAction(`Applied 1-Hour Timeout to @${author}. Restorative cooldown active.`);
  };

  const handleSimulateDM = () => {
    playMessagePop();
    setSimulatedAction(`Dispatched private DM warning explaining Teen-Safety guidelines to @${author}.`);
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">CRITICAL</span>;
      case "HIGH":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200">HIGH</span>;
      case "MEDIUM":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-200">MEDIUM</span>;
      case "LOW":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">LOW</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">SAFE (NONE)</span>;
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "BAN":
        return <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-600 text-white shadow-sm">PERMANENT BAN</span>;
      case "TIMEOUT_24H":
        return <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-orange-600 text-white shadow-sm">24-HOUR TIMEOUT</span>;
      case "TIMEOUT_1H":
        return <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-600 text-white shadow-sm">1-HOUR TIMEOUT</span>;
      case "DELETE":
        return <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-yellow-600 text-white shadow-sm">DELETE MESSAGE</span>;
      case "WARN":
        return <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-600 text-white shadow-sm">DM WARNING</span>;
      default:
        return <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 text-white shadow-sm">ALLOW MESSAGE</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              Live AI Moderation Sandbox
            </h2>
            <p className="text-xs text-zinc-500 mt-1">
              Test real Discord messages against the live Gemini 3.1 Flash-Lite backend and see real-time Triage tier decisions, token efficiency stats, and the generated Discord Embed log.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-xs font-medium text-zinc-700 bg-zinc-50 px-3 py-1.5 rounded-lg border border-zinc-200 cursor-pointer">
              <input
                type="checkbox"
                checked={bypassTriage}
                onChange={(e) => setBypassTriage(e.target.checked)}
                className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Force Gemini Call (Bypass Triage)</span>
            </label>
          </div>
        </div>

        {/* Multilingual Support Banner */}
        <div className="mt-3 px-3 py-2 rounded-lg bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2 text-emerald-800 font-medium">
            <span className="text-base">🌍</span>
            <span><strong>Multilingual Local Speech Filter Active:</strong> Zero-token protection against local cuss words in Hindi/Hinglish, Russian Mat, Arabic/Arabizi, Spanish, Tagalog & more.</span>
          </div>
          <span className="text-[11px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold">Tier-1 Native Filter</span>
        </div>

        {/* Quick Presets */}
        <div className="mt-4 pt-4 border-t border-zinc-100">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-2">
            Sample Community Test Cases (~16 Y/O Server Scenarios):
          </span>
          <div className="flex flex-wrap gap-2">
            {PRESET_MESSAGES.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setContent(preset.content);
                  setAuthor(preset.author);
                  handleTest(preset.content, preset.author);
                }}
                className="text-xs px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200/80 active:bg-zinc-300 text-zinc-800 font-medium transition-colors text-left flex items-center gap-1.5 border border-zinc-200"
              >
                <span>{preset.label}</span>
                <span className="text-[10px] text-zinc-500">({preset.expected})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Multi-Tier Triage Visualizer */}
        <div className="mt-5 p-4 rounded-xl bg-zinc-50 border border-zinc-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-zinc-700 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-600" />
              Real-Time Moderation Pipeline Flow
            </span>
            <span className="text-[10px] text-zinc-400 uppercase font-mono tracking-wider">
              {loading ? "Processing..." : result ? `Stage: ${result.source}` : "Idle Ready"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Stage 1 */}
            <div
              className={`p-3 rounded-xl border transition-all ${
                loading
                  ? "bg-indigo-50/50 border-indigo-300 animate-pulse"
                  : result?.source === "TIER_1_LOCAL_TRIAGE" ||
                    (result?.source?.includes("STANDARD_AUTOMOD") &&
                      result?.category !== "PHISHING_OR_SCAM" &&
                      result?.category !== "INVITE_LINK_SPAM")
                  ? "bg-emerald-50 border-emerald-300 ring-2 ring-emerald-200"
                  : "bg-white border-zinc-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-zinc-400 uppercase">Stage 1</span>
                <Zap className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <span className="text-xs font-bold text-zinc-900 block mt-1">Local Regex & Keywords</span>
              <span className="text-[10px] text-zinc-500 block mt-0.5">&lt; 1ms latency • 0 tokens</span>
            </div>

            {/* Stage 2 */}
            <div
              className={`p-3 rounded-xl border transition-all ${
                loading
                  ? "bg-indigo-50/50 border-indigo-300 animate-pulse [animation-delay:0.15s]"
                  : result?.category === "PHISHING_OR_SCAM" || result?.category === "INVITE_LINK_SPAM"
                  ? "bg-orange-50 border-orange-300 ring-2 ring-orange-200"
                  : "bg-white border-zinc-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-zinc-400 uppercase">Stage 2</span>
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
              </div>
              <span className="text-xs font-bold text-zinc-900 block mt-1">Anti-Phishing & Invites</span>
              <span className="text-[10px] text-zinc-500 block mt-0.5">Automated Link Quarantine</span>
            </div>

            {/* Stage 3 */}
            <div
              className={`p-3 rounded-xl border transition-all ${
                loading
                  ? "bg-indigo-50/50 border-indigo-300 animate-pulse [animation-delay:0.3s]"
                  : result?.source === "TIER_3_GEMINI_AI"
                  ? "bg-indigo-50 border-indigo-300 ring-2 ring-indigo-200"
                  : "bg-white border-zinc-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-zinc-400 uppercase">Stage 3</span>
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              </div>
              <span className="text-xs font-bold text-zinc-900 block mt-1">Gemini 3.8 Flash AI</span>
              <span className="text-[10px] text-zinc-500 block mt-0.5">Deep Semantic Context & Slang</span>
            </div>
          </div>
        </div>

        {/* Message Input Form */}
        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Author Name / Tag</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="e.g. GamerKid16"
                className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-zinc-50"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Discord Message Content
              </label>
              <div className="relative">
                <textarea
                  rows={2}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter message content to test against teen safety guidelines..."
                  className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-zinc-50 font-sans"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-zinc-400">
              Target Audience: Teen-Safe Online Community (~16 years old)
            </span>
            <button
              id="run-moderation-test-btn"
              onClick={() => handleTest()}
              disabled={loading || !content.trim()}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all cursor-pointer disabled:opacity-50 active:scale-95"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Analyzing with Gemini...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Run Moderation Pipeline</span>
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Results View */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6"
        >
          {/* Left Column: Metrics & Evaluation Analysis */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-base font-bold text-zinc-900">Pipeline Verdict</h3>
                </div>
                <div>{getSeverityBadge(result.severity)}</div>
              </div>

              {/* Status Banner */}
              <div
                className={`p-4 rounded-xl border flex items-start gap-3 ${
                  result.flagged
                    ? "bg-red-50/70 border-red-200 text-red-900"
                    : "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                }`}
              >
                {result.flagged ? (
                  <AlertOctagon className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="text-sm font-bold">
                    {result.flagged ? `Violation Detected: ${result.category}` : "Content Approved — Clean"}
                  </div>
                  <div className="text-xs mt-1 leading-relaxed opacity-90">{result.reason}</div>
                </div>
              </div>

              {/* Stat Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-center">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">Triage Stage</span>
                  <span className="text-xs font-bold text-zinc-800 mt-1 block">
                    {result.source === "TIER_1_LOCAL_TRIAGE" ? "Tier 1: Fast Filter" : "Tier 3: Gemini 3.8"}
                  </span>
                </div>

                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-center">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">Tokens Used</span>
                  <span
                    className={`text-xs font-bold mt-1 block ${
                      result.tokensUsed === 0 ? "text-emerald-600" : "text-indigo-600"
                    }`}
                  >
                    {result.tokensUsed} tokens {result.tokensUsed === 0 && "(Free!)"}
                  </span>
                </div>

                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-center">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">Latency</span>
                  <span className="text-xs font-bold text-zinc-800 mt-1 block">{result.latencyMs} ms</span>
                </div>
              </div>

              {/* Action Taken */}
              <div>
                <span className="text-xs font-semibold text-zinc-500 block mb-2">
                  Recommended Automated Action:
                </span>
                <div className="flex items-center gap-2">{getActionBadge(result.recommendedAction)}</div>
              </div>

              {/* Interactive Simulation Controls */}
              <div className="pt-3 border-t border-zinc-100">
                <span className="text-xs font-semibold text-zinc-500 block mb-2">
                  Interactive Moderator Action Simulator:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleSimulateDelete}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Purge Message</span>
                  </button>

                  <button
                    onClick={handleSimulateTimeout}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Apply 1h Timeout</span>
                  </button>

                  <button
                    onClick={handleSimulateDM}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>Send Guideline DM</span>
                  </button>
                </div>

                {simulatedAction && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>{simulatedAction}</span>
                  </motion.div>
                )}
              </div>

              {/* Teenage Community Notes */}
              {result.ageAppropriateNotes && (
                <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-xs text-indigo-950">
                  <span className="font-bold flex items-center gap-1 mb-1 text-indigo-900">
                    <Info className="w-3.5 h-3.5" /> Teen-Safety Guideline Note:
                  </span>
                  <p>{result.ageAppropriateNotes}</p>
                </div>
              )}

              {/* Highlighted offensive words */}
              {result.highlightedPhrases && result.highlightedPhrases.length > 0 && (
                <div>
                  <span className="text-xs font-semibold text-zinc-500 block mb-1.5">
                    Flagged Words / Substrings:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {result.highlightedPhrases.map((phrase, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-red-100 text-red-800 font-mono text-[11px] font-semibold"
                      >
                        {phrase}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Live Discord Client Simulation of #mod-logs */}
          <div className="lg:col-span-6">
            <div className="bg-[#313338] rounded-2xl p-5 border border-zinc-700 shadow-md text-zinc-200 font-sans">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-700/60">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-400 font-bold text-lg">#</span>
                  <span className="text-sm font-bold text-zinc-100">mod-logs</span>
                  <span className="text-[10px] bg-zinc-700 text-zinc-300 px-1.5 py-0.5 rounded font-mono">
                    staff-only
                  </span>
                </div>
                <span className="text-[11px] text-zinc-400">Live Discord Embed Preview</span>
              </div>

              {/* Bot Message Header */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-indigo-300">AegisMod</span>
                    <span className="bg-[#5865F2] text-[10px] text-white font-bold px-1 rounded">BOT</span>
                    <span className="text-xs text-zinc-400">Today at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  {/* Discord Embed Box */}
                  <div
                    className={`mt-2 rounded-md p-4 bg-[#2b2d31] border-l-4 text-xs space-y-3 ${
                      result.severity === "CRITICAL"
                        ? "border-l-[#ed4245]"
                        : result.severity === "HIGH"
                        ? "border-l-[#e67e22]"
                        : result.severity === "MEDIUM"
                        ? "border-l-[#f1c40f]"
                        : result.severity === "LOW"
                        ? "border-l-[#5865f2]"
                        : "border-l-[#57f287]"
                    }`}
                  >
                    <div className="font-bold text-sm text-white flex items-center justify-between">
                      <span>
                        {result.flagged
                          ? `🤖 AI Moderation Action: ${result.recommendedAction}`
                          : "✅ Content Passed Audit Check"}
                      </span>
                    </div>

                    <div className="text-zinc-300">
                      <span className="text-zinc-400">Author: </span>
                      <span className="text-indigo-400 font-medium">@{author}</span>
                      <span className="text-zinc-500 ml-2">(ID: 839219482103810)</span>
                    </div>

                    {/* Message Box with optional delete disintegration animation */}
                    {isDeleted ? (
                      <div className="bg-[#1e1f22] p-2.5 rounded font-mono text-[11px] text-red-400 border border-red-900/60 italic flex items-center gap-2">
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>[Content removed by Moderator: Purged from Discord channel]</span>
                      </div>
                    ) : (
                      <div className="bg-[#1e1f22] p-2.5 rounded font-mono text-[11px] text-zinc-200 border border-zinc-800">
                        {content}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <span className="text-zinc-400 text-[10px] uppercase font-bold block">Violation</span>
                        <span className="font-medium text-white">{result.category}</span>
                      </div>
                      <div>
                        <span className="text-zinc-400 text-[10px] uppercase font-bold block">Severity</span>
                        <span className="font-medium text-white">{result.severity}</span>
                      </div>
                      <div>
                        <span className="text-zinc-400 text-[10px] uppercase font-bold block">Confidence</span>
                        <span className="font-medium text-white">
                          {Math.round((result.confidence || 0.95) * 100)}%
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-400 text-[10px] uppercase font-bold block">Channel</span>
                        <span className="font-medium text-indigo-400">#general-chat</span>
                      </div>
                    </div>

                    <div className="pt-1 border-t border-zinc-700/60">
                      <span className="text-zinc-400 text-[10px] uppercase font-bold block">Audit Reason</span>
                      <p className="text-zinc-300 text-[11px] mt-0.5">{result.reason}</p>
                    </div>

                    <div className="text-[10px] text-zinc-400 pt-1 flex items-center justify-between">
                      <span>AegisMod AI Engine • Powered by Gemini 3.8 Flash</span>
                      <span>{result.tokensUsed} tokens</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
