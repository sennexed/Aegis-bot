import React, { useState } from "react";
import {
  Gavel,
  UserX,
  VolumeX,
  AlertTriangle,
  History,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  Clock,
  Send,
} from "lucide-react";

interface Member {
  id: string;
  tag: string;
  role: "OWNER" | "ADMIN" | "MOD" | "MEMBER";
  avatarColor: string;
  warnings: number;
  status: "ACTIVE" | "MUTED" | "KICKED" | "BANNED";
}

interface ModCase {
  id: string;
  action: "BAN" | "KICK" | "MUTE" | "WARN";
  targetTag: string;
  targetId: string;
  moderator: string;
  reason: string;
  duration?: string;
  timestamp: string;
}

const INITIAL_MEMBERS: Member[] = [
  { id: "1001", tag: "TeenGamer#1234", role: "MEMBER", avatarColor: "#3498db", warnings: 1, status: "ACTIVE" },
  { id: "1002", tag: "TrollAlt#9999", role: "MEMBER", avatarColor: "#e74c3c", warnings: 2, status: "ACTIVE" },
  { id: "1003", tag: "QuietLurker#5555", role: "MEMBER", avatarColor: "#2ecc71", warnings: 0, status: "ACTIVE" },
  { id: "1004", tag: "SeniorAdmin#0001", role: "ADMIN", avatarColor: "#9b59b6", warnings: 0, status: "ACTIVE" },
  { id: "1005", tag: "ServerOwner#0000", role: "OWNER", avatarColor: "#f1c40f", warnings: 0, status: "ACTIVE" },
];

