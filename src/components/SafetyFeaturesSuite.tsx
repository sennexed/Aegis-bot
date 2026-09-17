import React, { useState } from "react";
import {
  ShieldAlert,
  Sliders,
  Image as ImageIcon,
  UserCheck,
  Zap,
  Link,
  MessageSquare,
  BarChart3,
  Scale,
  Flag,
  CheckCircle2,
  AlertTriangle,
  Send,
  XCircle,
  RefreshCw,
  Search,
} from "lucide-react";
import { PHISHING_FILTER } from "../bot-code/src/config/phishingFilter";
import { POLICY_DEFINITIONS, ChannelPolicyProfile } from "../bot-code/src/services/channelPolicyService";

export const SafetyFeaturesSuite: React.FC = () => {
  const [selectedSubTab, setSelectedSubTab] = useState<string>("passport");

  // 1. Passport state
  const [targetUser, setTargetUser] = useState({
    username: "AlexGamer16",
    accountAgeDays: 45,
    serverTenureDays: 14,
    warnCount: 1,
    muteCount: 1,
    kickCount: 0,
    banCount: 0,
  });

  // Calculate dynamic trust score
  const calculateTrust = () => {
    let score = 100;
    score -= targetUser.warnCount * 10;
    score -= targetUser.muteCount * 20;
    score -= targetUser.kickCount * 35;
    score -= targetUser.banCount * 50;

    if (targetUser.accountAgeDays < 7) score -= 15;
    else if (targetUser.accountAgeDays < 30) score -= 5;
    if (targetUser.serverTenureDays > 90) score += 5;

    score = Math.max(0, Math.min(100, score));

    let tier = "CLEAN";
    if (score < 40) tier = "HIGH_RISK";
    else if (score < 70) tier = "MEDIUM_RISK";
    else if (score < 90) tier = "LOW_RISK";

    return { score, tier };
  };

  const trustResult = calculateTrust();

  // 2. Phishing Test state
  const [phishingInput, setPhishingInput] = useState(
    "Free Discord Nitro 3 months! Claim here: https://discrod-gift-nitro.ru/claim"
  );
  const phishingCheck = PHISHING_FILTER.checkContent(phishingInput, "guild-101");

  // 3. Channel Policy Matrix state
  const [activeChannelProfile, setActiveChannelProfile] = useState<ChannelPolicyProfile>("GAMING_BANTER");

  // 4. Quick Action Simulator state
  const [modLogState, setModLogState] = useState<{
    status: string;
    actionTakenBy: string | null;
  }>({
    status: "Pending Staff Review",
    actionTakenBy: null,
  });

  // 5. Strike Escalation state
  const [currentStrikes, setCurrentStrikes] = useState<number>(2);

  const getEscalationOutcome = (strikes: number) => {
    if (strikes === 1) return { penalty: "Warning Only", duration: "N/A", color: "text-amber-600 bg-amber-50" };
    if (strikes === 2) return { penalty: "1-Hour Timeout", duration: "1 Hour", color: "text-blue-600 bg-blue-50" };
    if (strikes === 3) return { penalty: "24-Hour Timeout", duration: "24 Hours", color: "text-orange-600 bg-orange-50" };
    return { penalty: "Permanent Ban", duration: "Indefinite", color: "text-rose-600 bg-rose-50" };
  };

  // 6. Appeals State
  const [appealList, setAppealList] = useState([
    {
      id: "APP-101",
      caseId: "CASE-402",
      user: "Jordan#4891",
      reason: "My younger sibling grabbed my phone and pasted that link while I was away. I changed passwords.",
      status: "PENDING",
    },
    {
      id: "APP-102",
      caseId: "CASE-389",
      user: "SamK#1102",
      reason: "It was friendly gaming banter in #gaming-chat, not genuine targeted harassment.",
      status: "APPROVED",
    },
  ]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm">
              <Zap className="w-4 h-4" />
              <span>AegisMod Suite 2.0 • 10 Applied Upgrades</span>
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 mt-1">
              Advanced Moderation, Safety & Gatekeeper Suite
            </h2>
            <p className="text-sm text-zinc-600 mt-1">
              All 10 requested teen safety upgrades are integrated and running on Discord.js v14 with Gemini 3.8 Flash.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-medium text-xs rounded-full border border-emerald-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> All 10 Features Active
            </span>
          </div>
        </div>

        {/* Feature Sub-Navigation */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-zinc-100">
          {[
            { id: "passport", label: "User Passport (/userinfo)", icon: UserCheck },
            { id: "interactive-logs", label: "Mod-Log Buttons", icon: Sliders },
            { id: "escalation", label: "Strike Escalation", icon: Scale },
            { id: "phishing", label: "Phishing & Invites", icon: Link },
            { id: "antiraid", label: "Anti-Raid Gatekeeper", icon: ShieldAlert },
            { id: "channelpolicy", label: "Channel Profiles", icon: MessageSquare },
            { id: "multimodal", label: "Image Screening", icon: ImageIcon },
            { id: "appeals", label: "Appeals System", icon: RefreshCw },
            { id: "analytics", label: "Weekly Digest (/modstats)", icon: BarChart3 },
            { id: "report", label: "Report to Staff Context Menu", icon: Flag },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSel = selectedSubTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`safety-tab-${tab.id}`}
                onClick={() => setSelectedSubTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isSel
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SUB-VIEW 1: USER PASSPORT & TRUST SCORE */}
      {selectedSubTab === "passport" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-5">
            <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-indigo-600" />
              User Moderation Passport (`/userinfo`)
            </h3>
            <p className="text-xs text-zinc-600">
              Staff can run `/userinfo target:@user` to inspect a user's calculated Trust Score (0-100%), active strikes, account age, and infraction history before taking action.
            </p>

            {/* Passport Card UI */}
            <div className="border border-zinc-200 rounded-xl p-5 bg-zinc-50/70 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-lg">
                    {targetUser.username[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-900">{targetUser.username}</h4>
                    <p className="text-xs text-zinc-500">ID: 89402830192849201</p>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                      trustResult.tier === "CLEAN"
                        ? "bg-emerald-100 text-emerald-800"
                        : trustResult.tier === "LOW_RISK"
                        ? "bg-blue-100 text-blue-800"
                        : trustResult.tier === "MEDIUM_RISK"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {trustResult.tier}
                  </span>
                  <div className="text-xl font-black text-zinc-900 mt-1">
                    {trustResult.score}/100 <span className="text-xs font-medium text-zinc-500">Trust</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-white p-3 rounded-lg border border-zinc-200">
                  <span className="text-zinc-500 block">Account Age</span>
                  <span className="font-bold text-zinc-900 text-sm">{targetUser.accountAgeDays} days</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-zinc-200">
                  <span className="text-zinc-500 block">Server Tenure</span>
                  <span className="font-bold text-zinc-900 text-sm">{targetUser.serverTenureDays} days</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-zinc-200">
                  <span className="text-zinc-500 block">Active Strikes (30d)</span>
                  <span className="font-bold text-amber-600 text-sm">{targetUser.warnCount + targetUser.muteCount}</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-zinc-200">
                  <span className="text-zinc-500 block">Active Timeout</span>
                  <span className="font-bold text-zinc-700 text-sm">None</span>
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-lg border border-zinc-200">
                <span className="text-xs font-semibold text-zinc-700 block mb-2">Historical Records</span>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-zinc-600 py-1 border-b border-zinc-100">
                    <span>⚠️ <strong>[WARN]</strong> CASE-104: Inappropriate slang in general</span>
                    <span className="text-zinc-400">2 days ago</span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-600 py-1">
                    <span>⏳ <strong>[MUTE]</strong> CASE-108: 1-hour timeout (Second strike)</span>
                    <span className="text-zinc-400">Yesterday</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Adjuster */}
          <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-4">
            <h4 className="font-bold text-zinc-900 text-sm">Test Passport Parameters</h4>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-600 font-medium block mb-1">Account Age (Days)</label>
                <input
                  type="number"
                  value={targetUser.accountAgeDays}
                  onChange={(e) => setTargetUser({ ...targetUser, accountAgeDays: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 border border-zinc-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="text-zinc-600 font-medium block mb-1">Server Tenure (Days)</label>
                <input
                  type="number"
                  value={targetUser.serverTenureDays}
                  onChange={(e) => setTargetUser({ ...targetUser, serverTenureDays: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 border border-zinc-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="text-zinc-600 font-medium block mb-1">Warnings Count (-10 pts)</label>
                <input
                  type="number"
                  value={targetUser.warnCount}
                  onChange={(e) => setTargetUser({ ...targetUser, warnCount: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 border border-zinc-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="text-zinc-600 font-medium block mb-1">Mutes Count (-20 pts)</label>
                <input
                  type="number"
                  value={targetUser.muteCount}
                  onChange={(e) => setTargetUser({ ...targetUser, muteCount: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 border border-zinc-300 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: MOD-LOG INTERACTIVE BUTTONS */}
      {selectedSubTab === "interactive-logs" && (
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-600" />
            Interactive Discord Mod-Log Action Buttons
          </h3>
          <p className="text-xs text-zinc-600">
            Every auto-moderated message dispatches an embed to `#mod-logs` with 1-click Discord action buttons. Staff can instantly pardon false positives or escalate penalties without leaving the channel.
          </p>

          <div className="max-w-2xl mx-auto border-l-4 border-rose-500 bg-zinc-900 text-zinc-100 rounded-lg p-5 shadow-lg space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between text-zinc-400 border-b border-zinc-800 pb-2">
              <span className="font-bold text-rose-400">🚨 [HIGH] HARASSMENT_OR_BULLYING</span>
              <span>Today at 3:42 PM</span>
            </div>

            <div className="space-y-1">
              <div><span className="text-zinc-500">Author:</span> <span className="text-zinc-200 font-bold">TroubleUser#9012 (&lt;@49028491029&gt;)</span></div>
              <div><span className="text-zinc-500">Channel:</span> <span className="text-indigo-400">#teen-lounge</span></div>
              <div><span className="text-zinc-500">Action:</span> <span className="text-amber-400">Message Deleted • Warning DM Sent</span></div>
              <div><span className="text-zinc-500">Reason:</span> <span className="text-zinc-300">Targeted derogatory harassment directed at another adolescent user.</span></div>
            </div>

            <div className="bg-zinc-800/80 p-3 rounded border border-zinc-700">
              <span className="text-zinc-400 block mb-1 text-[11px]">Flagged Message Content:</span>
              <p className="text-zinc-200 font-sans italic">"You are completely useless, nobody wants you in this server so just leave already"</p>
            </div>

            <div className="pt-2">
              <div className="text-[11px] text-zinc-400 mb-2 font-sans font-semibold">Interactive Staff Buttons:</div>
              <div className="flex flex-wrap gap-2 font-sans">
                <button
                  onClick={() => setModLogState({ status: "Pardoned as False Positive", actionTakenBy: "@ModStaff" })}
                  className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded font-medium text-xs flex items-center gap-1 transition-colors"
                >
                  🕊️ Pardon / False Positive
                </button>
                <button
                  onClick={() => setModLogState({ status: "1-Hour Timeout Applied", actionTakenBy: "@ModStaff" })}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium text-xs flex items-center gap-1 transition-colors"
                >
                  ⏳ Mute 1h
                </button>
                <button
                  onClick={() => setModLogState({ status: "24-Hour Timeout Applied", actionTakenBy: "@ModStaff" })}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium text-xs flex items-center gap-1 transition-colors"
                >
                  🔇 Mute 24h
                </button>
                <button
                  onClick={() => setModLogState({ status: "User Kicked", actionTakenBy: "@ModStaff" })}
                  className="px-3 py-1.5 bg-rose-700 hover:bg-rose-600 text-white rounded font-medium text-xs flex items-center gap-1 transition-colors"
                >
                  👢 Kick
                </button>
                <button
                  onClick={() => setModLogState({ status: "User Banned", actionTakenBy: "@ModStaff" })}
                  className="px-3 py-1.5 bg-rose-700 hover:bg-rose-600 text-white rounded font-medium text-xs flex items-center gap-1 transition-colors"
                >
                  🔨 Ban
                </button>
              </div>

              {modLogState.actionTakenBy && (
                <div className="mt-3 p-2 bg-zinc-800 rounded text-emerald-400 text-xs font-sans flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Action executed: <strong>{modLogState.status}</strong> by {modLogState.actionTakenBy}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: STRIKE ESCALATION */}
      {selectedSubTab === "escalation" && (
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
            <Scale className="w-5 h-5 text-indigo-600" />
            Automatic Progressive Strike Escalation
          </h3>
          <p className="text-xs text-zinc-600">
            AegisMod counts infractions within a 30-day sliding window. Repeated violations automatically trigger harsher penalties without manual moderator tracking.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
            {[
              { strike: 1, title: "1st Strike", penalty: "Warning Only", desc: "Instructive DM sent explaining server boundaries." },
              { strike: 2, title: "2nd Strike", penalty: "1-Hour Timeout", desc: "Automated communication timeout to cool off." },
              { strike: 3, title: "3rd Strike", penalty: "24-Hour Timeout", desc: "Extended suspension with mandatory review." },
              { strike: 4, title: "4th+ Strike", penalty: "Permanent Ban", desc: "Exceeded 3 strikes within 30 days. Auto-banned." },
            ].map((step) => {
              const isActive = currentStrikes === step.strike;
              return (
                <div
                  key={step.strike}
                  onClick={() => setCurrentStrikes(step.strike)}
                  className={`cursor-pointer p-4 rounded-xl border transition-all ${
                    isActive
                      ? "border-indigo-600 bg-indigo-50/60 shadow-sm ring-2 ring-indigo-200"
                      : "border-zinc-200 bg-white hover:border-zinc-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-zinc-900">{step.title}</span>
                    {isActive && <span className="text-[10px] font-bold text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded">Active Test</span>}
                  </div>
                  <div className="text-sm font-extrabold text-zinc-900">{step.penalty}</div>
                  <p className="text-xs text-zinc-500 mt-1.5">{step.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 mt-4">
            <h4 className="text-xs font-bold text-zinc-800">Simulated DM Notification Sent to User:</h4>
            <div className="bg-zinc-900 text-zinc-100 p-3 rounded-lg text-xs font-mono mt-2">
              🚨 <strong>AegisMod Safety Notification</strong><br />
              Your message was deleted in <strong>Teen Lounge</strong> for violating community guidelines.<br />
              <span className="text-amber-400">Current Strike Status: Strike {currentStrikes}/3.</span><br />
              <span className="text-indigo-300">Action Applied: {getEscalationOutcome(currentStrikes).penalty}</span><br />
              <span className="text-zinc-400 italic mt-1 block">To appeal this decision, run `/appeal case_id:CASE-1042`.</span>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 4: PHISHING & INVITES */}
      {selectedSubTab === "phishing" && (
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
            <Link className="w-5 h-5 text-indigo-600" />
            Smart Phishing & Unauthorized Invite Filter
          </h3>
          <p className="text-xs text-zinc-600">
            Instantly blocks malicious fake Discord Nitro domains, Steam gift scams, grabbers, and unauthorized Discord server advertisements.
          </p>

          <div className="space-y-3">
            <label className="text-xs font-bold text-zinc-700 block">Test URL or Message String:</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={phishingInput}
                onChange={(e) => setPhishingInput(e.target.value)}
                className="flex-1 px-3 py-2 border border-zinc-300 rounded-lg text-xs font-mono"
              />
              <button
                onClick={() => setPhishingInput("Check out this legit tutorial: https://youtube.com/watch?v=12345")}
                className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-xs font-medium"
              >
                Test Safe Link
              </button>
            </div>

            <div
              className={`p-4 rounded-xl border flex items-start gap-3 ${
                phishingCheck.isMalicious
                  ? "bg-rose-50 border-rose-200 text-rose-800"
                  : "bg-emerald-50 border-emerald-200 text-emerald-800"
              }`}
            >
              {phishingCheck.isMalicious ? (
                <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <div className="font-bold text-sm">
                  {phishingCheck.isMalicious ? "🚨 Phishing Threat Detected — Message Deleted & User Timed Out 24h" : "✅ Clean Link Passed"}
                </div>
                <div className="text-xs mt-1">
                  {phishingCheck.reason || "No malicious domains or unauthorized discord invite links identified."}
                </div>
                {phishingCheck.matchedDomain && (
                  <div className="text-[11px] font-mono mt-1 font-semibold">
                    Flagged Domain Match: `{phishingCheck.matchedDomain}`
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 5: ANTI-RAID GATEKEEPER */}
      {selectedSubTab === "antiraid" && (
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-indigo-600" />
            Anti-Raid Gatekeeper & Emergency Lockdown
          </h3>
          <p className="text-xs text-zinc-600">
            Monitors join velocity across sliding 12-second windows. If 5+ users join simultaneously or suspicious accounts younger than 24h flood the guild, AegisMod auto-locks down the server and alerts staff in `#mod-logs`.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200">
              <span className="text-xs text-zinc-500 block">Velocity Threshold</span>
              <span className="text-lg font-bold text-zinc-900">&gt; 5 joins / 12s</span>
              <p className="text-[11px] text-zinc-500 mt-1">Auto-trips emergency lockdown</p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200">
              <span className="text-xs text-zinc-500 block">New Account Flag</span>
              <span className="text-lg font-bold text-zinc-900">&lt; 24h Creation</span>
              <p className="text-[11px] text-zinc-500 mt-1">Quarantines young throwaways during spikes</p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200">
              <span className="text-xs text-zinc-500 block">Discord Gate Level</span>
              <span className="text-lg font-bold text-emerald-600">Auto-High (10m)</span>
              <p className="text-[11px] text-zinc-500 mt-1">Elevated during raid mode</p>
            </div>
          </div>

          <div className="border border-zinc-200 rounded-xl p-4 bg-zinc-50 flex items-center justify-between">
            <div>
              <span className="font-bold text-xs text-zinc-900 block">Admin Command: `/antiraid lockdown enabled:true`</span>
              <span className="text-xs text-zinc-500">Allows server owners to manually engage or lift emergency lockdown at any time.</span>
            </div>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
              System Ready
            </span>
          </div>
        </div>
      )}

      {/* SUB-VIEW 6: CHANNEL POLICY PROFILES */}
      {selectedSubTab === "channelpolicy" && (
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-600" />
            Channel-Specific Safety Sensitivity Profiles
          </h3>
          <p className="text-xs text-zinc-600">
            Different channels have different social norms. AegisMod lets admins assign specific safety profiles using `/channelpolicy set channel:#gaming profile:GAMING_BANTER`.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
            {(["STRICT_TEEN", "GAMING_BANTER", "CRISIS_SUPPORT", "MEDIA_ONLY"] as ChannelPolicyProfile[]).map((prof) => {
              const conf = POLICY_DEFINITIONS[prof];
              const isSel = activeChannelProfile === prof;
              return (
                <button
                  key={prof}
                  onClick={() => setActiveChannelProfile(prof)}
                  className={`p-4 rounded-xl text-left border transition-all ${
                    isSel
                      ? "border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-200"
                      : "border-zinc-200 bg-white hover:border-zinc-300"
                  }`}
                >
                  <div className="font-bold text-xs text-zinc-900 mb-1">{prof}</div>
                  <div className="text-[11px] text-zinc-500">
                    {prof === "STRICT_TEEN" && "Zero-tolerance for toxicity, slurs, or harassment."}
                    {prof === "GAMING_BANTER" && "Permits casual gaming trash talk while strictly blocking hate speech."}
                    {prof === "CRISIS_SUPPORT" && "Directs distress to certified teen crisis helplines."}
                    {prof === "MEDIA_ONLY" && "Requires multimodal vision scanning on all files."}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-xs space-y-2">
            <div className="font-bold text-zinc-800">Active Profile Details: `{activeChannelProfile}`</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div className="bg-white p-2.5 rounded border border-zinc-200">
                <span className="text-zinc-500 block">Casual Banter Allowed:</span>
                <span className="font-bold text-zinc-900">{POLICY_DEFINITIONS[activeChannelProfile].allowMildBanter ? "Yes" : "No"}</span>
              </div>
              <div className="bg-white p-2.5 rounded border border-zinc-200">
                <span className="text-zinc-500 block">Strict Profanity Filter:</span>
                <span className="font-bold text-zinc-900">{POLICY_DEFINITIONS[activeChannelProfile].blockAllProfanity ? "Yes" : "No"}</span>
              </div>
              <div className="bg-white p-2.5 rounded border border-zinc-200">
                <span className="text-zinc-500 block">Crisis Helpline Priority:</span>
                <span className="font-bold text-zinc-900">{POLICY_DEFINITIONS[activeChannelProfile].priorityHelplineResponse ? "Yes" : "No"}</span>
              </div>
              <div className="bg-white p-2.5 rounded border border-zinc-200">
                <span className="text-zinc-500 block">Vision Image Inspection:</span>
                <span className="font-bold text-zinc-900">{POLICY_DEFINITIONS[activeChannelProfile].requireImageScreening ? "Required" : "Standard"}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 7: MULTIMODAL IMAGE SCREENING */}
      {selectedSubTab === "multimodal" && (
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-indigo-600" />
            Image & Attachment Safety Screening (Gemini Vision)
          </h3>
          <p className="text-xs text-zinc-600">
            Uploaded images, GIFs, and attachments are screened using Gemini 3.8 Flash Vision for gore, predatory grooming content, fake Discord Nitro QR token grabbers, and hate memes.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 space-y-2">
              <span className="font-bold text-xs text-rose-700 block">🚨 QR Code Nitro Grabbers</span>
              <p className="text-xs text-zinc-600">
                Detects deceptive QR codes claiming to give free Discord subscriptions that actually steal login session tokens.
              </p>
              <span className="text-[10px] font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded">Auto-Deleted & Timed Out</span>
            </div>

            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 space-y-2">
              <span className="font-bold text-xs text-rose-700 block">🚨 Gore & Graphic Violence</span>
              <p className="text-xs text-zinc-600">
                Instantly deletes disturbing shock media to protect adolescent mental health and safety.
              </p>
              <span className="text-[10px] font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded">Emergency Alert to Staff</span>
            </div>

            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-2">
              <span className="font-bold text-xs text-emerald-700 block">✅ Gaming Screenshots & Memes</span>
              <p className="text-xs text-zinc-600">
                Understands context and nuance: normal gaming clips, artistic creations, and teen humor are permitted smoothly.
              </p>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">Allowed Clean</span>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 8: APPEALS SYSTEM */}
      {selectedSubTab === "appeals" && (
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-indigo-600" />
            DM Appeal & Staff Resolution Workflow
          </h3>
          <p className="text-xs text-zinc-600">
            Whenever an infraction or timeout is recorded, the user is DM'd their unique Case ID. They can submit `/appeal case_id:CASE-XXX reason:...`, routing directly to staff with Approve/Deny buttons.
          </p>

          <div className="space-y-3 pt-2">
            {appealList.map((app) => (
              <div key={app.id} className="border border-zinc-200 rounded-xl p-4 bg-zinc-50/70 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-600">{app.id}</span>
                    <span className="text-xs text-zinc-400">•</span>
                    <span className="text-xs font-bold text-zinc-800">{app.user}</span>
                    <span className="text-[10px] font-mono bg-zinc-200 text-zinc-700 px-1.5 py-0.5 rounded">{app.caseId}</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      app.status === "PENDING"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {app.status}
                  </span>
                </div>

                <p className="text-xs text-zinc-600 italic bg-white p-2.5 rounded border border-zinc-200">
                  "{app.reason}"
                </p>

                {app.status === "PENDING" && (
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() =>
                        setAppealList(appealList.map((a) => (a.id === app.id ? { ...a, status: "APPROVED" } : a)))
                      }
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-medium"
                    >
                      ✅ Approve Appeal (Lift Timeout)
                    </button>
                    <button
                      onClick={() =>
                        setAppealList(appealList.map((a) => (a.id === app.id ? { ...a, status: "DENIED" } : a)))
                      }
                      className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-medium"
                    >
                      ❌ Deny Appeal
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-VIEW 9: WEEKLY DIGEST & ANALYTICS */}
      {selectedSubTab === "analytics" && (
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            Weekly Moderation Digest & Efficiency Analytics (`/modstats`)
          </h3>
          <p className="text-xs text-zinc-600">
            Aggregates server health metrics, token efficiency savings, and violation trends into a weekly digest delivered via `/modstats`.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100">
              <span className="text-xs text-indigo-600 font-semibold block">Safety Health Score</span>
              <span className="text-2xl font-black text-indigo-950 mt-1 block">99.4%</span>
              <span className="text-[11px] text-zinc-500">Healthy adolescent environment</span>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
              <span className="text-xs text-emerald-600 font-semibold block">Triage Zero-Token Passes</span>
              <span className="text-2xl font-black text-emerald-950 mt-1 block">78.2%</span>
              <span className="text-[11px] text-zinc-500">Free local tier-1 filtering</span>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100">
              <span className="text-xs text-amber-600 font-semibold block">Violations Blocked</span>
              <span className="text-2xl font-black text-amber-950 mt-1 block">42</span>
              <span className="text-[11px] text-zinc-500">Past 7 days</span>
            </div>

            <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-100">
              <span className="text-xs text-purple-600 font-semibold block">Est. Cost Saved</span>
              <span className="text-2xl font-black text-purple-950 mt-1 block">$14.80</span>
              <span className="text-[11px] text-zinc-500">Via triage caching & heuristics</span>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 10: REPORT TO STAFF CONTEXT MENU */}
      {selectedSubTab === "report" && (
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
            <Flag className="w-5 h-5 text-indigo-600" />
            "Report to Staff" Context Menu & Modals
          </h3>
          <p className="text-xs text-zinc-600">
            Registered as a native Discord Context Menu command (`ApplicationCommandType.Message`). Any member can right click a message, select <strong>Apps &gt; Report to Staff</strong>, fill out a modal explanation, and notify staff in `#mod-logs` with 1-click Delete/Mute options.
          </p>

          <div className="border border-zinc-200 rounded-xl p-5 bg-zinc-50/60 max-w-xl space-y-3 text-xs">
            <div className="font-bold text-zinc-800">How Members Report Messages on Discord:</div>
            <ol className="list-decimal list-inside space-y-1.5 text-zinc-600">
              <li>Right-click or tap on any message in any channel.</li>
              <li>Click <strong>Apps</strong> &gt; <strong>"Report to Staff"</strong>.</li>
              <li>Discord pops up the AegisMod Report Modal.</li>
              <li>Member enters their reason (e.g. "Harassing in DMs", "Bullying").</li>
              <li>AegisMod routes the report directly to `#mod-logs` with quick resolution buttons.</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};
