import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Shield,
  Server,
  Sparkles,
  CheckCircle2,
  Volume2,
  VolumeX,
  MessageSquare,
  Radio,
  Zap,
  GitCommit,
} from "lucide-react";
import { isSoundEnabled, toggleSound, playTabSwitch } from "../utils/soundEffects";

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const [soundOn, setSoundOn] = useState(isSoundEnabled());

  const handleSoundToggle = () => {
    const updated = toggleSound();
    setSoundOn(updated);
  };

  const handleSelectTab = (tabId: string) => {
    playTabSwitch();
    setActiveTab(tabId);
  };

  const navItems = [
    { id: "dashboard", label: "⚡ Wispbyte Dashboard", badge: "LIVE" },
    { id: "git-autodeploy", label: "🚀 GitHub Auto-Restart", badge: "AUTO-CD" },
    { id: "bot-chat", label: "💬 Interactive Bot Chat", badge: "NEW" },
    { id: "namestyles", label: "✨ Name Styles & Fonts", badge: "STYLES" },
    { id: "autonews", label: "📰 Auto News (13 Papers)" },
    { id: "safety-suite", label: "🛡️ Safety Suite 2.0 (10 Updates)" },
    { id: "live-tester", label: "Live AI Moderation" },
    { id: "setup-sim", label: "Discord Setup Wizard" },
    { id: "traditional-mod", label: "Traditional Commands" },
    { id: "token-efficiency", label: "Token Optimizer" },
    { id: "overview", label: "Architecture & Plan" },
    { id: "wispbyte", label: "Deployment Guide" },
  ];

  return (
    <header className="border-b border-zinc-200 bg-white/95 backdrop-blur-md sticky top-0 z-40 shadow-xs">
      {/* Top Banner with Badges */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 3 }}
              whileTap={{ scale: 0.95 }}
              className="h-11 w-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100 ring-4 ring-indigo-50 cursor-pointer"
              onClick={() => handleSelectTab("dashboard")}
            >
              <Shield className="h-6 w-6 stroke-[2.2]" />
            </motion.div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
                  AegisMod
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                  </span>
                </h1>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  Hybrid Discord Moderation
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 hidden sm:inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Teen Safety ~16
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Discord.js v14 • Gemini 3.8 Flash • Multi-tier Token Triage • Wispbyte Ready
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Live Bot Ping Status */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200/60">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Bot Online (19ms)</span>
            </div>

            {/* Quick Interactive Chat Launcher */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              id="header-launch-chat-btn"
              onClick={() => handleSelectTab("bot-chat")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                activeTab === "bot-chat"
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100"
                  : "bg-indigo-50 hover:bg-indigo-100/80 text-indigo-700 border-indigo-200"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Live Bot Chat</span>
            </motion.button>

            {/* Audio Toggle */}
            <button
              id="header-toggle-audio-btn"
              onClick={handleSoundToggle}
              className={`p-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                soundOn
                  ? "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 border-zinc-200"
                  : "bg-zinc-100 text-zinc-400 hover:bg-zinc-200 border-zinc-200"
              }`}
              title={soundOn ? "Sound Feedback Enabled" : "Sound Feedback Disabled"}
            >
              {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs with Animated Layout Indicator */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 overflow-x-auto no-scrollbar border-t border-zinc-100 pt-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => handleSelectTab(item.id)}
                className={`relative py-2.5 px-3.5 text-xs font-semibold whitespace-nowrap rounded-t-lg transition-colors cursor-pointer ${
                  isActive
                    ? "text-indigo-600 bg-indigo-50/50 font-bold"
                    : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider ${
                        isActive
                          ? "bg-indigo-600 text-white"
                          : "bg-zinc-200 text-zinc-700"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>

                {/* Animated active underline pill */}
                {isActive && (
                  <motion.div
                    layoutId="activeNavTabPill"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
