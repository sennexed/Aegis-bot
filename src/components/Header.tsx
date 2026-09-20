import React from "react";
import { Shield, Server, Sparkles, CheckCircle2 } from "lucide-react";

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: "dashboard", label: "⚡ Wispbyte Dashboard", badge: "LIVE" },
    { id: "autonews", label: "📰 Auto News (13 Papers)", badge: "NEW" },
    { id: "safety-suite", label: "🛡️ Safety Suite 2.0 (10 Updates)" },
    { id: "live-tester", label: "Live AI Moderation" },
    { id: "setup-sim", label: "Discord Setup Wizard" },
    { id: "traditional-mod", label: "Traditional Commands" },
    { id: "token-efficiency", label: "Token Optimizer" },
    { id: "overview", label: "Architecture & Plan" },
    { id: "wispbyte", label: "Deployment Guide" },
  ];

  return (
    <header className="border-b border-zinc-200 bg-white/95 backdrop-blur-md sticky top-0 z-40">
      {/* Top Banner with Badges */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100 ring-4 ring-indigo-50">
              <Shield className="h-6 w-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-zinc-900 tracking-tight">AegisMod</h1>
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
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-700 text-xs font-medium border border-zinc-200">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Gemini 3.8 Flash</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-700 text-xs font-medium border border-zinc-200">
              <Server className="w-3.5 h-3.5 text-emerald-600" />
              <span>Wispbyte Pterodactyl</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 overflow-x-auto no-scrollbar border-t border-zinc-100 pt-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`py-2.5 px-3.5 text-xs font-semibold whitespace-nowrap rounded-t-lg transition-colors border-b-2 ${
                  isActive
                    ? "border-indigo-600 text-indigo-600 bg-indigo-50/40"
                    : "border-transparent text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
