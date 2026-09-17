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
  Clock,
  Inbox,
  FileSpreadsheet,
  Download,
  Copy,
  Check,
  UserPlus,
  Calendar,
  Coffee,
} from "lucide-react";
import { PHISHING_FILTER } from "../bot-code/src/config/phishingFilter";
import { POLICY_DEFINITIONS, ChannelPolicyProfile } from "../bot-code/src/services/channelPolicyService";

export const SafetyFeaturesSuite: React.FC = () => {
  const [selectedSubTab, setSelectedSubTab] = useState<string>("duty");

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

  // 7. Staff Duty Tracker state
  const [dutyStaff, setDutyStaff] = useState([
    {
      id: "u-1",
      userTag: "Sarah_Mod#4012",
      role: "Moderator",
      isOnDuty: true,
      shiftMinutes: 84,
      note: "Covering #voice-chat & general teen lounge",
      totalHours: "28h 15m",
    },
    {
      id: "u-2",
      userTag: "JakeSenior#9901",
      role: "Senior Moderator",
      isOnDuty: true,
      shiftMinutes: 38,
      note: "Active triage in #gaming-banter",
      totalHours: "45h 50m",
    },
    {
      id: "u-3",
      userTag: "ElenaAdmin#0003",
      role: "Administrator",
      isOnDuty: false,
      shiftMinutes: 0,
      note: "Off shift",
      totalHours: "62h 10m",
    },
  ]);
  const [myDutyNote, setMyDutyNote] = useState("Evening safety monitoring & chat triage");
  const [isSelfOnDuty, setIsSelfOnDuty] = useState(false);
  const [myShiftMinutes, setMyShiftMinutes] = useState(0);

  // 8. Anonymous Staff Mod-Mail state
  const [modmailTickets, setModmailTickets] = useState([
    {
      id: "MM-1001",
      userTag: "Jordan#4891",
      subject: "Unsolicited inappropriate DMs from a server member",
      category: "BULLYING_HARASSMENT",
      status: "WAITING_STAFF",
      updatedAt: "5 minutes ago",
      messages: [
        {
          id: "m-1",
          sender: "USER",
          author: "Jordan#4891",
          content: "Hi moderators, someone named ShadowX in #general-gaming DM'd me asking for my private phone number and home address. I told them no and they called me names.",
          time: "10:14 AM",
        },
      ],
    },
    {
      id: "MM-1002",
      userTag: "SkyBlue#2319",
      subject: "Question about warning appeal timeline",
      category: "APPEAL_INQUIRY",
      status: "WAITING_USER",
      updatedAt: "25 minutes ago",
      messages: [
        {
          id: "m-2",
          sender: "USER",
          author: "SkyBlue#2319",
          content: "Hello, I submitted an appeal for CASE-398 yesterday. How long does review take?",
          time: "09:45 AM",
        },
        {
          id: "m-3",
          sender: "STAFF",
          author: "AegisMod Staff (Anonymous)",
          content: "Hello SkyBlue. Appeals are reviewed within 24 to 48 hours by senior moderators. You will receive a DM notification as soon as a decision is recorded.",
          time: "09:52 AM",
        },
      ],
    },
  ]);
  const [selectedTicketId, setSelectedTicketId] = useState("MM-1001");
  const [replyText, setReplyText] = useState("");
  const [sendAnonymous, setSendAnonymous] = useState(true);

  // 9. Audit Log & Transparency Exporter state
  const [exportTimeframe, setExportTimeframe] = useState("30");
  const [exportActionFilter, setExportActionFilter] = useState("ALL");
  const [exportFormatTab, setExportFormatTab] = useState<"summary" | "csv" | "json">("summary");
  const [copiedNotification, setCopiedNotification] = useState(false);

  // 10. /report Slash Command & On-Duty Staff Alert state
  const [reportTarget, setReportTarget] = useState("TrollUser#9102");
  const [reportReason, setReportReason] = useState("Harassing younger teen members and asking for personal phone numbers in DMs.");
  const [reportEvidence, setReportEvidence] = useState("https://discord.com/channels/101/202/994");
  const [reportSentSuccess, setReportSentSuccess] = useState(false);
  const [simulatedReports, setSimulatedReports] = useState([
    {
      id: "REP-401",
      target: "TrollUser#9102",
      targetId: "89312019482103912",
      reporter: "AlexGamer16#1029",
      channel: "#gaming-banter",
      reason: "Harassing younger teen members and asking for personal phone numbers in DMs.",
      evidence: "Jump link: https://discord.com/channels/101/202/994",
      timestamp: "3 minutes ago",
      status: "PENDING",
    },
    {
      id: "REP-400",
      target: "ScamBot#0014",
      targetId: "77192019482103810",
      reporter: "Jordan#4891",
      channel: "#announcements",
      reason: "Pasting phishing links masquerading as Steam gift cards.",
      evidence: "Message ID: 119284910294819",
      timestamp: "18 minutes ago",
      status: "RESOLVED",
    },
  ]);

  // 11. Staff Leave of Absence (LOA) state
  const [loaRecords, setLoaRecords] = useState([
    {
      id: "LOA-1001",
      userId: "u-99",
      userTag: "Marcus_Mod#2021",
      role: "Moderator",
      reason: "University midterm exams and project deadlines. Will have very limited screen time.",
      durationDays: 7,
      startDate: Date.now() - 2 * 24 * 60 * 60 * 1000,
      endDate: Date.now() + 5 * 24 * 60 * 60 * 1000,
      status: "APPROVED" as "APPROVED" | "PENDING" | "DENIED" | "EXPIRED",
      reviewedBy: "ElenaAdmin#0003",
      reviewedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
      reviewNotes: "Good luck with midterms Marcus! See you next Monday.",
    },
    {
      id: "LOA-1002",
      userId: "u-104",
      userTag: "ChloeStaff#8812",
      role: "Junior Moderator",
      reason: "Family camping trip to national park without reliable cellular/Wi-Fi coverage.",
      durationDays: 10,
      startDate: Date.now(),
      endDate: Date.now() + 10 * 24 * 60 * 60 * 1000,
      status: "PENDING" as "APPROVED" | "PENDING" | "DENIED" | "EXPIRED",
      reviewedBy: undefined as string | undefined,
      reviewedAt: undefined as number | undefined,
      reviewNotes: undefined as string | undefined,
    },
  ]);
  const [loaReqDays, setLoaReqDays] = useState(7);
  const [loaReqReason, setLoaReqReason] = useState("High school finals week & college applications. Need temporary time away to focus on studies.");
  const [loaSuccessNotice, setLoaSuccessNotice] = useState(false);
  const [loaFilter, setLoaFilter] = useState<"ACTIVE" | "PENDING" | "ALL">("ACTIVE");

  // Sample Audit Records for Exporter
  const sampleAuditRecords = [
    { caseId: "CASE-1048", timestamp: "2026-09-17T03:45:00Z", user: "BadActor#9912", mod: "System AutoMod", action: "BAN", reason: "Zero-tolerance predatory grooming attempt detected." },
    { caseId: "CASE-1047", timestamp: "2026-09-17T01:20:00Z", user: "ScamBot#0014", mod: "AegisMod AI", action: "TIMEOUT_24H", reason: "Phishing link distribution: discrod-gift-nitro.ru" },
    { caseId: "CASE-1046", timestamp: "2026-09-16T22:15:00Z", user: "TrollGuy#4412", mod: "Sarah_Mod#4012", action: "TIMEOUT_1H", reason: "Targeted harassment towards teen members in #gaming" },
    { caseId: "CASE-1045", timestamp: "2026-09-16T18:05:00Z", user: "Alex#1201", mod: "JakeSenior#9901", action: "WARN", reason: "Excessive uppercase flooding & caps lock spam" },
    { caseId: "CASE-1044", timestamp: "2026-09-15T14:30:00Z", user: "RaidBot#7719", mod: "Anti-Raid Gatekeeper", action: "BAN", reason: "Mass raid join velocity spike quota exceeded" },
    { caseId: "CASE-1043", timestamp: "2026-09-15T11:00:00Z", user: "Elena#9921", mod: "Sarah_Mod#4012", action: "UNMUTE", reason: "Appeal APP-102 approved after context review" },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm">
              <Zap className="w-4 h-4" />
              <span>AegisMod Suite 2.0 • 14 Advanced Safety & Operations Features</span>
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 mt-1">
              Advanced Moderation, Safety & Governance Suite
            </h2>
            <p className="text-sm text-zinc-600 mt-1">
              Complete hybrid teen safety operations: AI Triage, Staff Duty Shifts, Leave of Absence (LOA), Anonymous Mod-Mail, Incident Reports, and Compliance Audit Exporter.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-medium text-xs rounded-full border border-emerald-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> 14 Systems Online
            </span>
          </div>
        </div>

        {/* Feature Sub-Navigation */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-zinc-100">
          {[
            { id: "duty", label: "Staff Duty Tracker (/duty)", icon: Clock },
            { id: "loa", label: "Leave of Absence (/loa)", icon: Calendar },
            { id: "modmail", label: "Anonymous Mod-Mail (/modmail)", icon: Inbox },
            { id: "exportlogs", label: "Audit Exporter (/exportlogs)", icon: FileSpreadsheet },
            { id: "passport", label: "User Passport (/userinfo)", icon: UserCheck },
            { id: "interactive-logs", label: "Mod-Log Buttons", icon: Sliders },
            { id: "escalation", label: "Strike Escalation", icon: Scale },
            { id: "phishing", label: "Phishing & Invites", icon: Link },
            { id: "antiraid", label: "Anti-Raid Gatekeeper", icon: ShieldAlert },
            { id: "channelpolicy", label: "Channel Profiles", icon: MessageSquare },
            { id: "multimodal", label: "Image Screening", icon: ImageIcon },
            { id: "appeals", label: "Appeals System", icon: RefreshCw },
            { id: "analytics", label: "Weekly Digest (/modstats)", icon: BarChart3 },
            { id: "report", label: "Incident Reports (/report)", icon: Flag },
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

      {/* SUB-VIEW 10: MEMBER INCIDENT REPORTS (/report & CONTEXT MENU) */}
      {selectedSubTab === "report" && (
        <div className="space-y-6">
          <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                  <Flag className="w-5 h-5 text-indigo-600" />
                  Incident & Member Reports (`/report` & Context Menu)
                </h3>
                <p className="text-xs text-zinc-600 mt-1">
                  Community members can report harassment, threats, and phishing via the <code>/report</code> slash command or by right-clicking messages &gt; <strong>Apps &gt; "Report to Staff"</strong>.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-bold flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-600" />
                  Pings On-Duty Staff Automatically
                </span>
              </div>
            </div>

            {/* On-Duty Ping Status Banner */}
            <div className="mt-4 p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-indigo-900">
                <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>
                  <strong>Active Ping Targets: </strong>
                  {dutyStaff.filter((s) => s.isOnDuty).length > 0 ? (
                    <span className="font-mono bg-white px-2 py-0.5 rounded border border-indigo-200 text-indigo-700">
                      {dutyStaff.filter((s) => s.isOnDuty).map((s) => `@${s.userTag}`).join(" ")}
                    </span>
                  ) : (
                    <span className="font-mono bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                      @Moderator @Administrator (Fallback Role Pings)
                    </span>
                  )}
                </span>
              </div>
              <span className="text-[11px] text-indigo-700 font-medium">
                {dutyStaff.filter((s) => s.isOnDuty).length} staff currently clocked in via <code>/duty on</code>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: /report Command Simulator Form */}
            <div className="lg:col-span-5 bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <h4 className="font-bold text-sm text-zinc-900 flex items-center gap-2">
                  <Send className="w-4 h-4 text-indigo-600" />
                  Test Slash Command: <code>/report</code>
                </h4>
                <span className="text-[11px] font-mono bg-zinc-100 px-2 py-0.5 rounded text-zinc-600">
                  User Perspective
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-zinc-700 block mb-1">
                    Target User (<code>user</code>):
                  </label>
                  <input
                    type="text"
                    value={reportTarget}
                    onChange={(e) => setReportTarget(e.target.value)}
                    placeholder="e.g. ToxicMember#1024 or @user"
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-zinc-700 block mb-1">
                    Reason (<code>reason</code>):
                  </label>
                  <textarea
                    rows={3}
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    placeholder="Describe what occurred..."
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-zinc-700 block mb-1">
                    Evidence / Context (<code>evidence</code> - optional):
                  </label>
                  <input
                    type="text"
                    value={reportEvidence}
                    onChange={(e) => setReportEvidence(e.target.value)}
                    placeholder="Message link, channel, or quote..."
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <button
                  onClick={() => {
                    const newReport = {
                      id: `REP-${Math.floor(402 + Math.random() * 50)}`,
                      target: reportTarget || "ReportedMember#0001",
                      targetId: `992810${Math.floor(1000 + Math.random() * 9000)}`,
                      reporter: "You (Discord User)",
                      channel: "#general-chat",
                      reason: reportReason || "Inappropriate behavior",
                      evidence: reportEvidence || "None provided",
                      timestamp: "Just now",
                      status: "PENDING",
                    };
                    setSimulatedReports([newReport, ...simulatedReports]);
                    setReportSentSuccess(true);
                    setTimeout(() => setReportSentSuccess(false), 3000);
                  }}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <Flag className="w-3.5 h-3.5" />
                  Dispatch <code>/report</code> Command
                </button>

                {reportSentSuccess && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2 animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Report delivered to <code>#mod-logs</code> with on-duty staff pings!</span>
                  </div>
                )}
              </div>

              <div className="border-t border-zinc-100 pt-3 text-[11px] text-zinc-500 space-y-1">
                <div className="font-semibold text-zinc-700">Native Discord Integration:</div>
                <p>
                  Members can also right-click any message &gt; <strong>Apps</strong> &gt; <strong>"Report to Staff"</strong> to pop up a modal. Both methods route to <code>#mod-logs</code> and ping on-duty moderators.
                </p>
              </div>
            </div>

            {/* Right: Discord #mod-logs Incident Embed & Quick Action Preview */}
            <div className="lg:col-span-7 bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-orange-600" />
                  <h4 className="font-bold text-sm text-zinc-900">#mod-logs Discord Dispatch Feed</h4>
                </div>
                <span className="text-[11px] text-zinc-500">Live Simulation</span>
              </div>

              {/* Discord UI Mock */}
              <div className="bg-[#313338] text-zinc-200 p-4 rounded-xl font-sans text-xs space-y-3">
                {/* Ping Content Header */}
                <div className="text-zinc-300 font-medium flex items-center gap-1.5 flex-wrap border-b border-zinc-700/60 pb-2">
                  <span className="text-amber-400 font-bold">🔔 ON-DUTY STAFF ALERT:</span>
                  {dutyStaff.filter((s) => s.isOnDuty).length > 0 ? (
                    dutyStaff
                      .filter((s) => s.isOnDuty)
                      .map((s) => (
                        <span key={s.id} className="bg-[#3c4270] text-[#c9cdfb] px-1.5 py-0.5 rounded font-mono text-[11px]">
                          @{s.userTag}
                        </span>
                      ))
                  ) : (
                    <span className="bg-[#4e3a24] text-amber-300 px-1.5 py-0.5 rounded font-mono text-[11px]">
                      @Moderator @Admin (Server Roles)
                    </span>
                  )}
                </div>

                {/* Embed Card */}
                {simulatedReports.length > 0 && (
                  <div className="border-l-4 border-orange-500 bg-[#2b2d31] p-3.5 rounded-r-lg space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-white text-sm flex items-center gap-1.5">
                          <span>🚩 User Report Submitted</span>
                          <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded">
                            {simulatedReports[0].id}
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-400 mt-0.5">
                          Received {simulatedReports[0].timestamp} via <code>/report</code>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          simulatedReports[0].status === "PENDING"
                            ? "bg-amber-900/60 text-amber-200 border border-amber-700/50"
                            : "bg-emerald-900/60 text-emerald-200 border border-emerald-700/50"
                        }`}
                      >
                        {simulatedReports[0].status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-zinc-300">
                      <div>
                        <span className="text-[10px] text-zinc-400 font-semibold block">REPORTED MEMBER</span>
                        <span className="text-rose-400 font-bold">{simulatedReports[0].target}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-400 font-semibold block">REPORTED BY</span>
                        <span className="text-zinc-200">{simulatedReports[0].reporter}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-zinc-400 font-semibold block">REASON</span>
                      <p className="text-zinc-100 mt-0.5 bg-black/25 p-2 rounded border border-white/5">
                        {simulatedReports[0].reason}
                      </p>
                    </div>

                    {simulatedReports[0].evidence && (
                      <div>
                        <span className="text-[10px] text-zinc-400 font-semibold block">EVIDENCE / CONTEXT</span>
                        <p className="text-zinc-300 text-[11px] font-mono mt-0.5 truncate">
                          {simulatedReports[0].evidence}
                        </p>
                      </div>
                    )}

                    {/* Discord Action Row Buttons */}
                    <div className="pt-2 border-t border-zinc-700/60 flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          setSimulatedReports(
                            simulatedReports.map((r, i) => (i === 0 ? { ...r, status: "ACTION_TAKEN (1h Timeout)" } : r))
                          );
                        }}
                        className="px-2.5 py-1 bg-[#5865f2] hover:bg-[#4752c4] text-white rounded text-[11px] font-medium transition-colors"
                      >
                        Mute 1h
                      </button>
                      <button
                        onClick={() => {
                          setSimulatedReports(
                            simulatedReports.map((r, i) => (i === 0 ? { ...r, status: "ACTION_TAKEN (24h Timeout)" } : r))
                          );
                        }}
                        className="px-2.5 py-1 bg-[#4e5058] hover:bg-[#6d6f78] text-white rounded text-[11px] font-medium transition-colors"
                      >
                        Mute 24h
                      </button>
                      <button
                        onClick={() => {
                          setSimulatedReports(
                            simulatedReports.map((r, i) => (i === 0 ? { ...r, status: "DISMISSED (Pardoned)" } : r))
                          );
                        }}
                        className="px-2.5 py-1 bg-[#4e5058] hover:bg-[#6d6f78] text-white rounded text-[11px] font-medium transition-colors"
                      >
                        Dismiss Report
                      </button>
                      <button
                        onClick={() => {
                          setSimulatedReports(
                            simulatedReports.map((r, i) => (i === 0 ? { ...r, status: "ACTION_TAKEN (Banned)" } : r))
                          );
                        }}
                        className="px-2.5 py-1 bg-[#da373c] hover:bg-[#a1282c] text-white rounded text-[11px] font-medium transition-colors"
                      >
                        Ban Member
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Report History List */}
              <div className="pt-2 space-y-2">
                <span className="font-bold text-xs text-zinc-800 block">Recent Reports Queue:</span>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {simulatedReports.map((rep) => (
                    <div
                      key={rep.id}
                      className="p-3 border border-zinc-200 rounded-lg flex items-center justify-between text-xs bg-zinc-50/60"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-zinc-900">{rep.id}</span>
                          <span className="text-rose-600 font-semibold">{rep.target}</span>
                          <span className="text-zinc-400">•</span>
                          <span className="text-zinc-500">by {rep.reporter}</span>
                        </div>
                        <p className="text-zinc-600 text-[11px] truncate max-w-sm mt-0.5">{rep.reason}</p>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          rep.status === "PENDING"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {rep.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 11: STAFF ON-DUTY SHIFT TRACKER (/duty) */}
      {selectedSubTab === "duty" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Moderator Duty Station */}
          <div className="lg:col-span-1 bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-5">
            <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600" />
              Staff Duty Station (`/duty`)
            </h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Moderators toggle active duty shifts so emergency pings, mod-mail, and user reports are only sent to staff currently active.
            </p>

            <div className={`p-4 rounded-xl border ${isSelfOnDuty ? "bg-emerald-50/70 border-emerald-200" : "bg-zinc-50 border-zinc-200"} space-y-3`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-700">My Shift Status:</span>
                <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${isSelfOnDuty ? "bg-emerald-600 text-white" : "bg-zinc-300 text-zinc-700"}`}>
                  {isSelfOnDuty ? "🟢 ON DUTY" : "⚪ OFF DUTY"}
                </span>
              </div>

              {isSelfOnDuty && (
                <div className="text-xs text-emerald-800 bg-white/80 p-2.5 rounded-lg border border-emerald-100 flex items-center justify-between">
                  <span>Shift Active:</span>
                  <span className="font-mono font-bold">{myShiftMinutes} minutes</span>
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-zinc-700 block mb-1">Shift Assignment Note:</label>
                <input
                  type="text"
                  value={myDutyNote}
                  disabled={isSelfOnDuty}
                  onChange={(e) => setMyDutyNote(e.target.value)}
                  placeholder="e.g. Covering #voice-chat until 8 PM"
                  className="w-full text-xs px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white disabled:bg-zinc-100"
                />
              </div>

              <button
                onClick={() => {
                  if (!isSelfOnDuty) {
                    setIsSelfOnDuty(true);
                    setMyShiftMinutes(1);
                    setDutyStaff([
                      ...dutyStaff,
                      {
                        id: `self-${Date.now()}`,
                        userTag: "You (Active Moderator)",
                        role: "Moderator",
                        isOnDuty: true,
                        shiftMinutes: 1,
                        note: myDutyNote || "Active chat monitoring",
                        totalHours: "12h 40m",
                      },
                    ]);
                  } else {
                    setIsSelfOnDuty(false);
                    setDutyStaff(dutyStaff.filter((s) => !s.userTag.startsWith("You")));
                  }
                }}
                className={`w-full py-2 px-4 rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-2 ${
                  isSelfOnDuty
                    ? "bg-rose-600 hover:bg-rose-700 text-white"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                }`}
              >
                <Clock className="w-4 h-4" />
                {isSelfOnDuty ? "Clock Out (/duty off)" : "Clock In (/duty on)"}
              </button>
            </div>

            <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-4 text-xs text-indigo-900 space-y-2">
              <div className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                Anti-Burnout & Alert Routing
              </div>
              <p className="text-[11px] leading-relaxed text-indigo-800">
                Staff can step away for school or sleep without turning off notifications entirely. When off-duty, AegisMod suppresses non-critical pings.
              </p>
            </div>
          </div>

          {/* Right: Active Roster & Statistics */}
          <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-indigo-600" />
                  Active Moderation Roster (`/duty list`)
                </h3>
                <span className="text-xs text-zinc-500">Live view of on-duty staff coverage</span>
              </div>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
                {dutyStaff.filter((s) => s.isOnDuty).length} Staff On Shift
              </span>
            </div>

            <div className="space-y-3">
              {dutyStaff.map((staff) => (
                <div
                  key={staff.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    staff.isOnDuty ? "bg-white border-zinc-200 shadow-sm" : "bg-zinc-50/60 border-zinc-200 opacity-60"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${staff.isOnDuty ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"}`} />
                      <span className="font-bold text-sm text-zinc-900">{staff.userTag}</span>
                      <span className="px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded text-[10px] font-semibold">
                        {staff.role}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-600 italic">
                      "{staff.note}"
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-medium">
                    {staff.isOnDuty && (
                      <div className="text-right">
                        <span className="text-zinc-500 block text-[10px]">Active Shift</span>
                        <span className="text-indigo-600 font-bold">{staff.shiftMinutes}m</span>
                      </div>
                    )}
                    <div className="text-right">
                      <span className="text-zinc-500 block text-[10px]">Total Logged</span>
                      <span className="text-zinc-700">{staff.totalHours}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-zinc-100 pt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500">
              <span>Discord slash commands: <code>/duty on</code>, <code>/duty off</code>, <code>/duty list</code></span>
              <span>Auto-logs shift durations to <code>data/staff_duty.json</code></span>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 11.5: STAFF LEAVE OF ABSENCE (LOA) & COVERAGE (/loa) */}
      {selectedSubTab === "loa" && (
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                Staff Leave of Absence (LOA) & Anti-Burnout Suite (`/loa`)
              </h3>
              <p className="text-xs text-zinc-600 mt-1">
                Moderator staff can formally request time away for school exams, family, vacations, or mental health rest. Prevents moderator burnout, exempts staff on leave from emergency pings, and blocks accidental clock-ins.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-medium text-xs rounded-full border border-indigo-200 flex items-center gap-1.5">
                <Coffee className="w-3.5 h-3.5" /> Anti-Burnout Protection Active
              </span>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3">
              <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider block">Total Staff</span>
              <span className="text-xl font-bold text-zinc-900">4 Moderators</span>
            </div>
            <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3">
              <span className="text-[11px] font-medium text-emerald-700 uppercase tracking-wider block">Clocked In</span>
              <span className="text-xl font-bold text-emerald-900">
                {dutyStaff.filter((s) => s.isOnDuty).length} Active On-Duty
              </span>
            </div>
            <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-3">
              <span className="text-[11px] font-medium text-blue-700 uppercase tracking-wider block">On Approved Leave</span>
              <span className="text-xl font-bold text-blue-900">
                {loaRecords.filter((r) => r.status === "APPROVED").length} Staff Away
              </span>
            </div>
            <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3">
              <span className="text-[11px] font-medium text-amber-700 uppercase tracking-wider block">Pending Requests</span>
              <span className="text-xl font-bold text-amber-900">
                {loaRecords.filter((r) => r.status === "PENDING").length} Awaiting Review
              </span>
            </div>
          </div>

          {/* Duty Protection Notice Banner */}
          <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex items-start md:items-center gap-2.5 text-indigo-950">
              <Clock className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5 md:mt-0" />
              <span>
                <strong>Seamless Duty Integration: </strong>
                Staff on approved LOA are automatically omitted from Mod-Mail & <code>/report</code> alert pings. Attempting to run <code>/duty on</code> prompts the user that their leave is active until their end date or until they run <code>/loa end</code>.
              </span>
            </div>
            <span className="font-mono text-[11px] bg-white px-2.5 py-1 rounded border border-indigo-200 text-indigo-700 whitespace-nowrap self-start md:self-auto">
              Protected by LoaService
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: LOA Roster & Pending Actions */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                  Staff Leave Roster ({loaRecords.length})
                </h4>
                <div className="flex items-center gap-1.5 bg-zinc-100 p-0.5 rounded-lg text-[11px]">
                  <button
                    onClick={() => setLoaFilter("ACTIVE")}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                      loaFilter === "ACTIVE"
                        ? "bg-white text-zinc-900 shadow-sm"
                        : "text-zinc-600 hover:text-zinc-900"
                    }`}
                  >
                    Active Away ({loaRecords.filter((r) => r.status === "APPROVED").length})
                  </button>
                  <button
                    onClick={() => setLoaFilter("PENDING")}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                      loaFilter === "PENDING"
                        ? "bg-white text-zinc-900 shadow-sm"
                        : "text-zinc-600 hover:text-zinc-900"
                    }`}
                  >
                    Pending Review ({loaRecords.filter((r) => r.status === "PENDING").length})
                  </button>
                  <button
                    onClick={() => setLoaFilter("ALL")}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                      loaFilter === "ALL"
                        ? "bg-white text-zinc-900 shadow-sm"
                        : "text-zinc-600 hover:text-zinc-900"
                    }`}
                  >
                    All Records
                  </button>
                </div>
              </div>

              {/* Records List */}
              <div className="space-y-3">
                {loaRecords
                  .filter((r) => {
                    if (loaFilter === "ACTIVE") return r.status === "APPROVED";
                    if (loaFilter === "PENDING") return r.status === "PENDING";
                    return true;
                  })
                  .map((rec) => {
                    const daysRemaining = Math.max(
                      1,
                      Math.ceil((rec.endDate - Date.now()) / (24 * 60 * 60 * 1000))
                    );

                    return (
                      <div
                        key={rec.id}
                        className="border border-zinc-200 rounded-xl p-4 bg-zinc-50/50 hover:bg-zinc-50 transition-colors space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                              {rec.userTag[0]}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-zinc-900">{rec.userTag}</span>
                                <span className="px-2 py-0.5 bg-zinc-200 text-zinc-700 text-[10px] font-semibold rounded">
                                  {rec.role}
                                </span>
                                <span className="font-mono text-[10px] text-zinc-400">{rec.id}</span>
                              </div>
                              <span className="text-xs text-zinc-500">
                                Duration: <strong>{rec.durationDays} Days</strong> • End:{" "}
                                {new Date(rec.endDate).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-start sm:self-auto">
                            {rec.status === "APPROVED" && (
                              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-lg flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Returns in {daysRemaining}d
                              </span>
                            )}
                            {rec.status === "PENDING" && (
                              <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold rounded-lg flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5" /> Needs Admin Review
                              </span>
                            )}
                            {rec.status === "DENIED" && (
                              <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold rounded-lg">
                                Denied
                              </span>
                            )}
                            {rec.status === "EXPIRED" && (
                              <span className="px-2.5 py-1 bg-zinc-200 text-zinc-700 text-xs font-semibold rounded-lg">
                                Completed / Expired
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Reason Quote */}
                        <div className="bg-white border border-zinc-200/80 rounded-lg p-3 text-xs text-zinc-700">
                          <span className="font-semibold text-zinc-500 block mb-1 text-[11px]">Reason for Leave:</span>
                          <p className="italic text-zinc-800">"{rec.reason}"</p>
                        </div>

                        {/* Reviewer / Action Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-zinc-200/60 text-xs">
                          {rec.reviewedBy ? (
                            <span className="text-zinc-500 text-[11px]">
                              Approved by <strong>@{rec.reviewedBy}</strong>
                              {rec.reviewNotes && ` — "${rec.reviewNotes}"`}
                            </span>
                          ) : (
                            <span className="text-amber-700 font-medium text-[11px]">
                              Requires Administrator or Server Owner approval
                            </span>
                          )}

                          <div className="flex items-center gap-2">
                            {rec.status === "PENDING" && (
                              <>
                                <button
                                  onClick={() => {
                                    setLoaRecords(
                                      loaRecords.map((r) =>
                                        r.id === rec.id
                                          ? {
                                              ...r,
                                              status: "APPROVED",
                                              reviewedBy: "SeniorAdmin#0001",
                                              reviewedAt: Date.now(),
                                              reviewNotes: "Approved by Head Moderator in dashboard",
                                            }
                                          : r
                                      )
                                    );
                                  }}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                                >
                                  <Check className="w-3.5 h-3.5" /> Approve (/loa approve)
                                </button>
                                <button
                                  onClick={() => {
                                    setLoaRecords(
                                      loaRecords.map((r) =>
                                        r.id === rec.id
                                          ? {
                                              ...r,
                                              status: "DENIED",
                                              reviewedBy: "SeniorAdmin#0001",
                                              reviewedAt: Date.now(),
                                              reviewNotes: "Coverage shortage during requested week",
                                            }
                                          : r
                                      )
                                    );
                                  }}
                                  className="px-2.5 py-1 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-medium text-xs rounded-lg transition-colors flex items-center gap-1"
                                >
                                  <XCircle className="w-3.5 h-3.5" /> Deny
                                </button>
                              </>
                            )}

                            {rec.status === "APPROVED" && (
                              <button
                                onClick={() => {
                                  setLoaRecords(
                                    loaRecords.map((r) =>
                                      r.id === rec.id
                                        ? { ...r, status: "EXPIRED" }
                                        : r
                                    )
                                  );
                                }}
                                className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-medium text-xs rounded-lg border border-zinc-200 transition-colors"
                              >
                                End LOA Early (/loa end)
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Right Col: Interactive Request Simulator (/loa request) */}
            <div className="space-y-4">
              <div className="border border-zinc-200 rounded-xl p-4 bg-zinc-50/60 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-zinc-900">Request Leave of Absence</h4>
                    <p className="text-[11px] text-zinc-500">Discord Command: <code>/loa request</code></p>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold text-zinc-700">Duration (Days):</label>
                      <span className="font-mono text-indigo-600 font-bold">{loaReqDays} days</span>
                    </div>
                    <div className="flex gap-1.5 mb-2">
                      {[3, 7, 14, 30].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setLoaReqDays(preset)}
                          className={`flex-1 py-1 rounded text-xs font-semibold border transition-all ${
                            loaReqDays === preset
                              ? "bg-indigo-600 text-white border-indigo-600"
                              : "bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-100"
                          }`}
                        >
                          {preset}d
                        </button>
                      ))}
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={60}
                      value={loaReqDays}
                      onChange={(e) => setLoaReqDays(parseInt(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-zinc-700 block mb-1">
                      Reason for Time Away:
                    </label>
                    <textarea
                      rows={3}
                      value={loaReqReason}
                      onChange={(e) => setLoaReqReason(e.target.value)}
                      className="w-full p-2 border border-zinc-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      placeholder="e.g. Vacation, exams, burnout prevention, family commitments..."
                    />
                  </div>

                  {loaSuccessNotice && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-[11px] flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                      <span>Request submitted! Alert dispatched to Head Staff in <code>#mod-logs</code>.</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      const newId = `LOA-${1000 + loaRecords.length + 1}`;
                      const newRec = {
                        id: newId,
                        userId: "u-curr",
                        userTag: "CurrentMod#1337",
                        role: "Moderator",
                        reason: loaReqReason,
                        durationDays: loaReqDays,
                        startDate: Date.now(),
                        endDate: Date.now() + loaReqDays * 24 * 60 * 60 * 1000,
                        status: "PENDING" as const,
                        reviewedBy: undefined,
                        reviewedAt: undefined,
                        reviewNotes: undefined,
                      };
                      setLoaRecords([newRec, ...loaRecords]);
                      setLoaSuccessNotice(true);
                      setTimeout(() => setLoaSuccessNotice(false), 4000);
                    }}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" /> Submit Request (/loa request)
                  </button>
                </div>
              </div>

              {/* Slash Command Quick Reference */}
              <div className="border border-zinc-200 rounded-xl p-4 bg-white space-y-2.5 text-xs text-zinc-600">
                <span className="font-bold text-zinc-900 block text-xs">LOA Discord Commands</span>
                <div className="space-y-1.5 font-mono text-[11px]">
                  <p><code>/loa request &lt;days&gt; &lt;reason&gt;</code> — Submit leave</p>
                  <p><code>/loa list [filter]</code> — Inspect active or pending</p>
                  <p><code>/loa status [@user]</code> — Check return dates</p>
                  <p><code>/loa approve &lt;id&gt;</code> — Senior staff approval</p>
                  <p><code>/loa deny &lt;id&gt;</code> — Reject request with notes</p>
                  <p><code>/loa end</code> — Return early and reactivate duty</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {selectedSubTab === "modmail" && (
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                <Inbox className="w-5 h-5 text-indigo-600" />
                Anonymous Staff Mod-Mail Desk (`/modmail`)
              </h3>
              <p className="text-xs text-zinc-600 mt-1">
                Enables teens to report bullying, stalkers, or sensitive issues privately. Staff can reply anonymously as <strong>AegisMod Staff</strong> to protect individual moderators from retaliation.
              </p>
            </div>
            <button
              onClick={() => {
                const newId = `MM-${1000 + modmailTickets.length + 1}`;
                const newTicket = {
                  id: newId,
                  userTag: `TeenStudent#${Math.floor(1000 + Math.random() * 9000)}`,
                  subject: "Distressing message in study room",
                  category: "SAFETY_CONCERN" as const,
                  status: "WAITING_STAFF" as const,
                  updatedAt: "Just now",
                  messages: [
                    {
                      id: `m-new`,
                      sender: "USER" as const,
                      author: "TeenStudent",
                      content: "Can someone help me? A member in #study-hall is saying weird things to my friend.",
                      time: "Just now",
                    },
                  ],
                };
                setModmailTickets([newTicket, ...modmailTickets]);
                setSelectedTicketId(newId);
              }}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-lg transition-colors border border-indigo-200 flex items-center gap-1.5 self-start md:self-auto"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Simulate Inbound Ticket
            </button>
          </div>

          {/* On-Duty Staff Notification Status */}
          <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-indigo-950">
              <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>
                <strong>On-Duty Ping Alert: </strong>
                {dutyStaff.filter((s) => s.isOnDuty).length > 0 ? (
                  <span className="font-mono bg-white px-2 py-0.5 rounded border border-indigo-200 text-indigo-700">
                    {dutyStaff.filter((s) => s.isOnDuty).map((s) => `@${s.userTag}`).join(" ")}
                  </span>
                ) : (
                  <span className="font-mono bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                    @Moderator @Administrator (Server Roles)
                  </span>
                )}
              </span>
            </div>
            <span className="text-[11px] text-indigo-700">
              New tickets and user DM replies auto-ping on-duty staff in <code>#mod-logs</code>
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Ticket List Sidebar */}
            <div className="lg:col-span-1 border border-zinc-200 rounded-xl overflow-hidden divide-y divide-zinc-100 bg-zinc-50/50">
              <div className="p-3 bg-zinc-100/70 text-xs font-bold text-zinc-700 flex items-center justify-between">
                <span>Active Tickets ({modmailTickets.length})</span>
                <span className="text-[10px] text-zinc-500 font-normal">Auto-Synced</span>
              </div>
              <div className="max-h-[460px] overflow-y-auto divide-y divide-zinc-100">
                {modmailTickets.map((t) => {
                  const isSel = t.id === selectedTicketId;
                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTicketId(t.id)}
                      className={`p-3.5 cursor-pointer transition-all ${
                        isSel ? "bg-white border-l-4 border-l-indigo-600 shadow-sm" : "hover:bg-zinc-100/60"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono font-bold text-xs text-indigo-600">{t.id}</span>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                          t.status === "WAITING_STAFF"
                            ? "bg-amber-100 text-amber-800"
                            : t.status === "WAITING_USER"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}>
                          {t.status.replace("_", " ")}
                        </span>
                      </div>
                      <div className="font-semibold text-xs text-zinc-800 truncate">{t.subject}</div>
                      <div className="text-[11px] text-zinc-500 flex items-center justify-between mt-1">
                        <span>{t.userTag}</span>
                        <span>{t.updatedAt}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Conversation Window */}
            {(() => {
              const activeTicket = modmailTickets.find((t) => t.id === selectedTicketId) || modmailTickets[0];
              if (!activeTicket) return null;

              return (
                <div className="lg:col-span-2 border border-zinc-200 rounded-xl overflow-hidden flex flex-col bg-white">
                  {/* Ticket Header */}
                  <div className="p-4 border-b border-zinc-200 bg-zinc-50/70 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-indigo-600 text-sm">{activeTicket.id}</span>
                        <span className="font-bold text-sm text-zinc-900">{activeTicket.subject}</span>
                      </div>
                      <span className="text-xs text-zinc-500">
                        From: <strong>{activeTicket.userTag}</strong> • Category: <span className="text-zinc-700">{activeTicket.category}</span>
                      </span>
                    </div>

                    {activeTicket.status !== "CLOSED" && (
                      <button
                        onClick={() => {
                          setModmailTickets(
                            modmailTickets.map((t) =>
                              t.id === activeTicket.id ? { ...t, status: "CLOSED" as const } : t
                            )
                          );
                        }}
                        className="px-3 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-medium rounded-lg transition-colors border border-zinc-300"
                      >
                        Resolve & Close
                      </button>
                    )}
                  </div>

                  {/* Messages Bubble Area */}
                  <div className="p-4 flex-1 overflow-y-auto space-y-3 min-h-[260px] max-h-[340px] bg-zinc-50/30">
                    {activeTicket.messages.map((m) => {
                      const isStaff = m.sender === "STAFF";
                      return (
                        <div key={m.id} className={`flex flex-col ${isStaff ? "items-end" : "items-start"}`}>
                          <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 mb-0.5">
                            <span className="font-bold">{m.author}</span>
                            <span>•</span>
                            <span>{m.time}</span>
                          </div>
                          <div
                            className={`p-3 rounded-xl max-w-md text-xs leading-relaxed ${
                              isStaff
                                ? "bg-indigo-600 text-white rounded-br-none shadow-sm"
                                : "bg-white border border-zinc-200 text-zinc-800 rounded-bl-none shadow-sm"
                            }`}
                          >
                            {m.content}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Reply Input Bar */}
                  {activeTicket.status !== "CLOSED" ? (
                    <div className="p-3 border-t border-zinc-200 bg-white space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <label className="flex items-center gap-1.5 cursor-pointer text-zinc-700 font-medium">
                          <input
                            type="checkbox"
                            checked={sendAnonymous}
                            onChange={(e) => setSendAnonymous(e.target.checked)}
                            className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>🔒 Send Anonymously as "AegisMod Staff"</span>
                        </label>
                        <span className="text-[11px] text-zinc-400">Delivered via Discord DM</span>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && replyText.trim()) {
                              const newMsg = {
                                id: `msg-${Date.now()}`,
                                sender: "STAFF" as const,
                                author: sendAnonymous ? "AegisMod Staff (Anonymous)" : "Sarah_Mod#4012",
                                content: replyText.trim(),
                                time: "Just now",
                              };
                              setModmailTickets(
                                modmailTickets.map((t) =>
                                  t.id === activeTicket.id
                                    ? {
                                        ...t,
                                        status: "WAITING_USER" as const,
                                        messages: [...t.messages, newMsg],
                                        updatedAt: "Just now",
                                      }
                                    : t
                                )
                              );
                              setReplyText("");
                            }
                          }}
                          placeholder="Type staff response (Press Enter or click Send)..."
                          className="flex-1 text-xs px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <button
                          onClick={() => {
                            if (!replyText.trim()) return;
                            const newMsg = {
                              id: `msg-${Date.now()}`,
                              sender: "STAFF" as const,
                              author: sendAnonymous ? "AegisMod Staff (Anonymous)" : "Sarah_Mod#4012",
                              content: replyText.trim(),
                              time: "Just now",
                            };
                            setModmailTickets(
                              modmailTickets.map((t) =>
                                t.id === activeTicket.id
                                  ? {
                                      ...t,
                                      status: "WAITING_USER" as const,
                                      messages: [...t.messages, newMsg],
                                      updatedAt: "Just now",
                                    }
                                  : t
                              )
                            );
                            setReplyText("");
                          }}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Send
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 border-t border-zinc-200 bg-zinc-50 text-center text-xs text-zinc-500">
                      🔒 This ticket was marked as resolved and closed.
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* SUB-VIEW 13: AUDIT LOG & TRANSPARENCY EXPORTER (/exportlogs) */}
      {selectedSubTab === "exportlogs" && (
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                Moderation Audit Log & Transparency Exporter (`/exportlogs`)
              </h3>
              <p className="text-xs text-zinc-600 mt-1">
                Generates RFC-4180 CSV spreadsheets, structured JSON files, and executive summaries for server owners, school sponsors, and teen safety compliance audits.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const csvText = [
                    "Case ID,Timestamp (UTC),Target User,Moderator,Action,Reason",
                    ...sampleAuditRecords.map(
                      (r) => `"${r.caseId}","${r.timestamp}","${r.user}","${r.mod}","${r.action}","${r.reason}"`
                    ),
                  ].join("\n");
                  navigator.clipboard.writeText(csvText);
                  setCopiedNotification(true);
                  setTimeout(() => setCopiedNotification(false), 2000);
                }}
                className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold text-xs rounded-lg transition-colors border border-zinc-300 flex items-center gap-1.5"
              >
                {copiedNotification ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedNotification ? "Copied CSV!" : "Copy CSV"}
              </button>

              <button
                onClick={() => {
                  const blob = new Blob(
                    [
                      JSON.stringify(
                        {
                          exportDate: new Date().toISOString(),
                          guildName: "Teen Gaming & Study Lounge",
                          records: sampleAuditRecords,
                        },
                        null,
                        2
                      ),
                    ],
                    { type: "application/json" }
                  );
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `aegismod_audit_${Date.now()}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                Download .JSON
              </button>
            </div>
          </div>

          {/* Controls: Timeframe, Filter, Format */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-zinc-50 border border-zinc-200 rounded-xl">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-zinc-700">Timeframe:</span>
                <select
                  value={exportTimeframe}
                  onChange={(e) => setExportTimeframe(e.target.value)}
                  className="px-2.5 py-1.5 border border-zinc-200 rounded-lg bg-white text-xs text-zinc-800 focus:outline-none"
                >
                  <option value="7">Past 7 Days</option>
                  <option value="30">Past 30 Days</option>
                  <option value="0">All-Time</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-zinc-700">Action Filter:</span>
                <select
                  value={exportActionFilter}
                  onChange={(e) => setExportActionFilter(e.target.value)}
                  className="px-2.5 py-1.5 border border-zinc-200 rounded-lg bg-white text-xs text-zinc-800 focus:outline-none"
                >
                  <option value="ALL">All Actions</option>
                  <option value="BAN">Bans Only</option>
                  <option value="TIMEOUT_24H">24h Timeouts</option>
                  <option value="TIMEOUT_1H">1h Timeouts</option>
                  <option value="WARN">Warnings</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1 bg-zinc-200/70 p-1 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setExportFormatTab("summary")}
                className={`px-3 py-1 rounded-md transition-colors ${
                  exportFormatTab === "summary" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                Executive Summary
              </button>
              <button
                onClick={() => setExportFormatTab("csv")}
                className={`px-3 py-1 rounded-md transition-colors ${
                  exportFormatTab === "csv" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                CSV View
              </button>
              <button
                onClick={() => setExportFormatTab("json")}
                className={`px-3 py-1 rounded-md transition-colors ${
                  exportFormatTab === "json" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                JSON Raw
              </button>
            </div>
          </div>

          {/* Display Output */}
          {exportFormatTab === "summary" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl">
                  <span className="text-[11px] text-zinc-500 font-semibold block">Total Incidents</span>
                  <span className="text-2xl font-black text-zinc-900 mt-1 block">6</span>
                </div>
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl">
                  <span className="text-[11px] text-rose-600 font-semibold block">Total Bans</span>
                  <span className="text-2xl font-black text-rose-950 mt-1 block">2</span>
                </div>
                <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl">
                  <span className="text-[11px] text-orange-600 font-semibold block">Timeouts Applied</span>
                  <span className="text-2xl font-black text-orange-950 mt-1 block">2</span>
                </div>
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                  <span className="text-[11px] text-amber-600 font-semibold block">Warnings</span>
                  <span className="text-2xl font-black text-amber-950 mt-1 block">1</span>
                </div>
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                  <span className="text-[11px] text-emerald-600 font-semibold block">Appeals Granted</span>
                  <span className="text-2xl font-black text-emerald-950 mt-1 block">1</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-zinc-200 rounded-xl bg-white space-y-3">
                  <h4 className="font-bold text-xs text-zinc-800">Violation Breakdown by Category</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-600">Predatory Grooming (Zero-Tolerance)</span>
                      <span className="font-bold text-rose-600">1 (16.6%)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-600">Phishing & Discord Nitro Scams</span>
                      <span className="font-bold text-orange-600">1 (16.6%)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-600">Cyberbullying & Harassment</span>
                      <span className="font-bold text-amber-600">1 (16.6%)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-600">Raid Flood Quota Exceeded</span>
                      <span className="font-bold text-indigo-600">1 (16.6%)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-600">Caps & Zalgo Spam Flooding</span>
                      <span className="font-bold text-zinc-600">1 (16.6%)</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 border border-zinc-200 rounded-xl bg-white space-y-3">
                  <h4 className="font-bold text-xs text-zinc-800">Staff & System Enforcement Distribution</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-700">1. Sarah_Mod#4012</span>
                      <span className="font-semibold text-zinc-900">2 actions (1 timeout, 1 appeal)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-700">2. JakeSenior#9901</span>
                      <span className="font-semibold text-zinc-900">1 action (1 warning)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-700">3. System AutoMod (Zero-token)</span>
                      <span className="font-semibold text-zinc-900">2 actions (1 raid ban, 1 spam ban)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-700">4. Gemini 3.8 Flash AI</span>
                      <span className="font-semibold text-zinc-900">1 action (1 phishing timeout)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {exportFormatTab === "csv" && (
            <div className="border border-zinc-200 rounded-xl overflow-x-auto bg-zinc-50/50">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-zinc-100/80 text-zinc-700 border-b border-zinc-200">
                  <tr>
                    <th className="p-3 font-semibold">Case ID</th>
                    <th className="p-3 font-semibold">Timestamp</th>
                    <th className="p-3 font-semibold">Target User</th>
                    <th className="p-3 font-semibold">Moderator</th>
                    <th className="p-3 font-semibold">Action</th>
                    <th className="p-3 font-semibold">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 bg-white">
                  {sampleAuditRecords.map((r) => (
                    <tr key={r.caseId} className="hover:bg-zinc-50">
                      <td className="p-3 font-bold text-indigo-600">{r.caseId}</td>
                      <td className="p-3 text-zinc-500">{r.timestamp}</td>
                      <td className="p-3 text-zinc-800">{r.user}</td>
                      <td className="p-3 text-zinc-600">{r.mod}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.action === "BAN"
                            ? "bg-rose-100 text-rose-800"
                            : r.action.startsWith("TIMEOUT")
                            ? "bg-amber-100 text-amber-800"
                            : r.action === "UNMUTE"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-blue-100 text-blue-800"
                        }`}>
                          {r.action}
                        </span>
                      </td>
                      <td className="p-3 text-zinc-700 max-w-xs truncate">{r.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {exportFormatTab === "json" && (
            <div className="border border-zinc-200 rounded-xl p-4 bg-zinc-950 text-emerald-400 font-mono text-xs overflow-x-auto max-h-[380px]">
              <pre>
                {JSON.stringify(
                  {
                    metadata: {
                      exportVersion: "2.0.0",
                      guild: "Teen Gaming & Study Lounge",
                      generatedAt: new Date().toISOString(),
                      timeframeDays: exportTimeframe,
                      totalRecords: sampleAuditRecords.length,
                    },
                    records: sampleAuditRecords,
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
