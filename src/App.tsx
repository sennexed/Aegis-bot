import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Header } from "./components/Header";
import { WispbyteDashboard } from "./components/WispbyteDashboard/WispbyteDashboard";
import { PlanOverview } from "./components/PlanOverview";
import { LiveModerationTester } from "./components/LiveModerationTester";
import { DiscordSetupSimulator } from "./components/DiscordSetupSimulator";
import { TraditionalModSandbox } from "./components/TraditionalModSandbox";
import { TokenEfficiencyCalculator } from "./components/TokenEfficiencyCalculator";
import { WispbyteGuide } from "./components/WispbyteGuide";
import { SafetyFeaturesSuite } from "./components/SafetyFeaturesSuite";
import { AutoNewsFeature } from "./components/AutoNewsFeature";
import { BotNameStylesFeature } from "./components/BotNameStylesFeature";
import { InteractiveBotChatSandbox } from "./components/InteractiveBotChatSandbox";
import { Shield, Sparkles, Server, Github, ExternalLink } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  return (
    <div className="min-h-screen bg-zinc-100/70 text-zinc-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area with Animated Route Transitions */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8, scale: 0.995 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.995 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            {activeTab === "dashboard" && <WispbyteDashboard />}
            {activeTab === "bot-chat" && <InteractiveBotChatSandbox />}
            {activeTab === "namestyles" && <BotNameStylesFeature />}
            {activeTab === "autonews" && <AutoNewsFeature />}
            {activeTab === "safety-suite" && <SafetyFeaturesSuite />}
            {activeTab === "overview" && <PlanOverview />}
            {activeTab === "live-tester" && <LiveModerationTester />}
            {activeTab === "setup-sim" && <DiscordSetupSimulator />}
            {activeTab === "traditional-mod" && <TraditionalModSandbox />}
            {activeTab === "token-efficiency" && <TokenEfficiencyCalculator />}
            {activeTab === "wispbyte" && <WispbyteGuide />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-indigo-600 text-white flex items-center justify-center">
              <Shield className="h-3.5 w-3.5" />
            </div>
            <span className="font-bold text-zinc-900">AegisMod</span>
            <span>— Hybrid Discord Moderation System for Adolescent Communities (~16 y/o)</span>
          </div>

          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-zinc-600">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Gemini 3.8 Flash
            </span>
            <span className="flex items-center gap-1.5 text-zinc-600">
              <Server className="w-3.5 h-3.5 text-emerald-600" />
              Wispbyte Pterodactyl Ready
            </span>
            <span className="text-zinc-400">v1.0.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
