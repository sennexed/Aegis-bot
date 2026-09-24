import React from "react";
import {
  ShieldAlert,
  Zap,
  Users,
  Layers,
  FileText,
  Server,
  Lock,
  ArrowRight,
  Sparkles,
  Bot,
  AlertTriangle,
  HeartHandshake,
  CheckCircle2,
} from "lucide-react";

export const PlanOverview: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Hero / Executive Summary */}
      <div className="bg-gradient-to-br from-indigo-900 via-zinc-900 to-zinc-950 text-white rounded-2xl p-6 md:p-8 shadow-xl border border-indigo-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 mb-4">
            <Sparkles className="w-3.5 h-3.5" /> High-Standard Teen Community Protection
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Hybrid Moderation Architecture Blueprint
          </h2>
          <p className="mt-3 text-zinc-300 text-sm sm:text-base leading-relaxed">
            AegisMod combines deterministic slash commands (<code className="text-indigo-300">/ban</code>, <code className="text-indigo-300">/kick</code>, <code className="text-indigo-300">/mute</code>, <code className="text-indigo-300">/warn</code>) with real-time AI live monitoring powered by <strong>Gemini 3.8 Flash</strong>. Engineered for <strong>adolescent (~16 y/o) communities</strong>, it prevents grooming, cyberbullying, doxxing, self-harm, and abusive language while conserving API tokens through a 4-tier triage filter.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-zinc-800 text-center">
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <div className="text-xl font-black text-indigo-400">80–90%</div>
              <div className="text-xs text-zinc-400 mt-0.5">Token Reduction</div>
            </div>
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <div className="text-xl font-black text-emerald-400">&lt; 350ms</div>
              <div className="text-xs text-zinc-400 mt-0.5">Gemini Flash Latency</div>
            </div>
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <div className="text-xl font-black text-amber-400">#mod-logs</div>
              <div className="text-xs text-zinc-400 mt-0.5">Auto-Created Audit</div>
            </div>
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <div className="text-xl font-black text-sky-400">Wispbyte</div>
              <div className="text-xs text-zinc-400 mt-0.5">24/7 Pterodactyl Node</div>
            </div>
          </div>
        </div>
      </div>

      {/* 1. Architecture Pipeline Diagram */}
      <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              End-to-End Message Lifecycle & Moderation Pipeline
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              How messages travel from Discord Gateway through token triage, AI analysis, and action dispatch.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
          {/* Step 1 */}
          <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-200 flex flex-col justify-between relative">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                Tier 0: Gateway
              </span>
              <h4 className="font-bold text-sm text-zinc-900 mt-2">Discord Ingress</h4>
              <p className="text-xs text-zinc-600 mt-1">
                Catches <code className="text-zinc-800">messageCreate</code> & <code className="text-zinc-800">messageUpdate</code>.
              </p>
              <ul className="text-[11px] text-zinc-500 mt-2 space-y-1 list-disc list-inside">
                <li>Bypasses bots & system messages</li>
                <li>Bypasses staff & server owner</li>
                <li>Bypasses whitelisted channels</li>
              </ul>
            </div>
            <div className="text-[11px] text-zinc-400 font-mono mt-3">Gateway Intents</div>
          </div>

          {/* Step 2 */}
          <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-200 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                Tier 1 & 2: Triage
              </span>
              <h4 className="font-bold text-sm text-zinc-900 mt-2">Local Fast Pass</h4>
              <p className="text-xs text-zinc-600 mt-1">
                Lightweight local regex & slang dictionary filters ~85% of chat.
              </p>
              <ul className="text-[11px] text-zinc-500 mt-2 space-y-1 list-disc list-inside">
                <li>Passes &quot;gg&quot;, &quot;lol&quot;, emojis in 0ms</li>
                <li>Zero-tolerance local regex flags &quot;kys&quot;</li>
                <li>10-min LRU TTL cache for duplicates</li>
              </ul>
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-3">0 API Tokens Consumed</div>
          </div>

          {/* Step 3 */}
          <div className="bg-indigo-50/60 rounded-xl p-4 border border-indigo-200 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                Tier 3: AI Engine
              </span>
              <h4 className="font-bold text-sm text-indigo-950 mt-2">Gemini 3.8 Flash</h4>
              <p className="text-xs text-indigo-900 mt-1">
                Deep semantic & contextual understanding of ambiguous teen chat.
              </p>
              <ul className="text-[11px] text-indigo-800 mt-2 space-y-1 list-disc list-inside">
                <li>Structured JSON schema response</li>
                <li>Detects bypasses & leetspeak</li>
                <li>Scores confidence & severity</li>
              </ul>
            </div>
            <div className="text-[11px] text-indigo-600 font-mono mt-3">~380-420 Tokens</div>
          </div>

          {/* Step 4 */}
          <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-200 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                Action Matrix
              </span>
              <h4 className="font-bold text-sm text-zinc-900 mt-2">Automated Dispatch</h4>
              <p className="text-xs text-zinc-600 mt-1">
                Immediate proportional reaction based on violation severity.
              </p>
              <ul className="text-[11px] text-zinc-500 mt-2 space-y-1 list-disc list-inside">
                <li>Low: DM Warning</li>
                <li>Medium: Auto-Delete message</li>
                <li>High: 1h-24h Native Timeout</li>
                <li>Critical: Immediate Ban & ping</li>
              </ul>
            </div>
            <div className="text-[11px] text-zinc-400 font-mono mt-3">Discord REST API</div>
          </div>

          {/* Step 5 */}
          <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-200 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                Audit Trail
              </span>
              <h4 className="font-bold text-sm text-zinc-900 mt-2">#mod-logs Channel</h4>
              <p className="text-xs text-zinc-600 mt-1">
                Automated rich Embed dispatch with complete transparency.
              </p>
              <ul className="text-[11px] text-zinc-500 mt-2 space-y-1 list-disc list-inside">
                <li>Locked to staff roles only</li>
                <li>Full content, reason, confidence</li>
                <li>Deletions & message edits</li>
              </ul>
            </div>
            <div className="text-[11px] text-purple-600 font-semibold mt-3">Staff Transparency</div>
          </div>
        </div>
      </div>

      {/* 2. Teen Safety Standards (Age ~16) */}
      <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <HeartHandshake className="w-5 h-5 text-rose-600" />
          <h3 className="text-lg font-bold text-zinc-900">
            Strict Teen Safety Policies (Age ~16 Focus)
          </h3>
        </div>
        <p className="text-xs text-zinc-500 mb-5">
          Teenage online spaces are vulnerable to cyberbullying, predatory grooming, doxxing, and self-harm incitement. The policy rubric is tuned to catch covert harm while permitting harmless teen slang.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-red-200 bg-red-50/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-red-700 uppercase tracking-wide">Predatory & Grooming</span>
              <span className="text-[10px] px-2 py-0.5 bg-red-100 text-red-800 font-bold rounded-full">CRITICAL</span>
            </div>
            <p className="text-xs text-zinc-700 mt-2 leading-relaxed">
              Adult-to-minor sexual solicitation, asking for private photos, demanding Snapchat handles, secret DMs, or covert real-life meetups.
            </p>
            <div className="mt-3 text-[11px] font-semibold text-red-900">
              Action: Auto-Delete + Instant Ban + Urgent Staff Ping
            </div>
          </div>

          <div className="p-4 rounded-xl border border-red-200 bg-red-50/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-red-700 uppercase tracking-wide">Self-Harm & Suicide</span>
              <span className="text-[10px] px-2 py-0.5 bg-red-100 text-red-800 font-bold rounded-full">CRITICAL</span>
            </div>
            <p className="text-xs text-zinc-700 mt-2 leading-relaxed">
              Encouraging suicide (&quot;kys&quot;, &quot;kill yourself&quot;), glorifying self-harm, or pushing peers into depression/harm ideation.
            </p>
            <div className="mt-3 text-[11px] font-semibold text-red-900">
              Action: Auto-Delete + 24h Timeout + Crisis Help Resources
            </div>
          </div>

          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">Doxxing & Privacy</span>
              <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-800 font-bold rounded-full">HIGH</span>
            </div>
            <p className="text-xs text-zinc-700 mt-2 leading-relaxed">
              Sharing a minor&apos;s real full name, home town, high school, family details, phone number, or private social media credentials.
            </p>
            <div className="mt-3 text-[11px] font-semibold text-amber-900">
              Action: Auto-Delete + 24h Timeout + Moderator Review
            </div>
          </div>

          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">Hate Speech</span>
              <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-800 font-bold rounded-full">HIGH</span>
            </div>
            <p className="text-xs text-zinc-700 mt-2 leading-relaxed">
              Dehumanizing attacks, slurs, racial/religious slurs, or homophobic/transphobic harassment targeting youth.
            </p>
            <div className="mt-3 text-[11px] font-semibold text-amber-900">
              Action: Auto-Delete + 1h Timeout + Strike Logged
            </div>
          </div>

          <div className="p-4 rounded-xl border border-yellow-200 bg-yellow-50/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-yellow-800 uppercase tracking-wide">Cyberbullying</span>
              <span className="text-[10px] px-2 py-0.5 bg-yellow-100 text-yellow-900 font-bold rounded-full">MEDIUM</span>
            </div>
            <p className="text-xs text-zinc-700 mt-2 leading-relaxed">
              Targeted degradation, group pile-ons, persistent vicious mockery, or telling members they are worthless.
            </p>
            <div className="mt-3 text-[11px] font-semibold text-yellow-900">
              Action: Auto-Delete + DM Warning + Strike Case Recorded
            </div>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-800 uppercase tracking-wide">Profanity & Local Speech</span>
              <span className="text-[10px] px-2 py-0.5 bg-zinc-200 text-zinc-800 font-bold rounded-full">MULTILINGUAL</span>
            </div>
            <p className="text-xs text-zinc-700 mt-2 leading-relaxed">
              Severe vulgarity across languages including Hindi/Hinglish (madarchod, bhenchod, bsdk), Russian Mat (cyka, blyat, nahuy, сука, блять), Arabic/Arabizi (kos omk, kuss ummak, sharmoota), Spanish, spaced-out evasion, and leetspeak bypasses.
            </p>
            <div className="mt-3 text-[11px] font-semibold text-zinc-900">
              Action: Message Deletion / Cooldown Warning (Zero-token Tier-1)
            </div>
          </div>
        </div>
      </div>

      {/* 3. Modular Service Breakdown */}
      <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm">
        <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2 mb-2">
          <Server className="w-5 h-5 text-indigo-600" />
          Modular Architecture & Separation of Concerns
        </h3>
        <p className="text-xs text-zinc-500 mb-5">
          Each service has a single responsibility, enabling clean testing, isolation, and easy hosting on Wispbyte without monolithic spaghetti code.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50">
            <div className="font-mono text-xs font-bold text-indigo-600">RoleService</div>
            <h4 className="font-bold text-sm text-zinc-900 mt-1">Role Hierarchy & Onboarding</h4>
            <p className="text-xs text-zinc-600 mt-1">
              Implements Discord native <code className="text-zinc-800">RoleSelectMenuBuilder</code> for selecting Owner, Admin, and Mod roles. Enforces role hierarchy checks so mods cannot mute admins or the owner.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50">
            <div className="font-mono text-xs font-bold text-indigo-600">LoggingService</div>
            <h4 className="font-bold text-sm text-zinc-900 mt-1">Dedicated #mod-logs Channel</h4>
            <p className="text-xs text-zinc-600 mt-1">
              Automatically creates or binds the <code className="text-zinc-800">#mod-logs</code> channel with locked permissions (<code className="text-zinc-800">@everyone: deny ViewChannel</code>) and formats color-coded embeds for deletes, edits, AI flags, and mod actions.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50">
            <div className="font-mono text-xs font-bold text-indigo-600">GeminiModerationService</div>
            <h4 className="font-bold text-sm text-zinc-900 mt-1">Gemini 3.8 Flash AI Engine</h4>
            <p className="text-xs text-zinc-600 mt-1">
              Uses the modern <code className="text-zinc-800">@google/genai</code> SDK with strictly defined JSON schemas (<code className="text-zinc-800">Type.OBJECT</code>) to provide deterministic, machine-readable decisions in &lt;350ms.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50">
            <div className="font-mono text-xs font-bold text-indigo-600">TriageService</div>
            <h4 className="font-bold text-sm text-zinc-900 mt-1">Multi-Tier Token Optimizer</h4>
            <p className="text-xs text-zinc-600 mt-1">
              Whitelists gamer slang, checks message length, intercepts zero-tolerance regexes, and maintains a 10-minute in-memory LRU cache to slash Gemini API costs by 80–90%.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50">
            <div className="font-mono text-xs font-bold text-indigo-600">AutoModService</div>
            <h4 className="font-bold text-sm text-zinc-900 mt-1">Standard AutoMod & Discord Native Sync</h4>
            <p className="text-xs text-zinc-600 mt-1">
              Zero-latency local filters for invite links, phishing domains, mass mentions, rapid floods, excessive caps, and zalgo text. Includes <code className="text-zinc-800">/automod</code> toggles and native Discord server-side rule provisioning.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50">
            <div className="font-mono text-xs font-bold text-indigo-600">TraditionalModService & Diagnostics</div>
            <h4 className="font-bold text-sm text-zinc-900 mt-1">Manual Commands & Pipeline Simulation</h4>
            <p className="text-xs text-zinc-600 mt-1">
              Executes slash commands (<code className="text-zinc-800">/ban</code>, <code className="text-zinc-800">/kick</code>, <code className="text-zinc-800">/mute</code>, <code className="text-zinc-800">/warn</code>, <code className="text-zinc-800">/cases</code>) plus <code className="text-zinc-800">/testmod</code> for safe simulation of the entire AI & AutoMod pipeline without taking destructive action.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50">
            <div className="font-mono text-xs font-bold text-indigo-600">DutyService & ModMailService</div>
            <h4 className="font-bold text-sm text-zinc-900 mt-1">Staff Shifts & Incident Response</h4>
            <p className="text-xs text-zinc-600 mt-1">
              Tracks staff on-duty shifts via <code className="text-zinc-800">/duty on/off/list</code>, powers anonymous DM ticketing via <code className="text-zinc-800">/modmail</code>, and directs community <code className="text-zinc-800">/report</code> alerts to active moderators.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50">
            <div className="font-mono text-xs font-bold text-indigo-600">LoaService</div>
            <h4 className="font-bold text-sm text-zinc-900 mt-1">Leave of Absence (LOA) & Burnout Protection</h4>
            <p className="text-xs text-zinc-600 mt-1">
              Manages staff leave requests via <code className="text-zinc-800">/loa request/approve/deny/end</code>, preserves staff permissions while on leave, and automatically excludes away staff from emergency pings and duty quotas.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50">
            <div className="font-mono text-xs font-bold text-indigo-600">Event Handlers</div>
            <h4 className="font-bold text-sm text-zinc-900 mt-1">Asynchronous Event Loop</h4>
            <p className="text-xs text-zinc-600 mt-1">
              Separate listeners for <code className="text-zinc-800">messageCreate</code>, <code className="text-zinc-800">messageUpdate</code> (anti-edit bypass), and <code className="text-zinc-800">messageDelete</code>, wrapped in try-catch error barriers so the bot never crashes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