export const TraditionalModSandbox: React.FC = () => {
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [cases, setCases] = useState<ModCase[]>([
    {
      id: "CASE-1001",
      action: "WARN",
      targetTag: "TeenGamer#1234",
      targetId: "1001",
      moderator: "StaffMod#0007",
      reason: "Aggressive swearing in voice chat text",
      timestamp: "10 minutes ago",
    },
    {
      id: "CASE-1002",
      action: "WARN",
      targetTag: "TrollAlt#9999",
      targetId: "1002",
      moderator: "StaffMod#0007",
      reason: "Persistent pinging of offline members",
      timestamp: "1 hour ago",
    },
  ]);

  const [selectedTarget, setSelectedTarget] = useState<string>("1001");
  const [action, setAction] = useState<"BAN" | "KICK" | "MUTE" | "WARN">("WARN");
  const [duration, setDuration] = useState<string>("1h");
  const [reason, setReason] = useState<string>("Inappropriate language after verbal warning");
  const [feedback, setFeedback] = useState<{ text: string; error: boolean } | null>(null);

  const targetMember = members.find((m) => m.id === selectedTarget);

  const handleExecute = () => {
    if (!targetMember) return;

    // Restrict permanent bans in accordance with user safety guidelines
    if (action === "BAN") {
      setFeedback({
        text: "Policy Enforced: Permanent bans are currently paused under server safety rules (Non-Strict Moderation Mode). Use /mute for a restorative cooldown or /warn.",
        error: true,
      });
      return;
    }

    // Discord Role Hierarchy Verification Check
    if (targetMember.role === "OWNER") {
      setFeedback({ text: "Error: Hierarchy Violation. You cannot moderate the Server Owner.", error: true });
      return;
    }
    if (targetMember.role === "ADMIN") {
      setFeedback({ text: "Error: Hierarchy Violation. Moderator role cannot moderate an Administrator.", error: true });
      return;
    }

    const newCaseId = `CASE-${1000 + cases.length + 1}`;
    const newCase: ModCase = {
      id: newCaseId,
      action,
      targetTag: targetMember.tag,
      targetId: targetMember.id,
      moderator: "StaffMod#0007",
      reason,
      duration: action === "MUTE" ? duration : undefined,
      timestamp: "Just now",
    };

    setCases([newCase, ...cases]);

    // Update target status
    setMembers((prev) =>
      prev.map((m) => {
        if (m.id === targetMember.id) {
          if (action === "WARN") return { ...m, warnings: m.warnings + 1 };
          if (action === "MUTE") return { ...m, status: "MUTED" };
          if (action === "KICK") return { ...m, status: "KICKED" };
          if (action === "BAN") return { ...m, status: "BANNED" };
        }
        return m;
      })
    );

    setFeedback({
      text: `Successfully executed /${action.toLowerCase()} on ${targetMember.tag}! Logged to #mod-logs as ${newCaseId}.`,
      error: false,
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm">
        <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
          <Gavel className="w-5 h-5 text-indigo-600" />
          Traditional Moderation Commands Playground
        </h2>
        <p className="text-xs text-zinc-500 mt-1">
          AegisMod pairs automated AI moderation with standard Discord commands (<code className="bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-800 font-mono">/ban</code>, <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-800 font-mono">/kick</code>, <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-800 font-mono">/mute</code>, <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-800 font-mono">/warn</code>, <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-800 font-mono">/cases</code>). Discord role hierarchy and native timeouts are strictly enforced.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Command Executor */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-zinc-900">Execute Slash Command</h3>

            {/* Target Selector */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Target Member</label>
              <div className="space-y-1.5">
                {members.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setSelectedTarget(m.id);
                      setFeedback(null);
                    }}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-colors cursor-pointer ${
                      selectedTarget === m.id
                        ? "border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600"
                        : "border-zinc-200 bg-zinc-50/50 hover:bg-zinc-100"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-full text-white flex items-center justify-center text-xs font-bold"
                        style={{ backgroundColor: m.avatarColor }}
                      >
                        {m.tag.charAt(0)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-zinc-900">{m.tag}</div>
                        <div className="text-[10px] text-zinc-500">
                          Role: <span className="font-semibold">{m.role}</span> • Warnings: {m.warnings}
                        </div>
                      </div>
                    </div>
                    <div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          m.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-800"
                            : m.status === "MUTED"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {m.status}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Selector */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Command Action</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: "WARN", label: "/warn", sub: "Reminder", icon: AlertTriangle, color: "text-amber-600" },
                  { id: "MUTE", label: "/mute", sub: "Cooldown", icon: VolumeX, color: "text-purple-600" },
                  { id: "KICK", label: "/kick", sub: "Leave", icon: UserX, color: "text-orange-600" },
                  { id: "BAN", label: "/ban", sub: "Disabled", icon: Gavel, color: "text-zinc-400" },
                ].map((act) => (
                  <button
                    key={act.id}
                    onClick={() => {
                      setAction(act.id as any);
                      setFeedback(null);
                    }}
                    className={`py-2 px-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
                      action === act.id
                        ? "border-indigo-600 bg-indigo-50 text-indigo-900 shadow-sm"
                        : "border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100"
                    } ${act.id === "BAN" ? "opacity-60" : ""}`}
                  >
                    <act.icon className={`w-4 h-4 ${act.color}`} />
                    <span>{act.label}</span>
                    <span className="text-[9px] font-normal text-zinc-500">{act.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Duration Input (If Mute) */}
            {action === "MUTE" && (
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Timeout Duration (<code className="text-zinc-600">5m</code>, <code className="text-zinc-600">15m</code>, <code className="text-zinc-600">1h</code>, <code className="text-zinc-600">2h</code>)
                </label>
                <div className="flex gap-2">
                  {["5m", "15m", "1h", "2h"].map((dur) => (
                    <button
                      key={dur}
                      onClick={() => setDuration(dur)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                        duration === dur
                          ? "bg-purple-600 text-white border-purple-600"
                          : "bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100"
                      }`}
                    >
                      {dur}
                    </button>
                  ))}
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="Custom (e.g. 2h)"
                    className="text-xs px-2.5 py-1.5 rounded-lg border border-zinc-300 w-24 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>
            )}

            {/* Reason Input */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Moderation Reason</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for audit log and user DM..."
                className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-300 bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Submit */}
            <button
              id="execute-mod-command-btn"
              onClick={handleExecute}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Dispatch /{action.toLowerCase()} Command</span>
            </button>

            {feedback && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                  feedback.error
                    ? "bg-red-50 text-red-800 border-red-200"
                    : "bg-emerald-50 text-emerald-800 border-emerald-200"
                }`}
              >
                {feedback.error ? (
                  <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                )}
                <span>{feedback.text}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Infraction Case History (/cases simulation) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-zinc-900">Infraction Case History (/cases)</h3>
              </div>
              <span className="text-xs text-zinc-500 font-mono">{cases.length} Recorded Cases</span>
            </div>

            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
              {cases.map((c) => (
                <div
                  key={c.id}
                  className="p-3 rounded-xl border border-zinc-200 bg-zinc-50/70 hover:bg-zinc-50 transition-colors space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-600">{c.id}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          c.action === "BAN"
                            ? "bg-red-100 text-red-800"
                            : c.action === "KICK"
                            ? "bg-orange-100 text-orange-800"
                            : c.action === "MUTE"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {c.action}
                      </span>
                      {c.duration && (
                        <span className="text-[10px] text-zinc-500 font-mono">({c.duration})</span>
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-400">{c.timestamp}</span>
                  </div>

                  <div className="text-xs text-zinc-800">
                    Target: <span className="font-semibold text-zinc-900">{c.targetTag}</span>
                    <span className="text-zinc-400 ml-1.5">by {c.moderator}</span>
                  </div>

                  <p className="text-xs text-zinc-600 bg-white p-2 rounded-lg border border-zinc-200/80">
                    &quot;{c.reason}&quot;
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
