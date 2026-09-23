import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
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
  Menu,
  X,
  Code2,
  Sliders,
  ChevronRight,
  ExternalLink,
  Flame,
  Activity,
  Layers,
  Terminal,
  BookOpen,
  Send,
  Newspaper,
  Sparkle,
} from "lucide-react";
import { isSoundEnabled, toggleSound, playTabSwitch, playClickSound } from "../utils/soundEffects";

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSoundToggle = () => {
    const updated = toggleSound();
    setSoundOn(updated);
  };

  const handleSelectTab = (tabId: string) => {
    playTabSwitch();
    setActiveTab(tabId);
    setMenuOpen(false);
  };

  const navItems = [
    { id: "dashboard", label: "⚡ Wispbyte Dashboard", badge: "LIVE" },
    { id: "interactive-api", label: "🌐 Interactive API", badge: "REST" },
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

  const menuSections = [
    {
      title: "Core Operations & Live Tools",
      items: [
        { id: "dashboard", label: "Wispbyte Control Center", icon: Server, badge: "LIVE", desc: "Resource telemetry, terminal logs, and power control" },
        { id: "interactive-api", label: "Live Interactive API Lab", icon: Code2, badge: "NEW", desc: "Execute REST requests, test latency & export cURL" },
        { id: "git-autodeploy", label: "GitHub Auto-Restart CI/CD", icon: GitCommit, badge: "AUTO", desc: "Instant remote deployment & commit webhooks" },
      ],
    },
    {
      title: "Discord Bot Features",
      items: [
        { id: "bot-chat", label: "Interactive Bot Chat Sandbox", icon: MessageSquare, badge: "CHAT", desc: "Simulate Discord messaging with AI intelligence" },
        { id: "namestyles", label: "Discord Name Styles & Fonts", icon: Sparkles, badge: "STYLES", desc: "Rich font rendering and color preset generator" },
        { id: "setup-sim", label: "Interactive Setup Wizard", icon: Sliders, desc: "Step-by-step role hierarchy & permissions guide" },
        { id: "traditional-mod", label: "Traditional Slash Commands", icon: Terminal, desc: "/ban, /kick, /mute, /warn, and /cases sandbox" },
      ],
    },
    {
      title: "AI Safety & Teen Protection",
      items: [
        { id: "safety-suite", label: "Safety Suite 2.0 (10 Updates)", icon: Shield, badge: "10-IN-1", desc: "Self-harm, anti-phishing, anti-invite, doxxing" },
        { id: "live-tester", label: "Live AI Moderation Tester", icon: Zap, desc: "Real-time Gemini 3.8 Flash classification tester" },
        { id: "token-efficiency", label: "Multi-Tier Token Calculator", icon: Activity, desc: "Fast triage cache & cost optimization matrix" },
      ],
    },
    {
      title: "World News & Guides",
      items: [
        { id: "autonews", label: "Auto News (13 Newspapers)", icon: Newspaper, desc: "Automated world press digest broadcaster" },
        { id: "overview", label: "Architecture & Security Plan", icon: Layers, desc: "Technical system diagrams & threat models" },
        { id: "wispbyte", label: "Deployment & Container Guide", icon: BookOpen, desc: "Pterodactyl, Docker, and subdomains" },
      ],
    },
  ];

  return (
    <>
      <header className="border-b border-zinc-200 bg-white/95 backdrop-blur-md sticky top-0 z-40 shadow-xs">
        {/* Top Banner with Badges */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Top Left Menu Toggle Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  playClickSound();
                  setMenuOpen(true);
                }}
                className="h-10 w-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white flex items-center justify-center shadow-sm cursor-pointer transition-colors relative group"
                title="Open Navigation Menu"
              >
                <Menu className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-indigo-500" />
              </motion.button>

              <motion.div
                whileHover={{ scale: 1.05, rotate: 3 }}
                whileTap={{ scale: 0.95 }}
                className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100 ring-4 ring-indigo-50 cursor-pointer"
                onClick={() => handleSelectTab("dashboard")}
              >
                <Shield className="h-5 w-5 stroke-[2.2]" />
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

              {/* Quick Interactive API Launcher */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelectTab("interactive-api")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                  activeTab === "interactive-api"
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100"
                    : "bg-indigo-50 hover:bg-indigo-100/80 text-indigo-700 border-indigo-200"
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Interactive API</span>
              </motion.button>

              {/* Quick Interactive Chat Launcher */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelectTab("bot-chat")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                  activeTab === "bot-chat"
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100"
                    : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-zinc-200"
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Live Chat</span>
              </motion.button>

              {/* Audio Toggle */}
              <button
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

      {/* Top Left Menu Slide-Over Drawer */}
      <AnimatePresence>
        {menuOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 bg-zinc-950/60 backdrop-blur-sm transition-opacity"
            />

            {/* Slide-over Panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="relative w-full max-w-sm bg-zinc-900 text-white shadow-2xl flex flex-col h-full z-10 border-r border-zinc-800"
            >
              {/* Drawer Header */}
              <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/50">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
                    <Shield className="h-5 w-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm tracking-tight">AegisMod Menu</h3>
                    <p className="text-[11px] text-zinc-400">Navigation & Operations</p>
                  </div>
                </div>

                <button
                  onClick={() => setMenuOpen(false)}
                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Server Status Quick Banner */}
              <div className="p-4 bg-indigo-950/40 border-b border-indigo-900/30 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">Host Subdomain</div>
                  <div className="font-mono text-xs text-emerald-400 font-bold">aegis-bot.wispbyte.app</div>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  ONLINE
                </div>
              </div>

              {/* Drawer Body Links */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {menuSections.map((section, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-2">
                      {section.title}
                    </div>
                    <div className="space-y-1">
                      {section.items.map((item) => {
                        const Icon = item.icon;
                        const isSelected = activeTab === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleSelectTab(item.id)}
                            className={`w-full p-2.5 rounded-xl flex items-center gap-3 text-left transition-all cursor-pointer ${
                              isSelected
                                ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-900/40"
                                : "hover:bg-zinc-800 text-zinc-300 hover:text-white"
                            }`}
                          >
                            <div
                              className={`p-2 rounded-lg ${
                                isSelected ? "bg-indigo-700 text-white" : "bg-zinc-800 text-zinc-400"
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold truncate">{item.label}</span>
                                {item.badge && (
                                  <span
                                    className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase ${
                                      isSelected
                                        ? "bg-white text-indigo-700"
                                        : "bg-zinc-800 text-indigo-300 border border-indigo-500/30"
                                    }`}
                                  >
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-zinc-400 truncate mt-0.5">{item.desc}</div>
                            </div>
                            <ChevronRight
                              className={`w-3.5 h-3.5 opacity-60 ${isSelected ? "text-white" : "text-zinc-500"}`}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-zinc-800 bg-zinc-950/50 flex items-center justify-between text-xs text-zinc-400">
                <span className="font-medium">AegisMod v1.0.0</span>
                <span className="text-indigo-400 font-semibold">Gemini 3.8 Flash</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
