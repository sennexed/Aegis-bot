import React, { useState } from "react";
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  KeyRound,
  UserCheck,
  RefreshCw,
  Sparkles,
  Sliders,
  Check,
  XCircle,
  HelpCircle,
  Send,
  MessageSquare,
  ArrowRight,
} from "lucide-react";

export const VerificationGatekeeperSimulator: React.FC = () => {
  // Gatekeeper Config State
  const [enabled, setEnabled] = useState(true);
  const [mode, setMode] = useState<"BUTTON" | "CAPTCHA" | "ANTI_ALT" | "AI_PLEDGE">("CAPTCHA");
  const [minAccountAgeDays, setMinAccountAgeDays] = useState(3);
  const [requireAvatar, setRequireAvatar] = useState(true);
  const [captchaMaxAttempts] = useState(3);

  // Simulated User State
  const [simUser, setSimUser] = useState({
    tag: "NewcomerGamer#4910",
    accountAgeDays: 14,
    hasCustomAvatar: true,
    isVerified: false,
    isQuarantined: false,
    roles: ["Unverified"],
  });

  // Captcha Interaction State
  const [showCaptchaModal, setShowCaptchaModal] = useState(false);
  const [activeCaptchaCode, setActiveCaptchaCode] = useState("H7K9MN");
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaAttemptsLeft, setCaptchaAttemptsLeft] = useState(3);
  const [captchaError, setCaptchaError] = useState<string | null>(null);

  // AI Pledge Modal State
  const [showPledgeModal, setShowPledgeModal] = useState(false);
  const [pledgeInput, setPledgeInput] = useState("");
  const [pledgeError, setPledgeError] = useState<string | null>(null);

  // Feedback Toast / Alert
  const [bannerNotice, setBannerNotice] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  // Audit Log Stream
  const [gatekeeperAuditLogs, setGatekeeperAuditLogs] = useState([
    {
      id: "LOG-109",
      user: "AlexGamer16#1029",
      time: "2 mins ago",
      method: "CAPTCHA",
      outcome: "VERIFIED",
      details: "Solved in 8.4s (Attempt 1/3). Assigned @Verified Member.",
    },
    {
      id: "LOG-108",
      user: "BurnerBot#0091",
      time: "14 mins ago",
      method: "ANTI_ALT",
      outcome: "QUARANTINED",
      details: "Account age (0 days) below minimum 3 days policy. Assigned @Quarantined.",
    },
    {
      id: "LOG-107",
      user: "SarahTeen#3391",
      time: "28 mins ago",
      method: "BUTTON",
      outcome: "VERIFIED",
      details: "Accepted community safety standards. Assigned @Verified Member.",
    },
  ]);

  const generateNewCaptcha = () => {
    const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setActiveCaptchaCode(code);
    setCaptchaInput("");
    setCaptchaError(null);
  };

  const handleVerifyButtonClick = () => {
    setBannerNotice(null);

    if (!enabled) {
      setBannerNotice({
        type: "info",
        text: "Gatekeeper is currently disabled. All newcomers receive automatic server access.",
      });
      return;
    }

    if (mode === "BUTTON") {
      completeVerification("BUTTON", "One-Click Rules Acceptance");
    } else if (mode === "CAPTCHA") {
      generateNewCaptcha();
      setCaptchaAttemptsLeft(captchaMaxAttempts);
      setShowCaptchaModal(true);
    } else if (mode === "ANTI_ALT") {
      if (simUser.accountAgeDays < minAccountAgeDays) {
        setSimUser({
          ...simUser,
          isQuarantined: true,
          roles: ["Quarantined"],
        });
        setBannerNotice({
          type: "error",
          text: `Quarantined: Account age (${simUser.accountAgeDays}d) is below the required ${minAccountAgeDays} days maturity threshold.`,
        });
        addAuditEntry("ANTI_ALT", "QUARANTINED", `Account age (${simUser.accountAgeDays}d) below threshold.`);
      } else if (requireAvatar && !simUser.hasCustomAvatar) {
        setSimUser({
          ...simUser,
          isQuarantined: true,
          roles: ["Quarantined"],
        });
        setBannerNotice({
          type: "error",
          text: "Quarantined: Default Discord avatar detected. A custom avatar is required to prevent burner accounts.",
        });
        addAuditEntry("ANTI_ALT", "QUARANTINED", "Missing custom avatar.");
      } else {
        completeVerification("ANTI_ALT", `Maturity criteria met (${simUser.accountAgeDays}d account).`);
      }
    } else if (mode === "AI_PLEDGE") {
      setPledgeInput("");
      setPledgeError(null);
      setShowPledgeModal(true);
    }
  };

  const handleCaptchaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (captchaInput.trim().toUpperCase() === activeCaptchaCode) {
      setShowCaptchaModal(false);
      completeVerification("CAPTCHA", `6-char Captcha solved successfully (${activeCaptchaCode}).`);
    } else {
      const nextLeft = captchaAttemptsLeft - 1;
      setCaptchaAttemptsLeft(nextLeft);
      if (nextLeft <= 0) {
        setShowCaptchaModal(false);
        setSimUser({ ...simUser, isQuarantined: true, roles: ["Quarantined"] });
        setBannerNotice({
          type: "error",
          text: "Maximum captcha attempts exceeded. Account placed in quarantine pending staff review.",
        });
        addAuditEntry("CAPTCHA", "FAILED", "Exhausted all 3 attempts. Quarantined.");
      } else {
        setCaptchaError(`Incorrect code. ${nextLeft} attempt(s) remaining.`);
      }
    }
  };

  const handlePledgeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pledgeInput.toLowerCase().includes("agree")) {
      setShowPledgeModal(false);
      completeVerification("AI_PLEDGE", "Teen safety pledge accepted & confirmed.");
    } else {
      setPledgeError("Please type 'I agree' to confirm your acceptance.");
    }
  };

  const completeVerification = (method: string, details: string) => {
    setSimUser({
      ...simUser,
      isVerified: true,
      isQuarantined: false,
      roles: ["Verified Teen (16+)", "Community Member"],
    });
    setBannerNotice({
      type: "success",
      text: "Verification Passed! Unverified restrictions removed; @Verified Member assigned.",
    });
    addAuditEntry(method, "VERIFIED", details);
  };

  const addAuditEntry = (method: string, outcome: string, details: string) => {
    const newLog = {
      id: `LOG-${Math.floor(100 + Math.random() * 900)}`,
      user: simUser.tag,
      time: "Just now",
      method,
      outcome,
      details,
    };
    setGatekeeperAuditLogs([newLog, ...gatekeeperAuditLogs]);
  };

  const resetUser = () => {
    setSimUser({
      tag: "NewcomerGamer#4910",
      accountAgeDays: 14,
      hasCustomAvatar: true,
      isVerified: false,
      isQuarantined: false,
      roles: ["Unverified"],
    });
    setBannerNotice(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs tracking-wider uppercase">
              <Shield className="w-4 h-4" />
              <span>AegisMod Security Suite • Member Gatekeeper</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 mt-1">
              Verification & Onboarding Gatekeeper (`/verify`)
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 mt-1 max-w-3xl">
              Protects adolescent servers from token raid bots, ban-evading alts, and automated scammers.
              Isolates newcomers in a dedicated <code className="bg-zinc-100 px-1 py-0.5 rounded text-indigo-600">#verification</code> channel until they pass your chosen challenge.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setEnabled(!enabled)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                enabled
                  ? "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
                  : "bg-zinc-200 text-zinc-700 hover:bg-zinc-300"
              }`}
            >
              {enabled ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              <span>Gatekeeper: {enabled ? "ENABLED" : "DISABLED"}</span>
            </button>
            <button
              onClick={resetUser}
              className="px-3 py-1.5 border border-zinc-300 text-zinc-700 hover:bg-zinc-50 rounded-lg text-xs font-semibold flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Test User</span>
            </button>
          </div>
        </div>

        {/* Status Toast */}
        {bannerNotice && (
          <div
            className={`mt-4 p-3 rounded-lg text-xs font-medium flex items-center justify-between border ${
              bannerNotice.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : bannerNotice.type === "error"
                ? "bg-rose-50 border-rose-200 text-rose-800"
                : "bg-blue-50 border-blue-200 text-blue-800"
            }`}
          >
            <div className="flex items-center gap-2">
              {bannerNotice.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : bannerNotice.type === "error" ? (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              ) : (
                <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
              )}
              <span>{bannerNotice.text}</span>
            </div>
            <button onClick={() => setBannerNotice(null)} className="text-zinc-400 hover:text-zinc-600">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Main Grid: Controls vs Discord Channel Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Configuration & Test Parameters (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Challenge Mode Selector */}
          <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <span>Verification Challenge Mode</span>
            </h3>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { id: "BUTTON", title: "1. One-Click", desc: "Instant click-to-verify" },
                { id: "CAPTCHA", title: "2. Anti-Bot Captcha", desc: "6-char alphanumeric code" },
                { id: "ANTI_ALT", title: "3. Account Maturity", desc: "Age & avatar gate" },
                { id: "AI_PLEDGE", title: "4. AI Safety Pledge", desc: "Adolescent safety vow" },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id as any)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    mode === m.id
                      ? "border-indigo-600 bg-indigo-50/70 text-indigo-950 ring-1 ring-indigo-600"
                      : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700"
                  }`}
                >
                  <div className="font-bold">{m.title}</div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">{m.desc}</div>
                </button>
              ))}
            </div>

            {/* Sub-Parameters */}
            <div className="pt-3 border-t border-zinc-100 space-y-3 text-xs">
              <div>
                <div className="flex justify-between font-medium text-zinc-700 mb-1">
                  <span>Minimum Account Age Threshold</span>
                  <span className="font-bold text-indigo-600">{minAccountAgeDays} Days</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={minAccountAgeDays}
                  onChange={(e) => setMinAccountAgeDays(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
                <span className="text-[11px] text-zinc-400">Accounts younger than this are quarantined for review.</span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  <span className="font-medium text-zinc-800 block">Require Custom Profile Avatar</span>
                  <span className="text-[11px] text-zinc-400">Blocks default Discord avatars commonly used by alt bots</span>
                </div>
                <input
                  type="checkbox"
                  checked={requireAvatar}
                  onChange={(e) => setRequireAvatar(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 text-indigo-600 accent-indigo-600"
                />
              </div>
            </div>
          </div>

          {/* Test User Inspector */}
          <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-3 text-xs">
            <h4 className="font-bold text-zinc-900 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-indigo-600" /> Test User Profile
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  simUser.isVerified
                    ? "bg-emerald-100 text-emerald-800"
                    : simUser.isQuarantined
                    ? "bg-rose-100 text-rose-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {simUser.isVerified ? "VERIFIED" : simUser.isQuarantined ? "QUARANTINED" : "UNVERIFIED"}
              </span>
            </h4>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 bg-zinc-50 rounded-lg border border-zinc-200">
                <span className="text-zinc-400 block text-[11px]">Discord Account Age</span>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    min="0"
                    max="365"
                    value={simUser.accountAgeDays}
                    onChange={(e) => setSimUser({ ...simUser, accountAgeDays: Number(e.target.value) })}
                    className="w-16 px-2 py-1 bg-white border border-zinc-300 rounded font-bold text-xs"
                  />
                  <span className="text-zinc-600 font-medium">days</span>
                </div>
              </div>

              <div className="p-2.5 bg-zinc-50 rounded-lg border border-zinc-200">
                <span className="text-zinc-400 block text-[11px]">Custom Avatar</span>
                <button
                  onClick={() => setSimUser({ ...simUser, hasCustomAvatar: !simUser.hasCustomAvatar })}
                  className={`mt-1 px-2.5 py-1 rounded text-xs font-semibold w-full border ${
                    simUser.hasCustomAvatar
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-rose-50 text-rose-700 border-rose-200"
                  }`}
                >
                  {simUser.hasCustomAvatar ? "Custom Avatar (OK)" : "Default Avatar (Flag)"}
                </button>
              </div>
            </div>

            <div>
              <span className="text-zinc-400 block text-[11px] mb-1">Active Assigned Roles</span>
              <div className="flex flex-wrap gap-1.5">
                {simUser.roles.map((role) => (
                  <span
                    key={role}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                      role.includes("Verified")
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : role.includes("Quarantined")
                        ? "bg-rose-50 text-rose-800 border-rose-200"
                        : "bg-zinc-100 text-zinc-700 border-zinc-200"
                    }`}
                  >
                    @{role}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="bg-zinc-900 text-white rounded-xl p-4 shadow-sm">
            <span className="text-xs font-bold text-zinc-400 tracking-wider uppercase block mb-3">
              Gatekeeper Operations Statistics
            </span>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-zinc-800/80 p-2.5 rounded-lg border border-zinc-700">
                <div className="text-lg font-black text-emerald-400">1,420</div>
                <div className="text-[10px] text-zinc-400 mt-0.5">Verified Members</div>
              </div>
              <div className="bg-zinc-800/80 p-2.5 rounded-lg border border-zinc-700">
                <div className="text-lg font-black text-rose-400">18</div>
                <div className="text-[10px] text-zinc-400 mt-0.5">Quarantined Alts</div>
              </div>
              <div className="bg-zinc-800/80 p-2.5 rounded-lg border border-zinc-700">
                <div className="text-lg font-black text-indigo-400">&lt; 45ms</div>
                <div className="text-[10px] text-zinc-400 mt-0.5">Zero-Token Pass</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Discord Channel Simulation (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[#313338] text-white rounded-2xl overflow-hidden shadow-lg border border-zinc-800 flex flex-col font-sans">
            {/* Discord Channel Top Bar */}
            <div className="px-4 py-3 bg-[#2b2d31] border-b border-[#1f2023] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-zinc-200 font-semibold">
                <span className="text-zinc-400 text-sm">#</span>
                <span>verification-gate</span>
                <span className="text-zinc-500 text-[11px] font-normal hidden sm:inline">
                  — Complete verification to unlock server channels
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#232428] text-zinc-300 border border-zinc-700">
                  Visible to: @Unverified Only
                </span>
              </div>
            </div>

            {/* Discord Channel Chat Body */}
            <div className="p-5 space-y-4 bg-[#313338] min-h-[380px]">
              {/* Bot Message Header */}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-xs shrink-0 shadow">
                  🛡️
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-xs">AegisMod</span>
                    <span className="bg-indigo-600 text-white text-[9px] px-1 py-0.2 rounded font-bold uppercase tracking-wider">
                      BOT
                    </span>
                    <span className="text-zinc-400 text-[10px]">Today at 10:14 PM</span>
                  </div>

                  {/* AegisMod Verification Embed */}
                  <div className="border-l-4 border-indigo-500 bg-[#2b2d31] rounded-r-lg p-4 space-y-3 max-w-xl text-xs text-zinc-200">
                    <div className="font-bold text-sm text-white flex items-center gap-1.5">
                      <span>🛡️ Welcome to Teen Gaming & Study Lounge • Verification Gate</span>
                    </div>

                    <p className="text-zinc-300 leading-relaxed text-[11px]">
                      To protect our community from raid bots, scams, and predators, all new members must complete verification before gaining access to community chat channels.
                    </p>

                    <div className="space-y-1.5 bg-[#232428] p-3 rounded border border-zinc-700 text-[11px]">
                      <div className="font-bold text-zinc-200 flex items-center gap-1 text-[11px]">
                        <span>📜 Community Rules & Teen Safety Principles</span>
                      </div>
                      <ul className="space-y-1 text-zinc-400 text-[10px] list-disc list-inside">
                        <li><strong>Respect & Civility:</strong> No slurs, cyberbullying, or hate speech.</li>
                        <li><strong>Adolescent Protection:</strong> Never solicit personal phone numbers, addresses, or suggestive DMs.</li>
                        <li><strong>Zero Scams:</strong> No Discord Nitro gifts or fake trading links.</li>
                      </ul>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="text-zinc-400">
                        Active Challenge Mode: <strong className="text-indigo-400">{mode}</strong>
                      </span>
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> 24/7 Security Gate
                      </span>
                    </div>
                  </div>

                  {/* Discord Action Row Buttons */}
                  <div className="pt-2 flex flex-wrap gap-2">
                    <button
                      onClick={handleVerifyButtonClick}
                      disabled={simUser.isVerified}
                      className={`px-3.5 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        simUser.isVerified
                          ? "bg-zinc-700 text-zinc-400 cursor-not-allowed"
                          : "bg-[#248046] hover:bg-[#1a6334] text-white shadow"
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{simUser.isVerified ? "Already Verified" : "Verify & Accept Rules"}</span>
                    </button>

                    <button
                      onClick={() =>
                        setBannerNotice({
                          type: "info",
                          text: "Community rules: 1. Zero tolerance for grooming/PII requests. 2. No slurs or hate speech. 3. No phishing links.",
                        })
                      }
                      className="px-3.5 py-1.5 rounded text-xs font-semibold bg-[#4e5058] hover:bg-[#6d6f78] text-white flex items-center gap-1.5"
                    >
                      <span>📜 Server Rules</span>
                    </button>

                    <button
                      onClick={() =>
                        setBannerNotice({
                          type: "info",
                          text: "ModMail Help: On-duty staff have been notified. An anonymous support ticket will open in your DMs.",
                        })
                      }
                      className="px-3.5 py-1.5 rounded text-xs font-semibold bg-[#4e5058] hover:bg-[#6d6f78] text-white flex items-center gap-1.5"
                    >
                      <span>📩 Need Help? (ModMail)</span>
                    </button>
                  </div>

                  {/* Immediate Channel Unlock Simulated Feedback */}
                  {simUser.isVerified && (
                    <div className="mt-3 p-3 bg-emerald-950/60 border border-emerald-500/30 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        <strong>Success!</strong> User verified. <code className="text-white">#general</code>, <code className="text-white">#gaming</code>, and <code className="text-white">#study-lounge</code> channels unlocked!
                      </span>
                    </div>
                  )}

                  {simUser.isQuarantined && (
                    <div className="mt-3 p-3 bg-rose-950/60 border border-rose-500/30 rounded-lg text-rose-300 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>
                        <strong>Quarantined:</strong> Account flagged by Anti-Alt gatekeeper. Direct staff contact opened in <code className="text-white">#quarantine-help</code>.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Audit Stream Table */}
          <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm text-xs space-y-2">
            <div className="flex items-center justify-between font-bold text-zinc-900 border-b border-zinc-100 pb-2">
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-indigo-600" /> Recent Verification Audit Logs (`#mod-logs`)
              </span>
              <span className="text-[11px] text-zinc-400 font-normal">Real-time gateway stream</span>
            </div>

            <div className="space-y-1.5">
              {gatekeeperAuditLogs.slice(0, 3).map((log) => (
                <div
                  key={log.id}
                  className="p-2 rounded-lg bg-zinc-50 border border-zinc-200/80 flex items-center justify-between gap-3 text-[11px]"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        log.outcome === "VERIFIED"
                          ? "bg-emerald-100 text-emerald-800"
                          : log.outcome === "QUARANTINED"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {log.outcome}
                    </span>
                    <span className="font-semibold text-zinc-900 truncate">{log.user}</span>
                    <span className="text-zinc-400 hidden sm:inline">• {log.details}</span>
                  </div>
                  <span className="text-zinc-400 text-[10px] whitespace-nowrap">{log.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* POPUP MODAL: CAPTCHA */}
      {showCaptchaModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-zinc-900 text-white border border-zinc-700 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-indigo-400" />
                Anti-Bot Verification Challenge
              </h3>
              <button
                onClick={() => setShowCaptchaModal(false)}
                className="text-zinc-400 hover:text-zinc-200"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-300">
              Please enter the 6-character anti-bot code displayed below to prove you are human:
            </p>

            {/* Captcha Visual Box */}
            <div className="bg-zinc-950 border border-indigo-500/40 rounded-xl p-4 text-center select-none tracking-widest text-2xl font-black text-indigo-300 font-mono shadow-inner">
              {activeCaptchaCode}
            </div>

            <form onSubmit={handleCaptchaSubmit} className="space-y-3">
              <div>
                <input
                  type="text"
                  maxLength={6}
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value.toUpperCase())}
                  placeholder="Enter 6 characters"
                  autoFocus
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-center font-mono text-sm tracking-wider uppercase text-white placeholder-zinc-500 focus:outline-hidden focus:border-indigo-500"
                />
                {captchaError && (
                  <span className="text-rose-400 text-[11px] block mt-1 font-medium text-center">
                    {captchaError}
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={generateNewCaptcha}
                  className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-semibold flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>New Code</span>
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow"
                >
                  Submit Captcha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP MODAL: AI SAFETY PLEDGE */}
      {showPledgeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-zinc-900 text-white border border-zinc-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Community Safety & Conduct Pledge
              </h3>
              <button
                onClick={() => setShowPledgeModal(false)}
                className="text-zinc-400 hover:text-zinc-200"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 text-xs text-zinc-300 space-y-2">
              <p className="font-semibold text-white">Our adolescent community pledge:</p>
              <p className="italic text-zinc-400 text-[11px]">
                "I agree to respect all server members, never request or share personal private info, report unsafe behavior to staff, and keep our server safe and friendly."
              </p>
            </div>

            <form onSubmit={handlePledgeSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">
                  Type <strong className="text-white">"I agree"</strong> below to confirm:
                </label>
                <input
                  type="text"
                  value={pledgeInput}
                  onChange={(e) => setPledgeInput(e.target.value)}
                  placeholder="I agree"
                  autoFocus
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-indigo-500"
                />
                {pledgeError && (
                  <span className="text-rose-400 text-[11px] block mt-1 font-medium">
                    {pledgeError}
                  </span>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPledgeModal(false)}
                  className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow"
                >
                  Accept Pledge & Verify
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
