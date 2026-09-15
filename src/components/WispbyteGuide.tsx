import React, { useState } from "react";
import {
  Server,
  CheckSquare,
  Square,
  Key,
  Terminal,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Copy,
  Check,
  Zap,
} from "lucide-react";

export const WispbyteGuide: React.FC = () => {
  const [completedSteps, setCompletedSteps] = useState<number[]>([1]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const toggleStep = (stepNumber: number) => {
    setCompletedSteps((prev) =>
      prev.includes(stepNumber) ? prev.filter((s) => s !== stepNumber) : [...prev, stepNumber]
    );
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
              <Server className="w-5 h-5 text-indigo-600" />
              Wispbyte Hosting & 24/7 Deployment Guide
            </h2>
            <p className="text-xs text-zinc-500 mt-1">
              Complete step-by-step instructions to deploy AegisMod onto Wispbyte (Pterodactyl Node.js Hosting) with 99.9% uptime, auto-restart, and continuous Discord monitoring.
            </p>
          </div>
          <div className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 self-start sm:self-auto">
            <ShieldCheck className="w-4 h-4" />
            <span>Node.js 20+ Compatible</span>
          </div>
        </div>
      </div>

      {/* Interactive Deployment Steps */}
      <div className="space-y-4">
        {/* Step 1: Discord Developer Portal */}
        <div
          className={`bg-white rounded-2xl p-6 border transition-all ${
            completedSteps.includes(1) ? "border-indigo-200 shadow-sm" : "border-zinc-200"
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <button
                onClick={() => toggleStep(1)}
                className="mt-0.5 text-indigo-600 cursor-pointer"
              >
                {completedSteps.includes(1) ? (
                  <CheckSquare className="w-5 h-5" />
                ) : (
                  <Square className="w-5 h-5 text-zinc-400" />
                )}
              </button>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  Step 1
                </span>
                <h3 className="text-base font-bold text-zinc-900 mt-1">
                  Discord Developer Portal & Privileged Intents
                </h3>
                <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
                  To read community messages and manage roles, AegisMod requires privileged intents enabled in the Discord Developer Portal.
                </p>

                <div className="mt-3 space-y-2 text-xs text-zinc-700">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                    <span>Go to <a href="https://discord.com/developers/applications" target="_blank" rel="noreferrer" className="text-indigo-600 font-semibold underline inline-flex items-center gap-0.5">discord.com/developers/applications <ExternalLink className="w-3 h-3" /></a></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                    <span>Click <strong>New Application</strong> &rarr; name it <strong>AegisMod</strong>.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                    <span>Under the <strong>Bot</strong> tab, click <strong>Reset Token</strong> to copy your <code className="bg-zinc-100 px-1 py-0.5 rounded font-mono">DISCORD_BOT_TOKEN</code>.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                    <span className="font-semibold text-red-700">CRITICAL: Scroll to Privileged Gateway Intents and enable:</span>
                  </div>
                  <div className="pl-4 space-y-1 text-zinc-800 font-medium">
                    <div>✅ <strong>Server Members Intent</strong> (Required for role hierarchy & timeouts)</div>
                    <div>✅ <strong>Message Content Intent</strong> (Required to read chat messages for AI moderation)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Wispbyte Server Provisioning */}
        <div
          className={`bg-white rounded-2xl p-6 border transition-all ${
            completedSteps.includes(2) ? "border-indigo-200 shadow-sm" : "border-zinc-200"
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <button
                onClick={() => toggleStep(2)}
                className="mt-0.5 text-indigo-600 cursor-pointer"
              >
                {completedSteps.includes(2) ? (
                  <CheckSquare className="w-5 h-5" />
                ) : (
                  <Square className="w-5 h-5 text-zinc-400" />
                )}
              </button>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  Step 2
                </span>
                <h3 className="text-base font-bold text-zinc-900 mt-1">
                  Wispbyte Pterodactyl Server Configuration
                </h3>
                <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
                  In your Wispbyte Client Dashboard, create or open your Discord Bot server.
                </p>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                    <span className="text-[10px] font-bold uppercase text-zinc-400 block">Server Egg</span>
                    <span className="text-xs font-bold text-zinc-900 mt-0.5 block">Node.js 20 or 22</span>
                    <span className="text-[11px] text-zinc-500">Official Discord bot egg</span>
                  </div>
                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                    <span className="text-[10px] font-bold uppercase text-zinc-400 block">Recommended RAM</span>
                    <span className="text-xs font-bold text-emerald-600 mt-0.5 block">256 MB – 512 MB</span>
                    <span className="text-[11px] text-zinc-500">Very lightweight footprint</span>
                  </div>
                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                    <span className="text-[10px] font-bold uppercase text-zinc-400 block">Startup Command</span>
                    <span className="text-xs font-bold text-indigo-600 mt-0.5 block">npm start</span>
                    <span className="text-[11px] text-zinc-500">or npx tsx src/index.ts</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Uploading Files */}
        <div
          className={`bg-white rounded-2xl p-6 border transition-all ${
            completedSteps.includes(3) ? "border-indigo-200 shadow-sm" : "border-zinc-200"
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <button
                onClick={() => toggleStep(3)}
                className="mt-0.5 text-indigo-600 cursor-pointer"
              >
                {completedSteps.includes(3) ? (
                  <CheckSquare className="w-5 h-5" />
                ) : (
                  <Square className="w-5 h-5 text-zinc-400" />
                )}
              </button>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  Step 3
                </span>
                <h3 className="text-base font-bold text-zinc-900 mt-1">
                  Upload Codebase to Wispbyte
                </h3>
                <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
                  Click the <strong>Download Bot Project (.ZIP)</strong> button in the top navigation of this dashboard. Then:
                </p>

                <div className="mt-3 space-y-2 text-xs text-zinc-700">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                    <span>In Wispbyte, click the <strong>Files</strong> tab.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                    <span>Drag and drop <code className="bg-zinc-100 px-1.5 py-0.5 rounded font-mono">aegismod-discord-bot.zip</code> into the file manager.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                    <span>Right click the zip and select <strong>Unarchive</strong>.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 4: Environment Variables */}
        <div
          className={`bg-white rounded-2xl p-6 border transition-all ${
            completedSteps.includes(4) ? "border-indigo-200 shadow-sm" : "border-zinc-200"
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <button
                onClick={() => toggleStep(4)}
                className="mt-0.5 text-indigo-600 cursor-pointer"
              >
                {completedSteps.includes(4) ? (
                  <CheckSquare className="w-5 h-5" />
                ) : (
                  <Square className="w-5 h-5 text-zinc-400" />
                )}
              </button>
              <div className="flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  Step 4
                </span>
                <h3 className="text-base font-bold text-zinc-900 mt-1">
                  Configure Environment Variables (.env)
                </h3>
                <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
                  In Wispbyte, either create a <code className="bg-zinc-100 px-1 py-0.5 rounded font-mono">.env</code> file in <code className="bg-zinc-100 px-1 py-0.5 rounded font-mono">/home/container/</code> or configure variables in the <strong>Startup</strong> panel:
                </p>

                {/* Env code block */}
                <div className="mt-3 bg-zinc-950 p-4 rounded-xl text-zinc-200 font-mono text-xs relative">
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `DISCORD_BOT_TOKEN="your_discord_bot_token"\nDISCORD_CLIENT_ID="your_application_client_id"\nGEMINI_API_KEY="your_gemini_api_key"\nMODERATION_POLICY_LEVEL="STRICT_TEEN"\nNODE_ENV="production"`,
                        "env"
                      )
                    }
                    className="absolute top-3 right-3 px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === "env" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === "env" ? "Copied" : "Copy"}</span>
                  </button>
                  <pre>
{`DISCORD_BOT_TOKEN="your_discord_bot_token"
DISCORD_CLIENT_ID="your_application_client_id"
GEMINI_API_KEY="your_gemini_api_key"
MODERATION_POLICY_LEVEL="STRICT_TEEN"
NODE_ENV="production"`}
                  </pre>
                </div>
                <div className="mt-2 text-[11px] text-zinc-500">
                  <span className="font-semibold text-zinc-700">Policy Level options:</span> <code className="bg-zinc-100 px-1 py-0.5 rounded text-zinc-800 font-mono">STRICT_TEEN</code> (Recommended: zero-tolerance for predators/self-harm, allows casual gamer slang) or <code className="bg-zinc-100 px-1 py-0.5 rounded text-zinc-800 font-mono">STANDARD</code>.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 5: Start & Verify */}
        <div
          className={`bg-white rounded-2xl p-6 border transition-all ${
            completedSteps.includes(5) ? "border-indigo-200 shadow-sm" : "border-zinc-200"
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <button
                onClick={() => toggleStep(5)}
                className="mt-0.5 text-indigo-600 cursor-pointer"
              >
                {completedSteps.includes(5) ? (
                  <CheckSquare className="w-5 h-5" />
                ) : (
                  <Square className="w-5 h-5 text-zinc-400" />
                )}
              </button>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  Step 5
                </span>
                <h3 className="text-base font-bold text-zinc-900 mt-1">
                  Start Server & Run /setup in Discord
                </h3>
                <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
                  Go to the <strong>Console</strong> tab in Wispbyte and click <strong>Start</strong>. You will see:
                </p>

                <div className="mt-3 bg-[#1e1f22] p-3.5 rounded-xl border border-zinc-800 font-mono text-[11px] text-zinc-300 leading-relaxed">
                  <div className="text-zinc-500">[Pterodactyl] Starting container...</div>
                  <div className="text-zinc-500">Registering global slash commands with Discord API...</div>
                  <div className="text-emerald-400 font-semibold">
                    ✅ Successfully registered slash commands (/setup, /ban, /kick, /mute, /warn, /cases).
                  </div>
                  <div className="text-indigo-400 font-semibold">
                    🛡️ AegisMod is online! Logged in as AegisMod#1234
                  </div>
                </div>

                <div className="mt-4 p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Your bot is now live 24/7! Open Discord and type <code className="bg-white px-1.5 py-0.5 rounded font-bold font-mono">/setup</code> to select your moderator roles and provision <code className="bg-white px-1.5 py-0.5 rounded font-bold font-mono">#mod-logs</code>!
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
