import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Shield,
  Send,
  Sparkles,
  Terminal,
  Hash,
  Volume2,
  VolumeX,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Zap,
  Sliders,
  Bell,
  UserCheck,
  Eye,
  ExternalLink,
  MessageSquare,
} from "lucide-react";
import {
  playClickSound,
  playMessagePop,
  playAlertSound,
  playSuccessChime,
  isSoundEnabled,
  toggleSound,
} from "../utils/soundEffects";

interface ChatMessage {
  id: string;
  author: {
    name: string;
    avatar: string;
    color: string;
    isBot?: boolean;
    role?: string;
  };
  timestamp: string;
  content: string;
  deleted?: boolean;
  strikeReason?: string;
  flagged?: boolean;
  category?: string;
  embed?: {
    title: string;
    description: string;
    color: string;
    fields?: { name: string; value: string; inline?: boolean }[];
    footer?: string;
  };
}

const SLASH_COMMANDS = [
  { command: "/duty on", desc: "Clock into staff moderation shift" },
  { command: "/duty off", desc: "Clock out of staff moderation shift" },
  { command: "/news digest", desc: "Fetch live headlines from 13 world-famous newspapers" },
  { command: "/namestyle preview", desc: "Preview bot font & visual effect styling" },
  { command: "/antiraid on", desc: "Activate lockdown protection" },
  { command: "/automod status", desc: "View triage rules & strike thresholds" },
  { command: "/report @Troll", desc: "Submit peer report with 3-minute cooldown" },
  { command: "/appeal", desc: "Open staff ticket modal to dispute punishment" },
  { command: "/help", desc: "Display all AegisMod command suites" },
];

const PRESETS = [
  { label: "Harmless Banter", text: "gg guys that 1v3 round was unreal, let's queue competitive" },
  { label: "Scam Invite Link", text: "Join my free nitro generator server right now: discord.gg/free-nitro-100k" },
  { label: "Phishing Domain", text: "Claim free $50 steam wallet gift card: https://discrod-app.gift/steam" },
  { label: "Cyberbullying / Attack", text: "Nobody wants you here, you are useless. Uninstall and disappear." },
  { label: "Predatory / Secret Snap", text: "Hey are you alone right now? Add my snap and send private pics, don't tell anyone." },
  { label: "Doxxing Address", text: "His real name is Ethan Miller and he lives at 442 Maple Street Apt 4B" },
];

