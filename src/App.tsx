import React, { useState, Suspense, lazy } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Header } from "./components/Header";
import { WispbyteDashboard } from "./components/WispbyteDashboard/WispbyteDashboard";
import { Shield, Sparkles, Server, RefreshCw } from "lucide-react";

// Lazy-loaded secondary tabs for blazing-fast initial bundle execution
const InteractiveApiCenter = lazy(() =>
  import("./components/InteractiveApiCenter").then((m) => ({ default: m.InteractiveApiCenter }))
);
const GitHubAutoDeployFeature = lazy(() =>
  import("./components/GitHubAutoDeployFeature").then((m) => ({ default: m.GitHubAutoDeployFeature }))
);
const InteractiveBotChatSandbox = lazy(() =>
  import("./components/InteractiveBotChatSandbox").then((m) => ({ default: m.InteractiveBotChatSandbox }))
);
const BotNameStylesFeature = lazy(() =>
  import("./components/BotNameStylesFeature").then((m) => ({ default: m.BotNameStylesFeature }))
);
const AutoNewsFeature = lazy(() =>
  import("./components/AutoNewsFeature").then((m) => ({ default: m.AutoNewsFeature }))
);
const SafetyFeaturesSuite = lazy(() =>
  import("./components/SafetyFeaturesSuite").then((m) => ({ default: m.SafetyFeaturesSuite }))
);
const PlanOverview = lazy(() =>
  import("./components/PlanOverview").then((m) => ({ default: m.PlanOverview }))
);
const LiveModerationTester = lazy(() =>
  import("./components/LiveModerationTester").then((m) => ({ default: m.LiveModerationTester }))
);
const DiscordSetupSimulator = lazy(() =>
  import("./components/DiscordSetupSimulator").then((m) => ({ default: m.DiscordSetupSimulator }))
);
const TraditionalModSandbox = lazy(() =>
  import("./components/TraditionalModSandbox").then((m) => ({ default: m.TraditionalModSandbox }))
);
const TokenEfficiencyCalculator = lazy(() =>
  import("./components/TokenEfficiencyCalculator").then((m) => ({ default: m.TokenEfficiencyCalculator }))
);
const WispbyteGuide = lazy(() =>
  import("./components/WispbyteGuide").then((m) => ({ default: m.WispbyteGuide }))
);

const TabLoader: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-[360px] bg-white/60 backdrop-blur-xs rounded-2xl border border-zinc-200/80 p-8 shadow-xs">
    <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 mb-3 animate-bounce">
      <RefreshCw className="w-6 h-6 animate-spin" />
    </div>
    <span className="text-xs font-bold uppercase tracking-wider text-zinc-600">Loading Module</span>
    <span className="text-[11px] text-zinc-400 mt-0.5">Optimizing memory footprint...</span>
  </div>
);

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  return (
    <div className="min-h-screen bg-zinc-100/70 text-zinc-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Header with Top-Left Menu Drawer */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area with Animated Route Transitions & Lazy Suspense */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<TabLoader />}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8, scale: 0.995 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.995 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              {activeTab === "dashboard" && <WispbyteDashboard />}
              {activeTab === "interactive-api" && <InteractiveApiCenter />}
              {activeTab === "git-autodeploy" && <GitHubAutoDeployFeature />}
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
        </Suspense>
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
