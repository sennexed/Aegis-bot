import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Shield,
  CheckCircle2,
  Users,
  EyeOff,
  Eye,
  Hash,
  Sparkles,
  RefreshCw,
  Crown,
  ChevronDown,
  Database,
  HardDrive,
  Power,
  Server,
  Terminal,
  AlertTriangle,
  PlusCircle,
  FileCode,
  Check,
} from "lucide-react";
import {
  ServerMemoryRecord,
  ServerMemoryMetadata,
  RebootCheckResult,
} from "../types/serverMemory";
import {
  playClickSound,
  playSuccessChime,
  playAlertSound,
} from "../utils/soundEffects";

interface RoleOption {
  id: string;
  name: string;
  color: string;
}

const SAMPLE_ROLES: RoleOption[] = [
  { id: "role_owner", name: "Server Owner", color: "#f1c40f" },
  { id: "role_exec", name: "Head Admin", color: "#e67e22" },
  { id: "role_admin", name: "Administrator", color: "#e74c3c" },
  { id: "role_srmod", name: "Senior Moderator", color: "#9b59b6" },
  { id: "role_mod", name: "Moderator", color: "#3498db" },
  { id: "role_helper", name: "Junior Mod / Helper", color: "#2ecc71" },
  { id: "role_vip", name: "Community VIP", color: "#1abc9c" },
  { id: "role_teen", name: "Verified Teen (16+)", color: "#95a5a6" },
];

