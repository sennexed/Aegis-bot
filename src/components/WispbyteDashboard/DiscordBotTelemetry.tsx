import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Users,
  Hash,
  Sparkles,
  Zap,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Flame,
  Send,
  RotateCw,
} from "lucide-react";
import { WispbyteBotDetails } from "../../types";

export interface TelemetryEvent {
  id: string;
  timestamp: string;
  author: string;
  avatar: string;
  content: string;
  flagged: boolean;
  category: string;
  severity: string;
  recommendedAction: string;
  reason: string;
  source: string;
  tokensUsed: number;
  latencyMs: number;
  highlightedPhrases?: string[];
}

interface DiscordBotTelemetryProps {
  botDetails: WispbyteBotDetails;
  events: TelemetryEvent[];
  onTestMessage: (content: string, author?: string) => Promise<void>;
}

export const DiscordBotTelemetry: React.FC<DiscordBotTelemetryProps> = ({
  botDetails,
  events,
  onTestMessage,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState("");
  const [inputAuthor, setInputAuthor] = useState("Alex#1604");
  const [isEvaluating, setIsEvaluating] = useState(false);

  const sampleGuilds = [
    {
      id: "g1",
      name: "Teen Gamers Lounge (~16)",
      members: 1420,
      channels: 28,
      icon: "🎮",
      activeStatus: "Guarded",
      policy: "STRICT_TEEN",
    },
    {
      id: "g2",
      name: "High School Esports Hub",
      members: 980,
      channels: 18,
      icon: "🏆",
      activeStatus: "Guarded",
      policy: "STRICT_TEEN",
    },
    {
      id: "g3",
      name: "Chill Beats & Study Hall",
      members: 640,
      channels: 14,
      icon: "🎧",
      activeStatus: "Guarded",
      policy: "STANDARD",
    },
    {
      id: "g4",
      name: "Anime & Creative Lounge",
      members: 380,
      channels: 12,
      icon: "🎨",
      activeStatus: "Guarded",
      policy: "STRICT_TEEN",
    },
  ];

  const presets = [
    { label: "Benign Gaming Banter", text: "bro that aim was trash lol gg ez", author: "GamerKid#881" },
    { label: "Anti-Invite Scam Link", text: "join my server now discord.gg/free-nitro-100", author: "SpamBot#992" },
    { label: "Phishing Domain", text: "Claim 1 month nitro gift: http://discorcl-app.gift/claim", author: "PhishUser#442" },
    { label: "Severe Cyberbullying", text: "nobody likes you here, delete your account and kys", author: "ToxicTroll#001" },
    { label: "Predatory Grooming", text: "hey how old are you, drop your private snap secretly", author: "SuspiciousGuest#554" },
    { label: "Harmless School Chat", text: "can anyone share the chemistry homework notes?", author: "Student#303" },
  ];

  const handleTestSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || isEvaluating) return;
    setIsEvaluating(true);
    try {
      await onTestMessage(inputMessage.trim(), inputAuthor);
      setInputMessage("");
    } finally {
      setIsEvaluating(false);
    }
  };

  const getActionPill = (action: string, flagged: boolean) => {
    if (!flagged) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> ALLOWED
        </span>
      );
    }
    switch (action) {
      case "BAN":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white flex items-center gap-1 shadow-sm">
            <Flame className="w-3 h-3" /> BANNED
          </span>
        );
      case "TIMEOUT_24H":
      case "TIMEOUT_1H":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200 flex items-center gap-1">
            <Clock className="w-3 h-3" /> TIMEOUT
          </span>
        );
      case "DELETE":
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> DELETED
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Live Intercept Tester Card */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Live Bot Intercept Simulator
            </h3>
            <p className="text-xs text-zinc-500">
              Send a test message through AegisMod to test Tier-1 AutoMod regex & Gemini 3.8 Flash moderation in real time.
            </p>
          </div>
          <span className="text-[11px] font-mono px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-semibold self-start sm:self-auto">
            Zero-Token Local Filter Active
          </span>
        </div>

        {/* Preset Chips */}
        <div className="flex items-center gap-1.5 flex-wrap mb-3.5">
          <span className="text-[11px] font-semibold text-zinc-400 mr-1">Presets:</span>
          {presets.map((p) => (
            <button
              key={p.label}
              onClick={() => {
                setInputMessage(p.text);
                setInputAuthor(p.author);
              }}
              className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-indigo-50 hover:text-indigo-700 text-zinc-700 transition-colors border border-zinc-200/60 cursor-pointer"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <form onSubmit={handleTestSubmit} className="flex flex-col sm:flex-row items-center gap-2">
          <input
            type="text"
            value={inputAuthor}
            onChange={(e) => setInputAuthor(e.target.value)}
            placeholder="Username#0000"
            className="w-full sm:w-44 px-3 py-2 text-xs rounded-xl border border-zinc-200 focus:outline-none focus:border-indigo-500 font-mono bg-zinc-50/50"
          />
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type message content to evaluate against teen community safety..."
            className="flex-1 w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isEvaluating}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            {isEvaluating ? (
              <RotateCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>Intercept Test</span>
          </button>
        </form>
      </div>

      {/* 2. Grid: Monitored Guilds & Live Moderation Events Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Monitored Discord Guilds */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                Guarded Communities
              </h3>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                {botDetails.guildsCount} Servers
              </span>
            </div>
            <p className="text-xs text-zinc-500 mb-4">
              Discord servers with AegisMod installed and active message interception.
            </p>

            <div className="space-y-2.5">
              {sampleGuilds.map((g) => (
                <div
                  key={g.id}
                  className="p-3 rounded-xl border border-zinc-100 bg-zinc-50/70 hover:bg-white hover:border-indigo-200 transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100/70 text-lg flex items-center justify-center">
                      {g.icon}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-900">{g.name}</h4>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-zinc-500">
                        <span>{g.members} teens</span>
                        <span>•</span>
                        <span>{g.channels} channels</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Active
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Realtime AutoMod & AI Moderation Live Action Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">
                    Real-Time Community Safety Feed
                  </h3>
                  <span className="text-xs text-zinc-500">
                    Live stream of evaluated chat messages and safety interventions.
                  </span>
                </div>
              </div>
              <span className="text-xs font-semibold text-zinc-400">
                {events.length} Events Logged
              </span>
            </div>

            {/* Event List */}
            <div className="space-y-3">
              {events.map((evt) => {
                const isExpanded = expandedId === evt.id;
                return (
                  <motion.div
                    key={evt.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`rounded-xl border p-3.5 transition-all ${
                      evt.flagged
                        ? "border-red-200 bg-red-50/20 hover:bg-red-50/40"
                        : "border-zinc-200 bg-white hover:bg-zinc-50/60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <img
                          src={evt.avatar}
                          alt={evt.author}
                          referrerPolicy="no-referrer"
                          className="w-8 h-8 rounded-full ring-1 ring-zinc-200 object-cover mt-0.5"
                        />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-zinc-900">
                              {evt.author}
                            </span>
                            <span className="text-[11px] text-zinc-400">{evt.timestamp}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600">
                              {evt.source}
                            </span>
                          </div>

                          {/* Message Content */}
                          <p className="text-xs text-zinc-800 mt-1 font-medium select-text">
                            &ldquo;{evt.content}&rdquo;
                          </p>
                        </div>
                      </div>

                      {/* Action Badge & Toggle */}
                      <div className="flex items-center gap-2 shrink-0">
                        {getActionPill(evt.recommendedAction, evt.flagged)}
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : evt.id)}
                          className="p-1 rounded text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 cursor-pointer"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Expandable Safety Details */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="mt-3 pt-3 border-t border-zinc-200/80 text-xs space-y-2 overflow-hidden"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                            <div>
                              <span className="text-zinc-400 block">Safety Category:</span>
                              <span className="font-bold text-zinc-800">{evt.category}</span>
                            </div>
                            <div>
                              <span className="text-zinc-400 block">Severity Level:</span>
                              <span className="font-bold text-zinc-800">{evt.severity}</span>
                            </div>
                          </div>

                          <div className="bg-zinc-100/70 p-2.5 rounded-lg text-zinc-700 leading-relaxed text-[11px]">
                            <span className="font-semibold text-zinc-900 block mb-0.5">
                              Audit Reason:
                            </span>
                            {evt.reason}
                          </div>

                          {evt.highlightedPhrases && evt.highlightedPhrases.length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                              <span className="text-zinc-400">Trigger Words:</span>
                              {evt.highlightedPhrases.map((phrase, i) => (
                                <span
                                  key={i}
                                  className="px-1.5 py-0.2 bg-red-100 text-red-800 rounded font-mono font-semibold"
                                >
                                  {phrase}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1 font-mono">
                            <span>Tokens Used: {evt.tokensUsed}</span>
                            <span>Latency: {evt.latencyMs}ms</span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}

              {events.length === 0 && (
                <div className="py-12 text-center text-zinc-500 text-xs">
                  No moderation events yet. Try submitting a test message above!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
