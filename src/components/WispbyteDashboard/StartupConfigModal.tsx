import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Sliders,
  Eye,
  EyeOff,
  Check,
  RotateCw,
  Server,
  Shield,
  Zap,
  Save,
  Info,
} from "lucide-react";

interface StartupConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPolicy: string;
  currentRam: number;
  autoRestart: boolean;
  onSave: (config: {
    policy: string;
    ramMb: number;
    autoRestart: boolean;
    botToken: string;
    geminiKey: string;
  }) => Promise<void>;
}

export const StartupConfigModal: React.FC<StartupConfigModalProps> = ({
  isOpen,
  onClose,
  currentPolicy,
  currentRam,
  autoRestart,
  onSave,
}) => {
  const [policy, setPolicy] = useState(currentPolicy);
  const [ramMb, setRamMb] = useState(currentRam);
  const [autoRestartEnabled, setAutoRestartEnabled] = useState(autoRestart);
  const [botToken, setBotToken] = useState("••••••••••••••••••••••••••••••••");
  const [geminiKey, setGeminiKey] = useState("••••••••••••••••••••••••");
  const [showToken, setShowToken] = useState(false);
  const [showGemini, setShowGemini] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        policy,
        ramMb,
        autoRestart: autoRestartEnabled,
        botToken: showToken ? botToken : "",
        geminiKey: showGemini ? geminiKey : "",
      });
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1200);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-3xl border border-zinc-200 shadow-2xl max-w-lg w-full overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/70">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900">
                  Wispbyte Startup & Environment
                </h3>
                <p className="text-xs text-zinc-500">
                  Configure server variables, RAM quota, and moderation policies.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs text-zinc-700">
            {/* 1. Policy Preset */}
            <div>
              <label className="font-bold text-zinc-900 block mb-1.5 flex items-center justify-between">
                <span>Community Moderation Policy Preset</span>
                <span className="text-[11px] font-normal text-indigo-600 font-mono">
                  MODERATION_POLICY_LEVEL
                </span>
              </label>
              <select
                value={policy}
                onChange={(e) => setPolicy(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-white font-medium focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="STRICT_TEEN">
                  STRICT_TEEN (Recommended: Zero-tolerance grooming/hate speech, allows casual banter)
                </option>
                <option value="HIGH_ALERT">HIGH_ALERT (Strict profanity + link lockup)</option>
                <option value="STANDARD">STANDARD (General Discord community safety)</option>
              </select>
            </div>

            {/* 2. RAM Quota Slider */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-bold text-zinc-900">Pterodactyl RAM Quota</label>
                <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  {ramMb} MB
                </span>
              </div>
              <input
                type="range"
                min={256}
                max={1024}
                step={128}
                value={ramMb}
                onChange={(e) => setRamMb(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-zinc-400 mt-1 font-mono">
                <span>256 MB (Minimal)</span>
                <span>512 MB (Optimal)</span>
                <span>1024 MB (Enterprise)</span>
              </div>
            </div>

            {/* 3. Discord Bot Token */}
            <div>
              <label className="font-bold text-zinc-900 block mb-1.5 flex items-center justify-between">
                <span>Discord Bot Token</span>
                <span className="text-[11px] font-normal text-zinc-400 font-mono">
                  DISCORD_BOT_TOKEN
                </span>
              </label>
              <div className="relative">
                <input
                  type={showToken ? "text" : "password"}
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  className="w-full px-3 py-2 pr-10 rounded-xl border border-zinc-200 font-mono bg-zinc-50 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                >
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* 4. Gemini API Key */}
            <div>
              <label className="font-bold text-zinc-900 block mb-1.5 flex items-center justify-between">
                <span>Gemini API Key</span>
                <span className="text-[11px] font-normal text-zinc-400 font-mono">
                  GEMINI_API_KEY
                </span>
              </label>
              <div className="relative">
                <input
                  type={showGemini ? "text" : "password"}
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  className="w-full px-3 py-2 pr-10 rounded-xl border border-zinc-200 font-mono bg-zinc-50 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowGemini(!showGemini)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                >
                  {showGemini ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* 5. Auto Restart Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200">
              <div>
                <span className="font-bold text-zinc-900 block">Auto-Restart On Crash</span>
                <span className="text-[11px] text-zinc-500">
                  Wispbyte container will reboot instantly if Node.js experiences an uncaught error.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setAutoRestartEnabled(!autoRestartEnabled)}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  autoRestartEnabled ? "bg-indigo-600" : "bg-zinc-300"
                }`}
              >
                <span
                  className={`block w-4 h-4 rounded-full bg-white shadow-sm transition-transform absolute top-1 ${
                    autoRestartEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-zinc-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-zinc-600 hover:bg-zinc-100 font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold flex items-center gap-1.5 shadow-md shadow-indigo-100 transition-all cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <RotateCw className="w-4 h-4 animate-spin" />
                ) : savedSuccess ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{savedSuccess ? "Saved to Wispbyte!" : "Save Environment"}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
