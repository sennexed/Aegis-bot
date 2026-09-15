import React, { useState } from "react";
import {
  Shield,
  CheckCircle2,
  Users,
  Lock,
  EyeOff,
  Eye,
  Hash,
  Sparkles,
  RefreshCw,
  Crown,
  ChevronDown,
} from "lucide-react";

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
  const [ownerRole, setOwnerRole] = useState<string>("role_owner");
  const [adminRoles, setAdminRoles] = useState<string[]>(["role_exec", "role_admin"]);
  const [modRoles, setModRoles] = useState<string[]>(["role_srmod", "role_mod"]);
  const [setupStep, setSetupStep] = useState<"ready" | "saved">("saved");

  const toggleAdminRole = (id: string) => {
    setAdminRoles((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
    setSetupStep("saved");
  };

  const toggleModRole = (id: string) => {
    setModRoles((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
    setSetupStep("saved");
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
      <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm">
        <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-600" />
          Interactive Discord Server Setup Simulator
        </h2>
        <p className="text-xs text-zinc-500 mt-1">
          When an administrator invokes <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-800 font-mono">/setup</code> in Discord, AegisMod uses Discord native <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-800 font-mono">RoleSelectMenuBuilder</code> components to configure server roles and provisions the locked <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-800 font-mono">#mod-logs</code> channel.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Interactive Discord Client Mockup */}
        <div className="lg:col-span-7">
          <div className="bg-[#313338] rounded-2xl p-5 border border-zinc-700 shadow-md text-zinc-200 font-sans space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-700/70">
              <div className="flex items-center gap-2">
                <span className="text-zinc-400 font-bold">#</span>
                <span className="text-sm font-bold text-zinc-100">admin-control</span>
              </div>
              <span className="text-[11px] text-zinc-400 font-mono">/setup Slash Command Execution</span>
            </div>

            {/* Admin Command Call */}
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
                  <div className="font-bold text-sm text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    AegisMod Server Setup Wizard
                  </div>
                  <p className="text-zinc-300 text-xs leading-relaxed">
                    Select your server&apos;s administrative and moderation roles using the Discord dropdowns below. These mappings grant moderation permissions and bind access to the dedicated audit channel.
                  </p>

                  <div className="space-y-2 pt-2 border-t border-zinc-700/60">
                    <div>
                      <span className="text-zinc-400 text-[10px] uppercase font-bold block mb-1">
                        👑 Selected Server Owner / Executive Role
                      </span>
                      <div className="flex flex-wrap gap-1.5">{getRoleBadge(ownerRole)}</div>
                    </div>

                    <div>
                      <span className="text-zinc-400 text-[10px] uppercase font-bold block mb-1">
                        ⚙️ Selected Administrator Roles
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {adminRoles.length > 0
                          ? adminRoles.map((id) => getRoleBadge(id))
                          : <span className="text-zinc-500 italic text-[11px]">None selected</span>}
                      </div>
                    </div>

                    <div>
                      <span className="text-zinc-400 text-[10px] uppercase font-bold block mb-1">
                        🛡️ Selected Moderator Roles
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {modRoles.length > 0
                          ? modRoles.map((id) => getRoleBadge(id))
                          : <span className="text-zinc-500 italic text-[11px]">None selected</span>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Simulated Discord Role Select Menu 1: Owner */}
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5 text-yellow-400" />
                    1. RoleSelectMenu: Select Server Owner Role (Max: 1)
                  </span>
                  <div className="bg-[#1e1f22] p-2.5 rounded-lg border border-zinc-700 flex items-center justify-between">
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
                <div className="space-y-2">
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
                <div className="space-y-2">
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
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Auto-Created Channel Permissions Breakdown */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-zinc-100">
              <Hash className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="text-base font-bold text-zinc-900">Dedicated #mod-logs Channel</h3>
                <span className="text-xs text-zinc-500">Auto-created with strict permission overwrites</span>
              </div>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              When <code className="text-zinc-800 font-mono">/setup</code> completes, AegisMod queries the Discord Guild channel list. If <code className="text-zinc-800 font-mono">#mod-logs</code> doesn&apos;t exist, it calls <code className="text-zinc-800 font-mono">guild.channels.create</code> with security overwrites:
            </p>

            {/* Permissions Matrix */}
            <div className="space-y-3">
              {/* @everyone Override */}
              <div className="p-3 bg-red-50/70 border border-red-200 rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-red-900 flex items-center gap-1.5">
                    <EyeOff className="w-3.5 h-3.5 text-red-600" />
                    @everyone (General Members)
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-red-200/80 text-red-900 rounded">
                    LOCKED / DENIED
                  </span>
                </div>
                <div className="text-[11px] text-red-800 space-y-0.5">
                  <div>❌ ViewChannel: DENY</div>
                  <div>❌ SendMessages: DENY</div>
                </div>
              </div>

              {/* Bot Permissions */}
              <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-indigo-600" />
                    AegisMod (Bot User)
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-200/80 text-indigo-900 rounded">
                    FULL DISPATCH
                  </span>
                </div>
                <div className="text-[11px] text-indigo-900 space-y-0.5">
                  <div>✅ ViewChannel & SendMessages: ALLOW</div>
                  <div>✅ EmbedLinks & AttachFiles: ALLOW</div>
                  <div>✅ ReadMessageHistory: ALLOW</div>
                </div>
              </div>

              {/* Staff Roles */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-emerald-600" />
                    Configured Staff Roles
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-200/80 text-emerald-900 rounded">
                    READ AUDIT LOGS
                  </span>
                </div>
                <div className="text-[11px] text-emerald-900 space-y-0.5">
                  <div>✅ ViewChannel: ALLOW</div>
                  <div>✅ ReadMessageHistory: ALLOW</div>
                  <div>❌ SendMessages: DENY (Prevents chat clutter in audit log)</div>
                </div>
              </div>
            </div>

            {/* Code Reference snippet */}
            <div className="p-3 bg-zinc-900 rounded-xl text-zinc-200 text-[11px] font-mono overflow-x-auto">
              <span className="text-zinc-400">// Discord Permission Overwrites Payload:</span>
              <pre className="text-emerald-400 mt-1">
{`guild.channels.create({
  name: "mod-logs",
  type: ChannelType.GuildText,
  permissionOverwrites: [
    { id: guild.roles.everyone.id, deny: [ViewChannel] },
    { id: bot.id, allow: [ViewChannel, EmbedLinks] },
    ...staffRoles.map(id => ({ id, allow: [ViewChannel] }))
  ]
});`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
