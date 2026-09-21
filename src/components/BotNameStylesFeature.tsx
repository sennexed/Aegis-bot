import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Palette,
  Sparkles,
  Type,
  Shield,
  Layers,
  RefreshCw,
  Copy,
  Check,
  Zap,
  Terminal,
  Server,
  Sliders,
  Eye,
  Send,
  Code,
  CheckCircle2,
} from "lucide-react";
import {
  BOT_NAME_FONTS,
  BOT_NAME_EFFECTS,
  BOT_COLOR_PRESETS,
  BotNameStyleConfig,
  DEFAULT_BOT_NAME_STYLE,
  hexToDiscordDecimal,
} from "../types/nameStyles";
import { playClickSound, playSuccessChime } from "../utils/soundEffects";

export const BotNameStylesFeature: React.FC = () => {
  const [config, setConfig] = useState<BotNameStyleConfig>(DEFAULT_BOT_NAME_STYLE);
  const [formattedNickname, setFormattedNickname] = useState<string>("[🛡️ AEGIS] AegisMod");
  const [apiPayload, setApiPayload] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncSuccess, setSyncSuccess] = useState<boolean>(false);
  const [copiedPayload, setCopiedPayload] = useState<boolean>(false);
  const [selectedTab, setSelectedTab] = useState<"STUDIO" | "FONTS_CATALOG" | "EFFECTS_CATALOG" | "API_DOCS">("STUDIO");
  const [previewTheme, setPreviewTheme] = useState<"DARK" | "LIGHT">("DARK");

  // Fetch initial config from backend
  const fetchConfig = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/namestyle");
      const data = await res.json();
      if (data.success) {
        setConfig(data.config);
        setFormattedNickname(data.formattedNickname);
        setApiPayload(data.apiPayload);
      }
    } catch (err) {
      console.error("Failed to load name style config:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  // Update config on backend
  const updateStyle = async (updates: Partial<BotNameStyleConfig>) => {
    playClickSound();
    const updated = { ...config, ...updates };
    setConfig(updated);

    try {
      const res = await fetch("/api/namestyle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.success) {
        setFormattedNickname(data.formattedNickname);
        setApiPayload(data.apiPayload);
      }
    } catch (err) {
      console.error("Failed to update style:", err);
    }
  };

  // Trigger simulated Discord API sync
  const syncToDiscord = async () => {
    playClickSound();
    try {
      setIsSyncing(true);
      const res = await fetch("/api/namestyle/sync-discord", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        playSuccessChime();
        setSyncSuccess(true);
        setTimeout(() => setSyncSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Failed to sync to Discord:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const copyJsonPayload = () => {
    playClickSound();
    navigator.clipboard.writeText(JSON.stringify(apiPayload, null, 2));
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const activeFont = BOT_NAME_FONTS.find((f) => f.id === config.fontId) || BOT_NAME_FONTS[0];
  const activeEffect = BOT_NAME_EFFECTS.find((e) => e.id === config.effectId) || BOT_NAME_EFFECTS[0];

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-linear-to-bl from-pink-500/10 via-indigo-500/10 to-transparent rounded-bl-full pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-200/60">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Discord Bot Name Styles • mwyeow Catalog Integration</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
              Bot Name Styles, Fonts & Visual Effects
            </h2>
            <p className="text-sm text-zinc-600 leading-relaxed">
              Customize AegisMod's visual appearance on Discord with <strong>12 unique display fonts</strong>,{" "}
              <strong>6 visual effects</strong> (Solid, Gradient, Neon Glow, Toon, 3D Pop, Prism Radiance), custom decimal colors, and server clan tags.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              id="sync-discord-btn"
              onClick={syncToDiscord}
              disabled={isSyncing}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50"
            >
              <Send className={`w-4 h-4 ${isSyncing ? "animate-pulse" : ""}`} />
              <span>{isSyncing ? "Syncing API..." : "Sync to Discord API"}</span>
            </button>

            <button
              id="reset-style-btn"
              onClick={() => updateStyle(DEFAULT_BOT_NAME_STYLE)}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-xs font-semibold text-zinc-700 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
          </div>
        </div>

        {syncSuccess && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Successfully dispatched `PATCH /users/@me` with name style payload to Discord REST API v10 and synced server nickname!</span>
          </div>
        )}

        {/* Quick Tabs Bar */}
        <div className="flex items-center gap-2 border-b border-zinc-200 pt-6 mt-6 overflow-x-auto no-scrollbar">
          <button
            id="tab-namestyle-studio"
            onClick={() => setSelectedTab("STUDIO")}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              selectedTab === "STUDIO"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Interactive Styling Studio</span>
          </button>

          <button
            id="tab-namestyle-fonts"
            onClick={() => setSelectedTab("FONTS_CATALOG")}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              selectedTab === "FONTS_CATALOG"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <Type className="w-4 h-4" />
            <span>12 Discord Fonts Catalog</span>
          </button>

          <button
            id="tab-namestyle-effects"
            onClick={() => setSelectedTab("EFFECTS_CATALOG")}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              selectedTab === "EFFECTS_CATALOG"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>6 Visual Effects Catalog</span>
          </button>

          <button
            id="tab-namestyle-api"
            onClick={() => setSelectedTab("API_DOCS")}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              selectedTab === "API_DOCS"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <Code className="w-4 h-4" />
            <span>Discord REST API Payload & Slash Commands</span>
          </button>
        </div>
      </div>

      {/* 1. STUDIO TAB */}
      {selectedTab === "STUDIO" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Style Controls (8 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Display Name & Clan Tag */}
            <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <Type className="w-4 h-4 text-indigo-600" />
                <span>Bot Identity & Display Name</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 mb-1">
                    Display Name (2-32 chars)
                  </label>
                  <input
                    id="input-display-name"
                    type="text"
                    value={config.displayName}
                    maxLength={32}
                    onChange={(e) => updateStyle({ displayName: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 bg-zinc-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-600 mb-1">
                    Clan / Server Tag Badge (2-4 chars)
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="input-clan-badge"
                      type="text"
                      value={config.clanBadge || ""}
                      maxLength={4}
                      placeholder="🛡️"
                      onChange={(e) => updateStyle({ clanBadge: e.target.value })}
                      className="w-16 px-2 py-2 text-center text-sm rounded-xl border border-zinc-200 bg-zinc-50/50 focus:bg-white focus:outline-hidden"
                    />
                    <input
                      id="input-clan-tag"
                      type="text"
                      value={config.clanTag || ""}
                      maxLength={4}
                      placeholder="AEGIS"
                      onChange={(e) => updateStyle({ clanTag: e.target.value.toUpperCase() })}
                      className="flex-1 px-3 py-2 text-sm rounded-xl border border-zinc-200 bg-zinc-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 uppercase font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-zinc-100 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-zinc-700">
                  <input
                    type="checkbox"
                    checked={config.autoSyncNickname}
                    onChange={(e) => updateStyle({ autoSyncNickname: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Automatically synchronize guild nickname to match active name style</span>
                </label>
              </div>
            </div>

            {/* Font Picker (12 Fonts) */}
            <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                  <Type className="w-4 h-4 text-indigo-600" />
                  <span>Choose Font (12 Available)</span>
                </h3>
                <span className="text-xs text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded-full">
                  Active: {activeFont.name}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {BOT_NAME_FONTS.map((font) => {
                  const isSelected = config.fontId === font.id;
                  return (
                    <button
                      key={font.id}
                      id={`font-select-${font.id}`}
                      onClick={() => updateStyle({ fontId: font.id })}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? "border-indigo-600 bg-indigo-50/40 shadow-xs ring-2 ring-indigo-500/20"
                          : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/60 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600">
                          {font.category}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                      </div>
                      <div className="text-xs font-bold text-zinc-900 truncate">{font.name}</div>
                      <div className="text-[11px] text-zinc-500 truncate mt-0.5">{font.description}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Visual Effect Picker (6 Effects) */}
            <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Visual Effect (6 Available)</span>
                </h3>
                <span className="text-xs text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded-full">
                  Active: {activeEffect.name}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {BOT_NAME_EFFECTS.map((effect) => {
                  const isSelected = config.effectId === effect.id;
                  return (
                    <button
                      key={effect.id}
                      id={`effect-select-${effect.id}`}
                      onClick={() => updateStyle({ effectId: effect.id })}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? "border-indigo-600 bg-indigo-50/40 shadow-xs ring-2 ring-indigo-500/20"
                          : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/60 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700">
                          {effect.badge}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                      </div>
                      <div className="text-xs font-bold text-zinc-900">{effect.name}</div>
                      <div className="text-[11px] text-zinc-500 truncate mt-0.5">{effect.description}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color Presets & Custom Picker */}
            <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-indigo-600" />
                  <span>Color & Palette (Decimal Compatible)</span>
                </h3>
                <span className="text-xs font-mono text-zinc-500">
                  {config.primaryColor} • Dec: {hexToDiscordDecimal(config.primaryColor)}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {BOT_COLOR_PRESETS.map((col) => {
                  const isSelected = config.primaryColor.toLowerCase() === col.hex.toLowerCase();
                  return (
                    <button
                      key={col.id}
                      id={`color-preset-${col.id}`}
                      onClick={() =>
                        updateStyle({
                          primaryColor: col.hex,
                          secondaryColor: col.secondaryHex || col.hex,
                        })
                      }
                      title={`${col.name} (${col.hex})`}
                      className={`w-9 h-9 rounded-xl transition-transform flex items-center justify-center ${
                        isSelected ? "ring-3 ring-indigo-500 scale-110 shadow-md" : "hover:scale-105"
                      }`}
                      style={{ backgroundColor: col.hex }}
                    >
                      {isSelected && <Check className="w-4 h-4 text-white drop-shadow-sm" />}
                    </button>
                  );
                })}

                <div className="flex items-center gap-2 ml-auto">
                  <label className="text-xs font-semibold text-zinc-600">Custom:</label>
                  <input
                    type="color"
                    value={config.primaryColor}
                    onChange={(e) => updateStyle({ primaryColor: e.target.value })}
                    className="w-9 h-9 rounded-xl border border-zinc-200 cursor-pointer p-0.5 bg-white"
                  />
                  {config.effectId === "gradient" && (
                    <input
                      type="color"
                      value={config.secondaryColor || config.primaryColor}
                      onChange={(e) => updateStyle({ secondaryColor: e.target.value })}
                      title="Gradient Secondary Color"
                      className="w-9 h-9 rounded-xl border border-zinc-200 cursor-pointer p-0.5 bg-white"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Discord Chat & Member List Preview (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Live Discord Client Simulation */}
            <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800 shadow-xl text-white space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-zinc-200 tracking-wide uppercase">
                    Discord Client Preview
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPreviewTheme(previewTheme === "DARK" ? "LIGHT" : "DARK")}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                  >
                    {previewTheme} MODE
                  </button>
                </div>
              </div>

              {/* Server Member List Item Simulation */}
              <div>
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                  Server Members List
                </span>
                <div className="bg-zinc-800/80 rounded-xl p-3 flex items-center gap-3 border border-zinc-700/50">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-zinc-800" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Formatted Display Name with Font & Effect */}
                      <span
                        className={`text-sm ${activeEffect.previewClass}`}
                        style={{
                          color: config.effectId !== "gradient" ? config.primaryColor : undefined,
                          backgroundImage:
                            config.effectId === "gradient"
                              ? `linear-gradient(90deg, ${config.primaryColor}, ${config.secondaryColor || config.primaryColor})`
                              : undefined,
                        }}
                      >
                        {config.displayName}
                      </span>

                      {/* Clan / Server Tag Badge */}
                      {config.clanTag && (
                        <span className="px-1.5 py-0.2 rounded bg-zinc-700/80 text-[10px] font-mono font-bold text-zinc-300 border border-zinc-600">
                          {config.clanBadge ? `${config.clanBadge} ` : ""}
                          {config.clanTag}
                        </span>
                      )}

                      {/* BOT Tag */}
                      <span className="px-1.5 py-0.2 rounded bg-indigo-600 text-[10px] font-extrabold text-white uppercase tracking-wider">
                        BOT
                      </span>
                    </div>

                    <div className="text-[11px] text-zinc-400 truncate mt-0.5">
                      Playing <strong>AegisMod Hybrid Security</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chat Message Simulation */}
              <div>
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                  In-Chat Message Bubble
                </span>
                <div className="bg-zinc-950/60 rounded-xl p-3.5 border border-zinc-800 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                    <Shield className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span
                        className={`text-xs ${activeEffect.previewClass}`}
                        style={{
                          color: config.effectId !== "gradient" ? config.primaryColor : undefined,
                          backgroundImage:
                            config.effectId === "gradient"
                              ? `linear-gradient(90deg, ${config.primaryColor}, ${config.secondaryColor || config.primaryColor})`
                              : undefined,
                        }}
                      >
                        {config.displayName}
                      </span>
                      {config.clanTag && (
                        <span className="px-1 py-0.2 rounded bg-zinc-800 text-[9px] font-mono text-zinc-400 border border-zinc-700">
                          {config.clanBadge ? `${config.clanBadge} ` : ""}
                          {config.clanTag}
                        </span>
                      )}
                      <span className="px-1 py-0.2 rounded bg-indigo-600 text-[9px] font-bold text-white uppercase">
                        BOT
                      </span>
                      <span className="text-[10px] text-zinc-500">Today at 4:20 PM</span>
                    </div>

                    <p className="text-xs text-zinc-300 leading-relaxed">
                      🛡️ All server security checks verified. Triage latency: <strong>0ms</strong> (Token efficient).
                    </p>
                  </div>
                </div>
              </div>

              {/* Nickname Fallback Simulation */}
              <div className="p-3 rounded-xl bg-zinc-800/40 border border-zinc-800 text-xs text-zinc-400 space-y-1">
                <div className="flex items-center justify-between text-zinc-300 font-semibold">
                  <span>Server Nickname String:</span>
                  <span className="font-mono text-indigo-400 text-[11px]">{formattedNickname}</span>
                </div>
                <p className="text-[11px] text-zinc-500">
                  Applied to servers where custom font rendering falls back to standard text or Unicode transformations.
                </p>
              </div>
            </div>

            {/* Live Discord REST API Payload JSON */}
            <div className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-800">
                  <Terminal className="w-4 h-4 text-indigo-600" />
                  <span>Discord REST API Payload (PATCH /users/@me)</span>
                </div>
                <button
                  id="copy-payload-btn"
                  onClick={copyJsonPayload}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  {copiedPayload ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy JSON</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="p-3 rounded-xl bg-zinc-900 text-zinc-200 text-[11px] font-mono overflow-x-auto border border-zinc-800 leading-relaxed">
                {JSON.stringify(apiPayload, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* 2. FONTS CATALOG TAB */}
      {selectedTab === "FONTS_CATALOG" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-zinc-900">12 Official Discord Display Name Fonts</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Full catalog of fonts available through Discord's bot styling system and Nitro Display Name Styles.
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              12 Typography Presets
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {BOT_NAME_FONTS.map((font, idx) => {
              const isSelected = config.fontId === font.id;
              return (
                <div
                  key={font.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isSelected
                      ? "border-indigo-600 bg-indigo-50/30 ring-2 ring-indigo-500/20"
                      : "border-zinc-200 hover:border-zinc-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono text-zinc-400 font-bold">#{idx + 1}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700">
                      {font.category}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-zinc-900 mb-1">{font.name}</h4>
                  <p className="text-xs text-zinc-500 mb-4 line-clamp-2">{font.description}</p>

                  <div className="p-3 rounded-xl bg-zinc-900 text-white mb-3">
                    <div className="text-[10px] text-zinc-400 uppercase font-bold mb-1">Preview</div>
                    <div className="text-base font-bold text-indigo-300 truncate">{config.displayName}</div>
                  </div>

                  <button
                    onClick={() => updateStyle({ fontId: font.id })}
                    className={`w-full py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isSelected
                        ? "bg-indigo-600 text-white"
                        : "border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700"
                    }`}
                  >
                    {isSelected ? "Active Font" : "Select Font"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. EFFECTS CATALOG TAB */}
      {selectedTab === "EFFECTS_CATALOG" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-xs space-y-6">
          <div>
            <h3 className="text-lg font-bold text-zinc-900">6 Discord Visual Shader Effects</h3>
            <p className="text-xs text-zinc-500 mt-1">
              Shaders and visual text effects rendering dynamically on Discord bots.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {BOT_NAME_EFFECTS.map((effect, idx) => {
              const isSelected = config.effectId === effect.id;
              return (
                <div
                  key={effect.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    isSelected
                      ? "border-indigo-600 bg-indigo-50/30 ring-2 ring-indigo-500/20"
                      : "border-zinc-200 hover:border-zinc-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono text-zinc-400 font-bold">Effect #{idx + 1}</span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                      {effect.badge}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-zinc-900 mb-1">{effect.name}</h4>
                  <p className="text-xs text-zinc-500 mb-4">{effect.description}</p>

                  <div className="p-4 rounded-xl bg-zinc-950 text-center mb-3">
                    <span className={`text-lg ${effect.previewClass}`}>{config.displayName}</span>
                  </div>

                  <button
                    onClick={() => updateStyle({ effectId: effect.id })}
                    className={`w-full py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isSelected
                        ? "bg-indigo-600 text-white"
                        : "border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700"
                    }`}
                  >
                    {isSelected ? "Active Effect" : "Select Effect"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. API DOCS TAB */}
      {selectedTab === "API_DOCS" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-xs space-y-6">
          <div>
            <h3 className="text-lg font-bold text-zinc-900">Discord API & Slash Commands Reference</h3>
            <p className="text-xs text-zinc-500 mt-1">
              Complete technical specification for bot display name styles using Discord.js v14 and Discord REST API v10.
            </p>
          </div>

          {/* Slash Commands */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-600" />
              <span>Available Slash Commands</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200">
                <code className="text-xs font-bold text-indigo-600">/namestyle view</code>
                <p className="text-xs text-zinc-600 mt-1">
                  Displays an interactive Discord Embed showing the active font, effect, color, decimal code, and interactive buttons to cycle fonts.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200">
                <code className="text-xs font-bold text-indigo-600">/namestyle list</code>
                <p className="text-xs text-zinc-600 mt-1">
                  Lists all 12 supported Discord fonts and 6 visual shader effects with descriptions.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200">
                <code className="text-xs font-bold text-indigo-600">/namestyle set [font] [effect] [color] [name] [clan_tag]</code>
                <p className="text-xs text-zinc-600 mt-1">
                  Updates bot styling and synchronizes server nickname and Discord REST API configuration.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200">
                <code className="text-xs font-bold text-indigo-600">/namestyle sync</code>
                <p className="text-xs text-zinc-600 mt-1">
                  Forces an immediate refresh of the current server's bot nickname to reflect the active name style.
                </p>
              </div>
            </div>
          </div>

          {/* Discord REST API Endpoint */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <Code className="w-4 h-4 text-indigo-600" />
              <span>REST API Implementation (Discord.js / Node.js)</span>
            </h4>

            <pre className="p-4 rounded-2xl bg-zinc-900 text-zinc-200 text-xs font-mono overflow-x-auto leading-relaxed border border-zinc-800">
{`// Example Discord REST API call to apply Name Styles
import { REST, Routes } from "discord.js";

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_BOT_TOKEN);

await rest.patch(Routes.user(), {
  body: {
    username: "AegisMod",
    name_style: {
      font_id: "bangers",        // One of 12 fonts
      effect_id: "gradient",     // One of 6 effects
      colors: [5793266, 15485081] // Decimal color values
    },
    clan: {
      tag: "AEGIS",
      badge: "🛡️",
      identity_enabled: true
    }
  }
});`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