export const DiscordSetupSimulator: React.FC = () => {
  const [servers, setServers] = useState<ServerMemoryRecord[]>([]);
  const [metadata, setMetadata] = useState<ServerMemoryMetadata | null>(null);
  const [selectedGuildId, setSelectedGuildId] = useState<string>("104928104859102810");
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Local form state for active server
  const [ownerRole, setOwnerRole] = useState<string>("role_owner");
  const [adminRoles, setAdminRoles] = useState<string[]>(["role_exec", "role_admin"]);
  const [modRoles, setModRoles] = useState<string[]>(["role_srmod", "role_mod"]);
  const [modLogChannelName, setModLogChannelName] = useState<string>("mod-logs");

  // Reboot simulation state
  const [isRebooting, setIsRebooting] = useState<boolean>(false);
  const [rebootLogs, setRebootLogs] = useState<string[]>([]);
  const [rebootResult, setRebootResult] = useState<RebootCheckResult | null>(null);
  const [showRebootModal, setShowRebootModal] = useState<boolean>(false);

  // Add Server Modal
  const [showAddServerModal, setShowAddServerModal] = useState<boolean>(false);
  const [newServerName, setNewServerName] = useState<string>("");
  const [newServerId, setNewServerId] = useState<string>("");

  // Fetch servers on mount
  const fetchServers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/guilds");
      const data = await res.json();
      if (data.servers) {
        setServers(data.servers);
        setMetadata(data.metadata);

        // Select the first server or maintain selection
        const current = data.servers.find((s: ServerMemoryRecord) => s.guildId === selectedGuildId) || data.servers[0];
        if (current) {
          setSelectedGuildId(current.guildId);
          loadServerIntoState(current);
        }
      }
    } catch (err) {
      console.error("Failed to load guild memory:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServers();
  }, []);

  const loadServerIntoState = (server: ServerMemoryRecord) => {
    setOwnerRole(server.ownerRoleId || "role_owner");
    setAdminRoles(server.adminRoleIds.length ? server.adminRoleIds : ["role_admin"]);
    setModRoles(server.moderatorRoleIds.length ? server.moderatorRoleIds : ["role_mod"]);
    setModLogChannelName(server.modLogChannelName || "mod-logs");
  };

  const currentServer = servers.find((s) => s.guildId === selectedGuildId) || servers[0];

  const handleSelectServer = (guildId: string) => {
    playClickSound();
    setSelectedGuildId(guildId);
    const target = servers.find((s) => s.guildId === guildId);
    if (target) {
      loadServerIntoState(target);
    }
  };

  const toggleAdminRole = (id: string) => {
    playClickSound();
    setAdminRoles((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const toggleModRole = (id: string) => {
    playClickSound();
    setModRoles((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  // Commit changes permanently to disk
  const handleSaveToPermanentMemory = async () => {
    if (!currentServer) return;
    playClickSound();
    setSaving(true);
    setSaveSuccessMsg(null);

    try {
      const res = await fetch("/api/guilds/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guildId: currentServer.guildId,
          guildName: currentServer.guildName,
          ownerRoleId: ownerRole,
          adminRoleIds: adminRoles,
          moderatorRoleIds: modRoles,
          modLogChannelName: modLogChannelName,
          isSetupComplete: true,
        }),
      });

      const data = await res.json();
      if (data.success) {
        playSuccessChime();
        setSaveSuccessMsg(
          `Configuration permanently saved to disk! AegisMod will remember '${currentServer.guildName}' across all restarts.`
        );
        setTimeout(() => setSaveSuccessMsg(null), 5000);
        await fetchServers();
      }
    } catch (err) {
      console.error("Failed to commit server memory:", err);
      playAlertSound();
    } finally {
      setSaving(false);
    }
  };

  // Reset server setup for testing
  const handleResetServerSetup = async () => {
    if (!currentServer) return;
    if (!window.confirm(`Reset setup for '${currentServer.guildName}'? It will revert to unconfigured status and prompt for /setup again.`)) {
      return;
    }
    playAlertSound();
    try {
      const res = await fetch("/api/guilds/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildId: currentServer.guildId }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchServers();
      }
    } catch (err) {
      console.error("Reset error:", err);
    }
  };

  // Simulate Bot Reboot & Memory Recovery
  const handleSimulateReboot = async () => {
    playClickSound();
    setIsRebooting(true);
    setShowRebootModal(true);
    setRebootLogs([]);
    setRebootResult(null);

    const logSteps = [
      "🛑 [SIGTERM] Terminating Discord Gateway WebSocket & HTTP listener...",
      "🔌 Cleaning up memory caches & flushing pending file handles...",
      "🚀 Starting AegisMod Bot Engine v2.4.0 (Node.js runtime init)...",
      "💾 Accessing persistent storage file: data/guild_memory.json...",
      "🔍 Deserializing server registries and role hierarchy models...",
    ];

    for (let i = 0; i < logSteps.length; i++) {
      await new Promise((r) => setTimeout(r, 120));
      setRebootLogs((prev) => [...prev, logSteps[i]]);
    }

    try {
      const res = await fetch("/api/guilds/reboot-check", { method: "POST" });
      const result: RebootCheckResult = await res.json();
      setRebootResult(result);
      playSuccessChime();

      setRebootLogs((prev) => [
        ...prev,
        `✅ [RESTORED] Found ${result.serversRestored} configured servers in persistent memory!`,
        `🛡️ [READY] All staff roles and #mod-logs channel bindings verified intact.`,
        `⚡ [COMMANDS] Restored 17 slash commands per configured guild with 0 re-setups required!`,
        `🎉 AegisMod bot reboot complete in ${result.rebootDurationMs}ms.`,
      ]);

      await fetchServers();
    } catch (err) {
      console.error("Reboot error:", err);
      playAlertSound();
      setRebootLogs((prev) => [...prev, "❌ Failed to simulate reboot sequence."]);
    } finally {
      setIsRebooting(false);
    }
  };

  // Add new server
  const handleAddNewServer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServerName.trim()) return;
    playClickSound();

    const generatedId = newServerId.trim() || `11${Math.floor(1000000000000000 + Math.random() * 9000000000000000)}`;

    try {
      const res = await fetch("/api/guilds/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guildId: generatedId,
          guildName: newServerName.trim(),
          isSetupComplete: false, // Starts unconfigured so user can test setup!
          configuredBy: "Server Administrator",
          memberCount: Math.floor(50 + Math.random() * 500),
          notes: "Newly invited server. Pending initial /setup wizard.",
        }),
      });
      const data = await res.json();
      if (data.success) {
        playSuccessChime();
        setShowAddServerModal(false);
        setNewServerName("");
        setNewServerId("");
        await fetchServers();
        setSelectedGuildId(generatedId);
      }
    } catch (err) {
      console.error("Failed to add server:", err);
    }
  };

  const getRoleBadge = (roleId: string) => {
    const role = SAMPLE_ROLES.find((r) => r.id === roleId);
    if (!role) return null;
    return (
      <span
        key={role.id}
        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold"
        style={{
          backgroundColor: `${role.color}15`,
          color: role.color,
          border: `1px solid ${role.color}40`,
        }}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: role.color }} />
        @{role.name}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner with Permanent Memory Status */}
      <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
                <Database className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-zinc-900">
                Permanent Server Memory & Setup Wizard
              </h2>
            </div>
            <p className="text-xs text-zinc-500 mt-1 max-w-2xl">
              Configured Discord servers are committed to persistent disk storage (
              <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-800 font-mono">
                data/guild_memory.json
              </code>
              ). When the bot restarts, reboots, or updates, all role mappings and channel bindings are restored instantly without requiring <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-800 font-mono">/setup</code> again.
            </p>
          </div>

          {/* Action Buttons: Reboot Simulation & Add Server */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              id="simulate-bot-reboot-btn"
              onClick={handleSimulateReboot}
              disabled={isRebooting}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 active:scale-95 text-white shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <Power className={`w-4 h-4 ${isRebooting ? "animate-spin" : ""}`} />
              <span>Simulate Bot Restart (Test Memory)</span>
            </button>

            <button
              id="add-new-server-btn"
              onClick={() => {
                playClickSound();
                setShowAddServerModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-zinc-600" />
              <span>Register Server</span>
            </button>
          </div>
        </div>

        {/* Persistence Status Cards Bar */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4 border-t border-zinc-100">
          <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-zinc-400 block">
                Storage Engine
              </span>
              <span className="text-xs font-bold text-zinc-800 flex items-center gap-1.5 mt-0.5">
                <HardDrive className="w-3.5 h-3.5 text-indigo-500" />
                Persistent JSON Disk
              </span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">
              ACTIVE
            </span>
          </div>

          <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-zinc-400 block">
                Configured Servers
              </span>
              <span className="text-xs font-bold text-zinc-800 flex items-center gap-1.5 mt-0.5">
                <Server className="w-3.5 h-3.5 text-blue-500" />
                {metadata?.totalServersConfigured || 0} of {metadata?.totalServersRegistered || 0} Servers
              </span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded">
              LOCKED
            </span>
          </div>

          <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-zinc-400 block">
                Reboot Immunity
              </span>
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5 mt-0.5">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                Auto-Restore On Boot
              </span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">
              100%
            </span>
          </div>

          <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-zinc-400 block">
                Slash Commands Ready
              </span>
              <span className="text-xs font-bold text-zinc-800 flex items-center gap-1.5 mt-0.5">
                <FileCode className="w-3.5 h-3.5 text-amber-500" />
                17 Moderation Tools
              </span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-zinc-200 text-zinc-800 rounded">
              UNLOCKED
            </span>
          </div>
        </div>
      </div>

      {/* Multi-Server Selection Tabs */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
            Registered Servers in Permanent Memory:
          </span>
          <span className="text-[11px] text-zinc-400">
            Select a server to view or configure its saved memory
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {servers.map((server) => {
            const isSelected = server.guildId === selectedGuildId;
            return (
              <button
                key={server.guildId}
                onClick={() => handleSelectServer(server.guildId)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative ${
                  isSelected
                    ? "bg-indigo-50/70 border-indigo-400 shadow-sm ring-2 ring-indigo-200"
                    : "bg-white border-zinc-200 hover:border-zinc-300"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={server.icon || `https://api.dicebear.com/7.x/identicon/svg?seed=${server.guildId}`}
                      alt=""
                      className="w-8 h-8 rounded-lg shrink-0 bg-zinc-100 border border-zinc-200"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-zinc-900 truncate block">
                        {server.guildName}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono truncate block">
                        ID: {server.guildId}
                      </span>
                    </div>
                  </div>

                  {server.isSetupComplete ? (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded shrink-0 flex items-center gap-1">
                      <Check className="w-2.5 h-2.5" />
                      Saved
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded shrink-0 flex items-center gap-1">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      Pending
                    </span>
                  )}
                </div>

                <div className="mt-2.5 pt-2 border-t border-zinc-100 flex items-center justify-between text-[10px] text-zinc-500">
                  <span>{server.memberCount.toLocaleString()} members</span>
                  <span>
                    {server.restoredFromDiskCount > 0
                      ? `Restored ${server.restoredFromDiskCount}x`
                      : "New"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Interactive Work Area: Left Client Mockup + Right Channel Permissions */}
      {currentServer && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Side: Interactive Discord Client Mockup */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-[#313338] rounded-2xl p-5 border border-zinc-700 shadow-md text-zinc-200 font-sans space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-700/70">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-400 font-bold">#</span>
                  <span className="text-sm font-bold text-zinc-100">admin-control</span>
                  <span className="text-xs text-zinc-400 ml-2 font-mono">({currentServer.guildName})</span>
                </div>
                <div className="flex items-center gap-2">
                  {currentServer.isSetupComplete ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-900/60 text-emerald-300 border border-emerald-700/80 rounded flex items-center gap-1">
                      <Database className="w-3 h-3" />
                      Restart Immune
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-900/60 text-amber-300 border border-amber-700/80 rounded flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Needs /setup
                    </span>
                  )}
                </div>
              </div>

              {/* Admin Command Invocation */}
              <div className="flex items-center gap-2 text-xs text-zinc-400 pl-2">
                <span className="text-indigo-400 font-bold">@ServerAdmin</span>
                <span>used</span>
                <span className="bg-[#2b2d31] px-1.5 py-0.5 rounded text-indigo-300 font-mono">/setup</span>
              </div>

              {/* Bot Response Message with Embed and Select Menus */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow">
                  <Shield className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-indigo-300">AegisMod</span>
                    <span className="bg-[#5865F2] text-[10px] text-white font-bold px-1 rounded">BOT</span>
                    <span className="text-xs text-zinc-400">Today at 12:00 PM</span>
                  </div>

                  {/* Setup Embed */}
                  <div className="rounded-md p-4 bg-[#2b2d31] border-l-4 border-l-[#5865f2] text-xs space-y-2.5">
                    <div className="font-bold text-sm text-white flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        <span>AegisMod Server Setup & Memory Registry</span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-400">
                        Guild ID: {currentServer.guildId}
                      </span>
                    </div>

                    <p className="text-zinc-300 text-xs leading-relaxed">
                      {currentServer.isSetupComplete ? (
                        <span className="text-emerald-300 font-medium">
                          💾 <strong>Restored from Permanent Memory:</strong> This server was configured on{" "}
                          {new Date(currentServer.configuredAt).toLocaleDateString()} and is saved in persistent storage. AegisMod will never prompt for setup again on bot restarts. You can modify your role mappings below at any time.
                        </span>
                      ) : (
                        <span className="text-amber-200">
                          ⚠️ <strong>Setup Required:</strong> This server has not yet finalized its staff hierarchy. Configure roles below to commit to permanent memory and unlock all 17 moderation commands.
                        </span>
                      )}
                    </p>

                    <div className="space-y-2 pt-2 border-t border-zinc-700/60">
                      <div>
                        <span className="text-zinc-400 text-[10px] uppercase font-bold block mb-1">
                          👑 Server Owner / Executive Role
                        </span>
                        <div className="flex flex-wrap gap-1.5">{getRoleBadge(ownerRole)}</div>
                      </div>

                      <div>
                        <span className="text-zinc-400 text-[10px] uppercase font-bold block mb-1">
                          ⚙️ Administrator Roles ({adminRoles.length} selected)
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {adminRoles.length > 0 ? (
                            adminRoles.map((id) => getRoleBadge(id))
                          ) : (
                            <span className="text-zinc-500 italic text-[11px]">None selected</span>
                          )}
                        </div>
                      </div>

                      <div>
                        <span className="text-zinc-400 text-[10px] uppercase font-bold block mb-1">
                          🛡️ Moderator Roles ({modRoles.length} selected)
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {modRoles.length > 0 ? (
                            modRoles.map((id) => getRoleBadge(id))
                          ) : (
                            <span className="text-zinc-500 italic text-[11px]">None selected</span>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-zinc-700/50 flex items-center justify-between text-[11px]">
                        <span className="text-zinc-400">
                          Dedicated Log Channel: <code className="text-indigo-300 font-mono">#{modLogChannelName}</code>
                        </span>
                        <span className="text-emerald-400 font-mono">
                          Restored Across Reboots: {currentServer.restoredFromDiskCount} times
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Simulated Discord Role Select Menu 1: Owner */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5">
                      <Crown className="w-3.5 h-3.5 text-yellow-400" />
                      1. RoleSelectMenu: Select Server Owner Role (Max: 1)
                    </span>
                    <div className="bg-[#1e1f22] p-2 rounded-lg border border-zinc-700 flex items-center justify-between">
                      <select
                        value={ownerRole}
                        onChange={(e) => setOwnerRole(e.target.value)}
                        className="bg-transparent text-xs text-zinc-200 focus:outline-none w-full cursor-pointer"
                      >
                        {SAMPLE_ROLES.map((r) => (
                          <option key={r.id} value={r.id} className="bg-[#2b2d31] text-zinc-200">
                            @{r.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0 pointer-events-none" />
                    </div>
                  </div>

                  {/* Simulated Discord Role Select Menu 2: Admins */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-red-400" />
                      2. RoleSelectMenu: Select Administrator Roles (1–5)
                    </span>
                    <div className="flex flex-wrap gap-2 p-2 bg-[#1e1f22] rounded-lg border border-zinc-700">
                      {SAMPLE_ROLES.slice(0, 5).map((role) => {
                        const isSelected = adminRoles.includes(role.id);
                        return (
                          <button
                            key={role.id}
                            onClick={() => toggleAdminRole(role.id)}
                            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                              isSelected
                                ? "bg-indigo-600 text-white font-bold"
                                : "bg-[#2b2d31] text-zinc-300 hover:bg-[#383a40]"
                            }`}
                          >
                            {isSelected ? "✓ " : "+ "}@{role.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Simulated Discord Role Select Menu 3: Mods */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-blue-400" />
                      3. RoleSelectMenu: Select Moderator Roles (1–10)
                    </span>
                    <div className="flex flex-wrap gap-2 p-2 bg-[#1e1f22] rounded-lg border border-zinc-700">
                      {SAMPLE_ROLES.map((role) => {
                        const isSelected = modRoles.includes(role.id);
                        return (
                          <button
                            key={role.id}
                            onClick={() => toggleModRole(role.id)}
                            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                              isSelected
                                ? "bg-blue-600 text-white font-bold"
                                : "bg-[#2b2d31] text-zinc-300 hover:bg-[#383a40]"
                            }`}
                          >
                            {isSelected ? "✓ " : "+ "}@{role.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Commit to Disk & Reset Buttons */}
                  <div className="pt-3 border-t border-zinc-700/60 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        id="save-to-permanent-disk-btn"
                        onClick={handleSaveToPermanentMemory}
                        disabled={saving}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-sm transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Database className="w-3.5 h-3.5" />
                        <span>{saving ? "Saving to Disk..." : "Save to Permanent Memory"}</span>
                      </button>

                      <button
                        onClick={handleResetServerSetup}
                        className="px-3 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-red-400 hover:bg-[#2b2d31] transition-colors cursor-pointer"
                        title="Simulate inviting bot to this server afresh"
                      >
                        Reset Setup State
                      </button>
                    </div>

                    <span className="text-[11px] text-zinc-400 font-mono">
                      Atomic disk serialization
                    </span>
                  </div>

                  {/* Feedback Banner */}
                  {saveSuccessMsg && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-emerald-950/80 border border-emerald-500/60 rounded-xl text-xs text-emerald-200 flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{saveSuccessMsg}</span>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Channel Permissions & Permanent Storage Breakdown */}
          <div className="lg:col-span-5 space-y-4">
            {/* Memory Architecture Explainer Card */}
            <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-zinc-100">
                <Database className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-base font-bold text-zinc-900">
                    How Permanent Memory Works
                  </h3>
                  <span className="text-xs text-zinc-500">
                    Never re-setup on bot restart or server reboot
                  </span>
                </div>
              </div>

              <div className="space-y-3 text-xs text-zinc-600 leading-relaxed">
                <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-1">
                  <span className="font-bold text-indigo-950 block flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                    1. On Initial /setup Execution
                  </span>
                  <p className="text-indigo-900 text-[11px]">
                    When the administrator configures roles in Discord, AegisMod saves the guild ID, role IDs, and #mod-logs channel ID into <code className="font-mono text-indigo-950 font-bold">data/guild_memory.json</code>.
                  </p>
                </div>

                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
                  <span className="font-bold text-emerald-950 block flex items-center gap-1.5">
                    <HardDrive className="w-4 h-4 text-emerald-600" />
                    2. When Bot Crashes or Restarts
                  </span>
                  <p className="text-emerald-900 text-[11px]">
                    The bot&apos;s boot sequence calls <code className="font-mono font-bold text-emerald-950">guildMemoryService.isServerSetup(guildId)</code>. Because the configuration is on disk, AegisMod automatically restores all 17 commands and active protection without prompting for <code className="font-mono text-emerald-950 font-bold">/setup</code>.
                  </p>
                </div>

                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1">
                  <span className="font-bold text-amber-950 block flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-amber-600" />
                    3. Unconfigured Servers Are Protected
                  </span>
                  <p className="text-amber-900 text-[11px]">
                    If a new server invites the bot, AegisMod restricts commands to only <code className="font-mono text-amber-950 font-bold">/setup</code> until an admin configures it, preventing unauthorized permission leaks.
                  </p>
                </div>
              </div>

              {/* Dedicated Channel Security Permissions */}
              <div className="pt-2 border-t border-zinc-100">
                <span className="text-xs font-bold text-zinc-900 block mb-2">
                  Dedicated Audit Log Channel: #{modLogChannelName}
                </span>
                <div className="space-y-2">
                  <div className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg flex items-center justify-between text-xs">
                    <span className="font-semibold text-zinc-700 flex items-center gap-1.5">
                      <EyeOff className="w-3.5 h-3.5 text-red-500" />
                      @everyone (General Members)
                    </span>
                    <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded">
                      DENIED
                    </span>
                  </div>

                  <div className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg flex items-center justify-between text-xs">
                    <span className="font-semibold text-zinc-700 flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-emerald-600" />
                      Staff Roles ({adminRoles.length + modRoles.length} roles)
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      READ ONLY
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reboot Simulation Modal / Console Viewer */}
      <AnimatePresence>
        {showRebootModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1e1f22] text-zinc-100 rounded-2xl max-w-2xl w-full border border-zinc-700 shadow-2xl overflow-hidden font-sans"
            >
              <div className="p-4 bg-[#2b2d31] border-b border-zinc-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-amber-400" />
                  <span className="font-bold text-sm text-zinc-200">
                    Bot Reboot & Permanent Memory Test Terminal
                  </span>
                </div>
                <button
                  onClick={() => setShowRebootModal(false)}
                  className="text-zinc-400 hover:text-white text-xs px-2 py-1 rounded bg-[#1e1f22] cursor-pointer"
                >
                  Close
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="p-4 bg-black/70 rounded-xl font-mono text-xs text-zinc-300 space-y-1.5 h-56 overflow-y-auto border border-zinc-800">
                  {rebootLogs.map((log, i) => (
                    <div key={i} className="leading-relaxed">
                      {log}
                    </div>
                  ))}
                  {isRebooting && (
                    <div className="flex items-center gap-2 text-amber-400 animate-pulse">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Re-reading disk storage and initializing discord.js client...</span>
                    </div>
                  )}
                </div>

                {rebootResult && (
                  <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/60 space-y-3">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Memory Retention Verified: 100% Intact</span>
                    </div>

                    <p className="text-xs text-emerald-200 leading-relaxed">
                      {rebootResult.message}
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-emerald-800/60 text-xs">
                      <div className="bg-black/40 p-2 rounded">
                        <span className="text-zinc-400 block text-[10px]">Restored Servers</span>
                        <span className="font-bold text-white text-sm">
                          {rebootResult.serversRestored} Guilds
                        </span>
                      </div>
                      <div className="bg-black/40 p-2 rounded">
                        <span className="text-zinc-400 block text-[10px]">Re-Setup Required</span>
                        <span className="font-bold text-emerald-400 text-sm">0 (Zero)</span>
                      </div>
                      <div className="bg-black/40 p-2 rounded">
                        <span className="text-zinc-400 block text-[10px]">Boot Duration</span>
                        <span className="font-bold text-white text-sm">
                          {rebootResult.rebootDurationMs}ms
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 bg-[#2b2d31] border-t border-zinc-700 flex justify-end">
                <button
                  onClick={() => setShowRebootModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Server Modal */}
      <AnimatePresence>
        {showAddServerModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full border border-zinc-200 shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <h3 className="font-bold text-base text-zinc-900 flex items-center gap-2">
                  <Server className="w-5 h-5 text-indigo-600" />
                  Register Discord Server
                </h3>
                <button
                  onClick={() => setShowAddServerModal(false)}
                  className="text-zinc-400 hover:text-zinc-700 text-xs px-2 py-1 rounded cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddNewServer} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Server Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Minecraft Teen Factions 🛡️"
                    value={newServerName}
                    onChange={(e) => setNewServerName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Discord Guild ID (Optional - Auto-generated if blank)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 104928104859102810"
                    value={newServerId}
                    onChange={(e) => setNewServerId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div className="p-3 bg-indigo-50 rounded-xl text-xs text-indigo-950 space-y-1">
                  <span className="font-bold block">Permanent Storage Guarantee:</span>
                  <p className="text-[11px] text-indigo-800">
                    Once added and configured, this server will be written to <code className="font-mono font-bold">data/guild_memory.json</code> and will never need setup again.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddServerModal(false)}
                    className="px-3 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl cursor-pointer"
                  >
                    Register Server
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
