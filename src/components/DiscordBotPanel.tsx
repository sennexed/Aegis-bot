import React, { useState } from "react";
import {
  Shield,
  Server,
  Zap,
  Users,
  BarChart3,
  Sliders,
  FileText,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  RefreshCw,
  Search,
  Settings,
  Terminal,
  Clock,
  UserCheck,
  Send,
  Eye,
  ChevronRight,
  ChevronLeft,
  Filter,
  Check,
  XCircle,
  HelpCircle,
  Radio,
  Layers,
  Flame,
} from "lucide-react";

export const DiscordBotPanel: React.FC = () => {
  // Navigation State (9 Modules)
  const [activeModule, setActiveModule] = useState<
    | "overview"
    | "moderation"
    | "security"
    | "aimod"
    | "members"
    | "analytics"
    | "config"
    | "auditlogs"
    | "diagnostics"
  >("overview");

  // Interactive UI State
  const [panelMessageId] = useState("MSG-8941029384102");
  const [isUpdating, setIsUpdating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Security Module Toggles (Medium Mode default)
  const [securitySettings, setSecuritySettings] = useState({
    antiSpam: true,
    antiRaid: true,
    antiPhishing: true,
    inviteFiltering: true,
    accountAgeDays: 3, // Medium-tier maturity gate
  });

  // AI Moderation State
  const [aiConfig] = useState({
    provider: "Gemini 2.5 Flash Lite",
    sensitivity: "Medium (Balanced)",
    confidenceThreshold: 0.85,
    autoQuarantine: true,
  });

  // Moderation Action State
  const [targetMember, setTargetMember] = useState("AlexGamer16#1029");
  const [modActionType, setModActionType] = useState<"WARN" | "TIMEOUT" | "KICK" | "BAN">("TIMEOUT");
  const [modReason, setModReason] = useState("Violation of community safety guidelines");
  const [modDuration] = useState("1 Hour");
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Configuration State
  const [configRoles] = useState({
    moderatorRole: "@Moderator (Staff)",
    adminRole: "@Administrator",
    ownerRole: "@Server Owner",
    logChannel: "#mod-logs",
  });

  const triggerUpdate = (actionDesc: string) => {
    setIsUpdating(true);
    setToastMessage(`⚡ Updating panel view: ${actionDesc}`);
    setTimeout(() => {
      setIsUpdating(false);
    }, 400);
  };

  const executeActionWithConfirmation = () => {
    setShowConfirmModal(false);
    setToastMessage(`✅ Successfully executed ${modActionType} against ${targetMember}. Logged to #mod-logs.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const navigationModules = [
    { id: "overview", label: "Overview", icon: Layers, desc: "Status & health summary" },
    { id: "moderation", label: "Moderation", icon: Shield, desc: "Warn, timeout, kick, ban" },
    { id: "security", label: "Security Center", icon: Lock, desc: "Anti-spam & anti-raid" },
    { id: "aimod", label: "AI Moderation", icon: Zap, desc: "Gemini Flash & queue" },
    { id: "members", label: "Member Management", icon: Users, desc: "Lookup & passports" },
    { id: "analytics", label: "Analytics", icon: BarChart3, desc: "Metrics & reports" },
    { id: "config", label: "Configuration", icon: Settings, desc: "Roles & channels" },
    { id: "auditlogs", label: "Audit Logs", icon: FileText, desc: "Searchable event history" },
    { id: "diagnostics", label: "Diagnostics", icon: Activity, desc: "Gateway & uptime" },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs tracking-wider uppercase">
              <Terminal className="w-4 h-4" />
              <span>Discord Components V2 • Native Interface System</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 mt-1">
              Advanced Discord Bot Control Panel (`/panel`)
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 mt-1 max-w-3xl">
              Professional Discord-native administration interface. Features persistent interactive components,
              ephemeral confirmation flows, 9 navigation modules, and Medium-tier balanced safety automation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-medium text-xs rounded-full border border-emerald-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Discord Gateway Connected
            </span>
          </div>
        </div>

        {/* Toast Notification */}
        {toastMessage && (
          <div className="mt-4 p-3 rounded-lg text-xs font-semibold flex items-center justify-between bg-indigo-50 border border-indigo-200 text-indigo-900">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-indigo-400 hover:text-indigo-600">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Discord Dark-Theme Container (Components V2 Layout Simulator) */}
      <div className="bg-[#313338] text-white rounded-2xl overflow-hidden shadow-xl border border-zinc-800 font-sans">
        {/* Discord Top Bar Simulation */}
        <div className="px-5 py-3.5 bg-[#2b2d31] border-b border-[#1f2023] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-xs">
              🤖
            </div>
            <div>
              <div className="font-bold text-white flex items-center gap-2">
                <span>AegisBot#9921</span>
                <span className="bg-indigo-600 text-white text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider">
                  BOT
                </span>
              </div>
              <div className="text-[11px] text-zinc-400">Interactive Components V2 • Panel ID: {panelMessageId}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => triggerUpdate("Refreshed Panel State")}
              className="px-3 py-1.5 bg-[#35373c] hover:bg-[#404249] text-zinc-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? "animate-spin" : ""}`} />
              <span>Refresh Panel</span>
            </button>
            <button
              onClick={() => setToastMessage("🔒 Panel session closed.")}
              className="px-3 py-1.5 bg-[#4e5058]/40 hover:bg-rose-900/60 text-zinc-300 hover:text-white rounded-lg text-xs font-semibold transition-all"
            >
              Close Panel
            </button>
          </div>
        </div>

        {/* Navigation Modules Ribbon */}
        <div className="bg-[#2b2d31] border-b border-[#1f2023] px-4 py-2.5 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {navigationModules.map((mod) => {
            const Icon = mod.icon;
            const isSel = activeModule === mod.id;
            return (
              <button
                key={mod.id}
                onClick={() => {
                  setActiveModule(mod.id as any);
                  triggerUpdate(`Loaded ${mod.label}`);
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isSel
                    ? "bg-indigo-600 text-white shadow-md ring-1 ring-indigo-400"
                    : "bg-[#35373c] text-zinc-300 hover:bg-[#404249] hover:text-white"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{mod.label}</span>
              </button>
            );
          })}
        </div>

        {/* Panel Main Content Container (Discord Embed & Components V2) */}
        <div className="p-6 bg-[#313338] min-h-[440px] space-y-6">
          {/* MODULE 1: OVERVIEW */}
          {activeModule === "overview" && (
            <div className="space-y-5">
              <div className="border-l-4 border-indigo-500 bg-[#2b2d31] rounded-r-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-base flex items-center gap-2">
                    <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                    <span>AegisMod Control Center • Server Overview</span>
                  </h3>
                  <span className="text-xs text-zinc-400 font-mono">Uptime: 99.98%</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-[#232428] p-3 rounded-xl border border-zinc-700/60">
                    <span className="text-zinc-400 block text-[11px]">Server Name</span>
                    <span className="font-bold text-white text-sm mt-0.5 block truncate">Teen Gaming Lounge</span>
                  </div>
                  <div className="bg-[#232428] p-3 rounded-xl border border-zinc-700/60">
                    <span className="text-zinc-400 block text-[11px]">Total Members</span>
                    <span className="font-bold text-emerald-400 text-sm mt-0.5 block">2,480 Active</span>
                  </div>
                  <div className="bg-[#232428] p-3 rounded-xl border border-zinc-700/60">
                    <span className="text-zinc-400 block text-[11px]">Security Mode</span>
                    <span className="font-bold text-amber-400 text-sm mt-0.5 block">Medium (Balanced)</span>
                  </div>
                  <div className="bg-[#232428] p-3 rounded-xl border border-zinc-700/60">
                    <span className="text-zinc-400 block text-[11px]">AI Service Status</span>
                    <span className="font-bold text-indigo-400 text-sm mt-0.5 block">Gemini 2.5 Flash Lite</span>
                  </div>
                </div>

                <div className="bg-[#232428] p-4 rounded-xl border border-zinc-700/60 space-y-2">
                  <span className="text-xs font-bold text-zinc-300 block">Active Security Modules</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    <div className="flex items-center gap-2 text-zinc-300">
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> Anti-Spam (Medium)
                    </div>
                    <div className="flex items-center gap-2 text-zinc-300">
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> Anti-Raid Gatekeeper
                    </div>
                    <div className="flex items-center gap-2 text-zinc-300">
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> Phishing Domain Filter
                    </div>
                    <div className="flex items-center gap-2 text-zinc-300">
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> Invite Link Interceptor
                    </div>
                    <div className="flex items-center gap-2 text-zinc-300">
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> Account Maturity (3d)
                    </div>
                    <div className="flex items-center gap-2 text-zinc-300">
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> Zero-Token Triage
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MODULE 2: MODERATION INTERFACE */}
          {activeModule === "moderation" && (
            <div className="bg-[#2b2d31] rounded-xl p-5 space-y-4">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-400" />
                <span>Moderation Action Execution Suite</span>
              </h3>
              <p className="text-xs text-zinc-400">
                Execute warnings, timeouts, kicks, or bans with reason logging and automatic staff audit dispatch.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-zinc-400 font-medium block mb-1">Target Member Tag</label>
                  <input
                    type="text"
                    value={targetMember}
                    onChange={(e) => setTargetMember(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1e1f22] border border-zinc-700 rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 font-medium block mb-1">Action Type</label>
                  <select
                    value={modActionType}
                    onChange={(e) => setModActionType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#1e1f22] border border-zinc-700 rounded-lg text-white"
                  >
                    <option value="WARN">⚠️ Issue Official Warning</option>
                    <option value="TIMEOUT">⏳ Apply Timeout (Mute)</option>
                    <option value="KICK">👢 Kick from Server</option>
                    <option value="BAN">🔨 Permanent Server Ban</option>
                  </select>
                </div>

                {modActionType === "TIMEOUT" && (
                  <div>
                    <label className="text-zinc-400 font-medium block mb-1">Timeout Duration</label>
                    <select
                      value={modDuration}
                      className="w-full px-3 py-2 bg-[#1e1f22] border border-zinc-700 rounded-lg text-white"
                    >
                      <option value="15 Minutes">15 Minutes</option>
                      <option value="1 Hour">1 Hour (Medium)</option>
                      <option value="24 Hours">24 Hours</option>
                      <option value="7 Days">7 Days</option>
                    </select>
                  </div>
                )}

                <div className="sm:col-span-2">
                  <label className="text-zinc-400 font-medium block mb-1">Moderation Reason</label>
                  <input
                    type="text"
                    value={modReason}
                    onChange={(e) => setModReason(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1e1f22] border border-zinc-700 rounded-lg text-white"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  onClick={() => setShowConfirmModal(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow"
                >
                  Execute Action...
                </button>
              </div>
            </div>
          )}

          {/* MODULE 3: SECURITY CENTER */}
          {activeModule === "security" && (
            <div className="bg-[#2b2d31] rounded-xl p-5 space-y-4">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Lock className="w-4 h-4 text-indigo-400" />
                <span>Security Center • Medium Protection Settings</span>
              </h3>
              <p className="text-xs text-zinc-400">
                Configure anti-spam thresholds, phishing filters, and account maturity requirements (adjusted for balanced medium-strictness).
              </p>

              <div className="space-y-3 text-xs">
                {[
                  { key: "antiSpam", title: "Anti-Spam & Flood Shield", desc: "Flags rapid message bursts exceeding 6 messages / 4s" },
                  { key: "antiRaid", title: "Anti-Raid Gatekeeper", desc: "Elevates verification on join velocity spikes (>12 joins/10s)" },
                  { key: "antiPhishing", title: "Phishing & Scam Link Interceptor", desc: "Blocks lookalike domains (e.g. discrod-app.gift)" },
                  { key: "inviteFiltering", title: "Unauthorized Invite Link Blocker", desc: "Prevents advertising competing Discord servers" },
                ].map((item) => {
                  const val = (securitySettings as any)[item.key];
                  return (
                    <div key={item.key} className="flex items-center justify-between p-3.5 bg-[#232428] rounded-xl border border-zinc-700/60">
                      <div>
                        <span className="font-bold text-white block">{item.title}</span>
                        <span className="text-[11px] text-zinc-400">{item.desc}</span>
                      </div>
                      <button
                        onClick={() => {
                          setSecuritySettings({ ...securitySettings, [item.key]: !val });
                          triggerUpdate(`Toggled ${item.title}`);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          val ? "bg-emerald-600 text-white" : "bg-zinc-700 text-zinc-400"
                        }`}
                      >
                        {val ? "ENABLED" : "DISABLED"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* MODULE 4: AI MODERATION */}
          {activeModule === "aimod" && (
            <div className="bg-[#2b2d31] rounded-xl p-5 space-y-4">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Zap className="w-4 h-4 text-indigo-400" />
                <span>AI Moderation Center (Gemini 2.5 Flash Lite)</span>
              </h3>
              <p className="text-xs text-zinc-400">
                Configured with <strong>Medium Balanced Sensitivity</strong> to prevent false positives on teen slang while reliably blocking grooming, bullying, and self-harm.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-[#232428] rounded-xl border border-zinc-700/60">
                  <span className="text-zinc-400 block text-[11px]">Active AI Model</span>
                  <span className="font-bold text-indigo-400 text-sm mt-0.5 block">{aiConfig.provider}</span>
                </div>
                <div className="p-3.5 bg-[#232428] rounded-xl border border-zinc-700/60">
                  <span className="text-zinc-400 block text-[11px]">Sensitivity Stance</span>
                  <span className="font-bold text-emerald-400 text-sm mt-0.5 block">{aiConfig.sensitivity}</span>
                </div>
              </div>

              <div className="bg-[#232428] p-4 rounded-xl border border-zinc-700/60 space-y-2">
                <span className="text-xs font-bold text-white">Pending Review Queue (0 Messages)</span>
                <p className="text-xs text-zinc-400">
                  All messages evaluated under medium-strictness triage pass cleanly with 0ms latency unless flagged for nuanced PII/harassment.
                </p>
              </div>
            </div>
          )}

          {/* MODULE 5: MEMBER MANAGEMENT */}
          {activeModule === "members" && (
            <div className="bg-[#2b2d31] rounded-xl p-5 space-y-4">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <span>Member Management & Passport Lookup</span>
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search user by tag or ID..."
                  defaultValue="AlexGamer16#1029"
                  className="flex-1 px-3 py-2 bg-[#1e1f22] border border-zinc-700 rounded-lg text-xs text-white"
                />
                <button
                  onClick={() => setToastMessage("🔍 User Passport loaded successfully.")}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold"
                >
                  Lookup
                </button>
              </div>

              <div className="p-4 bg-[#232428] rounded-xl border border-zinc-700/60 space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-zinc-700 pb-2">
                  <span className="font-bold text-white">AlexGamer16#1029</span>
                  <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 rounded font-bold text-[10px]">Trust: 90% (CLEAN)</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div>Account Age: <strong className="text-white">45 Days</strong></div>
                  <div>Server Tenure: <strong className="text-white">14 Days</strong></div>
                  <div>Active Strikes: <strong className="text-amber-400">0</strong></div>
                  <div>Timeout Status: <strong className="text-white">None</strong></div>
                </div>
              </div>
            </div>
          )}

          {/* MODULE 6: ANALYTICS */}
          {activeModule === "analytics" && (
            <div className="bg-[#2b2d31] rounded-xl p-5 space-y-4">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                <span>Analytics & Moderation Metrics</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-[#232428] p-3 rounded-xl border border-zinc-700">
                  <div className="text-xl font-black text-indigo-400">248</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">Actions (30d)</div>
                </div>
                <div className="bg-[#232428] p-3 rounded-xl border border-zinc-700">
                  <div className="text-xl font-black text-amber-400">62</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">Timeouts</div>
                </div>
                <div className="bg-[#232428] p-3 rounded-xl border border-zinc-700">
                  <div className="text-xl font-black text-emerald-400">89.4%</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">Token Reduction</div>
                </div>
                <div className="bg-[#232428] p-3 rounded-xl border border-zinc-700">
                  <div className="text-xl font-black text-sky-400">&lt; 280ms</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">Avg Response</div>
                </div>
              </div>
            </div>
          )}

          {/* MODULE 7: CONFIGURATION */}
          {activeModule === "config" && (
            <div className="bg-[#2b2d31] rounded-xl p-5 space-y-4">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Settings className="w-4 h-4 text-indigo-400" />
                <span>Configuration Center • Role & Channel Bindings</span>
              </h3>
              <div className="space-y-3 text-xs">
                <div className="p-3.5 bg-[#232428] rounded-xl border border-zinc-700 flex items-center justify-between">
                  <span>Moderator Staff Role</span>
                  <strong className="text-indigo-400">{configRoles.moderatorRole}</strong>
                </div>
                <div className="p-3.5 bg-[#232428] rounded-xl border border-zinc-700 flex items-center justify-between">
                  <span>Administrator Role</span>
                  <strong className="text-indigo-400">{configRoles.adminRole}</strong>
                </div>
                <div className="p-3.5 bg-[#232428] rounded-xl border border-zinc-700 flex items-center justify-between">
                  <span>Audit Log Channel</span>
                  <strong className="text-emerald-400">{configRoles.logChannel}</strong>
                </div>
              </div>
            </div>
          )}

          {/* MODULE 8: AUDIT LOGS */}
          {activeModule === "auditlogs" && (
            <div className="bg-[#2b2d31] rounded-xl p-5 space-y-4">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                <span>Searchable Audit Logs (`#mod-logs`)</span>
              </h3>
              <div className="space-y-2 text-xs">
                {[
                  { id: "CASE-1048", user: "BadActor#9912", action: "BAN", time: "3m ago", mod: "AutoMod" },
                  { id: "CASE-1047", user: "ScamBot#0014", action: "TIMEOUT", time: "24m ago", mod: "Gemini AI" },
                  { id: "CASE-1046", user: "TrollGuy#4412", action: "WARN", time: "1h ago", mod: "Sarah_Mod" },
                ].map((log) => (
                  <div key={log.id} className="p-3 bg-[#232428] rounded-xl border border-zinc-700 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white">[{log.id}] {log.action}</span> — User: <strong className="text-zinc-300">{log.user}</strong> (Mod: {log.mod})
                    </div>
                    <span className="text-zinc-400 text-[11px]">{log.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MODULE 9: SYSTEM DIAGNOSTICS */}
          {activeModule === "diagnostics" && (
            <div className="bg-[#2b2d31] rounded-xl p-5 space-y-4">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-400" />
                <span>System Diagnostics & Health</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 bg-[#232428] rounded-xl border border-zinc-700">
                  <span className="text-zinc-400 text-[11px]">Gateway Status</span>
                  <strong className="text-emerald-400 text-sm block mt-1">Operational (18ms)</strong>
                </div>
                <div className="p-3.5 bg-[#232428] rounded-xl border border-zinc-700">
                  <span className="text-zinc-400 text-[11px]">Database Persistence</span>
                  <strong className="text-emerald-400 text-sm block mt-1">SQLite / JSON Storage</strong>
                </div>
                <div className="p-3.5 bg-[#232428] rounded-xl border border-zinc-700">
                  <span className="text-zinc-400 text-[11px]">Software Version</span>
                  <strong className="text-indigo-400 text-sm block mt-1">AegisMod v2.4.0</strong>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CONFIRMATION MODAL (Components V2) */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-zinc-900 text-white border border-zinc-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-base flex items-center gap-2 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
              Confirm Moderation Action
            </h3>
            <p className="text-xs text-zinc-300">
              You are about to execute <strong className="text-white">{modActionType}</strong> against{" "}
              <strong className="text-white">{targetMember}</strong>.
            </p>
            <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 text-xs space-y-1">
              <div>Reason: <span className="text-zinc-300">{modReason}</span></div>
              {modActionType === "TIMEOUT" && <div>Duration: <span className="text-zinc-300">{modDuration}</span></div>}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={executeActionWithConfirmation}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow"
              >
                Confirm & Execute
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