export const InteractiveBotChatSandbox: React.FC = () => {
  const [activeChannel, setActiveChannel] = useState<"general" | "mod-logs" | "bot-commands">("general");
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const [userStrikes, setUserStrikes] = useState(0);
  const [userTimeoutUntil, setUserTimeoutUntil] = useState<Date | null>(null);
  const [showSlashMenu, setShowSlashMenu] = useState(false);

  // Channels state
  const [generalMessages, setGeneralMessages] = useState<ChatMessage[]>([
    {
      id: "m-init-1",
      author: {
        name: "FriendlyGamer",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=64&q=80",
        color: "#34d399",
        role: "Member",
      },
      timestamp: "Today at 12:04 PM",
      content: "Anyone down for Minecraft survival tonight after homework?",
    },
    {
      id: "m-init-2",
      author: {
        name: "AegisMod",
        avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&q=80",
        color: "#818cf8",
        isBot: true,
        role: "Automated Guardian",
      },
      timestamp: "Today at 12:05 PM",
      content: "🛡️ AegisMod AI protection active. Teen safety policies enforced (Gemini 3.8 Flash + Local Triage).",
    },
  ]);

  const [modLogMessages, setModLogMessages] = useState<ChatMessage[]>([
    {
      id: "log-init-1",
      author: {
        name: "AegisMod",
        avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&q=80",
        color: "#818cf8",
        isBot: true,
        role: "BOT",
      },
      timestamp: "Today at 12:00 PM",
      content: "",
      embed: {
        title: "🛡️ AegisMod System Initialized",
        description: "Bot booted on Wispbyte Pterodactyl. Node SG-1 online. Anti-phishing filters synced.",
        color: "#5865F2",
        fields: [
          { name: "Channel Policy", value: "#general-chat (STRICT_TEEN)", inline: true },
          { name: "Strike Escalation", value: "3 Strikes = 1h Timeout", inline: true },
        ],
        footer: "AegisMod Logging Engine • #mod-logs (locked)",
      },
    },
  ]);

  const [botCommandMessages, setBotCommandMessages] = useState<ChatMessage[]>([
    {
      id: "cmd-init-1",
      author: {
        name: "AegisMod",
        avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&q=80",
        color: "#818cf8",
        isBot: true,
        role: "BOT",
      },
      timestamp: "Today at 12:00 PM",
      content: "Type slash commands here or click below to simulate bot interactions.",
    },
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [generalMessages, modLogMessages, botCommandMessages, isTyping]);

  const handleToggleSound = () => {
    const newState = toggleSound();
    setSoundOn(newState);
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText ?? inputText;
    if (!textToSend.trim()) return;

    // Check if user is currently timed out
    if (userTimeoutUntil && new Date() < userTimeoutUntil) {
      playAlertSound();
      alert("You are currently timed out by AegisMod. Please wait for cooldown or file an /appeal.");
      return;
    }

    playClickSound();
    setInputText("");
    setShowSlashMenu(false);

    const userMsgId = "msg-" + Date.now();
    const timeStr = `Today at ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

    const userMsg: ChatMessage = {
      id: userMsgId,
      author: {
        name: "TeenUser16",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&q=80",
        color: "#60a5fa",
        role: "Member",
      },
      timestamp: timeStr,
      content: textToSend,
    };

    // Slash command interception
    if (textToSend.startsWith("/")) {
      handleSlashCommand(textToSend, userMsg, timeStr);
      return;
    }

    // Normal message sent to general
    setGeneralMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const res = await fetch("/api/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: textToSend,
          author: "TeenUser16",
        }),
      });
      const data = await res.json();
      setIsTyping(false);

      if (data.flagged) {
        playAlertSound();
        const newStrikes = userStrikes + 1;
        setUserStrikes(newStrikes);

        // Mark user message as deleted with animated strike
        setGeneralMessages((prev) =>
          prev.map((m) =>
            m.id === userMsgId
              ? {
                  ...m,
                  deleted: true,
                  flagged: true,
                  category: data.category,
                  strikeReason: `${data.category} (${data.recommendedAction})`,
                }
              : m
          )
        );

        // Bot sends an automated reprimand to #general-chat
        const botReprimand: ChatMessage = {
          id: "bot-rep-" + Date.now(),
          author: {
            name: "AegisMod",
            avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&q=80",
            color: "#818cf8",
            isBot: true,
            role: "BOT",
          },
          timestamp: timeStr,
          content: `⚠️ **@TeenUser16** your message violated server teen safety guidelines (**${data.category}**). Action taken: **${data.recommendedAction}**. Strikes: **${newStrikes}/3**.`,
        };
        setGeneralMessages((prev) => [...prev, botReprimand]);

        // Post structured Discord Embed to #mod-logs
        const modLogEmbed: ChatMessage = {
          id: "log-evt-" + Date.now(),
          author: {
            name: "AegisMod",
            avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&q=80",
            color: "#818cf8",
            isBot: true,
            role: "BOT",
          },
          timestamp: timeStr,
          content: "",
          embed: {
            title: `🚨 AutoMod Intercept: ${data.category}`,
            description: `**Author:** @TeenUser16\n**Content:** \`${textToSend}\`\n**Audit Reason:** ${data.reason}`,
            color: data.severity === "CRITICAL" ? "#ED4245" : "#FEE75C",
            fields: [
              { name: "Severity", value: data.severity, inline: true },
              { name: "Action Enforced", value: data.recommendedAction, inline: true },
              { name: "Triage Engine", value: data.source, inline: true },
              { name: "Total Strikes", value: `${newStrikes}/3`, inline: true },
            ],
            footer: "AegisMod Live Moderation Audit • Staff Only",
          },
        };
        setModLogMessages((prev) => [...prev, modLogEmbed]);

        if (newStrikes >= 3 || data.recommendedAction.includes("TIMEOUT")) {
          const timeoutDate = new Date(Date.now() + 60 * 1000); // 1-minute demo timeout
          setUserTimeoutUntil(timeoutDate);
        }
      } else {
        playMessagePop();
      }
    } catch {
      setIsTyping(false);
    }
  };

  const handleSlashCommand = (cmd: string, userMsg: ChatMessage, timeStr: string) => {
    setBotCommandMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      playSuccessChime();

      let botReply: ChatMessage;

      if (cmd.includes("/duty on")) {
        botReply = {
          id: "cmd-res-" + Date.now(),
          author: {
            name: "AegisMod",
            avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&q=80",
            color: "#818cf8",
            isBot: true,
            role: "BOT",
          },
          timestamp: timeStr,
          content: "",
          embed: {
            title: "🟢 Staff Shift Started: ON DUTY",
            description: "You are now logged on active moderation shift. Audit logs will track your actions.",
            color: "#57F287",
            fields: [
              { name: "Moderator", value: "@TeenUser16", inline: true },
              { name: "Session Start", value: new Date().toLocaleTimeString(), inline: true },
            ],
            footer: "AegisMod Staff Tracker • /duty off to end shift",
          },
        };
      } else if (cmd.includes("/news digest")) {
        botReply = {
          id: "cmd-res-" + Date.now(),
          author: {
            name: "AegisMod",
            avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&q=80",
            color: "#818cf8",
            isBot: true,
            role: "BOT",
          },
          timestamp: timeStr,
          content: "",
          embed: {
            title: "📰 World-Famous News Digest (13 Newspapers)",
            description: "Live curated headlines fetched across 13 global publications (BBC, NYT, WSJ, Le Monde, Yomiuri, FT, El País, etc.)",
            color: "#5865F2",
            fields: [
              { name: "🇬🇧 BBC", value: "[Global Diplomatic Summits](https://bbc.com)", inline: true },
              { name: "🇺🇸 NYT", value: "[Economic Trends & Markets](https://nytimes.com)", inline: true },
              { name: "🇯🇵 Yomiuri", value: "[Maglev Rail & Robotics](https://japannews.yomiuri.co.jp)", inline: true },
            ],
            footer: "Use /news subscribe to receive automated daily dispatches",
          },
        };
      } else if (cmd.includes("/namestyle preview")) {
        botReply = {
          id: "cmd-res-" + Date.now(),
          author: {
            name: "AegisMod",
            avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&q=80",
            color: "#818cf8",
            isBot: true,
            role: "BOT",
          },
          timestamp: timeStr,
          content: "",
          embed: {
            title: "✨ Discord Bot Name Style & Font Preview",
            description: "Currently applied Discord display style: **[🛡️ AEGIS] AegisMod**\nFont: **gg sans / Neo Castel** • Effect: **Linear Gradient** • Colors: **#5865F2 & #EC4899**",
            color: "#EB459E",
            footer: "Synced with Discord REST API PATCH /users/@me",
          },
        };
      } else if (cmd.includes("/antiraid on")) {
        botReply = {
          id: "cmd-res-" + Date.now(),
          author: {
            name: "AegisMod",
            avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&q=80",
            color: "#818cf8",
            isBot: true,
            role: "BOT",
          },
          timestamp: timeStr,
          content: "",
          embed: {
            title: "🛡️ Anti-Raid Mode: ENGAGED",
            description: "Account age threshold raised to 7 days. Rate limit enforced: 1 msg / 5s per user. High-risk link quarantine active.",
            color: "#ED4245",
            footer: "AegisMod Guardian System • /antiraid off to relax",
          },
        };
      } else {
        botReply = {
          id: "cmd-res-" + Date.now(),
          author: {
            name: "AegisMod",
            avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&q=80",
            color: "#818cf8",
            isBot: true,
            role: "BOT",
          },
          timestamp: timeStr,
          content: `✅ Executed slash command \`${cmd}\`. AegisMod processed interaction with zero latency.`,
        };
      }

      setBotCommandMessages((prev) => [...prev, botReply]);
    }, 600);
  };

  const handleResetChat = () => {
    playClickSound();
    setUserStrikes(0);
    setUserTimeoutUntil(null);
    setGeneralMessages([
      {
        id: "m-reset-" + Date.now(),
        author: {
          name: "AegisMod",
          avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&q=80",
          color: "#818cf8",
          isBot: true,
          role: "Automated Guardian",
        },
        timestamp: "Just now",
        content: "Chat reset. You have 0 strikes. Safe testing environment restored.",
      },
    ]);
  };

  const currentMessages =
    activeChannel === "general"
      ? generalMessages
      : activeChannel === "mod-logs"
      ? modLogMessages
      : botCommandMessages;

  return (
    <div className="space-y-6">
      {/* Top Banner with Interactive State Indicator */}
      <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <h2 className="text-xl font-bold text-zinc-900 tracking-tight">
                Interactive Discord Bot Simulator & Live Chat Sandbox
              </h2>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Interact directly with AegisMod in a realistic Discord client mockup. Type messages, test harmful triggers, invoke slash commands, and watch instant auto-strikes, deletions, and audit embeds animate in real time.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Strikes badge */}
            <div
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                userStrikes > 0
                  ? "bg-red-50 text-red-700 border-red-200 animate-pulse"
                  : "bg-zinc-100 text-zinc-600 border-zinc-200"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Strikes: {userStrikes}/3</span>
            </div>

            {/* Audio Toggle */}
            <button
              id="chat-toggle-audio-btn"
              onClick={handleToggleSound}
              className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                soundOn
                  ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                  : "bg-zinc-100 text-zinc-500 border-zinc-200"
              }`}
              title={soundOn ? "Sound Effects ON" : "Sound Effects OFF"}
            >
              {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Reset Button */}
            <button
              id="chat-reset-btn"
              onClick={handleResetChat}
              className="p-2 rounded-xl text-xs font-bold bg-zinc-100 hover:bg-zinc-200 text-zinc-600 border border-zinc-200 transition-all cursor-pointer"
              title="Reset Chat Session"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Test Presets Carousel */}
        <div className="mt-4 pt-4 border-t border-zinc-100">
          <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block mb-2">
            Click to Simulate Discord Test Scenarios (~16 y/o Community):
          </span>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(p.text)}
                className="text-xs px-3 py-1.5 rounded-xl bg-zinc-50 hover:bg-indigo-50 hover:text-indigo-700 active:scale-95 text-zinc-700 font-medium border border-zinc-200 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                <Zap className="w-3 h-3 text-indigo-500" />
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Discord Mockup Window */}
      <div className="bg-[#1e1f22] rounded-3xl border border-zinc-800 shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[580px]">
        {/* Left Server / Channel Sidebar */}
        <div className="w-full md:w-64 bg-[#2b2d31] border-r border-zinc-800 p-3 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Server Header */}
            <div className="px-2 py-2 border-b border-zinc-700/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                  🛡️
                </div>
                <span className="text-sm font-bold text-white tracking-tight">Teen Squad 16+</span>
              </div>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded">
                ACTIVE
              </span>
            </div>

            {/* Channels List */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-2 block">
                TEXT CHANNELS
              </span>

              <button
                id="channel-general-btn"
                onClick={() => {
                  playClickSound();
                  setActiveChannel("general");
                }}
                className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                  activeChannel === "general"
                    ? "bg-[#35373c] text-white"
                    : "text-zinc-400 hover:bg-[#35373c]/50 hover:text-zinc-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-zinc-400" />
                  <span>general-chat</span>
                </div>
                {userStrikes > 0 && (
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                )}
              </button>

              <button
                id="channel-commands-btn"
                onClick={() => {
                  playClickSound();
                  setActiveChannel("bot-commands");
                }}
                className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                  activeChannel === "bot-commands"
                    ? "bg-[#35373c] text-white"
                    : "text-zinc-400 hover:bg-[#35373c]/50 hover:text-zinc-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-indigo-400" />
                  <span>bot-commands</span>
                </div>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-bold px-1.5 py-0.5 rounded">
                  SLASH
                </span>
              </button>

              <button
                id="channel-modlogs-btn"
                onClick={() => {
                  playClickSound();
                  setActiveChannel("mod-logs");
                }}
                className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                  activeChannel === "mod-logs"
                    ? "bg-[#35373c] text-white"
                    : "text-zinc-400 hover:bg-[#35373c]/50 hover:text-zinc-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-400" />
                  <span>mod-logs</span>
                </div>
                <span className="text-[10px] bg-red-500/20 text-red-300 font-bold px-1.5 py-0.5 rounded">
                  LOCKED
                </span>
              </button>
            </div>
          </div>

          {/* User Profile Footer */}
          <div className="bg-[#232428] rounded-xl p-2.5 flex items-center justify-between border border-zinc-700/50 mt-4">
            <div className="flex items-center gap-2">
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&q=80"
                  alt="You"
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#232428]" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block leading-tight">TeenUser16</span>
                <span className="text-[10px] text-zinc-400">#1234</span>
              </div>
            </div>
            <span className="text-[10px] bg-zinc-800 text-zinc-300 font-mono px-1.5 py-0.5 rounded">
              VERIFIED
            </span>
          </div>
        </div>

        {/* Right Chat Area */}
        <div className="flex-1 flex flex-col bg-[#313338] min-w-0">
          {/* Channel Header Bar */}
          <div className="h-12 border-b border-zinc-800/80 px-4 flex items-center justify-between bg-[#313338]/90 backdrop-blur">
            <div className="flex items-center gap-2">
              <Hash className="w-5 h-5 text-zinc-400" />
              <span className="text-sm font-bold text-white">
                {activeChannel === "general"
                  ? "general-chat"
                  : activeChannel === "mod-logs"
                  ? "mod-logs (Staff Audit Trail)"
                  : "bot-commands (Slash Interactions)"}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <span className="hidden sm:inline-flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                AegisMod Active
              </span>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 max-h-[460px]">
            <AnimatePresence initial={false}>
              {currentMessages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={`flex items-start gap-3 group relative p-1.5 rounded-xl transition-colors ${
                    msg.deleted ? "bg-red-950/20 border border-red-900/40" : "hover:bg-[#2e3035]"
                  }`}
                >
                  <img
                    src={msg.author.avatar}
                    alt={msg.author.name}
                    className="w-10 h-10 rounded-full object-cover shrink-0 mt-0.5"
                  />

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="text-xs font-bold hover:underline cursor-pointer"
                        style={{ color: msg.author.color }}
                      >
                        {msg.author.name}
                      </span>
                      {msg.author.isBot && (
                        <span className="bg-[#5865F2] text-white text-[9px] font-extrabold px-1 rounded">
                          BOT
                        </span>
                      )}
                      <span className="text-[10px] text-zinc-400">{msg.timestamp}</span>
                    </div>

                    {/* Content or Deleted Message banner */}
                    {msg.deleted ? (
                      <div className="text-xs italic text-red-400/90 flex items-center gap-1.5 py-1">
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        <span>[Message removed by AegisMod AutoMod: {msg.strikeReason}]</span>
                      </div>
                    ) : (
                      msg.content && (
                        <p className="text-xs text-zinc-200 leading-relaxed break-words font-sans">
                          {msg.content}
                        </p>
                      )
                    )}

                    {/* Discord Embed Rendering */}
                    {msg.embed && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-2 rounded-lg p-3.5 bg-[#2b2d31] border-l-4 text-xs space-y-2.5 max-w-xl shadow-md"
                        style={{ borderLeftColor: msg.embed.color }}
                      >
                        <h4 className="text-sm font-bold text-white tracking-tight">{msg.embed.title}</h4>
                        <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line">
                          {msg.embed.description}
                        </p>

                        {msg.embed.fields && msg.embed.fields.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            {msg.embed.fields.map((f, i) => (
                              <div key={i} className="bg-[#1e1f22] p-2 rounded border border-zinc-800">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase block">
                                  {f.name}
                                </span>
                                <span className="text-xs font-semibold text-white mt-0.5 block">
                                  {f.value}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {msg.embed.footer && (
                          <span className="text-[10px] text-zinc-400 block pt-1 border-t border-zinc-700/60">
                            {msg.embed.footer}
                          </span>
                        )}
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing Indicator */}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 text-xs text-indigo-400 pl-14 italic"
              >
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
                <span>AegisMod AI is analyzing content with Gemini 3.8 Flash...</span>
              </motion.div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input Bar & Slash Menu Popup */}
          <div className="p-3 bg-[#383a40] border-t border-zinc-800 relative">
            {/* Slash Commands Dropdown */}
            <AnimatePresence>
              {showSlashMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-16 left-3 right-3 bg-[#2b2d31] rounded-2xl border border-zinc-700 shadow-2xl p-2 z-30 max-h-56 overflow-y-auto space-y-1"
                >
                  <div className="px-3 py-1 text-[10px] font-bold uppercase text-zinc-400">
                    AegisMod Slash Commands
                  </div>
                  {SLASH_COMMANDS.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setInputText(item.command);
                        setShowSlashMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-indigo-600 hover:text-white text-zinc-200 text-xs flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span className="font-mono font-bold text-indigo-300">{item.command}</span>
                      <span className="text-[11px] text-zinc-400">{item.desc}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2 bg-[#313338] rounded-xl px-3 py-2 border border-zinc-700 focus-within:border-indigo-500 transition-all"
            >
              <button
                type="button"
                onClick={() => setShowSlashMenu(!showSlashMenu)}
                className="text-zinc-400 hover:text-indigo-400 font-mono text-xs px-2 py-1 rounded bg-zinc-800/80 transition-colors"
                title="Slash Command Menu"
              >
                /
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  if (e.target.value.startsWith("/")) {
                    setShowSlashMenu(true);
                  } else {
                    setShowSlashMenu(false);
                  }
                }}
                placeholder={
                  activeChannel === "general"
                    ? "Message #general-chat (Try typing / for commands or testing safe/toxic phrases)..."
                    : activeChannel === "mod-logs"
                    ? "Read-only staff audit channel..."
                    : "Invoke /duty, /news, /namestyle, or /antiraid..."
                }
                disabled={activeChannel === "mod-logs"}
                className="flex-1 bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none"
              />

              <button
                type="submit"
                disabled={!inputText.trim() || activeChannel === "mod-logs"}
                className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white disabled:opacity-40 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
